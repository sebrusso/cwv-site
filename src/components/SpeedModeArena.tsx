"use client";

import { supabase } from "@/lib/supabase/client";
import { useEffect, useState, useRef } from "react";
import { useUser } from "@/contexts/UserContext";
import { usePathname, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TextPane } from "@/components/TextPane";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/contexts/ToastContext";
import { CheckCircle2, XCircle } from "lucide-react";

import { ReportContentButton } from "./ReportContentButton";

interface PromptRow {
  id: string;
  prompt: string;
  chosen: string;
}


const DURATION = 120; // seconds
const MODELS = ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo", "claude-3-opus", "claude-3-sonnet"];

export function SpeedModeArena() {
  // Game state management
  const [gameState, setGameState] = useState<'setup' | 'loading' | 'playing' | 'finished'>('setup');
  const [selectedModel, setSelectedModel] = useState<string>(MODELS[0]);
  
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPromptId, setCurrentPromptId] = useState<string | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState<string>("");
  const [texts, setTexts] = useState<{ left: string; right: string }>({
    left: "",
    right: "",
  });
  const [mapping, setMapping] = useState<{ left: "human" | "ai"; right: "human" | "ai" }>({
    left: "human",
    right: "ai",
  });
  const [result, setResult] = useState<boolean | null>(null);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [pendingSelection, setPendingSelection] = useState<string | null>(null);
  const [pendingSelectionSide, setPendingSelectionSide] = useState<"left" | "right" | null>(null);

  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [timerActive, setTimerActive] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalGuesses, setTotalGuesses] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  
  // Prefetching state
  const [prefetchedSamples, setPrefetchedSamples] = useState<PromptRow[]>([]);
  const [prefetchedTexts, setPrefetchedTexts] = useState<{[key: string]: string}>({});

  // Add refs for synchronized scrolling
  const leftTextRef = useRef<HTMLDivElement>(null);
  const rightTextRef = useRef<HTMLDivElement>(null);

  const addToast = useToast();
  const { user, isLoading } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  // Don't auto-initialize - wait for user to start the game

  useEffect(() => {
    if (!timerActive) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          handleSessionEnd();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive]); // eslint-disable-line react-hooks/exhaustive-deps


  if (!user && !isLoading) {
    return (
      <div className="text-center py-10">
        <p className="mb-4">You must be logged in to evaluate.</p>
        <Button onClick={() => router.push(`/login?redirect=${encodeURIComponent(pathname)}`)}>Log in</Button>
      </div>
    );
  }

  const startGame = async () => {
    console.log('🏁 Starting speed mode game...');
    setGameState('loading');
    setTimeLeft(DURATION);
    setCorrectCount(0);
    setTotalGuesses(0);
    setCurrentStreak(0);
    setLongestStreak(0);
    
    // Start prefetching in the background
    prefetchSamples();
    
    // Load the first sample
    await fetchSample();
    
    // Once first sample is ready, start the timer and set to playing
    setGameState('playing');
    setTimerActive(true);
  };

  const prefetchSamples = async () => {
    console.log('🔄 Starting prefetch...');
    try {
      // Fetch multiple prompts to prefill
      const { data: flagged } = await supabase
        .from("content_reports")
        .select("content_id")
        .eq("content_type", "prompt")
        .eq("resolved", false);
      
      const excluded = (flagged || []).map((r) => r.content_id);
      let query = supabase
        .from("writingprompts-pairwise-test")
        .select("id,prompt,chosen")
        .limit(10); // Prefetch 10 samples
      
      if (excluded.length > 0) {
        query = query.not("id", "in", `(${excluded.join(",")})`);
      }
      
      const { data } = await query.order("id", { ascending: Math.random() > 0.5 });
      
      if (data && data.length > 0) {
        setPrefetchedSamples(data);
        
        // Generate AI responses using bulk API for better performance
        try {
          const bulkResponse = await fetch("/api/speed-mode-bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompts: data.slice(0, 5).map(p => ({ id: p.id, prompt: p.prompt })), // Limit to 5 for efficiency
              model: selectedModel,
            }),
          });
          
          const bulkResult = await bulkResponse.json();
          const newPrefetchedTexts: {[key: string]: string} = {};
          
          if (bulkResult.success && bulkResult.responses) {
            bulkResult.responses.forEach((response: { id: string; text: string; success: boolean }) => {
              if (response.success && response.text) {
                newPrefetchedTexts[response.id] = response.text;
              }
            });
          }
        
          setPrefetchedTexts(prev => ({ ...prev, ...newPrefetchedTexts }));
          console.log('🔄 Prefetch completed:', Object.keys(newPrefetchedTexts).length, 'samples');
        } catch (bulkErr) {
          console.error('Failed to bulk prefetch:', bulkErr);
        }
      }
    } catch (err) {
      console.error('Failed to prefetch samples:', err);
    }
  };

  const fetchSample = async () => {
    console.log('🚀 fetchSample started');
    setLoading(true);
    setProgress(20);
    setResult(null);
    setSelectedText(null);
    setTexts({ left: "", right: "" });
    setCurrentPromptId(null);
    setCurrentPrompt("");
    setPendingSelection(null);
    setPendingSelectionSide(null);

    // Timer will be started by startGame() function
    
    let row: PromptRow | null = null;
    
    // Try to use prefetched samples first - only use samples that have AI responses
    const samplesWithAI = prefetchedSamples.filter(sample => prefetchedTexts[sample.id]);
    if (samplesWithAI.length > 0) {
      console.log('🎯 Using prefetched sample with AI response...');
      const randomIndex = Math.floor(Math.random() * samplesWithAI.length);
      row = samplesWithAI[randomIndex];
      // Remove this sample from both prefetched lists
      setPrefetchedSamples(prev => prev.filter(sample => sample.id !== row!.id));
      console.log(`📦 Remaining prefetched: ${prefetchedSamples.length - 1} samples, ${Object.keys(prefetchedTexts).length - 1} AI responses`);
    } else {
      console.log('📋 Fetching flagged content...');
      const { data: flagged } = await supabase
        .from("content_reports")
        .select("content_id")
        .eq("content_type", "prompt")
        .eq("resolved", false);
      console.log('📋 Flagged content fetched:', flagged?.length || 0, 'items');
      
      const excluded = (flagged || []).map((r) => r.content_id);
      console.log('🎲 Fetching random prompt...');
      let query = supabase
        .from("writingprompts-pairwise-test")
        .select("id,prompt,chosen")
        .limit(1);
      if (excluded.length > 0) {
        query = query.not("id", "in", `(${excluded.join(",")})`);
      }
      const { data } = await query.order("id", { ascending: Math.random() > 0.5 });
      console.log('🎲 Random prompt fetched');
      if (data && data.length > 0) row = data[0];
    }
    if (!row) {
      console.log('❌ No prompt found');
      setLoading(false);
      return;
    }
    console.log('✅ Prompt ready, calling API...');
    setCurrentPromptId(row.id);
    setCurrentPrompt(row.prompt);
    setProgress(60);
    
    // Check if we already have AI text for this prompt
    let aiText = prefetchedTexts[row.id];
    if (!aiText) {
      console.log('⚡ No prefetched AI response, generating live...');
      const aiRes = await fetch("/api/generate-openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: row.prompt,
          model: selectedModel,
        }),
      });
      console.log('🤖 API call completed');
      const result = await aiRes.json();
      aiText = result.text;
      console.log('📝 Response parsed');
    } else {
      console.log('📝 Using prefetched response');
      // Remove the used AI response from cache
      setPrefetchedTexts(prev => {
        const newTexts = { ...prev };
        delete newTexts[row.id];
        return newTexts;
      });
    }
    
    setProgress(80);
    console.log('🎭 Setting up texts...');
    const isHumanLeft = Math.random() < 0.5;
    setTexts({ left: isHumanLeft ? row.chosen : aiText, right: isHumanLeft ? aiText : row.chosen });
    setMapping({ left: isHumanLeft ? "human" : "ai", right: isHumanLeft ? "ai" : "human" });
    setProgress(100);
    setLoading(false);
    console.log('✨ fetchSample completed');
    
    // Reset scroll positions
    if (leftTextRef.current) leftTextRef.current.scrollTop = 0;
    if (rightTextRef.current) rightTextRef.current.scrollTop = 0;
  };

  const handleSelection = (side: "left" | "right") => {
    if (selectedText || pendingSelection) return; // Prevent multiple selections
    const selectedTextContent = texts[side];
    setPendingSelection(selectedTextContent);
    setPendingSelectionSide(side);
  };

  const confirmSelection = async () => {
    if (!pendingSelection || !pendingSelectionSide) return;
    
    const side = pendingSelectionSide;
    const selectedTextContent = pendingSelection;
    setSelectedText(selectedTextContent);

    const isCorrect = mapping[side] === "human";
    setResult(isCorrect);

    setTotalGuesses((t) => t + 1);
    if (isCorrect) {
      setCorrectCount((c) => c + 1);
      setCurrentStreak((s) => {
        const newStreak = s + 1;
        setLongestStreak((l) => Math.max(l, newStreak));
        return newStreak;
      });
    } else {
      setCurrentStreak(0);
    }

    // Clear pending selection
    setPendingSelection(null);
    setPendingSelectionSide(null);

    if (currentPromptId) {
      try {
        await fetch("/api/human-model-evaluations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            promptId: currentPromptId,
            modelName: selectedModel,
            guessCorrect: isCorrect,
          }),
        });
        addToast("Evaluation recorded", "success");
      } catch (err) {
        console.error("Failed to log evaluation", err);
        addToast("Failed to log evaluation", "error");
      }
    }
    if (isCorrect && typeof window !== "undefined") {
      void import("canvas-confetti").then((m) => m.default());
    }

    setTimeout(() => {
      handleNextSample();
      fetchSample();
      
      // If we're running low on prefetched samples, fetch more
      if (prefetchedSamples.length <= 2) {
        prefetchSamples();
      }
    }, 800);
  };

  const handleNextSample = () => {
    setSelectedText(null);
    setResult(null);
    setTexts({ left: "", right: "" });
    setCurrentPromptId(null);
    setCurrentPrompt("");
    setPendingSelection(null);
    setPendingSelectionSide(null);
    // Reset scroll positions
    if (leftTextRef.current) leftTextRef.current.scrollTop = 0;
    if (rightTextRef.current) rightTextRef.current.scrollTop = 0;
  };

  async function handleSessionEnd() {
    setTimerActive(false);
    setGameState('finished');
    try {
      await fetch("/api/speed-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          correct: correctCount,
          total: totalGuesses,
          longestStreak,
          duration: DURATION,
        }),
      });
    } catch (err) {
      console.error("Failed to submit speed mode results", err);
    }
  }

  const resetGame = () => {
    setGameState('setup');
    setTimeLeft(DURATION);
    setTimerActive(false);
    setCorrectCount(0);
    setTotalGuesses(0);
    setCurrentStreak(0);
    setLongestStreak(0);
    setTexts({ left: "", right: "" });
    setCurrentPrompt("");
    setCurrentPromptId(null);
    setResult(null);
    setSelectedText(null);
    setPendingSelection(null);
    setPendingSelectionSide(null);
    setPrefetchedSamples([]);
    setPrefetchedTexts({});
  };

  // Setup screen
  if (gameState === 'setup') {
    return (
      <div className="flex flex-col gap-6 items-center max-w-2xl mx-auto">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Speed Mode Challenge ⚡</h2>
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg mb-6">
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
              <strong>How it works:</strong>
            </p>
            <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1 text-left">
              <li>• You have {DURATION} seconds to evaluate as many pairs as possible</li>
              <li>• Guess which story was written by a human vs AI</li>
              <li>• Earn points for correct guesses and build streaks</li>
              <li>• Stories auto-advance after each selection</li>
            </ul>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Choose AI Model to Compete Against:</label>
            <select 
              value={selectedModel} 
              onChange={(e) => setSelectedModel(e.target.value)}
              className="border p-2 rounded-md w-48"
            >
              {MODELS.map((model) => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>
          
          <Button 
            onClick={startGame} 
            size="lg"
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3"
          >
            Start Challenge
          </Button>
        </div>
      </div>
    );
  }

  // Finished screen
  if (gameState === 'finished') {
    return (
      <div className="flex flex-col gap-6 items-center max-w-2xl mx-auto text-center">
        <h2 className="text-2xl font-bold">Challenge Complete! 🎉</h2>
        <div className="bg-green-50 dark:bg-green-950 p-6 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{correctCount}</div>
              <div className="text-sm text-gray-600">Correct</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{totalGuesses}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{longestStreak}</div>
              <div className="text-sm text-gray-600">Best Streak</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {totalGuesses > 0 ? Math.round((correctCount / totalGuesses) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-600">Accuracy</div>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button onClick={resetGame} variant="outline">
            Play Again
          </Button>
          <Button onClick={() => window.location.reload()}>
            Back to Regular Mode
          </Button>
        </div>
      </div>
    );
  }

  // Game screen (loading or playing)
  return (
    <div className="flex flex-col gap-4 items-center">
      {loading && <Progress value={progress} className="w-full" />}
      {gameState === 'playing' && (
        <div className="flex flex-wrap gap-4 items-center justify-center">
          <div className="font-medium">Time Left: {timeLeft}s</div>
          <div className="font-medium">Streak: {currentStreak}</div>
          <div className="font-medium">Longest: {longestStreak}</div>
          <div className="font-medium">
            Score: {correctCount}/{totalGuesses}
          </div>
        </div>
      )}
      
      {currentPrompt && (gameState === 'loading' || gameState === 'playing') && (
        <div className="w-full mb-4">
          <div className="text-sm font-medium text-blue-600 mb-1">
            Prompt:
          </div>
          <div className="relative pl-4">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-blue-500 rounded-full"></div>
            <h2 className="text-base font-normal leading-relaxed text-gray-700 dark:text-gray-300">
              {currentPrompt}
            </h2>
          </div>
        </div>
      )}
      
      {texts.left && (gameState === 'loading' || gameState === 'playing') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {/* Left Text */}
          <div className="flex flex-col gap-4">
            <Card
              className={`p-4 transition-all hover:shadow-lg transform ${
                selectedText
                  ? ""
                  : "cursor-pointer hover:ring-2 hover:ring-indigo-500 hover:scale-[1.02] active:scale-[0.98]"
              } ${
                pendingSelection && texts.left === pendingSelection
                  ? "ring-2 ring-blue-500"
                  : selectedText && texts.left === selectedText
                  ? "ring-2 ring-indigo-500"
                  : ""
              }`}
              onClick={() => !selectedText && handleSelection("left")}
            >
              <TextPane
                ref={leftTextRef}
                pairedRef={rightTextRef}
                text={texts.left}
                enableHighlight
                id="hm-left-pane"
              />
            </Card>
          </div>

          {/* Right Text */}
          <div className="flex flex-col gap-4">
            <Card
              className={`p-4 transition-all hover:shadow-lg transform ${
                selectedText
                  ? ""
                  : "cursor-pointer hover:ring-2 hover:ring-indigo-500 hover:scale-[1.02] active:scale-[0.98]"
              } ${
                pendingSelection && texts.right === pendingSelection
                  ? "ring-2 ring-blue-500"
                  : selectedText && texts.right === selectedText
                  ? "ring-2 ring-indigo-500"
                  : ""
              }`}
              onClick={() => !selectedText && handleSelection("right")}
            >
              <TextPane
                ref={rightTextRef}
                pairedRef={leftTextRef}
                text={texts.right}
                enableHighlight
                id="hm-right-pane"
              />
            </Card>
          </div>
        </div>
      )}
      
      {currentPromptId && (
        <div className="mt-2">
          <ReportContentButton contentId={currentPromptId} contentType="prompt" />
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
      
      {result !== null && (
        <div
          className={`w-full p-4 rounded-lg flex justify-between items-center ${
            result
              ? "bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200"
              : "bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {result ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            )}
            <span className="font-normal">
              {result ? "Correct!" : "Wrong - try again"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
