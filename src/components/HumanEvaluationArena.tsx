"use client";

import { createClient } from "@supabase/supabase-js";
import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle } from "lucide-react";
import { useUser } from "@/contexts/UserContext";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface WritingPrompt {
  id: string;
  prompt: string;
  chosen: string;
  rejected: string;
  upvotes_chosen: number;
  upvotes_rejected: number;
  timestamp_chosen: number;
  timestamp_rejected: number;
}

interface UserFeedback {
  id?: string;
  user_id: string;
  prompt_id: string;
  selected_text: string;
  is_correct: boolean;
  created_at?: string;
}

export function HumanEvaluationArena() {
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
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmittingRationale, setIsSubmittingRationale] = useState(false);
  const [rationaleError, setRationaleError] = useState<string | null>(null);
  const [pendingScoreUpdate, setPendingScoreUpdate] = useState<boolean | null>(
    null
  );
  const [showUpvotes, setShowUpvotes] = useState(false);
  const [highlight, setHighlight] = useState<string>("");

  const leftTextRef = useRef<HTMLDivElement>(null);
  const rightTextRef = useRef<HTMLDivElement>(null);

  const { user, profile, incrementScore, addViewedPrompt } = useUser();

  const handleHighlight = () => {
    if (typeof window === "undefined") return;
    const selection = window.getSelection();
    const text = selection ? selection.toString().trim() : "";
    if (text) {
      setHighlight(text);
    }
  };

  // Load score from localStorage on initial render
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedScore = localStorage.getItem("writingEvalScore");
      if (savedScore) {
        try {
          const parsedScore = JSON.parse(savedScore);
          setScore(parsedScore);
        } catch (e) {
          console.error("Error parsing saved score:", e);
        }
      }
    }
  }, []);

  // Update score from profile when user logs in
  useEffect(() => {
    if (user && profile) {
      // If user is logged in, use their profile score
      const totalSeen = profile.viewed_prompts?.length || 0;
      setScore((prev) => ({
        correct: profile.score || 0,
        total: Math.max(totalSeen, prev.total), // Use the larger of the two totals
      }));
    }
  }, [user, profile]);

  const fetchRandomPrompt = async () => {
    setError(null);
    setIsLoading(true);

    try {
      // Get a random prompt without filtering for previously viewed ones
      const { data, error } = await supabase
        .from("writingprompts-pairwise-test")
        .select("*")
        .limit(1)
        .order("id", { ascending: Math.random() > 0.5 });

      if (error) {
        const errorMessage =
          error.code === "PGRST116"
            ? "Table not found. Please check if 'writingprompts-pairwise-test' exists and you have access to it."
            : `Database error: ${error.message}`;
        setError(errorMessage);
        console.error("Error details:", error);
        setIsLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        setError("No prompt found. Please try again.");
        setIsLoading(false);
        return;
      }

      const promptData = data[0];
      setPrompt(promptData);
      setSelectedText(null);
      setFeedback(null);

      // Randomly assign chosen/rejected texts to left/right
      const isChosenLeft = Math.random() < 0.5;
      setTexts({
        left: isChosenLeft ? promptData.chosen : promptData.rejected,
        right: isChosenLeft ? promptData.rejected : promptData.chosen,
      });

      // Reset scroll positions
      if (leftTextRef.current) leftTextRef.current.scrollTop = 0;
      if (rightTextRef.current) rightTextRef.current.scrollTop = 0;

      // If user is logged in, still track this prompt as viewed for analytics
      if (user && promptData.id) {
        addViewedPrompt(promptData.id);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setError(`Failed to fetch prompt: ${errorMessage}`);
      console.error("Error fetching prompt:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRandomPrompt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelection = (text: string) => {
    if (selectedText || !prompt) return;
    setPendingSelection(text);
  };

  const confirmSelection = async () => {
    if (!pendingSelection || !prompt) return;

    const isChosen = pendingSelection === prompt.chosen;
    setSelectedText(pendingSelection);
    setFeedback({
      correct: isChosen,
      message: `${isChosen ? "Correct!" : "Incorrect!"} This text received ${
        isChosen ? prompt.upvotes_chosen : prompt.upvotes_rejected
      } upvotes.`,
    });

    // Update local score
    const newScore = {
      correct: score.correct + (isChosen ? 1 : 0),
      total: score.total + 1,
    };
    setScore(newScore);

    // Save score to localStorage for non-logged-in users
    if (typeof window !== "undefined" && !user) {
      localStorage.setItem("writingEvalScore", JSON.stringify(newScore));
    }

    // Store whether this selection was correct for later backend update
    setPendingScoreUpdate(isChosen);

    // If user is logged in, save their feedback
    if (user && prompt.id) {
      try {
        const feedbackData: UserFeedback = {
          user_id: user.id,
          prompt_id: prompt.id,
          selected_text: pendingSelection,
          is_correct: isChosen,
        };

        await supabase.from("user_feedback").insert(feedbackData);
      } catch (error) {
        console.error("Error saving feedback:", error);
      }
    }

    setPendingSelection(null);
    setShowUpvotes(false); // Reset upvotes visibility
    setShowRationale(true);
  };

  const handleNextPrompt = async () => {
    // Update backend score if there's a pending update and the user is logged in
    if (user && pendingScoreUpdate === true) {
      try {
        await incrementScore();
      } catch (error) {
        console.error("Error updating score:", error);
      }
    }

    // Reset states
    setSelectedText(null);
    setFeedback(null);
    setRationale("");
    setPendingScoreUpdate(null);
    setShowUpvotes(false);
    setHighlight("");

    // Fetch next prompt
    fetchRandomPrompt();
  };

  const saveRationale = async () => {
    if (!prompt || !rationale.trim()) return;

    setIsSubmittingRationale(true);
    setRationaleError(null);

    try {
      // Check if user is authenticated for RLS policies
      if (!user) {
        // For anonymous users, we'll show a message that login is required
        setRationaleError(
          "You need to be logged in to submit rationales. Please log in and try again."
        );
        setIsSubmittingRationale(false);
        return;
      }

      // Determine if the user's selection was correct
      const isCorrect = selectedText === prompt.chosen;

      const { error: insertError } = await supabase.from("rationales").insert({
        prompt_id: prompt.id,
        rationale: rationale.trim(),
        user_id: user.id,
        is_correct: isCorrect,
        highlight_text: highlight || null,
      });

      if (insertError) {
        // Handle specific RLS policy violation
        if (insertError.message?.includes("row-level security")) {
          throw new Error(
            "Permission denied: You don't have access to submit rationales."
          );
        }
        throw new Error(insertError.message || "Failed to save rationale");
      }

      // Show upvotes after successful submission
      setShowUpvotes(true);

      // Close the rationale dialog
      setShowRationale(false);
      setRationale(""); // Clear the rationale for next time
      setHighlight("");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setRationaleError(`Failed to save rationale: ${errorMessage}`);
      console.error("Error saving rationale:", error);
    } finally {
      setIsSubmittingRationale(false);
    }
  };

  // Function to handle skipping rationale
  const handleSkipRationale = () => {
    setShowUpvotes(true);
    setShowRationale(false);
    setHighlight("");
  };

  return (
    <div className="flex flex-col items-center gap-8">
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
                {user
                  ? "We encourage you to add rationale for why you selected this response."
                  : "Please log in to submit your rationale. Your insights help us improve our understanding of quality writing."}
              </p>
              {highlight && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Highlighted text:</span> &quot;{highlight}&quot;
                </p>
              )}
              <textarea
                className="w-full h-32 p-3 rounded-lg border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                placeholder={
                  user
                    ? "Enter your thoughts here..."
                    : "Log in to share your thoughts..."
                }
                disabled={isSubmittingRationale || !user}
              />
              {rationaleError && (
                <div className="text-sm text-red-600 dark:text-red-400">
                  {rationaleError}
                </div>
              )}
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={handleSkipRationale}
                  className="transform transition-all hover:scale-105 active:scale-95"
                  disabled={isSubmittingRationale}
                >
                  Skip
                </Button>
                <Button
                  onClick={saveRationale}
                  className="transform transition-all hover:scale-105 active:scale-95"
                  disabled={isSubmittingRationale || !user}
                >
                  {isSubmittingRationale ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      <span>Submitting...</span>
                    </div>
                  ) : !user ? (
                    "Log in to Submit"
                  ) : (
                    "Submit"
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="w-full">
        {/* Score and Feedback Banner */}
        <div className="flex flex-col gap-2 sticky top-0 bg-white dark:bg-gray-900 z-10 pb-1">
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
          ) : null}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : prompt ? (
          <Card className="w-full p-4">
            <div className="mb-3">
              <div className="text-sm font-medium text-blue-600 mb-1">
                Prompt:
              </div>
              <div className="relative pl-4">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-blue-500 rounded-full"></div>
                <h2 className="text-base font-normal leading-relaxed text-gray-700 dark:text-gray-300">
                  {prompt.prompt}
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Text */}
              <div className="flex flex-col gap-4">
                {selectedText &&
                  showUpvotes &&
                  texts.left === prompt.chosen && (
                    <Alert className="bg-green-50 dark:bg-green-950 flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <AlertDescription>
                        {prompt.upvotes_chosen} upvotes
                      </AlertDescription>
                    </Alert>
                  )}
                {selectedText &&
                  showUpvotes &&
                  texts.left === prompt.rejected && (
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
                    onMouseUp={handleHighlight}
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
                {selectedText &&
                  showUpvotes &&
                  texts.right === prompt.chosen && (
                    <Alert className="bg-green-50 dark:bg-green-950 flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <AlertDescription>
                        {prompt.upvotes_chosen} upvotes
                      </AlertDescription>
                    </Alert>
                  )}
                {selectedText &&
                  showUpvotes &&
                  texts.right === prompt.rejected && (
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
                    onMouseUp={handleHighlight}
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
        ) : null}
      </div>
    </div>
  );
}
