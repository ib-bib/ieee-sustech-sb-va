import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const certRouter = createTRPCRouter({
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const user = await ctx.db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, userId),
    });

    if (!user || user.teamId === null) {
      return {
        status: "FAILED",
        percentage: -1,
        general: {
          fulfilled: [],
          remaining: [],
        },
        team: {
          fulfilled: [],
          remaining: [],
        },
        suggestions: [],
      };
    }

    const userTeamId = user.teamId;

    // Fetch all user's fulfillments (with condition)
    const fulfillments = await ctx.db.query.conditionFulfillments.findMany({
      where: (cf, { eq }) => eq(cf.userId, userId),
      with: {
        condition: {
          columns: {
            id: true,
            description: true,
            teamId: true,
          },
        },
      },
    });

    const fulfilledConditionIds = fulfillments
      .map((cf) => cf.conditionId)
      .filter((id): id is number => id !== null);

    // Fetch all relevant conditions: general + team-specific
    const allRelevantConditions =
      await ctx.db.query.certificateConditions.findMany({
        where: (condition, { eq, or }) =>
          or(eq(condition.teamId, 0), eq(condition.teamId, userTeamId)),
        columns: {
          id: true,
          description: true,
          teamId: true,
        },
      });

    // Split into general and team-specific
    const generalConditions = allRelevantConditions.filter(
      (c) => c.teamId === 0,
    );
    const teamConditions = allRelevantConditions.filter(
      (c) => c.teamId === userTeamId,
    );

    const fulfilledGeneral = generalConditions.filter((c) =>
      fulfilledConditionIds.includes(c.id),
    );
    const fulfilledTeam = teamConditions.filter((c) =>
      fulfilledConditionIds.includes(c.id),
    );

    const remainingGeneral = generalConditions.filter(
      (c) => !fulfilledConditionIds.includes(c.id),
    );
    const remainingTeam = teamConditions.filter(
      (c) => !fulfilledConditionIds.includes(c.id),
    );

    // Generate suggestions (prioritize general first)
    const suggestions = [...remainingGeneral, ...remainingTeam]
      .slice(0, 2)
      .map((c) => ({
        id: c.id,
        description: c.description,
      }));

    const percentage = (
      (100 * (fulfilledGeneral.length + fulfilledTeam.length)) /
      (fulfilledGeneral.length +
        fulfilledTeam.length +
        remainingGeneral.length +
        remainingTeam.length)
    ).toFixed(2);

    return {
      status: "OK",
      percentage,
      general: {
        fulfilled: fulfilledGeneral,
        remaining: remainingGeneral,
      },
      team: {
        fulfilled: fulfilledTeam,
        remaining: remainingTeam,
      },
      suggestions,
    };
  }),
});
