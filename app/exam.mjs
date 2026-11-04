import {
  EXAM_STORAGE_KEY, buildItems, createSession, loadSession,
  remainingSeconds, writeAnswer, goToIndex, recordVoiceEvidence,
  finishSession, scoreSession, isDeadlineError, withElapsedHighWater,
  sessionIdOf, setVoiceConsent, attachVoiceReceipt, removeVoiceReceipt, voiceEvidenceOf
} from "./exam-core.mjs";
import {createIndexedDbVoiceStore,saveVoiceClip,verifyVoiceClip} from "./exam-voice-store.mjs";
import {createIndexedDbExamRepository,newCommit,commitWithRecovery} from "./attempt-storage.mjs";
import {createTimingProfile,observePracticeTime} from "./e04-timing-policy.mjs";

const root=document.getElementById("exam-main");
const notice=document.getElementById("exam-notice");
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const urlFor=path=>new URL("../"+path,import.meta.url).href;
const section=html=>`<section class="panel">${html}</section>`;
const alertUser=msg=>notice.textContent=msg||"";
const actions=(label,act,variant="secondary")=>`<button class="btn ${variant}" type="button" data-action="${esc(act)}">${esc(label)}</button>`;
const taskNames={reading:"Tekstin ymmärtäminen · Читання",
  listening:"Puheen ymmärtäminen · Аудіювання",
  writing:"Kirjoittaminen · Письмо",speaking:"Puhuminen · Говоріння"};
const exam={blueprints:null,content:null,session:null,items:null,storageBlocked:false,
  url:null,recorder:null,stream:null,stage:"welcome",now:Date.now(),
  repository:null,persistedRevision:0,saveQueue:Promise.resolve(),transitioning:false,
  draftTimer:null,pendingDraft:null,clockBase:null,deadlineNotified:false,clockAnomalyNoted:false,
  voiceStore:null,urlTaskId:null,recordStartedAt:0,voiceLoading:null};
function newSessionId(){
  const raw=globalThis.crypto?.randomUUID?.()||String(Date.now())+Math.random().toString(16).slice(2);
  return "s-"+raw.replace(/[^a-zA-Z0-9]/g,"").slice(0,40);
}
/** Monotonic page clock anchored at session start/restore (E04-C1). performance.now()
 * keeps counting if the wall clock is moved; the max of both is persisted as a watermark.
 */
function anchorClock(){
  const s=exam.session;
  exam.deadlineNotified=false;exam.clockAnomalyNoted=false;
  exam.clockBase=s&&s.timeLimitMinutes&&!s.finishedAt?{perf:performance.now(),
    elapsedMs:Math.max(0,Date.now()-Date.parse(s.startedAt),s.elapsedHighWaterMs||0)}:null;
}
/** Observe practice time on EVERY command, not only on the 1-second display interval,
 * so a throttled/background interval cannot authorize late answers (E04 R02).
 */
