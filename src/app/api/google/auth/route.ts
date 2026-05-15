import { google } from "googleapis";
import { env } from "~/env";
import { auth } from "~/server/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
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

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/meetings.space.readonly",
    ],
  });

  return NextResponse.redirect(url);
}
