import { ModelEvaluationArena } from "@/components/ModelEvaluationArena";
import { WritingTypeToggle } from "@/components/WritingTypeToggle";
import { UserProfileButton } from "@/components/UserProfileButton";
import { ScoreDisplay } from "@/components/ScoreDisplay";
import { HelpButton } from "@/components/HelpButton";
import { Info } from "lucide-react";

export default function ModelEvaluation() {
  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0 mb-4">
          <h1 className="text-2xl font-medium tracking-tight text-center sm:text-left">
            Model Writing Evaluation Arena 🤖
          </h1>
          <div className="flex items-center justify-center sm:justify-end gap-3">
            <ScoreDisplay mode="model" />
            <HelpButton mode="model" />
            <UserProfileButton />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 sticky top-0 bg-white dark:bg-gray-900 z-10 pb-2">
          <div className="text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left flex items-center gap-2">
            <Info className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            Rate the quality of the AI-generated writing, given the prompt.
          </div>
          <div className="flex justify-center sm:justify-end">
            <WritingTypeToggle />
          </div>
        </div>

        <ModelEvaluationArena />
      </div>
    </div>
  );
}
