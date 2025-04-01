import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Story } from "@/lib/types";
import StoryReader from "@/components/StoryReader";
import StoryCover from "@/components/StoryCover";
import { Button } from "@/components/ui/button";
import { BookOpen, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function StoryView() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showCover, setShowCover] = useState(true);
  
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
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => setShowCover(!showCover)}
            >
              {showCover ? (
                <>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Lesen
                </>
              ) : (
                <>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Zur Übersicht
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleBack}
              className="bg-white/20 hover:bg-white/30"
            >
              Zurück
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {showCover ? (
          <StoryCover 
            story={story} 
            onStartReading={() => setShowCover(false)}
          />
        ) : (
          <StoryReader story={story} onBack={() => setShowCover(true)} />
        )}
      </main>
    </div>
  );
}
