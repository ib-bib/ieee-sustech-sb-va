import { type NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { db } from "~/server/db";
import { env } from "~/env";

interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string | null;
}

export async function authenticateMobileRequest(req: NextRequest): Promise<{
  user: AuthenticatedUser | null;
  response: NextResponse | null;
}> {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return {
      user: null,
      response: NextResponse.json(
        { error: "Unauthorized: No token provided." },
        { status: 401 },
      ),
    };
  }

  const token = authHeader.split(" ")[1];

  if (!token)
    return {
      user: null,
      response: NextResponse.json(
        { error: "Could not retrieve a token" },
        { status: 401 },
      ),
    };

  if (!env.JWT_SECRET) {
    console.error("JWT_SECRET is not set in environment variables (t3-env).");
    return {
      user: null,
      response: NextResponse.json(
        { error: "Server configuration error: JWT secret missing." },
        { status: 500 },
      ),
    };
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthenticatedUser;

    if (
      !decoded ||
      typeof decoded !== "object" ||
      !("id" in decoded) ||
      typeof decoded.id !== "string"
    ) {
      console.error("JWT payload missing 'id' or malformed:", decoded);
      return {
        user: null,
        response: NextResponse.json(
          { error: "Unauthorized: Invalid token payload." },
          { status: 401 },
        ),
      };
    }

    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, decoded.id),
    });

    if (!user) {
      return {
        user: null,
        response: NextResponse.json(
          { error: "Unauthorized: User not found." },
          { status: 401 },
        ),
      };
    }

    return { user: user as AuthenticatedUser, response: null };
  } catch (error) {
    console.error("JWT verification failed:", error);
    return {
      user: null,
      response: NextResponse.json(
        { error: "Unauthorized: Invalid token." },
        { status: 401 },
      ),
    };
  }
}
