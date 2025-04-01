import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o-mini";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export interface StoryDetails {
  title?: string | null;
  genre?: string | null;
  narrativeStyle?: string | null;
  setting?: string | null;
  targetAudience?: string | null;
  mainCharacter?: string | null;
}

export interface ChapterGeneration {
  title: string;
  content: string;
  continuationOptions: {
    title: string;
    preview: string;
    prompt: string;
  }[];
}

/**
 * Generate a chapter based on story details or continuation options
 */
export async function generateChapter(
  details: StoryDetails,
  previousChapter?: { content: string; title: string },
  customPrompt?: string
): Promise<ChapterGeneration> {
  // Building the base prompt
  let prompt = `Generiere ein Kapitel für eine deutsche Geschichte mit folgenden Details:\n`;
  
  if (details.title) prompt += `Titel: ${details.title}\n`;
  if (details.genre) prompt += `Genre: ${details.genre}\n`;
  if (details.narrativeStyle) prompt += `Erzählstil: ${details.narrativeStyle}\n`;
  if (details.setting) prompt += `Setting: ${details.setting}\n`;
  if (details.targetAudience) prompt += `Zielgruppe: ${details.targetAudience}\n`;
  if (details.mainCharacter) prompt += `Hauptcharakter: ${details.mainCharacter}\n`;
  
  if (previousChapter) {
    prompt += `\nVorheriges Kapitel Titel: ${previousChapter.title}\n`;
    prompt += `Vorheriges Kapitel Inhalt: ${previousChapter.content}\n`;
  }
  
  if (customPrompt) {
    prompt += `\nBitte berücksichtige folgende Anweisung für das neue Kapitel: ${customPrompt}\n`;
  }
  
  prompt += `\nDas Kapitel sollte 100-150 Wörter umfassen. Generiere auch 3 mögliche Fortsetzungsoptionen für das nächste Kapitel.`;
  prompt += `\nFormat: Antworte bitte mit einem JSON Objekt im folgenden Format:
  {
    "title": "Kapiteltitel",
    "content": "Der Kapitelinhalt (100-150 Wörter)",
    "continuationOptions": [
      {
        "title": "Titel der ersten Option",
        "preview": "Kurze Vorschau (etwa 15-20 Wörter)",
        "prompt": "Detaillierter Prompt für diese Fortsetzung"
      },
      {
        "title": "Titel der zweiten Option",
        "preview": "Kurze Vorschau (etwa 15-20 Wörter)",
        "prompt": "Detaillierter Prompt für diese Fortsetzung"
      },
      {
        "title": "Titel der dritten Option",
        "preview": "Kurze Vorschau (etwa 15-20 Wörter)",
        "prompt": "Detaillierter Prompt für diese Fortsetzung"
      }
    ]
  }`;

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "Du bist ein kreativer Geschichtenerzähler, der fesselnde deutsche Geschichten schreibt."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
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
  age?: string;
  personality?: string;
  background?: string;
}

export interface StoryDetailsWithCharacters extends StoryDetails {
  characters?: CharacterCreation[];
}

/**
 * Generate random story details for empty fields
 */
export async function generateRandomStoryDetails(partialDetails: StoryDetailsWithCharacters): Promise<StoryDetailsWithCharacters> {
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
  
${partialDetails.title ? `title: ${partialDetails.title} (bereits angegeben)` : 'title: [FEHLT]'}
${partialDetails.genre ? `genre: ${partialDetails.genre} (bereits angegeben)` : 'genre: [FEHLT]'}
${partialDetails.narrativeStyle ? `narrativeStyle: ${partialDetails.narrativeStyle} (bereits angegeben)` : 'narrativeStyle: [FEHLT]'}
${partialDetails.setting ? `setting: ${partialDetails.setting} (bereits angegeben)` : 'setting: [FEHLT]'}
${partialDetails.targetAudience ? `targetAudience: ${partialDetails.targetAudience} (bereits angegeben)` : 'targetAudience: [FEHLT]'}
${partialDetails.mainCharacter ? `mainCharacter: ${partialDetails.mainCharacter} (bereits angegeben)` : 'mainCharacter: [FEHLT]'}

Außerdem generiere mindestens einen Hauptcharakter für die Geschichte mit folgendem Format:
"characters": [
  {
    "name": "Name des Charakters",
    "age": "Alter des Charakters",
    "personality": "Persönlichkeitsbeschreibung (ca. 20-30 Wörter)",
    "background": "Hintergrundgeschichte des Charakters (ca. 20-30 Wörter)"
  }
]

${partialDetails.characters && partialDetails.characters.length > 0 ? 
  `characters: ${JSON.stringify(partialDetails.characters, null, 2)} (bereits angegeben)` : 
  'characters: [FEHLT]'
}

Antworte mit einem JSON-Objekt, das ALLE Felder enthält (sowohl die bereits angegebenen als auch die generierten).`;

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "Du hilfst dabei, kreative und abwechslungsreiche Geschichtendetails und Charaktere zu generieren."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("OpenAI returned empty content");
    }

    return JSON.parse(content) as StoryDetailsWithCharacters;
  } catch (error) {
    console.error("Error generating random story details:", error);
    // In case of an error, return the original details and let the client handle missing fields
    return partialDetails;
  }
}
