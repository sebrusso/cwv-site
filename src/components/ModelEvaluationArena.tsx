"use client";

import { createClient } from "@supabase/supabase-js";
import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useUser } from "@/contexts/UserContext";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface WritingPrompt {
  id: bigint;
  prompt: string;
  generated_response_A: string;
  generated_response_B: string;
  rm_choice: string;
}

interface ModelEvaluation {
  id?: string;
  user_id: string;
  prompt_id: bigint;
  selected_response: "A" | "B";
  ground_truth: string;
  is_correct: boolean;
  created_at?: string;
}

interface ModelRationale {
  id?: string;
  evaluation_id: string;
  rationale: string;
  created_at?: string;
}

export function ModelEvaluationArena() {
  const [prompt, setPrompt] = useState<WritingPrompt | null>(null);
  const [selectedResponse, setSelectedResponse] = useState<string | null>(null);
  const [pendingSelection, setPendingSelection] = useState<string | null>(null);
  const [showRationale, setShowRationale] = useState(false);
  const [rationale, setRationale] = useState("");
  const [responses, setResponses] = useState<{ left: string; right: string }>({
    left: "",
    right: "",
  });
  const [responseMapping, setResponseMapping] = useState<{
    left: "A" | "B";
    right: "A" | "B";
  }>({
    left: "A",
    right: "B",
  });
  const [evaluationId, setEvaluationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmittingRationale, setIsSubmittingRationale] = useState(false);
  const [rationaleError, setRationaleError] = useState<string | null>(null);

  const leftResponseRef = useRef<HTMLDivElement>(null);
  const rightResponseRef = useRef<HTMLDivElement>(null);

  const { user } = useUser();

  const fetchRandomPrompt = async () => {
    setError(null);
    setIsLoading(true);

    try {
      // First, get the count of all prompts to determine a random offset
      const { count, error: countError } = await supabase
        .from("writingprompts-generations")
        .select("*", { count: "exact", head: true });

      if (countError) {
        console.error("Error getting prompt count:", countError);
        setError("Error fetching prompts. Please try again.");
        setIsLoading(false);
        return;
      }

      if (!count || count === 0) {
        setError("No prompts available. Please try again later.");
        setIsLoading(false);
        return;
      }

      // Generate a random offset to get a truly random prompt
      const randomOffset = Math.floor(Math.random() * count);
      console.log(
        `Fetching random prompt with offset ${randomOffset} out of ${count} total prompts`
      );

      // Get a random prompt using the offset
      const { data, error } = await supabase
        .from("writingprompts-generations")
        .select("*")
        .range(randomOffset, randomOffset);

      // If no prompts are available, show a message
      if (error || !data || data.length === 0) {
        setError("No prompts available. Please try again later.");
        setIsLoading(false);
        return;
      }

      const promptData = data[0];
      console.log(`Loaded prompt ID: ${promptData.id}`);

      setPrompt(promptData);
      setSelectedResponse(null);
      setEvaluationId(null);

      // Randomly assign responses to left/right
      const isResponseALeft = Math.random() < 0.5;
      setResponses({
        left: isResponseALeft
          ? promptData.generated_response_A
          : promptData.generated_response_B,
        right: isResponseALeft
          ? promptData.generated_response_B
          : promptData.generated_response_A,
      });

      // Track which position (left/right) corresponds to which response (A/B)
      setResponseMapping({
        left: isResponseALeft ? "A" : "B",
        right: isResponseALeft ? "B" : "A",
      });

      // Reset scroll positions
      if (leftResponseRef.current) leftResponseRef.current.scrollTop = 0;
      if (rightResponseRef.current) rightResponseRef.current.scrollTop = 0;
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
  }, []);

  const handleSelection = (response: string) => {
    if (selectedResponse || !prompt) return;
    setPendingSelection(response);
  };

  const confirmSelection = async () => {
    if (!pendingSelection || !prompt) return;

    setSelectedResponse(pendingSelection);

    // Determine which response (A or B) was selected
    const selectedChoice =
      pendingSelection === responses.left
        ? responseMapping.left
        : responseMapping.right;

    // Determine if the selection matches the ground truth (rm_choice)
    const isCorrect = selectedChoice === prompt.rm_choice;

    // If user is logged in, save their evaluation
    if (user && prompt.id) {
      try {
        // First check if this user has already evaluated this prompt
        const { data: existingEval, error: checkError } = await supabase
          .from("model_evaluations")
          .select("id")
          .eq("user_id", user.id)
          .eq("prompt_id", prompt.id)
          .single();

        if (checkError && checkError.code !== "PGRST116") {
          // PGRST116 means no rows returned, which is what we want
          console.error("Error checking for existing evaluation:", {
            message: checkError.message,
            details: checkError.details,
            code: checkError.code,
          });
        }

        // If the user has already evaluated this prompt, use the existing evaluation ID
        if (existingEval) {
          console.log(
            "User has already evaluated this prompt, using existing evaluation ID:",
            existingEval.id
          );
          setEvaluationId(existingEval.id);
        } else {
          // Otherwise, create a new evaluation
          const evaluationData: ModelEvaluation = {
            user_id: user.id,
            prompt_id: prompt.id,
            selected_response: selectedChoice,
            ground_truth: prompt.rm_choice,
            is_correct: isCorrect,
          };

          console.log(
            "Saving evaluation data:",
            JSON.stringify(evaluationData, null, 2)
          );

          const { data, error } = await supabase
            .from("model_evaluations")
            .insert(evaluationData)
            .select();

          if (error) {
            // If it's a duplicate key error, try to get the existing evaluation ID
            if (error.code === "23505") {
              console.log("Duplicate key error, fetching existing evaluation");
              const { data: existingData, error: fetchError } = await supabase
                .from("model_evaluations")
                .select("id")
                .eq("user_id", user.id)
                .eq("prompt_id", prompt.id)
                .single();

              if (fetchError) {
                console.error("Error fetching existing evaluation:", {
                  message: fetchError.message,
                  details: fetchError.details,
                  code: fetchError.code,
                });
                // Even if we can't fetch the existing ID, still proceed
              } else if (existingData) {
                setEvaluationId(existingData.id);
                console.log(
                  "Retrieved existing evaluation ID:",
                  existingData.id
                );
              }
            } else {
              console.error("Error saving evaluation:", {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
              });
              // Continue even if there's an error
            }
          } else if (data && data.length > 0) {
            // Store the evaluation ID for later use with rationales
            setEvaluationId(data[0].id);
            console.log("Evaluation saved successfully with ID:", data[0].id);
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error("Exception when saving evaluation:", errorMessage);
        // Continue even if there's an exception
      }
    }

    // Always proceed to the next step regardless of any errors
    setPendingSelection(null);
    setShowRationale(true);
  };

  const handleNextPrompt = () => {
    // Reset states
    setSelectedResponse(null);
    setRationale("");
    setEvaluationId(null);

    // Fetch next prompt
    fetchRandomPrompt();
  };

  const saveRationale = async () => {
    if (!prompt || !rationale.trim()) return;

    setIsSubmittingRationale(true);
    setRationaleError(null);

    try {
      // Check if user is authenticated
      if (!user) {
        setRationaleError(
          "You need to be logged in to submit rationales. Please log in and try again."
        );
        setIsSubmittingRationale(false);
        return;
      }

      // If we have an evaluation ID, save the rationale to the model_writing_rationales table
      if (evaluationId) {
        const rationaleData: ModelRationale = {
          evaluation_id: evaluationId,
          rationale: rationale.trim(),
        };

        console.log(
          "Saving rationale data:",
          JSON.stringify(rationaleData, null, 2)
        );

        const { error: rationaleError } = await supabase
          .from("model_writing_rationales")
          .insert(rationaleData);

        if (rationaleError) {
          // If it's a duplicate key error, just proceed to the next prompt
          if (rationaleError.code === "23505") {
            console.log("Duplicate rationale entry, proceeding to next prompt");
          } else {
            console.error("Error saving rationale:", {
              message: rationaleError.message,
              details: rationaleError.details,
              hint: rationaleError.hint,
              code: rationaleError.code,
            });
            throw new Error(
              rationaleError.message || "Failed to save rationale"
            );
          }
        } else {
          console.log("Rationale saved successfully");
        }
      } else {
        // If we don't have an evaluation ID, something went wrong with the evaluation
        console.warn("No evaluation ID found when saving rationale");
      }

      // Move to next prompt regardless of whether there was a duplicate key error
      handleNextPrompt();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setRationaleError(`Failed to save rationale: ${errorMessage}`);
      console.error("Exception when saving rationale:", errorMessage);

      // Even if there's an error, still allow moving to the next prompt after a short delay
      setTimeout(() => {
        setIsSubmittingRationale(false);
        setShowRationale(false);
        handleNextPrompt();
      }, 2000);
    } finally {
      setIsSubmittingRationale(false);
      setShowRationale(false);
    }
  };

  // Function to handle skipping rationale
  const handleSkipRationale = () => {
    setShowRationale(false);
    // Make sure we move to the next prompt
    handleNextPrompt();
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
                  ? "Please explain why you preferred this response over the other one."
                  : "Please log in to submit your rationale. Your insights help us improve AI-generated writing."}
              </p>
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
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

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
              {/* Left Response */}
              <div className="flex flex-col gap-4">
                <Card
                  className={`p-4 transition-all hover:shadow-lg transform ${
                    selectedResponse
                      ? ""
                      : "cursor-pointer hover:ring-2 hover:ring-indigo-500 hover:scale-[1.02] active:scale-[0.98]"
                  } ${
                    selectedResponse && responses.left === selectedResponse
                      ? "ring-2 ring-indigo-500"
                      : ""
                  }`}
                  onClick={() =>
                    !selectedResponse && handleSelection(responses.left)
                  }
                >
                  <div
                    className="max-h-[500px] overflow-y-auto"
                    ref={leftResponseRef}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {responses.left}
                    </p>
                  </div>
                </Card>
              </div>

              {/* Right Response */}
              <div className="flex flex-col gap-4">
                <Card
                  className={`p-4 transition-all hover:shadow-lg transform ${
                    selectedResponse
                      ? ""
                      : "cursor-pointer hover:ring-2 hover:ring-indigo-500 hover:scale-[1.02] active:scale-[0.98]"
                  } ${
                    selectedResponse && responses.right === selectedResponse
                      ? "ring-2 ring-indigo-500"
                      : ""
                  }`}
                  onClick={() =>
                    !selectedResponse && handleSelection(responses.right)
                  }
                >
                  <div
                    className="max-h-[500px] overflow-y-auto"
                    ref={rightResponseRef}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {responses.right}
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
