import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";
import { authenticateMobileRequest } from "~/server/api/middleware/mobile_auth";
import { eq } from "drizzle-orm";

const UpdateUserSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email format").optional(),
  roleId: z.number().optional(),
});

// GET: Retrieve a specific user by ID (HR only)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
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

    // Get the requested user
    const targetUser = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, id),
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Ensure user is in the same team
    if (targetUser.teamId !== authUser.teamId) {
      return NextResponse.json(
        { error: "You can only view users in your team" },
        { status: 403 },
      );
    }

    // Get role name
    const role = await db.query.roles.findFirst({
      where: (r, { eq }) => eq(r.id, targetUser.roleId),
    });

    return NextResponse.json(
      {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        roleId: targetUser.roleId,
        role: role?.name,
        joinDate: targetUser.joinedOn,
        isActive: targetUser.isActive,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Mobile get user API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

// PUT: Update a user (HR only)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
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
        { error: "Only HR members can update users" },
        { status: 403 },
      );
    }

    // Get the target user
    const targetUser = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, id),
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Ensure user is in the same team
    if (targetUser.teamId !== authUser.teamId) {
      return NextResponse.json(
        { error: "You can only update users in your team" },
        { status: 403 },
      );
    }

    const body = (await req.json()) as unknown;
    const validationResult = UpdateUserSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: validationResult.error.errors,
        },
        { status: 400 },
      );
    }

    const { name, email, roleId } = validationResult.data;

    // If email is being updated, check for duplicates
    if (email && email !== targetUser.email) {
      const existingUser = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.email, email),
      });
      if (existingUser) {
        return NextResponse.json(
          { error: "Email is already in use" },
          { status: 409 },
        );
      }
    }

    // Validate roleId if provided
    if (roleId) {
      const role = await db.query.roles.findFirst({
        where: (r, { eq }) => eq(r.id, roleId),
      });
      if (!role) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
    }

    // Update user
    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (roleId) updateData.roleId = roleId;

    await db.update(users).set(updateData).where(eq(users.id, id));

    return NextResponse.json(
      { message: "User updated successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Mobile update user API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

// DELETE: Deactivate a user (HR only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
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
        { error: "Only HR members can delete users" },
        { status: 403 },
      );
    }

    // Get the target user
    const targetUser = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, id),
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Ensure user is in the same team
    if (targetUser.teamId !== authUser.teamId) {
      return NextResponse.json(
        { error: "You can only delete users in your team" },
        { status: 403 },
      );
    }

    // Deactivate user instead of deleting
    await db.update(users).set({ isActive: false }).where(eq(users.id, id));

    return NextResponse.json(
      { message: "User deactivated successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Mobile delete user API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
