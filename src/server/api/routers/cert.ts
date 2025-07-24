import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const certRouter = createTRPCRouter({
  getFulfilled: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Get fulfilled conditions with their descriptions
    const fulfillments = await ctx.db.query.conditionFulfillments.findMany({
      where: (cf, { eq }) => eq(cf.userId, userId),
      with: {
        condition: {
          columns: {
            id: true,
            description: true,
          },
        },
      },
    });

    // Extract and filter valid condition IDs (non-null)
    const fulfilledConditionIds = fulfillments
      .map((cf) => cf.conditionId)
      .filter((id): id is number => id !== null);

    // Fetch up to 2 unfulfilled conditions as suggestions
    const suggestions = await ctx.db.query.certificateConditions.findMany({
      where: fulfilledConditionIds.length
        ? (cc, { notInArray }) => notInArray(cc.id, fulfilledConditionIds)
        : undefined,
      limit: 2,
      columns: {
        id: true,
        description: true,
      },
    });

    return {
      status: "OK",
      count: fulfillments.length,
      fulfilled: fulfillments.map((f) => ({
        id: f.conditionId,
        description: f.condition?.description ?? null,
      })),
      suggestions,
    };
  }),
});
