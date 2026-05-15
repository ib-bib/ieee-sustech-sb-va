import { google } from "googleapis";
import { env } from "~/env";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { accounts } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return new NextResponse("Missing code", { status: 400 });
  }

  const baseUrl =
    env.NODE_ENV === "production"
      ? "https://ieee-sustech-sb-va.vercel.app"
      : "http://localhost:3000";

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
    return new NextResponse("Could not retrieve Google User ID", { status: 500 });
  }

  // Check if account already exists
  const existing = await db.query.accounts.findFirst({
    where: and(
      eq(accounts.provider, "google"),
      eq(accounts.providerAccountId, providerAccountId)
    ),
  });

  if (existing) {
    // Update existing account tokens and re-link to current user if necessary
    await db
      .update(accounts)
      .set({
        access_token: tokens.access_token ?? null,
        refresh_token: tokens.refresh_token ?? existing.refresh_token,
        expires_at: tokens.expiry_date
          ? Math.floor(tokens.expiry_date / 1000)
          : null,
        userId: session.user.id,
      })
      .where(
        and(
          eq(accounts.provider, "google"),
          eq(accounts.providerAccountId, providerAccountId)
        )
      );
  } else {
    // Create new linked account
    await db.insert(accounts).values({
      userId: session.user.id,
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

  // Redirect back to dashboard or a success page
  return NextResponse.redirect(`${baseUrl}/`); // Ideally redirect back to wherever they initiated the connection
}
