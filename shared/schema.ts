import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Blog Posts Table
export const blogPosts = pgTable("blog_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title_ko: text("title_ko").notNull(),
  title_en: text("title_en"),
  title_vi: text("title_vi"),
  title_th: text("title_th"),
  content_ko: text("content_ko").notNull(),
  content_en: text("content_en"),
  content_vi: text("content_vi"),
  content_th: text("content_th"),
  excerpt_ko: text("excerpt_ko"),
  excerpt_en: text("excerpt_en"),
  excerpt_vi: text("excerpt_vi"),
  excerpt_th: text("excerpt_th"),
  slug: text("slug").notNull().unique(),
  category: text("category"),
  tags: jsonb("tags").$type<string[]>().default([]),
  featured_image: text("featured_image"),
  author: text("author").default("Admin"),
  is_published: boolean("is_published").default(false),
  published_at: timestamp("published_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBlogPostSchema = createInsertSchema(blogPosts, {
  tags: z.array(z.string()).optional(),
}).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;
