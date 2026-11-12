const KEY = "alamang:v2";
const V = "/vendor/krillion";

const state = {
  today: null,
  run: null,
  draft: "",
  note: "",
  line: "",
  from: "",
  busy: false,
  histogram: null,
  clock: null,
  focused: false,
  menu: false,
  rules: false,
  booting: true,
};

const app = document.querySelector("#app");

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function img(src, className, alt) {
  const node = el("img", className);
  node.src = src;
  node.alt = alt || "";
  return node;
}

function total() {
  return state.run.results.reduce((sum, row) => sum + row.score, 0);
}

function metres() {
  return total() * 10;
}

function tierOf(id) {
  return state.today.tiers.find((tier) => tier.id === id);
}

function currentPrompt() {
  return state.today.prompts[state.run.results.length];
}

function save() {
  localStorage.setItem(KEY, JSON.stringify(state.run));
}

function freshRun(today, playerId) {
  return {
    playerId,
    day: today.date,
    dive: today.dive,
    phase: "gate",
    previewUntil: null,
    deadline: null,
    results: [],
    reported: false,
  };
}

function loadRun(today) {
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(KEY) || "null");
  } catch {
    saved = null;
  }
  const playerId = saved?.playerId || crypto.randomUUID();
  if (!saved || saved.day !== today.date) return freshRun(today, playerId);
  saved.playerId = playerId;
  saved.results = Array.isArray(saved.results) ? saved.results : [];
  return saved;
}

function secondsLeft() {
  return Math.max(0, Math.ceil((state.run.deadline - Date.now()) / 1000));
}

function previewLeft() {
  return Math.max(0, Math.ceil((state.run.previewUntil - Date.now()) / 1000));
}

function armClock() {
  clearInterval(state.clock);
  state.clock = setInterval(() => {
    if (!state.run || state.booting) return;
    if (state.run.phase === "preview" && Date.now() >= state.run.previewUntil) {
      beginAnswer();
      return;
    }
    if (state.run.phase === "answer" && Date.now() >= state.run.deadline) {
      timeUp();
      return;
    }
    const clock = document.querySelector("[data-clock]");
    if (clock && state.run.phase === "answer") clock.textContent = String(secondsLeft());
    const preview = document.querySelector("[data-preview]");
    if (preview && state.run.phase === "preview") preview.textContent = `descending · the clock starts in ${previewLeft()}`;
    const fuse = document.querySelector("[data-fuse]");
    const dock = document.querySelector(".dock");
    if (fuse && state.run.phase === "answer") {
      const left = Math.max(0, state.run.deadline - Date.now());
      fuse.style.transform = `scaleX(${left / state.today.answerMs})`;
      dock?.classList.toggle("hot", left < 3000);
    }
  }, 200);
}

function beginAnswer() {
  state.run.phase = "answer";
  state.run.deadline = Date.now() + state.today.answerMs;
  state.draft = "";
  state.line = "";
  state.from = "";
  state.note = "";
  state.focused = false;
  save();
  render();
}

function pushResult(row) {
  state.run.results.push(row);
  state.run.phase = "reveal";
  state.run.deadline = null;
  state.draft = "";
  save();
  render();
}

function timeUp() {
  if (state.run.phase !== "answer") return;
  const prompt = currentPrompt();
  const typed = state.draft.trim();
  if (typed) state.note = typed;
  pushResult({
    promptId: prompt.id,
    tier: "miss",
    score: 0,
    answer: "",
    blurb: "the clock beat you to it.",
  });
}

function wordmark() {
  const title = el("h1", "title");
  "KRILLION".split("").forEach((letter, index) => {
    const span = el("span", null, letter);
    span.style.animationDelay = `${index * 0.18}s`;
    title.append(span);
  });
  return title;
}

const BANDS = [
  { min: 0, tier: "t1", range: "0-150", verdict: "Plankton. Plenty of ocean left down there." },
  { min: 151, tier: "t3", range: "151-250", verdict: "Schooler. Swimming with the school." },
  { min: 251, tier: "t4", range: "251-350", verdict: "Rare. Below the thermocline. Nice." },
  { min: 351, tier: "t5", range: "351-449", verdict: "Deep cut. Seriously deep dive." },
  { min: 450, tier: "t6", range: "450+", verdict: "One in a krillion. Trench dweller. Absurd." },
];

