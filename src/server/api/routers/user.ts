import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import bcrypt from "bcryptjs";
import { passwordResetTokens, users, roles } from "~/server/db/schema";
import { customAlphabet } from "nanoid";
import nodemailer from "nodemailer";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { env } from "~/env";

const URL =
  env.NODE_ENV === "production"
    ? "https://ieee-sustech-sb-va.vercel.app"
    : "http://localhost:3000";

export const userRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        roleId: z.number(),
        joinDate: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to create a user.",
        });
      }

      const { name, email } = input;

      const existingUser = await ctx.db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, email),
      });

      if (existingUser) {
        throw new Error("User with this email already exists.");
      }

      const password = customAlphabet(
        "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
        10,
      )();

      const hashedPassword = await bcrypt.hash(password, 10);

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
          to: email, // recipient
          subject: "Volunteer Platform Credentials",
          text: `Welcome! Your account has been created\nPlease use the following credentials to login, then change your password\nPassword: ${password}\nLogin: ${URL}/login`,
          html: `Welcome! Your account has been created<br />Please use the following credentials to login, then change your password<br /><b>Password: ${password}</b><br />Login: <a href="${URL}/login">${URL}/login</a>`, // HTML body
        });

        console.log("Message sent: %s", info.messageId);
      } catch (err) {
        console.error("Error while sending mail:", err);
        return {
          error: true,
          message: err,
        };
      }

      const roleQuery = await ctx.db.query.roles.findFirst({
        where: (r, { eq }) => eq(r.id, input.roleId),
      });

      if (!roleQuery) {
        throw new Error("Role not found.");
      }

      const hrUser = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.session.user.id),
      });

      if (!hrUser?.teamId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "HR user has no team.",
        });
      }

      return ctx.db.insert(users).values({
        name,
        email,
        password: hashedPassword,
        roleId: roleQuery.id,
        joinedOn: new Date(input.joinDate).toISOString(),
        teamId: hrUser.teamId,
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

  resetPassword: protectedProcedure
    .input(
      z.object({
        newPassword: z.string().min(6),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { newPassword } = input;

      const user = await ctx.db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, ctx.session.user.id),
      });

      if (!user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unknown server error. Please try again later.",
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

  sendForgotPasswordOTP: publicProcedure
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

      if (!user?.isVerified)
        return {
          error: true,
          message: "User Not Registered: " + email,
        };

      const token = customAlphabet("0123456789", 6)();

      const otps = await ctx.db
        .insert(passwordResetTokens)
        .values({
          userId: user.id,
          tokenCode: token,
        })
        .returning();

      if (!otps) {
        return {
          error: true,
          message: "Error while generating OTP. Please try again.",
        };
      }

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
          subject: "One-Time Passcode to update your password", // subject line
          text: "Your OTP is as follows: " + token, // plain text body
          html: `Your OTP is as follows: <b>${token}</b>`, // HTML body
        });

        console.log("Message sent: %s", info.messageId);

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

  createUserByHR: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { name, email } = input;

      if (ctx.session.user.role?.name !== "HR") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only HR can create users.",
        });
      }

      const existingUser = await ctx.db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User with this email already exists.",
        });
      }

      const hrUser = await ctx.db.query.users.findFirst({
        where: eq(users.id, ctx.session.user.id),
      });

      if (!hrUser?.teamId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "HR user has no team.",
        });
      }

      const password = customAlphabet(
        "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
        10,
      )();

      const hashedPassword = await bcrypt.hash(password, 10);

      const createdUsers = await ctx.db
        .insert(users)
        .values({
          name,
          email,
          password: hashedPassword,
          teamId: hrUser.teamId,
          roleId: 1,
          isFirstLogin: true,
        })
        .returning({ id: users.id });

      const transporter = nodemailer.createTransport({
        host: "smtp.google.com",
        port: 465,
        service: "gmail",
        auth: {
          user: env.EMAIL_ADDRESS,
          pass: env.EMAIL_PASS,
        },
      });

      try {
        await transporter.verify();
        console.log("Google Email Service is ready to take our messages");
      } catch (err) {
        console.error("Could Not Connect To Google Email Service", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Email service error.",
        });
      }

      try {
        const info = await transporter.sendMail({
          from: `"IEEE SUSTech SB" ${env.EMAIL_ADDRESS}`,
          to: email,
          subject: "Account Created",
          text: `Your account has been created by your HR. Please login at ${URL}/login and set your password.`,
          html: `Your account has been created by your HR. Please login at <a href="${URL}/login">${URL}/login</a> and set your password.`,
        });

        console.log("Message sent: %s", info.messageId);
      } catch (err) {
        console.error("Error while sending mail:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send email.",
        });
      }

      return {
        id: createdUsers[0]?.id,
        email,
      };
    }),

  roles: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.query.roles.findMany({
      orderBy: (r, { asc }) => asc(r.id),
    });
    return rows.map((r) => ({ id: r.id, name: r.name }));
  }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    const hrUser = await ctx.db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, ctx.session.user.id),
    });

    if (!hrUser?.teamId) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "User has no team",
      });
    }

    const members = await ctx.db.query.users.findMany({
      where: (u, { eq }) => eq(u.teamId, hrUser.teamId),
      orderBy: (u, { desc }) => desc(u.joinedOn),
    });

    const rolesList = await ctx.db.query.roles.findMany();
    const roleMap = new Map(rolesList.map((r) => [r.id, r.name]));

    return members.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      roleId: m.roleId,
      role: roleMap.get(m.roleId),
      joinDate: m.joinedOn,
      isActive: m.isActive,
    }));
  }),

  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, input.id),
      });
      if (!user)
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      const roleRow = await ctx.db.query.roles.findFirst({
        where: (r, { eq }) => eq(r.id, user.roleId),
      });
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        roleId: user.roleId,
        role: roleRow?.name ?? null,
        joinDate: user.joinedOn,
        isActive: user.isActive,
      };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1),
        email: z.string().email(),
        roleId: z.number(),
        joinDate: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, input.id),
      });
      if (!user)
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

      const roleRow = await ctx.db.query.roles.findFirst({
        where: (r, { eq }) => eq(r.id, input.roleId),
      });
      if (!roleRow)
        throw new TRPCError({ code: "BAD_REQUEST", message: "Role not found" });

      await ctx.db
        .update(users)
        .set({
          name: input.name,
          email: input.email,
          roleId: roleRow.id,
          joinedOn: new Date(input.joinDate).toISOString(),
        })
        .where(eq(users.id, input.id));

      return { success: true };
    }),

  deactivate: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, input.id),
      });
      if (!user)
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      await ctx.db
        .update(users)
        .set({ isActive: false })
        .where(eq(users.id, input.id));
      return { success: true };
    }),
});
