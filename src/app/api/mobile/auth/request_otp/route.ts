import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "~/server/db";
import { passwordResetTokens } from "~/server/db/schema";
import { customAlphabet } from "nanoid";
import nodemailer from "nodemailer";
import { env } from "~/env";

const RequestOtpSchema = z.object({
  email: z.string().email("Invalid email format."),
});

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as unknown;
    const validationResult = RequestOtpSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: validationResult.error.errors,
        },
        { status: 400 },
      );
    }

    const { email } = validationResult.data;

    const user = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.email, email),
    });

    if (!user?.isVerified) {
      return NextResponse.json(
        {
          error: "User not found or not verified.",
        },
        { status: 404 },
      );
    }

    const token = customAlphabet("0123456789", 6)();

    const otps = await db
      .insert(passwordResetTokens)
      .values({
        userId: user.id,
        tokenCode: token,
      })
      .returning();

    if (!otps) {
      return NextResponse.json(
        {
          error: "Error while generating OTP. Please try again.",
        },
        { status: 500 },
      );
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.google.com",
      port: 465,
      service: "gmail",
      auth: {
        user: env.EMAIL_ADDRESS,
        pass: env.EMAIL_PASS,
      },
    });

    try {
      await transporter.verify();
      console.log("Google Email Service is ready to take our messages");
    } catch (err) {
      console.error("Could Not Connect To Google Email Service", err);
      return NextResponse.json(
        {
          error: "Email service unavailable. Please try again later.",
        },
        { status: 500 },
      );
    }

    try {
      const info = await transporter.sendMail({
        from: `"IEEE SUSTech SB" ${env.EMAIL_ADDRESS}`,
        to: email,
        subject: "One-Time Passcode to reset your password",
        text: "Your OTP is as follows: " + token,
        html: `Your OTP is as follows: <b>${token}</b>`,
      });

      console.log("Message sent: %s", info.messageId);

      return NextResponse.json(
        {
          message: "OTP sent successfully. Check your email.",
        },
        { status: 200 },
      );
    } catch (err) {
      console.error("Error while sending mail:", err);
      return NextResponse.json(
        {
          error: "Failed to send email. Please try again.",
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Mobile request OTP API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again later." },
      { status: 500 },
    );
  }
}
