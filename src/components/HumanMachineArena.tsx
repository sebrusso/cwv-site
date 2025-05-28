"use client";

import { createClient } from "@supabase/supabase-js";
import { useEffect, useState, useRef } from "react";
import { useUser } from "@/contexts/UserContext";
import { usePathname, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TextPane } from "@/components/TextPane";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/contexts/ToastContext";

import { ReportContentButton } from "./ReportContentButton";
import { AVAILABLE_MODELS } from "@/lib/models/modelConfig";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

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
  const [highlight, setHighlight] = useState<string>("");
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
    setLoading(true);
    setProgress(20);
    setResult(null);
    setSelectedText(null);
    setHighlight("");
    setPendingSelection(null);
    setPendingSelectionSide(null);
    
    let row: PromptRow | null = null;
    if (selectedId === "random") {
      const { data: flagged } = await supabase
        .from("content_reports")
        .select("content_id")
        .eq("content_type", "prompt")
        .eq("resolved", false);
      const excluded = (flagged || []).map((r) => r.content_id);
      let query = supabase
        .from("writingprompts-pairwise-test")
        .select("id,prompt,chosen")
        .limit(1);
      if (excluded.length > 0) {
        query = query.not("id", "in", `(${excluded.join(",")})`);
      }
      const { data } = await query.order("id", { ascending: Math.random() > 0.5 });
      if (data && data.length > 0) row = data[0];
    } else {
      const { data } = await supabase
        .from("writingprompts-pairwise-test")
        .select("id,prompt,chosen")
        .eq("id", selectedId)
        .single();
      row = data;
    }
    if (!row) {
      setLoading(false);
      return;
    }
    setCurrentPromptId(row.id);
    setProgress(60);
    const aiRes = await fetch("/api/generate-openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: row.prompt, model }),
    });
    const { text } = await aiRes.json();
    setProgress(80);
    const isHumanLeft = Math.random() < 0.5;
    setTexts({ left: isHumanLeft ? row.chosen : text, right: isHumanLeft ? text : row.chosen });
    setMapping({ left: isHumanLeft ? "human" : "ai", right: isHumanLeft ? "ai" : "human" });
    setProgress(100);
    setLoading(false);
    
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
    setHighlight("");
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
                onHighlight={setHighlight}
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
                onHighlight={setHighlight}
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
        <div className="mt-2 text-lg font-medium">
          {result ? "Correct!" : "Wrong - try again"}
          {selectedText && (
            <Button onClick={handleNextSample} className="ml-4">
              Next Sample
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
