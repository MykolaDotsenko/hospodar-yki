import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  itemReviewStatus, R08_CHOICE_UK, RETURN_CATEGORIES, RETURN_CATEGORY_UK, REDISTRIBUTABLE_LICENSES, REVIEW_LEVELS, REVIEW_SKILLS, REVIEW_SKILL_UK,
  REVIEW_SOURCE_KINDS, reviewDecisionErrors, reviewDecisionsFile, parseReviewDecisionsFile, upsertDecision, validReviewerId,
  type ItemReviewStatus, type ReturnCategory, type ReviewDecision, type ReviewLevel, type ReviewSkill, type ReviewSourceKind,
} from "@hospodar/domain";
import { EXAM_ITEM_IDS, EXAM_ONLY_FILES, reviewBanks, reviewUnitCount, type ReviewBank, type ReviewUnit } from "../content/reviewBanks.ts";
import { reviewHash } from "../content/reviewHash.ts";
import { r08Drafts } from "../content/r08.ts";
import { readReviewSession, writeReviewSession, type ReviewSession } from "../storage/reviewDecisions.ts";
import { cleanupReviewSandboxes, openReviewSandbox, type ReviewSandbox } from "../storage/reviewSandbox.ts";
import type { LearnerSnapshot } from "../storage/learnerRepository.ts";
import { R08MissionScreen } from "./R08MissionScreen.tsx";
import { MissionScreen } from "./MissionScreen.tsx";
import { PracticeScreen } from "./PracticeScreen.tsx";
import { DialogueScreen } from "./DialogueScreen.tsx";
import { ReadingScreen } from "./ReadingScreen.tsx";
import { WritingClinicScreen } from "./WritingClinicScreen.tsx";
import { ListeningScreen } from "./ListeningScreen.tsx";
import { PictureMissionScreen } from "./PictureMissionScreen.tsx";
import { DiagnosticScreen } from "./DiagnosticScreen.tsx";
import { MasterclassScreen } from "./MasterclassScreen.tsx";
import { MediaScreen } from "./MediaScreen.tsx";

/**
 * S2 reviewer workspace (docs/29 stage 1, QL-01, CURATED, LE-13). For every LEARN bank: walk a task on the real learner
 * screen inside a throwaway sandbox (learner progress is never opened), read the item with its keys and variants, then
 * approve it with a complete review card or return it with a reason. Decisions stay in this browser until downloaded;
 * scripts/apply_review_decisions.py writes them into the repository after checking each item is unchanged.
 * Nothing is approved by default, nothing is approved by the app, and EXAM items are never shown here.
 */
const key = (file: string, id: string) => `${file}#${id}`;
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const STATUS_UK: Record<ItemReviewStatus, string> = {
  unreviewed: "Не рецензовано", returned: "Повернуто автору", returned_changed: "Виправлено після повернення — перевір знову",
  approved: "Схвалено S2", approved_changed: "Змінено після схвалення — перевір знову", withdrawn: "Знято",
};

type View = { kind: "banks" } | { kind: "bank"; bank: string } | { kind: "unit"; bank: string; index: number } | { kind: "walk"; bank: string; index: number | null };

export function ReviewerScreen({ onHome }: { onHome: () => void }) {
  const [entered, setEntered] = useState(false);
  if (!entered) return (
    <section className="panel" aria-labelledby="review-gate-title">
      <p className="reviewer-banner" role="note">Режим рецензента S2 — для викладачів. Ці завдання ще не показуються учням як перевірені.</p>
      <h1 id="review-gate-title">Робоче місце рецензента</h1>
      <p>Тут видно ключі, прийнятні варіанти й зразки до всіх навчальних завдань. <strong>Якщо ти вчишся з цим застосунком, не відкривай цей режим:</strong> побачиш відповіді, і твої перші спроби вже не будуть самостійними.</p>
      <p className="muted">Рецензія не змінює прогрес учня на цьому пристрої: завдання проходяться в окремій тимчасовій пісочниці, яка видаляється після виходу.</p>
      <div className="actions">
        <button type="button" className="btn" onClick={() => setEntered(true)}>Я рецензент(ка) — відкрити</button>
        <button type="button" className="btn secondary" onClick={onHome}>На головну</button>
      </div>
    </section>
  );
  return <Workspace onHome={onHome} />;
}

