import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";
import { authenticateMobileRequest } from "~/server/api/middleware/mobile_auth";
import bcrypt from "bcryptjs";
import { customAlphabet } from "nanoid";
import nodemailer from "nodemailer";
import { env } from "~/env";

const URL =
  env.NODE_ENV === "production"
    ? "https://ieee-sustech-sb-va.vercel.app"
    : "http://localhost:3000";

const CreateUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
});

// GET: Retrieve all users in the HR user's team
export async function GET(req: NextRequest) {
  try {
    const { user, response } = await authenticateMobileRequest(req);

    if (!user || response) {
      return (
        response ??
        NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      );
    }

    // Get the authenticated user's full details
    const authUser = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.email, user.email),
    });

    if (!authUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is HR
    const userRole = await db.query.roles.findFirst({
      where: (r, { eq }) => eq(r.id, authUser.roleId),
    });

    if (userRole?.name !== "HR") {
      return NextResponse.json(
        { error: "Only HR members can access this endpoint" },
        { status: 403 },
      );
    }

    // Get all users in the same team
    if (!authUser.teamId) {
      return NextResponse.json(
        { error: "User has no team assigned" },
        { status: 400 },
      );
    }

    const teamUsers = await db.query.users.findMany({
      where: (u, { eq }) => eq(u.teamId, authUser.teamId),
      orderBy: (u, { desc }) => desc(u.joinedOn),
    });

    // Get role mapping
    const rolesList = await db.query.roles.findMany();
    const roleMap = new Map(rolesList.map((r) => [r.id, r.name]));

    const result = teamUsers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      roleId: u.roleId,
      role: roleMap.get(u.roleId),
      joinDate: u.joinedOn,
      isActive: u.isActive,
    }));

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Mobile get users API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

// POST: Create a new user (HR only)
export async function POST(req: NextRequest) {
  try {
    const { user, response } = await authenticateMobileRequest(req);

    if (!user || response) {
      return (
        response ??
        NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      );
    }

    // Get the authenticated user's full details
    const authUser = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.email, user.email),
    });

    if (!authUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is HR
    const userRole = await db.query.roles.findFirst({
      where: (r, { eq }) => eq(r.id, authUser.roleId),
    });

    if (userRole?.name !== "HR") {
      return NextResponse.json(
        { error: "Only HR members can create users" },
        { status: 403 },
      );
    }

    const body = (await req.json()) as unknown;
    const validationResult = CreateUserSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: validationResult.error.errors,
        },
        { status: 400 },
      );
    }

    const { name, email } = validationResult.data;

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.email, email),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 },
      );
    }

    if (!authUser.teamId) {
      return NextResponse.json(
        { error: "HR user has no team assigned" },
        { status: 400 },
      );
    }

    // Generate temporary password
    const tempPassword = customAlphabet(
      "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
      10,
    )();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Create user
    const createdUsers = await db
      .insert(users)
      .values({
        name,
        email,
        password: hashedPassword,
        teamId: authUser.teamId,
        roleId: 1,
        isFirstLogin: true,
      })
      .returning({ id: users.id });

    const createdUserId = createdUsers[0]?.id;

    if (!createdUserId) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 },
      );
    }

    // Send email with credentials
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
    } catch (err) {
      console.error("Email service verification failed:", err);
      // Continue without email - user was created successfully
    }

    try {
      await transporter.sendMail({
        from: `"IEEE SUSTech SB" ${env.EMAIL_ADDRESS}`,
        to: email,
        subject: "Account Created",
        text: `Welcome! Your account has been created\nPlease use the following credentials to login, then change your password\nPassword: ${tempPassword}\nLogin: ${URL}/login`,
        html: `Welcome! Your account has been created<br />Please use the following credentials to login, then change your password<br /><b>Password: ${tempPassword}</b><br />Login: <a href="${URL}/login">${URL}/login</a>`, // HTML body
      });
    } catch (err) {
      console.error("Error sending email:", err);
      // Continue - user was created successfully
    }

    return NextResponse.json(
      {
        message: "User created successfully",
        userId: createdUserId,
        email,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Mobile create user API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
