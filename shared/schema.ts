import {
  pgTable,
  text,
  serial,
  integer,
  varchar,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Story model
export const stories = pgTable("stories", {
  id: serial("id").primaryKey(),
  title: text("title"),
  genre: text("genre"),
  narrativeStyle: text("narrative_style"),
  setting: text("setting"),
  targetAudience: text("target_audience"),
  mainCharacter: text("main_character"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Chapter model
export const chapters = pgTable("chapters", {
  id: serial("id").primaryKey(),
  storyId: integer("story_id").notNull(),
  parentId: integer("parent_id"),
  title: text("title").notNull(),
  content: text("content").notNull(),
  prompt: text("prompt"),
  isRoot: integer("is_root").default(0),
  path: text("path"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Continuation options model
export const continuationOptions = pgTable("continuation_options", {
  id: serial("id").primaryKey(),
  chapterId: integer("chapter_id").notNull(),
  title: text("title").notNull(),
  preview: text("preview").notNull(),
  prompt: text("prompt").notNull(),
});

// Create schemas
export const insertStorySchema = createInsertSchema(stories).omit({
  id: true,
  createdAt: true,
});

export const insertChapterSchema = createInsertSchema(chapters).omit({
  id: true,
  createdAt: true,
});

export const insertContinuationOptionSchema = createInsertSchema(
  continuationOptions,
).omit({
  id: true,
});

// Create types
export type Story = typeof stories.$inferSelect;
export type InsertStory = z.infer<typeof insertStorySchema>;

export type Chapter = typeof chapters.$inferSelect;
export type InsertChapter = z.infer<typeof insertChapterSchema>;

export type ContinuationOption = typeof continuationOptions.$inferSelect;
export type InsertContinuationOption = z.infer<
  typeof insertContinuationOptionSchema
>;

// Specialized schemas for validation
export const createStorySchema = z.object({
  title: z.string().optional(),
  genre: z.string().optional(),
  narrativeStyle: z.string().optional(),
  setting: z.string().optional(),
  targetAudience: z.string().optional(),
  mainCharacter: z.string().optional(),
});

export const continueStorySchema = z.object({
  storyId: z.number(),
  chapterId: z.number(),
  selectedOptionId: z.number().optional(),
  customPrompt: z.string().optional(),
});

export type CreateStoryInput = z.infer<typeof createStorySchema>;
export type ContinueStoryInput = z.infer<typeof continueStorySchema>;
