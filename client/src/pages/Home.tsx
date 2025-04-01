import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Story } from "@/lib/types";
import StoryCard from "@/components/StoryCard";
import CreateStoryModal from "@/components/CreateStoryModal";
import { PlusIcon, BookIcon } from "lucide-react";

export default function Home() {
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const { data: stories, isLoading, error } = useQuery<Story[]>({
    queryKey: ["/api/stories"],
  });

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-primary text-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">GeschichtenWelt</h1>
          <Button 
            onClick={() => setCreateModalOpen(true)}
            className="bg-[#FF9800] hover:bg-[#F57C00] text-white"
          >
            <PlusIcon className="h-5 w-5 mr-1" />
            Neue Geschichte
          </Button>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        ) : (
          <div className="col-span-full bg-white rounded-lg shadow-md p-8 text-center">
            <BookIcon className="h-16 w-16 mx-auto text-neutral-400 mb-4" />
            <h2 className="text-xl font-bold text-neutral-800 mb-2">
              Keine Geschichten gefunden
            </h2>
            <p className="text-neutral-600 mb-6">
              Erstelle deine erste KI-generierte Geschichte und beginne dein Abenteuer!
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

      <CreateStoryModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
    </div>
  );
}
