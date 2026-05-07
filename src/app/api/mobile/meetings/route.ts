import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "~/server/db";
import { meetings } from "~/server/db/schema";
import { authenticateMobileRequest } from "~/server/api/middleware/mobile_auth";

const CreateMeetingSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  startTime: z.string().datetime("Invalid date format"),
  link: z.string().url("Invalid URL format"),
  status: z.enum(["scheduled", "started", "ended"]).default("scheduled"),
});

// GET: Retrieve all meetings (HR only)
export async function GET(req: NextRequest) {
  try {
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

    // Get all meetings
    const allMeetings = await db.query.meetings.findMany({
      orderBy: (m, { desc }) => desc(m.createdAt),
    });

    const result = allMeetings.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      meetingCode: m.meetingCode,
      startTime: m.startTime,
      endedAt: m.endedAt,
      status: m.status,
      createdAt: m.createdAt,
    }));

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Mobile get meetings API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

// POST: Create a new meeting (HR only)
export async function POST(req: NextRequest) {
  try {
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
        { error: "Only HR members can create meetings" },
        { status: 403 },
      );
    }

    const body = (await req.json()) as unknown;
    const validationResult = CreateMeetingSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: validationResult.error.errors,
        },
        { status: 400 },
      );
    }

    const { title, description, startTime, link, status } =
      validationResult.data;

    // Extract meeting code from link
    const meetingCode =
      link.split("/").pop()?.split("?")[0] || `meet-${Date.now()}`;

    // Create meeting
    const createdMeetings = await db
      .insert(meetings)
      .values({
        title,
        description,
        startTime: new Date(startTime),
        meetingCode,
        status,
        endedAt: status === "ended" ? new Date() : null,
      })
      .returning({ id: meetings.id });

    const createdMeetingId = createdMeetings[0]?.id;

    if (!createdMeetingId) {
      return NextResponse.json(
        { error: "Failed to create meeting" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        message: "Meeting created successfully",
        meetingId: createdMeetingId,
        meetingCode,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Mobile create meeting API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
