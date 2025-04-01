import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  createStorySchema, 
  continueStorySchema, 
  type Story,
  type Chapter
} from "@shared/schema";
import { generateChapter, generateRandomStoryDetails } from "./openai";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all stories
  app.get("/api/stories", async (_req: Request, res: Response) => {
    try {
      const stories = await storage.getStories();
      res.json(stories);
    } catch (error) {
      console.error("Error fetching stories:", error);
      res.status(500).json({ message: "Fehler beim Abrufen der Geschichten." });
    }
  });

  // Get a single story with its root chapter
  app.get("/api/stories/:id", async (req: Request, res: Response) => {
    try {
      const storyId = parseInt(req.params.id);
      const story = await storage.getStory(storyId);
      
      if (!story) {
        return res.status(404).json({ message: "Geschichte nicht gefunden." });
      }
      
      const rootChapter = await storage.getRootChapter(storyId);
      
      if (rootChapter) {
        const continuationOptions = await storage.getContinuationOptions(rootChapter.id);
        res.json({ 
          ...story, 
          rootChapter: { 
            ...rootChapter, 
            continuationOptions 
          } 
        });
      } else {
        res.json(story);
      }
    } catch (error) {
      console.error("Error fetching story:", error);
      res.status(500).json({ message: "Fehler beim Abrufen der Geschichte." });
    }
  });

  // Create a new story
  app.post("/api/stories", async (req: Request, res: Response) => {
    try {
      const validatedData = createStorySchema.parse(req.body);
      
      // Use OpenAI to fill in missing details
      const completeDetails = await generateRandomStoryDetails(validatedData);
      
      // Create the story in storage
      const story = await storage.createStory({
        title: completeDetails.title,
        genre: completeDetails.genre,
        narrativeStyle: completeDetails.narrativeStyle,
        setting: completeDetails.setting,
        targetAudience: completeDetails.targetAudience,
        mainCharacter: completeDetails.mainCharacter
      });
      
      // Generate the first chapter
      const chapterData = await generateChapter(completeDetails);
      
      // Create the root chapter
      const rootChapter = await storage.createChapter({
        storyId: story.id,
        parentId: null,
        title: chapterData.title,
        content: chapterData.content,
        isRoot: 1,
        prompt: "initial chapter"
      });
      
      // Create continuation options
      for (const option of chapterData.continuationOptions) {
        await storage.createContinuationOption({
          chapterId: rootChapter.id,
          title: option.title,
          preview: option.preview,
          prompt: option.prompt
        });
      }
      
      // Return the story with the root chapter
      res.status(201).json({ 
        ...story, 
        rootChapter: {
          ...rootChapter,
          continuationOptions: await storage.getContinuationOptions(rootChapter.id)
        }
      });
    } catch (error) {
      console.error("Error creating story:", error);
      
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Ungültige Daten für die Geschichte.", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ message: "Fehler beim Erstellen der Geschichte." });
    }
  });

  // Get a chapter with its continuation options
  app.get("/api/chapters/:id", async (req: Request, res: Response) => {
    try {
      const chapterId = parseInt(req.params.id);
      const chapter = await storage.getChapter(chapterId);
      
      if (!chapter) {
        return res.status(404).json({ message: "Kapitel nicht gefunden." });
      }
      
      const continuationOptions = await storage.getContinuationOptions(chapterId);
      
      res.json({ ...chapter, continuationOptions });
    } catch (error) {
      console.error("Error fetching chapter:", error);
      res.status(500).json({ message: "Fehler beim Abrufen des Kapitels." });
    }
  });

  // Get chapter path (for navigation)
  app.get("/api/chapters/:id/path", async (req: Request, res: Response) => {
    try {
      const chapterId = parseInt(req.params.id);
      const path = await storage.getChapterPath(chapterId);
      
      if (path.length === 0) {
        return res.status(404).json({ message: "Kapitel nicht gefunden." });
      }
      
      res.json(path);
    } catch (error) {
      console.error("Error fetching chapter path:", error);
      res.status(500).json({ message: "Fehler beim Abrufen des Kapitelpfads." });
    }
  });

  // Continue a story (create next chapter)
  app.post("/api/stories/continue", async (req: Request, res: Response) => {
    try {
      const validatedData = continueStorySchema.parse(req.body);
      const { storyId, chapterId, selectedOptionId, customPrompt } = validatedData;
      
      if (!selectedOptionId && !customPrompt) {
        return res.status(400).json({ 
          message: "Es muss entweder eine Fortsetzungsoption oder ein eigener Prompt angegeben werden." 
        });
      }
      
      // Get the story
      const story = await storage.getStory(storyId);
      if (!story) {
        return res.status(404).json({ message: "Geschichte nicht gefunden." });
      }
      
      // Get the current chapter
      const currentChapter = await storage.getChapter(chapterId);
      if (!currentChapter) {
        return res.status(404).json({ message: "Kapitel nicht gefunden." });
      }
      
      // Check if a chapter with this path already exists
      let prompt = customPrompt;
      let nextChapterTitle = "Benutzerdefinierte Fortsetzung";
      
      if (selectedOptionId) {
        const option = await storage.getContinuationOption(selectedOptionId);
        if (!option) {
          return res.status(404).json({ message: "Fortsetzungsoption nicht gefunden." });
        }
        prompt = option.prompt;
        nextChapterTitle = option.title;
      }

      // Generate the next chapter
      const storyDetails = {
        title: story.title,
        genre: story.genre || undefined,
        narrativeStyle: story.narrativeStyle || undefined,
        setting: story.setting || undefined,
        targetAudience: story.targetAudience || undefined,
        mainCharacter: story.mainCharacter || undefined
      };
      
      const previousChapterData = {
        title: currentChapter.title,
        content: currentChapter.content
      };
      
      const chapterData = await generateChapter(storyDetails, previousChapterData, prompt);
      
      // Create the new chapter
      const newChapter = await storage.createChapter({
        storyId,
        parentId: chapterId,
        title: chapterData.title,
        content: chapterData.content,
        prompt: prompt || undefined,
        isRoot: 0
      });
      
      // Create continuation options
      for (const option of chapterData.continuationOptions) {
        await storage.createContinuationOption({
          chapterId: newChapter.id,
          title: option.title,
          preview: option.preview,
          prompt: option.prompt
        });
      }
      
      // Return the new chapter with its continuation options
      res.status(201).json({
        ...newChapter,
        continuationOptions: await storage.getContinuationOptions(newChapter.id)
      });
    } catch (error) {
      console.error("Error continuing story:", error);
      
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Ungültige Daten für die Fortsetzung.", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ message: "Fehler bei der Fortsetzung der Geschichte." });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
