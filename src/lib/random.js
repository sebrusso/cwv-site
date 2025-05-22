export function randomizePair(a, b) {
  const isALeft = Math.random() < 0.5;
  return {
    left: isALeft ? a : b,
    right: isALeft ? b : a,
    map: { left: isALeft ? 'A' : 'B', right: isALeft ? 'B' : 'A' },
  };
}
