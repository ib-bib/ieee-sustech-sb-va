import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "~/server/db";
import { notifications } from "~/server/db/schema";
import { authenticateMobileRequest } from "~/server/api/middleware/mobile_auth";
import { eq, and } from "drizzle-orm";

const UpdateNotificationSchema = z.object({
  action: z.enum(["read", "clear", "unarchive"]),
});

// PUT: Update notification status (read, clear, unarchive)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
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

    const notificationId = parseInt(id);
    if (isNaN(notificationId)) {
      return NextResponse.json({ error: "Invalid notification ID" }, { status: 400 });
    }

    const body = (await req.json()) as unknown;
    const validationResult = UpdateNotificationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: validationResult.error.errors,
        },
        { status: 400 },
      );
    }

    const { action } = validationResult.data;

    let updateData = {};
    if (action === "read") {
      updateData = { isRead: true };
    } else if (action === "clear") {
      updateData = { isCleared: true };
    } else if (action === "unarchive") {
      updateData = { isCleared: false };
    }

    await db
      .update(notifications)
      .set(updateData)
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, authUser.id)
        )
      );

    return NextResponse.json(
      { message: `Notification marked as ${action}` },
      { status: 200 },
    );
  } catch (error) {
    console.error("Mobile update notification API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

// DELETE: Delete a notification permanently
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
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

    const notificationId = parseInt(id);
    if (isNaN(notificationId)) {
      return NextResponse.json({ error: "Invalid notification ID" }, { status: 400 });
    }

    await db
      .delete(notifications)
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, authUser.id)
        )
      );

    return NextResponse.json(
      { message: "Notification deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Mobile delete notification API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
