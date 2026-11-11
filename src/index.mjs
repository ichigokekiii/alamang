import { game } from "../content/game.mjs";
import { tally, scoreFromTiers, bucketFor } from "./histogram.mjs";
import { matchAnswer } from "./score.mjs";
import { findPrompt, manilaDate, publicDay } from "./today.mjs";

const seenFinishes = new Set();
const hits = new Map();

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

async function hashIp(ip, salt) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${ip}`));
  return [...new Uint8Array(digest)].slice(0, 8).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function limited(key) {
  const now = Date.now();
  const row = hits.get(key);
  if (!row || now > row.reset) {
    hits.set(key, { n: 1, reset: now + 60_000 });
    return false;
  }
  row.n += 1;
  return row.n > 40;
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function countsFrom(row) {
  if (!row) return [0, 0, 0, 0, 0, 0, 0];
  return [row.c0, row.c1, row.c2, row.c3, row.c4, row.c5, row.c6];
}

async function histogramRow(db, day) {
  return db.prepare("SELECT c0, c1, c2, c3, c4, c5, c6 FROM histogram WHERE day = ?").bind(day).first();
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) return handleApi(request, env, url);
    return env.ASSETS.fetch(request);
  },
};

async function handleApi(request, env, url) {
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "local";
  const key = await hashIp(ip, env.HASH_SALT || "alamang-local");
  if (request.method === "POST" && limited(key)) return json({ error: "Sandali lang." }, 429);

  if (url.pathname === "/api/today" && request.method === "GET") {
    return json(publicDay(game, manilaDate()));
  }

  if (url.pathname === "/api/submit" && request.method === "POST") {
    const body = await readJson(request);
    if (!body || typeof body.promptId !== "string" || typeof body.answer !== "string") {
      return json({ error: "Hindi malinaw ang hiling." }, 400);
    }
    if (body.answer.length > 80) return json({ accepted: false, reason: "unknown" });
    const prompt = findPrompt(game, body.promptId);
    if (!prompt) return json({ error: "Walang ganyang tanong." }, 404);
    const result = matchAnswer(prompt, body.answer, game.tiers);
    if (result.accepted) {
      const blurb = game.tiers.find((tier) => tier.id === result.tier)?.blurb ?? "";
      return json({ ...result, blurb });
    }
    return json(result);
  }

  if (url.pathname === "/api/finish" && request.method === "POST") {
    const body = await readJson(request);
    const today = manilaDate();
    if (!body || body.date !== today || !Array.isArray(body.tiers) || body.tiers.length !== 7) {
      return json({ error: "Hindi malinaw ang hiling." }, 400);
    }
    const allowed = new Set([...game.tiers.map((tier) => tier.id), "miss"]);
    if (!body.tiers.every((id) => allowed.has(id))) return json({ error: "Hindi malinaw ang hiling." }, 400);
    if (typeof body.playerId !== "string" || !/^[0-9a-f-]{36}$/i.test(body.playerId)) {
      return json({ error: "Hindi malinaw ang hiling." }, 400);
    }
    const score = scoreFromTiers(game.tiers, body.tiers);
    const finishKey = `${today}:${body.playerId}`;
    if (!seenFinishes.has(finishKey)) {
      const column = `c${bucketFor(score)}`;
      try {
        await env.DB.prepare(
          `INSERT INTO histogram (day, ${column}) VALUES (?, 1)
           ON CONFLICT(day) DO UPDATE SET ${column} = ${column} + 1`,
        ).bind(today).run();
      } catch {
        return json({ error: "Hindi naitala ang araw." }, 500);
      }
      seenFinishes.add(finishKey);
    }
    const counts = countsFrom(await histogramRow(env.DB, today));
    return json({ score, ...tally(counts, score) });
  }

  if (url.pathname === "/api/histogram" && request.method === "GET") {
    const day = url.searchParams.get("date");
    const score = Number(url.searchParams.get("score"));
    if (day !== manilaDate() || !Number.isInteger(score) || score < 0 || score > 700) {
      return json({ error: "Hindi malinaw ang hiling." }, 400);
    }
    const counts = countsFrom(await histogramRow(env.DB, day));
    return json({ score, ...tally(counts, score) });
  }

  if (url.pathname === "/api/note" && request.method === "POST") {
    const body = await readJson(request);
    const today = manilaDate();
    if (!body || body.date !== today || typeof body.promptId !== "string" || typeof body.answer !== "string") {
      return json({ error: "Hindi malinaw ang hiling." }, 400);
    }
    const answer = body.answer.trim().slice(0, 80);
    if (!answer || !findPrompt(game, body.promptId)) return json({ error: "Hindi malinaw ang hiling." }, 400);
    await env.DB.prepare("INSERT INTO notes (day, prompt_id, answer, created_at) VALUES (?, ?, ?, ?)").bind(
      today,
      body.promptId,
      answer,
      new Date().toISOString(),
    ).run();
    return json({ ok: true });
  }

  return json({ error: "Wala iyan dito." }, 404);
}
