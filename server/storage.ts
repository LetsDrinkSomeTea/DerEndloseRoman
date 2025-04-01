import { 
  type Story, 
  type InsertStory, 
  type Chapter, 
  type InsertChapter, 
  type ContinuationOption, 
  type InsertContinuationOption 
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
  
  // Continuation options methods
  getContinuationOptions(chapterId: number): Promise<ContinuationOption[]>;
  createContinuationOption(option: InsertContinuationOption): Promise<ContinuationOption>;
  getContinuationOption(id: number): Promise<ContinuationOption | undefined>;
}

export class MemStorage implements IStorage {
  private stories: Map<number, Story>;
  private chapters: Map<number, Chapter>;
  private continuationOptions: Map<number, ContinuationOption>;
  private storyIdCounter: number;
  private chapterIdCounter: number;
  private optionIdCounter: number;

  constructor() {
    this.stories = new Map();
    this.chapters = new Map();
    this.continuationOptions = new Map();
    this.storyIdCounter = 1;
    this.chapterIdCounter = 1;
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
      ...storyData,
      id,
      createdAt: new Date()
    };
    this.stories.set(id, story);
    return story;
  }

  // Chapter methods
  async getChapter(id: number): Promise<Chapter | undefined> {
    return this.chapters.get(id);
  }

  async getChaptersByStoryId(storyId: number): Promise<Chapter[]> {
    return Array.from(this.chapters.values())
      .filter(chapter => chapter.storyId === storyId);
  }

  async getRootChapter(storyId: number): Promise<Chapter | undefined> {
    return Array.from(this.chapters.values())
      .find(chapter => chapter.storyId === storyId && chapter.isRoot === 1);
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
      ...chapterData,
      id,
      path: pathString,
      createdAt: new Date()
    };
    
    this.chapters.set(id, chapter);
    return chapter;
  }

  // Continuation options methods
  async getContinuationOptions(chapterId: number): Promise<ContinuationOption[]> {
    return Array.from(this.continuationOptions.values())
      .filter(option => option.chapterId === chapterId);
  }

  async createContinuationOption(optionData: InsertContinuationOption): Promise<ContinuationOption> {
    const id = this.optionIdCounter++;
    const option: ContinuationOption = {
      ...optionData,
      id
    };
    this.continuationOptions.set(id, option);
    return option;
  }

  async getContinuationOption(id: number): Promise<ContinuationOption | undefined> {
    return this.continuationOptions.get(id);
  }
}

export const storage = new MemStorage();
