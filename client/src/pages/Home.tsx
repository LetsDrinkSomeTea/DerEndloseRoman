import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Story } from "@/lib/types";
import StoryCard from "@/components/StoryCard";
import CreateStoryModal from "@/components/CreateStoryModal";
import { PlusIcon, BookIcon, SearchIcon } from "lucide-react";

export default function Home() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const {
    data: stories,
    isLoading,
    error,
  } = useQuery<Story[]>({
    queryKey: ["/api/stories"],
  });

  // Filtern der Geschichten basierend auf dem Suchbegriff
  const filteredStories = useMemo(() => {
    if (!stories) return [];
    
    const search = searchTerm.toLowerCase().trim();
    if (!search) return stories;
    
    return stories.filter(story => {
      return (
        (story.title?.toLowerCase().includes(search)) ||
        (story.genre?.toLowerCase().includes(search)) ||
        (story.narrativeStyle?.toLowerCase().includes(search)) ||
        (story.setting?.toLowerCase().includes(search)) ||
        (story.targetAudience?.toLowerCase().includes(search))
      );
    });
  }, [stories, searchTerm]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-primary text-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Der endlose Roman</h1>
            <Button
              onClick={() => setCreateModalOpen(true)}
              className="bg-secondary hover:bg-secondary-900 text-black"
            >
              <PlusIcon className="h-5 w-5 mr-1" />
              Neue Geschichte
            </Button>
          </div>
          
          {/* Suchleiste */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              type="search"
              placeholder="Nach Geschichten suchen (Titel, Genre, Erzählstil...)"
              className="pl-10 bg-white/10 text-white border-white/20 placeholder:text-gray-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center items-center h-60">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-red-500 mb-4">
              Es ist ein Fehler aufgetreten. Bitte versuche es später erneut.
            </div>
          </div>
        ) : stories && stories.length > 0 ? (
          <>
            {/* Anzeige der gefundenen Geschichten */}
            {searchTerm && (
              <div className="mb-4">
                <h2 className="text-lg font-medium text-gray-700">
                  {filteredStories.length === 0
                    ? "Keine Ergebnisse für"
                    : filteredStories.length === 1
                    ? "1 Ergebnis für"
                    : `${filteredStories.length} Ergebnisse für`}{" "}
                  <span className="font-bold">"{searchTerm}"</span>
                </h2>
              </div>
            )}

            {filteredStories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStories.map((story) => (
                  <StoryCard key={story.id} story={story} />
                ))}
              </div>
            ) : searchTerm ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <SearchIcon className="h-16 w-16 mx-auto text-neutral-400 mb-4" />
                <h2 className="text-xl font-bold text-neutral-800 mb-2">
                  Keine Übereinstimmungen gefunden
                </h2>
                <p className="text-neutral-600 mb-6">
                  Versuche es mit anderen Suchbegriffen oder erstelle eine neue Geschichte.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={() => setSearchTerm("")}
                    variant="outline"
                    className="font-medium"
                  >
                    Suche zurücksetzen
                  </Button>
                  <Button
                    onClick={() => setCreateModalOpen(true)}
                    className="bg-primary hover:bg-primary-dark text-white font-medium"
                  >
                    Neue Geschichte erstellen
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <BookIcon className="h-16 w-16 mx-auto text-neutral-400 mb-4" />
            <h2 className="text-xl font-bold text-neutral-800 mb-2">
              Keine Geschichten gefunden
            </h2>
            <p className="text-neutral-600 mb-6">
              Erstelle deine erste KI-generierte Geschichte und beginne dein
              Abenteuer!
            </p>
            <Button
              onClick={() => setCreateModalOpen(true)}
              className="bg-primary hover:bg-primary-dark text-white font-medium"
            >
              Erste Geschichte erstellen
            </Button>
          </div>
        )}
      </main>

      <CreateStoryModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />
    </div>
  );
}
