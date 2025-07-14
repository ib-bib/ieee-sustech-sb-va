// import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

// import { flags } from "~/server/db/schema";

export const flagRouter = createTRPCRouter({
  getMyFlags: protectedProcedure.query(async ({ ctx }) => {
    const flags = await ctx.db.query.flags.findMany({
      where: (flags, { eq, and }) =>
        and(eq(flags.userId, ctx.session.user.id), eq(flags.is_active, true)),
    });
    if (!flags) {
      return {
        status: "FAILED",
        yellow_flags: [],
        red_flags: [],
      };
    }
    return flags.length == 0
      ? {
          status: "NO_FLAGS",
          yellow_flags: [],
          red_flags: [],
        }
      : {
          status: "FLAGS_EXIST",
          yellow_flags: flags.filter((flag) => flag.is_yellow == true),
          red_flags: flags.filter((flag) => (flag.is_yellow = false)),
        };
  }),
});
