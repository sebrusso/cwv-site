"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export interface ModelSelectorProps {
  models: string[];
  onSelect: (selection: { modelA: string; modelB: string }) => void;
}

export function ModelSelector({ models, onSelect }: ModelSelectorProps) {
  const [modelA, setModelA] = useState(models[0] || "");
  const [modelB, setModelB] = useState(models[1] || models[0] || "");

  const start = () => {
    if (!modelA || !modelB) return;
    onSelect({ modelA, modelB });
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <select
          value={modelA}
          onChange={(e) => setModelA(e.target.value)}
          className="border p-2 rounded-md"
        >
          {models.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={modelB}
          onChange={(e) => setModelB(e.target.value)}
          className="border p-2 rounded-md"
        >
          {models.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>
      <Button onClick={start}>Start Evaluation</Button>
    </div>
  );
}
