import {
  type Story,
  type InsertStory,
  type Chapter,
  type InsertChapter,
  type Character,
  type InsertCharacter,
  type ContinuationOption,
  type InsertContinuationOption,
} from "@shared/schema";

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

export class MemStorage implements IStorage {
  private stories: Map<number, Story>;
  private chapters: Map<number, Chapter>;
  private characters: Map<number, Character>;
  private continuationOptions: Map<number, ContinuationOption>;
  private storyIdCounter: number;
  private chapterIdCounter: number;
  private characterIdCounter: number;
  private optionIdCounter: number;

  constructor() {
    this.stories = new Map();
    this.chapters = new Map();
    this.characters = new Map();
    this.continuationOptions = new Map();
    this.storyIdCounter = 1;
    this.chapterIdCounter = 1;
    this.characterIdCounter = 1;
    this.optionIdCounter = 1;
  }

  // Story methods
  async getStories(): Promise<Story[]> {
    return Array.from(this.stories.values()).sort((a, b) => b.id - a.id);
  }

  async getStory(id: number): Promise<Story | undefined> {
    return this.stories.get(id);
  }

  async createStory(storyData: InsertStory): Promise<Story> {
    const id = this.storyIdCounter++;
    const story: Story = {
      id,
      title: storyData.title || null,
      genre: storyData.genre || null,
      narrativeStyle: storyData.narrativeStyle || null,
      setting: storyData.setting || null,
      targetAudience: storyData.targetAudience || null,
      mainCharacter: storyData.mainCharacter || null,
      chapterLength: storyData.chapterLength || "100-200",
      temperature: storyData.temperature || 5,
      createdAt: new Date(),
    };
    this.stories.set(id, story);
    return story;
  }

  // Chapter methods
  async getChapter(id: number): Promise<Chapter | undefined> {
    return this.chapters.get(id);
  }

  async getChaptersByStoryId(storyId: number): Promise<Chapter[]> {
    return Array.from(this.chapters.values()).filter(
      (chapter) => chapter.storyId === storyId,
    );
  }

  async getRootChapter(storyId: number): Promise<Chapter | undefined> {
    return Array.from(this.chapters.values()).find(
      (chapter) => chapter.storyId === storyId && chapter.isRoot === 1,
    );
  }

  async getChapterPath(chapterId: number): Promise<Chapter[]> {
    const path: Chapter[] = [];
    let currentChapter = await this.getChapter(chapterId);

    while (currentChapter) {
      path.unshift(currentChapter);

      if (!currentChapter.parentId) {
        break;
      }

      currentChapter = await this.getChapter(currentChapter.parentId);
    }

    return path;
  }

  async createChapter(chapterData: InsertChapter): Promise<Chapter> {
    const id = this.chapterIdCounter++;

    // Create a path string to identify this branch
    let pathString = `${id}`;
    if (chapterData.parentId) {
      const parentChapter = await this.getChapter(chapterData.parentId);
      if (parentChapter && parentChapter.path) {
        pathString = `${parentChapter.path}-${id}`;
      }
    }

    const chapter: Chapter = {
      id,
      storyId: chapterData.storyId,
      parentId: chapterData.parentId || null,
      title: chapterData.title,
      content: chapterData.content,
      summary: chapterData.summary || null,
      prompt: chapterData.prompt || null,
      isRoot: chapterData.isRoot || null,
      isEnding: chapterData.isEnding || 0,
      path: pathString,
      createdAt: new Date(),
    };

    this.chapters.set(id, chapter);
    return chapter;
  }

  // Continuation options methods
  async getContinuationOptions(
    chapterId: number,
  ): Promise<ContinuationOption[]> {
    return Array.from(this.continuationOptions.values()).filter(
      (option) => option.chapterId === chapterId,
    );
  }

  async createContinuationOption(
    optionData: InsertContinuationOption,
  ): Promise<ContinuationOption> {
    const id = this.optionIdCounter++;
    const option: ContinuationOption = {
      ...optionData,
      id,
    };
    this.continuationOptions.set(id, option);
    return option;
  }

  async getContinuationOption(
    id: number,
  ): Promise<ContinuationOption | undefined> {
    return this.continuationOptions.get(id);
  }

  // Character methods
  async getCharacters(storyId: number): Promise<Character[]> {
    return Array.from(this.characters.values()).filter(
      (character) => character.storyId === storyId,
    );
  }

  async getCharacter(id: number): Promise<Character | undefined> {
    return this.characters.get(id);
  }

  async createCharacter(characterData: InsertCharacter): Promise<Character> {
    const id = this.characterIdCounter++;
    const character: Character = {
      id,
      storyId: characterData.storyId,
      name: characterData.name,
      age: characterData.age || null,
      background: characterData.background || null,
      personality: characterData.personality || null,
      createdAt: new Date(),
    };
    this.characters.set(id, character);
    return character;
  }

  // Neue Methoden für die Baumstruktur
  async getNextChapterByOption(
    parentChapterId: number,
    optionId: number,
  ): Promise<Chapter | undefined> {
    // Holt die Option
    const option = await this.getContinuationOption(optionId);
    if (!option || option.chapterId !== parentChapterId) {
      return undefined;
    }

    // Suche alle Kapitel, die das aktuelle Kapitel als Elternknoten haben
    const childChapters = Array.from(this.chapters.values()).filter(
      (chapter) => chapter.parentId === parentChapterId,
    );

    // Suche nach dem Kapitel, das mit dieser Option erstellt wurde
    // Wir können den Prompt vergleichen, der in beiden gespeichert ist
    return childChapters.find((chapter) => chapter.prompt === option.prompt);
  }

  async getAllChapters(storyId: number): Promise<Chapter[]> {
    return Array.from(this.chapters.values())
      .filter((chapter) => chapter.storyId === storyId)
      .sort((a, b) => {
        // Sortiere nach Pfad für eine strukturierte Darstellung
        if (a.path && b.path) {
          return a.path.localeCompare(b.path);
        }
        return a.id - b.id;
      });
  }
}

export const storage = new MemStorage();
