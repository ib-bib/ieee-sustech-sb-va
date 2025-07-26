import { NextResponse, type NextRequest } from "next/server";
import { authenticateMobileRequest } from "~/server/api/middleware/mobile_auth";
import { db } from "~/server/db";

export async function GET(req: NextRequest) {
  const { user, response } = await authenticateMobileRequest(req);

  if (response) return response;

  if (!user) {
    return NextResponse.json(
      {
        status: "FAILED",
        general: {
          fulfilled: [],
          remaining: [],
        },
        team: {
          fulfilled: [],
          remaining: [],
        },
        suggestions: [],
      },
      { status: 401 },
    );
  }

  // Get user's teamId
  const userTeamId = (
    await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, user.id),
    })
  )?.teamId;

  if (userTeamId === null || userTeamId === undefined) {
    return NextResponse.json(
      {
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
      },
      { status: 400 },
    );
  }

  // Get all user's fulfillments (with condition)
  const fulfillments = await db.query.conditionFulfillments.findMany({
    where: (cf, { eq }) => eq(cf.userId, user.id),
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

  // Fetch all relevant certificate conditions
  const allConditions = await db.query.certificateConditions.findMany({
    where: (condition, { eq, or }) =>
      or(eq(condition.teamId, 0), eq(condition.teamId, userTeamId)),
    columns: {
      id: true,
      description: true,
      teamId: true,
    },
  });

  // Separate into general and team-specific
  const generalConditions = allConditions.filter((c) => c.teamId === 0);
  const teamConditions = allConditions.filter((c) => c.teamId === userTeamId);

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

  // Suggestions from unfulfilled (general first)
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

  return NextResponse.json(
    {
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
    },
    { status: 200 },
  );
}
