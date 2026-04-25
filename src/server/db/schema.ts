import { relations, sql } from "drizzle-orm";
import { index, pgEnum, pgTableCreator, primaryKey } from "drizzle-orm/pg-core";
import { type AdapterAccount } from "@auth/core/adapters";
import { request } from "http";

export const createTable = pgTableCreator(
  (name) => `ieee-sustech-sb-va_${name}`,
);

// TABLES

export const verificationTokens = createTable(
  "verification_token",
  (d) => ({
    identifier: d.varchar({ length: 255 }).notNull(),
    token: d.varchar({ length: 255 }).notNull(),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

export const posts = createTable(
  "post",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    name: d.varchar({ length: 256 }),
    createdById: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    createdAt: d
      .timestamp({ withTimezone: true, mode: "date" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d
      .timestamp({ withTimezone: true, mode: "date" })
      .$onUpdate(() => new Date()),
  }),
  (t) => [
    index("created_by_idx").on(t.createdById),
    index("name_idx").on(t.name),
  ],
);

export const users = createTable("user", (d) => ({
  id: d
    .varchar({ length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: d.varchar({ length: 255 }),
  email: d.varchar({ length: 255 }).notNull().unique(),
  password: d.varchar({ length: 255 }).notNull(),
  phone: d.varchar({ length: 15 }),
  emailVerified: d
    .timestamp({
      mode: "date",
      withTimezone: true,
    })
    .default(sql`CURRENT_TIMESTAMP`),
  image: d.varchar({ length: 255 }),
  teamId: d
    .integer()
    .references(() => teams.id)
    .notNull(),
  roleId: d
    .integer()
    .references(() => roles.id)
    .notNull(),
  isVerified: d.boolean("is_verified").default(false),
  isActive: d.boolean("is_active").default(true),
  isFirstLogin: d.boolean("is_first_login").default(true),
  joinedOn: d.date("joined_on"),
}));

export const userSuspensions = createTable("user_suspension", (d) => ({
  id: d
    .varchar({ length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  started_at: d
    .timestamp({ withTimezone: true, mode: "date" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  ended_at: d
    .timestamp({ withTimezone: true, mode: "date" })
    .$onUpdate(() => new Date()),
  userId: d
    .varchar({ length: 255 })
    .notNull()
    .references(() => users.id),
}));

export const roles = createTable("role", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  name: d.varchar({ length: 255 }).unique(),
}));

export const accounts = createTable(
  "account",
  (d) => ({
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    type: d.varchar({ length: 255 }).$type<AdapterAccount["type"]>().notNull(),
    provider: d.varchar({ length: 255 }).notNull(),
    providerAccountId: d.varchar({ length: 255 }).notNull(),
    refresh_token: d.text(),
    access_token: d.text(),
    expires_at: d.integer(),
    givenAt: d
      .timestamp({ withTimezone: true, mode: "date" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    token_type: d.varchar({ length: 255 }),
    scope: d.varchar({ length: 255 }),
    id_token: d.text(),
    session_state: d.varchar({ length: 255 }),
  }),
  (t) => [
    primaryKey({ columns: [t.provider, t.providerAccountId] }),
    index("account_user_id_idx").on(t.userId),
  ],
);

export const sessions = createTable(
  "session",
  (d) => ({
    sessionToken: d.varchar({ length: 255 }).notNull().primaryKey(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [index("t_user_id_idx").on(t.userId)],
);

export const flags = createTable("flag", (d) => ({
  id: d
    .varchar({ length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  is_yellow: d.boolean(),
  is_active: d.boolean(),
  reason: d.varchar({ length: 256 }),
  givenAt: d
    .timestamp({ withTimezone: true, mode: "date" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  userId: d
    .varchar({ length: 255 })
    .notNull()
    .references(() => users.id),
}));

export const ratings = createTable("rating", (d) => ({
  id: d
    .varchar({ length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  value: d.numeric(),
  month: d.integer(),
  year: d.integer(),
  note: d.varchar({ length: 256 }),
  givenAt: d
    .timestamp({ withTimezone: true, mode: "date" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  userId: d
    .varchar({ length: 255 })
    .notNull()
    .references(() => users.id),
}));

export const teams = createTable("team", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  name: d.varchar({ length: 255 }).unique(),
  description: d.varchar({ length: 510 }).unique(),
}));

export const certificateConditions = createTable(
  "certification_condition",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    teamId: d.integer().references(() => teams.id),
    description: d.varchar({ length: 510 }),
  }),
);

export const conditionFulfillments = createTable(
  "condition_fulfillment",
  (d) => ({
    id: d
      .varchar({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    conditionId: d.integer().references(() => certificateConditions.id),
  }),
);

export const events = createTable("event", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  name: d.varchar({ length: 255 }).notNull(),
  description: d.varchar({ length: 1024 }),
  sponsor: d.varchar({ length: 255 }),
  locationName: d.varchar({ length: 255 }),
  locationLink: d.varchar({ length: 510 }),
  startTime: d.timestamp({ withTimezone: true, mode: "date" }).notNull(),
  endTime: d.timestamp({ withTimezone: true, mode: "date" }).notNull(),
  coordinatorId: d.varchar({ length: 255 }).references(() => users.id),
  createdAt: d
    .timestamp({ withTimezone: true, mode: "date" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: d
    .timestamp({ withTimezone: true, mode: "date" })
    .$onUpdate(() => new Date()),
}));

export const eventParticipations = createTable("event_participation", (d) => ({
  id: d
    .varchar({ length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  eventId: d
    .integer()
    .notNull()
    .references(() => events.id),
  userId: d
    .varchar({ length: 255 })
    .notNull()
    .references(() => users.id),
  roleDescription: d.varchar({ length: 255 }), // e.g. executive, planner, coordinator
  joinedAt: d
    .timestamp({ withTimezone: true, mode: "date" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
}));

export const notifications = createTable("notification", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  userId: d
    .varchar({ length: 255 })
    .notNull()
    .references(() => users.id),
  message: d.varchar({ length: 510 }),
  isRead: d.boolean("is_read").default(false).notNull(),
  isCleared: d.boolean("is_cleared").default(false).notNull(),
  createdAt: d
    .timestamp("created_at", { withTimezone: true, mode: "date" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const passwordResetTokens = createTable("password_reset_token", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  userId: d
    .varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id),
  tokenCode: d.varchar("token").notNull(),
  expiresAt: d
    .timestamp("expires_at")
    .default(sql`(now() + interval '24 hours')`)
    .notNull(),
  createdAt: d.timestamp("created_at").defaultNow(),
}));

export const meetingStatusEnum = pgEnum("meeting_status", [
  "started",
  "cancelled",
  "ended",
  "delayed",
  "scheduled",
]);

export const meetings = createTable("meeting", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  meetingCode: d.varchar("meeting_code", { length: 11 }),
  createdAt: d.timestamp("created_at").defaultNow(),
  endedAt: d.timestamp("ended_at"),
  status: meetingStatusEnum(),
}));

export const meetingParticipations = createTable(
  "meeting_participation",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    userId: d
      .varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id),
    meetingId: d
      .integer("meeting_id")
      .notNull()
      .references(() => meetings.id),
    durationAttended: d.integer("duration_attended").notNull(),
  }),
);

export const freeze_request_status_enum = pgEnum("freeze_request_status", [
  "pending",
  "approved",
  "rejected",
]);

export const freezeRequests = createTable("freeze_request", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  userId: d
    .varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id),
  reason: d.varchar("reason", { length: 255 }),
  status: freeze_request_status_enum().default("pending").notNull(),
}));

export const freezes = createTable("freeze", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  userId: d
    .varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id),
  startDate: d.date("start_date").notNull(),
  endDate: d.date("end_date").notNull(),
  requestId: d
    .integer("request_id")
    .notNull()
    .references(() => freezeRequests.id),
}));

// RELATIONS

export const usersRelations = relations(users, ({ many, one }) => ({
  posts: many(posts),
  team: one(teams, { fields: [users.teamId], references: [teams.id] }),
  role: one(roles, { fields: [users.roleId], references: [roles.id] }),
  suspensions: many(userSuspensions),
  notifications: many(notifications),
  eventParticipations: many(eventParticipations),
  coordinatedEvents: many(events),
  conditionFulfillments: many(conditionFulfillments),
  meetingParticipations: many(meetingParticipations),
}));

export const teamsRelations = relations(teams, ({ many }) => ({
  members: many(users),
  certificateConditions: many(certificateConditions),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
}));

export const userSuspensionsRelations = relations(
  userSuspensions,
  ({ one }) => ({
    user: one(users, {
      fields: [userSuspensions.userId],
      references: [users.id],
    }),
  }),
);

export const eventsRelations = relations(events, ({ one, many }) => ({
  coordinator: one(users, {
    fields: [events.coordinatorId],
    references: [users.id],
  }),
  participations: many(eventParticipations),
}));

export const eventParticipationsRelations = relations(
  eventParticipations,
  ({ one }) => ({
    event: one(events, {
      fields: [eventParticipations.eventId],
      references: [events.id],
    }),
    user: one(users, {
      fields: [eventParticipations.userId],
      references: [users.id],
    }),
  }),
);

export const meetingsRelations = relations(meetings, ({ many }) => ({
  participants: many(meetingParticipations),
}));

export const meetingParticipationsRelations = relations(
  meetingParticipations,
  ({ one }) => ({
    user: one(users, {
      fields: [meetingParticipations.userId],
      references: [users.id],
    }),
    meeting: one(meetings, {
      fields: [meetingParticipations.meetingId],
      references: [meetings.id],
    }),
  }),
);

export const certificateConditionsRelations = relations(
  certificateConditions,
  ({ one, many }) => ({
    team: one(teams, {
      fields: [certificateConditions.teamId],
      references: [teams.id],
    }),
    fulfillments: many(conditionFulfillments),
  }),
);

export const conditionFulfillmentsRelations = relations(
  conditionFulfillments,
  ({ one }) => ({
    user: one(users, {
      fields: [conditionFulfillments.userId],
      references: [users.id],
    }),
    condition: one(certificateConditions, {
      fields: [conditionFulfillments.conditionId],
      references: [certificateConditions.id],
    }),
  }),
);

export const freezeRelations = relations(freezes, ({ one }) => ({
  user: one(users, { fields: [freezes.userId], references: [users.id] }),
}));