function bandFor(score) {
  return BANDS.reduce((current, band) => (score >= band.min ? band : current), BANDS[0]);
}

function descend() {
  if (state.dropping) return;
  if (state.run.results.length >= 7) {
    state.run.phase = "summary";
    save();
    reportFinish();
    render();
    return;
  }
  startPreview();
}

function startPreview() {
  state.menu = false;
  state.rules = false;
  state.run.phase = "preview";
  state.run.previewUntil = Date.now() + state.today.previewMs;
  state.line = "";
  state.note = "";
  save();
  render();
  armClock();
}

async function boot() {
  const started = Date.now();
  try {
    const response = await fetch("/api/today");
    if (!response.ok) throw new Error("down");
    state.today = await response.json();
    state.run = loadRun(state.today);
    save();
    const wait = Math.max(0, 1200 - (Date.now() - started));
    setTimeout(() => {
      state.booting = false;
      if (state.run.phase === "preview" && Date.now() >= state.run.previewUntil) beginAnswer();
      else if (state.run.phase === "answer" && Date.now() >= state.run.deadline) timeUp();
      else {
        if (state.run.phase === "summary" && state.run.reported) loadHistogram();
        render();
        if (state.run.phase === "preview" || state.run.phase === "answer") armClock();
      }
    }, wait);
  } catch {
    state.booting = false;
    app.replaceChildren(el("p", "home", "Could not reach the dive. Try again."));
  }
}

async function sendGuess(event) {
  event.preventDefault();
  if (state.busy || state.run.phase !== "answer") return;
  const answer = state.draft.trim();
  if (!answer) return;
  state.busy = true;
  state.line = "";
  render();
  try {
    const response = await fetch("/api/submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ promptId: currentPrompt().id, answer }),
    });
    const body = await response.json();
    state.busy = false;
    if (response.status === 429) {
      state.line = "Slow down a second.";
      render();
      return;
    }
    if (body.correction) {
      state.from = answer;
      state.draft = body.correction;
      state.line = "submit again to confirm · or edit";
      state.focused = false;
      render();
      return;
    }
    if (!body.accepted) {
      state.note = answer;
      state.line = "no echo. try again.";
      render();
      return;
    }
    if (Date.now() >= state.run.deadline) {
      timeUp();
      return;
    }
    state.note = "";
    state.from = "";
    pushResult({
      promptId: currentPrompt().id,
      tier: body.tier,
      score: body.score,
      answer: body.answer,
      blurb: body.blurb,
    });
  } catch {
    state.busy = false;
    state.line = "signal lost. resend.";
    render();
  }
}

async function reportFinish() {
  if (state.run.reported) return;
  try {
    const response = await fetch("/api/finish", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        date: state.run.day,
        playerId: state.run.playerId,
        tiers: state.run.results.map((row) => row.tier),
      }),
    });
    if (!response.ok) throw new Error("finish");
    state.histogram = await response.json();
    state.run.reported = true;
    save();
    render();
  } catch {
    state.line = "Could not record the day. Try again.";
    render();
  }
}

async function loadHistogram() {
  const response = await fetch(`/api/histogram?date=${state.run.day}&score=${total()}`);
  if (response.ok) {
    state.histogram = await response.json();
    render();
  }
}

