import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  createStorySchema, 
  createCharacterSchema,
  continueStorySchema, 
  type Story,
  type Chapter,
  type Character
} from "@shared/schema";
import { generateChapter, generateRandomStoryDetails, CharacterCreation } from "./openai";
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
      
      // Use OpenAI to fill in missing details including characters
      const completeDetails = await generateRandomStoryDetails(validatedData);
      
      // Create the story in storage
      const story = await storage.createStory({
        title: completeDetails.title,
        genre: completeDetails.genre,
        narrativeStyle: completeDetails.narrativeStyle,
        setting: completeDetails.setting,
        targetAudience: completeDetails.targetAudience,
        mainCharacter: completeDetails.mainCharacter,
        chapterLength: completeDetails.chapterLength || "100-200",
        temperature: completeDetails.temperature || 7
      });
      
      // Create characters if they exist
      if (completeDetails.characters && completeDetails.characters.length > 0) {
        for (const characterData of completeDetails.characters) {
          await storage.createCharacter({
            storyId: story.id,
            name: characterData.name,
            age: characterData.age,
            personality: characterData.personality,
            background: characterData.background
          });
        }
      }
      
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
      
      let prompt = customPrompt;
      let existingChapter: Chapter | undefined;
      
      if (selectedOptionId) {
        const option = await storage.getContinuationOption(selectedOptionId);
        if (!option) {
          return res.status(404).json({ message: "Fortsetzungsoption nicht gefunden." });
        }
        
        prompt = option.prompt;
        
        // Prüfe, ob bereits ein Kapitel für diese Option existiert
        existingChapter = await storage.getNextChapterByOption(chapterId, selectedOptionId);
        
        if (existingChapter) {
          // Wenn ja, gib dieses zurück, anstatt ein neues zu erstellen
          return res.status(200).json({
            ...existingChapter,
            continuationOptions: await storage.getContinuationOptions(existingChapter.id)
          });
        }
      }

      // Kein existierendes Kapitel gefunden, generiere ein neues
      const storyDetails = {
        title: story.title,
        genre: story.genre,
        narrativeStyle: story.narrativeStyle,
        setting: story.setting,
        targetAudience: story.targetAudience,
        mainCharacter: story.mainCharacter,
        chapterLength: story.chapterLength,
        temperature: story.temperature
      };
      
      // Lade alle Charaktere der Geschichte
      const charactersData = await storage.getCharacters(storyId);
      
      // Konvertiere Character zu CharacterCreation, um Typprobleme zu vermeiden
      const characters = charactersData.map(char => ({
        name: char.name,
        age: char.age,
        personality: char.personality,
        background: char.background
      }));
      
      // Erstelle den Kapitelkontext mit Zusammenfassung und Charakteren
      const chapterContext = {
        title: currentChapter.title,
        content: currentChapter.content,
        summary: currentChapter.summary || undefined,
        parentId: currentChapter.parentId,
        characters: characters,
        previousSummary: currentChapter.summary || undefined
      };
      
      const chapterData = await generateChapter(storyDetails, chapterContext, prompt);
      
      // Create the new chapter
      const newChapter = await storage.createChapter({
        storyId,
        parentId: chapterId,
        title: chapterData.title,
        content: chapterData.content,
        summary: chapterData.summary || undefined,
        prompt: prompt || undefined,
        isRoot: 0,
        isEnding: chapterData.isEnding ? 1 : 0
      });
      
      // Nur Fortsetzungsoptionen erstellen, wenn das Kapitel kein Ende ist
      if (!chapterData.isEnding) {
        // Create continuation options
        for (const option of chapterData.continuationOptions) {
          await storage.createContinuationOption({
            chapterId: newChapter.id,
            title: option.title,
            preview: option.preview,
            prompt: option.prompt
          });
        }
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

  // Get all characters for a story
  app.get("/api/stories/:id/characters", async (req: Request, res: Response) => {
    try {
      const storyId = parseInt(req.params.id);
      
      // Check if the story exists
      const story = await storage.getStory(storyId);
      if (!story) {
        return res.status(404).json({ message: "Geschichte nicht gefunden." });
      }
      
      const characters = await storage.getCharacters(storyId);
      res.json(characters);
    } catch (error) {
      console.error("Error fetching characters:", error);
      res.status(500).json({ message: "Fehler beim Abrufen der Charaktere." });
    }
  });

  // Get a single character
  app.get("/api/characters/:id", async (req: Request, res: Response) => {
    try {
      const characterId = parseInt(req.params.id);
      const character = await storage.getCharacter(characterId);
      
      if (!character) {
        return res.status(404).json({ message: "Charakter nicht gefunden." });
      }
      
      res.json(character);
    } catch (error) {
      console.error("Error fetching character:", error);
      res.status(500).json({ message: "Fehler beim Abrufen des Charakters." });
    }
  });

  // Create a new character
  app.post("/api/characters", async (req: Request, res: Response) => {
    try {
      const validatedData = createCharacterSchema.parse(req.body);
      
      // Check if the story exists
      const story = await storage.getStory(validatedData.storyId);
      if (!story) {
        return res.status(404).json({ message: "Geschichte nicht gefunden." });
      }
      
      // Create the character
      const character = await storage.createCharacter({
        storyId: validatedData.storyId,
        name: validatedData.name,
        age: validatedData.age,
        background: validatedData.background,
        personality: validatedData.personality
      });
      
      res.status(201).json(character);
    } catch (error) {
      console.error("Error creating character:", error);
      
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Ungültige Daten für den Charakter.", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ message: "Fehler beim Erstellen des Charakters." });
    }
  });
  
  // Get all chapters for a story (tree structure)
  app.get("/api/stories/:id/chapters", async (req: Request, res: Response) => {
    try {
      const storyId = parseInt(req.params.id);
      
      // Check if the story exists
      const story = await storage.getStory(storyId);
      if (!story) {
        return res.status(404).json({ message: "Geschichte nicht gefunden." });
      }
      
      const chapters = await storage.getAllChapters(storyId);
      res.json(chapters);
    } catch (error) {
      console.error("Error fetching all chapters:", error);
      res.status(500).json({ message: "Fehler beim Abrufen aller Kapitel." });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
