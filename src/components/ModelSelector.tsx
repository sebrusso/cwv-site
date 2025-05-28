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

  const isValid = modelA && modelB && modelA !== modelB;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md">
      <div className="w-full space-y-4">
        <div>
          <label htmlFor="modelA" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Model A
          </label>
          <select
            id="modelA"
            value={modelA}
            onChange={(e) => setModelA(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select Model A</option>
            {models.map((m) => (
              <option key={m} value={m} disabled={m === modelB}>
                {m}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex justify-center">
          <div className="text-lg font-semibold text-gray-500 dark:text-gray-400">vs</div>
        </div>
        
        <div>
          <label htmlFor="modelB" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Model B
          </label>
          <select
            id="modelB"
            value={modelB}
            onChange={(e) => setModelB(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select Model B</option>
            {models.map((m) => (
              <option key={m} value={m} disabled={m === modelA}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {!isValid && modelA && modelB && modelA === modelB && (
        <div className="text-sm text-red-600 dark:text-red-400">
          Please select two different models to compare.
        </div>
      )}
      
      <Button 
        onClick={start} 
        disabled={!isValid}
        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-8 py-2"
      >
        Start Evaluation
      </Button>
    </div>
  );
}
