import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Story } from "@/lib/types";
import StoryReader from "@/components/StoryReader";
import CharacterDialog from "@/components/CharacterDialog";
import { Button } from "@/components/ui/button";
import { UserRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function StoryView() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const { data: story, isLoading, error } = useQuery<Story>({
    queryKey: [`/api/stories/${id}`]
  });

  const handleBack = () => {
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-xl font-bold text-red-500 mb-4">
            Die Geschichte konnte nicht geladen werden.
          </div>
          <button
            onClick={handleBack}
            className="bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-lg"
          >
            Zurück zur Übersicht
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-primary text-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">GeschichtenWelt</h1>
          <div className="flex gap-2">
            <CharacterDialog 
              storyId={parseInt(id)}
              trigger={
                <Button variant="secondary" size="sm">
                  <UserRound className="mr-2 h-4 w-4" />
                  Charaktere
                </Button>
              }
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <StoryReader story={story} onBack={handleBack} />
      </main>
    </div>
  );
}
