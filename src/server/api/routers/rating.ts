import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { ratings } from "~/server/db/schema";

export const userRouter = createTRPCRouter({});
