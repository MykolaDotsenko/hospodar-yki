/** Pure learning model; no browser APIs, no personal data leaving the device. */
export const STORAGE_KEY = "hospodar-yki:mvp:v1";
export const INTERVAL_DAYS = Object.freeze([1, 3, 7, 14, 30]);
export const VERSION = 1;
const HISTORY_LIMIT = 120;
const ERROR_LIMIT = 160;
const MAX_TEXT = 1600;

export function blankState() {
  return {version: VERSION, attempts: [], cards: {}, diagnostics: [], errors: []};
}
export function readState(raw) {
  if (!raw) return {state: blankState(), recovered: false};
  try {
    const s = JSON.parse(raw);
    if (!s || s.version !== VERSION || !Array.isArray(s.attempts) ||
        !Array.isArray(s.diagnostics) || !Array.isArray(s.errors) ||
        !s.cards || typeof s.cards !== "object" || Array.isArray(s.cards)) {
      throw new Error("Invalid state schema");
    }
    const cards = {};
    for (const [id, card] of Object.entries(s.cards)) {
      if (!/^[a-z\d_-]{1,100}$/i.test(id) || !card || typeof card !== "object") continue;
      if (!Number.isInteger(card.stage) || card.stage < 0 ||
          card.stage > INTERVAL_DAYS.length || !/^\d{4}-\d\d-\d\d$/.test(card.due || "")) continue;
      cards[id] = {
        stage: card.stage, due: card.due,
        reviews: Number.isInteger(card.reviews) ? Math.max(0, card.reviews) : 0,
        failures: Number.isInteger(card.failures) ? Math.max(0, card.failures) : 0,
        lastCorrect: card.lastCorrect === true,
        lastReviewed: typeof card.lastReviewed === "string" ? card.lastReviewed : ""
      };
    }
    return {state: {
      version: VERSION,
      attempts: s.attempts.filter(x => x && typeof x.taskId === "string").slice(-HISTORY_LIMIT),
      cards,
      diagnostics: s.diagnostics.filter(x => x && typeof x.skill === "string").slice(-HISTORY_LIMIT),
      errors: s.errors.filter(x => x && typeof x.taskId === "string").slice(-ERROR_LIMIT)
    }, recovered: false};
  } catch {
    return {state: blankState(), recovered: true};
  }
}
export function normalizeFinnish(text) {
  return String(text ?? "").normalize("NFC").trim()
    .replace(/\s+/gu, " ").replace(/[.!?]+$/u, "")
    .toLocaleLowerCase("fi-FI");
}
export function checkCloze(task, answer) {
  if (!task || !task.answer_fi) throw new Error("Missing answer key");
  const typed = normalizeFinnish(answer);
  if (!typed) return {valid: false, correct: false};
  const accepted = [task.answer_fi, ...(task.accepted_alternatives_fi || [])];
  return {valid: true, correct: accepted.some(x => normalizeFinnish(x) === typed)};
}
export function localDate(now = new Date()) {
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) throw new Error("Invalid date");
  const p = n => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}
export function plusLocalDays(now, days) {
  const next = new Date(now);
  next.setHours(12, 0, 0, 0); // no DST drift across a Finnish midnight
  next.setDate(next.getDate() + days);
  return localDate(next);
}
function clipped(value) { return String(value ?? "").trim().slice(0, MAX_TEXT); }
export function updateCard(previous, firstCorrect, now = new Date()) {
  const prior = previous && typeof previous === "object" ? previous : {stage: 0, reviews: 0, failures: 0};
  const stage = firstCorrect ? Math.min(prior.stage + 1, INTERVAL_DAYS.length) : 0;
  const interval = firstCorrect ? INTERVAL_DAYS[stage - 1] : INTERVAL_DAYS[0];
  return {
    stage,
    due: plusLocalDays(now, interval),
    reviews: (prior.reviews || 0) + 1,
    failures: (prior.failures || 0) + (firstCorrect ? 0 : 1),
    lastCorrect: Boolean(firstCorrect),
    lastReviewed: localDate(now)
  };
}
export function dueCards(state, today = localDate()) {
  return Object.entries(state.cards)
    .filter(([, c]) => c && typeof c.due === "string" && c.due <= today)
    .sort((a, b) => a[1].due.localeCompare(b[1].due))
    .map(([id, card]) => ({id, ...card}));
}
export function completeMission(state, data, now = new Date()) {
  const {taskId, grammarTag, firstAnswer, firstCorrect, secondAnswer, repairCorrect, transferText} = data || {};
  if (!/^[a-z\d_-]{1,100}$/i.test(taskId || "") || !clipped(firstAnswer) || !clipped(transferText)) {
    throw new Error("Mission needs a task ID, first answer and nonempty transfer");
  }
  if (typeof firstCorrect !== "boolean") throw new Error("First-answer score required");
  const next = JSON.parse(JSON.stringify(state));
  const completion = {
    taskId, grammarTag: clipped(grammarTag).slice(0, 50),
    firstAnswer: clipped(firstAnswer), firstCorrect,
    secondAnswer: clipped(secondAnswer), repairCorrect: typeof repairCorrect === "boolean" ? repairCorrect : null,
    transferText: clipped(transferText), transferScoring: "ungraded",
    skill: "grammar", completedAt: now.toISOString()
  };
  next.attempts = [...next.attempts, completion].slice(-HISTORY_LIMIT);
  next.cards[taskId] = updateCard(next.cards[taskId], firstCorrect, now);
  if (!firstCorrect) {
    next.errors = [...next.errors, {
      taskId, grammarTag: completion.grammarTag, at: completion.completedAt,
      resolution: repairCorrect ? "guided_repair" : "not_yet_demonstrated"
    }].slice(-ERROR_LIMIT);
  }
  return next;
}
export function addDiagnostic(state, data, now = new Date()) {
  const {skill, taskId, correct, status, response} = data || {};
  if (!["reading", "listening", "writing", "speaking"].includes(skill) ||
      !["scored", "ungraded"].includes(status) ||
      !/^[a-z\d_-]{1,100}$/i.test(taskId || "")) {
    throw new Error("Invalid diagnostic");
  }
  if ((status === "scored" && typeof correct !== "boolean") ||
      (status === "ungraded" && correct !== undefined)) {
    throw new Error("Only objective answers can be scored");
  }
  const next = JSON.parse(JSON.stringify(state));
  next.diagnostics = [...next.diagnostics, {
    skill, taskId, status,
    ...(status === "scored" ? {correct} : {}),
    response: clipped(response),
    completedAt: now.toISOString()
  }].slice(-HISTORY_LIMIT);
  return next;
}
export function skillSummary(state) {
  const skills = ["reading", "listening", "writing", "speaking"];
  return Object.fromEntries(skills.map(skill => {
    const xs = state.diagnostics.filter(e => e.skill === skill);
    const scored = xs.filter(e => e.status === "scored");
    return [skill, {completed: xs.length, scored: scored.length,
      correct: scored.filter(e => e.correct).length,
      ungraded: xs.filter(e => e.status === "ungraded").length}];
  }));
}
