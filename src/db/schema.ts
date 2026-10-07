import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const races = pgTable("races", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 8 }).notNull().unique(),
  status: text("status").notNull().default("lobby"), // lobby | countdown | racing | finished
  difficulty: text("difficulty").notNull().default("medium"), // easy | medium | hard
  raceText: text("race_text").notNull(),
  startAt: timestamp("start_at", { withTimezone: true }),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const racePlayers = pgTable("race_players", {
  id: uuid("id").primaryKey().defaultRandom(),
  raceId: uuid("race_id")
    .notNull()
    .references(() => races.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 40 }).notNull(),
  color: varchar("color", { length: 20 }).notNull(),
  emoji: varchar("emoji", { length: 10 }).notNull(),
  isHost: boolean("is_host").notNull().default(false),
  ready: boolean("ready").notNull().default(false),
  progress: integer("progress").notNull().default(0),
  errors: integer("errors").notNull().default(0),
  wpm: integer("wpm").notNull().default(0),
  accuracy: integer("accuracy").notNull().default(100),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  rank: integer("rank"),
  lastSeen: timestamp("last_seen", { withTimezone: true }).notNull().defaultNow(),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
});
