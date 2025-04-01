import { Card, CardContent } from "@/components/ui/card";
import { Story } from "@/lib/types";
import { useLocation } from "wouter";

interface StoryCardProps {
  story: Story;
}

export default function StoryCard({ story }: StoryCardProps) {
  const [, navigate] = useLocation();

  return (
    <Card className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-200 cursor-pointer" onClick={() => navigate(`/stories/${story.id}`)}>
      <CardContent className="p-6">
        <h2 className="text-xl font-bold text-neutral-900 mb-2">{story.title}</h2>
        {story.genre && (
          <span className="text-sm text-neutral-600 mb-2 inline-block bg-neutral-100 rounded-full px-3 py-1">
            {story.genre}
          </span>
        )}
        {story.narrativeStyle && (
          <span className="text-sm text-neutral-600 mb-2 ml-2 inline-block bg-neutral-100 rounded-full px-3 py-1">
            {story.narrativeStyle}
          </span>
        )}
        <p className="text-neutral-700 mt-4 line-clamp-3">
          {story.setting || story.mainCharacter || "Eine fesselnde Geschichte, die auf ihre Entdeckung wartet."}
        </p>
        <button className="text-primary hover:text-primary-dark font-medium transition duration-200 mt-4">
          Weiterlesen
        </button>
      </CardContent>
    </Card>
  );
}
