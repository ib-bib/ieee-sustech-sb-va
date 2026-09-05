import { notifications } from "~/server/db/schema";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { z } from "zod";
import { eq, and } from "drizzle-orm";

export const notificationRouter = createTRPCRouter({
  getUnclearedNotifications: protectedProcedure.query(async ({ ctx }) => {
    const notifs = await ctx.db.query.notifications.findMany({
      where: (n, { eq, and }) =>
        and(eq(n.isCleared, false), eq(n.userId, ctx.session.user.id)),
      orderBy: (n, { desc }) => [desc(n.createdAt)],
    });

    return notifs;
  }),

  getArchivedNotifications: protectedProcedure.query(async ({ ctx }) => {
    const notifs = await ctx.db.query.notifications.findMany({
      where: (n, { eq, and }) =>
        and(eq(n.isCleared, true), eq(n.userId, ctx.session.user.id)),
      orderBy: (n, { desc }) => [desc(n.createdAt)],
    });

    return notifs;
  }),

  clearNotification: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(notifications)
        .set({
          isCleared: true,
        })
        .where(
          and(
            eq(notifications.id, input.id),
            eq(notifications.userId, ctx.session.user.id)
          )
        );
    }),

  unarchiveNotification: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(notifications)
        .set({
          isCleared: false,
        })
        .where(
          and(
            eq(notifications.id, input.id),
            eq(notifications.userId, ctx.session.user.id)
          )
        );
    }),

  readNotification: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(notifications)
        .set({
          isRead: true,
        })
        .where(
          and(
            eq(notifications.id, input.id),
            eq(notifications.userId, ctx.session.user.id)
          )
        );
    }),

  deleteNotification: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(notifications)
        .where(
          and(
            eq(notifications.id, input.id),
            eq(notifications.userId, ctx.session.user.id)
          )
        );
    }),
});
