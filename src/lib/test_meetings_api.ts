import path from "path";
import { authenticate } from "@google-cloud/local-auth";
import { meet as g_meet } from "@googleapis/meet";

const SCOPES = ["https://www.googleapis.com/auth/meetings.space.readonly"];
const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");

async function runTest(meetingCode: string) {
  // 1. One-liner Auth: Opens your browser to log in
  const auth = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });

  const meet = g_meet({ version: "v2", auth: auth as any });

  console.log(`\n--- Fetching Data for: ${meetingCode} ---`);

  // 2. Find the meeting instance
  const records = await meet.conferenceRecords.list({
    filter: `meetingCode="${meetingCode}"`,
  });

  const latestRecord = records.data.conferenceRecords?.[0];
  if (!latestRecord?.name) {
    console.log("❌ No record found. (Wait 5 mins if the meeting just ended)");
    return;
  }

  // 3. Get Participants & Calculate
  const participants = await meet.conferenceRecords.participants.list({
    parent: latestRecord.name,
  });

  for (const p of participants.data.participants ?? []) {
    if (!p.name) continue;
    const sessionRes =
      await meet.conferenceRecords.participants.participantSessions.list({
        parent: p.name,
      });

    let totalMillis = 0;
    sessionRes.data.participantSessions?.forEach((s) => {
      const start = new Date(s.startTime!).getTime();
      const end = s.endTime ? new Date(s.endTime).getTime() : Date.now();
      totalMillis += end - start;
    });

    // Formatting Logic
    const mins = Math.floor(totalMillis / 60000);
    const secs = Math.floor((totalMillis % 60000) / 1000);

    console.log(`👤 Participant: ${p.signedinUser?.displayName || "Unknown"}`);
    console.log(`⏱️  Duration: ${mins}m ${secs}s`);
    console.log(`---`);
  }
}

// Run it with a sample code (e.g. abc-defg-hij)
const code = process.argv[2];
if (!code)
  console.log(
    "Please provide a meeting code: ts-node test-meet.ts abc-defg-hij",
  );
else runTest(code);
