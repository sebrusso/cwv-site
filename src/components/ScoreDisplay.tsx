"use client";

import { clsx } from "clsx";

interface ScoreDisplayProps {
  mode: "human" | "model";
  score?: number;
}

export function ScoreDisplay({ mode, score }: ScoreDisplayProps) {
  const displayScore = typeof score === "number" ? score : "-";
  const scoreClass = clsx("text-base", {
    "opacity-50": typeof score !== "number",
  });

  return (
    <div className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full shadow-sm">
      <div className="text-white text-sm font-medium">
        {mode === "human" ? "Human" : "Model"} Score:{" "}
        <span className={scoreClass}>{displayScore}</span>
      </div>
    </div>
  );
}
