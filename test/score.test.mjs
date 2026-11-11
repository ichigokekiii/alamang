import assert from "node:assert/strict";
import test from "node:test";
import { editDistance, matchAnswer, normalize } from "../src/score.mjs";

const tiers = [
  { id: "t1", score: 8 },
  { id: "t6", score: 100 },
];

const prompt = {
  id: "sample",
  text: "Magbigay ng isa.",
  answers: [
    { canonical: "Adobo", tier: "t1", aliases: ["pork adobo", "adobong manok"] },
    { canonical: "Relyenong Bangus", tier: "t6", aliases: ["relyeno"] },
  ],
};

test("normalize folds case, marks, and a leading article", () => {
  assert.equal(normalize("  Áng  Adobo! "), "adobo");
  assert.equal(normalize("Cariñosa"), "carinosa");
});

test("an exact canonical scores on the first submit", () => {
  const result = matchAnswer(prompt, "adobo", tiers);
  assert.deepEqual(result, { accepted: true, answer: "Adobo", tier: "t1", score: 8 });
});

test("an alias asks for a correction and does not score", () => {
  const result = matchAnswer(prompt, "pork adobo", tiers);
  assert.deepEqual(result, { accepted: false, correction: "Adobo" });
});

test("a one-letter miss offers one correction", () => {
  assert.equal(editDistance("adob", "adobo"), 1);
  const result = matchAnswer(prompt, "adob", tiers);
  assert.equal(result.correction, "Adobo");
  assert.equal(result.accepted, false);
});

test("an unknown answer does not score", () => {
  assert.deepEqual(matchAnswer(prompt, "pizza", tiers), { accepted: false, reason: "unknown" });
  assert.deepEqual(matchAnswer(prompt, "   ", tiers), { accepted: false, reason: "empty" });
});
