import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CreateStoryInput, Story, CreateCharacterInput } from "@/lib/types";
import { useLocation } from "wouter";
import { Loader2, Plus, Trash2, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CreateStoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateStoryModal({
  open,
  onOpenChange,
}: CreateStoryModalProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("details");

  // Character management
  interface CharacterFormData {
    name: string;
    age: string;
    personality: string;
    background: string;
  }

  const emptyCharacter = {
    name: "",
    age: "",
    personality: "",
    background: "",
  };

  const [characters, setCharacters] = useState<CharacterFormData[]>([]);
  const [currentCharacter, setCurrentCharacter] =
    useState<CharacterFormData>(emptyCharacter);

  const [storyData, setStoryData] = useState<CreateStoryInput>({
    title: "",
    genre: "",
    narrativeStyle: "",
    setting: "",
    targetAudience: "",
    mainCharacter: "",
    chapterLength: "100-200",
    temperature: 5,
    characters: [],
  });

  const createStoryMutation = useMutation({
    mutationFn: async (data: CreateStoryInput) => {
      const res = await apiRequest("POST", "/api/stories", data);
      return res.json() as Promise<Story>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      toast({
        title: "Geschichte erstellt",
        description: `"${data.title}" wurde erfolgreich erstellt.`,
      });
      navigate(`/stories/${data.id}`);
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: `Die Geschichte konnte nicht erstellt werden. ${error}`,
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setStoryData({
      ...storyData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCharacterInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setCurrentCharacter({
      ...currentCharacter,
      [e.target.name]: e.target.value,
    });
  };

  const addCharacter = () => {
    if (currentCharacter.name.trim() === "") {
      toast({
        title: "Fehler",
        description: "Der Name des Charakters darf nicht leer sein.",
        variant: "destructive",
      });
      return;
    }

    const updatedCharacters = [...characters, currentCharacter];
    setCharacters(updatedCharacters);
    setStoryData({
      ...storyData,
      characters: updatedCharacters,
    });
    setCurrentCharacter(emptyCharacter);
  };

  const removeCharacter = (index: number) => {
    const updatedCharacters = [...characters];
    updatedCharacters.splice(index, 1);
    setCharacters(updatedCharacters);
    setStoryData({
      ...storyData,
      characters: updatedCharacters,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // If we have a partially filled character, add it
    if (currentCharacter.name.trim() !== "") {
      const updatedCharacters = [...characters, currentCharacter];
      createStoryMutation.mutate({
        ...storyData,
        characters: updatedCharacters,
      });
    } else {
      createStoryMutation.mutate(storyData);
    }
  };

  const handleClose = () => {
    if (!createStoryMutation.isPending) {
      onOpenChange(false);
      setStoryData({
        title: "",
        genre: "",
        narrativeStyle: "",
        setting: "",
        targetAudience: "",
        mainCharacter: "",
        chapterLength: "100-200",
        temperature: 5,
        characters: [],
      });
      setCharacters([]);
      setCurrentCharacter(emptyCharacter);
      setActiveTab("details");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-neutral-900">
            Neue Geschichte erstellen
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Geschichte</TabsTrigger>
              <TabsTrigger value="characters">
                Charaktere {characters.length > 0 && `(${characters.length})`}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-4">
              <div>
                <Label
                  htmlFor="title"
                  className="text-sm font-medium text-neutral-700"
                >
                  Titel <span className="text-neutral-500">(optional)</span>
                </Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Zufällig generieren lassen"
                  value={storyData.title}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="genre"
                    className="text-sm font-medium text-neutral-700"
                  >
                    Genre <span className="text-neutral-500">(optional)</span>
                  </Label>
                  <Input
                    id="genre"
                    name="genre"
                    placeholder="z.B. Fantasy, Krimi, SciFi"
                    value={storyData.genre}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="narrativeStyle"
                    className="text-sm font-medium text-neutral-700"
                  >
                    Erzählstil{" "}
                    <span className="text-neutral-500">(optional)</span>
                  </Label>
                  <Input
                    id="narrativeStyle"
                    name="narrativeStyle"
                    placeholder="z.B. humorvoll, dramatisch"
                    value={storyData.narrativeStyle}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label
                  htmlFor="setting"
                  className="text-sm font-medium text-neutral-700"
                >
                  Setting <span className="text-neutral-500">(optional)</span>
                </Label>
                <Input
                  id="setting"
                  name="setting"
                  placeholder="z.B. mittelalterliches Europa, futuristischer Mars"
                  value={storyData.setting}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>

              <div>
                <Label
                  htmlFor="targetAudience"
                  className="text-sm font-medium text-neutral-700"
                >
                  Zielgruppe{" "}
                  <span className="text-neutral-500">(optional)</span>
                </Label>
                <Input
                  id="targetAudience"
                  name="targetAudience"
                  placeholder="z.B. Kinder, Jugendliche, Erwachsene"
                  value={storyData.targetAudience}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>

              <div>
                <Label
                  htmlFor="mainCharacter"
                  className="text-sm font-medium text-neutral-700"
                >
                  Hauptcharakter{" "}
                  <span className="text-neutral-500">(optional)</span>
                </Label>
                <Textarea
                  id="mainCharacter"
                  name="mainCharacter"
                  placeholder="Alter, Motivation, Charaktereigenschaften, etc."
                  value={storyData.mainCharacter}
                  onChange={handleInputChange}
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <Label
                    htmlFor="chapterLength"
                    className="text-sm font-medium text-neutral-700"
                  >
                    Kapitellänge
                  </Label>
                  <select
                    id="chapterLength"
                    name="chapterLength"
                    value={storyData.chapterLength}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border border-neutral-300 bg-white py-2 px-3 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                  >
                    <option value="100-200">Kurz (100-200 Wörter)</option>
                    <option value="200-300">Mittel (200-300 Wörter)</option>
                    <option value="300-400">Lang (300-400 Wörter)</option>
                  </select>
                </div>

                <div>
                  <Label
                    htmlFor="temperature"
                    className="text-sm font-medium text-neutral-700"
                  >
                    Kreativität
                  </Label>
                  <div className="flex items-center mt-2">
                    <span className="text-xs text-neutral-600 mr-2">
                      Präzise
                    </span>
                    <input
                      type="range"
                      id="temperature"
                      name="temperature"
                      min="1"
                      max="9"
                      step="1"
                      value={storyData.temperature}
                      onChange={(e) =>
                        setStoryData({
                          ...storyData,
                          temperature: parseInt(e.target.value),
                        })
                      }
                      className="flex-grow h-1.5 appearance-none rounded-full bg-neutral-200 accent-primary"
                    />
                    <span className="text-xs text-neutral-600 ml-2">
                      Kreativ
                    </span>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="characters" className="space-y-4 mt-4">
              {characters.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-neutral-700 mb-2">
                    Hinzugefügte Charaktere:
                  </h3>
                  <div className="space-y-3">
                    {characters.map((char, index) => (
                      <div
                        key={index}
                        className="border rounded-md p-3 relative"
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2 p-0 h-6 w-6"
                          onClick={() => removeCharacter(index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                        <h4 className="font-medium">{char.name}</h4>
                        {char.age && (
                          <p className="text-sm text-gray-500 mt-1">
                            Alter: {char.age}
                          </p>
                        )}
                        {char.personality && (
                          <p className="text-sm mt-1">
                            <span className="font-medium">Persönlichkeit:</span>{" "}
                            {char.personality}
                          </p>
                        )}
                        {char.background && (
                          <p className="text-sm mt-1">
                            <span className="font-medium">Hintergrund:</span>{" "}
                            {char.background}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border rounded-md p-4">
                <h3 className="text-sm font-medium text-neutral-700 mb-3">
                  Neuer Charakter{" "}
                  <span className="text-neutral-500">(optional)</span>
                </h3>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="charName" className="text-sm">
                      Name
                    </Label>
                    <Input
                      id="charName"
                      name="name"
                      placeholder="Name des Charakters"
                      value={currentCharacter.name}
                      onChange={handleCharacterInputChange}
                    />
                  </div>

                  <div>
                    <Label htmlFor="charAge" className="text-sm">
                      Alter
                    </Label>
                    <Input
                      id="charAge"
                      name="age"
                      placeholder="Alter des Charakters"
                      value={currentCharacter.age}
                      onChange={handleCharacterInputChange}
                    />
                  </div>

                  <div>
                    <Label htmlFor="charPersonality" className="text-sm">
                      Persönlichkeit
                    </Label>
                    <Textarea
                      id="charPersonality"
                      name="personality"
                      placeholder="Charakterzüge, Verhalten, etc."
                      value={currentCharacter.personality}
                      onChange={handleCharacterInputChange}
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="charBackground" className="text-sm">
                      Hintergrund
                    </Label>
                    <Textarea
                      id="charBackground"
                      name="background"
                      placeholder="Herkunft, Vergangenheit, etc."
                      value={currentCharacter.background}
                      onChange={handleCharacterInputChange}
                      rows={2}
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={addCharacter}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Charakter hinzufügen
                  </Button>
                </div>
              </div>

              <div className="text-sm text-gray-500 mt-2">
                <p>
                  Hinweis: Wenn keine Charaktere angegeben werden, generiert die
                  KI automatisch mindestens einen passenden Charakter für die
                  Geschichte.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createStoryMutation.isPending}
            >
              Abbrechen
            </Button>

            <Button
              type="submit"
              disabled={createStoryMutation.isPending}
              className="bg-primary hover:bg-primary-dark text-white"
            >
              {createStoryMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Erstelle Geschichte...
                </>
              ) : (
                "Geschichte erstellen"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
