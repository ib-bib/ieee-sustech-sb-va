// src/server/api/routers/meeting.ts
import { z } from "zod";
import { google, type meet_v2 } from "googleapis";
import { formatDuration } from "~/lib/utils";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { meetings, attendanceRecords } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { env } from "~/env";
import { fetchAndSaveMeetingAttendance } from "~/server/services/attendance";

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

      if (!account?.refresh_token) {
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
          hostId: ctx.session.user.id,
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

  updateMeeting: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1, "Title required").optional(),
        startTime: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(["scheduled", "started", "ended", "cancelled", "delayed"]).optional(),
        link: z.string().url().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role?.name !== "HR")
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only HR can update meetings",
        });

      const { id, link, title, startTime, description, status } = input;

      const updateData: Record<string, any> = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (startTime !== undefined) updateData.startTime = new Date(startTime);
      if (status !== undefined) {
        updateData.status = status;
        if (status === "ended") {
          updateData.endedAt = new Date();
        }
      }
      if (link !== undefined) {
        updateData.meetingCode = link.split("/").pop()?.split("?")[0];
      }

      await ctx.db
        .update(meetings)
        .set(updateData)
        .where(eq(meetings.id, id));

      return { message: "Meeting updated successfully" };
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
        with: {
          host: true,
          attendanceRecords: {
            with: { internalUser: true }
          }
        }
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
    .input(z.object({ meetingId: z.number() }))
    .query(async ({ ctx, input }) => {
      return fetchAndSaveMeetingAttendance(input.meetingId, ctx.session.user.id);
    }),
});
