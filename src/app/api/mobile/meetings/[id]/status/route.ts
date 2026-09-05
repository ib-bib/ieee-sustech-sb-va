import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "~/server/db";
import { meetings } from "~/server/db/schema";
import { authenticateMobileRequest } from "~/server/api/middleware/mobile_auth";
import { eq } from "drizzle-orm";

const UpdateMeetingStatusSchema = z.object({
  status: z.enum(["scheduled", "started", "ended", "cancelled", "delayed"]),
});

// PUT: Update a meeting's status (HR only)
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

    // Check if user is HR
    const userRole = await db.query.roles.findFirst({
      where: (r, { eq }) => eq(r.id, authUser.roleId),
    });

    if (userRole?.name !== "HR") {
      return NextResponse.json(
        { error: "Only HR members can update meeting status" },
        { status: 403 },
      );
    }

    // Get the meeting
    const meetingId = parseInt(id);
    if (isNaN(meetingId)) {
      return NextResponse.json({ error: "Invalid meeting ID" }, { status: 400 });
    }

    const meeting = await db.query.meetings.findFirst({
      where: (m, { eq }) => eq(m.id, meetingId),
    });

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const body = (await req.json()) as unknown;
    const validationResult = UpdateMeetingStatusSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: validationResult.error.errors,
        },
        { status: 400 },
      );
    }

    const { status } = validationResult.data;

    const updateData: Record<string, unknown> = { status };
    if (status === "ended") {
      updateData.endedAt = new Date();
    }

    await db
      .update(meetings)
      .set(updateData)
      .where(eq(meetings.id, meetingId));

    return NextResponse.json(
      { message: "Meeting status updated" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Mobile update meeting status API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
