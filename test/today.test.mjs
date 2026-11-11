import assert from "node:assert/strict";
import test from "node:test";
import { game } from "../content/game.mjs";
import { bucketFor, scoreFromTiers, tally } from "../src/histogram.mjs";
import { dayIndex, diveNumber, findPrompt, manilaDate, publicDay } from "../src/today.mjs";

test("Manila midnight is the date boundary", () => {
  assert.equal(manilaDate(new Date("2026-11-11T15:59:00Z")), "2026-11-11");
  assert.equal(manilaDate(new Date("2026-11-11T16:00:00Z")), "2026-11-12");
});

test("the pack repeats after seven Manila dates", () => {
  assert.equal(diveNumber("2026-11-11", game.epoch), 1);
  assert.equal(diveNumber("2026-11-17", game.epoch), 7);
  assert.equal(dayIndex(8, 7), 0);
});

test("the public day has prompts and no answer lists", () => {
  const day = publicDay(game, "2026-11-11");
  assert.equal(day.prompts.length, 7);
  assert.equal(JSON.stringify(day).includes("\"answers\""), false);
  assert.equal(day.prompts.every((prompt) => prompt.id && prompt.text && Object.keys(prompt).length === 2), true);
});

test("each prompt has one answer in every tier and no alias collisions", async () => {
  const { normalize } = await import("../src/score.mjs");
  const ids = new Set();
  assert.equal(game.days.length, 7);
  for (const day of game.days) {
    assert.equal(day.prompts.length, 7);
    for (const prompt of day.prompts) {
      assert.equal(ids.has(prompt.id), false);
      ids.add(prompt.id);
      const tiers = prompt.answers.map((answer) => answer.tier).sort();
      assert.deepEqual(tiers, ["t1", "t2", "t3", "t4", "t5", "t6"]);
      const names = [];
      for (const answer of prompt.answers) {
        names.push(answer.canonical, ...(answer.aliases ?? []));
      }
      const folded = names.map((name) => normalize(name));
      assert.equal(new Set(folded).size, folded.length, prompt.id);
    }
  }
});

test("a finished row of tiers becomes one bucket", () => {
  const score = scoreFromTiers(game.tiers, ["t6", "t6", "t6", "t6", "t6", "t6", "t6"]);
  assert.equal(score, 700);
  assert.equal(bucketFor(700), 6);
  assert.equal(bucketFor(0), 0);
  assert.deepEqual(tally([1, 0, 0, 0, 0, 0, 3], 650).percent, 25);
});

test("prompt lookup stays inside the pack", () => {
  assert.equal(findPrompt(game, "d1p1")?.id, "d1p1");
  assert.equal(findPrompt(game, "nope"), null);
});
