/** Mulberry32. `rng` on the game state is the saved integer. */
export function nextRand(rng: number): { value: number; rng: number } {
  let a = rng >>> 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { value, rng: a >>> 0 };
}

export function pickIndex(rng: number, length: number): { index: number; rng: number } {
  const rolled = nextRand(rng);
  const index = Math.min(length - 1, Math.floor(rolled.value * length));
  return { index, rng: rolled.rng };
}
