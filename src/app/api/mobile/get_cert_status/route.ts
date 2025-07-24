import { NextResponse, type NextRequest } from "next/server";
import { authenticateMobileRequest } from "~/server/api/middleware/mobile_auth";
import { db } from "~/server/db";
import { eq, notInArray } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { user, response } = await authenticateMobileRequest(req);

  if (response) return response;

  if (!user) {
    return NextResponse.json(
      {
        status: "FAILED",
        fulfilled: [],
        suggestions: [],
      },
      { status: 500 },
    );
  }

  // Get all fulfilled conditions by this user
  const fulfillments = await db.query.conditionFulfillments.findMany({
    where: (cf, { eq }) => eq(cf.userId, user.id),
    with: {
      condition: {
        columns: {
          description: true,
        },
      },
    },
  });

  // Extract fulfilled condition IDs
  const fulfilledConditionIds = fulfillments
    .map((cf) => cf.conditionId)
    .filter((id): id is number => id !== null); // Ensures type is number[]

  // Get up to 2 unfulfilled conditions
  const suggestions = await db.query.certificateConditions.findMany({
    where: fulfilledConditionIds.length
      ? (cc, { notInArray }) => notInArray(cc.id, fulfilledConditionIds)
      : undefined,
    limit: 2,
    columns: {
      id: true,
      description: true,
    },
  });

  return NextResponse.json(
    {
      status: "OK",
      count: fulfillments.length,
      fulfilled: fulfillments.map((cf) => ({
        id: cf.conditionId,
        description: cf.condition?.description,
      })),
      suggestions,
    },
    { status: 200 },
  );
}
