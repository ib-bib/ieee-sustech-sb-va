import { relations, sql } from "drizzle-orm";
import { index, pgTableCreator, primaryKey } from "drizzle-orm/pg-core";
import { type AdapterAccount } from "@auth/core/adapters";

export const createTable = pgTableCreator(
  (name) => `ieee-sustech-sb-va_${name}`,
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
  email: d.varchar({ length: 255 }).notNull(),
  password: d.varchar({ length: 255 }).notNull(),
  emailVerified: d
    .timestamp({
      mode: "date",
      withTimezone: true,
    })
    .default(sql`CURRENT_TIMESTAMP`),
  image: d.varchar({ length: 255 }),
  teamId: d.integer().references(() => teams.id),
  roleId: d.integer().references(() => roles.id),
}));

export const usersRelations = relations(users, ({ many, one }) => ({
  accounts: many(accounts),
  flags: many(flags),
  posts: many(posts),
  sessions: many(sessions),
  ratings: many(ratings),
  conditionFulfillments: many(conditionFulfillments),
  team: one(teams),
  role: one(roles),
  suspensions: many(userSuspensions),
  // notifications - with email
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

export const userSuspensionsRelations = relations(
  userSuspensions,
  ({ one }) => ({
    user: one(users),
  }),
);

export const roles = createTable("role", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  name: d.varchar({ length: 255 }),
}));

export const userRolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
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

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

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

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = createTable(
  "verification_token",
  (d) => ({
    identifier: d.varchar({ length: 255 }).notNull(),
    token: d.varchar({ length: 255 }).notNull(),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
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

export const flagsRelations = relations(flags, ({ one }) => ({
  user: one(users, { fields: [flags.userId], references: [users.id] }),
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

export const ratingsRelations = relations(ratings, ({ one }) => ({
  user: one(users, { fields: [ratings.userId], references: [users.id] }),
}));

export const teams = createTable("team", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  name: d.varchar({ length: 255 }).unique(),
  description: d.varchar({ length: 510 }),
}));

export const teamsRelations = relations(teams, ({ many }) => ({
  certificateConditions: many(certificateConditions),
}));

export const certificateConditions = createTable(
  "certification_condition",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    teamId: d.integer().references(() => teams.id),
    description: d.varchar({ length: 510 }),
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

// table for events
// sponsor
// coordinator - user ID

// event participation table

// USER avg rating calculated once a month - should be cached and in session
