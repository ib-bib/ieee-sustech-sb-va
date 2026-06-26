import { env } from "~/env";
import { NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { google } from "googleapis";
import { db } from "~/server/db";
import { accounts } from "~/server/db/schema";
import { and, eq } from "drizzle-orm";
import { syncUserAttendanceRecords } from "~/server/services/attendance";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code) {
    return NextResponse.json(
      { error: "Missing authorization code" },
      { status: 400 },
    );
  }

  const baseUrl =
    env.NODE_ENV === "production"
      ? "https://ieee-sustech-sb-va.vercel.app"
      : "http://localhost:3000";

  if (state === "web") {
    // Handle web callback
    const session = await auth();
    if (!session?.user) {
      return NextResponse.redirect(`${baseUrl}/login`);
    }

    try {
      const oauth2Client = new google.auth.OAuth2(
        env.GOOGLE_CLIENT_ID,
        env.GOOGLE_CLIENT_SECRET,
        `${baseUrl}/api/google/callback`
      );

      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
      const userInfo = await oauth2.userinfo.get();
      const providerAccountId = userInfo.data.id;

      if (!providerAccountId) {
        throw new Error("No providerAccountId");
      }

      // Check if account already exists
      const existing = await db.query.accounts.findFirst({
        where: and(
          eq(accounts.provider, "google"),
          eq(accounts.providerAccountId, providerAccountId),
        ),
      });

      if (existing) {
        await db
          .update(accounts)
          .set({
            access_token: tokens.access_token ?? null,
            refresh_token: tokens.refresh_token ?? existing.refresh_token,
            expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : null,
            userId: session.user.id,
          })
          .where(
            and(
              eq(accounts.provider, "google"),
              eq(accounts.providerAccountId, providerAccountId),
            ),
          );
      } else {
        await db.insert(accounts).values({
          userId: session.user.id,
          type: "oauth",
          provider: "google",
          providerAccountId: providerAccountId,
          access_token: tokens.access_token ?? null,
          refresh_token: tokens.refresh_token ?? null,
          expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : null,
          token_type: tokens.token_type ?? null,
          scope: tokens.scope ?? null,
          id_token: tokens.id_token ?? null,
        });
      }

      await syncUserAttendanceRecords(session.user.id, providerAccountId, userInfo.data.email);

      return NextResponse.redirect(`${baseUrl}/hr/meetings`);
    } catch (error) {
      console.error("Web Google auth code exchange error:", error);
      return NextResponse.redirect(`${baseUrl}/hr/meetings?error=GoogleAuthFailed`);
    }
  }

  return NextResponse.json(
    {
      message: "Authorization code received successfully",
      code: code,
      postUrl: `${baseUrl}/api/mobile/google/connect`,
      state: state,
      instructions:
        "Use the code in a POST request to the provided URL with your mobile auth token to complete the Google account connection",
    },
    { status: 200 },
  );
}
