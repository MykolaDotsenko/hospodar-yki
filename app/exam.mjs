import {
  EXAM_STORAGE_KEY, buildItems, createSession, loadSession,
  remainingSeconds, writeAnswer, goToIndex, recordVoiceEvidence,
  finishSession, scoreSession
} from "./exam-core.mjs";
import {createIndexedDbExamRepository,newCommit,commitWithRecovery} from "./attempt-storage.mjs";

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
  draftTimer:null,pendingDraft:null};
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
  try{
    await flushDraft();
    if(exam.storageBlocked)return;
    const next=createNext();
    await queueSave(next,kind); // commit BEFORE unlocking navigation/results
    exam.session=next;
    after?.();
    draw();
    root.focus({preventScroll:true});
  }catch(err){failSave(err);}
  finally{exam.transitioning=false;}
}
async function deleteSaved(){
  try{
    await flushDraft();
    if(exam.storageBlocked)return false;
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
    if(t.skill==="speaking")body+=`<p class="muted">Можна відповісти вголос. Дозвіл на мікрофон надається лише після натискання. Голос не передається на сервер і не збережеться після перезавантаження.</p>
      <div class="actions">${actions(exam.recorder?.state==="recording"?"Зупинити запис":"Записати голос",exam.recorder?.state==="recording"?"stop-record":"start-record","secondary")}</div>
      ${exam.url?`<audio controls src="${esc(exam.url)}"></audio><p class="muted">Запис існує лише до закриття / оновлення сторінки.</p>`:"" }
      <p class="muted">Альтернатива, якщо мікрофон недоступний: введи свій текстовий план нижче. Письмова заміна не оцінює усне мовлення.</p>`;
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
        exam.session.voiceRecorded[t.id]?"[усний запис виконано, але файл не зберігається]":"—"))}</div></div>
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
  await transition("start",()=>createSession(b.id,minutes),()=>{
    stopAudio();exam.items=newItems;exam.stage="exam";
  });
}
function selectItem(index){
  if(exam.session.finishedAt)return;
  return transition("navigate",()=>goToIndex(exam.session,index,exam.items.length),stopAudio);
}
function stopAudio(){
  if(exam.recorder?.state==="recording"){exam.recorder.onstop=null;exam.recorder.stop();}
  if(exam.stream)exam.stream.getTracks().forEach(x=>x.stop());
  if(exam.url){URL.revokeObjectURL(exam.url);exam.url=null;}
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
      if(exam.url)URL.revokeObjectURL(exam.url);
      exam.url=chunks.length?URL.createObjectURL(new Blob(chunks,{type:rec.mimeType||"audio/webm"})):null;
      if(!exam.session.finishedAt){
        try{
          await flushDraft();
          if(!exam.storageBlocked){
            exam.session=recordVoiceEvidence(exam.session,task.id,Boolean(exam.url));
            await queueSave(exam.session,"answer");
          }
        }catch(err){failSave(err);}
      }
      draw();
      alertUser(exam.url?"Можна прослухати свою відповідь. Голосовий файл не зберігається після перезавантаження.":"Не вдалося створити запис.");
    };
    rec.start();draw();alertUser("Запис іде локально. Зупини вручну, щоб прослухати.");
  }catch{alertUser("Немає дозволу на мікрофон. Для альтернативи введи відповідь у текстове поле.");}
}
function conclude(){
  if(!exam.session || exam.session.finishedAt)return;
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
  const input=e.target;if(input.name!=="exam-answer")return;
  const task=exam.items[exam.session.index];
  exam.session=writeAnswer(exam.session,task.id,input.value);
  if(!exam.storageBlocked)queueDraftSave(exam.session);
  const count=root.querySelector("[data-count]");if(count)count.textContent=String(input.value.length);
});
root.addEventListener("click",e=>{
  const b=e.target.closest("button[data-action]");if(!b)return;
  if(!exam.session)return;
  const act=b.dataset.action;
  if(act==="start-record"){record();return;}
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
  if(!exam.session||exam.session.finishedAt)return;
  if(exam.session.timeLimitMinutes){
    const sec=remainingSeconds(exam.session);
    const display=root.querySelector("[data-timer]");
    if(display)display.textContent=`${String(Math.floor(sec/60)).padStart(2,"0")}:${String(sec%60).padStart(2,"0")}`;
    if(sec===0){conclude();alertUser("Тренувальний час закінчився. Це не офіційний таймінг YKI.");}
  }
}
window.setInterval(clock,1000);
window.addEventListener("beforeunload",stopAudio);
document.addEventListener("visibilitychange",()=>{
  if(document.visibilityState==="hidden"&&exam.pendingDraft&&!exam.storageBlocked)
    flushDraft().catch(failSave); // best effort; transition always waits for commit
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
      exam.items=items;exam.session=session;
      if(session.timeLimitMinutes && remainingSeconds(session)===0 && !session.finishedAt)conclude();
    }
    draw();
  }catch(err){
    exam.storageBlocked=true;
    root.innerHTML=section(`<h1>Не вдалося завантажити тренажер</h1><p>${esc(err.message)}</p>
      <p>Запустіть із кореня репозиторію <code>python3 -m http.server 8080</code> і відкрийте <code>http://localhost:8080/app/exam.html</code>.</p>`);
  }
}
boot();
