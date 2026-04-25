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
        endTime: z.string(),
        attendees: z.array(z.string().email()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role?.name !== "HR")
        throw new TRPCError({ code: "FORBIDDEN", message: "Unauthorized" });
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
      );
      const calendar = google.calendar({
        version: "v3",
        auth: oauth2Client,
      }) as any;
      const event: any = {
        summary: input.title,
        start: { dateTime: input.startTime },
        end: { dateTime: input.endTime },
        attendees: input.attendees.map((email) => ({ email })),
        conferenceData: {
          createRequest: {
            requestId: Math.random().toString(),
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      };
      const createdEvent = await calendar.events.insert({
        calendarId: "primary",
        resource: event,
        conferenceDataVersion: 1,
      });
      const meetLink = createdEvent.data.conferenceData?.entryPoints?.[0]?.uri;
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

  endMeeting: protectedProcedure
    .input(z.object({ meetingId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const meeting = await ctx.db.query.meetings.findFirst({
        where: eq(meetings.id, input.meetingId),
      });
      if (!meeting)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Meeting not found",
        });
      if (meeting.status === "ended")
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Meeting already ended",
        });
      await ctx.db
        .update(meetings)
        .set({ status: "ended", endedAt: new Date() })
        .where(eq(meetings.id, input.meetingId));
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
      );
      const meet = google.meet({ version: "v2", auth: oauth2Client }) as any;
      const records = await meet.conferenceRecords.list({
        filter: `meetingCode="${meeting.meetingCode}"`,
      });
      const latestRecord = records.data.conferenceRecords?.[0];
      if (!latestRecord)
        throw new TRPCError({ code: "NOT_FOUND", message: "No record found" });
      const participants = (await meet.conferenceRecords.participants.list({
        parent: latestRecord.name,
      })) as any;
      for (const p of participants.data.participants ?? []) {
        if (!p.signedinUser?.displayName) continue;
        const user = await ctx.db.query.users.findFirst({
          where: eq(users.name, p.signedinUser.displayName),
        });
        if (!user) continue;
        const sessions =
          (await meet.conferenceRecords.participants.participantSessions.list({
            parent: p.name,
          })) as any;
        let totalMillis = 0;
        sessions.data.participantSessions?.forEach((s: any) => {
          const start = new Date(s.startTime!).getTime();
          const end = s.endTime ? new Date(s.endTime).getTime() : Date.now();
          totalMillis += end - start;
        });
        await ctx.db.insert(meetingParticipations).values({
          userId: user.id,
          meetingId: input.meetingId,
          durationAttended: totalMillis,
        });
      }
      return { message: "Meeting ended and report generated" };
    }),
});
