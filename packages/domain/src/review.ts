/**
 * S2 reviewer workspace (docs/29 stage 1, QL-01, CURATED, LE-13): a human reviewer's decision about one content item.
 *
 * The reviewer either approves an item (with every field the repository's publication gate requires) or returns it with
 * a reason. Decisions leave the browser only as a downloaded file; `scripts/apply_review_decisions.py` writes them into
 * the content after checking that the item still has the exact hash the reviewer saw, and
 * `scripts/validate_content_publication.py` stays the real gate. This module mirrors that gate so the workspace can
 * refuse an incomplete approval before it is ever written. Nothing here can approve anything by itself: there is no
 * default reviewer, no default decision and no AI path.
 */

export const REVIEW_CARD_SCHEMA = "hospodar-review-card-v1";
export const REVIEW_DECISIONS_SCHEMA = "hospodar-review-decisions-v1";
export const REVIEW_LEVELS = ["A1.3", "A2.1", "A2.2", "B1.1", "B1.2", "B2.1"] as const;
export const REVIEW_SKILLS = ["reading", "listening", "writing", "speaking", "grammar", "vocabulary"] as const;
export const REVIEW_SOURCE_KINDS = ["project_original", "licensed", "public_domain"] as const;
export const REDISTRIBUTABLE_LICENSES = ["project_original", "CC0-1.0", "CC-BY-4.0", "CC-BY-SA-4.0", "CC-BY-3.0", "CC-BY-SA-3.0", "public-domain"] as const;
export const RETURN_CATEGORIES = ["key", "finnish", "meaning", "level", "ukrainian", "audio", "rights", "other"] as const;

export type ReviewLevel = (typeof REVIEW_LEVELS)[number];
export type ReviewSkill = (typeof REVIEW_SKILLS)[number];
export type ReviewSourceKind = (typeof REVIEW_SOURCE_KINDS)[number];
export type ReturnCategory = (typeof RETURN_CATEGORIES)[number];

export const RETURN_CATEGORY_UK: Record<ReturnCategory, string> = {
  key: "Ключ або прийнятні варіанти неправильні чи неповні",
  finnish: "Фінська помилкова або неприродна",
  meaning: "Завдання неоднозначне або перевіряє не те, що заявлено",
  level: "Рівень або тема не відповідають",
  ukrainian: "Українська інструкція чи пояснення неточні",
  audio: "Аудіо, субтитри чи транскрипт не збігаються з текстом",
  rights: "Права на матеріал не підтверджено",
  other: "Інше (поясни в причині)",
};
export const REVIEW_SKILL_UK: Record<ReviewSkill, string> = {
  reading: "Читання", listening: "Аудіювання", writing: "Письмо", speaking: "Говоріння", grammar: "Граматика", vocabulary: "Лексика",
};

export interface ReviewApproval {
  level: ReviewLevel | "";
  skills: ReviewSkill[];
  communicative_outcome_uk: string;
  source: { kind: ReviewSourceKind | ""; license: string; url?: string };
  answer_variants_reviewed: boolean;
  /** true when the item has audio and its transcript/subtitles were checked; null when it has no audio. */
  transcript_reviewed: boolean | null;
  content_version: number;
}
export interface ReviewDecision {
  /** Repository-relative content file the item lives in (the apply script only accepts known content folders). */
  file: string;
  item_id: string;
  /** Hash of the item exactly as the reviewer saw it (canonicalReviewJson below, sha256). */
  content_hash: string;
  decision: "approve" | "return";
  reviewer_id: string;
  reviewed_at: string;
  approval?: ReviewApproval;
  return_categories?: ReturnCategory[];
  reason_uk?: string;
}
export interface ReviewDecisionsFile {
  schema: typeof REVIEW_DECISIONS_SCHEMA;
  created_at: string;
  note_uk: string;
  decisions: ReviewDecision[];
}

const REVIEWER_ID = /^[A-Za-z0-9_.-]{2,64}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const HASH = /^sha256:[0-9a-f]{64}$/;
const CONTENT_FILE = /^(learning\/exercises|knowledge\/dictionaries)\/[A-Za-z0-9_./-]+\.json$/;
const has = <T extends string>(list: readonly T[], v: unknown): v is T => typeof v === "string" && (list as readonly string[]).includes(v);

