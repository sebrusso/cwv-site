"use client";

import { useState } from "react";

interface ScoreDisplayProps {
  mode: "human" | "model";
}

export function ScoreDisplay({ mode }: ScoreDisplayProps) {
  const [score] = useState(0);

  return (
    <div className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full shadow-sm">
      <div className="text-white text-sm font-medium">
        {mode === "human" ? "Human" : "Model"} Score:{" "}
        <span className="text-base">{score}</span>
      </div>
    </div>
  );
}
