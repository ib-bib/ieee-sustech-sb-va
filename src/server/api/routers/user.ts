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
import { TRPCError } from "@trpc/server";

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
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { oldPassword, newPassword } = input;

      const user = await ctx.db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, ctx.session.user.id),
      });

      if (!user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unknown server error. Please try again later.",
        });
      }

      const isOldPasswordCorrect = await bcrypt.compare(
        oldPassword,
        user.password,
      );

      if (!isOldPasswordCorrect) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Incorrect current password.",
        });
      }

      const newPassIsSameAsOld = await bcrypt.compare(
        newPassword,
        user.password,
      );

      if (newPassIsSameAsOld) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "New password cannot be the same as the previous one.",
        });
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      const updatedUser = await ctx.db
        .update(users)
        .set({
          password: hashedNewPassword,
        })
        .where(eq(users.id, ctx.session.user.id))
        .returning({ name: users.name });

      if (!updatedUser[0]) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Server error. Please try again.",
        });
      }

      return updatedUser[0].name;
    }),

  sendVerificationLink: publicProcedure
    .input(
      z.object({
        email: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { email } = input;

      const user = await ctx.db.query.users.findFirst({
        where: (u, { eq }) => eq(u.email, email),
      });
    }),

  sendForgotPasswordLink: publicProcedure
    .input(
      z.object({
        email: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { email } = input;

      const user = await ctx.db.query.users.findFirst({
        where: (u, { eq }) => eq(u.email, email),
      });
    }),
});
