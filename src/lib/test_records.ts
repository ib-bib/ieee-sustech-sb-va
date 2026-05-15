import { db } from '../server/db/index';
import { accounts } from '../server/db/schema';
import { google } from 'googleapis';
import { env } from '../env.js';

const allAccounts = await db.select().from(accounts);
const account = allAccounts.find(a => a.provider === 'google');
if (!account) throw new Error('No google account found');
const oauth2Client = new google.auth.OAuth2(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET);
oauth2Client.setCredentials({ access_token: account.access_token, refresh_token: account.refresh_token });
const meet = google.meet({ version: 'v2', auth: oauth2Client });
const space = await meet.spaces.get({ name: 'spaces/wyf-vauv-gma' });
const canonicalSpaceName = space.data.name;
const listRes = await meet.conferenceRecords.list({ pageSize: 100 });
const allRecords = listRes.data.conferenceRecords ?? [];
const matchingRecords = allRecords.filter(r => r.space === canonicalSpaceName);
console.log(`Found ${matchingRecords.length} records for ${canonicalSpaceName}`);
for (const record of matchingRecords) {
  if (!record.name) throw new Error('No record name found');
  const pRes = await meet.conferenceRecords.participants.list({ parent: record.name });
  const p = pRes.data.participants ?? [];
  console.log(`Record ${record.name} started at ${record.startTime} has ${p.length} participants`);
}
process.exit(0);
