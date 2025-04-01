import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const createCharacterSchema = z.object({
  storyId: z.number(),
  name: z.string().min(1, "Der Name des Charakters ist erforderlich."),
  age: z.string().optional(),
  background: z.string().optional(),
  personality: z.string().optional(),
});

type CreateCharacterFormValues = z.infer<typeof createCharacterSchema>;

interface CreateCharacterFormProps {
  storyId: number;
  onSuccess?: () => void;
}

export default function CreateCharacterForm({ storyId, onSuccess }: CreateCharacterFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreateCharacterFormValues>({
    resolver: zodResolver(createCharacterSchema),
    defaultValues: {
      storyId: storyId,
      name: "",
      age: "",
      background: "",
      personality: "",
    },
  });

  const createCharacterMutation = useMutation({
    mutationFn: async (data: CreateCharacterFormValues) => {
      return apiRequest("POST", "/api/characters", data);
    },
    onSuccess: () => {
      toast({
        title: "Charakter erstellt",
        description: "Der Charakter wurde erfolgreich erstellt.",
      });
      form.reset({
        storyId: storyId,
        name: "",
        age: "",
        background: "",
        personality: "",
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/stories/${storyId}/characters`],
      });
      if (onSuccess) {
        onSuccess();
      }
      setIsSubmitting(false);
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: "Beim Erstellen des Charakters ist ein Fehler aufgetreten.",
        variant: "destructive",
      });
      console.error("Error creating character:", error);
      setIsSubmitting(false);
    },
  });

  function onSubmit(data: CreateCharacterFormValues) {
    setIsSubmitting(true);
    createCharacterMutation.mutate(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Name des Charakters" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="age"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alter</FormLabel>
              <FormControl>
                <Input placeholder="Alter des Charakters" {...field} />
              </FormControl>
              <FormDescription>Optional: z.B. "23" oder "Mitte zwanzig"</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="personality"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Persönlichkeit</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Beschreibung der Persönlichkeit des Charakters"
                  {...field}
                />
              </FormControl>
              <FormDescription>Optional: Charakterzüge, Verhalten, etc.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="background"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hintergrund</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Hintergrundgeschichte des Charakters"
                  {...field}
                />
              </FormControl>
              <FormDescription>Optional: Herkunft, Vergangenheit, etc.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Wird erstellt..." : "Charakter erstellen"}
        </Button>
      </form>
    </Form>
  );
}