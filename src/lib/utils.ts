import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncateToSentence(text: string) {
  const trimmed = text.trim();
  const lastPeriod = Math.max(
    trimmed.lastIndexOf('.'),
    trimmed.lastIndexOf('!'),
    trimmed.lastIndexOf('?'),
  );
  if (lastPeriod === -1) {
    return { text: '', truncated: false };
  }
  const result = trimmed.slice(0, lastPeriod + 1).trim();
  return { text: result, truncated: result.length !== trimmed.length };
}

export function isValidLength(text: string, min = 1, max = 1000) {
  const len = text.trim().length;
  return len >= min && len <= max;
}

