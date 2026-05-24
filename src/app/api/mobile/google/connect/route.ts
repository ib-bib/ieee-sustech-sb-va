import { type NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { env } from "~/env";
import { db } from "~/server/db";
import { accounts } from "~/server/db/schema";
import { authenticateMobileRequest } from "~/server/api/middleware/mobile_auth";
import { and, eq } from "drizzle-orm";

const baseUrl =
  env.NODE_ENV === "production"
    ? "https://ieee-sustech-sb-va.vercel.app"
    : "http://localhost:3000";

// GET: Get Google OAuth URL
export async function GET(req: NextRequest) {
  try {
    const { user, response } = await authenticateMobileRequest(req);

    if (!user || response) {
      return (
        response ??
        NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      );
    }

    const oauth2Client = new google.auth.OAuth2(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
      `${baseUrl}/api/google/callback`,
    );

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/meetings.space.readonly",
      ],
    });

    return NextResponse.json(
      {
        message: "Authorization URL generated",
        authUrl,
        redirectUri: `${baseUrl}/api/google/callback`,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Mobile get Google auth URL error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

// POST: Exchange auth code for tokens and store credentials
export async function POST(req: NextRequest) {
  try {
    const { user, response } = await authenticateMobileRequest(req);

    if (!user || response) {
      return (
        response ??
        NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      );
    }

    const body = (await req.json()) as unknown;

    if (
      !body ||
      typeof body !== "object" ||
      !("code" in body) ||
      typeof body.code !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid request body: 'code' is required" },
        { status: 400 },
      );
    }

    const authCode = body.code;

    // Get the authenticated user
    const authUser = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.email, user.email),
    });

    if (!authUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const oauth2Client = new google.auth.OAuth2(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
      `${baseUrl}/api/google/callback`,
    );

    // Exchange auth code for tokens
    const { tokens } = await oauth2Client.getToken(authCode);
    oauth2Client.setCredentials(tokens);

    // Get user info to verify
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    const providerAccountId = userInfo.data.id;

    if (!providerAccountId) {
      return NextResponse.json(
        { error: "Could not retrieve Google User ID" },
        { status: 500 },
      );
    }

    // Check if account already exists
    const existing = await db.query.accounts.findFirst({
      where: and(
        eq(accounts.provider, "google"),
        eq(accounts.providerAccountId, providerAccountId),
      ),
    });

    if (existing) {
      // Update existing account tokens
      await db
        .update(accounts)
        .set({
          access_token: tokens.access_token ?? null,
          refresh_token: tokens.refresh_token ?? existing.refresh_token,
          expires_at: tokens.expiry_date
            ? Math.floor(tokens.expiry_date / 1000)
            : null,
          userId: authUser.id,
        })
        .where(
          and(
            eq(accounts.provider, "google"),
            eq(accounts.providerAccountId, providerAccountId),
          ),
        );
    } else {
      // Create new linked account
      await db.insert(accounts).values({
        userId: authUser.id,
        type: "oauth",
        provider: "google",
        providerAccountId: providerAccountId,
        access_token: tokens.access_token ?? null,
        refresh_token: tokens.refresh_token ?? null,
        expires_at: tokens.expiry_date
          ? Math.floor(tokens.expiry_date / 1000)
          : null,
        token_type: tokens.token_type ?? null,
        scope: tokens.scope ?? null,
        id_token: tokens.id_token ?? null,
      });
    }

    return NextResponse.json(
      {
        message: "Google account connected successfully",
        googleEmail: userInfo.data.email,
        googleName: userInfo.data.name,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Mobile Google auth code exchange error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

// DELETE: Disconnect Google account
export async function DELETE(req: NextRequest) {
  try {
    const { user, response } = await authenticateMobileRequest(req);

    if (!user || response) {
      return (
        response ??
        NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      );
    }

    // Get the authenticated user
    const authUser = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.email, user.email),
    });

    if (!authUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Remove Google account
    const result = await db.query.accounts.findFirst({
      where: and(
        eq(accounts.userId, authUser.id),
        eq(accounts.provider, "google"),
      ),
    });

    if (!result) {
      return NextResponse.json(
        { error: "Google account not connected" },
        { status: 404 },
      );
    }

    // Note: In Drizzle, we cannot delete directly, but we can update to null
    // For this case, we'll just return that we found it
    // In a real scenario, you'd implement proper deletion
    await db
      .delete(accounts)
      .where(
        and(eq(accounts.userId, authUser.id), eq(accounts.provider, "google")),
      );

    return NextResponse.json(
      { message: "Google account disconnected successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Mobile disconnect Google error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
