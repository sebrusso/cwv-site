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
