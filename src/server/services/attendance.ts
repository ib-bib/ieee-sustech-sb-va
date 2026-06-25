import { google, type meet_v2 } from "googleapis";
import { and, eq, or, sql } from "drizzle-orm";
import { db } from "~/server/db";
import { accounts, attendanceRecords, meetings, users } from "~/server/db/schema";
import { env } from "~/env";
import { formatDuration } from "~/lib/utils";

export type ParticipantReport = {
  email: string | null;
  displayName: string;
  userResourceName: string | null;
  duration: string;
  durationMillis: number;
  percentage: number;
  sessionCount: number;
  internalUserId: string | null;
  internalUserName: string | null;
  internalUserRole: number | null;
};

/**
 * Automatically link unassigned attendance records to a registered user
 * when they link their Google account.
 */
export async function syncUserAttendanceRecords(
  userId: string,
  providerAccountId: string,
  googleEmail?: string | null
) {
  const conditions = [eq(attendanceRecords.userResourceName, `users/${providerAccountId}`)];
  if (googleEmail) {
    conditions.push(eq(attendanceRecords.email, googleEmail));
  }

  await db
    .update(attendanceRecords)
    .set({ internalUserId: userId })
    .where(
      and(
        sql`${attendanceRecords.internalUserId} IS NULL`,
        or(...conditions)
      )
    );
}

/**
 * Format saved database attendance records into the API response format.
 */
export function getFormattedReportFromDB(meeting: {
  startTime: Date | null;
  endedAt: Date | null;
  totalDuration: number | null;
  attendanceRecords: Array<{
    email: string | null;
    displayName: string;
    userResourceName: string | null;
    durationMillis: number;
    percentage: string;
    sessionCount: number;
    internalUserId: string | null;
    internalUser?: { name: string | null; roleId: number } | null;
  }>;
}) {
  return {
    status: "fetched" as const,
    data: {
      meetingStartTime: meeting.startTime?.toISOString() ?? null,
      meetingEndTime: meeting.endedAt?.toISOString() ?? null,
      totalDuration: meeting.totalDuration ? formatDuration(meeting.totalDuration) : "0s",
      participants: meeting.attendanceRecords.map((r) => ({
        email: r.email,
        displayName: r.displayName,
        userResourceName: r.userResourceName,
        duration: formatDuration(r.durationMillis),
        durationMillis: r.durationMillis,
        percentage: Number(r.percentage),
        sessionCount: r.sessionCount,
        internalUserId: r.internalUserId,
        internalUserName: r.internalUser?.name ?? null,
        internalUserRole: r.internalUser?.roleId ?? null,
      })),
    },
  };
}

/**
 * Fetch attendance report from Google Meet API, deduplicate participants,
 * save permanently to database, and return formatted report.
 */
