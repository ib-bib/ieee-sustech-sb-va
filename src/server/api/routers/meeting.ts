// src/server/api/routers/meeting.ts
import { z } from "zod";
import { google } from "googleapis";
import { formatDuration } from "../../../lib/utils";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { meetings } from "../../db/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { env } from "~/env";

export const meetingRouter = createTRPCRouter({
  testSync: protectedProcedure
    .input(z.object({ link: z.string().url() }))
    .mutation(async ({ input }) => {
      const oauth2Client = new google.auth.OAuth2(
        env.GOOGLE_CLIENT_ID,
        env.GOOGLE_CLIENT_SECRET,
      );

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
    .query(async ({ input }) => {
      const oauth2Client = new google.auth.OAuth2(
        env.GOOGLE_CLIENT_ID,
        env.GOOGLE_CLIENT_SECRET,
      );

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

      // 3. Use the most recent record
      const record = matchingRecords[0];
      const resourceName = record.name!;

      const mStart = new Date(record.startTime!).getTime();
      const mEnd = record.endTime
        ? new Date(record.endTime).getTime()
        : Date.now();
      const totalMeetingMillis = mEnd - mStart;

      // 4. List participants and compute per-participant duration
      const participantsRes = await meet.conferenceRecords.participants.list({
        parent: resourceName,
      });
      const participants = participantsRes.data.participants ?? [];

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

          // Schema$SignedinUser does not expose `email` in its TypeScript types,
          // but the underlying REST API may return it. We cast to access it.
          type SignedinUserWithEmail = {
            displayName?: string | null;
            user?: string | null;
            email?: string | null;
          };
          const signedIn = p.signedinUser as SignedinUserWithEmail | null | undefined;

          return {
            // email comes from the runtime REST response; may be null for
            // personal accounts or anonymous participants.
            email: signedIn?.email ?? null,
            displayName:
              signedIn?.displayName ??
              p.anonymousUser?.displayName ??
              "Unknown Guest",
            // user resource name (e.g. "users/1234...") as a stable identifier
            userResourceName: signedIn?.user ?? null,
            duration: formatDuration(pMillis),
            durationMillis: pMillis,
            percentage,
            sessionCount: sessions.length,
          };
        }),
      );

      return {
        meetingStartTime: record.startTime ?? null,
        meetingEndTime: record.endTime ?? null,
        totalDuration: formatDuration(totalMeetingMillis),
        participants: participantReports,
      };
    }),
});
