export function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function readingTimeMinutes(text, wordsPerMinute = 200) {
  const minutes = wordCount(text) / wordsPerMinute;
  return Math.max(1, Math.ceil(minutes));
}
