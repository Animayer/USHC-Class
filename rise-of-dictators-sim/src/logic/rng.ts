/** Mulberry32. `rng` on the game state is the saved integer. */
export function nextRand(rng: number): { value: number; rng: number } {
  let a = rng >>> 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { value, rng: a >>> 0 };
}

export function rollDie(rng: number): { face: number; rng: number } {
  const rolled = nextRand(rng);
  const face = 1 + Math.min(5, Math.floor(rolled.value * 6));
  return { face, rng: rolled.rng };
}

export function roll2d6(rng: number): { dice: [number, number]; total: number; rng: number } {
  const a = rollDie(rng);
  const b = rollDie(a.rng);
  return { dice: [a.face, b.face], total: a.face + b.face, rng: b.rng };
}
