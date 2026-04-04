import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import bcrypt from "bcryptjs";
import { passwordResetTokens, users } from "~/server/db/schema";
import { nanoid } from "nanoid";
import dayjs from "dayjs";
import nodemailer from "nodemailer";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { env } from "~/env";

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

  sendForgotPasswordOTP: publicProcedure
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

      if (!user)
        return {
          error: true,
          message: "User Not Registered: " + email,
        };

      const token = 123456;

      const otps = await ctx.db.insert(passwordResetTokens).values({
        userId: user.id,
        tokenCode: String(token),
      });

      const transporter = nodemailer.createTransport({
        host: "smtp.google.com",
        port: 465,
        service: "gmail",
        auth: {
          user: env.EMAIL_ADDRESS,
          pass: env.EMAIL_PASS,
        },
        // auth: {
        //   type: "OAuth2",
        //   user: "me@gmail.com",
        //   clientId: process.env.GOOGLE_CLIENT_ID,
        //   clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        //   refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
        // },
      });

      try {
        await transporter.verify();
        console.log("Google Email Service is ready to take our messages");
      } catch (err) {
        console.error("Could Not Connect To Google Email Service", err);
        return {
          error: true,
          message: err,
        };
      }

      try {
        const info = await transporter.sendMail({
          from: `"IEEE SUSTech SB" ${env.EMAIL_ADDRESS}`, // sender address
          to: email, // list of recipients
          subject: "Hello", // subject line
          text: "Your OTP is as follows: " + token, // plain text body
          html: `Your OTP is as follows: <b>${token}</b>`, // HTML body
        });

        console.log("Message sent: %s", info.messageId);
        // Preview URL is only available when using an Ethereal test account

        return {
          error: false,
          message: "Successfully sent message",
        };
      } catch (err) {
        console.error("Error while sending mail:", err);
        return {
          error: true,
          message: err,
        };
      }
    }),
});
