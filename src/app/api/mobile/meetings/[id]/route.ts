import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "~/server/db";
import { meetings } from "~/server/db/schema";
import { authenticateMobileRequest } from "~/server/api/middleware/mobile_auth";
import { eq } from "drizzle-orm";

const UpdateMeetingSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  startTime: z.string().datetime("Invalid date format").optional(),
  status: z
    .enum(["scheduled", "started", "ended", "cancelled", "delayed"])
    .optional(),
});

// GET: Retrieve a specific meeting by ID (HR only)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { user, response } = await authenticateMobileRequest(req);

    if (!user || response) {
      return (
        response ||
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
        { error: "Only HR members can access this endpoint" },
        { status: 403 },
      );
    }

    // Get the meeting
    const meeting = await db.query.meetings.findFirst({
      where: (m, { eq }) => eq(m.id, parseInt(id)),
    });

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    // Get participants count
    const participants = await db.query.meetingParticipations.findMany({
      where: (mp, { eq }) => eq(mp.meetingId, parseInt(id)),
    });

    return NextResponse.json(
      {
        id: meeting.id,
        title: meeting.title,
        description: meeting.description,
        meetingCode: meeting.meetingCode,
        startTime: meeting.startTime,
        endedAt: meeting.endedAt,
        status: meeting.status,
        createdAt: meeting.createdAt,
        participantCount: participants.length,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Mobile get meeting API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

// PUT: Update a meeting (HR only)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { user, response } = await authenticateMobileRequest(req);

    if (!user || response) {
      return (
        response ||
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
        { error: "Only HR members can update meetings" },
        { status: 403 },
      );
    }

    // Get the meeting
    const meeting = await db.query.meetings.findFirst({
      where: (m, { eq }) => eq(m.id, parseInt(id)),
    });

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const body = (await req.json()) as unknown;
    const validationResult = UpdateMeetingSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: validationResult.error.errors,
        },
        { status: 400 },
      );
    }

    const { title, description, startTime, status } = validationResult.data;

    // Update meeting
    const updateData: Record<string, unknown> = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (startTime) updateData.startTime = new Date(startTime);
    if (status) {
      updateData.status = status;
      if (status === "ended") {
        updateData.endedAt = new Date();
      }
    }

    await db
      .update(meetings)
      .set(updateData)
      .where(eq(meetings.id, parseInt(id)));

    return NextResponse.json(
      { message: "Meeting updated successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Mobile update meeting API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

// DELETE: Delete a meeting (HR only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { user, response } = await authenticateMobileRequest(req);

    if (!user || response) {
      return (
        response ||
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
        { error: "Only HR members can delete meetings" },
        { status: 403 },
      );
    }

    // Get the meeting
    const meeting = await db.query.meetings.findFirst({
      where: (m, { eq }) => eq(m.id, parseInt(id)),
    });

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    // Delete associated participations first
    // Note: You may want to keep this data for auditing purposes
    // Adjust as needed based on your business requirements

    // Delete the meeting
    await db.delete(meetings).where(eq(meetings.id, parseInt(id)));

    return NextResponse.json(
      { message: "Meeting deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Mobile delete meeting API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