/** Pseudonymous reviewer id: letters, digits, `_ . -`, 2–64 characters — never a name or e-mail. */
export const validReviewerId = (id: string) => REVIEWER_ID.test(id) && !id.includes("..");

/**
 * Everything that blocks a decision, in Ukrainian for the reviewer. An approval needs every field the publication gate
 * checks (level, skills, communicative outcome, redistributable source, human reviewer, date, key/variants checked,
 * transcript checked when there is audio, version); a return needs at least one category and a concrete reason.
 */
export function reviewDecisionErrors(d: ReviewDecision, ctx: { hasAudio: boolean }): string[] {
  const e: string[] = [];
  if (!CONTENT_FILE.test(d.file) || d.file.includes("..")) e.push("Невідомий файл контенту.");
  if (!d.item_id.trim()) e.push("Немає ідентифікатора одиниці.");
  if (!HASH.test(d.content_hash)) e.push("Немає хешу одиниці, яку ти бачив(ла).");
  if (!validReviewerId(d.reviewer_id)) e.push("Вкажи псевдонімний ідентифікатор рецензента (латиниця, цифри, _ . -; без імені й пошти).");
  if (!DATE.test(d.reviewed_at)) e.push("Дата рецензії має бути у форматі РРРР-ММ-ДД.");
  if (d.decision === "return") {
    if (!d.return_categories?.length || !d.return_categories.every(c => has(RETURN_CATEGORIES, c))) e.push("Обери хоча б одну причину повернення.");
    if ((d.reason_uk ?? "").trim().length < 10) e.push("Опиши, що саме виправити (щонайменше 10 знаків).");
    return e;
  }
  if (d.decision !== "approve") return [...e, "Рішення має бути «схвалити» або «повернути»."];
  const a = d.approval;
  if (!a) return [...e, "Заповни картку рецензії."];
  if (!has(REVIEW_LEVELS, a.level)) e.push("Обери рівень (A1.3…B2.1).");
  if (!a.skills.length || !a.skills.every(s => has(REVIEW_SKILLS, s))) e.push("Обери хоча б одну навичку.");
  if (a.communicative_outcome_uk.trim().length < 10) e.push("Опиши, що учень зможе зробити фінською після завдання (щонайменше 10 знаків).");
  if (!has(REVIEW_SOURCE_KINDS, a.source.kind)) e.push("Вкажи походження матеріалу.");
  if (!has(REDISTRIBUTABLE_LICENSES, a.source.license)) e.push("Ліцензія має дозволяти поширення (без ND/NC і не «лише посилання»).");
  if (a.source.kind !== "project_original" && !/^https:\/\/\S+$/.test(a.source.url ?? "")) e.push("Для чужого матеріалу потрібне посилання на джерело (https).");
  if (a.answer_variants_reviewed !== true) e.push("Підтверди, що перевірив(ла) ключ і всі прийнятні варіанти.");
  if (ctx.hasAudio ? a.transcript_reviewed !== true : a.transcript_reviewed !== null) {
    e.push(ctx.hasAudio ? "Підтверди, що перевірив(ла) аудіо разом із транскриптом чи субтитрами." : "У цієї одиниці немає аудіо: позначка транскрипту не потрібна.");
  }
  if (!Number.isInteger(a.content_version) || a.content_version < 1) e.push("Версія контенту — ціле число від 1.");
  return e;
}

/** One decision per item: a later decision about the same file+item replaces the earlier one. */
export function upsertDecision(list: readonly ReviewDecision[], d: ReviewDecision): ReviewDecision[] {
  return [...list.filter(x => !(x.file === d.file && x.item_id === d.item_id)), d];
}

