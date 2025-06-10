"use client";

import { supabase } from "@/lib/supabase/client";
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TextPane } from "@/components/TextPane";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ReportContentButton } from "./ReportContentButton";
import { CheckCircle2, XCircle } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { getRandomPrompt } from "@/lib/prompts";

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
  const [loading, setLoading] = useState(false);
  const [isSubmittingRationale, setIsSubmittingRationale] = useState(false);
  const [rationaleError, setRationaleError] = useState<string | null>(null);
  const [pendingScoreUpdate, setPendingScoreUpdate] = useState<boolean | null>(
    null
  );
  const [showUpvotes, setShowUpvotes] = useState(false);
  const [highlight, setHighlight] = useState<string>("");
  const [showHighlightTip, setShowHighlightTip] = useState(false);
  const [prompts, setPrompts] = useState<Pick<WritingPrompt, "id" | "prompt">[]>([]);
  const [selectedId, setSelectedId] = useState<string | "random">("random");
  const [hasInitializedScore, setHasInitializedScore] = useState(false);

  const leftTextRef = useRef<HTMLDivElement>(null);
  const rightTextRef = useRef<HTMLDivElement>(null);

  const { user, profile, incrementScore, addViewedPrompt, isLoading } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  const dismissHighlightTip = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("highlightTipSeen", "true");
    }
    setShowHighlightTip(false);
  };

  // Load score from localStorage on initial render
  useEffect(() => {
    if (typeof window !== "undefined" && !hasInitializedScore) {
      const savedScore = localStorage.getItem("writingEvalScore");
      if (savedScore) {
        try {
          const parsedScore = JSON.parse(savedScore);
          setScore(parsedScore);
          setHasInitializedScore(true);
        } catch (e) {
          console.error("Error parsing saved score:", e);
          // Initialize with default score if parsing fails
          setScore({ correct: 0, total: 0 });
          setHasInitializedScore(true);
        }
      } else if (!user) {
        // Initialize score for non-logged-in users
        setScore({ correct: 0, total: 0 });
        setHasInitializedScore(true);
      }
      const tipSeen = localStorage.getItem("highlightTipSeen");
      if (!tipSeen) {
        setShowHighlightTip(true);
      }
    }
  }, [user, hasInitializedScore]);

  // Initialize score from profile only once when user logs in
  useEffect(() => {
    if (user && profile && !hasInitializedScore) {
      // If user is logged in, use their profile score only on initial load
      const totalSeen = profile.viewed_prompts?.length || 0;
      setScore({
        correct: profile.score || 0,
        total: totalSeen || 0,
      });
      setHasInitializedScore(true);
    }
  }, [user, profile, hasInitializedScore]);

  // Load prompt options when a user is authenticated
  useEffect(() => {
    if (!user) return;
    const loadPrompts = async () => {
      const { data } = await supabase
        .from("writingprompts-pairwise-test")
        .select("id,prompt")
        .limit(50);
      setPrompts(data || []);
    };
    loadPrompts();
  }, [user]);

  // Handle pending selection confirmation
  useEffect(() => {
    if (pendingSelection) {
      confirmSelection();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingSelection]);

  const fetchRandomPrompt = async () => {
    setError(null);
    setLoading(true);

    try {
      const data = await getRandomPrompt('id,prompt,chosen,rejected,upvotes_chosen,upvotes_rejected,timestamp_chosen,timestamp_rejected', true);
      if (!data) {
        setError("No prompt found. Please try again.");
        setLoading(false);
        return;
      }

      // Type check to ensure data is a WritingPrompt
      if (typeof data === 'string' || !('id' in data) || !('chosen' in data) || !('rejected' in data)) {
        setError("Invalid prompt data. Please try again.");
        setLoading(false);
        return;
      }

      const promptData = data as WritingPrompt;
      setPrompt(promptData);
      setSelectedText(null);
      setFeedback(null);

      // Randomize text assignment
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
      setLoading(false);
    }
  };

  const fetchPromptById = async (id: string) => {
    setError(null);
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("writingprompts-pairwise-test")
        .select("id,prompt,chosen,rejected,upvotes_chosen,upvotes_rejected,timestamp_chosen,timestamp_rejected")
        .eq("id", id)
        .single();

      if (error || !data) {
        setError("Failed to fetch prompt. Please try again.");
        setLoading(false);
        return;
      }

      const promptData = data as WritingPrompt;
      setPrompt(promptData);
      setSelectedText(null);
      setFeedback(null);

      // Randomize text assignment
      const isChosenLeft = Math.random() < 0.5;
      setTexts({
        left: isChosenLeft ? promptData.chosen : promptData.rejected,
        right: isChosenLeft ? promptData.rejected : promptData.chosen,
      });

      // Reset scroll positions
      if (leftTextRef.current) leftTextRef.current.scrollTop = 0;
      if (rightTextRef.current) rightTextRef.current.scrollTop = 0;

      // If user is logged in, track this prompt as viewed for analytics
      if (user && promptData.id) {
        addViewedPrompt(promptData.id);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setError(`Failed to fetch prompt: ${errorMessage}`);
      console.error("Error fetching prompt:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrompt = async () => {
    if (selectedId === "random") {
      await fetchRandomPrompt();
    } else {
      await fetchPromptById(selectedId);
    }
  };

  useEffect(() => {
    if (user || !isLoading) {
      fetchPrompt();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, user, isLoading]);

  if (!user && !isLoading) {
    return (
      <div className="text-center py-10">
        <p className="mb-4">You must be logged in to evaluate.</p>
        <Button onClick={() => router.push(`/login?redirect=${encodeURIComponent(pathname)}`)}>Log in</Button>
      </div>
    );
  }

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

    // Save score to localStorage for all users to maintain session state
    if (typeof window !== "undefined") {
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
    fetchPrompt();
  };

  const saveRationale = async () => {
    if (!prompt) return;

    setIsSubmittingRationale(true);
    setRationaleError(null);

    try {
      // Only save rationale to database if there's actual content and user is authenticated
      if (rationale.trim() && user) {
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
      }

      // Always show upvotes and continue the flow, regardless of whether rationale was saved
      setShowUpvotes(true);

      // Close the rationale dialog
      setShowRationale(false);
      setRationale(""); // Clear the rationale for next time
      setHighlight("");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setRationaleError(`Failed to save rationale: ${errorMessage}`);
      console.error("Error saving rationale:", error);
    } finally {
      setIsSubmittingRationale(false);
    }
  };

  const handleSkipRationale = () => {
    setShowRationale(false);
    setRationale("");
    setHighlight("");
  };

  return (
    <div className="flex flex-col gap-4 items-center">
      {/* Prompt Selection UI for logged in users */}
      {user && prompts.length > 0 && (
        <div className="flex gap-2 items-center w-full max-w-2xl">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Choose prompt:
          </label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="random">Random prompt</option>
            {prompts.map((p: Pick<WritingPrompt, "id" | "prompt">) => (
              <option key={p.id} value={p.id}>
                {p.prompt.slice(0, 60)}...
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Highlight tip */}
      {showHighlightTip && (
        <Alert className="max-w-2xl">
          <AlertDescription className="flex justify-between items-center">
            <span>
              💡 Tip: You can highlight text in the stories by selecting it with your mouse. 
              This helps when explaining your choice!
            </span>
            <Button variant="ghost" size="sm" onClick={dismissHighlightTip}>
              Got it
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Score Display */}
      <div className="text-center">
        <p className="text-lg font-medium">
          Score: {score.correct} / {score.total}{" "}
          {score.total > 0 && (
            <span className="text-gray-600 dark:text-gray-400">
              ({Math.round((score.correct / score.total) * 100)}%)
            </span>
          )}
        </p>
      </div>

      {/* Rationale Modal */}
      {showRationale && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="w-full max-w-lg p-6">
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-medium">Add Your Rationale (Optional)</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                We encourage you to add rationale for why you selected this response. You can also submit without adding any rationale.
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
                placeholder="Enter your thoughts here... (optional)"
                disabled={isSubmittingRationale}
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
                  disabled={isSubmittingRationale}
                >
                  {isSubmittingRationale ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      <span>Submitting...</span>
                    </div>
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

        {loading ? (
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
              <div className="mt-2">
                <ReportContentButton contentId={prompt.id} contentType="prompt" />
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
                  <TextPane
                    ref={leftTextRef}
                    pairedRef={rightTextRef}
                    text={texts.left}
                    enableHighlight
                    id="he-left-pane"
                    onHighlight={setHighlight}
                  />
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
                  <TextPane
                    ref={rightTextRef}
                    pairedRef={leftTextRef}
                    text={texts.right}
                    enableHighlight
                    id="he-right-pane"
                    onHighlight={setHighlight}
                  />
                </Card>
              </div>
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