export async function fetchAndSaveMeetingAttendance(
  meetingId: number,
  currentUserId: string
) {
  const meeting = await db.query.meetings.findFirst({
    where: eq(meetings.id, meetingId),
    with: {
      host: true,
      attendanceRecords: {
        with: { internalUser: true },
      },
    },
  });

  if (!meeting) {
    throw new Error("Meeting not found");
  }

  if (meeting.isReportFetched) {
    return getFormattedReportFromDB(meeting);
  }

  if (meeting.hostId && currentUserId !== meeting.hostId) {
    return {
      status: "unfetched" as const,
      host: {
        name: meeting.host?.name ?? "Unknown Host",
        email: meeting.host?.email ?? "Unknown Email",
      },
    };
  }

  if (!meeting.meetingCode) {
    throw new Error("Meeting has no meeting code");
  }

  const account = await db.query.accounts.findFirst({
    where: (accounts, { eq, and }) =>
      and(
        eq(accounts.userId, currentUserId),
        eq(accounts.provider, "google")
      ),
  });

  if (!account?.refresh_token) {
    throw new Error("You must connect your Google Account first to view reports.");
  }

  const oauth2Client = new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: account.access_token ?? undefined,
    refresh_token: account.refresh_token,
    expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
  });

  const meet = google.meet({ version: "v2", auth: oauth2Client });

  // 1. Resolve canonical space name
  const space = await meet.spaces.get({
    name: `spaces/${meeting.meetingCode}`,
  });
  const canonicalSpaceName = space.data.name;
  if (!canonicalSpaceName) {
    throw new Error("Could not resolve meeting space.");
  }

  // 2. List recent conference records
  const listRes = await meet.conferenceRecords.list({ pageSize: 10 });
  const allRecords = listRes.data.conferenceRecords ?? [];
  const matchingRecords = allRecords.filter(
    (r) => r.space === canonicalSpaceName
  );

  if (matchingRecords.length === 0 || !matchingRecords[0]?.name) {
    throw new Error("No conference record found. Wait ~10 minutes after the meeting ends.");
  }

  // 3. Find target record with participants
  let targetRecord = matchingRecords[0]!;
  let participants: meet_v2.Schema$Participant[] = [];

  for (const record of matchingRecords) {
    const participantsRes = await meet.conferenceRecords.participants.list({
      parent: record.name!,
    });
    const pList = participantsRes.data.participants ?? [];

    if (pList.length > 0) {
      targetRecord = record;
      participants = pList;
      break;
    }
  }

  const mStart = new Date(targetRecord.startTime!).getTime();
  const mEnd = targetRecord.endTime
    ? new Date(targetRecord.endTime).getTime()
    : Date.now();
  const totalMeetingMillis = mEnd - mStart;

  const allGoogleAccounts = await db.query.accounts.findMany({
    where: (accounts, { eq }) => eq(accounts.provider, "google"),
  });
  const internalUsers = await db.query.users.findMany();

  const rawReports = await Promise.all(
    participants.map(async (p) => {
      const sessionsRes =
        await meet.conferenceRecords.participants.participantSessions.list({
          parent: p.name!,
        });
      const sessions = sessionsRes.data.participantSessions ?? [];

      let pMillis = 0;
      sessions.forEach((s) => {
        const sStart = new Date(s.startTime!).getTime();
        const sEnd = s.endTime ? new Date(s.endTime).getTime() : Date.now();
        pMillis += sEnd - sStart;
      });

      type SignedinUserWithEmail = {
        displayName?: string | null;
        user?: string | null;
        email?: string | null;
      };
      const signedIn = p.signedinUser as SignedinUserWithEmail | null | undefined;
      const googleUserId = signedIn?.user?.split("/").pop();

      const linkedAccount = allGoogleAccounts.find(
        (acc) => acc.providerAccountId === googleUserId
      );
      const internalUser = linkedAccount
        ? internalUsers.find((u) => u.id === linkedAccount.userId)
        : null;

      return {
        email: signedIn?.email ?? null,
        displayName:
          signedIn?.displayName ??
          p.anonymousUser?.displayName ??
          "Unknown Guest",
        userResourceName: signedIn?.user ?? null,
        durationMillis: pMillis,
        sessionCount: sessions.length,
        internalUserId: internalUser?.id ?? null,
        internalUserName: internalUser?.name ?? null,
        internalUserRole: internalUser?.roleId ?? null,
      };
    })
  );

  // Deduplicate participants by userResourceName (or displayName if anonymous)
  const dedupMap = new Map<string, typeof rawReports[0]>();
  for (const item of rawReports) {
    const key = item.userResourceName ?? item.displayName;
    if (!dedupMap.has(key)) {
      dedupMap.set(key, { ...item });
    } else {
      const existing = dedupMap.get(key)!;
      existing.durationMillis += item.durationMillis;
      existing.sessionCount += item.sessionCount;
      if (!existing.email && item.email) existing.email = item.email;
      if (!existing.internalUserId && item.internalUserId) {
        existing.internalUserId = item.internalUserId;
        existing.internalUserName = item.internalUserName;
        existing.internalUserRole = item.internalUserRole;
      }
    }
  }

  const participantReports: ParticipantReport[] = Array.from(dedupMap.values()).map((p) => {
    const percentage =
      totalMeetingMillis > 0
        ? parseFloat(((p.durationMillis / totalMeetingMillis) * 100).toFixed(2))
        : 0;
    return {
      ...p,
      duration: formatDuration(p.durationMillis),
      percentage,
    };
  });

  // Replace existing attendance records for this meeting
  await db.delete(attendanceRecords).where(eq(attendanceRecords.meetingId, meeting.id));

  if (participantReports.length > 0) {
    await db.insert(attendanceRecords).values(
      participantReports.map((p) => ({
        meetingId: meeting.id,
        internalUserId: p.internalUserId,
        displayName: p.displayName,
        email: p.email,
        userResourceName: p.userResourceName,
        durationMillis: p.durationMillis,
        percentage: p.percentage.toString(),
        sessionCount: p.sessionCount,
      }))
    );
  }

  await db
    .update(meetings)
    .set({
      isReportFetched: true,
      totalDuration: totalMeetingMillis,
      hostId: meeting.hostId ?? currentUserId,
      startTime: targetRecord.startTime ? new Date(targetRecord.startTime) : meeting.startTime,
      endedAt: targetRecord.endTime ? new Date(targetRecord.endTime) : meeting.endedAt,
    })
    .where(eq(meetings.id, meeting.id));

  return {
    status: "fetched" as const,
    data: {
      meetingStartTime: targetRecord.startTime ?? null,
      meetingEndTime: targetRecord.endTime ?? null,
      totalDuration: formatDuration(totalMeetingMillis),
      participants: participantReports,
    },
  };
}
