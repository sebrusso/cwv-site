"use client";

import { createClient } from "@supabase/supabase-js";
import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useUser } from "@/contexts/UserContext";
import { ModelSelector } from "@/components/ModelSelector";
import { TextPane } from "@/components/TextPane";
import { shouldBypassAuth } from "@/lib/auth-utils";

// Initialize Supabase client (used for client-side reads if any, and by old logic if not fully removed)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

// Interface for model comparison data (keeping for future use)
// interface ModelComparison {
//   id?: string;
//   user_id: string | null;
//   model_a_name: string;
//   model_b_name: string;
//   winner: string;
//   prompt_id: string | null;
//   created_at?: string;
// }

interface EnhancementOptions {
  targetLength: 'short' | 'medium' | 'long';
  genre: 'literary' | 'adventure' | 'mystery' | 'romance' | 'sci-fi';
  tone: 'dramatic' | 'humorous' | 'suspenseful' | 'heartwarming';
  complexity: 'simple' | 'nuanced' | 'complex';
}

export function ModelEvaluationArena() {
  // Phase state: 'selection' | 'generating' | 'evaluation'
  const [phase, setPhase] = useState<'selection' | 'generating' | 'evaluation'>('selection');
  console.log("🏗️ ModelEvaluationArena component initialized, phase:", phase);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModels, setSelectedModels] = useState<{ modelA: string; modelB: string } | null>(null);
  
  // Enhancement options state
  const [enhancementOptions, setEnhancementOptions] = useState<EnhancementOptions>({
    targetLength: 'medium',
    genre: 'literary',
    tone: 'dramatic',
    complexity: 'nuanced'
  });
  const [showEnhancements, setShowEnhancements] = useState(false);
  
  const [currentDisplayData, setCurrentDisplayData] = useState<LiveEvaluationDisplayData | null>(null);
  const [selectedResponseFullText, setSelectedResponseFullText] = useState<string | null>(null); // Store the full text of selected response
  const [pendingSelectionSide, setPendingSelectionSide] = useState<"left" | "right" | null>(null);
  const [pendingSelection, setPendingSelection] = useState<string | null>(null);
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
  const [customPrompt, setCustomPrompt] = useState("");

  const leftResponseRef = useRef<HTMLDivElement>(null);
  const rightResponseRef = useRef<HTMLDivElement>(null);

  const { user, isLoading: userIsLoading } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  // Fetch available models on mount
  useEffect(() => {
    const fetchAvailableModels = async () => {
      try {
        // Get available models from the dedicated endpoint
        const response = await fetch("/api/generate-live-comparison");
        if (response.ok) {
          const data = await response.json();
          // If the endpoint doesn't return availableModels, use default from config
          const models = data.availableModels || [
            'gpt-4o-2024-11-20',
            'gpt-4.1-2025-04-14',
            'gpt-4.5-preview-2025-02-27',
            'gpt-4.1-mini-2025-04-14',
            'gpt-4o-mini-2024-07-18',
            'gpt-4.1-nano-2025-04-14'
          ];
          setAvailableModels(models);
          console.log("Available models loaded:", models);
        } else {
          throw new Error(`Failed to fetch models: ${response.status}`);
        }
      } catch (err) {
        console.error("Failed to fetch available models:", err);
        // Fallback models based on the actual config
        const fallbackModels = [
          'gpt-4o-2024-11-20',
          'gpt-4.1-2025-04-14',
          'gpt-4.5-preview-2025-02-27',
          'gpt-4.1-mini-2025-04-14',
          'gpt-4o-mini-2024-07-18',
          'gpt-4.1-nano-2025-04-14'
        ];
        setAvailableModels(fallbackModels);
        console.log("Using fallback models:", fallbackModels);
      }
    };

    fetchAvailableModels();
  }, []);

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

  const generateSingleText = useCallback(async (prompt: string, model: string) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout per model

    try {
      console.log(`Starting generation for model: ${model}`);
      const apiResponse = await fetch("/api/generate-openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt,
          model: model,
          params: {
            temperature: 0.8,
            max_tokens: 2048,
            stop: ['<|endofstory|>', '\n\n\n']
          }
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      console.log(`API response for ${model}: ${apiResponse.status} ${apiResponse.statusText}`);
      
      if (!apiResponse.ok) {
        const errData = await apiResponse.json().catch(() => ({ error: 'Unknown error' }));
        console.error(`API error for ${model}:`, errData);
        throw new Error(errData.error || `API request failed with status ${apiResponse.status}`);
      }
      const data = await apiResponse.json();
      console.log(`Generation completed for ${model}: ${data.text ? data.text.length : 0} characters`);
      return data.text || '';
    } catch (error) {
      clearTimeout(timeoutId);
      console.error(`Error generating text for ${model}:`, error);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timed out after 30 seconds for ${model}. Please try again.`);
      }
      throw error;
    }
  }, []);

  // Removed prefetchNextComparison as it's not currently used

  const generateComparison = async (customPromptText?: string, models?: { modelA: string; modelB: string }) => {
    // Use passed models parameter or fall back to selectedModels state
    const modelsToUse = models || selectedModels;
    console.log("🔥 generateComparison called with models:", modelsToUse);
    if (!modelsToUse) {
      console.log("❌ No models selected, aborting generation");
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
    setPendingSelection(null);
    setCurrentEvaluationId(null);
    setShowRationale(false);
    setRationale("");
    setShowResultFeedback(false);
    
    try {
      // Add overall timeout for the entire generation process
      const overallTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Generation timed out after 60 seconds')), 60000)
      );

      const generationProcess = async () => {
        // Get prompt text - either custom, parameter, or from database
        let promptText = customPromptText || customPrompt;
        let promptDbId = '';
        
        if (!promptText) {
          const id = await getRandomPromptId();
          const { data } = await supabase
            .from("writingprompts-pairwise-test")
            .select("id, prompt")
            .eq("id", id)
            .single();
          
          if (!data) throw new Error("Failed to fetch prompt");
          promptText = data.prompt;
          promptDbId = data.id;
        }
        
        // Generate stories from both models simultaneously
        console.log(`Generating stories with ${modelsToUse.modelA} vs ${modelsToUse.modelB}`);
        console.log(`Using prompt: ${promptText.substring(0, 100)}...`);
        const [responseA, responseB] = await Promise.all([
          generateSingleText(promptText, modelsToUse.modelA),
          generateSingleText(promptText, modelsToUse.modelB)
        ]);
        
        return { promptText, promptDbId, responseA, responseB };
      };

      const result = await Promise.race([
        generationProcess(),
        overallTimeout
      ]) as { promptText: string; promptDbId: string; responseA: string; responseB: string };
      
      const { promptText, promptDbId, responseA, responseB } = result;
      
      console.log(`Generated responseA (${responseA ? responseA.length : 0} chars):`, responseA ? 'SUCCESS' : 'FAILED');
      console.log(`Generated responseB (${responseB ? responseB.length : 0} chars):`, responseB ? 'SUCCESS' : 'FAILED');
      
      if (!responseA || !responseB) {
        throw new Error(`Story generation failed - A: ${responseA ? 'OK' : 'FAILED'}, B: ${responseB ? 'OK' : 'FAILED'}`);
      }
      
      // Create a simple generation ID for tracking
      const generationId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      setCurrentDisplayData({
        source_prompt_db_id: promptDbId,
        source_prompt_text: promptText,
        live_generation_id: generationId,
        generated_response_A: responseA,
        generated_response_B: responseB,
        model_A_name: modelsToUse.modelA,
        model_B_name: modelsToUse.modelB,
      });
      
      // Randomly assign responses to left/right for UI display
      const isResponseALeft = Math.random() < 0.5;
      setResponses({
        left: isResponseALeft ? responseA : responseB,
        right: isResponseALeft ? responseB : responseA,
      });
      setResponseMapping({
        left: isResponseALeft ? "A" : "B",
        right: isResponseALeft ? "B" : "A",
      });

      if (leftResponseRef.current) leftResponseRef.current.scrollTop = 0;
      if (rightResponseRef.current) rightResponseRef.current.scrollTop = 0;

      setPhase('evaluation');
      setCustomPrompt(""); // Clear custom prompt after use
    } catch (err) {
      console.error("Error in generateComparison:", err);
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(`Generation failed: ${errorMessage}`);
      setPhase('selection');
      // Reset any partial state
      setCurrentDisplayData(null);
      setResponses({ left: "", right: "" });
      setSelectedResponseFullText(null);
      setPendingSelectionSide(null);
      setPendingSelection(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSelection = (selectedSide: "left" | "right") => {
    if (selectedResponseFullText || pendingSelection) return; // Prevent multiple selections
    const selectedTextContent = responses[selectedSide];
    setPendingSelection(selectedTextContent);
    setPendingSelectionSide(selectedSide);
  };

  const confirmSelection = async () => {
    if (!pendingSelection || !pendingSelectionSide || !currentDisplayData) return;

    const selectedSide = pendingSelectionSide;
    const selectedActualText = pendingSelection;
    setSelectedResponseFullText(selectedActualText);
    
    // Clear pending selection
    setPendingSelection(null);
    setPendingSelectionSide(null);

    // Debug logging to identify the error
    console.log("🐛 Debug confirmSelection:", {
      selectedSide,
      responseMapping,
      currentDisplayData: {
        model_A_name: currentDisplayData.model_A_name,
        model_B_name: currentDisplayData.model_B_name
      }
    });

    // Ensure responseMapping exists and has the required key
    if (!responseMapping || !(selectedSide in responseMapping)) {
      console.error("❌ responseMapping issue:", { responseMapping, selectedSide });
      setError("Internal error: response mapping not found. Please try again.");
      return;
    }

    const selectedOriginalModel = responseMapping[selectedSide]; // 'A' or 'B'
    
    // Ensure we have the model names
    if (!currentDisplayData.model_A_name || !currentDisplayData.model_B_name) {
      console.error("❌ Missing model names:", currentDisplayData);
      setError("Internal error: model names not found. Please try again.");
      return;
    }

    const selectedModelName = selectedOriginalModel === "A" ? currentDisplayData.model_A_name : currentDisplayData.model_B_name;

    setShowResultFeedback(true); // Show general feedback

    // Fire confetti regardless of "correctness" as it's a preference task
    if (typeof window !== "undefined") {
      void import("canvas-confetti").then((m) => m.default());
    }

    // Save comparison for both logged-in and anonymous users
    try {
      // Use model_comparisons table for model vs model comparisons
      const comparisonData = {
        user_id: user?.id || null, // null for anonymous users
        model_a_name: currentDisplayData.model_A_name,
        model_b_name: currentDisplayData.model_B_name,
        winner: selectedModelName,
        prompt_id: currentDisplayData.source_prompt_db_id, // Use the original prompt ID
      };

      console.log("Saving model comparison data:", JSON.stringify(comparisonData, null, 2));

      const { data: savedComparison, error } = await supabase
        .from("model_comparisons")
        .insert(comparisonData)
        .select("id") // select id to use for rationale
        .single();

      if (error) {
        console.error("Error saving model comparison:", error);
        setError("Failed to save your evaluation. Please try again.");
      } else if (savedComparison) {
        console.log("Model comparison saved, ID:", savedComparison.id);
        setCurrentEvaluationId(savedComparison.id);
        setShowRationale(true); // Prompt for rationale after successful save
      }
    } catch (err) {
      console.error("Exception saving model comparison:", err);
      setError("An unexpected error occurred while saving your evaluation.");
    }
  };

  const handleNextPrompt = () => {
    generateComparison();
  };

  const saveRationale = async () => {
    if (!rationale.trim() || !currentEvaluationId || !currentDisplayData) {
        if (!user && rationale.trim()) { // if user not logged in but gave rationale
             console.log("Rationale provided by anonymous user (not saved):", rationale);
             setShowRationale(false);
             setRationale("");
             return;
        }
        setRationaleError("Cannot save empty rationale or no evaluation was recorded.");
        if(!currentEvaluationId) setShowRationale(false); // Hide if no eval id
        return;
    }
    setIsSubmittingRationale(true);
    setRationaleError(null);
    try {
      // The model_writing_rationales table requires these fields even though they don't apply to model comparisons
      const rationaleData = {
        evaluation_id: currentEvaluationId, // This is the model_comparisons.id
        rationale: rationale,
        user_id: user?.id || null,
        prompt_id: currentDisplayData.source_prompt_db_id,
        model_name: "comparison", // Placeholder since this is a comparison, not single model eval
        selected_response: selectedResponseFullText || "",
        ground_truth: "", // Not applicable for model comparisons
        is_correct: true, // Not applicable for model comparisons, defaulting to true
      };
      const { error } = await supabase.from("model_writing_rationales").insert(rationaleData);
      if (error) throw error;
      
      console.log("Rationale saved for comparison ID:", currentEvaluationId);
      setShowRationale(false);
      setRationale("");
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

  const handleModelSelection = (selection: { modelA: string; modelB: string }) => {
    console.log("🎯 Model selection triggered:", selection);
    setSelectedModels(selection);
    setPhase('generating');
    console.log("🚀 About to call generateComparison...");
    generateComparison(undefined, selection);
  };

  const handleBackToSelection = () => {
    setPhase('selection');
    setSelectedModels(null);
    setCurrentDisplayData(null);
    setResponses({ left: "", right: "" });
    setSelectedResponseFullText(null);
    setPendingSelectionSide(null);
    setPendingSelection(null);
    setShowRationale(false);
    setRationale("");
    setShowResultFeedback(false);
    setError(null);
  };

  // --- UI Rendering ---
  // Auth Guard: Redirect to login if user is not loaded or not logged in
  // But only if authentication is enabled
  const authIsBypassed = shouldBypassAuth();
  
  useEffect(() => {
    console.log("🔐 Auth check - userIsLoading:", userIsLoading, "user:", !!user, "authBypass:", authIsBypassed);
    if (!authIsBypassed && !userIsLoading && !user) {
      console.log("🚪 Redirecting to login");
      router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [user, userIsLoading, router, pathname, authIsBypassed]);

  console.log("🔍 Component render check - userIsLoading:", userIsLoading, "user:", !!user, "authBypass:", authIsBypassed);
  
  // Only show loading if auth is NOT bypassed and we're still loading user info
  if (!authIsBypassed && (userIsLoading || (!user && !userIsLoading))) {
    // Show loading indicator while user status is being determined or if redirecting
    console.log("⏸️ Showing auth loading screen");
    return <div className="text-center p-10">Loading user information...</div>; 
  }
  
  console.log("✅ Proceeding to main component");

  // Model Selection Phase
  if (phase === 'selection') {
    console.log("📋 Rendering selection phase, hasModels:", availableModels.length > 0);
    const hasModels = availableModels.length > 0;
    
    return (
      <div className="flex flex-col gap-6 items-center w-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Choose Models to Compare</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Select two different AI models to generate and compare creative writing responses.
          </p>
        </div>

        {hasModels ? (
          <ModelSelector models={availableModels} onSelect={handleModelSelection} />
        ) : (
          <div className="text-center p-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p>Loading available models...</p>
          </div>
        )}

        {/* Enhancement Options */}
        <div className="w-full max-w-md">
          <Button
            onClick={() => setShowEnhancements(!showEnhancements)}
            variant="outline"
            className="w-full mb-4"
          >
            {showEnhancements ? 'Hide' : 'Show'} Advanced Options
          </Button>
          
          {showEnhancements && (
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
              <div>
                <label className="block text-sm font-medium mb-2">Story Length</label>
                <select
                  value={enhancementOptions.targetLength}
                  onChange={(e) => setEnhancementOptions(prev => ({ ...prev, targetLength: e.target.value as EnhancementOptions['targetLength'] }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="short">Short</option>
                  <option value="medium">Medium</option>
                  <option value="long">Long</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Genre</label>
                <select
                  value={enhancementOptions.genre}
                  onChange={(e) => setEnhancementOptions(prev => ({ ...prev, genre: e.target.value as EnhancementOptions['genre'] }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="literary">Literary</option>
                  <option value="adventure">Adventure</option>
                  <option value="mystery">Mystery</option>
                  <option value="romance">Romance</option>
                  <option value="sci-fi">Sci-Fi</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Tone</label>
                <select
                  value={enhancementOptions.tone}
                  onChange={(e) => setEnhancementOptions(prev => ({ ...prev, tone: e.target.value as EnhancementOptions['tone'] }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="dramatic">Dramatic</option>
                  <option value="humorous">Humorous</option>
                  <option value="suspenseful">Suspenseful</option>
                  <option value="heartwarming">Heartwarming</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Complexity</label>
                <select
                  value={enhancementOptions.complexity}
                  onChange={(e) => setEnhancementOptions(prev => ({ ...prev, complexity: e.target.value as EnhancementOptions['complexity'] }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="simple">Simple</option>
                  <option value="nuanced">Nuanced</option>
                  <option value="complex">Complex</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Custom Prompt Input */}
        <div className="w-full max-w-md">
          <label className="block text-sm font-medium mb-2">Custom Prompt (Optional)</label>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter your own writing prompt or leave blank for a random one..."
            rows={3}
          />
        </div>
      </div>
    );
  }

  // Generation Phase
  if (phase === 'generating' || (loading && !currentDisplayData)) {
    console.log("⏳ Rendering generation phase, loading:", loading, "hasData:", !!currentDisplayData);
    return (
      <div className="text-center p-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p>Loading new evaluation...</p>
        {selectedModels && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Generating responses from {selectedModels.modelA} vs {selectedModels.modelB}
          </p>
        )}
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertDescription>
          {error}
          <div className="flex gap-2 mt-4">
            <Button onClick={() => generateComparison()} className="ml-4">Try Again</Button>
            <Button onClick={handleBackToSelection} variant="outline">Back to Selection</Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Evaluation Phase
  if (!currentDisplayData && !loading) {
    return (
      <div className="text-center p-10">
        No prompts available. Please try again later.
        <div className="flex gap-2 justify-center mt-4">
          <Button onClick={() => generateComparison()} className="block mx-auto mt-2">Fetch New Prompt</Button>
          <Button onClick={handleBackToSelection} variant="outline">Back to Selection</Button>
        </div>
      </div>
    );
  }
  
  const isSelectionMade = !!selectedResponseFullText;

  return (
    <div className="flex flex-col gap-6 items-center w-full">
      {/* Back to Selection Button */}
      <div className="w-full flex justify-between items-center">
        <Button onClick={handleBackToSelection} variant="outline" size="sm">
          ← Change Models
        </Button>
        {selectedModels && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Comparing: {selectedModels.modelA} vs {selectedModels.modelB}
          </div>
        )}
      </div>

      {currentDisplayData && (
        <div className="w-full p-4 border rounded-lg shadow-sm bg-gray-50 dark:bg-gray-800">
          <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">Prompt:</h3>
          <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{currentDisplayData.source_prompt_text}</p>
        </div>
      )}

      {responses.left && responses.right && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {/* Left Text */}
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
                id="model-left-pane"
              />
            </Card>
          </div>

          {/* Right Text */}
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
                id="model-right-pane"
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
            <Button 
              onClick={saveRationale} 
              disabled={isSubmittingRationale || !rationale.trim()} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
            >
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

    </div>
  );
}
