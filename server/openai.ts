import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o-mini";

const mapRange = (
  value: number | undefined,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
  defaultValue: number,
): number => {
  if (value === undefined) return defaultValue;
  const normalized = (value - inMin) / (inMax - inMin);
  const mapped = normalized * (outMax - outMin) + outMin;
  return Math.max(outMin, Math.min(outMax, mapped));
};

// Use the generic function to normalize a temperature from the range 1-9.
const normalizeTemperature = (
  temperature: number | undefined,
  lower: number = 0.8,
  upper: number = 1.2,
): number => {
  return mapRange(temperature, 1, 9, lower, upper, 1);
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Calculate chapter depth from path string (e.g., "1-2-3" = depth 3)
 */
function getChapterDepth(path?: string | null): number {
  if (!path) return 1;
  return path.split('-').length;
}

/**
 * Determine story arc phase based on chapter depth
 */
function getStoryArcPhase(depth: number): {
  phase: 'beginning' | 'development' | 'climax' | 'resolution';
  description: string;
  endingProbability: number;
} {
  if (depth <= 2) {
    return {
      phase: 'beginning',
      description: 'Einführung der Charaktere und der Grundsituation',
      endingProbability: 0.05, // 5% chance
    };
  } else if (depth <= 5) {
    return {
      phase: 'development',
      description: 'Entwicklung der Handlung und Charakterentwicklung',
      endingProbability: 0.15, // 15% chance
    };
  } else if (depth <= 8) {
    return {
      phase: 'climax',
      description: 'Höhepunkt der Geschichte, wichtige Entscheidungen und Wendungen',
      endingProbability: 0.35, // 35% chance
    };
  } else {
    return {
      phase: 'resolution',
      description: 'Auflösung der Geschichte, Zeit für ein befriedigendes Ende',
      endingProbability: 0.60, // 60% chance
    };
  }
}

export interface StoryDetails {
  title?: string | null;
  genre?: string | null;
  narrativeStyle?: string | null;
  setting?: string | null;
  targetAudience?: string | null;
  mainCharacter?: string | null;
  chapterLength: string;  // Required and cannot be null
  temperature: number;    // Required and cannot be null
}

export interface ChapterGeneration {
  title: string;
  content: string;
  summary: string;
  isEnding: boolean;
  continuationOptions: {
    title: string;
    preview: string;
    prompt: string;
  }[];
}

/**
 * Generate a chapter based on story details or continuation options
 */
/**
 * Lädt die Zeichen und den bisherigen Pfad eines Kapitels zur Verwendung in der Prompt
 */
export interface ChapterContext {
  content: string;
  title: string;
  summary?: string | null;
  parentId?: number | null;
  characters?: any[]; // Verwende any[], um Typkonflikte zu vermeiden
  previousSummary?: string | null;
  currentPath?: string | null; // Add path information for depth calculation
}

export async function generateChapter(
  details: StoryDetails,
  chapterContext?: ChapterContext,
  customPrompt?: string,
): Promise<ChapterGeneration> {
  // Ensure that chapterLength and temperature are set to default values if they are undefined
  const safeDetails = {
    ...details,
    chapterLength: details.chapterLength || "100-200",
    temperature: details.temperature ?? 5,
  };

  // Calculate chapter depth and story arc information
  const chapterDepth = getChapterDepth(chapterContext?.currentPath);
  const storyArc = getStoryArcPhase(chapterDepth);

  // Building the base prompt
  let prompt = `Generiere ein Kapitel für eine deutsche Geschichte mit folgenden Details:\n`;

  if (details.title) prompt += `Titel der Geschichte: ${details.title}\n`;
  if (details.genre) prompt += `Genre: ${details.genre}\n`;
  if (details.narrativeStyle)
    prompt += `Erzählstil: ${details.narrativeStyle}\n`;
  if (details.setting) prompt += `Setting: ${details.setting}\n`;
  if (details.targetAudience)
    prompt += `Zielgruppe: ${details.targetAudience}\n`;
  if (details.mainCharacter)
    prompt += `Hauptcharakter: ${details.mainCharacter}\n`;

  // Add story progression information
  prompt += `\nSTORY PROGRESSION:\n`;
  prompt += `Aktuelles Kapitel: ${chapterDepth}\n`;
  prompt += `Aktuelle Erzählphase: ${storyArc.phase} (${storyArc.description})\n`;
  prompt += `Wahrscheinlichkeit für Geschichtsende: ${Math.round(storyArc.endingProbability * 100)}%\n`;

  // Enhanced character continuity section
  if (chapterContext?.characters && chapterContext.characters.length > 0) {
    prompt += `\nCHARAKTERE (Bitte konsistent verwenden!):\n`;
    chapterContext.characters.forEach((character, index) => {
      prompt += `${index + 1}. ${character.name}`;
      if (character.age) prompt += ` (${character.age} Jahre)`;
      if (character.personality)
        prompt += `\n   Persönlichkeit: ${character.personality}`;
      if (character.background)
        prompt += `\n   Hintergrund: ${character.background}`;
      prompt += `\n`;
    });
    prompt += `\nWICHTIG: Alle bereits eingeführten Charaktere sollen konsistent dargestellt werden. Vermeide Widersprüche zu ihren etablierten Eigenschaften.\n`;
  }

  // Enhanced story context section
  if (chapterContext) {
    prompt += `\nVORHERIGES KAPITEL:\n`;
    prompt += `Titel: "${chapterContext.title}"\n`;
    prompt += `Inhalt: ${chapterContext.content}\n`;

    if (chapterContext.previousSummary) {
      prompt += `\nBISHERIGE HANDLUNG:\n${chapterContext.previousSummary}\n`;
      prompt += `\nKONTINUITÄT: Baue nahtlos auf der bisherigen Handlung auf. Berücksichtige alle etablierten Handlungsstränge und Charakterbeziehungen.\n`;
    }
  }

  // Custom prompt or default chapter instructions
  if (customPrompt) {
    prompt += `\nSPEZIELLE ANWEISUNG: ${customPrompt}\n`;
  } else if (!chapterContext) {
    prompt += `\nDas ist das erste Kapitel. Führe die Charaktere ein und etabliere die Grundsituation der Geschichte.\n`;
  } else {
    prompt += `\nFühre die Geschichte organisch fort und entwickle die Handlung entsprechend der aktuellen Erzählphase.\n`;
  }

  prompt += `\nDas Kapitel sollte ${safeDetails.chapterLength} Wörter umfassen.\n`;
  // Enhanced ending decision logic based on story progression
  prompt += `\nGESCHICHTSENDE-ENTSCHEIDUNG:\n`;
  if (storyArc.phase === 'beginning') {
    prompt += `Da dies noch der Anfang der Geschichte ist, sollte das Kapitel NICHT enden. Entwickle die Handlung weiter.\n`;
  } else if (storyArc.phase === 'development') {
    prompt += `Die Geschichte ist in der Entwicklungsphase. Ein Ende ist möglich, aber die Handlung sollte noch weiterentwickelt werden.\n`;
  } else if (storyArc.phase === 'climax') {
    prompt += `Die Geschichte nähert sich dem Höhepunkt. Überlege, ob wichtige Konflikte gelöst werden können und ein befriedigendes Ende möglich ist.\n`;
  } else {
    prompt += `Die Geschichte ist reif für ein Ende. Bringe die Handlungsstränge zu einem befriedigenden Abschluss, wenn es narrativ sinnvoll ist.\n`;
  }
  
  prompt += `Wenn du dich für ein Ende entscheidest, setze "isEnding" auf true und generiere keine Fortsetzungsoptionen.\n`;
  prompt += `Wenn es kein Ende ist, generiere 3 mögliche Fortsetzungsoptionen für das nächste Kapitel.\n`;

  // Enhanced storytelling instructions
  prompt += `\nERZÄHLRICHTLINIEN:\n`;
  prompt += `• Erzähle die Geschichte ansprechend und atmosphärisch\n`;
  prompt += `• Berücksichtige ALLE etablierten Charaktere und ihre Eigenschaften\n`;
  prompt += `• Baue auf der bisherigen Handlung auf - keine Widersprüche\n`;
  prompt += `• Entwickle die Charaktere weiter und zeige ihre Persönlichkeiten\n`;
  prompt += `• Wenn neue Charaktere eingeführt werden, stelle sie detailliert vor\n`;
  prompt += `• Achte auf emotionale Tiefe und nachvollziehbare Motivationen\n`;
  prompt += `• Schaffe eine kohärente Atmosphäre, die zum Genre und Setting passt\n`;

  prompt += `\nFormat: Antworte bitte mit einem JSON Objekt im folgenden Format:
  {
    "title": "Kapiteltitel (Nur der Titel des Kapitels, keine Nummer oder ähnliches)",
    "content": "Der Kapitelinhalt (${safeDetails.chapterLength} Wörter)",
    "summary": "Eine präzise Zusammenfassung der GESAMTEN Geschichte bis zu diesem Punkt, inklusive aller wichtigen Handlungen, Charakterentwicklungen und aktuellen Situationen. Erwähne alle relevanten Charaktere und ihre aktuellen Zustände.",
    "isEnding": false,
    "continuationOptions": [
      {
        "title": "Titel der ersten Option",
        "preview": "Kurze Vorschau (etwa 10-15 Wörter)",
        "prompt": "Detaillierter Prompt für diese Fortsetzung, der die Handlung organisch weiterentwickelt"
      },
      {
        "title": "Titel der zweiten Option",
        "preview": "Kurze Vorschau (etwa 10-15 Wörter)",
        "prompt": "Detaillierter Prompt für diese Fortsetzung, der eine alternative Entwicklung ermöglicht"
      },
      {
        "title": "Titel der dritten Option",
        "preview": "Kurze Vorschau (etwa 10-15 Wörter)",
        "prompt": "Detaillierter Prompt für diese Fortsetzung, der einen anderen Aspekt der Geschichte beleuchtet"
      }
    ]
  }
  
  Falls du entscheidest, dass dies das Ende der Geschichte sein soll:
  {
    "title": "Kapiteltitel",
    "content": "Der Kapitelinhalt, der die Geschichte zu einem befriedigenden Abschluss bringt (${safeDetails.chapterLength} Wörter)",
    "summary": "Eine abschließende Zusammenfassung der gesamten Geschichte mit allen wichtigen Ereignissen und Charakterentwicklungen (80-100 Wörter)",
    "isEnding": true,
    "continuationOptions": []
  }`;

  try {
    const temperature = normalizeTemperature(safeDetails.temperature);

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "Du bist ein kreativer Geschichtenerzähler, der fesselnde deutsche Geschichten schreibt.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: temperature,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("OpenAI returned empty content");
    }

    return JSON.parse(content) as ChapterGeneration;
  } catch (error) {
    console.error("Error generating chapter:", error);
    throw new Error(`Fehler bei der Generierung des Kapitels: ${error}`);
  }
}

