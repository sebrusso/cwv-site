"use client";

import { Button } from "@/components/ui/button";
import { Zap, Clock } from "lucide-react";

interface SpeedModeToggleProps {
  isSpeedMode: boolean;
  onToggle: (isSpeedMode: boolean) => void;
}

export function SpeedModeToggle({ isSpeedMode, onToggle }: SpeedModeToggleProps) {
  return (
    <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <Button
        variant={!isSpeedMode ? "default" : "ghost"}
        size="sm"
        onClick={() => onToggle(false)}
        className={`flex items-center gap-2 px-3 py-1.5 transition-all ${
          !isSpeedMode
            ? "bg-white dark:bg-gray-700 shadow-sm"
            : "hover:bg-gray-200 dark:hover:bg-gray-700"
        }`}
      >
        <Clock className="h-4 w-4" />
        <span className="text-black dark:text-black">Regular</span>
      </Button>
      <Button
        variant={isSpeedMode ? "default" : "ghost"}
        size="sm"
        onClick={() => onToggle(true)}
        className={`flex items-center gap-2 px-3 py-1.5 transition-all ${
          isSpeedMode 
            ? "bg-orange-500 hover:bg-orange-600 text-white shadow-sm" 
            : "hover:bg-gray-200 dark:hover:bg-gray-700"
        }`}
      >
        <Zap className="h-4 w-4" />
        Speed Mode
      </Button>
    </div>
  );
} 