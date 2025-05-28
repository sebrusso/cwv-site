"use client";

import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { usePathname, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/contexts/ToastContext";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

interface PromptRow {
  id: string;
  prompt: string;
  chosen: string;
}

const MODELS = ["gpt-4o", "gpt-4.5-turbo", "gpt-4o-mini", "gpt-4.0"];

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
  const addToast = useToast();

  const { user, isLoading } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const loadPrompts = async () => {
      const { data } = await supabase
        .from("writingprompts-pairwise-test")
        .select("id,prompt,chosen")
        .limit(50);
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
    let row: PromptRow | null = null;
    if (selectedId === "random") {
      const { count } = await supabase
        .from("writingprompts-pairwise-test")
        .select("id", { count: "exact", head: true });
      const offset = Math.floor(Math.random() * (count || 1));
      const { data } = await supabase
        .from("writingprompts-pairwise-test")
        .select("id,prompt,chosen")
        .range(offset, offset);
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
  };

  const selectSide = async (side: "left" | "right") => {
    const isCorrect = mapping[side] === "human";
    setResult(isCorrect);

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
          <Card
            className="p-4 cursor-pointer hover:ring-2 hover:ring-indigo-500"
            onClick={() => selectSide("left")}
          >
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{texts.left}</p>
          </Card>
          <Card
            className="p-4 cursor-pointer hover:ring-2 hover:ring-indigo-500"
            onClick={() => selectSide("right")}
          >
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{texts.right}</p>
          </Card>
        </div>
      )}
      {result !== null && (
        <div className="mt-2 text-lg font-medium">
          {result ? "Correct!" : "Wrong - try again"}
        </div>
      )}
    </div>
  );
}
