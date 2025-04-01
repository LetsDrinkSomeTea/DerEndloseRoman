import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserRound, UserPlus } from "lucide-react";

import CharacterList from "./CharacterList";
import CreateCharacterForm from "./CreateCharacterForm";

interface CharacterDialogProps {
  storyId: number;
  trigger?: React.ReactNode;
}

export default function CharacterDialog({ storyId, trigger }: CharacterDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("list");

  const handleAddSuccess = () => {
    setActiveTab("list");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <UserRound className="mr-2 h-4 w-4" />
            Charaktere
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Charaktere der Geschichte</DialogTitle>
          <DialogDescription>
            Verwalte die Charaktere dieser Geschichte. Du kannst neue Charaktere 
            hinzufügen oder bestehende einsehen.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">
              <UserRound className="mr-2 h-4 w-4" />
              Charakterliste
            </TabsTrigger>
            <TabsTrigger value="add">
              <UserPlus className="mr-2 h-4 w-4" />
              Charakter hinzufügen
            </TabsTrigger>
          </TabsList>
          <TabsContent value="list" className="pt-4">
            <CharacterList storyId={storyId} />
          </TabsContent>
          <TabsContent value="add" className="pt-4">
            <CreateCharacterForm storyId={storyId} onSuccess={handleAddSuccess} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}