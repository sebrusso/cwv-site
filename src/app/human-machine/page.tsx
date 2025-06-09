"use client";

import { useState } from 'react';
import { HumanMachineArena } from '@/components/HumanMachineArena';
import { SpeedModeArena } from '@/components/SpeedModeArena';
import { WritingTypeToggle } from '@/components/WritingTypeToggle';
import { SpeedModeToggle } from '@/components/SpeedModeToggle';
import { HelpButton } from '@/components/HelpButton';
import { UserProfileButton } from '@/components/UserProfileButton';
import { UserScoreDisplay } from '@/components/UserScoreDisplay';
import { Info } from 'lucide-react';

export default function HumanMachinePage() {
  const [isSpeedMode, setIsSpeedMode] = useState(false);
  return (
    <div className="flex flex-col items-center p-4">
      <div className="w-full max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0 mb-4">
          <h1 className="text-2xl font-medium tracking-tight text-center sm:text-left">
            {isSpeedMode ? "Speed Mode ⚡" : "Human vs Machine 🤖"}
          </h1>
          <div className="flex items-center justify-center sm:justify-end gap-3">
            <UserScoreDisplay mode="model" />
            <HelpButton mode="model" />
            <UserProfileButton />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 sticky top-0 bg-background dark:bg-gray-950 z-10 py-2 px-1 rounded-md shadow">
          <div className="text-sm text-muted-foreground text-center sm:text-left flex items-center gap-2">
            <Info className="h-5 w-5 text-current" />
            {isSpeedMode
              ? "Guess as many as you can before time runs out. Click the left or right story you believe was written by a human."
              : "Click the left or right story you think was written by a human."
            }
          </div>
          <div className="flex justify-center sm:justify-end gap-2">
            <SpeedModeToggle isSpeedMode={isSpeedMode} onToggle={setIsSpeedMode} />
            <WritingTypeToggle />
          </div>
        </div>
        {isSpeedMode ? <SpeedModeArena /> : <HumanMachineArena />}
      </div>
    </div>
  );
}
