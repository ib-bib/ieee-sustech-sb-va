import { DrizzleAdapter } from "@auth/drizzle-adapter";
import bcrypt from "bcryptjs";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { env } from "~/env";

import { db } from "~/server/db";
import { eq } from "drizzle-orm";
import {
  accounts,
  passwordResetTokens,
  sessions,
  users,
  roles,
} from "~/server/db/schema";

type UserRole = {
  id: number;
  name: string | null;
};

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role?: UserRole;
      isFirstLogin?: boolean;
      // ...other properties
    } & DefaultSession["user"];
  }

  interface User {
    role?: UserRole;
    isFirstLogin?: boolean;
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  pages: {
    signIn: "/login",
    signOut: "/",
  },
  providers: [
    Credentials({
      id: "credentials",
      name: "Password Login",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "name@example.com",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      authorize: async (credentials) => {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (!parsedCredentials.success) {
          throw new Error(
            "Invalid input. Please provide a valid email and password (min 6 characters).",
          );
        }

        const { email, password } = parsedCredentials.data;

        const user = await db.query.users.findFirst({
          where: (users, { eq }) => eq(users.email, email),
          with: {
            role: true,
          },
        });

        if (!user?.password) {
          throw new Error("User not found");
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role ?? undefined,
          isFirstLogin: !!user.isFirstLogin,
        };
      },
    }),
    Credentials({
      id: "otp-credentials",
      name: "OTP Login",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "name@example.com",
        },
        otp: {
          label: "One-Time Password",
          type: "text",
          placeholder: "123456",
        },
      },
      authorize: async (credentials) => {
        const parsedCredentials = z
          .object({ email: z.string().email(), otp: z.string().min(6) })
          .safeParse(credentials);

        if (!parsedCredentials.success) {
          throw new Error(
            "Invalid input. Please provide a valid email and OTP (min 6 characters).",
          );
        }

        const { email, otp } = parsedCredentials.data;

        const user = await db.query.users.findFirst({
          where: (users, { eq }) => eq(users.email, email),
          with: {
            role: true,
          },
        });

        if (!user) {
          throw new Error("User not found");
        }

        const now = new Date();

        const validToken = await db.query.passwordResetTokens.findMany({
          where: (t, { eq, and, gt }) =>
            and(
              eq(t.tokenCode, otp),
              eq(t.userId, user.id),
              gt(t.expiresAt, now),
            ),
          orderBy: (t, { desc }) => desc(t.createdAt),
          limit: 1,
        });

        if (!validToken[0]) throw new Error("Invalid or expired OTP");

        const updatedToken = await db
          .update(passwordResetTokens)
          .set({
            expiresAt: now,
          })
          .where(eq(passwordResetTokens.id, validToken[0].id))
          .returning();

        if (!updatedToken)
          throw new Error("Unknown server error. Please try again.");

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role ?? undefined,
          isFirstLogin: !!user.isFirstLogin,
        };
      },
    }),
  ],
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
  }),
  session: {
    strategy: "jwt",
    maxAge: 15 * 24 * 60 * 60, // 15 days
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = user.role ?? undefined;
        token.isFirstLogin = !!user.isFirstLogin;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.isFirstLogin = token.isFirstLogin as boolean;
      }
      return session;
    },
  },
  secret: env.AUTH_SECRET,
} satisfies NextAuthConfig;
