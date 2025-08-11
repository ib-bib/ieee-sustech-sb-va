import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "~/server/api/trpc";
import { ratings } from "~/server/db/schema";
import { avg, eq } from "drizzle-orm";

export const ratingRouter = createTRPCRouter({
    getLatestRating: protectedProcedure.query(async ({ctx}) => {
        const averageRating = await ctx.db.select({
            value: avg(ratings.value)
        }).from(ratings).groupBy(ratings.userId).having(({ratings.userId}) => eq(ctx.session.user.id, userId))
    }),
    getAverageRating: protectedProcedure.query(async ({ctx}) => {

    })
});
