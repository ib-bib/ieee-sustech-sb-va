// src/server/api/routers/meeting.ts
import { z } from "zod";
import { google } from "googleapis";
import { formatDuration } from "../../../lib/utils";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { meetings, meetingParticipations, users } from "../../db/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { env } from "~/env";

export const meetingRouter = createTRPCRouter({
  testSync: protectedProcedure
    .input(z.object({ link: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
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
          `Participant: ${p.signedinUser?.displayName || "Anonymous"}`,
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
        title: z.string(),
        startTime: z.string(),
        endTime: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(["scheduled", "started", "ended"]),
        link: z.string().url(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role?.name !== "HR")
        throw new TRPCError({ code: "FORBIDDEN", message: "Unauthorized" });
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
      );

      const { link: meetLink } = input;

      if (!meetLink)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create meeting",
        });

      const meetingCode = meetLink.split("/").pop()?.split("?")[0];
      if (!meetingCode)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid meeting link",
        });
      await ctx.db.insert(meetings).values({ meetingCode, status: "started" });
      return { meetLink };
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
});
