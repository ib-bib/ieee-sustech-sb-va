import { NextResponse, type NextRequest } from "next/server";
import { authenticateMobileRequest } from "~/server/api/middleware/mobile_auth";
import { db } from "~/server/db";
import { ratings } from "~/server/db/schema";
import { avg, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { user, response } = await authenticateMobileRequest(req);

  if (response) {
    return response; // unauthorized
  }

  if (!user) {
    return NextResponse.json(
      {
        value: null,
        error: "Server error. Please try again",
      },
      { status: 500 },
    );
  }

  const averageRating = await db
    .select({
      value: avg(ratings.value),
      userId: ratings.userId,
    })
    .from(ratings)
    .groupBy(ratings.userId)
    .having(({ userId }) => eq(userId, user.id));

  if (!averageRating) {
    return NextResponse.json(
      {
        value: null,
        error: "Server error. Please try again",
      },
      { status: 500 },
    );
  } // end of ratings length check

  return NextResponse.json(
    {
      value: Number(averageRating[0]?.value).toFixed(2),
      error: null,
    },
    { status: 200 },
  );
}
