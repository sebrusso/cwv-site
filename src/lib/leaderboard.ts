export interface HumanDeceptionEntry {
  model: string;
  total: number;
  successRate: number;
}

export interface QualityEntry {
  model: string;
  wins: number;
  losses: number;
}

export interface SpeedModeEntry {
  username: string;
  total_correct: number;
  attempts: number;
  accuracy: number;
  best_streak: number;
}

export function sortBySuccessRate<T extends HumanDeceptionEntry>(
  entries: T[],
): T[] {
  return [...entries].sort((a, b) => b.successRate - a.successRate);
}

export function sortByWinRate<T extends QualityEntry>(entries: T[]): T[] {
  return [...entries].sort((a, b) => {
    const aRate = a.wins / (a.wins + a.losses);
    const bRate = b.wins / (b.wins + b.losses);
    return bRate - aRate;
  });
}

export function sortByAccuracy<T extends { accuracy: number }>(entries: T[]): T[] {
  return [...entries].sort((a, b) => b.accuracy - a.accuracy);
}
