import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CreateStoryInput, Story } from "@/lib/types";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

interface CreateStoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateStoryModal({ open, onOpenChange }: CreateStoryModalProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [storyData, setStoryData] = useState<CreateStoryInput>({
    title: "",
    genre: "",
    narrativeStyle: "",
    setting: "",
    targetAudience: "",
    mainCharacter: "",
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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setStoryData({
      ...storyData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createStoryMutation.mutate(storyData);
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
      });
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
          <div>
            <Label htmlFor="title" className="text-sm font-medium text-neutral-700">
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
              <Label htmlFor="genre" className="text-sm font-medium text-neutral-700">
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
              <Label htmlFor="narrativeStyle" className="text-sm font-medium text-neutral-700">
                Erzählstil <span className="text-neutral-500">(optional)</span>
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
            <Label htmlFor="setting" className="text-sm font-medium text-neutral-700">
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
            <Label htmlFor="targetAudience" className="text-sm font-medium text-neutral-700">
              Zielgruppe <span className="text-neutral-500">(optional)</span>
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
            <Label htmlFor="mainCharacter" className="text-sm font-medium text-neutral-700">
              Hauptcharakter <span className="text-neutral-500">(optional)</span>
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
