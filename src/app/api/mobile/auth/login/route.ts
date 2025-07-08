import { type NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { z } from "zod";
import { db } from "~/server/db";
import { env } from "~/env";

const LoginSchema = z.object({
  email: z.string().email("Invalid email format."),
  password: z.string().min(6, "Password must be at least 6 characters long."),
});

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as unknown;
    const validationResult = LoginSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: validationResult.error.errors,
        },
        { status: 400 },
      );
    }

    const { email, password } = validationResult.data;

    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, email),
    });

    if (!user?.password) {
      return NextResponse.json(
        { error: "Invalid credentials." },
        { status: 401 },
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid credentials." },
        { status: 401 },
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
        message: "Login successful",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Mobile login API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}
