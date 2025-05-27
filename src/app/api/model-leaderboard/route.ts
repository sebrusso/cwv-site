import { NextResponse } from 'next/server';

export interface LeaderboardEntry {
  model: string;
  mode: string;
  wins: number;
  losses: number;
}

export async function handleModelLeaderboard() {
  const data: LeaderboardEntry[] = [
    { model: 'gpt-4o', mode: 'model', wins: 8, losses: 2 },
    { model: 'gpt-4o-mini', mode: 'model', wins: 6, losses: 4 },
    { model: 'gpt-4o', mode: 'human-machine', wins: 7, losses: 3 },
    { model: 'gpt-4o-mini', mode: 'human-machine', wins: 5, losses: 5 },
  ];
  return NextResponse.json(data);
}

export async function GET() {
  return handleModelLeaderboard();
}
