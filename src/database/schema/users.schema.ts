import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
} from 'drizzle-orm/pg-core';

export const authProviderEnum = pgEnum('auth_provider', ['LOCAL', 'GOOGLE']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  fullName: varchar('fullname', { length: 255 }).notNull(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  mobile: varchar('mobile', { length: 10 }).unique(),
  avatar: text('avatar'),
  bio: text('bio'),

  // Authentication
  password: varchar('password', { length: 255 }),
  authProvider: authProviderEnum('auth_provider').notNull().default('LOCAL'),
  googleId: varchar('google_id', { length: 255 }).unique(),

  // Status
  isEmailVerified: boolean('is_email_verified').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updateAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  lastLoginAt: timestamp('last_login_at'),
});

// FIXED TYPES
export type User = typeof users.$inferSelect; // For reading (contains id, createdAt, etc.)
export type NewUser = typeof users.$inferInsert; // For creating (id, createdAt are optional)
