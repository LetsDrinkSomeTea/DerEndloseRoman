export interface Story {
  id: number;
  title: string;
  genre?: string;
  narrativeStyle?: string;
  setting?: string;
  targetAudience?: string;
  mainCharacter?: string;
  createdAt?: Date;
  rootChapter?: Chapter;
}

export interface Chapter {
  id: number;
  storyId: number;
  parentId?: number | null;
  title: string;
  content: string;
  prompt?: string;
  isRoot?: number;
  path?: string;
  createdAt?: Date;
  continuationOptions?: ContinuationOption[];
}

export interface ContinuationOption {
  id: number;
  chapterId: number;
  title: string;
  preview: string;
  prompt: string;
}

export interface CreateStoryInput {
  title?: string;
  genre?: string;
  narrativeStyle?: string;
  setting?: string;
  targetAudience?: string;
  mainCharacter?: string;
  characters?: {
    name: string;
    age?: string;
    personality?: string;
    background?: string;
  }[];
}

export interface ContinueStoryInput {
  storyId: number;
  chapterId: number;
  selectedOptionId?: number;
  customPrompt?: string;
}

export interface Character {
  id: number;
  storyId: number;
  name: string;
  age?: string | null;
  background?: string | null;
  personality?: string | null;
  createdAt?: Date;
}

export interface CreateCharacterInput {
  storyId: number;
  name: string;
  age?: string;
  background?: string;
  personality?: string;
}
