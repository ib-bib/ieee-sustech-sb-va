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
import { eq } from "drizzle-orm";

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
        oldPassword: z.string(),
        newPassword: z.string(),
        confirmedPassword: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { oldPassword, newPassword, confirmedPassword } = input;

      const user = await ctx.db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, ctx.session.user.id),
      });

      if (!user) {
        return {
          error: "Unknown server error. Please try again later.",
          data: null,
        };
      }

      if (user.password != oldPassword) {
        return {
          error: "Incorrect old password. Please ensure you type it correctly.",
          data: null,
        };
      }

      if (newPassword != confirmedPassword) {
        return {
          error:
            "New password fields don't match. Please ensure you type it correctly twice.",
          data: null,
        };
      }

      const updatedUser = await ctx.db
        .update(users)
        .set({
          password: newPassword,
        })
        .where(eq(users.id, ctx.session.user.id))
        .returning({ name: users.name });

      if (!updatedUser[0]) {
        return {
          error: "Server error. Please try again.",
          data: null,
        };
      }

      return {
        error: null,
        data: updatedUser[0].name,
      };
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
