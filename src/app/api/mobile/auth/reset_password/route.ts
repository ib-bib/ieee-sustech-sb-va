import { type NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "~/server/db";
import { authenticateMobileRequest } from "~/server/api/middleware/mobile_auth";
import { users } from "~/server/db/schema";
import { eq } from "drizzle-orm";

const ResetPasswordScheme = z.object({
  newPassword: z
    .string()
    .min(6, "Password must be at least 6 characters long."),
});

export async function POST(req: NextRequest) {
  const { user: authenticatedUser, response } =
    await authenticateMobileRequest(req);

  if (response) {
    return response; // unauthorized
  }

  if (!authenticatedUser) {
    return NextResponse.json(
      {
        value: null,
        error: "Server error. Please try again",
      },
      { status: 500 },
    );
  }

  try {
    const body = (await req.json()) as unknown;
    const validationResult = ResetPasswordScheme.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: validationResult.error.errors,
          value: null,
        },
        { status: 400 },
      );
    }

    const userRecord = await db.query.users.findFirst({
      where: (t, { eq }) => eq(t.email, authenticatedUser.email),
    });

    if (!userRecord) {
      return NextResponse.json(
        {
          error: "Unknown server error. Please try again later.",
          value: null,
        },
        { status: 500 },
      );
    }

    const { newPassword } = validationResult.data;

    // For password reset, we don't check if new password is same as old
    // since user might not remember their old password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    const updatedUser = await db
      .update(users)
      .set({
        password: hashedNewPassword,
      })
      .where(eq(users.email, authenticatedUser.email))
      .returning({
        name: users.name,
      });

    if (!updatedUser[0]) {
      return NextResponse.json(
        {
          error:
            "Unknown server error. Could not reset password. Please try again",
          value: null,
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        error: null,
        value: updatedUser,
        message: "Password reset successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Mobile reset password API error: ", error);
    return NextResponse.json(
      {
        error: "An unexpected error occurred. Please try again later.",
        value: null,
      },
      {
        status: 500,
      },
    );
  }
}
