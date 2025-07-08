import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import bcrypt from "bcryptjs";
import { users } from "~/server/db/schema";

export const userRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(6), // Minimum password length
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { name, email, password } = input;

      // Check if user already exists
      const existingUser = await ctx.db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, email),
      });

      if (existingUser) {
        throw new Error("User with this email already exists.");
      }

      // Hash the password before storing
      const hashedPassword = await bcrypt.hash(password, 10); // 10 salt rounds recommended

      return ctx.db.insert(users).values({
        name,
        email,
        password: hashedPassword,
      });
    }),

  // You might have other user-related procedures here
});
