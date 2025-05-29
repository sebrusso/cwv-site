export function wordCount(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

export function readingTimeMinutes(text, wordsPerMinute = 200) {
  const minutes = wordCount(text) / wordsPerMinute;
  return Math.max(1, Math.ceil(minutes));
}

// Add countWords as an alias for wordCount for compatibility
export const countWords = wordCount;

// Add countParagraphs function for StoryLength-Balancer
export function countParagraphs(str) {
  if (!str || !str.trim()) return 0;
  // Split by double newlines or single newlines, then filter out empty paragraphs
  const paragraphs = str.trim().split(/\n\s*\n|\n/).filter(para => para.trim().length > 0);
  return Math.max(1, paragraphs.length); // Ensure at least 1 paragraph
}
