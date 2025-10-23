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

  const ratings = await db.query.ratings.findMany({
    where: (ratings, { eq }) => eq(ratings.userId, user.id),
    orderBy: (ratings, { desc }) => [desc(ratings.givenAt)],
    limit: 1,
  });

  if (!ratings.length) {
    return NextResponse.json(
      {
        value: null,
        error: "Server error. Please try again",
      },
      { status: 500 },
    );
  } // end of ratings length check

  return NextResponse.json(
    ratings[0]?.value
      ? {
          value: ratings[0].value,
          error: null,
        }
      : {
          value: null,
          error: "No ratings recorded yet",
        },
    { status: ratings[0]?.value ? 200 : 500 },
  );
}