function observeClock(){
  const s=exam.session;
  if(!s||s.finishedAt||!s.timeLimitMinutes)return null;
  const observation=observePracticeTime(createTimingProfile({kind:"practice",minutes:s.timeLimitMinutes}),{
    startedAtWallMs:Date.parse(s.startedAt),observedWallMs:Date.now(),
    elapsedMonotonicMs:exam.clockBase?exam.clockBase.elapsedMs+(performance.now()-exam.clockBase.perf):null,
    highestElapsedMs:s.elapsedHighWaterMs||0});
  exam.session=withElapsedHighWater(s,observation.highestElapsedMs);
  if(observation.clockIntegrity==="CLOCK_ANOMALY_PRACTICE_ONLY"&&!exam.clockAnomalyNoted&&!observation.expired){
    exam.clockAnomalyNoted=true;
    alertUser("Системний годинник змінився або пристрій був у режимі сну. Тренувальний таймер рахує обережно: втрачений час не повертається.");
  }
  return observation;
}
function deadlineReached(){
  if(!exam.deadlineNotified){
    exam.deadlineNotified=true;
    alertUser("Тренувальний час закінчився: нові відповіді й переходи більше не приймаються. Це не офіційний таймінг YKI.");
  }
  conclude();
}
function failSave(error) {
  exam.storageBlocked=true;
  alertUser("⚠️ Відповідь НЕ збережена ("+(error?.code||"SAVE_FAILED")+
    "). Перехід і завершення заблоковано. Експортуй відповідь у JSON або спробуй ще раз.");
  if(exam.blueprints)draw();
}
function queueSave(next,kind="answer"){
  const action=exam.saveQueue.then(async()=>{
    if(exam.storageBlocked)throw Object.assign(new Error("Save blocked"),{code:"SAVE_FAILED"});
    const result=await commitWithRecovery(exam.repository,newCommit(next,exam.persistedRevision,kind));
    exam.persistedRevision=result.revision;
    return result;
  });
  exam.saveQueue=action.catch(failSave);
  return action;
}
function queueDraftSave(next){
  exam.pendingDraft=next;
  if(exam.draftTimer)clearTimeout(exam.draftTimer);
  exam.draftTimer=setTimeout(()=>{
    const latest=exam.pendingDraft;
    exam.pendingDraft=null;exam.draftTimer=null;
    if(latest&&!exam.storageBlocked)queueSave(latest,"answer").catch(()=>{});
  },250);
}
async function flushDraft(){
  if(exam.draftTimer)clearTimeout(exam.draftTimer);
  exam.draftTimer=null;
  const pending=exam.pendingDraft;
  exam.pendingDraft=null;
  if(pending&&!exam.storageBlocked)await queueSave(pending,"answer");
  await exam.saveQueue;
}
async function transition(kind,createNext,after){
  if(exam.transitioning)return;
  exam.transitioning=true;
  let expired=false;
  try{
    await flushDraft();
    if(exam.storageBlocked)return;
    const next=createNext();
    await queueSave(next,kind); // commit BEFORE unlocking navigation/results
    exam.session=next;
    after?.();
    draw();
    root.focus({preventScroll:true});
  }catch(err){if(isDeadlineError(err))expired=true;else failSave(err);} // deadline ≠ storage failure
  finally{exam.transitioning=false;}
  if(expired)deadlineReached();
}
async function deleteSaved(){
  try{
    await flushDraft();
    if(exam.storageBlocked)return false;
    if(exam.session&&exam.voiceStore)await exam.voiceStore.deleteSession(sessionIdOf(exam.session));
    await exam.repository.deleteLocal();
    try{localStorage.removeItem(EXAM_STORAGE_KEY);}catch{}
    exam.persistedRevision=0;return true;
  }catch(err){failSave(err);return false;}
}

function getSaved(){
  try{return localStorage.getItem(EXAM_STORAGE_KEY);}
  catch{return null;} // Legacy storage can be blocked while IndexedDB works.
}

function progress(){
  const skills=["reading","listening","writing","speaking"];
  const names=["Читання","Слухання","Письмо","Говоріння"];
  const activeSkill=exam.items[exam.session.index]?.skill;
  const active=skills.indexOf(activeSkill);
  const route=skills.map((skill,i)=>{
    const status=i<active?"completed":i===active?"current":"upcoming";
    return '<li class="threshold-segment '+status+'"' +
      (status==="current"?' aria-current="step"':'') +
      ' aria-label="'+names[i]+(i<active?" — попередній модуль":i===active?" — поточний модуль":" — попереду")+'">' +
      '<span class="threshold-index" aria-hidden="true">'+String(i+1).padStart(2,"0")+'</span>' +
      '<span class="threshold-label">'+names[i]+'</span></li>';
  }).join("");
  return `<div class="exam-progress"><div class="rowline"><span class="exam-count">Завдання ${exam.session.index+1} / ${exam.items.length}</span><span class="exam-count">Тренувальна послідовність</span></div><progress max="${exam.items.length}" value="${exam.session.index+1}">${exam.session.index+1}/${exam.items.length}</progress></div>`+
    '<ol class="threshold-route threshold-route-exam" aria-label="Навчальна репетиція: чотири модулі">'+route+'</ol>';
}