async function sendNote() {
  if (!state.note || state.busy) return;
  const promptId = state.run.phase === "answer" ? currentPrompt().id : state.run.results.at(-1).promptId;
  state.busy = true;
  try {
    const response = await fetch("/api/note", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ date: state.run.day, promptId, answer: state.note }),
    });
    state.busy = false;
    state.line = response.ok ? "Noted. Thank you." : "Could not save that note.";
    state.note = response.ok ? "" : state.note;
    render();
  } catch {
    state.busy = false;
    state.line = "Could not save that note.";
    render();
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

async function shareCard() {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#050a14";
  ctx.fillRect(0, 0, 1200, 630);
  const sky = await loadImage(`${V}/gen/optimized/v1/bg-sky.webp`);
  ctx.drawImage(sky, 0, 0, 1200, 280);
  ctx.fillStyle = "#e8f1ff";
  ctx.font = "92px VT323, monospace";
  ctx.fillText("KRILLION", 72, 390);
  ctx.font = "36px VT323, monospace";
  ctx.fillStyle = "#4de3ff";
  ctx.fillText(`${metres()}m   ·   dive #${state.today.dive}`, 72, 450);
  for (let index = 0; index < state.run.results.length; index += 1) {
    const row = state.run.results[index];
    if (row.tier === "miss") continue;
    const mark = await loadImage(tierOf(row.tier).icon);
    ctx.drawImage(mark, 72 + index * 150, 480, 110, 110);
  }
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  const file = new File([blob], `krillion-${state.today.date}.png`, { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: "Krillion" });
    return;
  }
  const link = el("a");
  link.href = URL.createObjectURL(blob);
  link.download = file.name;
  link.click();
  URL.revokeObjectURL(link.href);
}

function dead(label, className) {
  const button = el("button", className, label);
  button.type = "button";
  button.setAttribute("aria-disabled", "true");
  return button;
}

function sea(stage) {
  const world = el("div", "world");
  world.style.setProperty("--sink", String(Math.min(1, metres() / 7000)));
  world.append(img(`${V}/gen/optimized/v1/bg-sky.webp`, "sky"));
  world.append(img(`${V}/gen/optimized/v1/bg-top.webp`, "band"));
  world.append(img(`${V}/gen/optimized/v1/bg-mid.webp`, "band"));
  world.append(img(`${V}/gen/optimized/v1/bg-trench.webp`, "band"));
  ["f1", "f2", "f3", "f4", "f5"].forEach((name) => {
    world.append(img(`${V}/tiers/schooler.png`, `fish ${name}`));
  });
  world.append(img(`${V}/tiers/krillion.png`, "mascot"));
  stage.append(world);
  stage.append(el("div", "crt"));
}

function hud(stage) {
  const bar = el("header", "hud");
  const depth = el("div", "pod");
  depth.append(el("div", "k", "DEPTH"), el("div", "n depth", `${metres()}m`));
  const pips = el("div", "pips");
  for (let index = 0; index < 7; index += 1) {
    const row = state.run.results[index];
    const pip = el("span", "pip");
    if (!row) pip.setAttribute("aria-label", "empty");
    else if (row.tier === "miss") {
      pip.classList.add("miss");
      pip.setAttribute("aria-label", "miss");
    } else {
      pip.classList.add("hit", row.tier);
      pip.setAttribute("aria-label", tierOf(row.tier).name);
    }
    pips.append(pip);
  }
  const score = el("div", "pod right");
  score.append(el("div", "k", "SCORE"), el("div", "n score", String(total())));
  bar.append(depth, pips, score);
  stage.append(bar);
}

function menuButton(stage) {
  const button = el("button", "menu-btn", "☰");
  button.type = "button";
  button.setAttribute("aria-label", "Open menu");
  button.addEventListener("click", () => {
    state.menu = true;
    render();
  });
  stage.append(button);
}

function menuLayer() {
  if (!state.menu) return null;
  const layer = el("div", "menu");
  const panel = el("div", "panel");
  const close = el("button", null, "Close");
  close.type = "button";
  close.addEventListener("click", () => {
    state.menu = false;
    render();
  });
  panel.append(close);
  ["Daily dive", "Unlimited", "Puffer Party", "Archive", "Themed packs"].forEach((label, index) => {
    const item = dead(label);
    if (index === 0) item.setAttribute("aria-current", "true");
    panel.append(item);
  });
  panel.append(el("p", "fine", "Your timer keeps running while the menu is open."));
  layer.append(panel);
  layer.addEventListener("click", (event) => {
    if (event.target === layer) {
      state.menu = false;
      render();
    }
  });
  return layer;
}

