import {
  pgTable,
  text,
  serial,
  integer,
  varchar,
  timestamp,
  foreignKey,
  primaryKey,
  doublePrecision,
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
  chapterLength: text("chapter_length").default("100-200"),
  temperature: integer("temperature").default(5),
  createdAt: timestamp("created_at").defaultNow(),
});

// Chapter model
export const chapters = pgTable("chapters", {
  id: serial("id").primaryKey(),
  storyId: integer("story_id").notNull(),
  parentId: integer("parent_id"),
  title: text("title").notNull(),
  content: text("content").notNull(),
  summary: text("summary"),
  prompt: text("prompt"),
  isRoot: integer("is_root").default(0),
  isEnding: integer("is_ending").default(0),
  path: text("path"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Character model
export const characters = pgTable("characters", {
  id: serial("id").primaryKey(),
  storyId: integer("story_id").notNull(),
  name: text("name").notNull(),
  age: text("age"),
  background: text("background"),
  personality: text("personality"),
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

export const insertCharacterSchema = createInsertSchema(characters).omit({
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

export type Character = typeof characters.$inferSelect;
export type InsertCharacter = z.infer<typeof insertCharacterSchema>;

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
  chapterLength: z.enum(["100-200", "200-300", "300-400"]).optional().default("100-200"),
  temperature: z.number().int().min(1).max(9).optional().default(5),
  characters: z.array(
    z.object({
      name: z.string(),
      age: z.string().optional(),
      background: z.string().optional(),
      personality: z.string().optional(),
    })
  ).optional(),
});

export const createCharacterSchema = z.object({
  storyId: z.number(),
  name: z.string(),
  age: z.string().optional(),
  background: z.string().optional(),
  personality: z.string().optional(),
});

export const continueStorySchema = z.object({
  storyId: z.number(),
  chapterId: z.number(),
  selectedOptionId: z.number().optional(),
  customPrompt: z.string().optional(),
});

export type CreateStoryInput = z.infer<typeof createStorySchema>;
export type CreateCharacterInput = z.infer<typeof createCharacterSchema>;
export type ContinueStoryInput = z.infer<typeof continueStorySchema>;
