import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { z } from "zod";
import { db } from "~/server/db";
import { env } from "~/env";
import { authenticateMobileRequest } from "~/server/api/middleware/mobile_auth";
import { users } from "~/server/db/schema";
import { eq } from "drizzle-orm";

const UpdatePasswordScheme = z.object({
  oldPassword: z.string(),
  newPassword: z.string(),
});

export async function POST(req: NextRequest) {
  const { user: authenticatedUser, response } =
    await authenticateMobileRequest(req); // naming authenticatedUser to avoid confusions down in the code

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
    const validationResult = UpdatePasswordScheme.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request body" + validationResult.error.errors,
          value: null,
        },
        { status: 400 },
      );
    }

    const userRecord = await db.query.users.findFirst({
      where: (t, { eq }) => eq(t.id, authenticatedUser.id),
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

    const userPasswordFromDB = userRecord.password;

    const { oldPassword, newPassword } = validationResult.data;

    const isOldPasswordCorrect = await bcrypt.compare(
      oldPassword,
      userPasswordFromDB,
    );

    if (!isOldPasswordCorrect) {
      return NextResponse.json(
        {
          error: "Incorrect current password.",
          value: null,
        },
        {
          status: 400,
        },
      );
    }

    const newPassIsSameAsOld = await bcrypt.compare(
      newPassword,
      userPasswordFromDB,
    );

    if (newPassIsSameAsOld) {
      return NextResponse.json(
        {
          error: "New password cannot be the same as the previous one.",
          value: null,
        },
        {
          status: 400,
        },
      );
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    const updatedUser = await db
      .update(users)
      .set({
        password: hashedNewPassword,
      })
      .where(eq(users.id, authenticatedUser.id))
      .returning({
        name: users.name,
      });

    if (!updatedUser[0]) {
      return NextResponse.json(
        {
          error:
            "Unknown server error. Could not update password. Please try again",
          value: null,
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        error: null,
        value: updatedUser,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Mobile update password API error: ", error);
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
