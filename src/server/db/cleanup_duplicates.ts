import { eq } from "drizzle-orm";
import { db } from "./index";
import { attendanceRecords } from "./schema";

export async function cleanupDuplicateAttendanceRecords() {
  console.log("Cleaning up duplicate attendance records...");
  const allMeetings = await db.query.meetings.findMany({
    with: {
      attendanceRecords: true,
    },
  });

  let totalRemoved = 0;

  for (const meeting of allMeetings) {
    if (meeting.attendanceRecords.length === 0) continue;

    const dedupMap = new Map();
    for (const record of meeting.attendanceRecords) {
      const key = record.userResourceName ?? record.displayName;
      if (!dedupMap.has(key)) {
        dedupMap.set(key, { ...record });
      } else {
        const existing = dedupMap.get(key);
        existing.durationMillis += record.durationMillis;
        existing.sessionCount += record.sessionCount;
        if (!existing.email && record.email) existing.email = record.email;
        if (!existing.internalUserId && record.internalUserId) {
          existing.internalUserId = record.internalUserId;
        }
      }
    }

    const uniqueRecords = Array.from(dedupMap.values());
    if (uniqueRecords.length < meeting.attendanceRecords.length) {
      const duplicatesCount = meeting.attendanceRecords.length - uniqueRecords.length;
      totalRemoved += duplicatesCount;

      // Recalculate percentage based on meeting duration
      const totalMillis = meeting.totalDuration ?? uniqueRecords.reduce((acc, r) => acc + r.durationMillis, 0);

      await db.delete(attendanceRecords).where(eq(attendanceRecords.meetingId, meeting.id));

      await db.insert(attendanceRecords).values(
        uniqueRecords.map((r) => ({
          meetingId: meeting.id,
          internalUserId: r.internalUserId,
          displayName: r.displayName,
          email: r.email,
          userResourceName: r.userResourceName,
          durationMillis: r.durationMillis,
          percentage: totalMillis > 0 ? ((r.durationMillis / totalMillis) * 100).toFixed(2) : "0",
          sessionCount: r.sessionCount,
        }))
      );
      console.log(`[Meeting ${meeting.id}] Merged ${duplicatesCount} duplicate record(s).`);
    }
  }

  console.log(`Cleanup complete! Total duplicate records removed: ${totalRemoved}`);
}