function render() {
  if (state.booting) {
    const boot = el("div", "boot");
    boot.append(img(`${V}/tiers/krillion.png`), el("p", null, "DESCENDING…"));
    app.replaceChildren(boot);
    return;
  }

  const stage = el("div", "stage");
  sea(stage);
  menuButton(stage);
  if (state.run.phase !== "gate" && state.run.phase !== "summary") hud(stage);

  if (state.run.phase === "gate") {
    const home = el("div", "home");
    home.append(wordmark());
    home.append(el("p", "tag", "THE DAILY DIVE"));
    home.append(el("p", "sub", "7 prompts · 25 seconds each · rarer answers sink deeper"));
    const how = el("button", "howto", "▸  HOW TO PLAY");
    how.type = "button";
    how.addEventListener("click", () => {
      state.rules = !state.rules;
      render();
    });
    home.append(how);
    if (state.rules) {
      const rules = el("ol", "rules");
      [
        "7 prompts a day. same for everyone.",
        "25 seconds to name one thing.",
        "rare answers score big. obvious ones float.",
        "the pick that feels clever? the school thought of it too.",
        "every point sinks you 10 metres. 700 is the trench.",
        "one dive per day. no second chances.",
      ].forEach((line) => rules.append(el("li", null, line)));
      home.append(rules);
    }
    const party = el("button", "party");
    party.type = "button";
    party.setAttribute("aria-disabled", "true");
    party.append(img(`${V}/gen/party/puffer-0.png`), el("span", null, "PUFFER PARTY"));
    home.append(party);
    const begin = el("button", "begin", "▼  BEGIN DESCENT  ▼");
    begin.type = "button";
    begin.addEventListener("click", startPreview);
    home.append(begin);
    const links = el("div", "links");
    links.append(el("span", null, `DIVE #${state.today.dive}`));
    links.append(dead("ARCHIVE"), dead("THEMED PACKS"), dead("UNLIMITED"));
    home.append(links);
    stage.append(home);
  }

  if (state.run.phase === "preview" || state.run.phase === "answer") {
    const prompt = currentPrompt();
    const card = el("section", "card");
    card.append(el("p", "rnd", `PROMPT ${state.run.results.length + 1} OF 7`));
    card.append(el("h1", null, prompt.text));
    card.append(el("p", "hint", "▼  rarer answers sink deeper  ▼"));
    stage.append(card);
    if (state.run.phase === "preview") {
      const pill = el("p", "pill", `descending · the clock starts in ${previewLeft()}`);
      pill.dataset.preview = "1";
      stage.append(pill);
    }
  }

  if (state.run.phase === "reveal") {
    const row = state.run.results.at(-1);
    const landed = el("div", "landed");
    if (row.tier === "miss") {
      const name = el("p", "tname", "NOTHING LANDED");
      name.style.color = "var(--miss)";
      landed.append(name, el("p", "tans", "—"), el("p", "tpts", "+0 PTS"), el("p", "tsub", row.blurb));
    } else {
      const tier = tierOf(row.tier);
      landed.append(img(tier.icon));
      const name = el("p", "tname", tier.name.toUpperCase());
      name.style.color = row.tier === "t6" ? "#ffd166" : "#e8f1ff";
      landed.append(name);
      landed.append(el("p", "tans", `“${row.answer}”`));
      landed.append(el("p", "tpts", `+${row.score} PTS · sink ${row.score * 10}m`));
      landed.append(el("p", "tsub", row.blurb));
    }
    const next = el("button", "next", state.run.results.length >= 7 ? "DESCEND ▼" : "DESCEND ▼");
    next.type = "button";
    next.addEventListener("click", descend);
    landed.append(next);
    if (state.note) {
      const flag = el("button", "note", "that should have counted");
      flag.type = "button";
      flag.addEventListener("click", sendNote);
      landed.append(flag);
    }
    stage.append(landed);
  }

  if (state.run.phase === "summary") {
    const done = el("div", "done");
    const inner = el("div", "done-inner");
    const top = el("div", "done-top");
    top.append(el("span", "done-brand", "KRILLION"), el("span", "done-id", `Dive #${state.today.dive} complete`));
    const scoreLine = el("div");
    scoreLine.append(el("span", "done-score", String(total())));
    scoreLine.append(el("span", "done-depth", `-${metres().toLocaleString("en-US")}m`));
    const head = el("div");
    head.append(top, scoreLine);
    if (state.histogram?.total > 1) head.append(el("p", "done-pct", `better than ${state.histogram.percent}% of today's players`));
    else if (state.histogram?.total === 1) head.append(el("p", "done-pct", "you are the first diver recorded today"));
    inner.append(head);

    const catchList = el("ul", "catch");
    state.run.results.forEach((row, index) => {
      const item = el("li");
      item.append(el("span", "q", String(index + 1)));
      if (row.tier !== "miss") item.append(img(tierOf(row.tier).icon, null, tierOf(row.tier).name));
      else item.append(el("span", "q", "miss"));
      const words = el("div");
      const prompt = state.today.prompts[index];
      words.append(el("p", "q", prompt?.text ?? ""));
      words.append(el("p", null, row.answer || "—"));
      item.append(words);
      catchList.append(item);
    });
    const caught = el("section");
    caught.append(el("p", "fathom", "the catch"), catchList);
    inner.append(caught);

    const current = bandFor(total());
    const bearing = el("ul", "bearing");
    BANDS.forEach((band) => {
      const item = el("li");
      const tier = tierOf(band.tier);
      item.append(img(tier.icon, null, tier.name));
      const range = el("span", "range", band.range);
      range.style.color = band === current ? "#e8f1ff" : "#7d93b8";
      item.append(range);
      item.append(el("span", band === current ? "on" : "off", band.verdict));
      bearing.append(item);
    });
    const bearingSection = el("section");
    bearingSection.append(el("p", "fathom", "the bearing"), bearing);
    inner.append(bearingSection);

    const actions = el("div", "done-actions");
    const copy = el("button", "copy", state.copied ? "Copied" : "Copy result");
    copy.type = "button";
    copy.addEventListener("click", async () => {
      const lines = state.run.results.map((row, index) => `${index + 1}. ${row.answer || "miss"}`);
      const text = `Dive #${state.today.dive} ${total()} -${metres()}m\n${lines.join("\n")}`;
      try {
        await navigator.clipboard.writeText(text);
        state.copied = true;
        render();
        setTimeout(() => {
          state.copied = false;
          render();
        }, 2000);
      } catch {
        state.line = "Could not copy.";
        render();
      }
    });
    const share = el("button", "quiet", "Share");
    share.type = "button";
    share.addEventListener("click", () => shareCard().catch(() => {
      state.line = "Could not make the picture.";
      render();
    }));
    actions.append(copy, share);
    inner.append(actions);
    if (state.line) inner.append(el("p", "done-pct", state.line));
    done.append(inner);
    stage.append(done);
  }

  if (state.run.phase === "answer") {
    const dock = el("form", "dock");
    const sonar = el("div", "sonar");
    sonar.append(el("span", "sweep"), el("span", null, String(secondsLeft())));
    sonar.lastChild.dataset.clock = "1";
    const input = el("input");
    input.maxLength = 80;
    input.placeholder = "type one answer…";
    input.autocomplete = "off";
    input.setAttribute("aria-label", "Your answer");
    input.value = state.draft;
    input.addEventListener("input", () => {
      state.draft = input.value;
      state.from = "";
      dock.querySelector(".dive").disabled = state.busy || !input.value.trim();
    });
    const button = el("button", "dive", "DIVE");
    button.disabled = state.busy || !state.draft.trim();
    const fuse = el("div", "fuse");
    const fill = el("span");
    fill.dataset.fuse = "1";
    fuse.append(fill);
    dock.append(sonar, input, button, fuse);
    dock.addEventListener("submit", sendGuess);
    stage.append(dock);
    if (state.from) {
      const correct = el("p", "correct", `“${state.from}” → “${state.draft}”`);
      correct.append(document.createElement("br"), document.createTextNode(state.line));
      stage.append(correct);
    } else if (state.line || state.note) {
      const correct = el("p", "correct", state.line);
      if (state.note) {
        const flag = el("button", "note", "that should have counted");
        flag.type = "button";
        flag.addEventListener("click", sendNote);
        correct.append(flag);
      }
      stage.append(correct);
    }
    app.replaceChildren(stage);
    const open = menuLayer();
    if (open) app.append(open);
    if (!state.focused) {
      input.focus();
      state.focused = true;
    }
    return;
  }

  const layer = menuLayer();
  app.replaceChildren(stage);
  if (layer) app.append(layer);
}

boot();
armClock();
