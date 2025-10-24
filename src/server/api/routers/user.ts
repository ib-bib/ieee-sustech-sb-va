import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import bcrypt from "bcryptjs";
import { users } from "~/server/db/schema";
import crypto from "crypto";
import dayjs from "dayjs";
import nodemailer from "nodemailer";

export const userRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(6),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { name, email, password } = input;

      const existingUser = await ctx.db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, email),
      });

      if (existingUser) {
        throw new Error("User with this email already exists.");
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      return ctx.db.insert(users).values({
        name,
        email,
        password: hashedPassword,
      });
    }),

  updatePassword: protectedProcedure
    .input(
      z.object({
        password: z.string(),
        confirmedPassword: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { password, confirmedPassword } = input;

      const user = await ctx.db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, ctx.session.user.id),
      });

      if (!user) {
      }
    }),

  sendVerificationLink: publicProcedure
    .input(
      z.object({
        email: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { email } = input;

      const user = await ctx.db.query.users.findFirst({
        where: (u, { eq }) => eq(u.email, email),
      });
    }),
});
