import { Story, Chapter } from "@/lib/types";
import ChapterNavigation from "./ChapterNavigation";
import ChapterTree from "./ChapterTree";
import ContinuationOptions from "./ContinuationOptions";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface StoryReaderProps {
  story: Story;
  onBack: () => void;
}

export default function StoryReader({ story, onBack }: StoryReaderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(
    story.rootChapter || null,
  );
  const [chapterPath, setChapterPath] = useState<Chapter[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [navTab, setNavTab] = useState<string>("path"); // "path" oder "tree"

  // Fetch all chapters for the tree view
  const { data: allChapters = [] } = useQuery({
    queryKey: ["/api/stories", story.id, "chapters"],
    queryFn: async () => {
      const response = await fetch(`/api/stories/${story.id}/chapters`);
      if (!response.ok) {
        throw new Error("Failed to fetch all chapters");
      }
      return response.json();
    },
  });

  // Fetch chapter path when current chapter changes
  const { data: pathData } = useQuery({
    queryKey: ["/api/chapters", currentChapter?.id, "path"],
    queryFn: async () => {
      if (!currentChapter || currentChapter.id === story.rootChapter?.id) {
        return [];
      }
      const response = await fetch(`/api/chapters/${currentChapter.id}/path`);
      if (!response.ok) {
        throw new Error("Failed to fetch chapter path");
      }
      return response.json();
    },
    enabled: !!currentChapter && currentChapter.id !== story.rootChapter?.id,
  });

  useEffect(() => {
    if (
      pathData &&
      currentChapter &&
      currentChapter.id !== story.rootChapter?.id
    ) {
      // Remove the root chapter from the path
      setChapterPath(
        pathData.filter(
          (chapter: Chapter) => chapter.id !== story.rootChapter?.id,
        ),
      );
    } else {
      setChapterPath([]);
    }
  }, [pathData, currentChapter, story.rootChapter?.id]);

  const continueMutation = useMutation({
    mutationFn: async () => {
      if (!currentChapter) return null;

      const payload = {
        storyId: story.id,
        chapterId: currentChapter.id,
        ...(selectedOptionId ? { selectedOptionId } : {}),
        ...(customPrompt ? { customPrompt } : {}),
      };

      const response = await apiRequest(
        "POST",
        "/api/stories/continue",
        payload,
      );
      return response.json();
    },
    onSuccess: (data) => {
      if (data) {
        // Invalidiere Kapitelbaum und Pfad
        queryClient.invalidateQueries({
          queryKey: ["/api/chapters", data.id, "path"],
        });
        queryClient.invalidateQueries({
          queryKey: ["/api/stories", story.id, "chapters"],
        });
        
        setCurrentChapter(data);
        setSelectedOptionId(null);
        setCustomPrompt("");
      }
    },
    onError: () => {
      toast({
        title: "Fehler",
        description:
          "Die Geschichte konnte nicht fortgesetzt werden. Bitte versuche es erneut.",
        variant: "destructive",
      });
    },
  });

  const handleSelectChapter = (chapter: Chapter) => {
    setCurrentChapter(chapter);
    setSelectedOptionId(null);
    setCustomPrompt("");
  };

  const handleSelectOption = (id: number) => {
    setSelectedOptionId(id);
    setCustomPrompt("");
  };

  const handleCustomPromptChange = (prompt: string) => {
    setCustomPrompt(prompt);
    setSelectedOptionId(null);
  };

  const handleContinue = () => {
    if (!selectedOptionId && !customPrompt) return;
    continueMutation.mutate();
  };

  const handleGoBack = () => {
    if (chapterPath.length > 0) {
      // Go to previous chapter
      const previousChapter =
        chapterPath[chapterPath.length - 1] || story.rootChapter;
      if (previousChapter) {
        setCurrentChapter(previousChapter);
        setSelectedOptionId(null);
        setCustomPrompt("");
      }
    } else {
      // At root, go back to story list
      onBack();
    }
  };

  if (!currentChapter || !story.rootChapter) {
    return <div>Kapitel nicht gefunden.</div>;
  }

  // Calculate chapter depth (for display purposes)
  const chapterDepth = chapterPath.length + 1;

  const handleChapterSelect = (chapterId: number) => {
    const chapter = allChapters.find(ch => ch.id === chapterId);
    if (chapter) {
      handleSelectChapter(chapter);
    }
  };

  return (
    <div className="md:flex gap-8">
      {/* Chapter Navigation Sidebar */}
      <div className="md:w-1/3 lg:w-1/4">
        <Card className="p-4 mb-4">
          <Tabs value={navTab} onValueChange={setNavTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-2">
              <TabsTrigger value="path">Pfad</TabsTrigger>
              <TabsTrigger value="tree">Baum</TabsTrigger>
            </TabsList>
            
            <TabsContent value="path">
              <ChapterNavigation
                rootChapter={story.rootChapter}
                currentChapter={currentChapter}
                chapterPath={chapterPath}
                onChapterSelect={handleSelectChapter}
                onBack={onBack}
              />
            </TabsContent>
            
            <TabsContent value="tree">
              {allChapters.length > 0 && (
                <ChapterTree
                  chapters={allChapters}
                  currentChapter={currentChapter}
                  onSelectChapter={handleChapterSelect}
                />
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      {/* Story Content */}
      <div className="md:w-2/3 lg:w-3/4">
        <Card className="bg-white rounded-lg shadow-md p-6 mb-6">
          <CardContent className="p-0">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-2xl font-bold text-neutral-900">
                  {story.title}
                </h1>
                <div className="flex flex-wrap gap-2 mt-2">
                  {story.genre && (
                    <span className="text-sm bg-neutral-100 text-neutral-700 rounded-full px-3 py-1">
                      {story.genre}
                    </span>
                  )}
                  {story.narrativeStyle && (
                    <span className="text-sm bg-neutral-100 text-neutral-700 rounded-full px-3 py-1">
                      {story.narrativeStyle}
                    </span>
                  )}
                </div>
              </div>
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-md text-sm font-medium">
                Kapitel {chapterDepth}
              </span>
            </div>

            <h2 className="text-xl font-bold text-neutral-900 mb-3">
              {currentChapter.title}
            </h2>
            <div
              className="font-serif text-neutral-900 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: currentChapter.content }}
            />
          </CardContent>
        </Card>

        {/* Chapter Continuation Options */}
        {currentChapter.continuationOptions && (
          <ContinuationOptions
            options={currentChapter.continuationOptions}
            selectedOptionId={selectedOptionId}
            customPrompt={customPrompt}
            onSelectOption={handleSelectOption}
            onCustomPromptChange={handleCustomPromptChange}
            onContinue={handleContinue}
            onGoBack={handleGoBack}
            isGenerating={continueMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}
