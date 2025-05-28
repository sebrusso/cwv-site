"use client";

import { createClient } from "@supabase/supabase-js";
import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useUser } from "@/contexts/UserContext";

// Initialize Supabase client (used for client-side reads if any, and by old logic if not fully removed)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
  const [currentDisplayData, setCurrentDisplayData] = useState<LiveEvaluationDisplayData | null>(null);
  const [selectedResponseFullText, setSelectedResponseFullText] = useState<string | null>(null); // Store the full text of selected response
  const [pendingSelectionSide, setPendingSelectionSide] = useState<"left" | "right" | null>(null);
  const [showRationale, setShowRationale] = useState(false);
  const [rationale, setRationale] = useState("");
  const [responses, setResponses] = useState<{ left: string; right: string }>({ // UI display
    left: "",
    right: "",
  });
  // Keeps track of which original model (A or B from API) is on which side for UI
  const [responseMapping, setResponseMapping] = useState<{
    left: "A" | "B";
    right: "A" | "B";
  }>({
    left: "A",
    right: "B",
  });
  const [currentEvaluationId, setCurrentEvaluationId] = useState<string | null>(null); // For storing model_evaluations.id if needed for rationale
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSubmittingRationale, setIsSubmittingRationale] = useState(false);
  const [rationaleError, setRationaleError] = useState<string | null>(null);
  const [showResultFeedback, setShowResultFeedback] = useState(false); // To show some feedback after selection
  const [isPrefetching, setIsPrefetching] = useState(false);
  const [prefetchedPromptId, setPrefetchedPromptId] = useState<string | null>(null);

  const [evaluationStart, setEvaluationStart] = useState<number>(0);


  const leftResponseRef = useRef<HTMLDivElement>(null);
  const rightResponseRef = useRef<HTMLDivElement>(null);

  const { user, isLoading: userIsLoading } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  const getRandomPromptId = async () => {
    const { count, error: countError } = await supabase
      .from("writingprompts-pairwise-test")
      .select("id", { count: "exact", head: true });
    if (countError || !count) throw countError || new Error("No prompts");
    const randomOffset = Math.floor(Math.random() * count);
    const { data: randomPromptEntry, error: randomPromptError } = await supabase
      .from("writingprompts-pairwise-test")
      .select("id")
      .range(randomOffset, randomOffset)
      .single();
    if (randomPromptError || !randomPromptEntry) throw randomPromptError || new Error("Failed to fetch ID");
    return randomPromptEntry.id as string;
  };

  const fetchComparison = async (id: string, prefetch = false) => {
    const apiResponse = await fetch("/api/generate-live-comparison", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt_db_id: id, prefetch }),
    });
    if (!apiResponse.ok) {
      const errData = await apiResponse.json();
      throw new Error(errData.error || `API request failed with status ${apiResponse.status}`);
    }
    return apiResponse.json();
  };

  const prefetchNextComparison = useCallback(async () => {
    try {
      setIsPrefetching(true);
      const id = await getRandomPromptId();
      await fetchComparison(id, true);
      setPrefetchedPromptId(id);
    } catch (err) {
      console.error("Prefetch error", err);
    } finally {
      setIsPrefetching(false);
    }
  }, []);

  const fetchNewLiveComparison = useCallback(async (promptId?: string) => {
    console.log("fetchNewLiveComparison called. User object:", user);
    console.log("Current Supabase auth session:", supabase.auth.getSession()); // Log current session

    setError(null);
    setLoading(true);
    setCurrentDisplayData(null);
    setResponses({ left: "", right: "" });
    setSelectedResponseFullText(null);
    setPendingSelectionSide(null);
    setCurrentEvaluationId(null);
    setPrefetchedPromptId(null);
    setShowRationale(false);
    setRationale("");
    setShowResultFeedback(false);
    try {
      const id = promptId || prefetchedPromptId || (await getRandomPromptId());
      const liveDataFromApi = await fetchComparison(id);
      
      setCurrentDisplayData({
        source_prompt_db_id: liveDataFromApi.prompt_db_id,
        source_prompt_text: liveDataFromApi.prompt_text,
        live_generation_id: liveDataFromApi.live_generation_id,
        generated_response_A: liveDataFromApi.response_A,
        generated_response_B: liveDataFromApi.response_B,
        model_A_name: liveDataFromApi.model_A_name,
        model_B_name: liveDataFromApi.model_B_name,
      });
      
      // Randomly assign responses to left/right for UI display
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

      if (leftResponseRef.current) leftResponseRef.current.scrollTop = 0;
      if (rightResponseRef.current) rightResponseRef.current.scrollTop = 0;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(`Failed to fetch new comparison: ${errorMessage}`);
      console.error("Error in fetchNewLiveComparison:", err);
    } finally {
      setLoading(false); // Use local loading state setter
      void prefetchNextComparison();
    }
  }, [prefetchNextComparison, user, prefetchedPromptId]);

  useEffect(() => {
    // Only fetch if user is loaded and present, or if auth is not enforced for this component path (e.g. guest mode)
    if (!userIsLoading && user) {
      void fetchNewLiveComparison();
    } else if (!userIsLoading && !user) {
      // User is loaded, but not logged in. Handled by the redirect logic below.
      // No need to fetch if we are about to redirect.
    }
    // If userIsLoading, wait for user status to resolve.
  }, [fetchNewLiveComparison, user, userIsLoading]);

  const handleSelection = (side: "left" | "right") => {
    if (selectedResponseFullText || !currentDisplayData) return; // Already selected or no data
    setPendingSelectionSide(side);
    // You could show a confirmation modal here if desired before calling confirmSelection
    confirmSelection(side); 
  };

  const confirmSelection = async (selectedSide : "left" | "right") => {
    if (!selectedSide || !currentDisplayData) return;

    const selectedActualText = selectedSide === "left" ? responses.left : responses.right;
    const selectedOriginalModel = responseMapping[selectedSide]; // 'A' or 'B'
    const selectedModelName = selectedOriginalModel === "A" ? currentDisplayData.model_A_name : currentDisplayData.model_B_name;

    setSelectedResponseFullText(selectedActualText);
    setShowResultFeedback(true); // Show general feedback

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
    setPendingSelectionSide(null); // Clear pending selection

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
    fetchNewLiveComparison(prefetchedPromptId || undefined);
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
  
  // If user is loaded and present, continue rendering the component
  if (loading && !currentDisplayData) {
    return <div className="text-center p-10">Loading new evaluation...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertDescription>
          {error}
          <Button onClick={() => void fetchNewLiveComparison()} className="ml-4">Try Again</Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!currentDisplayData && !loading) {
    return (
      <div className="text-center p-10">
        No prompts available. Please try again later.
        <Button onClick={() => void fetchNewLiveComparison()} className="ml-4 block mx-auto mt-2">Fetch New Prompt</Button>
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
        </div>
      )}

      {responses.left && responses.right && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <Card
            ref={leftResponseRef}
            className={`p-4 border-2 rounded-lg shadow-sm cursor-pointer overflow-y-auto max-h-96 \
                        ${pendingSelectionSide === "left" ? "ring-4 ring-indigo-400 dark:ring-indigo-600 border-indigo-500 dark:border-indigo-700" : "border-gray-300 dark:border-gray-700"} \
                        ${isSelectionMade ? "opacity-70 cursor-not-allowed" : "hover:border-indigo-500 dark:hover:border-indigo-400"}`}
            onClick={() => !isSelectionMade && handleSelection("left")}
          >
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800 dark:text-gray-200">{responses.left}</p>
          </Card>
          <Card
            ref={rightResponseRef}
            className={`p-4 border-2 rounded-lg shadow-sm cursor-pointer overflow-y-auto max-h-96 \
                        ${pendingSelectionSide === "right" ? "ring-4 ring-indigo-400 dark:ring-indigo-600 border-indigo-500 dark:border-indigo-700" : "border-gray-300 dark:border-gray-700"} \
                        ${isSelectionMade ? "opacity-70 cursor-not-allowed" : "hover:border-indigo-500 dark:hover:border-indigo-400"}`}
            onClick={() => !isSelectionMade && handleSelection("right")}
          >
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800 dark:text-gray-200">{responses.right}</p>
          </Card>
        </div>
      )}
      
      {pendingSelectionSide && !isSelectionMade && (
        <div className="mt-4 text-center">
          <p className="text-gray-700 dark:text-gray-300">You selected the {pendingSelectionSide} response. Confirm?</p>
          {/* Confirmation step removed for brevity, confirmSelection is called directly from handleSelection */}
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
          Next Prompt
        </Button>
      )}
      {isPrefetching && (
        <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
          Preparing next prompt...
        </div>
      )}
    </div>
  );
}
