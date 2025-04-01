import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Character } from "@/lib/types";
import { getQueryFn } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";

interface CharacterListProps {
  storyId: number;
}

export default function CharacterList({ storyId }: CharacterListProps) {
  const { data: characters, isLoading } = useQuery({
    queryKey: [`/api/stories/${storyId}/characters`], 
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!storyId
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Charaktere</h2>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="mb-4">
            <CardHeader className="p-4 pb-2">
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!characters || !Array.isArray(characters) || characters.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Charaktere</h2>
        <p className="text-muted-foreground">Keine Charaktere für diese Geschichte.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Charaktere</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {characters.map((character: Character) => (
          <Card key={character.id} className="mb-4">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-lg">{character.name}</CardTitle>
              {character.age && (
                <CardDescription>{character.age} Jahre alt</CardDescription>
              )}
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {character.personality && (
                <div className="mb-2">
                  <Badge variant="outline" className="mb-2 mr-2">Persönlichkeit</Badge>
                  <p className="text-sm">{character.personality}</p>
                </div>
              )}
              {character.background && (
                <div>
                  <Badge variant="outline" className="mb-2 mr-2">Hintergrund</Badge>
                  <p className="text-sm">{character.background}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}