import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Chapter } from "@/lib/types";
import { ArrowLeft } from "lucide-react";

interface ChapterNavigationProps {
  rootChapter: Chapter;
  currentChapter: Chapter;
  chapterPath: Chapter[];
  onChapterSelect: (chapter: Chapter) => void;
  onBack: () => void;
}

export default function ChapterNavigation({
  rootChapter,
  currentChapter,
  chapterPath,
  onChapterSelect,
  onBack,
}: ChapterNavigationProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6 md:mb-0 h-fit">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-neutral-900">Kapitelübersicht</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="text-neutral-500 hover:text-neutral-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-250px)] pr-3">
        <div className="relative pl-6">
          {/* Root chapter node */}
          <div
            className={`relative z-10 ${
              currentChapter.id === rootChapter.id
                ? "bg-primary text-white"
                : "bg-white border border-neutral-200"
            } rounded-md p-3 mb-3 cursor-pointer`}
            onClick={() => onChapterSelect(rootChapter)}
          >
            <div className="font-medium">Kapitel 1</div>
            <div className="text-sm opacity-90 truncate">{rootChapter.title}</div>
          </div>

          {/* Chapter tree visualization */}
          {chapterPath.length > 0 && (
            <div className="absolute left-2.5 top-[22px] w-0.5 h-[calc(100%-22px)] bg-neutral-200 z-0"></div>
          )}

          {/* Chapter path nodes */}
          {chapterPath.map((chapter, index) => (
            <div key={chapter.id} className="ml-4 relative">
              {/* Horizontal line to node */}
              <div className="absolute left-[-15px] top-[22px] w-[15px] h-0.5 bg-neutral-200"></div>
              
              <div
                className={`relative z-10 ${
                  currentChapter.id === chapter.id
                    ? "bg-primary text-white"
                    : "bg-white border border-neutral-200"
                } rounded-md p-3 mb-3 cursor-pointer`}
                onClick={() => onChapterSelect(chapter)}
              >
                <div className="font-medium">Kapitel {index + 2}</div>
                <div className="text-sm opacity-90 truncate">
                  {chapter.title || "Unbenanntes Kapitel"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
