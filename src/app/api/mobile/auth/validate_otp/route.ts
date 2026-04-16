import { type NextRequest, NextResponse } from "next/server";
import * as jwt from "jsonwebtoken";
import { z } from "zod";
import { db } from "~/server/db";
import { env } from "~/env";
import { passwordResetTokens } from "~/server/db/schema";
import { eq } from "drizzle-orm";

const ValidateOtpSchema = z.object({
  email: z.string().email("Invalid email format."),
  otp: z.string().min(6, "OTP must be 6 digits."),
});

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as unknown;
    const validationResult = ValidateOtpSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: validationResult.error.errors,
        },
        { status: 400 },
      );
    }

    const { email, otp } = validationResult.data;

    const user = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.email, email),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const now = new Date();

    const validToken = await db.query.passwordResetTokens.findMany({
      where: (t, { eq, and, gt }) =>
        and(eq(t.tokenCode, otp), eq(t.userId, user.id), gt(t.expiresAt, now)),
      orderBy: (t, { desc }) => desc(t.createdAt),
      limit: 1,
    });

    if (!validToken[0]) {
      return NextResponse.json(
        { error: "Invalid or expired OTP." },
        { status: 401 },
      );
    }

    // Mark the token as used by setting expiresAt to now
    const updatedToken = await db
      .update(passwordResetTokens)
      .set({
        expiresAt: now,
      })
      .where(eq(passwordResetTokens.id, validToken[0].id))
      .returning();

    if (!updatedToken) {
      return NextResponse.json(
        { error: "Server error. Please try again." },
        { status: 500 },
      );
    }

    const secret = env.JWT_SECRET as string | undefined;

    if (!secret) {
      console.error("JWT_SECRET is not set in environment variables.");
      return NextResponse.json(
        { error: "Server configuration error: JWT secret missing." },
        { status: 500 },
      );
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
    };

    const token = jwt.sign(tokenPayload, secret, {
      expiresIn: "15d",
    });

    return NextResponse.json(
      {
        message: "OTP validated and login successful",
        token,
        user: {
          name: user.name,
          email: user.email,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Mobile validate OTP API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again later." },
      { status: 500 },
    );
  }
}