function timerLabel(){
  if(!exam.session?.timeLimitMinutes)return '<span class="pill">Без тренувального таймера</span>';
  const secs=remainingSeconds(exam.session,new Date());
  const formatted=`${String(Math.floor(secs/60)).padStart(2,"0")}:${String(secs%60).padStart(2,"0")}`;
  return `<span class="timer ${secs<120?"expiring":""}" data-timer aria-label="Тренувальний час, що залишився">${formatted}</span>`;
}
function policy(){
  return `<p class="qualification">Це незалежний тренажер, а не офіційне ПЗ OPH. Порядок завдань, перехід назад, автозбереження та тренувальний таймер — наші дизайнерські рішення, <strong>не перевірені</strong> правила цифрового YKI 2027. Тексти й аудіо — власний навчальний контент без експертної CEFR-калібрації.</p>`;
}
function renderWelcome(){
  const intro=`<p class="eyebrow">YKI KESKITASO · цифрова репетиція</p><h1>Спробуй скласти іспит без підказок</h1>
  <p>Послідовність: читання → аудіювання → письмо → говоріння. Запитання фінською, відповіді зберігаються локально, пояснення й ключі — <strong>лише після завершення</strong>.</p>`;
  const radios=exam.blueprints.map((b,i)=>`<label class="mode-label"><input type="radio" name="blueprint" value="${esc(b.id)}" ${i===0?"checked":""} required>
    <strong>${esc(b.title_uk)}</strong><small class="muted"> · ${b.skill_blocks.length} блоки</small></label>`).join("");
  return section(intro+`<form id="exam-setup"><h2>Обери набір</h2>${radios}
    <h2>Тренувальний таймер</h2><label class="field" for="practice-time">Це НЕ офіційна тривалість YKI</label>
    <select id="practice-time" name="minutes" class="answer">
      <option value="0">Без обмеження часу — рекомендовано для першої проби</option>
      <option value="15">15 хвилин — особистий тренувальний ліміт</option>
      <option value="30">30 хвилин — особистий тренувальний ліміт</option>
      <option value="60">60 хвилин — особистий тренувальний ліміт</option>
    </select>
    <div class="actions"><button class="btn" type="submit">Почати репетицію</button></div></form>
    <p class="muted">Кожен набір містить 3 запитання до тексту, 4 до аудіо, 1 письмо й 1 говоріння. Це ${3+4+1+1} коротких завдань, <strong>не</strong> повний YKI.</p>
    <details><summary>Офіційні цифрові демоверсії OPH — 4 навички (зовнішні посилання)</summary>
    <p>Ці навчальні демонстрації відкриваються на сайті Inspera у новій вкладці. OPH не оцінює відповіді в демоверсіях; це не завдання Hospodar і не гарантія тотожного інтерфейсу іспиту 2027.</p>
    <ul>
      <li><a href="https://yki-uat.inspera.com/player/?assessmentRunId=556943021&amp;context=exam" target="_blank" rel="noopener noreferrer">📖 Tekstin ymmärtäminen — читання</a></li>
      <li><a href="https://yki-uat.inspera.com/player/?assessmentRunId=562180026&amp;context=exam" target="_blank" rel="noopener noreferrer">🎧 Puheen ymmärtäminen — аудіювання</a></li>
      <li><a href="https://yki-uat.inspera.com/player/?assessmentRunId=561868854&amp;context=exam" target="_blank" rel="noopener noreferrer">✍️ Kirjoittaminen — письмо</a></li>
      <li><a href="https://yki-uat.inspera.com/player/?assessmentRunId=562180811&amp;context=exam" target="_blank" rel="noopener noreferrer">🗣️ Puhuminen — говоріння</a></li>
    </ul>
    <p><a href="https://www.oph.fi/fi/koulutus-ja-tutkinnot/ennen-yki-testia" target="_blank" rel="noopener noreferrer">Першоджерело OPH</a>. Доступність кожного демо залежить від зовнішнього сервісу; автоматизована перевірка 29.10.2026 повернула 403 і не підтвердила поведінку інтерфейсу.</p></details>
    <details><summary>Які правила підтверджені?</summary><p>OPH підтверджує іспит на комп'ютері в центрі та відповідність загального типу завдань; повний цифровий інтерфейс і точні таймінги 2027 поки не підтверджені.</p>
    <p><a href="https://www.oph.fi/fi/uutiset/2026/yki-digitestia-kokeillaan-marraskuussa-2026" target="_blank" rel="noopener noreferrer">OPH — цифровий пілот</a> · <a href="https://ykitesti.solki.jyu.fi/tutustu-testiin/testifin/" target="_blank" rel="noopener noreferrer">SOLKI — офіційні приклади</a></p></details>`+policy());
}
function renderExam(){
  const s=exam.session,t=exam.items[s.index];
  const answer=String(s.answers[t.id]||"");
  let body=`<div class="exam-head"><div class="exam-title"><p class="eyebrow">НЕОФІЦІЙНА РЕПЕТИЦІЯ · 4 НАВИЧКИ</p>
    <h1>${esc(taskNames[t.skill])}</h1><p class="muted">Виконай завдання самостійно; правильні відповіді побачиш після завершення.</p></div>
    ${timerLabel()}</div>${progress()}`;
  if(t.skill==="reading")body+=`<div class="exam-body"><h2 lang="fi">${esc(t.heading)}</h2>
    <div class="prompt small" lang="fi">${esc(t.passage)}</div></div>`;
  if(t.skill==="listening")body+=`<div class="exam-body"><h2 lang="fi">${esc(t.heading)}</h2>
    <p class="audiowarn">Синтетичний одноголосий запис · навчальна версія. Управління аудіо в справжньому digitesti 2027 поки не підтверджене.</p>
    <audio controls preload="none" src="${esc(urlFor(t.audioPath))}"></audio>
    <p class="muted">Транскрипт і ключ приховані до завершення всієї репетиції.</p></div>`;
  if(t.kind==="choice"||t.kind==="boolean"){
    body+=`<p lang="fi" class="prompt small"><strong>${esc(t.prompt)}</strong></p>
      <div class="exam-choices" role="group" aria-label="Вибери відповідь">
      ${t.options.map((option,i)=>{const val=t.kind==="boolean"?(i===0?"true":"false"):String(i);
        return `<label class="radio"><input type="radio" name="exam-answer" value="${val}"
          ${answer===val?"checked":""}><span lang="fi">${esc(option)}</span></label>`}).join("")}</div>`;
  } else {
    body+=`<p lang="fi" class="prompt small"><strong>${esc(t.prompt)}</strong></p>`;
    if(t.requiredPoints?.length)body+=`<details><summary lang="uk">Умови завдання (не зразок відповіді)</summary><ul lang="fi">${t.requiredPoints.map(p=>`<li>${esc(p)}</li>`).join("")}</ul></details>`;
    if(t.skill==="speaking")body+=speakingBlock(t);
    body+=`<label class="field" for="exam-text">Твоя ${t.skill==="writing"?"письмова відповідь":"відповідь або план"}</label>
      <textarea class="exam-textarea" id="exam-text" name="exam-answer" lang="fi" maxlength="12000"
        placeholder="Kirjoita tähän…">${esc(answer)}</textarea>
      <p class="muted"><span data-count>${answer.length}</span> символів · автоматичне локальне збереження.</p>`;
  }
  body+=`<div class="exam-actions"><div class="actions">
    ${actions("← Попереднє","previous","secondary")}
    ${s.index<exam.items.length-1?actions("Наступне →","next",""):actions("Завершити репетицію","finish","")}
  </div><div class="actions">${actions("Завершити достроково","finish-early","quiet")}</div></div>
  <div class="actions">${actions("Експортувати поточну спробу","export","quiet")}
  ${exam.storageBlocked?actions("Спробувати зберегти ще раз","retry-save","secondary"):""}</div>
  <p class="audiowarn">Можна залишити відповідь порожньою. Перехід і завершення доступні лише після успішного збереження в IndexedDB.</p>`;
  return section(body+policy());
}
function speakingBlock(t){
  const s=exam.session,voice=voiceEvidenceOf(s,t.id),receipt=s.voiceReceipts?.[t.id];
  const recording=exam.recorder?.state==="recording";
  if(voice==="stored"&&!exam.url&&!exam.voiceLoading)loadStoredVoice(t.id);
  const status=voice==="stored"?`<p class="feedback" role="status">✅ Запис збережено лише на цьому пристрої й перевірено (${Math.round(receipt.bytes/1024)} КБ, ${Math.round(receipt.durationMs/1000)} с). Автоматично не оцінюється.</p>`:
    voice==="ephemeral"?`<p class="feedback warn" role="status">Запис НЕ збережено на пристрої: він зникне при переході до іншого завдання або перезавантаженні. Щоб зберегти — постав позначку згоди й запиши ще раз.</p>`:"";
  const player=exam.url&&exam.urlTaskId===t.id?`<audio controls src="${esc(exam.url)}"></audio>`:"";
  return `<p class="muted">Можна відповісти вголос. Мікрофон вмикається лише після натискання. Голос <strong>ніколи не надсилається</strong> на сервер.</p>
    <label class="radio"><input type="checkbox" data-voice-consent ${s.voiceConsent?"checked":""} ${recording?"disabled":""}>
      <span>Зберігати мій голосовий запис у цьому браузері, доки я його не видалю або не почну нову репетицію.</span></label>
    <div class="actions">${actions(recording?"Зупинити запис":voice?"Записати ще раз":"Записати голос",recording?"stop-record":"start-record","secondary")}
      ${voice==="stored"&&!recording?actions("Видалити запис","delete-voice","quiet"):""}</div>
    ${status}${player}
    <p class="muted">Альтернатива, якщо мікрофон недоступний: введи свій текстовий план нижче. Письмова заміна не оцінює усне мовлення.</p>`;
}
async function loadStoredVoice(taskId){
  const receipt=exam.session?.voiceReceipts?.[taskId];
  if(!receipt||!exam.voiceStore)return;
  exam.voiceLoading=taskId;
  try{
    const check=await verifyVoiceClip(exam.voiceStore,receipt);
    if(exam.session?.voiceReceipts?.[taskId]!==receipt)return;
    if(!check.storedHashVerified){await dropUnverifiedVoice(taskId);return;}
    if(exam.url)URL.revokeObjectURL(exam.url);
    exam.url=URL.createObjectURL(new Blob([check.data],{type:check.mimeType}));exam.urlTaskId=taskId;
    draw();
  }finally{exam.voiceLoading=null;}
}
/** Stored bytes missing or changed: never keep claiming a spoken answer exists (E06). */
async function dropUnverifiedVoice(taskId){
  exam.session=removeVoiceReceipt(exam.session,taskId);
  alertUser("⚠️ Збережений голосовий запис не знайдено або він пошкоджений (можливо, дані браузера очищено). Усна відповідь більше не позначена як виконана.");
  if(!exam.session.finishedAt&&!exam.storageBlocked)await queueSave(exam.session,"answer").catch(()=>{});
  draw();
}
async function deleteVoice(taskId){
  if(exam.session.finishedAt||!exam.session.voiceReceipts?.[taskId])return;
  if(!confirm("Видалити збережений голосовий запис цього завдання?"))return;
  try{
    await exam.voiceStore.delete(exam.session.voiceReceipts[taskId].storageKey.slice("local-audio:".length));
    if(exam.urlTaskId===taskId)stopAudio();
    exam.session=removeVoiceReceipt(exam.session,taskId);
    await queueSave(exam.session,"answer");
    alertUser("Запис видалено з цього пристрою.");draw();
  }catch(err){failSave(err);}
}
function renderFinished(){
  const results=scoreSession(exam.items,exam.session);
  const details=results.details;
  const summary=Object.entries(results.bySkill).map(([skill,x])=>`<div class="module-card"><strong>${esc(taskNames[skill].split(" · ")[1])}</strong>
    <span>${x.objective ? `${x.correct}/${x.objective} структурованих відповідей`:"Без перевіреного бала"}</span>
    <p class="muted">${x.ungraded} відкритих без оцінки · ${x.unanswered} без відповіді</p></div>`).join("");
  const all=exam.items.map(t=>{
    const d=details.find(x=>x.id===t.id);
    const state=d.status==="correct"?"Правильно":d.status==="incorrect"?"Помилка":
      d.status==="ungraded"?"Потребує ручної оцінки":"Без відповіді";
    const showKey=(t.kind==="choice"||t.kind==="boolean")?
      ` · <span lang="fi">ключ: ${esc(t.kind==="choice"?t.options[t.correct]:t.correct==="true"?"Oikein":"Väärin")}</span>`:"";
    return `<div class="exam-result-row"><div><strong lang="fi">${esc(t.prompt)}</strong>
      <div class="muted">Твоя відповідь: ${esc(exam.session.answers[t.id]||(
        {stored:"[усний запис збережено на цьому пристрої, без автоматичної оцінки]",
         ephemeral:"[усний запис був, але не збережений на пристрої]"}[voiceEvidenceOf(exam.session,t.id)]||"—"))}</div></div>
      <span class="tag ${d.status==="correct"?"ok":d.status==="incorrect"?"no":""}">${state}${showKey}</span></div>`;
  }).join("");
  return section(`<p class="eyebrow">Відкладений зворотний зв'язок · завершено</p>
    <h1>Результат навчальної репетиції</h1>
    <p>Показано лише результат <strong>структурованих запитань</strong>. Відкриті відповіді, письмо і говоріння автоматично <strong>не оцінюються</strong>.</p>
    <div class="module-grid">${summary}</div>
    <div class="feedback warn"><strong>Не є прогнозом YKI 3 або B1.</strong><p>Справжні навички письма й говоріння оцінюють кваліфіковані фахівці за офіційними критеріями. Не підміняємо їх кількістю правильних відповідей.</p>
    <p><a href="https://www.jyu.fi/fi/file-download/download/public/14097" target="_blank" rel="noopener noreferrer">Критерії письма</a> · <a href="https://www.jyu.fi/fi/file-download/download/public/14098" target="_blank" rel="noopener noreferrer">Критерії говоріння</a></p></div>
    <details><summary>Розгорнути перевірку за завданнями</summary>${all}</details>
    <div class="actions">${actions("Експортувати цю спробу (JSON)","export","secondary")}
      ${actions("Нова репетиція","restart","")}</div>`+policy());
}
function draw(){
  if(!exam.blueprints)return;
  // During a timed rehearsal, hide the promotional mode selector:
  // preserve concentration and avoid implying a browser mock can copy OPH UI.
  const gateway=document.querySelector(".mode-gateway");
  if(gateway)gateway.hidden=Boolean(exam.session && !exam.session.finishedAt);
  const legend=document.querySelector(".skills-legend");
  if(legend)legend.hidden=Boolean(exam.session && !exam.session.finishedAt);
  root.innerHTML=!exam.session?renderWelcome():exam.session.finishedAt?renderFinished():renderExam();
}
async function start(id,minutes){
  const b=exam.blueprints.find(x=>x.id===id);
  if(!b)throw new Error("Unknown blueprint");
  const newItems=buildItems(b,exam.content);
  await transition("start",()=>createSession(b.id,minutes,new Date(),newSessionId()),()=>{
    stopAudio();exam.items=newItems;exam.stage="exam";anchorClock();
  });
}
function recordingInProgress(){
  if(exam.recorder?.state!=="recording")return false;
  alertUser("Спершу зупини запис голосу — інакше він не збережеться.");
  return true;
}
function selectItem(index){
  if(exam.session.finishedAt)return;
  if(recordingInProgress())return;
  if(observeClock()?.expired){deadlineReached();return;}
  return transition("navigate",()=>goToIndex(exam.session,index,exam.items.length),stopAudio);
}
function stopAudio(){
  if(exam.recorder?.state==="recording"){exam.recorder.onstop=null;exam.recorder.stop();}
  if(exam.stream)exam.stream.getTracks().forEach(x=>x.stop());
  if(exam.url){URL.revokeObjectURL(exam.url);exam.url=null;exam.urlTaskId=null;}
}
async function record(){
  if(!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder==="undefined"){
    alertUser("Браузер не підтримує запис. Можна відповісти текстом як альтернативним способом.");return;
  }
  if(!exam.session||exam.session.finishedAt)return;
  try{
    const task=exam.items[exam.session.index];
    if(task.skill!=="speaking")return;
    stopAudio();
    const stream=await navigator.mediaDevices.getUserMedia({audio:true});
    exam.stream=stream;
    const rec=new MediaRecorder(stream),chunks=[];
    exam.recorder=rec;
    rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
    rec.onstop=async()=>{
      stream.getTracks().forEach(t=>t.stop());
      exam.stream=null;exam.recorder=null;
      const durationMs=performance.now()-exam.recordStartedAt;
      const blob=chunks.length?new Blob(chunks,{type:rec.mimeType||"audio/webm"}):null;
      if(exam.url)URL.revokeObjectURL(exam.url);
      exam.url=blob&&blob.size?URL.createObjectURL(blob):null;exam.urlTaskId=exam.url?task.id:null;
      let message=exam.url?"Можна прослухати свою відповідь. Запис НЕ збережено: ти не дав(-ла) згоду на локальне збереження, тож після перезавантаження він зникне.":
        "Не вдалося створити запис (0 байт). Усна відповідь не зарахована як виконана.";
      if(exam.url && !exam.session.finishedAt){
        try{
          await flushDraft();
          if(!exam.storageBlocked){
            observeClock();
            if(exam.session.voiceConsent && exam.voiceStore){
              try{
                const receipt=await saveVoiceClip(exam.voiceStore,{sessionId:sessionIdOf(exam.session),
                  taskId:task.id,data:blob,mimeType:blob.type,durationMs,revision:exam.persistedRevision+1});
                exam.session=attachVoiceReceipt(exam.session,task.id,receipt);
                message=`Запис збережено лише на цьому пристрої й перевірено (${Math.round(receipt.bytes/1024)} КБ). Його не оцінено автоматично.`;
              }catch(err){
                if(isDeadlineError(err))throw err;
                exam.session=recordVoiceEvidence(exam.session,task.id,true);
                message="⚠️ Запис НЕ збережено на пристрої ("+(err?.code||"SAVE_FAILED")+"). Прослухати можна до перезавантаження; спробуй записати ще раз або звільни місце.";
              }
            }else exam.session=recordVoiceEvidence(exam.session,task.id,true);
            await queueSave(exam.session,"answer");
          }
        }catch(err){if(isDeadlineError(err)){deadlineReached();return;}failSave(err);}
      }
      draw();
      alertUser(message);
    };
    exam.recordStartedAt=performance.now();
    rec.start();draw();alertUser("Запис іде. Зупини його вручну, перш ніж переходити до іншого завдання.");
  }catch{alertUser("Немає дозволу на мікрофон. Для альтернативи введи відповідь у текстове поле.");}
}
function conclude(){
  if(!exam.session || exam.session.finishedAt)return;
  if(exam.recorder?.state==="recording" && !exam.deadlineNotified){recordingInProgress();return;}
  return transition("finish",()=>finishSession(exam.session),stopAudio);
}
function exported(){
  const payload={warning:"Personal answers. Not official YKI scores. Raw voice recordings not exported.",
    exportVersion:1,session:exam.session,
    results:exam.session.finishedAt?scoreSession(exam.items,exam.session):null};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json;charset=utf-8"});
  const u=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=u;a.download="hospodar-yki-rehearsal.json";a.click();
  setTimeout(()=>URL.revokeObjectURL(u),1000);
}
root.addEventListener("submit",e=>{
  const form=e.target.closest("#exam-setup");if(!form)return;e.preventDefault();
  const fields=new FormData(form);
  try{start(String(fields.get("blueprint")),Number(fields.get("minutes")))}
  catch(err){alertUser(String(err.message||err));}
});
root.addEventListener("input",e=>{
  if(!exam.session || exam.session.finishedAt || exam.transitioning)return;
  const input=e.target;
  if(input.matches?.("[data-voice-consent]")){
    try{exam.session=setVoiceConsent(exam.session,input.checked);}catch{return;}
    if(!exam.storageBlocked)queueSave(exam.session,"answer").catch(()=>{});
    alertUser(input.checked?"Записи цієї репетиції зберігатимуться лише на цьому пристрої.":
      "Нові записи не зберігатимуться. Уже збережений запис можна видалити кнопкою.");
    return;
  }
  if(input.name!=="exam-answer")return;
  const task=exam.items[exam.session.index];
  observeClock();
  try{exam.session=writeAnswer(exam.session,task.id,input.value);}
  catch(err){if(isDeadlineError(err)){deadlineReached();return;}throw err;}
  if(!exam.storageBlocked)queueDraftSave(exam.session);
  const count=root.querySelector("[data-count]");if(count)count.textContent=String(input.value.length);
});
root.addEventListener("click",e=>{
  const b=e.target.closest("button[data-action]");if(!b)return;
  if(!exam.session)return;
  const act=b.dataset.action;
  if(act==="start-record"){record();return;}
  if(act==="delete-voice"){deleteVoice(exam.items[exam.session.index].id);return;}
  if(act==="stop-record"){if(exam.recorder?.state==="recording")exam.recorder.stop();return;}
  if(act==="previous"){selectItem(Math.max(0,exam.session.index-1));return;}
  if(act==="next"){selectItem(Math.min(exam.items.length-1,exam.session.index+1));return;}
  if(act==="finish"||act==="finish-early"){
    if(act==="finish-early"&&!confirm("Завершити зараз? Порожні відповіді будуть пропущені, ключі відкриються."))return;
    if(act==="finish"&&!confirm("Завершити всі завдання й відкрити результати?"))return;
    conclude();return;
  }
  if(act==="restart"){
    if(!confirm("Почати нову репетицію? Поточну спробу можна експортувати перед очищенням."))return;
    deleteSaved().then(ok=>{if(ok){stopAudio();exam.session=null;exam.items=null;draw();}});return;
  }
  if(act==="export"){exported();return;}
  if(act==="retry-save"){
    if(exam.draftTimer)clearTimeout(exam.draftTimer);
    exam.draftTimer=null;exam.pendingDraft=null;
    exam.storageBlocked=false;
    queueSave(exam.session,"answer").then(()=>{
      alertUser("Збереження підтверджено.");draw();
    }).catch(()=>{draw();});
    return;
  }
});
function clock(){
  const observation=observeClock();
  if(!observation)return;
  const sec=observation.remainingSeconds;
  const display=root.querySelector("[data-timer]");
  if(display)display.textContent=`${String(Math.floor(sec/60)).padStart(2,"0")}:${String(sec%60).padStart(2,"0")}`;
  if(observation.expired)deadlineReached();
}
window.setInterval(clock,1000);
window.addEventListener("beforeunload",stopAudio);
document.addEventListener("visibilitychange",()=>{
  if(document.visibilityState==="visible"){clock();return;} // background intervals may be throttled
  if(exam.storageBlocked||exam.transitioning||!exam.session||exam.session.finishedAt)return;
  if(exam.session.timeLimitMinutes){
    // Persist the elapsed watermark so a reload after a clock rollback cannot regain time.
    if(observeClock()?.expired)return;
    exam.pendingDraft=exam.session;
  }
  if(exam.pendingDraft)flushDraft().catch(failSave); // best effort; transition always waits for commit
});
async function boot(){
  try{
    const paths=[
      "learning/exercises/b1/exam-patterns/mini-rehearsals-v1.json",
      "learning/exercises/b1/contextual/reading-pack-v1.json",
      "learning/exercises/b1/audio-long/lessons.json",
      "learning/exercises/b1/diagnostics/baseline-v1.json"
    ];
    const docs=await Promise.all(paths.map(async path=>{
      const r=await fetch(urlFor(path),{cache:"no-cache"});
      if(!r.ok)throw new Error(`Missing ${path}: HTTP ${r.status}`);
      return r.json();
    }));
    exam.blueprints=docs[0].blueprints;
    exam.content={reading:docs[1],listening:docs[2],baseline:docs[3]};
    exam.repository=createIndexedDbExamRepository();
    try{exam.voiceStore=createIndexedDbVoiceStore();}catch{exam.voiceStore=null;}
    let saved=await exam.repository.readCurrent();
    if(!saved){
      const legacy=getSaved();
      const migrated=loadSession(legacy,exam.blueprints.map(x=>x.id));
      if(legacy&&migrated.session){
        const result=await commitWithRecovery(exam.repository,newCommit(migrated.session,0,"legacy-import"));
        exam.persistedRevision=result.revision;
        saved={session:result.session,revision:result.revision};
        try{localStorage.removeItem(EXAM_STORAGE_KEY);}catch{}
      }else if(migrated.recovered)alertUser("Старе збереження пошкоджене або несумісне.");
    }
    if(saved)exam.persistedRevision=saved.revision;
    const {session,recovered}=loadSession(saved?.session?JSON.stringify(saved.session):null,exam.blueprints.map(x=>x.id));
    if(recovered)alertUser("Збережена сесія пошкоджена або несумісна.");
    if(session){
      const b=exam.blueprints.find(x=>x.id===session.blueprintId);
      const items=buildItems(b,exam.content);
      if(session.index>=items.length)throw new Error("Restored exam index is invalid");
      exam.items=items;exam.session=session;anchorClock();
      for(const [taskId,receipt] of Object.entries(session.voiceReceipts||{})){
        const check=exam.voiceStore?await verifyVoiceClip(exam.voiceStore,receipt):{storedHashVerified:false};
        if(!check.storedHashVerified)await dropUnverifiedVoice(taskId);
      }
      if(observeClock()?.expired)deadlineReached();
    }
    draw();
  }catch(err){
    exam.storageBlocked=true;
    root.innerHTML=section(`<h1>Не вдалося завантажити тренажер</h1><p>${esc(err.message)}</p>
      <p>Запустіть із кореня репозиторію <code>python3 -m http.server 8080</code> і відкрийте <code>http://localhost:8080/app/exam.html</code>.</p>`);
  }
}
boot();
