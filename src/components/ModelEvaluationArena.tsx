"use client";

import { supabase } from "@/lib/supabase/client";
import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TextPane } from "@/components/TextPane";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useUser } from "@/contexts/UserContext";
import { ModelSelector } from "@/components/ModelSelector";

// Supabase client

function similarity(a: string, b: string) {
  const setA = new Set(a.split(/\s+/));
  const setB = new Set(b.split(/\s+/));
  const intersection = Array.from(setA).filter((w) => setB.has(w)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

// Updated interface for the data structure we'll manage in the state
interface LiveEvaluationDisplayData {
  source_prompt_db_id: string; // UUID from the 'writingprompts-pairwise-test' table
  source_prompt_text: string;
  live_generation_id: string; // ID from the 'live_generations' table (this will be the prompt_id for model_evaluations)
  generated_response_A: string;
  generated_response_B: string;
  model_A_name: string;
  model_B_name: string;
}

// ModelEvaluation interface remains similar, but prompt_id will now be live_generation_id
interface ModelEvaluation {
  id?: string;
  user_id: string;
  prompt_id: string; // This will be the live_generation_id (UUID)
  selected_response_text: string; // Store the actual text selected
  selected_model_name: string; // Store the model name of the selected text
  // ground_truth: string; // Re-evaluate if needed, for live comparison, this is subjective
  // is_correct: boolean; // For live A/B, correctness isn't predefined
  created_at?: string;
}

interface ModelRationale {
  id?: string;
  evaluation_id: string; // Foreign key to model_evaluations.id
  rationale: string;
  created_at?: string;
}

export function ModelEvaluationArena() {
  // Phase state: 'selection' | 'generating' | 'evaluation'
  const [phase, setPhase] = useState<'selection' | 'generating' | 'evaluation'>('selection');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModels, setSelectedModels] = useState<{ modelA: string; modelB: string } | null>(null);
  
  const [currentDisplayData, setCurrentDisplayData] = useState<LiveEvaluationDisplayData | null>(null);
  const [responses, setResponses] = useState<{ left: string; right: string }>({ left: "", right: "" });
  const [responseMapping, setResponseMapping] = useState<{ left: "A" | "B"; right: "A" | "B" }>({ left: "A", right: "B" });
  const [selectedResponseFullText, setSelectedResponseFullText] = useState<string | null>(null);
  const [pendingSelectionSide, setPendingSelectionSide] = useState<"left" | "right" | null>(null);
  const [pendingSelection, setPendingSelection] = useState<string | null>(null);
  const [currentEvaluationId, setCurrentEvaluationId] = useState<string | null>(null);
  const [showRationale, setShowRationale] = useState(false);
  const [rationale, setRationale] = useState("");
  const [showResultFeedback, setShowResultFeedback] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSubmittingRationale, setIsSubmittingRationale] = useState(false);
  const [rationaleError, setRationaleError] = useState<string | null>(null);
  const [evaluationStart, setEvaluationStart] = useState<number>(0);
  const [prefetchedPromptId, setPrefetchedPromptId] = useState<string | null>(null);
  const [isClientMounted, setIsClientMounted] = useState(false);
  const [highlight, setHighlight] = useState<string>("");

  const leftResponseRef = useRef<HTMLDivElement>(null);
  const rightResponseRef = useRef<HTMLDivElement>(null);

  const { user, isLoading: userIsLoading } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  // Ensure client-side only operations
  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  // Fetch available models on mount
  useEffect(() => {
    const fetchAvailableModels = async () => {
      try {
        const response = await fetch("/api/generate-live-comparison");
        if (response.ok) {
          const data = await response.json();
          setAvailableModels(data.availableModels || []);
        }
      } catch (err) {
        console.error("Failed to fetch available models:", err);
        // Fallback models if API fails
        setAvailableModels([
          'gpt-4o',
          'gpt-4o-mini',
          'gpt-4-turbo',
          'gpt-3.5-turbo',
          'claude-3-opus',
          'gemini-pro',
        ]);
      }
    };

    fetchAvailableModels();
  }, []);

  const getRandomPromptId = useCallback(async () => {
    const { count, error: countError } = await supabase
      .from("writingprompts-pairwise-test")
      .select("id", { count: "exact", head: true });
    if (countError || !count) throw countError || new Error("No prompts");
    
    // Use fixed offset for SSR, randomize only on client
    const randomOffset = isClientMounted ? Math.floor(Math.random() * count) : 0;
    const { data: randomPromptEntry, error: randomPromptError } = await supabase
      .from("writingprompts-pairwise-test")
      .select("id")
      .range(randomOffset, randomOffset)
      .single();
    if (randomPromptError || !randomPromptEntry) throw randomPromptError || new Error("Failed to fetch ID");
    return randomPromptEntry.id as string;
  }, [isClientMounted]);

  const fetchComparison = async (id: string, modelA: string, modelB: string, prefetch = false) => {
    const apiResponse = await fetch("/api/generate-live-comparison", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt_db_id: id, prefetch, modelA, modelB }),
    });
    if (!apiResponse.ok) {
      const errData = await apiResponse.json();
      throw new Error(errData.error || `API request failed with status ${apiResponse.status}`);
    }
    return apiResponse.json();
  };

  const prefetchNextComparison = useCallback(async () => {
    if (!selectedModels) return;
    
    try {
      const id = await getRandomPromptId();
      await fetchComparison(id, selectedModels.modelA, selectedModels.modelB, true);
      setPrefetchedPromptId(id);
    } catch (err) {
      console.error("Prefetch error", err);
    }
  }, [selectedModels, getRandomPromptId]);

  const generateComparison = async (promptId?: string) => {
    if (!selectedModels) {
      setError("Please select models first");
      return;
    }

    console.log("generateComparison called. User object:", user);
    console.log("Current Supabase auth session:", supabase.auth.getSession());

    setError(null);
    setLoading(true);
    setPhase('generating');
    setCurrentDisplayData(null);
    setResponses({ left: "", right: "" });
    setSelectedResponseFullText(null);
    setPendingSelectionSide(null);
    setCurrentEvaluationId(null);
    setPrefetchedPromptId(null);
    setShowRationale(false);
    setRationale("");
    setShowResultFeedback(false);
    setHighlight("");
    
    try {
      const id = promptId || prefetchedPromptId || (await getRandomPromptId());
      const liveDataFromApi = await fetchComparison(id, selectedModels.modelA, selectedModels.modelB);
      
      setCurrentDisplayData({
        source_prompt_db_id: liveDataFromApi.prompt_db_id,
        source_prompt_text: liveDataFromApi.prompt_text,
        live_generation_id: liveDataFromApi.live_generation_id,
        generated_response_A: liveDataFromApi.response_A,
        generated_response_B: liveDataFromApi.response_B,
        model_A_name: liveDataFromApi.model_A_name,
        model_B_name: liveDataFromApi.model_B_name,
      });
      
      // Only randomize on client side to avoid hydration mismatch
      if (isClientMounted) {
        const isResponseALeft = Math.random() < 0.5;
        setResponses({
          left: isResponseALeft ? liveDataFromApi.response_A : liveDataFromApi.response_B,
          right: isResponseALeft ? liveDataFromApi.response_B : liveDataFromApi.response_A,
        });
        setResponseMapping({
          left: isResponseALeft ? "A" : "B",
          right: isResponseALeft ? "B" : "A",
        });
        setEvaluationStart(Date.now());
      }

      if (leftResponseRef.current) leftResponseRef.current.scrollTop = 0;
      if (rightResponseRef.current) rightResponseRef.current.scrollTop = 0;

      setPhase('evaluation');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(`Failed to generate comparison: ${errorMessage}`);
      console.error("Error in generateComparison:", err);
      setPhase('selection');
    } finally {
      setLoading(false);
      void prefetchNextComparison();
    }
  };

  const handleModelSelection = (selection: { modelA: string; modelB: string }) => {
    setSelectedModels(selection);
  };

  const handleSelection = (side: "left" | "right") => {
    if (selectedResponseFullText || !currentDisplayData) return; // Already selected or no data
    const selectedText = side === "left" ? responses.left : responses.right;
    setPendingSelection(selectedText);
    setPendingSelectionSide(side);
  };

  const confirmSelection = async () => {
    if (!pendingSelection || !pendingSelectionSide || !currentDisplayData) return;

    const selectedSide = pendingSelectionSide;
    const selectedActualText = pendingSelection;
    const selectedOriginalModel = responseMapping[selectedSide]; // 'A' or 'B'
    const selectedModelName = selectedOriginalModel === "A" ? currentDisplayData.model_A_name : currentDisplayData.model_B_name;

    setSelectedResponseFullText(selectedActualText);
    setShowResultFeedback(true); // Show general feedback
    setPendingSelection(null);
    setPendingSelectionSide(null);

    // Fire confetti regardless of "correctness" as it's a preference task
    if (typeof window !== "undefined") {
      void import("canvas-confetti").then((m) => m.default());
    }

    if (user && currentDisplayData.live_generation_id) {
      try {
        const evaluationData: ModelEvaluation = {
          user_id: user.id,
          prompt_id: currentDisplayData.live_generation_id, // This is crucial: use live_generation_id
          selected_response_text: selectedActualText,
          selected_model_name: selectedModelName,
          // 'ground_truth' and 'is_correct' are omitted as they don't fit this live A/B comparison mode
        };

        console.log("Saving live evaluation data:", JSON.stringify(evaluationData, null, 2));

        const { data: savedEval, error } = await supabase
          .from("model_evaluations")
          .insert(evaluationData)
          .select("id") // select id to use for rationale
          .single();

        if (error) {
          // Handle potential duplicate errors if user somehow re-submits for the exact same live_generation_id
          // This is less likely with UUIDs for live_generation_id compared to auto-incrementing prompt IDs
          console.error("Error saving live evaluation:", error);
          setError("Failed to save your evaluation. Please try again.");
        } else if (savedEval) {
          console.log("Live evaluation saved, ID:", savedEval.id);

          // record comparison result
          try {
            await fetch("/api/model-comparisons", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                modelA: currentDisplayData.model_A_name,
                modelB: currentDisplayData.model_B_name,
                winner: selectedModelName,
                promptId: currentDisplayData.live_generation_id,
              }),
            });
          } catch (cmpErr) {
            console.error("Failed to save comparison", cmpErr);
          }

          setCurrentEvaluationId(savedEval.id);
          setShowRationale(true); // Prompt for rationale after successful save
        }
      } catch (err) {
        console.error("Exception saving live evaluation:", err);
        setError("An unexpected error occurred while saving your evaluation.");
      }
    } else if (!user) {
      setShowRationale(true); // Still show rationale input for non-logged-in users, but it won't be saved with user_id
    }

    const evalTime = Date.now() - evaluationStart;
    const sim = similarity(responses.left, responses.right);
    const confidence = Math.max(0, 1 - evalTime / 30000);
    try {
      await fetch('/api/evaluation-quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evaluationTime: evalTime,
          promptSimilarity: sim,
          confidenceScore: confidence,
        }),
      });
    } catch (err) {
      console.error('Failed to record quality metrics', err);
    }
  };

  const handleNextPrompt = () => {
    setPhase('selection');
    setSelectedModels(null);
  };

  const saveRationale = async () => {
    if (!rationale.trim() || !currentEvaluationId || !user) { // Only save rationale if there's an eval ID and user
        if (!user && rationale.trim()) { // if user not logged in but gave rationale
             console.log("Rationale provided by anonymous user (not saved):", rationale);
             setShowRationale(false);
             setRationale("");
             // Optionally, directly go to next prompt for anon users after rationale input
             // handleNextPrompt(); 
             return;
        }
        setRationaleError("Cannot save empty rationale or no evaluation was recorded.");
        if(!currentEvaluationId) setShowRationale(false); // Hide if no eval id
        return;
    }
    setIsSubmittingRationale(true);
    setRationaleError(null);
    try {
      const rationaleData: ModelRationale = {
        evaluation_id: currentEvaluationId,
        rationale: rationale,
      };
      const { error } = await supabase.from("model_writing_rationales").insert(rationaleData);
      if (error) throw error;
      
      console.log("Rationale saved for evaluation ID:", currentEvaluationId);
      setShowRationale(false);
      setRationale("");
      // Optionally: Show a "Rationale saved!" message before loading next prompt
      // Or directly load next: handleNextPrompt();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setRationaleError(`Failed to save rationale: ${msg}`);
      console.error("Error saving rationale:", err);
    } finally {
      setIsSubmittingRationale(false);
    }
  };

  const handleSkipRationale = () => {
    setShowRationale(false);
    setRationale("");
    // Consider if skipping rationale should immediately load the next prompt
    // handleNextPrompt();
  };

  // --- UI Rendering ---
  // Auth Guard: Redirect to login if user is not loaded or not logged in
  useEffect(() => {
    if (!userIsLoading && !user) {
      router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [user, userIsLoading, router, pathname]);

  if (userIsLoading || (!user && !userIsLoading)) {
    // Show loading indicator while user status is being determined or if redirecting
    return <div className="text-center p-10">Loading user information...</div>; 
  }

  // Model Selection Phase
  if (phase === 'selection') {
    return (
      <div className="flex flex-col gap-6 items-center w-full">
        <div className="w-full max-w-2xl text-center">
          <h2 className="text-xl font-semibold mb-4">Choose Models to Compare</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Select two AI models to generate stories for comparison. The models will create responses to the same prompt, 
            and you&apos;ll evaluate which response you prefer.
          </p>
        </div>
        
        {availableModels.length > 0 ? (
          <ModelSelector models={availableModels} onSelect={handleModelSelection} />
        ) : (
          <div className="text-center p-10">Loading available models...</div>
        )}

        {selectedModels && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Selected: <strong>{selectedModels.modelA}</strong> vs <strong>{selectedModels.modelB}</strong>
            </p>
            <Button 
              onClick={() => generateComparison()} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Generate Stories
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Generation Phase
  if (phase === 'generating' || (loading && !currentDisplayData)) {
    return <div className="text-center p-10">Generating stories with {selectedModels?.modelA} and {selectedModels?.modelB}...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertDescription>
          {error}
          <Button onClick={() => setPhase('selection')} className="ml-4">Try Again</Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!currentDisplayData && !loading) {
    return (
      <div className="text-center p-10">
        No prompts available. Please try again later.
        <Button onClick={() => setPhase('selection')} className="ml-4 block mx-auto mt-2">Start Over</Button>
      </div>
    );
  }
  
  const isSelectionMade = !!selectedResponseFullText;

  return (
    <div className="flex flex-col gap-6 items-center w-full">
      {currentDisplayData && (
        <div className="w-full p-4 border rounded-lg shadow-sm bg-gray-50 dark:bg-gray-800">
          <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">Prompt:</h3>
          <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{currentDisplayData.source_prompt_text}</p>
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-500">
            Comparing: <strong>{currentDisplayData.model_A_name}</strong> vs <strong>{currentDisplayData.model_B_name}</strong>
          </div>
        </div>
      )}

      {responses.left && responses.right && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {/* Left Response */}
          <div className="flex flex-col gap-4">
            <Card
              className={`p-4 transition-all hover:shadow-lg transform ${
                isSelectionMade
                  ? ""
                  : "cursor-pointer hover:ring-2 hover:ring-indigo-500 hover:scale-[1.02] active:scale-[0.98]"
              } ${
                pendingSelection && responses.left === pendingSelection
                  ? "ring-2 ring-blue-500"
                  : isSelectionMade && responses.left === selectedResponseFullText
                  ? "ring-2 ring-indigo-500"
                  : ""
              }`}
              onClick={() => !isSelectionMade && handleSelection("left")}
            >
              <TextPane
                ref={leftResponseRef}
                pairedRef={rightResponseRef}
                text={responses.left}
                enableHighlight
                id="me-left-pane"
                onHighlight={setHighlight}
              />
            </Card>
          </div>

          {/* Right Response */}
          <div className="flex flex-col gap-4">
            <Card
              className={`p-4 transition-all hover:shadow-lg transform ${
                isSelectionMade
                  ? ""
                  : "cursor-pointer hover:ring-2 hover:ring-indigo-500 hover:scale-[1.02] active:scale-[0.98]"
              } ${
                pendingSelection && responses.right === pendingSelection
                  ? "ring-2 ring-blue-500"
                  : isSelectionMade && responses.right === selectedResponseFullText
                  ? "ring-2 ring-indigo-500"
                  : ""
              }`}
              onClick={() => !isSelectionMade && handleSelection("right")}
            >
              <TextPane
                ref={rightResponseRef}
                pairedRef={leftResponseRef}
                text={responses.right}
                enableHighlight
                id="me-right-pane"
                onHighlight={setHighlight}
              />
            </Card>
          </div>
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
                  onClick={() => {
                    setPendingSelection(null);
                    setPendingSelectionSide(null);
                  }}
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

      {showResultFeedback && (
         <div className="mt-4 text-center text-lg font-medium text-indigo-600 dark:text-indigo-400">
             Thanks for your input!
         </div>
      )}

      {isSelectionMade && showRationale && (
        <div className="mt-6 w-full max-w-xl flex flex-col gap-3 items-center p-4 border rounded-lg shadow-sm bg-gray-50 dark:bg-gray-800">
          <label htmlFor="rationale" className="text-md font-semibold text-gray-700 dark:text-gray-300">
            Why did you prefer this response? (Optional)
          </label>
          {highlight && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Highlighted text:</span> &quot;{highlight}&quot;
            </p>
          )}
          <textarea
            id="rationale"
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            className="w-full p-2 border rounded-md min-h-[80px] text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
            placeholder="Explain your choice..."
            rows={3}
          />
          {rationaleError && (
            <Alert variant="destructive" className="w-full text-xs">
              <AlertDescription>{rationaleError}</AlertDescription>
            </Alert>
          )}
          <div className="flex gap-3 mt-2">
            <Button onClick={saveRationale} disabled={isSubmittingRationale || (!rationale.trim() && !user)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {isSubmittingRationale ? "Submitting..." : "Submit Rationale"}
            </Button>
            <Button onClick={handleSkipRationale} variant="outline" className="border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
              Skip
            </Button>
          </div>
        </div>
      )}

      {isSelectionMade && !showRationale && (
        <Button onClick={() => handleNextPrompt()} className="mt-6 bg-green-600 hover:bg-green-700 text-white">
          Compare New Models
        </Button>
      )}
    </div>
  );
}