function Workspace({ onHome }: { onHome: () => void }) {
  const [view, setView] = useState<View>({ kind: "banks" });
  const [session, setSession] = useState<ReviewSession>(readReviewSession);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hashes, setHashes] = useState<Map<string, string> | "computing" | "unavailable">("computing");
  useEffect(() => { void cleanupReviewSandboxes(); }, []);               // a walk interrupted by a closed tab leaves nothing behind
  useEffect(() => {
    let live = true;
    void (async () => {
      const m = new Map<string, string>();
      for (const b of reviewBanks) for (const u of b.units) {
        const h = await reviewHash(u.item);
        if (!h) { if (live) setHashes("unavailable"); return; }
        m.set(key(u.file, u.id), h);
      }
      if (live) setHashes(m);
    })().catch(() => { if (live) setHashes("unavailable"); });
    return () => { live = false; };
  }, []);
  const persist = (next: ReviewSession) => {
    setSession(next);
    try { writeReviewSession(next); setSaveError(null); }
    catch { setSaveError("Браузер не зберіг рішення. Вони є лише на цій сторінці: завантаж файл рецензій, перш ніж закривати її."); }
  };
  const ready = hashes instanceof Map ? hashes : null;
  const decisionFor = (u: ReviewUnit) => session.decisions.find(d => d.file === u.file && d.item_id === u.id);
  const statusOf = (u: ReviewUnit): ItemReviewStatus => ready ? itemReviewStatus(u.item, ready.get(key(u.file, u.id))!) : "unreviewed";
  const bank = "bank" in view ? reviewBanks.find(b => b.id === view.bank)! : null;

  if (view.kind === "walk" && bank) {
    const u = view.index === null ? null : bank.units[view.index]!;
    return <Walk bank={bank} unit={u} onExit={() => setView(view.index === null ? { kind: "bank", bank: bank.id } : { kind: "unit", bank: bank.id, index: view.index })} />;
  }
  const banner = (
    <>
      <p className="reviewer-banner" role="note">Режим рецензента S2. Прогрес учня тут не змінюється. Рішення стають змінами в репозиторії лише після завантаження файлу та скрипту застосування.</p>
      {hashes === "unavailable" && <p className="feedback error" role="alert">Цей браузер не дає порахувати хеш одиниць (потрібне захищене з'єднання https або localhost). Рішення записати не можна.</p>}
      {saveError && <p className="feedback error" role="alert">{saveError}</p>}
    </>
  );
  if (view.kind === "unit" && bank) {
    const u = bank.units[view.index]!;
    return (
      <section className="panel review-unit" aria-labelledby="unit-title">
        {banner}
        <p className="eyebrow">{bank.title_uk} · {view.index + 1} з {bank.units.length}</p>
        <h1 id="unit-title" tabIndex={-1}>{u.label}</h1>
        <dl className="place-status">
          <div><dt>Ідентифікатор</dt><dd><code>{u.id}</code></dd></div>
          <div><dt>Файл</dt><dd><code>{u.file}</code></dd></div>
          <div><dt>У репозиторії</dt><dd data-testid="repo-status">{STATUS_UK[statusOf(u)]}</dd></div>
          <div><dt>Де бачить учень</dt><dd>{bank.where_uk}</dd></div>
        </dl>
        <div className="actions">
          {bank.walk
            ? <button type="button" className="btn" onClick={() => setView({ kind: "walk", bank: bank.id, index: bank.walk!.perItem ? view.index : null })}>
                Пройти як учень{bank.walk.perItem ? "" : " (екран банку)"}</button>
            : <p className="muted">Учень бачить цю одиницю лише як відкладену перевірку або в старому застосунку — нижче її повний вміст.</p>}
        </div>
        <h2>Вміст одиниці: ключі, варіанти й зразки</h2>
        <p className="muted">Усі поля так, як вони збережені у файлі. Поля з ключами, правильними відповідями та зразками виділено.</p>
        <ItemFields value={u.item} />
        <DecisionForm key={key(u.file, u.id)} bank={bank} unit={u} hash={ready?.get(key(u.file, u.id)) ?? null} existing={decisionFor(u)}
          reviewerId={session.reviewerId} onSubmit={d => persist({ ...session, decisions: upsertDecision(session.decisions, d) })}
          onWithdraw={() => persist({ ...session, decisions: session.decisions.filter(d => !(d.file === u.file && d.item_id === u.id)) })} />
        <div className="actions">
          {view.index > 0 && <button type="button" className="btn secondary" onClick={() => setView({ ...view, index: view.index - 1 })}>Попередня одиниця</button>}
          {view.index < bank.units.length - 1 && <button type="button" className="btn secondary" onClick={() => setView({ ...view, index: view.index + 1 })}>Наступна одиниця</button>}
          <button type="button" className="btn secondary" onClick={() => setView({ kind: "bank", bank: bank.id })}>До банку</button>
        </div>
      </section>
    );
  }
  if (view.kind === "bank" && bank) return (
    <section className="panel" aria-labelledby="bank-title">
      {banner}
      <p className="eyebrow">Банк контенту</p>
      <h1 id="bank-title">{bank.title_uk}</h1>
      <p>Де бачить учень: {bank.where_uk}. Навички за замовчуванням: {bank.skills.map(s => REVIEW_SKILL_UK[s]).join(", ")}.{bank.audio ? " Є аудіо: перевір його разом із транскриптом." : ""}</p>
      {bank.heldOutForExam > 0 && <p className="muted">Ще {bank.heldOutForExam} одиниці цього файлу входять у пробний іспит, тому тут не показуються.</p>}
      {bank.walk && !bank.walk.perItem && <div className="actions"><button type="button" className="btn" onClick={() => setView({ kind: "walk", bank: bank.id, index: null })}>Пройти банк як учень</button></div>}
      <ul className="choices review-units" aria-label="Одиниці банку">
        {bank.units.map((u, i) => {
          const d = decisionFor(u);
          return (
            <li key={key(u.file, u.id)} data-unit={u.id} data-file={u.file} data-hash={ready?.get(key(u.file, u.id)) ?? ""}>
              <button type="button" className="choice" onClick={() => setView({ kind: "unit", bank: bank.id, index: i })}>
                <span>{u.label}</span>
                <small>{u.id} · {STATUS_UK[statusOf(u)]}{d ? ` · твоє рішення: ${d.decision === "approve" ? "схвалити" : "повернути"}` : ""}</small>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="actions"><button type="button" className="btn secondary" onClick={() => setView({ kind: "banks" })}>До всіх банків</button></div>
    </section>
  );
  return <Banks banner={banner} session={session} ready={ready} statusOf={statusOf} persist={persist} open={id => setView({ kind: "bank", bank: id })} onHome={onHome} />;
}

function Banks({ banner, session, ready, statusOf, persist, open, onHome }: {
  banner: ReactNode; session: ReviewSession; ready: Map<string, string> | null; statusOf: (u: ReviewUnit) => ItemReviewStatus;
  persist: (s: ReviewSession) => void; open: (bankId: string) => void; onHome: () => void;
}) {
  const [reviewer, setReviewer] = useState(session.reviewerId);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const all = reviewBanks.flatMap(b => b.units);
  const count = (s: ItemReviewStatus[]) => all.filter(u => s.includes(statusOf(u))).length;
  const unitOf = (d: ReviewDecision) => all.find(u => u.file === d.file && u.id === d.item_id);
  const stale = ready ? session.decisions.filter(d => ready.get(key(d.file, d.item_id)) !== d.content_hash) : [];
  const current = session.decisions.filter(d => !stale.includes(d));
  const examHeld = reviewBanks.reduce((n, b) => n + b.heldOutForExam, 0);

  function download() {
    try {
      const bankOf = (d: ReviewDecision) => reviewBanks.find(b => b.units.some(u => u.file === d.file && u.id === d.item_id));
      const file = reviewDecisionsFile(current, new Date().toISOString(), d => Boolean(bankOf(d)?.audio));
      const url = URL.createObjectURL(new Blob([JSON.stringify(file, null, 2) + "\n"], { type: "application/json" }));
      const a = document.createElement("a");
      a.href = url; a.download = `hospodar-review-${today()}-${session.reviewerId || "reviewer"}.json`;
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage({ kind: "ok", text: `Файл рецензій із ${current.length} рішеннями завантажено. Передай його редактору: python3 scripts/apply_review_decisions.py ФАЙЛ.` });
    } catch (e) { setMessage({ kind: "error", text: `Файл не створено: ${(e as Error).message}` }); }
  }
  async function load(f: File | undefined) {
    if (!f) return;
    try {
      const parsed = parseReviewDecisionsFile(JSON.parse(await f.text()));
      if (!parsed) { setMessage({ kind: "error", text: "Це не файл рецензій Hospodar YKI." }); return; }
      const merged = parsed.reduce((list, d) => upsertDecision(list, d), session.decisions);
      persist({ ...session, decisions: merged });
      setMessage({ kind: "ok", text: `Продовжуємо: з файлу взято ${parsed.length} рішень.` });
    } catch { setMessage({ kind: "error", text: "Не вдалося прочитати файл." }); }
    finally { if (fileInput.current) fileInput.current.value = ""; }
  }

  return (
    <section className="panel" aria-labelledby="review-title">
      {banner}
      <h1 id="review-title">Робоче місце рецензента S2</h1>
      <p>Пройди завдання так, як його бачить учень, перевір ключ, варіанти й зразок, тоді <strong>схвали</strong> з повною карткою рецензії або <strong>поверни з причиною</strong>. Схвалення без обов'язкових полів картки не приймається.</p>
      <p className="muted">Схвалене отримує картку зі статусом <code>s2_reviewed</code>; учням у збірці випуску його покаже наступний крок — режим «лише опубліковане». Будь-яка зміна одиниці після рецензії вимагає нової рецензії.</p>
      <div className="field">
        <label htmlFor="reviewer-id">Псевдонімний ідентифікатор рецензента</label>
        <input id="reviewer-id" className="plan-notes" value={reviewer} autoComplete="off" spellCheck={false} aria-describedby="reviewer-id-help"
          onChange={e => setReviewer(e.target.value.trim())}
          onBlur={() => { if (reviewer !== session.reviewerId) persist({ ...session, reviewerId: reviewer }); }} />
        <p className="muted" id="reviewer-id-help">Латиниця, цифри, <code>_ . -</code>, 2–64 знаки, наприклад <code>s2-rev-01</code>. Без імені й пошти.</p>
        {reviewer && !validReviewerId(reviewer) && <p className="feedback warn" role="status">Такий ідентифікатор не підходить: лише латиниця, цифри та <code>_ . -</code>, без пробілів.</p>}
      </div>
      <p data-testid="review-summary">Одиниць: <strong>{reviewUnitCount}</strong> у {reviewBanks.length} банках. У репозиторії схвалено: {count(["approved"])}; повернуто: {count(["returned"])}; змінено після рецензії: {count(["approved_changed", "returned_changed"])}. Твоїх рішень у цьому браузері: <strong>{session.decisions.length}</strong>.</p>
      <div className="yki-map-scroll">
        <table className="yki-map-table review-banks">
          <caption className="visually-hidden">Банки контенту для рецензії</caption>
          <thead><tr><th scope="col">Банк</th><th scope="col">Одиниць</th><th scope="col">Схвалено</th><th scope="col">Твої рішення</th></tr></thead>
          <tbody>
            {reviewBanks.map(b => (
              <tr key={b.id} data-bank={b.id}>
                <th scope="row"><button type="button" className="linkish" onClick={() => open(b.id)}>{b.title_uk}</button></th>
                <td>{b.units.length}</td>
                <td>{b.units.filter(u => statusOf(u) === "approved").length}</td>
                <td>{session.decisions.filter(d => b.units.some(u => u.file === d.file && u.id === d.item_id)).length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted">Завдання пробного іспиту тут не показано ({EXAM_ITEM_IDS.size} одиниць, з них {examHeld} у навчальних файлах, і файли форм {EXAM_ONLY_FILES.length}): їх рецензують окремо, щоб вони лишалися невідомими до спроби.</p>
      <h2>Файл рецензій</h2>
      {stale.length > 0 && <p className="feedback warn" role="status">Рішень, які застаріли, бо одиниця змінилася після рецензії: {stale.length}. До файлу вони не потраплять — переглянь ці одиниці знову: {stale.map(d => unitOf(d)?.id ?? d.item_id).join(", ")}.</p>}
      <div className="actions">
        <button type="button" className="btn" disabled={current.length === 0} onClick={download}>Завантажити файл рецензій ({current.length})</button>
        <button type="button" className="btn secondary" onClick={() => fileInput.current?.click()}>Продовжити з файлу</button>
        <input ref={fileInput} type="file" accept="application/json,.json" className="visually-hidden" tabIndex={-1} aria-hidden="true" onChange={e => void load(e.target.files?.[0])} />
        <button type="button" className="btn secondary" disabled={session.decisions.length === 0}
          onClick={() => { if (confirm("Видалити всі рішення з цього браузера? Завантажений файл це не змінить.")) { persist({ ...session, decisions: [] }); setMessage(null); } }}>Очистити рішення</button>
      </div>
      {message && <p className={message.kind === "ok" ? "voice-status" : "feedback error"} role={message.kind === "ok" ? "status" : "alert"}>{message.text}</p>}
      <div className="actions"><button type="button" className="btn secondary" onClick={onHome}>На головну</button></div>
    </section>
  );
}

const KEY_FIELD = /answer|correct|accept|key|model|variant|solution|expected|scaffold|explanation|feedback/i;
/** Every field of the stored item; keys, accepted variants and models are marked so a reviewer cannot miss them. */
function ItemFields({ value }: { value: Record<string, unknown> }) {
  const { review_card: card, ...rest } = value;
  return (
    <>
      <FieldList value={rest} />
      {card !== undefined && <><h3>Картка рецензії в репозиторії</h3><FieldList value={card as Record<string, unknown>} /></>}
    </>
  );
}
function FieldList({ value }: { value: Record<string, unknown> }) {
  return (
    <dl className="review-fields">
      {Object.entries(value).map(([k, v]) => (
        <div key={k} className={KEY_FIELD.test(k) ? "review-key" : undefined}>
          <dt>{k}{KEY_FIELD.test(k) && <span className="draft-note">ключ / зразок</span>}</dt>
          <dd lang={/_fi$|^fi$/.test(k) ? "fi" : undefined}><FieldValue v={v} /></dd>
        </div>
      ))}
    </dl>
  );
}
function FieldValue({ v }: { v: unknown }) {
  if (v === null || v === undefined) return <span className="muted">—</span>;
  if (typeof v === "string") return <span className="review-text">{v}</span>;
  if (typeof v !== "object") return <code>{String(v)}</code>;
  if (Array.isArray(v)) return v.length === 0 ? <span className="muted">[]</span> : <ol start={0}>{v.map((x, i) => <li key={i}><FieldValue v={x} /></li>)}</ol>;
  return <FieldList value={v as Record<string, unknown>} />;
}

function DecisionForm({ bank, unit, hash, existing, reviewerId, onSubmit, onWithdraw }: {
  bank: ReviewBank; unit: ReviewUnit; hash: string | null; existing: ReviewDecision | undefined; reviewerId: string;
  onSubmit: (d: ReviewDecision) => void; onWithdraw: () => void;
}) {
  const card = unit.item.review_card as { content_version?: number; status?: string } | undefined;
  const prior = existing?.approval;
  const [kind, setKind] = useState<"" | "approve" | "return">(existing?.decision ?? "");
  const [level, setLevel] = useState<ReviewLevel | "">(prior?.level ?? "");
  const [skills, setSkills] = useState<ReviewSkill[]>(prior?.skills ?? bank.skills);
  const [outcome, setOutcome] = useState(prior?.communicative_outcome_uk ?? "");
  const urlDefault = bank.source.urlField ? String(unit.item[bank.source.urlField] ?? "") : "";
  const [sourceKind, setSourceKind] = useState<ReviewSourceKind | "">(prior?.source.kind ?? bank.source.kind);
  const [license, setLicense] = useState(prior?.source.license ?? bank.source.license);
  const [url, setUrl] = useState(prior?.source.url ?? urlDefault);
  const [variants, setVariants] = useState(prior?.answer_variants_reviewed ?? false);
  const [transcript, setTranscript] = useState(prior?.transcript_reviewed === true);
  const [version, setVersion] = useState(prior?.content_version ?? (card?.content_version && (card.status === "s2_reviewed" || card.status === "published") ? card.content_version + 1 : 1));
  const [categories, setCategories] = useState<ReturnCategory[]>(existing?.return_categories ?? []);
  const [reason, setReason] = useState(existing?.reason_uk ?? "");
  const [errors, setErrors] = useState<string[]>([]);
  const [saved, setSaved] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (errors.length) errorRef.current?.focus(); }, [errors]);
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter(x => x !== v) : [...list, v]);

  function submit(e: FormEvent) {
    e.preventDefault();
    setSaved(null);
    if (!hash) { setErrors(["Хеш одиниці ще не пораховано — зачекай або відкрий сторінку через https чи localhost."]); return; }
    if (!kind) { setErrors(["Обери рішення: схвалити або повернути."]); return; }
    const base = { file: unit.file, item_id: unit.id, content_hash: hash, reviewer_id: reviewerId, reviewed_at: today() };
    const d: ReviewDecision = kind === "approve"
      ? { ...base, decision: "approve", approval: {
          level, skills, communicative_outcome_uk: outcome.trim(),
          source: sourceKind === "project_original" ? { kind: sourceKind, license } : { kind: sourceKind, license, url: url.trim() },
          answer_variants_reviewed: variants, transcript_reviewed: bank.audio ? transcript : null, content_version: version } }
      : { ...base, decision: "return", return_categories: categories, reason_uk: reason.trim() };
    const problems = reviewDecisionErrors(d, { hasAudio: bank.audio });
    setErrors(problems);
    if (problems.length) return;
    onSubmit(d);
    setSaved(kind === "approve" ? "Рішення «схвалити» записано в цьому браузері. У репозиторій воно потрапить через файл рецензій." : "Рішення «повернути» записано в цьому браузері. У репозиторій воно потрапить через файл рецензій.");
  }

  return (
    <form className="review-decision" onSubmit={submit} noValidate aria-labelledby="decision-title">
      <h2 id="decision-title">Рішення рецензента</h2>
      {!reviewerId && <p className="feedback warn" role="status">Спершу вкажи свій псевдонімний ідентифікатор на сторінці всіх банків.</p>}
      <fieldset className="choices-set">
        <legend>Що робимо з цією одиницею?</legend>
        <label className="radio"><input type="radio" name="decision" checked={kind === "approve"} onChange={() => setKind("approve")} /> Схвалити: фінська, ключ, варіанти й права перевірено</label>
        <label className="radio"><input type="radio" name="decision" checked={kind === "return"} onChange={() => setKind("return")} /> Повернути автору з причиною</label>
      </fieldset>
      {kind === "approve" && (
        <fieldset className="choices-set">
          <legend>Картка рецензії</legend>
          <div className="field"><label htmlFor="rv-level">Рівень</label>
            <select id="rv-level" value={level} onChange={e => setLevel(e.target.value as ReviewLevel | "")}>
              <option value="">— обери —</option>{REVIEW_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select></div>
          <fieldset className="choices-set"><legend>Навички</legend>
            {REVIEW_SKILLS.map(s => <label key={s} className="radio"><input type="checkbox" checked={skills.includes(s)} onChange={() => setSkills(toggle(skills, s))} /> {REVIEW_SKILL_UK[s]}</label>)}
          </fieldset>
          <div className="field"><label htmlFor="rv-outcome">Що учень зможе зробити фінською після завдання</label>
            <textarea id="rv-outcome" className="plan-notes" rows={2} value={outcome} onChange={e => setOutcome(e.target.value)} /></div>
          <div className="field"><label htmlFor="rv-source">Походження матеріалу</label>
            <select id="rv-source" value={sourceKind} onChange={e => setSourceKind(e.target.value as ReviewSourceKind | "")}>
              <option value="">— обери —</option>
              {REVIEW_SOURCE_KINDS.map(k => <option key={k} value={k}>{k === "project_original" ? "Власний матеріал проєкту" : k === "licensed" ? "Ліцензований матеріал" : "Суспільне надбання"}</option>)}
            </select></div>
          <div className="field"><label htmlFor="rv-license">Ліцензія</label>
            <select id="rv-license" value={license} onChange={e => setLicense(e.target.value)}>
              {REDISTRIBUTABLE_LICENSES.map(l => <option key={l} value={l}>{l}</option>)}
            </select></div>
          {sourceKind !== "project_original" && <div className="field"><label htmlFor="rv-url">Посилання на джерело (https)</label>
            <input id="rv-url" className="plan-notes" type="url" value={url} onChange={e => setUrl(e.target.value)} /></div>}
          <label className="radio"><input type="checkbox" checked={variants} onChange={e => setVariants(e.target.checked)} /> Я перевірив(ла) ключ і всі прийнятні варіанти відповіді</label>
          {bank.audio && <label className="radio"><input type="checkbox" checked={transcript} onChange={e => setTranscript(e.target.checked)} /> Я прослухав(ла) аудіо й перевірив(ла) транскрипт або субтитри</label>}
          <div className="field"><label htmlFor="rv-version">Версія контенту</label>
            <input id="rv-version" className="plan-notes" type="number" min={1} step={1} value={version} onChange={e => setVersion(Number(e.target.value))} /></div>
        </fieldset>
      )}
      {kind === "return" && (
        <fieldset className="choices-set">
          <legend>Чому повертаємо</legend>
          {RETURN_CATEGORIES.map(c => <label key={c} className="radio"><input type="checkbox" checked={categories.includes(c)} onChange={() => setCategories(toggle(categories, c))} /> {RETURN_CATEGORY_UK[c]}</label>)}
          <div className="field"><label htmlFor="rv-reason">Що саме виправити</label>
            <textarea id="rv-reason" className="plan-notes" rows={3} value={reason} onChange={e => setReason(e.target.value)} /></div>
        </fieldset>
      )}
      {errors.length > 0 && (
        <div className="feedback error" role="alert" tabIndex={-1} ref={errorRef}>
          <p>Рішення не записано:</p>
          <ul>{errors.map(e => <li key={e}>{e}</li>)}</ul>
        </div>
      )}
      {saved && <p className="voice-status" role="status">{saved}</p>}
      <div className="actions">
        <button type="submit" className="btn">Записати рішення</button>
        {existing && <button type="button" className="btn secondary" onClick={() => { onWithdraw(); setKind(""); setSaved("Твоє рішення щодо цієї одиниці видалено з браузера."); }}>Скасувати моє рішення</button>}
      </div>
    </form>
  );
}

/** One walk on the real learner screen, inside a fresh sandbox that is deleted afterwards. */
function Walk({ bank, unit, onExit }: { bank: ReviewBank; unit: ReviewUnit | null; onExit: () => void }) {
  const [sandbox, setSandbox] = useState<ReviewSandbox | null>(null);
  const [snapshot, setSnapshot] = useState<LearnerSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const needsSandbox = bank.walk?.screen !== "r08";
  useEffect(() => {
    if (!needsSandbox) return;
    let opened: ReviewSandbox | null = null, live = true;
    openReviewSandbox().then(s => { opened = s; if (live) { setSandbox(s); setSnapshot(s.snapshot); } else void s.dispose(); },
      e => { if (live) setError(String((e as Error)?.message ?? e)); });
    return () => { live = false; void opened?.dispose(); };
  }, [needsSandbox]);
  const exit = onExit;
  const note = <p className="reviewer-banner" role="note">Пісочниця рецензента: відповіді не потрапляють у прогрес учня й зникнуть після виходу.</p>;
  const r08Task = useMemo(() => (bank.walk?.screen === "r08" && unit ? r08Drafts.find(t => t.id === unit.id) ?? null : null), [bank, unit]);
  if (bank.walk?.screen === "r08") {
    if (!r08Task) return <p className="feedback error" role="alert">Чернетку не знайдено.</p>;
    return <><p className="muted">{r08Task.id} · {R08_CHOICE_UK[r08Task.semantic_relation]}</p><R08MissionScreen key={r08Task.id} task={r08Task} preview onExit={exit} /></>;
  }
  if (error) return <section className="panel">{note}<p className="feedback error" role="alert">Не вдалося відкрити пісочницю ({error}).</p><button type="button" className="btn secondary" onClick={exit}>Назад</button></section>;
  if (!sandbox || !snapshot) return <section className="panel">{note}<p role="status">Готуємо пісочницю…</p></section>;
  const common = { repository: sandbox.repository, snapshot, onSaved: setSnapshot, onHome: exit };
  const id = unit?.id ?? null;
  return (
    <div className="review-walk" data-sandbox="on">
      {note}
      <div className="actions"><button type="button" className="btn secondary" onClick={exit}>Вийти з проходження</button></div>
      {bank.walk?.screen === "mission" && <MissionScreen {...common} initialTaskId={id} />}
      {bank.walk?.screen === "practice" && <PracticeScreen {...common} initialCardId={id} />}
      {bank.walk?.screen === "dialogue" && <DialogueScreen {...common} initialId={id} />}
      {bank.walk?.screen === "reading" && <ReadingScreen {...common} initialId={id} />}
      {bank.walk?.screen === "writing" && <WritingClinicScreen {...common} initialId={id} />}
      {bank.walk?.screen === "listening" && <ListeningScreen {...common} initialId={id} />}
      {bank.walk?.screen === "pictures" && <PictureMissionScreen {...common} />}
      {bank.walk?.screen === "diagnostic" && <DiagnosticScreen {...common} onListening={exit} />}
      {bank.walk?.screen === "media" && <MediaScreen {...common} />}
      {bank.walk?.screen === "masterclass" && <MasterclassScreen {...common} onListening={exit} />}
    </div>
  );
}
