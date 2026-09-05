import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { authenticateMobileRequest } from "~/server/api/middleware/mobile_auth";

// GET: Retrieve notifications for the authenticated user
export async function GET(req: NextRequest) {
  try {
    const { user, response } = await authenticateMobileRequest(req);

    if (!user || response) {
      return (
        response ??
        NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      );
    }

    // Get the authenticated user's full details
    const authUser = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.email, user.email),
    });

    if (!authUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const archivedParam = searchParams.get("archived");
    const isCleared = archivedParam === "true";

    const notifs = await db.query.notifications.findMany({
      where: (n, { eq, and }) =>
        and(eq(n.isCleared, isCleared), eq(n.userId, authUser.id)),
      orderBy: (n, { desc }) => [desc(n.createdAt)],
    });

    return NextResponse.json(notifs, { status: 200 });
  } catch (error) {
    console.error("Mobile get notifications API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
