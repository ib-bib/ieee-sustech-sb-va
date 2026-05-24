import { env } from "~/env";
import { NextResponse } from "next/server";

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
