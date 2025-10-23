import { notifications } from "~/server/db/schema";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { z } from "zod";
import { eq } from "drizzle-orm";

export const notificationRouter = createTRPCRouter({
  getUnclearedNotifications: protectedProcedure.query(async ({ ctx }) => {
    const notifs = await ctx.db.query.notifications.findMany({
      where: (n, { eq, and }) =>
        and(eq(n.isCleared, false), eq(n.userId, ctx.session.user.id)),
    });

    if (!notifs) {
      return {
        error: "Could not retrieve data",
        data: null,
      };
    }
  }),

  clearNotification: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(notifications)
        .set({
          isCleared: true,
        })
        .where(eq(notifications.id, input.id));
    }),

  readNotification: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(notifications)
        .set({
          isRead: true,
        })
        .where(eq(notifications.id, input.id));
    }),
});
