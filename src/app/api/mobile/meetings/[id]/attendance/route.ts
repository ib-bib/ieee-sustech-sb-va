import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { authenticateMobileRequest } from "~/server/api/middleware/mobile_auth";
import { eq, or } from "drizzle-orm";
import { meetings } from "~/server/db/schema";
import { fetchAndSaveMeetingAttendance } from "~/server/services/attendance";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: meetingCode } = await params;
    const { user, response } = await authenticateMobileRequest(req);

    if (!user || response) {
      return (
        response ??
        NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      );
    }

    // Get the authenticated user
    const authUser = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.email, user.email),
    });

    if (!authUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const numericId = Number(meetingCode);
    const meeting = await db.query.meetings.findFirst({
      where: !isNaN(numericId)
        ? or(eq(meetings.meetingCode, meetingCode), eq(meetings.id, numericId))
        : eq(meetings.meetingCode, meetingCode),
    });

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const result = await fetchAndSaveMeetingAttendance(meeting.id, authUser.id);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Mobile get attendance report error:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: "Failed to fetch attendance report",
          message: error.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        error: "An unexpected error occurred",
      },
      { status: 500 },
    );
  }
}
