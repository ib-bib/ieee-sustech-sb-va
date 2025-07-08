import { NextResponse, type NextRequest } from "next/server";
import { authenticateMobileRequest } from "~/server/api/middleware/mobile_auth";

export async function GET(req: NextRequest) {
  const { user, response } = await authenticateMobileRequest(req);

  if (response) {
    return response; // unauthorized
  }

  // If we reached here, the user is authenticated.

  return NextResponse.json({
    message: `Hello ${user?.name || user?.email}! This is protected data for mobile.`,
    userId: user?.id,
    timestamp: new Date().toISOString(),
  });
}
