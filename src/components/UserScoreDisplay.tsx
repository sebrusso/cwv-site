"use client";

import { ScoreDisplay } from "./ScoreDisplay";
import { useUser } from "@/contexts/UserContext";
import { config } from "@/config";

interface UserScoreDisplayProps {
  mode: "human" | "model";
}

export function UserScoreDisplay({ mode }: UserScoreDisplayProps) {
  const { profile } = useUser();
  if (!config.showScoreDisplay) return null;
  return <ScoreDisplay mode={mode} score={profile?.score} />;
}
