"use client";

import { ScoreDisplay } from "./ScoreDisplay";
import { useUser } from "@/contexts/UserContext";

interface UserScoreDisplayProps {
  mode: "human" | "model";
}

export function UserScoreDisplay({ mode }: UserScoreDisplayProps) {
  const { profile } = useUser();
  return <ScoreDisplay mode={mode} score={profile?.score} />;
}
