// src/server/api/routers/meeting.ts
import { z } from "zod";
import { google } from "googleapis";
import { formatDuration } from "~/lib/utils";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { meetings } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { env } from "~/env";

export const meetingRouter = createTRPCRouter({
  testSync: protectedProcedure
    .input(z.object({ link: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      const account = await ctx.db.query.accounts.findFirst({
        where: (accounts, { eq, and }) =>
          and(
            eq(accounts.userId, ctx.session.user.id),
            eq(accounts.provider, "google"),
          ),
      });

      if (!account || !account.refresh_token) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must connect your Google Account first.",
        });
      }

      const oauth2Client = new google.auth.OAuth2(
        env.GOOGLE_CLIENT_ID,
        env.GOOGLE_CLIENT_SECRET,
      );

      oauth2Client.setCredentials({
        access_token: account.access_token ?? undefined,
        refresh_token: account.refresh_token,
        expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
      });

      const meet = google.meet({ version: "v2", auth: oauth2Client });

      const meetingCode = input.link.split("/").pop()?.split("?")[0];

      console.log(`--- Starting Test for Meeting: ${meetingCode} ---`);

      // 1. Find the Conference Record
      const records = await meet.conferenceRecords.list({
        filter: `meetingCode="${meetingCode}"`,
      });

      const latestRecord = records.data.conferenceRecords?.[0];
      if (!latestRecord?.name)
        throw new Error("No record found. Wait 5 mins after call ends.");

      const recordStart = new Date(latestRecord.startTime!).getTime();
      const recordEnd = latestRecord.endTime
        ? new Date(latestRecord.endTime).getTime()
        : Date.now();

      console.log(`Meeting Length: ${formatDuration(recordEnd - recordStart)}`);
      console.log(`----------------------------------------------`);

      // 2. List Participants
      const participants = await meet.conferenceRecords.participants.list({
        parent: latestRecord.name,
      });

      for (const p of participants.data.participants ?? []) {
        if (!p?.name) {
          throw new Error("Unable to retrieve participants data");
        }
        const sessions =
          await meet.conferenceRecords.participants.participantSessions.list({
            parent: p.name,
          });

        let totalMillis = 0;
        sessions.data.participantSessions?.forEach((s) => {
          const start = new Date(s.startTime!).getTime();
          const end = s.endTime ? new Date(s.endTime).getTime() : Date.now();
          totalMillis += end - start;
        });

        // Use displayName since personal accounts often hide emails in the API
        console.log(
          `Participant: ${p.signedinUser?.displayName ?? "Anonymous"}`,
        );
        console.log(`Total Time: ${formatDuration(totalMillis)}`);
        console.log(
          `Sessions: ${sessions.data.participantSessions?.length ?? 0}`,
        );
        console.log(`---`);
      }

      return { message: "Check your server console for logs!" };
    }),

  createMeeting: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1, "Title required"),
        startTime: z.string(),
        description: z.string().optional(),
        status: z.enum(["scheduled", "started", "ended"]),
        link: z.string().url(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role?.name !== "HR")
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only HR can create meetings",
        });

      const { link, title, startTime, description, status } = input;

      console.log(input);

      const meetingCode =
        link?.split("/").pop()?.split("?")[0] ?? `meet-${Date.now()}`;

      console.log(`Meeting code: ${meetingCode}`);

      const insertOperation = await ctx.db
        .insert(meetings)
        .values({
          title,
          description,
          startTime: new Date(startTime),
          endedAt: status === "ended" ? new Date() : null,
          meetingCode,
          status,
        })
        .returning({ id: meetings.id });

      const meetingId = insertOperation[0]?.id;

      if (!meetingId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create meeting",
        });
      }

      return { message: "Meeting created", meetingId };
    }),

  updateMeetingStatus: protectedProcedure
    .input(
      z.object({
        meetingCode: z.string(),
        status: z.enum(["scheduled", "started", "ended"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role?.name !== "HR")
        throw new TRPCError({ code: "FORBIDDEN", message: "Unauthorized" });
      await ctx.db
        .update(meetings)
        .set({ status: input.status })
        .where(eq(meetings.meetingCode, input.meetingCode));
      return { message: "Meeting status updated" };
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    const result = await ctx.db.query.meetings.findMany({
      orderBy: (t, { desc }) => desc(t.createdAt),
    });

    return result;
  }),

  getMeetingByID: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const meeting = await ctx.db.query.meetings.findFirst({
        where: eq(meetings.id, input.id),
      });
      if (!meeting) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Meeting not found",
        });
      }
      return meeting;
    }),

  getMeetingByCode: protectedProcedure
    .input(z.object({ meetingCode: z.string() }))
    .query(async ({ ctx, input }) => {
      const meeting = await ctx.db.query.meetings.findFirst({
        where: eq(meetings.meetingCode, input.meetingCode),
      });
      if (!meeting) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Meeting not found",
        });
      }
      return meeting;
    }),

  getAttendanceReport: protectedProcedure
    .input(z.object({ meetingCode: z.string() }))
    .query(async ({ ctx, input }) => {
      const account = await ctx.db.query.accounts.findFirst({
        where: (accounts, { eq, and }) =>
          and(
            eq(accounts.userId, ctx.session.user.id),
            eq(accounts.provider, "google"),
          ),
      });

      if (!account || !account.refresh_token) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must connect your Google Account first to view reports.",
        });
      }

      const oauth2Client = new google.auth.OAuth2(
        env.GOOGLE_CLIENT_ID,
        env.GOOGLE_CLIENT_SECRET,
      );

      oauth2Client.setCredentials({
        access_token: account.access_token ?? undefined,
        refresh_token: account.refresh_token,
        expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
      });

      const meet = google.meet({ version: "v2", auth: oauth2Client });

      // 1. Resolve the canonical space name from the meeting code
      const space = await meet.spaces.get({
        name: `spaces/${input.meetingCode}`,
      });
      const canonicalSpaceName = space.data.name;
      if (!canonicalSpaceName) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Could not resolve meeting space.",
        });
      }

      // 2. List recent conference records and filter by space (avoids API filter bugs)
      const listRes = await meet.conferenceRecords.list({ pageSize: 10 });
      const allRecords = listRes.data.conferenceRecords ?? [];
      const matchingRecords = allRecords.filter(
        (r) => r.space === canonicalSpaceName,
      );

      if (matchingRecords.length === 0 || !matchingRecords[0]?.name) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "No conference record found. Wait ~10 minutes after the meeting ends.",
        });
      }

      // 3. Find the most recent record that actually has participants
      // (Google Meet creates empty records if someone clicks the link but doesn't fully join)
      let targetRecord = matchingRecords[0]!;
      let participants: any[] = [];
      let resourceName = targetRecord.name!;

      for (const record of matchingRecords) {
        const participantsRes = await meet.conferenceRecords.participants.list({
          parent: record.name!,
        });
        const pList = participantsRes.data.participants ?? [];

        if (pList.length > 0) {
          targetRecord = record;
          participants = pList;
          resourceName = record.name!;
          break;
        }
      }

      const mStart = new Date(targetRecord.startTime!).getTime();
      const mEnd = targetRecord.endTime
        ? new Date(targetRecord.endTime).getTime()
        : Date.now();
      const totalMeetingMillis = mEnd - mStart;

      // Fetch all Google accounts in the DB to map internal users
      const allGoogleAccounts = await ctx.db.query.accounts.findMany({
        where: (accounts, { eq }) => eq(accounts.provider, "google"),
      });

      // Fetch internal users to get their actual names
      const internalUsers = await ctx.db.query.users.findMany();

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
            const sEnd = s.endTime
              ? new Date(s.endTime).getTime()
              : Date.now();
            pMillis += sEnd - sStart;
          });

          const percentage =
            totalMeetingMillis > 0
              ? parseFloat(
                ((pMillis / totalMeetingMillis) * 100).toFixed(2),
              )
              : 0;

          type SignedinUserWithEmail = {
            displayName?: string | null;
            user?: string | null;
            email?: string | null;
          };
          const signedIn = p.signedinUser as SignedinUserWithEmail | null | undefined;

          // Try to map the Google User ID to an internal user
          // Google Meet returns user resource names like "users/104382348324832"
          const googleUserId = signedIn?.user?.split("/").pop();

          const linkedAccount = allGoogleAccounts.find(
            (acc) => acc.providerAccountId === googleUserId,
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

      return {
        meetingStartTime: targetRecord.startTime ?? null,
        meetingEndTime: targetRecord.endTime ?? null,
        totalDuration: formatDuration(totalMeetingMillis),
        participants: participantReports,
      };
    }),
});
