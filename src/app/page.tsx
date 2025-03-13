"use client";

import { createClient } from "@supabase/supabase-js";
import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, HelpCircle, Info } from "lucide-react";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log(
  "Supabase Key exists:",
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

interface WritingPrompt {
  id: string;
  prompt: string;
  chosen: string;
  rejected: string;
  upvotes_chosen: number;
  upvotes_rejected: number;
}

export default function Home() {
  const [prompt, setPrompt] = useState<WritingPrompt | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    correct: boolean;
    message: string;
  } | null>(null);
  const [pendingSelection, setPendingSelection] = useState<string | null>(null);
  const [showRationale, setShowRationale] = useState(false);
  const [rationale, setRationale] = useState("");
  const [texts, setTexts] = useState<{ left: string; right: string }>({
    left: "",
    right: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const leftTextRef = useRef<HTMLDivElement>(null);
  const rightTextRef = useRef<HTMLDivElement>(null);

  const fetchRandomPrompt = async () => {
    setError(null);
    try {
      const { data, error } = await supabase
        .from("writingprompts-pairwise-test")
        .select("*")
        .limit(1)
        .order("id", { ascending: true }) // Order by id first
        .then((result) => {
          if (result.error) throw result.error;
          // Get total count for random offset
          return supabase
            .from("writingprompts-pairwise-test")
            .select("*", { count: "exact" })
            .limit(1)
            .single();
        })
        .then((result) => {
          if (result.error) throw result.error;
          const count = result.count || 0;
          const randomOffset = Math.floor(Math.random() * count);
          return supabase
            .from("writingprompts-pairwise-test")
            .select("*")
            .range(randomOffset, randomOffset)
            .single();
        });

      if (error) {
        const errorMessage =
          error.code === "PGRST116"
            ? "Table not found. Please check if 'writingprompts-pairwise-test' exists and you have access to it."
            : `Database error: ${error.message}`;
        setError(errorMessage);
        console.error("Error details:", error);
        return;
      }

      setPrompt(data);
      setSelectedText(null);
      setFeedback(null);

      // Randomly assign chosen/rejected texts to left/right
      const isChosenLeft = Math.random() < 0.5;
      setTexts({
        left: isChosenLeft ? data.chosen : data.rejected,
        right: isChosenLeft ? data.rejected : data.chosen,
      });

      // Reset scroll positions
      if (leftTextRef.current) leftTextRef.current.scrollTop = 0;
      if (rightTextRef.current) rightTextRef.current.scrollTop = 0;
    } catch (error) {
      setError("Failed to fetch prompt. Please try again.");
      console.error("Error fetching prompt:", error);
    }
  };

  useEffect(() => {
    fetchRandomPrompt();
  }, []);

  const handleSelection = (text: string) => {
    if (selectedText || !prompt) return;
    setPendingSelection(text);
  };

  const confirmSelection = () => {
    if (!pendingSelection || !prompt) return;

    const isChosen = pendingSelection === prompt.chosen;
    setSelectedText(pendingSelection);
    setFeedback({
      correct: isChosen,
      message: `${isChosen ? "Correct!" : "Incorrect!"} This text received ${
        isChosen ? prompt.upvotes_chosen : prompt.upvotes_rejected
      } upvotes.`,
    });
    setScore((prev) => ({
      correct: prev.correct + (isChosen ? 1 : 0),
      total: prev.total + 1,
    }));
    setPendingSelection(null);
    setShowRationale(true);
  };

  const handleNextPrompt = () => {
    setSelectedText(null);
    setFeedback(null);
    setRationale("");
    fetchRandomPrompt();
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 flex flex-col items-center gap-8 relative">
      {/* Help Modal */}
      {showHelp && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center"
          onClick={() => setShowHelp(false)}
        >
          <Card
            className="w-full max-w-lg p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-lg font-normal">
              These prompts and responses were pulled from r/WritingPrompts to
              see if we can blindly evaluate better creative writing, using
              upvotes as a ground truth.
            </p>
          </Card>
        </div>
      )}

      {/* Confirmation Dialog */}
      {pendingSelection && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="w-full max-w-sm p-6">
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-medium">Confirm your selection?</h3>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setPendingSelection(null)}
                  className="transform transition-all hover:scale-105 active:scale-95"
                >
                  Keep Reading
                </Button>
                <Button
                  onClick={confirmSelection}
                  className="transform transition-all hover:scale-105 active:scale-95"
                >
                  Confirm
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Rationale Dialog */}
      {showRationale && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="w-full max-w-lg p-6">
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-medium">Add Your Rationale</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Optionally, we encourage you to add rationale for why you
                selected this response.
              </p>
              <textarea
                className="w-full h-32 p-3 rounded-lg border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                placeholder="Enter your thoughts here..."
              />
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowRationale(false)}
                  className="transform transition-all hover:scale-105 active:scale-95"
                >
                  Skip
                </Button>
                <Button
                  onClick={() => {
                    // Here you could save the rationale if needed
                    setShowRationale(false);
                  }}
                  className="transform transition-all hover:scale-105 active:scale-95"
                >
                  Submit
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="w-full max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0 mb-4">
          <h1 className="text-2xl font-medium tracking-tight text-center sm:text-left">
            Creative Writing Evaluation Arena 📝
          </h1>
          <div className="flex items-center justify-center sm:justify-end gap-4">
            <div className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full shadow-sm">
              <div className="text-white text-sm font-medium">
                Score: <span className="text-base">{score.correct}</span>
                <span className="text-white/80 mx-0.5">/</span>
                <span className="text-white/80">{score.total}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowHelp(true)}
              className="rounded-full"
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Score and Feedback Banner */}
        <div className="flex flex-col gap-2 sticky top-0 bg-white dark:bg-gray-900 z-10 pb-2">
          {selectedText && !showRationale && feedback ? (
            <div
              className={`w-full p-4 rounded-lg flex justify-between items-center ${
                feedback.correct
                  ? "bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200"
                  : "bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200"
              }`}
            >
              <div className="flex items-center gap-2">
                {feedback.correct ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                )}
                <span className="font-normal">
                  {feedback.correct
                    ? "You chose correctly!"
                    : "You chose incorrectly!"}
                </span>
              </div>
              <Button
                onClick={handleNextPrompt}
                className={`${
                  feedback.correct
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                } text-white transform transition-all hover:scale-105 active:scale-95`}
              >
                Next Prompt
              </Button>
            </div>
          ) : (
            <div className="text-sm text-gray-600 dark:text-gray-400 text-left flex items-center gap-2">
              <Info className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              Select the comment you think is higher quality writing, given the
              prompt.
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        {prompt && (
          <Card className="w-full p-6">
            <div className="mb-4">
              <div className="text-sm font-medium text-blue-600 mb-2">
                Prompt:
              </div>
              <div className="relative pl-4">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-blue-500 rounded-full"></div>
                <h2 className="text-base font-normal leading-relaxed text-gray-700 dark:text-gray-300">
                  {prompt.prompt}
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Text */}
              <div className="flex flex-col gap-4">
                {selectedText && texts.left === prompt.chosen && (
                  <Alert className="bg-green-50 dark:bg-green-950 flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <AlertDescription>
                      {prompt.upvotes_chosen} upvotes
                    </AlertDescription>
                  </Alert>
                )}
                {selectedText && texts.left === prompt.rejected && (
                  <Alert className="bg-red-50 dark:bg-red-950 flex items-center gap-3">
                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <AlertDescription>
                      {prompt.upvotes_rejected} upvotes
                    </AlertDescription>
                  </Alert>
                )}
                <Card
                  className={`p-4 transition-all hover:shadow-lg transform ${
                    selectedText
                      ? ""
                      : "cursor-pointer hover:ring-2 hover:ring-indigo-500 hover:scale-[1.02] active:scale-[0.98]"
                  } ${
                    selectedText && texts.left === selectedText
                      ? "ring-2 ring-indigo-500"
                      : ""
                  }`}
                  onClick={() => !selectedText && handleSelection(texts.left)}
                >
                  <div
                    className="max-h-[500px] overflow-y-auto"
                    ref={leftTextRef}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {texts.left}
                    </p>
                  </div>
                </Card>
              </div>

              {/* Right Text */}
              <div className="flex flex-col gap-4">
                {selectedText && texts.right === prompt.chosen && (
                  <Alert className="bg-green-50 dark:bg-green-950 flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <AlertDescription>
                      {prompt.upvotes_chosen} upvotes
                    </AlertDescription>
                  </Alert>
                )}
                {selectedText && texts.right === prompt.rejected && (
                  <Alert className="bg-red-50 dark:bg-red-950 flex items-center gap-3">
                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <AlertDescription>
                      {prompt.upvotes_rejected} upvotes
                    </AlertDescription>
                  </Alert>
                )}
                <Card
                  className={`p-4 transition-all hover:shadow-lg transform ${
                    selectedText
                      ? ""
                      : "cursor-pointer hover:ring-2 hover:ring-indigo-500 hover:scale-[1.02] active:scale-[0.98]"
                  } ${
                    selectedText && texts.right === selectedText
                      ? "ring-2 ring-indigo-500"
                      : ""
                  }`}
                  onClick={() => !selectedText && handleSelection(texts.right)}
                >
                  <div
                    className="max-h-[500px] overflow-y-auto"
                    ref={rightTextRef}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {texts.right}
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