export interface CharacterCreation {
  name: string;
  age?: string | null;
  personality?: string | null;
  background?: string | null;
}

export interface StoryDetailsWithCharacters extends StoryDetails {
  characters?: CharacterCreation[];
}

/**
 * Generate random story details for empty fields
 */
export async function generateRandomStoryDetails(
  partialDetails: StoryDetailsWithCharacters,
): Promise<StoryDetailsWithCharacters> {

  // Don't make an API call if all fields are provided and at least one character
  if (
      partialDetails.title &&
      partialDetails.genre &&
      partialDetails.narrativeStyle &&
      partialDetails.setting &&
      partialDetails.targetAudience &&
      partialDetails.mainCharacter &&
      partialDetails.characters &&
      partialDetails.characters.length > 0
  ) {
    return partialDetails;
  }

  const prompt = `Generiere zufällige Details für eine deutsche Geschichte. Fülle nur die fehlenden Felder aus:
  
${partialDetails.title ? `title: ${partialDetails.title} (bereits angegeben)` : "title: [FEHLT]"}
${partialDetails.genre ? `genre: ${partialDetails.genre} (bereits angegeben)` : "genre: [FEHLT]"}
${partialDetails.narrativeStyle ? `narrativeStyle: ${partialDetails.narrativeStyle} (bereits angegeben)` : "narrativeStyle: [FEHLT]"}
${partialDetails.setting ? `setting: ${partialDetails.setting} (bereits angegeben)` : "setting: [FEHLT]"}
${partialDetails.targetAudience ? `targetAudience: ${partialDetails.targetAudience} (bereits angegeben)` : "targetAudience: [FEHLT]"}
${partialDetails.mainCharacter ? `mainCharacter: ${partialDetails.mainCharacter} (bereits angegeben)` : "mainCharacter: [FEHLT]"}

Außerdem generiere mindestens einen Hauptcharakter für die Geschichte mit folgendem Format:
"characters": [
  {
    "name": "Name des Charakters",
    "age": "Alter des Charakters",
    "personality": "Persönlichkeitsbeschreibung (ca. 20-30 Wörter)",
    "background": "Hintergrundgeschichte des Charakters (ca. 20-30 Wörter)"
  }
]

${
  partialDetails.characters && partialDetails.characters.length > 0
    ? `characters: ${JSON.stringify(partialDetails.characters, null, 2)} (bereits angegeben)`
    : "characters: [FEHLT]"
}

Antworte mit einem JSON-Objekt, das ALLE Felder enthält (sowohl die bereits angegebenen als auch die generierten).`;

  try {
    const temperature = normalizeTemperature(partialDetails.temperature);

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "Du hilfst dabei, kreative und abwechslungsreiche Geschichtendetails und Charaktere zu generieren.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: temperature,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("OpenAI returned empty content");
    }

    return JSON.parse(content) as StoryDetailsWithCharacters;
  } catch (error) {
    console.error("Error generating random story details:", error);
    // In case of an error, return the original details with safety defaults
    return partialDetails;
  }
}