/** The downloadable file. Throws if any decision is incomplete — an invalid approval never leaves the workspace. */
export function reviewDecisionsFile(decisions: readonly ReviewDecision[], createdAt: string, audio: (d: ReviewDecision) => boolean): ReviewDecisionsFile {
  for (const d of decisions) {
    const errors = reviewDecisionErrors(d, { hasAudio: audio(d) });
    if (errors.length) throw new Error(`${d.file} ${d.item_id}: ${errors.join(" ")}`);
  }
  return {
    schema: REVIEW_DECISIONS_SCHEMA,
    created_at: createdAt,
    note_uk: "Рішення людини-рецензента S2. Застосувати: python3 scripts/apply_review_decisions.py ФАЙЛ. Скрипт перевіряє, що кожна одиниця не змінилася після рецензії.",
    decisions: [...decisions].sort((a, b) => (a.file + a.item_id).localeCompare(b.file + b.item_id)),
  };
}

/** Parse a file this workspace produced earlier (to continue a review session); null when it is not one. */
export function parseReviewDecisionsFile(raw: unknown): ReviewDecision[] | null {
  if (!raw || typeof raw !== "object") return null;
  const f = raw as Partial<ReviewDecisionsFile>;
  if (f.schema !== REVIEW_DECISIONS_SCHEMA || !Array.isArray(f.decisions)) return null;
  const ok = f.decisions.every(d => d && typeof d === "object" && typeof d.file === "string" && typeof d.item_id === "string"
    && typeof d.content_hash === "string" && (d.decision === "approve" || d.decision === "return")
    && typeof d.reviewer_id === "string" && typeof d.reviewed_at === "string");
  return ok ? f.decisions : null;
}

/**
 * Canonical JSON of an item without its review_card — byte-identical to
 * `json.dumps(item, ensure_ascii=False, sort_keys=True, separators=(",", ":"))` in
 * scripts/validate_content_publication.py (which also writes integral floats as integers). Numbers whose text differs
 * between the two languages (non-integers below 1e-4) are refused on both sides, so a hash can never silently disagree.
 */
export function canonicalReviewJson(item: Record<string, unknown>): string {
  const { review_card: _card, ...body } = item;
  return canonical(body);
}
function canonical(v: unknown): string {
  if (v === null || typeof v === "boolean" || typeof v === "string") return JSON.stringify(v);
  if (typeof v === "number") {
    if (!Number.isFinite(v)) throw new Error("non-finite number in content");
    if (!Number.isInteger(v) && Math.abs(v) < 1e-4) throw new Error(`number ${v} has no shared canonical form`);
    return JSON.stringify(v);
  }
  if (Array.isArray(v)) return `[${v.map(canonical).join(",")}]`;
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    return `{${Object.keys(o).sort(byCodePoint).filter(k => o[k] !== undefined).map(k => `${JSON.stringify(k)}:${canonical(o[k])}`).join(",")}}`;
  }
  throw new Error(`unsupported value in content: ${typeof v}`);
}
/** Python sorts keys by code point; JS default sort compares UTF-16 units (differs only above U+FFFF). */
function byCodePoint(a: string, b: string): number {
  const x = Array.from(a), y = Array.from(b);
  for (let i = 0; i < Math.min(x.length, y.length); i++) {
    const d = x[i]!.codePointAt(0)! - y[i]!.codePointAt(0)!;
    if (d) return d;
  }
  return x.length - y.length;
}
export const formatSha256 = (digest: Uint8Array) => "sha256:" + Array.from(digest, b => b.toString(16).padStart(2, "0")).join("");

export type ItemReviewStatus = "unreviewed" | "returned" | "returned_changed" | "approved" | "approved_changed" | "withdrawn";
/** What the repository says about an item now (its review_card), compared with the item's current hash. */
export function itemReviewStatus(item: Record<string, unknown>, currentHash: string): ItemReviewStatus {
  const card = item.review_card as { status?: string; content_hash?: string; s2_review?: { decision?: string } } | undefined;
  if (!card || typeof card !== "object") return "unreviewed";
  const same = card.content_hash === currentHash;
  if (card.status === "s2_reviewed" || card.status === "published") return same ? "approved" : "approved_changed";
  if (card.status === "withdrawn") return "withdrawn";
  if (card.s2_review?.decision === "returned") return same ? "returned" : "returned_changed";
  return "unreviewed";
}
