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
        status: "FAILED",
        yellow_flags: [],
        red_flags: [],
      },
      { status: 500 },
    );
  }

  const userEmail = user.email;
  const userData = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, userEmail),
  });

  if (!userData?.id) {
    return NextResponse.json(
      {
        value: null,
        error: "Server error. Please try again",
      },
      { status: 500 },
    );
  }

  const flags = await db.query.flags.findMany({
    where: (flags, { eq, and }) =>
      and(eq(flags.userId, userData.id), eq(flags.is_active, true)),
  });

  if (!flags) {
    return NextResponse.json(
      {
        status: "FAILED",
        yellow_flags: [],
        red_flags: [],
      },
      { status: 500 },
    );
  }

  if (flags.length === 0) {
    return NextResponse.json(
      {
        status: "NO_FLAGS",
        yellow_flags: [],
        red_flags: [],
      },
      { status: 200 },
    );
  }

  return NextResponse.json(
    {
      status: "FLAGS_EXIST",
      yellow_flags: flags.filter((flag) => flag.is_yellow === true),
      red_flags: flags.filter((flag) => flag.is_yellow === false),
    },
    { status: 200 },
  );
}
