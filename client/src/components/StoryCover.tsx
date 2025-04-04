import { Story, Character } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Book, Users, Settings, Thermometer, AlignLeft } from "lucide-react";
import { Button } from "./ui/button";

interface StoryCoverProps {
  story: Story;
  onStartReading: () => void;
}

// Eine sichere Komponente für Charakterdarstellung
function CharacterCard({ character }: { character: any }) {
  // Stelle sicher, dass alle Eigenschaften gültige Werte haben
  const name = typeof character.name === 'string' ? character.name : 'Unbekannt';
  const age = typeof character.age === 'string' ? character.age : null;
  const personality = typeof character.personality === 'string' ? character.personality : null;
  const background = typeof character.background === 'string' ? character.background : null;
  
  return (
    <div className="border rounded-md p-3">
      <h3 className="font-medium">{name}</h3>
      {age && (
        <p className="text-sm text-gray-500 mt-1">
          Alter: {age}
        </p>
      )}
      {personality && (
        <p className="text-sm mt-2">
          <span className="font-medium">Persönlichkeit:</span>{" "}
          {personality}
        </p>
      )}
      {background && (
        <p className="text-sm mt-2">
          <span className="font-medium">Hintergrund:</span>{" "}
          {background}
        </p>
      )}
    </div>
  );
}

export default function StoryCover({ story, onStartReading }: StoryCoverProps) {
  // Lade Charaktere für die Geschichte
  const { data: characters = [] } = useQuery<Character[]>({
    queryKey: [`/api/stories/${story.id}/characters`],
    enabled: !!story.id,
  });

  // Formatiere das Erstellungsdatum
  const formattedDate = (() => {
    try {
      return story.createdAt 
        ? new Date(story.createdAt as unknown as string).toLocaleDateString("de-DE") 
        : "unbekannt";
    } catch (e) {
      return "unbekannt";
    }
  })();

  // Kapitelllänge formatieren
  const formatChapterLength = (length?: string) => {
    if (!length) return "";
    switch (length) {
      case "100-200": return "Kurz (100-200 Wörter)";
      case "200-300": return "Mittel (200-300 Wörter)";
      case "300-400": return "Lang (300-400 Wörter)";
      default: return length;
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      {/* Titel und Hauptinfos */}
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-600 bg-clip-text text-transparent">
          {story.title}
        </h1>
        <p className="text-gray-500 mt-2">
          Erstellt am {formattedDate}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Linke Spalte: Details */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Book className="h-5 w-5 mr-2 text-primary" />
              Geschichtendetails
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex flex-wrap gap-2">
              {story.genre && (
                <Badge variant="outline" className="px-3 py-1 text-primary">
                  {story.genre}
                </Badge>
              )}
              {story.narrativeStyle && (
                <Badge variant="outline" className="px-3 py-1 text-primary">
                  {story.narrativeStyle}
                </Badge>
              )}
              {story.targetAudience && (
                <Badge variant="outline" className="px-3 py-1 text-primary">
                  {story.targetAudience}
                </Badge>
              )}
            </div>

            <div className="space-y-3">
              {story.setting && (
                <div>
                  <h3 className="text-sm font-medium flex items-center">
                    <Settings className="h-4 w-4 mr-1 text-gray-500" />
                    Setting
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{story.setting}</p>
                </div>
              )}

              {story.mainCharacter && (
                <div>
                  <h3 className="text-sm font-medium flex items-center">
                    <Users className="h-4 w-4 mr-1 text-gray-500" />
                    Hauptcharakter
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {story.mainCharacter}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mt-4">
                {story.chapterLength && (
                  <div>
                    <h3 className="text-sm font-medium flex items-center">
                      <AlignLeft className="h-4 w-4 mr-1 text-gray-500" />
                      Kapitellänge
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatChapterLength(story.chapterLength)}
                    </p>
                  </div>
                )}

                {story.temperature !== undefined && (
                  <div>
                    <h3 className="text-sm font-medium flex items-center">
                      <Thermometer className="h-4 w-4 mr-1 text-gray-500" />
                      Kreativität
                    </h3>
                    <div className="flex items-center mt-2">
                      <span className="text-xs text-neutral-600 mr-2">1</span>
                      <div className="flex-grow h-1.5 bg-neutral-200 rounded-full">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${((story.temperature || 5) / 9) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-neutral-600 ml-2">10</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rechte Spalte: Charaktere */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-primary" />
              Charaktere
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] rounded-md">
              <div className="space-y-4">
                {Array.isArray(characters) && characters.length > 0 ? (
                  characters.map((character) => (
                    <CharacterCard key={character.id || Math.random()} character={character} />
                  ))
                ) : (
                  <p className="text-sm text-gray-500">
                    Keine Charaktere gefunden.
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center mt-8">
        <Button size="lg" onClick={onStartReading} className="font-medium">
          Geschichte lesen
        </Button>
      </div>
    </div>
  );
}
