import { NextResponse, type NextRequest } from "next/server";
import { authenticateMobileRequest } from "~/server/api/middleware/mobile_auth";
import { db } from "~/server/db";

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

  const ratingHistory = await db.query.ratings.findMany({
    where: (ratings, { eq }) => eq(ratings.userId, user.id),
    orderBy: (ratings, { asc }) => asc(ratings.month),
  });

  if (!ratingHistory) {
    return NextResponse.json(
      {
        value: null,
        error: "Server error. Please try again",
      },
      { status: 500 },
    );
  } // end of ratings length check

  return NextResponse.json(
    ratingHistory.length > 0
      ? {
          value: ratingHistory,
          error: null,
        }
      : {
          value: null,
          error: "No ratings recorded yet",
        },
    { status: ratingHistory.length > 0 ? 200 : 500 },
  );
}
