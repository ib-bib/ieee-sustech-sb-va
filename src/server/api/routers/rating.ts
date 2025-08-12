import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "~/server/api/trpc";
import { ratings, users } from "~/server/db/schema";
import { avg, eq } from "drizzle-orm";

export const ratingRouter = createTRPCRouter({
    getLatestRating: protectedProcedure.query(async ({ctx}) => {
        const ratings = await ctx.db.query.ratings.findMany({
            where: (ratings, {eq}) => eq(ratings.userId, ctx.session.user.id),
            orderBy: (ratings, {desc}) => [desc(ratings.givenAt)],
            limit: 1
        })
    }),
    getAverageRating: protectedProcedure.query(async ({ctx}) => {
        const averageRating = await ctx.db.select({
            value: avg(ratings.value),
            userId: ratings.userId,
        }).from(ratings).groupBy(ratings.userId).having(({userId}) => eq(userId, ctx.session.user.id))

        if (!averageRating) {
            return {
                value: null,
                error: "Server inaccessible. Please try again."
            }
        }

        return {
            value: Number(averageRating[0]?.value).toFixed(2),
            error: null
        }
    })
});
