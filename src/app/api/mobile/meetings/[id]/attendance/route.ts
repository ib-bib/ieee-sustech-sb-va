import { type NextRequest, NextResponse } from "next/server";
import { google, type meet_v2 } from "googleapis";
import { env } from "~/env";
import { db } from "~/server/db";
import { authenticateMobileRequest } from "~/server/api/middleware/mobile_auth";
import { and, eq } from "drizzle-orm";
import { accounts } from "~/server/db/schema";
import { formatDuration } from "~/lib/utils";

interface ParticipantReport {
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
}

interface AttendanceReport {
  meetingStartTime: string | null;
  meetingEndTime: string | null;
  totalDuration: string;
  participants: ParticipantReport[];
}

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

    const allUserGoogleAccounts = await db.query.accounts.findMany({
      where: (accounts: { userId: any; provider: any }, { eq, and }: any) =>
        and(eq(accounts.userId, authUser.id), eq(accounts.provider, "google")),
    });

    console.log(
      `[Attendance] User ${authUser.email} (id: ${authUser.id}) has ${allUserGoogleAccounts.length} linked Google account(s)`,
    );
    allUserGoogleAccounts.forEach((acc: any, i: number) => {
      console.log(
        `[Attendance]   Account ${i}: providerAccountId=${acc.providerAccountId}, scope=${acc.scope ?? "N/A"}`,
      );
    });

    const account = allUserGoogleAccounts[0];

    if (!account?.refresh_token) {
      return NextResponse.json(
        {
          error:
            "You must connect your Google Account first to view attendance reports.",
        },
        { status: 403 },
      );
    }

    const baseUrl =
      env.NODE_ENV === "production"
        ? "https://ieee-sustech-sb-va.vercel.app"
        : "http://localhost:3000";

    const oauth2Client = new google.auth.OAuth2(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
      `${baseUrl}/api/google/callback`,
    );

    oauth2Client.setCredentials({
      access_token: account.access_token ?? undefined,
      refresh_token: account.refresh_token,
      expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
    });

    // Force token refresh if the access token is expired or about to expire
    const expiryDate = account.expires_at ? account.expires_at * 1000 : 0;
    if (Date.now() >= expiryDate - 60_000) {
      console.log(`[Attendance] Access token expired or expiring soon, refreshing...`);
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        oauth2Client.setCredentials(credentials);

        // Persist the refreshed tokens back to the database
        await db
          .update(accounts)
          .set({
            access_token: credentials.access_token ?? account.access_token,
            expires_at: credentials.expiry_date
              ? Math.floor(credentials.expiry_date / 1000)
              : account.expires_at,
          })
          .where(
            and(
              eq(accounts.userId, authUser.id),
              eq(accounts.provider, "google"),
            ),
          );
        console.log(`[Attendance] Token refreshed successfully`);
      } catch (refreshErr) {
        console.error(`[Attendance] Token refresh failed:`, refreshErr);
        return NextResponse.json(
          {
            error:
              "Google authentication expired. Please reconnect your Google account.",
          },
          { status: 401 },
        );
      }
    }

    console.log(`[Attendance] Token scope: ${account.scope ?? "not stored"}`);

    const meet = google.meet({ version: "v2", auth: oauth2Client });

    // 1. Resolve the canonical space name from the meeting code
    const space = await meet.spaces.get({
      name: `spaces/${meetingCode}`,
    });
    const canonicalSpaceName = space.data.name;
    if (!canonicalSpaceName) {
      return NextResponse.json(
        {
          error:
            "Meeting space not found. Check the meeting code and try again.",
        },
        { status: 404 },
      );
    }

    // 2. List recent conference records and filter by space (avoids API filter bugs)
    const listRes = await meet.conferenceRecords.list({ pageSize: 10 });
    const allRecords = listRes.data.conferenceRecords ?? [];
    const matchingRecords = allRecords.filter(
      (r) => r.space === canonicalSpaceName,
    );

    if (matchingRecords.length === 0 || !matchingRecords[0]?.name) {
      return NextResponse.json(
        {
          error:
            "No conference record found. Wait ~10 minutes after the meeting ends.",
        },
        { status: 404 },
      );
    }

    // 3. Find the most recent record that actually has participants
    // (Google Meet creates empty records if someone clicks the link but doesn't fully join)
    let targetRecord = matchingRecords[0]!;
    let participants: meet_v2.Schema$Participant[] = [];

    console.log(
      `[Attendance] Found ${matchingRecords.length} matching records for space ${canonicalSpaceName}`,
    );

    for (const record of matchingRecords) {
      console.log(`[Attendance] Checking record: ${record.name}`);
      console.log(`[Attendance]   startTime: ${record.startTime}, endTime: ${record.endTime}`);
      try {
        const participantsRes = await meet.conferenceRecords.participants.list({
          parent: record.name!,
        });
        const pList = participantsRes.data.participants ?? [];
        console.log(
          `[Attendance] HTTP status: ${participantsRes.status}`,
        );
        console.log(
          `[Attendance] Response keys: ${JSON.stringify(Object.keys(participantsRes.data))}`,
        );
        console.log(
          `[Attendance] Full response:`,
          JSON.stringify(participantsRes.data, null, 2),
        );
        console.log(`[Attendance] Record has ${pList.length} participants`);

        if (pList.length > 0) {
          targetRecord = record;
          participants = pList;
          console.log(`[Attendance] Using this record for attendance data`);
          break;
        }
      } catch (err) {
        console.error(`[Attendance] Error fetching participants:`, err);
      }
    }

    console.log(
      `[Attendance] Final participants count: ${participants.length}`,
    );

    const mStart = new Date(targetRecord.startTime!).getTime();
    const mEnd = targetRecord.endTime
      ? new Date(targetRecord.endTime).getTime()
      : Date.now();
    const totalMeetingMillis = mEnd - mStart;

    // Fetch all Google accounts in the DB to map internal users
    const allGoogleAccounts = await db.query.accounts.findMany({
      where: (accounts: { provider: any }, { eq }: any) =>
        eq(accounts.provider, "google"),
    });

    // Fetch internal users to get their actual names
    const internalUsers = await db.query.users.findMany();

    const participantReports = await Promise.all(
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

        const percentage =
          totalMeetingMillis > 0
            ? parseFloat(((pMillis / totalMeetingMillis) * 100).toFixed(2))
            : 0;

        type SignedinUserWithEmail = {
          displayName?: string | null;
          user?: string | null;
          email?: string | null;
        };
        const signedIn = p.signedinUser as
          | SignedinUserWithEmail
          | null
          | undefined;

        // Try to map the Google User ID to an internal user
        // Google Meet returns user resource names like "users/104382348324832"
        const googleUserId = signedIn?.user?.split("/").pop();

        const linkedAccount = allGoogleAccounts.find(
          (acc: { providerAccountId: string | undefined }) =>
            acc.providerAccountId === googleUserId,
        );

        const internalUser = linkedAccount
          ? internalUsers.find(
              (u: { id: any }) => u.id === linkedAccount.userId,
            )
          : null;

        return {
          email: signedIn?.email ?? null,
          displayName:
            signedIn?.displayName ??
            p.anonymousUser?.displayName ??
            "Unknown Guest",
          userResourceName: signedIn?.user ?? null,
          duration: formatDuration(pMillis),
          durationMillis: pMillis,
          percentage,
          sessionCount: sessions.length,
          // Add internal user data if we found a match!
          internalUserId: internalUser?.id ?? null,
          internalUserName: internalUser?.name ?? null,
          internalUserRole: internalUser?.roleId ?? null,
        };
      }),
    );

    const result = {
      meetingStartTime: targetRecord.startTime ?? null,
      meetingEndTime: targetRecord.endTime ?? null,
      totalDuration: formatDuration(totalMeetingMillis),
      participants: participantReports,
    };

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
