export function manilaDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function diveNumber(dateStr, epoch) {
  const day = Date.parse(`${dateStr}T00:00:00Z`);
  const start = Date.parse(`${epoch}T00:00:00Z`);
  return Math.floor((day - start) / 86400000) + 1;
}

export function dayIndex(dive, count) {
  return ((dive - 1) % count + count) % count;
}

export function findPrompt(game, id) {
  for (const day of game.days) {
    const prompt = day.prompts.find((item) => item.id === id);
    if (prompt) return prompt;
  }
  return null;
}

export function publicDay(game, dateStr) {
  const dive = diveNumber(dateStr, game.epoch);
  const day = game.days[dayIndex(dive, game.days.length)];
  return {
    date: dateStr,
    dive,
    title: day.title,
    prompts: day.prompts.map(({ id, text }) => ({ id, text })),
    tiers: game.tiers.map(({ id, score, name, icon, blurb }) => ({ id, score, name, icon, blurb })),
    previewMs: 3000,
    answerMs: 25000,
    maxScore: 700,
  };
}
