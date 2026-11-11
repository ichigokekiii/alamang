const ARTICLES = new Set(["ang", "mga", "si", "sina", "ni", "nina", "kay", "kina", "the", "a", "an"]);

export function normalize(raw) {
  const folded = String(raw ?? "")
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/['’]/g, "")
    .toLowerCase()
    .replace(/&/g, " at ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const parts = folded.split(" ").filter(Boolean);
  if (parts.length > 1 && ARTICLES.has(parts[0])) parts.shift();
  return parts.join(" ");
}

export function editDistance(a, b) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const grid = Array.from({ length: rows }, () => new Array(cols).fill(0));
  for (let i = 0; i < rows; i += 1) grid[i][0] = i;
  for (let j = 0; j < cols; j += 1) grid[0][j] = j;
  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let next = Math.min(grid[i - 1][j] + 1, grid[i][j - 1] + 1, grid[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        next = Math.min(next, grid[i - 2][j - 2] + 1);
      }
      grid[i][j] = next;
    }
  }
  return grid[a.length][b.length];
}

function namesOf(answer) {
  return [answer.canonical, ...(answer.aliases ?? [])];
}

export function matchAnswer(prompt, raw, tiers) {
  const typed = normalize(raw);
  if (!typed) return { accepted: false, reason: "empty" };

  const exact = prompt.answers.filter((answer) => namesOf(answer).some((name) => normalize(name) === typed));
  if (exact.length > 1) return { accepted: false, reason: "ambiguous" };
  if (exact.length === 1) {
    const answer = exact[0];
    const score = tiers.find((tier) => tier.id === answer.tier)?.score;
    if (score == null) return { accepted: false, reason: "unknown" };
    if (typed === normalize(answer.canonical)) {
      return { accepted: true, answer: answer.canonical, tier: answer.tier, score };
    }
    return { accepted: false, correction: answer.canonical };
  }

  if (typed.length < 4) return { accepted: false, reason: "unknown" };
  const limit = typed.length >= 10 ? 2 : 1;
  const fuzzy = [];
  for (const answer of prompt.answers) {
    const best = Math.min(...namesOf(answer).map((name) => editDistance(typed, normalize(name))));
    if (best <= limit) fuzzy.push(answer);
  }
  if (fuzzy.length === 1) return { accepted: false, correction: fuzzy[0].canonical };
  return { accepted: false, reason: "unknown" };
}
