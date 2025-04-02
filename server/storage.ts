import 'dotenv/config';
import db from './db';
import { eq, and, desc } from 'drizzle-orm';
import {
  type Story,
  type InsertStory,
  type Chapter,
  type InsertChapter,
  type Character,
  type InsertCharacter,
  type ContinuationOption,
  type InsertContinuationOption,
  stories,
  chapters,
  characters,
  continuationOptions,
} from '@shared/schema';

export interface IStorage {
  // Story methods
  getStories(): Promise<Story[]>;
  getStory(id: number): Promise<Story | undefined>;
  createStory(story: InsertStory): Promise<Story>;

  // Chapter methods
  getChapter(id: number): Promise<Chapter | undefined>;
  getChaptersByStoryId(storyId: number): Promise<Chapter[]>;
  getRootChapter(storyId: number): Promise<Chapter | undefined>;
  getChapterPath(chapterId: number): Promise<Chapter[]>;
  createChapter(chapter: InsertChapter): Promise<Chapter>;
  getNextChapterByOption(
    parentChapterId: number,
    optionId: number,
  ): Promise<Chapter | undefined>;
  getAllChapters(storyId: number): Promise<Chapter[]>;

  // Character methods
  getCharacters(storyId: number): Promise<Character[]>;
  getCharacter(id: number): Promise<Character | undefined>;
  createCharacter(character: InsertCharacter): Promise<Character>;

  // Continuation options methods
  getContinuationOptions(chapterId: number): Promise<ContinuationOption[]>;
  createContinuationOption(
    option: InsertContinuationOption,
  ): Promise<ContinuationOption>;
  getContinuationOption(id: number): Promise<ContinuationOption | undefined>;
}

export class DrizzleStorage implements IStorage {
  private db = db;

  // Story-Methoden
  async getStories(): Promise<Story[]> {
    const result = await this.db
        .select()
        .from(stories)
        .orderBy(desc(stories.id));
    return result as Story[];
  }

  async getStory(id: number): Promise<Story | undefined> {
    const result = await this.db
        .select()
        .from(stories)
        .where(eq(stories.id, id));
    return result[0] as Story | undefined;
  }

  async createStory(storyData: InsertStory): Promise<Story> {
    const [newStory] = await this.db.insert(stories).values({
      title: storyData.title || null,
      genre: storyData.genre || null,
      narrativeStyle: storyData.narrativeStyle || null,
      setting: storyData.setting || null,
      targetAudience: storyData.targetAudience || null,
      mainCharacter: storyData.mainCharacter || null,
      chapterLength: storyData.chapterLength || '100-200',
      temperature: storyData.temperature || 5,
      createdAt: new Date(),
    }).returning();
    return newStory as Story;
  }

  // Chapter-Methoden
  async getChapter(id: number): Promise<Chapter | undefined> {
    const result = await this.db
        .select()
        .from(chapters)
        .where(eq(chapters.id, id));
    return result[0] as Chapter | undefined;
  }

  async getChaptersByStoryId(storyId: number): Promise<Chapter[]> {
    const result = await this.db
        .select()
        .from(chapters)
        .where(eq(chapters.storyId, storyId));
    return result as Chapter[];
  }

  async getRootChapter(storyId: number): Promise<Chapter | undefined> {
    const result = await this.db
        .select()
        .from(chapters)
        .where(and(eq(chapters.storyId, storyId), eq(chapters.isRoot, 1)));
    return result[0] as Chapter | undefined;
  }

  async getChapterPath(chapterId: number): Promise<Chapter[]> {
    const path: Chapter[] = [];
    let currentChapter = await this.getChapter(chapterId);
    while (currentChapter) {
      path.unshift(currentChapter);
      if (!currentChapter.parentId) break;
      currentChapter = await this.getChapter(currentChapter.parentId);
    }
    return path;
  }

  async createChapter(chapterData: InsertChapter): Promise<Chapter> {
    // Zuerst wird der Chapter ohne den Pfad eingefügt
    const [newChapter] = await this.db.insert(chapters).values({
      storyId: chapterData.storyId,
      title: chapterData.title,
      parentId: chapterData.parentId || null,
      content: chapterData.content,
      summary: chapterData.summary || null,
      prompt: chapterData.prompt || null,
      isRoot: chapterData.isRoot || 0,
      isEnding: chapterData.isEnding || 0,
      createdAt: new Date(),
      path: '', // Temporär, wird danach aktualisiert
    }).returning();

    // Den Pfad anhand des Elternkapitels berechnen
    let pathString = `${newChapter.id}`;
    if (chapterData.parentId) {
      const parentChapter = await this.getChapter(chapterData.parentId);
      if (parentChapter && parentChapter.path) {
        pathString = `${parentChapter.path}-${newChapter.id}`;
      }
    }

    // Update des Kapitels mit dem berechneten Pfad
    await this.db.update(chapters)
        .set({ path: pathString })
        .where(eq(chapters.id, newChapter.id));

    const updatedChapter = await this.getChapter(newChapter.id);
    if (!updatedChapter) throw new Error("Chapter nicht gefunden");
    return updatedChapter;
  }

  async getNextChapterByOption(
      parentChapterId: number,
      optionId: number,
  ): Promise<Chapter | undefined> {
    const option = await this.getContinuationOption(optionId);
    if (!option || option.chapterId !== parentChapterId) {
      return undefined;
    }
    const result = await this.db
        .select()
        .from(chapters)
        .where(and(eq(chapters.parentId, parentChapterId), eq(chapters.prompt, option.prompt)));
    return result[0] as Chapter | undefined;
  }

  async getAllChapters(storyId: number): Promise<Chapter[]> {
    const result = await this.db
        .select()
        .from(chapters)
        .where(eq(chapters.storyId, storyId))
        .orderBy(chapters.path);
    return result as Chapter[];
  }

  // Character-Methoden
  async getCharacters(storyId: number): Promise<Character[]> {
    const result = await this.db
        .select()
        .from(characters)
        .where(eq(characters.storyId, storyId));
    return result as Character[];
  }

  async getCharacter(id: number): Promise<Character | undefined> {
    const result = await this.db
        .select()
        .from(characters)
        .where(eq(characters.id, id));
    return result[0] as Character | undefined;
  }

  async createCharacter(characterData: InsertCharacter): Promise<Character> {
    const [newCharacter] = await this.db.insert(characters).values({
      storyId: characterData.storyId,
      name: characterData.name,
      age: characterData.age || null,
      background: characterData.background || null,
      personality: characterData.personality || null,
      createdAt: new Date(),
    }).returning();
    return newCharacter as Character;
  }

  // ContinuationOption-Methoden
  async getContinuationOptions(chapterId: number): Promise<ContinuationOption[]> {
    const result = await this.db
        .select()
        .from(continuationOptions)
        .where(eq(continuationOptions.chapterId, chapterId));
    return result as ContinuationOption[];
  }

  async createContinuationOption(optionData: InsertContinuationOption): Promise<ContinuationOption> {
    const [newOption] = await this.db.insert(continuationOptions).values({
      chapterId: optionData.chapterId,
      prompt: optionData.prompt,
      title: optionData.title,
      preview: optionData.preview,
    }).returning();
    return newOption as ContinuationOption;
  }

  async getContinuationOption(id: number): Promise<ContinuationOption | undefined> {
    const result = await this.db
        .select()
        .from(continuationOptions)
        .where(eq(continuationOptions.id, id));
    return result[0] as ContinuationOption | undefined;
  }
}

export const storage = new DrizzleStorage();