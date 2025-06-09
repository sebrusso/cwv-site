"use client";

import { supabase } from "@/lib/supabase/client";
import { useEffect, useState, useRef } from "react";
import { useUser } from "@/contexts/UserContext";
import { usePathname, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TextPane } from "@/components/TextPane";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/contexts/ToastContext";
import { CheckCircle2, XCircle } from "lucide-react";

import { ReportContentButton } from "./ReportContentButton";
import { AVAILABLE_MODELS } from "@/lib/models/modelConfig-client";
import { getRandomPrompt } from "@/lib/prompts";

interface PromptRow {
  id: string;
  prompt: string;
  chosen: string;
}

const MODELS = AVAILABLE_MODELS;

export function HumanMachineArena() {
  const [prompts, setPrompts] = useState<PromptRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | "random">("random");
  const [model, setModel] = useState<string>(MODELS[0]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPromptId, setCurrentPromptId] = useState<string | null>(null);
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

  // Add refs for synchronized scrolling
  const leftTextRef = useRef<HTMLDivElement>(null);
  const rightTextRef = useRef<HTMLDivElement>(null);

  const addToast = useToast();
  const { user, isLoading } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const loadPrompts = async () => {
      const { data: flagged } = await supabase
        .from("content_reports")
        .select("content_id")
        .eq("content_type", "prompt")
        .eq("resolved", false);
      const excluded = (flagged || []).map((r) => r.content_id);
      let query = supabase
        .from("writingprompts-pairwise-test")
        .select("id,prompt,chosen")
        .limit(50);
      if (excluded.length > 0) {
        query = query.not("id", "in", `(${excluded.join(",")})`);
      }
      const { data } = await query;
      setPrompts(data || []);
    };
    loadPrompts();
  }, []);

  if (!user && !isLoading) {
    return (
      <div className="text-center py-10">
        <p className="mb-4">You must be logged in to evaluate.</p>
        <Button onClick={() => router.push(`/login?redirect=${encodeURIComponent(pathname)}`)}>Log in</Button>
      </div>
    );
  }

  const fetchSample = async () => {
    console.log('🚀 fetchSample started');
    setLoading(true);
    setProgress(20);
    setResult(null);
    setSelectedText(null);
    setTexts({ left: "", right: "" });
    setCurrentPromptId(null);
    setPendingSelection(null);
    setPendingSelectionSide(null);
    
    try {
    
    let row: PromptRow | null = null;
    if (selectedId === "random") {
      console.log('🎲 Fetching random prompt via util...');
      const data = await getRandomPrompt('id,prompt,chosen', true);
      // Type check to ensure data is a valid PromptRow
      if (data && typeof data === 'object' && 'id' in data) {
        row = data as PromptRow;
      }
      console.log('🎲 Random prompt fetched');
    } else {
      console.log('🎯 Fetching specific prompt:', selectedId);
      const { data } = await supabase
        .from("writingprompts-pairwise-test")
        .select("id,prompt,chosen")
        .eq("id", selectedId)
        .single();
      console.log('🎯 Specific prompt fetched');
      row = data;
    }
    if (!row) {
      console.log('❌ No prompt found');
      setLoading(false);
      return;
    }
    console.log('✅ Prompt ready, calling API...');
    setCurrentPromptId(row.id);
    setProgress(60);
    const aiRes = await fetch("/api/generate-openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        prompt: row.prompt, 
        model,
        referenceStory: row.chosen  // Use human story as reference for length matching
      }),
    });
    console.log('🤖 API call completed');
    
    if (!aiRes.ok) {
      console.error('❌ API call failed with status:', aiRes.status);
      const errorData = await aiRes.json();
      console.error('❌ Error details:', errorData);
      addToast(`Failed to generate AI story: ${errorData.error || 'Unknown error'}`, "error");
      setLoading(false);
      return;
    }
    
    const responseData = await aiRes.json();
    const { text, error } = responseData;
    
    if (error) {
      console.error('❌ API returned error:', error);
      addToast(`Failed to generate AI story: ${error}`, "error");
      setLoading(false);
      return;
    }
    
    if (!text || text.trim() === '') {
      console.error('❌ API returned empty text');
      addToast('AI generated empty text. Please try again.', "error");
      setLoading(false);
      return;
    }
    
    console.log('📝 Response parsed successfully');
    setProgress(80);
    console.log('🎭 Setting up texts...');
    const isHumanLeft = Math.random() < 0.5;
    setTexts({ left: isHumanLeft ? row.chosen : text, right: isHumanLeft ? text : row.chosen });
    setMapping({ left: isHumanLeft ? "human" : "ai", right: isHumanLeft ? "ai" : "human" });
    setProgress(100);
    setLoading(false);
    console.log('✨ fetchSample completed');
    
    // Reset scroll positions
    if (leftTextRef.current) leftTextRef.current.scrollTop = 0;
    if (rightTextRef.current) rightTextRef.current.scrollTop = 0;
    
    } catch (error) {
      console.error('❌ fetchSample failed:', error);
      addToast(`Failed to generate content: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
      setLoading(false);
    }
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
            modelName: model,
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
  };

  const handleNextSample = () => {
    setSelectedText(null);
    setResult(null);
    setTexts({ left: "", right: "" });
    setCurrentPromptId(null);
    setPendingSelection(null);
    setPendingSelectionSide(null);
    // Reset scroll positions
    if (leftTextRef.current) leftTextRef.current.scrollTop = 0;
    if (rightTextRef.current) rightTextRef.current.scrollTop = 0;
  };

  return (
    <div className="flex flex-col gap-4 items-center">
      {loading && <Progress value={progress} className="w-full" />}
      <div className="flex flex-wrap gap-2">
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="border p-2 rounded-md"
        >
          <option value="random">Random Prompt</option>
          {prompts.map((p) => (
            <option key={p.id} value={p.id}>
              {p.prompt.slice(0, 40)}
            </option>
          ))}
        </select>
        <select value={model} onChange={(e) => setModel(e.target.value)} className="border p-2 rounded-md">
          {MODELS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <Button onClick={fetchSample} disabled={loading}>
          {loading ? <Skeleton className="h-5 w-20" /> : "Generate"}
        </Button>
      </div>
      
      {texts.left && (
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
          {selectedText && (
            <Button
              onClick={handleNextSample}
              className={`${
                result ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
              } text-white transform transition-all hover:scale-105 active:scale-95`}
            >
              Next Sample
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
