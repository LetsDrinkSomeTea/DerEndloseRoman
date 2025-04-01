import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ContinuationOption } from "@/lib/types";
import { Loader2, Plus } from "lucide-react";

interface ContinuationOptionsProps {
  options: ContinuationOption[];
  selectedOptionId: number | null;
  customPrompt: string;
  onSelectOption: (id: number) => void;
  onCustomPromptChange: (prompt: string) => void;
  onContinue: () => void;
  onGoBack: () => void;
  isGenerating: boolean;
}

export default function ContinuationOptions({
  options,
  selectedOptionId,
  customPrompt,
  onSelectOption,
  onCustomPromptChange,
  onContinue,
  onGoBack,
  isGenerating,
}: ContinuationOptionsProps) {
  const isButtonDisabled = isGenerating || (!selectedOptionId && !customPrompt);

  return (
    <div>
      <h3 className="text-lg font-bold text-neutral-900 mb-3">
        Wie soll die Geschichte weitergehen?
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {options.map((option) => (
          <div
            key={option.id}
            className={`bg-white rounded-lg shadow-md border-2 ${
              selectedOptionId === option.id
                ? "border-primary"
                : "border-transparent hover:border-primary"
            } p-4 cursor-pointer transition duration-200`}
            onClick={() => onSelectOption(option.id)}
          >
            <h4 className="font-bold text-neutral-900 mb-2">{option.title}</h4>
            <p className="text-sm text-neutral-700 line-clamp-3">
              {option.preview}
            </p>
          </div>
        ))}
      </div>

      <Card className="bg-white rounded-lg shadow-md p-4 mb-6">
        <CardContent className="p-0 pt-4">
          <div className="flex items-center mb-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white mr-2">
              <Plus className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900">
              Eigene Fortsetzung schreiben
            </h3>
          </div>
          <Textarea
            value={customPrompt}
            onChange={(e) => {
              selectedOptionId = null;
              onCustomPromptChange(e.target.value);
            }}
            placeholder="Beschreibe, wie die Geschichte weitergehen soll..."
            className="w-full border border-neutral-200 rounded-lg p-3"
            rows={3}
          />
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onGoBack}
          disabled={isGenerating}
          className="bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-900"
        >
          Zurück
        </Button>

        <Button
          onClick={onContinue}
          disabled={isButtonDisabled}
          className={`bg-primary hover:bg-primary-dark text-white ${
            isButtonDisabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generiere...
            </>
          ) : (
            "Fortsetzen"
          )}
        </Button>
      </div>
    </div>
  );
}
