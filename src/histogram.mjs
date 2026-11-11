export function bucketFor(score) {
  if (score >= 700) return 6;
  if (score <= 0) return 0;
  return Math.min(6, Math.floor(score / 100));
}

export function tally(counts, score) {
  const bucket = bucketFor(score);
  let total = 0;
  let below = 0;
  counts.forEach((count, index) => {
    total += count;
    if (index < bucket) below += count;
  });
  return {
    total,
    below,
    percent: total ? Math.round((below / total) * 100) : 0,
  };
}

export function scoreFromTiers(tiers, rows) {
  return rows.reduce((sum, id) => {
    if (id === "miss") return sum;
    const tier = tiers.find((item) => item.id === id);
    return sum + (tier?.score ?? 0);
  }, 0);
}
