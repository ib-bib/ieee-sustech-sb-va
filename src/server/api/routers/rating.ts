import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { ratings } from "~/server/db/schema";
import { avg, eq } from "drizzle-orm";

export const ratingRouter = createTRPCRouter({
  getLatestRating: protectedProcedure.query(async ({ ctx }) => {
    const ratings = await ctx.db.query.ratings.findMany({
      where: (ratings, { eq }) => eq(ratings.userId, ctx.session.user.id),
      orderBy: (ratings, { desc }) => [desc(ratings.givenAt)],
      limit: 1,
    });

    if (!ratings.length) {
      return {
        value: null,
        error: "Server error. Please try again",
      };
    }

    return ratings[0]?.value
      ? {
          value: ratings[0].value,
          error: null,
        }
      : {
          value: null,
          error: "No ratings recorded yet",
        };
  }),

  getAverageRating: protectedProcedure.query(async ({ ctx }) => {
    const averageRating = await ctx.db
      .select({
        value: avg(ratings.value),
        userId: ratings.userId,
      })
      .from(ratings)
      .groupBy(ratings.userId)
      .having(({ userId }) => eq(userId, ctx.session.user.id));

    if (!averageRating) {
      return {
        value: null,
        error: "Server error. Please try again.",
      };
    }

    return {
      value: Number(averageRating[0]?.value).toFixed(2),
      error: null,
    };
  }),

  getRatingsHistory: protectedProcedure.query(async ({ ctx }) => {
    const ratingHistory = await ctx.db.query.ratings.findMany({
      where: (ratings, { eq }) => eq(ratings.userId, ctx.session.user.id),
      orderBy: (ratings, { asc }) => asc(ratings.month),
    });

    if (!ratingHistory) {
      return {
        value: null,
        error: "Server error. Please try again.",
      };
    }

    return ratingHistory.length > 0
      ? {
          value: ratingHistory,
          error: null,
        }
      : {
          value: [],
          error: "No recorded history yet",
        };
  }),
});
