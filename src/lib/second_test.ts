import { google } from "googleapis";
import { authenticate } from "@google-cloud/local-auth";
import path from "path";

const SCOPES = ["https://www.googleapis.com/auth/meetings.space.readonly"];
const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");

async function getReportForCode(targetCode: string) {
  const authClient = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials(authClient.credentials);
  const meet = google.meet({ version: "v2", auth: oauth2Client as any });

  try {
    console.log(`--- Resolving Meeting Code: ${targetCode} ---`);

    // 1. Get the Space ID (the "aUec..." identifier)
    const space = await meet.spaces.get({ name: `spaces/${targetCode}` });
    const canonicalSpaceName = space.data.name;

    console.log(
      `--- Searching History for Space ID: ${canonicalSpaceName} ---`,
    );

    // 2. List all recent records and filter manually in TypeScript
    // This avoids the "Invalid Filter" API bug entirely
    const listRes = await meet.conferenceRecords.list({ pageSize: 1 });
    const allRecords = listRes.data.conferenceRecords ?? [];

    const matchingRecords = allRecords.filter(
      (r) => r.space === canonicalSpaceName,
    );

    if (matchingRecords.length === 0 || !matchingRecords[0]?.name) {
      console.log(`❌ No conference records found for ${targetCode}.`);
      console.log(
        "Check if the meeting has ended and you've waited ~10 minutes.",
      );
      return;
    }

    // 3. Use the most recent meeting instance found for that code
    const record = matchingRecords[0];
    const resourceName = record.name!;

    // Math: Total Meeting Duration
    const mStart = new Date(record.startTime!).getTime();
    const mEnd = record.endTime
      ? new Date(record.endTime).getTime()
      : Date.now();
    const totalMeetingMillis = mEnd - mStart;

    const mTotalMins = Math.floor(totalMeetingMillis / 60000);
    const mTotalSecs = Math.floor((totalMeetingMillis % 60000) / 1000);

    console.log(`\n✅ FOUND SESSION: ${record.startTime}`);
    console.log(`============================================================`);
    console.log(`TOTAL MEETING TIME: ${mTotalMins}m ${mTotalSecs}s`);
    console.log(`============================================================`);

    // 4. Get Participants
    const participantsRes = await meet.conferenceRecords.participants.list({
      parent: resourceName,
    });

    const participants = participantsRes.data.participants ?? [];

    for (const p of participants) {
      const sessionsRes =
        await meet.conferenceRecords.participants.participantSessions.list({
          parent: p.name!,
        });

      let pMillis = 0;
      const sessions = sessionsRes.data.participantSessions ?? [];

      sessions.forEach((s) => {
        const sStart = new Date(s.startTime!).getTime();
        const sEnd = s.endTime ? new Date(s.endTime).getTime() : Date.now();
        pMillis += sEnd - sStart;
      });

      const pMins = Math.floor(pMillis / 60000);
      const pSecs = Math.floor((pMillis % 60000) / 1000);

      // Safety check: ensure we don't divide by zero if a meeting was 0 seconds
      const percentage =
        totalMeetingMillis > 0
          ? ((pMillis / totalMeetingMillis) * 100).toFixed(2)
          : "0.00";

      const name =
        p.signedinUser?.displayName ||
        p.anonymousUser?.displayName ||
        "Unknown Guest";
      console.log(
        `👤 ${name.padEnd(25)} | ⏱️  ${pMins}m ${pSecs}s (${percentage}%)`,
      );
    }
  } catch (err: any) {
    console.error("\n❌ Error:", err.message);
  }
}

await getReportForCode("wyf-vauv-gma");
