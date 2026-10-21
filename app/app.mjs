import {
  STORAGE_KEY, blankState, readState, checkCloze, dueCards, localDate,
  completeMission, addDiagnostic, skillSummary
} from "./core.mjs";

const root = document.getElementById("main");
const notice = document.getElementById("notice");
const nav = document.getElementById("navigation");
const h = value => String(value ?? "").replace(/[&<>"']/g, c =>
  ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const dataURL = path => new URL("../" + path, import.meta.url).href;
const info = msg => { notice.textContent = msg || ""; };
const btn = (label, act, cls="secondary") =>
  `<button type="button" class="btn ${cls}" data-action="${h(act)}">${h(label)}</button>`;
const note = `<p class="qualification">Незалежні навчальні завдання, не офіційний YKI. Рівень і природність фінської ще потребують S2-рецензування; лише відкриті/структуровані відповіді з ключем можуть бути автоматично перевірені.</p>`;
const lessonLabel = {reading:"Читання",listening:"Аудіювання",writing:"Письмо",speaking:"Говоріння"};
const app = {view:"mission", sources:null, mission:null, diag:{index:0,played:false},
  audio:{pick:0,played:false,answer:null}, sim:{index:0,answers:[],played:false,finished:false},
  state:blankState(), volatile:false, voiceURL:null, recorded:false, recorder:null, stream:null};

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(app.state)); }
  catch { app.volatile = true; info("Збереження браузера недоступне. Дані діятимуть лише до закриття сторінки; скористайтеся експортом."); }
}
function useState() {
  try {
    const {state, recovered} = readState(localStorage.getItem(STORAGE_KEY));
    app.state = state;
    if (recovered) info("Локальний прогрес пошкоджений або застарілої версії — відкрито чистий профіль.");
  } catch {
    app.state = blankState();
    app.volatile = true;
    info("Браузер блокує локальне сховище. Прогрес не збережеться після закриття.");
  }
}
function panel(body) { return `<section class="panel">${body}</section>`; }
function form(buttonLabel, body, name) {
  return `<form data-form="${h(name)}">${body}<div class="actions"><button type="submit" class="btn">${h(buttonLabel)}</button></div></form>`;
}
function choices(values, name="choice") {
  return values.map((v,i) => `<label class="radio"><input type="radio" name="${h(name)}" value="${i}" required> ${h(v)}</label>`).join("");
}
function panelTitle(overline, title, subtitle="") {
  return `<p class="eyebrow">${h(overline)}</p><h1>${h(title)}</h1>${subtitle ? `<p class="muted">${h(subtitle)}</p>` : ""}`;
}
function datePill(date) { return `<span class="pill">${h(date)}</span>`; }
function missionSelection() {
  const exercises = app.sources.grammar.exercises;
  const due = dueCards(app.state).find(e => exercises.some(t => t.id === e.id));
  const selected = (due && exercises.find(t => t.id === due.id)) ||
    exercises.find(t => !app.state.attempts.some(a => a.taskId === t.id)) ||
    exercises[0];
  return {task:selected, phase:"answer", firstAnswer:"", firstCorrect:null,
    secondAnswer:"", repairCorrect:null};
}
function ensureMission() { if (!app.mission) app.mission = missionSelection(); }

function missionThresholdRoute(phase) {
  const labels = ["Спроба", "Перевірка", "Контекст", "Збережено"];
  const stepIndex = ({answer:0, repair:1, feedback:1, transfer:2, done:3})[phase] ?? 0;
  return '<ol class="threshold-route" aria-label="Кроки місії">' +
    labels.map((label, i) => {
      const status = i < stepIndex ? "completed" : i === stepIndex ? "current" : "upcoming";
      const accessible = label + (status === "completed" ? " — пройдено" : status === "current" ? " — зараз" : " — попереду");
      return '<li class="threshold-segment ' + status + '" aria-label="' + accessible + '"' +
        (status === "current" ? ' aria-current="step"' : '') + '>' +
        '<span class="threshold-index" aria-hidden="true">' + String(i+1).padStart(2,"0") + '</span>' +
        '<span class="threshold-label">' + label + '</span></li>';
    }).join("") + '</ol>';
}

function renderMission() {
  ensureMission();
  const m = app.mission, t = m.task;
  const overview = panelTitle("20-хвилинна місія · граматика", "Скажи правильно у справжній ситуації",
    "Спроба без підказки → самовиправлення → новий контекст → повторення");
  const progress = missionThresholdRoute(m.phase);
  const instruction = `<div class="prompt" lang="fi">${h(t.prompt_fi)}</div><span class="pill">${h(t.grammar_tag || "kielioppi")}</span>`;
  if(m.phase === "answer") return panel(overview+progress+
    "<p>Впиши пропущене слово. Перевірка першої самостійної спроби впливає на дату повторення.</p>"+
    instruction+form("Перевірити",`<label class="field" for="mission-answer">Твоя відповідь фінською</label><input class="answer" id="mission-answer" name="answer" autocomplete="off" lang="fi" required maxlength="160" autofocus>`,"mission-answer")+note);
  if(m.phase === "repair") return panel(overview+progress+instruction+
    `<div class="feedback warn"><strong>Спробуй виправити самостійно.</strong><p>Перша відповідь: <span lang="fi">${h(m.firstAnswer)}</span>. Перевір керування й потрібний відмінок. Правильну форму ще приховано.</p></div>`+
    form("Перевірити другу спробу",`<label class="field" for="repair-answer">Виправлена відповідь</label><input class="answer" id="repair-answer" name="answer" lang="fi" autocomplete="off" required maxlength="160">`,"mission-repair")+note);
  if(m.phase === "feedback") return panel(overview+progress+instruction+
    `<div class="feedback ${m.firstCorrect ? "" : m.repairCorrect ? "warn" : "error"}">
      <strong>${m.firstCorrect ? "Правильно з першої спроби!" : m.repairCorrect ? "Самовиправлення вдалося." : "Перевір еталон і пояснення."}</strong>
      <p>Правильна форма: <strong lang="fi">${h(t.answer_fi)}</strong></p>
      <p>${h(t.explanation_uk)}</p>
      <p class="muted">Для повторення враховується лише перша незалежна спроба, а не підказана.</p>
    </div><div class="actions">${btn("Наступне: новий контекст","transfer","")}</div>`+note);
  if(m.phase === "transfer") return panel(overview+progress+
    `<p>Тепер створіть <strong>свою нову відповідь</strong> без готового зразка. Це не автоматичний тест на граматичну правильність.</p><div class="prompt" lang="fi">${h(t.transfer_task_fi)}</div>`+
    form("Завершити та зберегти",`<label class="field" for="transfer-text">Власне речення або коротка відповідь фінською</label><textarea id="transfer-text" name="transfer" lang="fi" required maxlength="1600" placeholder="Kirjoita tähän…"></textarea>`,"mission-transfer")+note);
  const card = app.state.cards[t.id];
  return panel(panelTitle("Місію завершено", "Навчальний цикл збережено")+
    `<div class="feedback"><strong>✓ Виконано</strong><p>Перша незалежна спроба: ${m.firstCorrect ? "правильна" : "була помилка; це зафіксовано"}. Перенесення в нову ситуацію: подано (без автоматичної оцінки).</p>
    <p>Наступне повторення: <strong>${h(card?.due || "не заплановано")}</strong></p></div>`+
    `<div class="actions">${btn("Наступна місія","next-mission","")}${btn("Переглянути прогрес","to-progress","secondary")}</div>`+note);
}

function renderDiagnostic() {
  const d=app.sources.baseline, i=app.diag.index;
  if(i >= 4) {
    const summary=skillSummary(app.state);
    return panel(panelTitle("Діагностика", "Чотири навички перевірено")+
      `<p>Читання і прослуховування: перевірені об'єктивні відповіді; письмо й говоріння: <strong>подано без автоматичного бала</strong>. Одного питання на навичку недостатньо для встановлення CEFR рівня.</p>`+
      Object.entries(summary).map(([k,s])=>`<div class="rowline"><strong>${lessonLabel[k]}</strong><span>${s.scored ? `${s.correct}/${s.scored} структурованих` : "${s.ungraded} без оцінки"}</span></div>`).join("")+
      `<div class="actions">${btn("Пройти нову пробу","diag-restart")}${btn("Прогрес","to-progress","secondary")}</div>`+note);
  }
  const skill=["reading","listening","writing","speaking"][i];
  let body=panelTitle(`Первинна діагностика · ${i+1}/4`,lessonLabel[skill],
    "Одна коротка проба на навичку; результат не є CEFR/YKI-рівнем");
  body+=`<div class="steps">${[0,1,2,3].map(j=>`<span class="step ${j<=i?"done":""}"></span>`).join("")}</div>`;
  if(skill==="reading") {
    const q=d.reading.questions[0];
    body+=`<h2 lang="fi">${h(d.reading.title_fi)}</h2><div class="prompt small" lang="fi">${h(d.reading.text_fi)}</div><p lang="fi"><strong>${h(q.prompt_fi)}</strong></p>`;
    body+=form("Зберегти відповідь",choices(q.options),"diag-reading");
  } else if(skill==="listening") {
    const l=app.sources.long.lessons[0],q=l.questions[0];
    body+=`<p><span class="pill">Синтетичний Piper Harri · ${h(l.duration_seconds)} с</span> Реальний аудіофайл, не script-only.</p>
      <h2 lang="fi">${h(l.title_fi)}</h2><audio id="diag-audio" controls preload="none" src="${h(dataURL(l.path))}"></audio>
      <p class="muted">Спершу прослухай запис. Текст і ключ приховані до відповіді.</p><p lang="fi"><strong>${h(q.prompt_fi)}</strong></p>`;
    body+=form("Зберегти відповідь",choices(q.options_fi),"diag-listening");
    body+=`<div class="actions">${btn("Пропустити без оцінки","diag-skip","quiet")}</div>`;
  } else if(skill==="writing") {
    const t=d.writing[0];
    body+=`<div class="prompt" lang="fi">${h(t.prompt_fi)}</div><p>Перевір себе: ${t.required_points_fi.map(h).join(" · ")}. Перевірка письма викладачем ще не підключена.</p>`;
    body+=form("Зберегти як неперевірену відповідь",`<label class="field" for="diag-text">Твій текст фінською</label><textarea id="diag-text" lang="fi" name="response" required minlength="20" maxlength="1600"></textarea>`,"diag-writing");
  } else {
    const t=d.speaking[0];
    body+=`<div class="prompt" lang="fi">${h(t.prompt_fi)}</div><p>Завдання: ${t.required_points_fi.map(h).join(" · ")}. Мікрофон — лише за дозволом, запис тимчасовий. Вимова автоматично не оцінюється.</p>`;
    body+=voiceUI();
    body+=form("Зберегти як неперевірене говоріння",`<label class="field" for="diag-spoken">За відсутності мікрофона запиши тут свій усний план або відповідь</label><textarea id="diag-spoken" lang="fi" name="response" maxlength="1600" placeholder="Можна залишити порожнім, якщо зроблено голосовий запис"></textarea>`,"diag-speaking");
  }
  return panel(body+note);
}
function voiceUI(){
  return `<div class="actions">${btn(app.recorder?.state==="recording"?"Зупинити запис":"Записати мій голос",app.recorder?.state==="recording"?"voice-stop":"voice-start","secondary")}</div>${app.voiceURL?`<audio controls src="${h(app.voiceURL)}"></audio><p class="muted">Запис можна відтворити лише в цій сесії. Він не зберігається на сервері чи в localStorage.</p>`:""}`;
}
function renderAudio() {
  const long=app.sources.long.lessons[0];
  const story=app.sources.human.items[0];
  if(app.audio.pick===1) return panel(panelTitle("Практика сприйняття", "Людський голос · літературна фінська")+
    `<p>Додатковий запис живого диктора з історичної казки. <strong>Це не сучасний багатоголосий діалог YKI.</strong></p><audio controls preload="none" src="${h(dataURL(story.audio_path))}"></audio>
      <p>Послухай головну думку й спробуй переказати своїми словами. Без автоматичного оцінювання.</p>
      <div class="actions">${btn("Сучасний B1-трек (TTS)","audio-synthetic")}</div>`+note);
  const q=long.questions[0];
  let body=panelTitle("Тренування аудіювання",long.title_fi,"2:23 · побутова історія B1 (попередньо оцінена складність)");
  body+=`<p><span class="pill">Один синтетичний диктор</span> Транскрипт не показується до першої відповіді.</p><audio controls preload="none" id="practice-audio" src="${h(dataURL(long.path))}"></audio>`;
  if(app.audio.answer===null) {
    body+=`<p lang="fi"><strong>${h(q.prompt_fi)}</strong></p>`;
    body+=form("Перевірити після прослуховування",choices(q.options_fi),"audio-answer");
  } else {
    const correct=app.audio.answer===q.correct_index;
    body+=`<div class="feedback ${correct?"":"warn"}"><strong>${correct?"Правильна відповідь":"Спробуй пояснити, що почув"}</strong><p>${h(q.why_uk)}</p></div>
      <details><summary>Транскрипт після відповіді</summary><pre lang="fi">${h(long.segments_fi.join("\n\n"))}</pre></details>`;
  }
  body+=`<div class="actions">${btn("Інший живий голос (архів)","audio-human","secondary")}${btn("Почати заново","audio-reset","quiet")}</div>`;
  return panel(body+note);
}
function simTasks(){
  const reading=app.sources.reading.items[1]||app.sources.reading.items[0],
    listening=app.sources.long.lessons[1]||app.sources.long.lessons[0];
  return [
    {skill:"reading",id:reading.questions[0].id,title:reading.title_fi,
      text:reading.text_fi,q:reading.questions[0],opts:reading.questions[0].options_fi,
      correct:reading.questions[0].correct_index},
    {skill:"listening",id:listening.questions[0].id,title:listening.title_fi,
      path:listening.path,q:listening.questions[0],opts:listening.questions[0].options_fi,
      correct:listening.questions[0].correct_index},
    {skill:"writing",id:app.sources.baseline.writing[1].id,
      prompt:app.sources.baseline.writing[1].prompt_fi},
    {skill:"speaking",id:app.sources.baseline.speaking[1].id,
      prompt:app.sources.baseline.speaking[1].prompt_fi}
  ];
}
function renderSim() {
  const s=app.sim,tasks=simTasks();
  if(s.finished) {
    const objective=s.answers.filter(x=>x.status==="scored"),
      right=objective.filter(x=>x.correct).length;
    return panel(panelTitle("Незалежна репетиція завершена","Результати тренування")+
      `<div class="kpi-grid"><div class="kpi"><strong>${right}/${objective.length}</strong><span>Структуровані відповіді</span></div><div class="kpi"><strong>2</strong><span>Продуктивні навички без AI-оцінки</span></div></div>
      <p>Це невелика демонстрація комп'ютерної навігації, а <strong>не</strong> копія офіційного YKI. Час, можливі повтори та кількість завдань не задані як норми OPH.</p>
      <div class="actions">${btn("Повторити репетицію","sim-reset")}${btn("Прогрес","to-progress","secondary")}</div>`+note);
  }
  const t=tasks[s.index];
  let body=panelTitle(`Digitesti — тренувальна репетиція ${s.index+1}/4`,lessonLabel[t.skill],
    "Без підказок і фідбеку до завершення всіх чотирьох навичок");
  body+=`<div class="steps">${tasks.map((_,i)=>`<span class="step ${i<=s.index?"done":""}"></span>`).join("")}</div>`;
  if(t.text) body+=`<h2 lang="fi">${h(t.title)}</h2><div class="prompt small" lang="fi">${h(t.text)}</div>`;
  if(t.path) body+=`<h2 lang="fi">${h(t.title)}</h2><audio controls id="sim-audio" preload="none" src="${h(dataURL(t.path))}"></audio><p class="muted">Аудіо синтетичне; текст приховано.</p>`;
  if(t.opts) {
    body+=`<p lang="fi"><strong>${h(t.q.prompt_fi)}</strong></p>`;
    body+=form("Наступна навичка",choices(t.opts),"sim-step");
  } else {
    body+=`<div class="prompt" lang="fi">${h(t.prompt)}</div>`;
    if(t.skill==="speaking") body+=voiceUI();
    body+=form(s.index===3?"Завершити репетицію":"Наступна навичка",
      `<label class="field" for="sim-response">Відповідь ${t.skill==="speaking"?"(або використовуй запис мікрофона)":""}</label>
      <textarea id="sim-response" name="response" lang="fi" maxlength="1600" ${t.skill==="writing"?'required minlength="20"':""}></textarea>`,"sim-step");
  }
  return panel(body+note);
}
function renderProgress() {
  const s=app.state,summary=skillSummary(s), due=dueCards(s);
  const attempts=s.attempts.length, successes=s.attempts.filter(a=>a.firstCorrect).length;
  return panel(panelTitle("Твій прогрес","Тільки підтверджені дії","Дані на цьому пристрої; не офіційна оцінка YKI")+
    `<div class="kpi-grid"><div class="kpi"><strong>${attempts}</strong><span>Завершені місії</span></div>
      <div class="kpi"><strong>${successes}</strong><span>Правильні перші спроби</span></div>
      <div class="kpi"><strong>${due.length}</strong><span>Повторити зараз</span></div>
      <div class="kpi"><strong>${s.errors.length}</strong><span>Виявлені помилки</span></div></div>
    <h2>Чотири навички</h2>${Object.entries(summary).map(([k,x])=>
      `<div class="rowline"><strong>${lessonLabel[k]}</strong><span>${x.scored} перевірено (${x.correct} правильно), ${x.ungraded} без оцінки</span></div>`).join("")}
    <h2 style="margin-top:22px">Повторення</h2>${due.length ? due.slice(0,10).map(x=>
      `<div class="rowline"><span>${h(x.id)}</span><strong>${h(x.due)}</strong></div>`).join("") :
      `<p class="muted">Наразі немає прострочених карток. Наступні дати появляться після місії.</p>`}
    <h2 style="margin-top:22px">Останні помилки</h2>${s.errors.length?s.errors.slice(-8).reverse().map(e=>
      `<div class="rowline"><span>${h(e.grammarTag || e.taskId)}</span><small>${h(e.at.slice(0,10))}</small></div>`).join(""):"<p class='muted'>Поки немає зафіксованих помилок.</p>"}
    <div class="actions">${btn("Експорт JSON","export","secondary")}${btn("Видалити весь локальний прогрес","erase","danger")}</div>
    <p class="qualification">Увага: localStorage доступний лише в конкретному браузері/профілі. Експорт містить ваші письмові відповіді. Не публікуйте його в GitHub. Для персонального використання на чужому пристрої видаліть дані.</p>`);
}
function render() {
  nav.querySelectorAll("[data-view]").forEach(b=>{
    b.classList.toggle("active",b.dataset.view===app.view);
    if(b.dataset.view===app.view) b.setAttribute("aria-current","page");
    else b.removeAttribute("aria-current");
  });
  if(!app.sources) return;
  root.innerHTML = app.view==="mission"?renderMission():
    app.view==="diagnostic"?renderDiagnostic():
    app.view==="audio"?renderAudio():
    app.view==="sim"?renderSim():renderProgress();
}
function setView(view) { if(!["mission","diagnostic","audio","sim","progress"].includes(view)) return;
  if(app.recorder?.state==="recording") app.recorder.stop();
  app.view=view; render(); root.focus({preventScroll:true});
}
async function startRecording() {
  if(!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder==="undefined") {
    info("Запис мікрофона в цьому браузері недоступний. Використайте текстовий fallback.");return;
  }
  try{
    const stream=await navigator.mediaDevices.getUserMedia({audio:true});
    app.stream=stream;
    const recorder=new MediaRecorder(stream),chunks=[];
    app.recorder=recorder;
    recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
    recorder.onstop=()=>{
      stream.getTracks().forEach(track=>track.stop());
      if(app.voiceURL) URL.revokeObjectURL(app.voiceURL);
      app.voiceURL=chunks.length?URL.createObjectURL(new Blob(chunks,{type:recorder.mimeType||"audio/webm"})):null;
      app.recorded=Boolean(app.voiceURL);app.recorder=null;app.stream=null;render();
    };
    recorder.start();render();info("Запис іде локально. Натисніть «Зупинити запис», щоб прослухати.");
  }catch(e){info("Доступ до мікрофона не надано або запис не підтримується. Текстова альтернатива залишається доступною.");}
}
function voiceReset() {
  if(app.recorder?.state==="recording") app.recorder.stop();
  if(app.stream) app.stream.getTracks().forEach(t=>t.stop());
  if(app.voiceURL){URL.revokeObjectURL(app.voiceURL);app.voiceURL=null;}
  app.recorded=false;
}
function exportState(){
  const json=JSON.stringify(app.state,null,2);
  const url=URL.createObjectURL(new Blob([json],{type:"application/json;charset=utf-8"}));
  const a=document.createElement("a");a.href=url;a.download="hospodar-yki-progress-"+localDate()+".json";a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function eraseState() {
  if(!confirm("Назавжди видалити всі локальні відповіді, помилки та прогрес у цьому браузері?"))return;
  app.state=blankState();
  try{localStorage.removeItem(STORAGE_KEY)}catch{app.volatile=true}
  app.mission=null;app.diag={index:0,played:false};app.sim={index:0,answers:[],played:false,finished:false};
  render();info("Увесь локальний прогрес очищено.");
}
function handleMission(form,fields) {
  const m=app.mission,t=m.task;
  if(form==="mission-answer"){
    const v=String(fields.get("answer")||"").trim(); const result=checkCloze(t,v);
    if(!result.valid) return info("Потрібна відповідь.");
    m.firstAnswer=v;m.firstCorrect=result.correct;
    m.phase=result.correct?"feedback":"repair";
  } else if(form==="mission-repair"){
    const v=String(fields.get("answer")||"").trim();if(!v)return;
    m.secondAnswer=v;m.repairCorrect=checkCloze(t,v).correct;m.phase="feedback";
  } else if(form==="mission-transfer"){
    const transferText=String(fields.get("transfer")||"").trim();
    if(!transferText)return info("Напишіть нове речення перед завершенням.");
    app.state=completeMission(app.state,{taskId:t.id,grammarTag:t.grammar_tag,
      firstAnswer:m.firstAnswer,firstCorrect:m.firstCorrect,
      secondAnswer:m.secondAnswer,repairCorrect:m.repairCorrect,transferText});
    save();m.phase="done";
    info("Місію завершено. Результат збережено локально.");
  }render();
}
function handleDiagnostic(form,fields) {
  const i=app.diag.index,d=app.sources.baseline;
  if(form==="diag-reading" || form==="diag-listening"){
    if(form==="diag-listening"&&!app.diag.played){info("Спершу прослухай аудіо або пропусти цю пробу.");return;}
    const t=form==="diag-reading"?d.reading.questions[0]:app.sources.long.lessons[0].questions[0];
    const choice=Number(fields.get("choice"));
    if(fields.get("choice")===null)return;
    app.state=addDiagnostic(app.state,{skill:form==="diag-reading"?"reading":"listening",
      taskId:t.id,correct:choice===t.correct_index,status:"scored",response:String(choice)});
  } else {
    const skill=form==="diag-writing"?"writing":"speaking";
    const t=d[skill][0],response=String(fields.get("response")||"").trim();
    if(skill==="speaking"&&!response&&!app.recorded){info("Запишіть голос або текстовий план, щоб підтвердити виконання.");return;}
    if(skill==="writing"&&response.length<20){info("Для письма потрібно щонайменше 20 символів.");return;}
    app.state=addDiagnostic(app.state,{skill,taskId:t.id,status:"ungraded",
      response:response||(app.recorded?"Voice recorded this session (not retained)":"")});
    voiceReset();
  }
  save();app.diag.index++;app.diag.played=false;render();info("Результат навички збережено без вигаданої оцінки CEFR.");
}
function handleSim(fields){
  const t=simTasks()[app.sim.index],response=String(fields.get(t.opts?"choice":"response")||"").trim();
  if(t.skill==="listening"&&!app.sim.played){info("Спершу прослухай аудіо.");return;}
  if(!response&&!app.recorded){info("Введіть відповідь або запишіть голос.");return;}
  const status=t.opts?"scored":"ungraded";
  app.sim.answers.push({skill:t.skill,taskId:t.id,status,
    ...(status==="scored"?{correct:Number(response)===t.correct}:{response:response||(app.recorded?"Voice recorded (not retained)":"")})});
  voiceReset();app.sim.index++;app.sim.played=false;
  if(app.sim.index===4){
    for(const result of app.sim.answers)app.state=addDiagnostic(app.state,result);
    save();app.sim.finished=true;
  }
  render(); if(app.sim.finished)info("Репетицію завершено. Структуровані відповіді перевірено; письмо і говоріння без автоматичного бала.");
}
root.addEventListener("submit",e=>{
  const form=e.target.closest("form[data-form]");if(!form)return;e.preventDefault();info("");
  const fields=new FormData(form);
  try{
    if(form.dataset.form.startsWith("mission-"))handleMission(form.dataset.form,fields);
    else if(form.dataset.form.startsWith("diag-"))handleDiagnostic(form.dataset.form,fields);
    else if(form.dataset.form==="audio-answer"){
      if(!app.audio.played){info("Спочатку прослухайте фрагмент.");return;}
      app.audio.answer=Number(fields.get("choice"));render();
    }else if(form.dataset.form==="sim-step")handleSim(fields);
  }catch(error){info("Не вдалося завершити дію: "+String(error.message||error));}
});
root.addEventListener("play",e=>{
  if(e.target.tagName!=="AUDIO")return;
  if(e.target.id==="diag-audio")app.diag.played=true;
  if(e.target.id==="practice-audio")app.audio.played=true;
  if(e.target.id==="sim-audio")app.sim.played=true;
},true);
document.addEventListener("click",e=>{
  const b=e.target.closest("button[data-action],button[data-view]");
  if(!b)return;
  if(b.dataset.view) {setView(b.dataset.view);return;}
  switch(b.dataset.action){
    case "transfer":app.mission.phase="transfer";break;
    case "next-mission":app.mission=null;break;
    case "to-progress":setView("progress");return;
    case "diag-restart":app.diag={index:0,played:false};break;
    case "diag-skip":app.diag.index++;app.diag.played=false;info("Аудіопробу пропущено без оцінки.");break;
    case "audio-human":app.audio.pick=1;break;
    case "audio-synthetic":app.audio.pick=0;break;
    case "audio-reset":app.audio={pick:0,played:false,answer:null};break;
    case "sim-reset":app.sim={index:0,answers:[],played:false,finished:false};break;
    case "voice-start":startRecording();return;
    case "voice-stop":if(app.recorder?.state==="recording")app.recorder.stop();return;
    case "export":exportState();return;
    case "erase":eraseState();return;
    default:return;
  }
  render();
});
async function init(){
  useState();
  const sources=[
    "content/b1/grammar/contextual-cloze.json",
    "content/b1/diagnostics/baseline-v1.json",
    "content/b1/audio-long/lessons.json",
    "content/b1/audio-long/human-stories.json",
    "content/b1/contextual/reading-pack-v1.json"
  ];
  try{
    const values=await Promise.all(sources.map(async path=>{
      const r=await fetch(dataURL(path),{cache:"no-cache"});
      if(!r.ok)throw new Error(`${path}: HTTP ${r.status}`);
      return r.json();
    }));
    const [grammar,baseline,long,human,reading]=values;
    if(!Array.isArray(grammar.exercises)||!grammar.exercises.length ||
       !Array.isArray(long.lessons)||!long.lessons.length||
       !Array.isArray(reading.items)||reading.items.length<2||
       !Array.isArray(human.items)||!human.items.length)throw new Error("Incomplete learning content");
    app.sources={grammar,baseline,long,human,reading};render();
  }catch(e){
    root.innerHTML=panel(panelTitle("Помилка завантаження","Не вдалося відкрити контент")+
      `<p>Запустіть HTTP-сервер із кореня репозиторію: <code>python3 -m http.server 8080</code> і перейдіть на <code>http://localhost:8080/app/</code>.</p><p class="muted">${h(e.message)}</p>`);
  }
}
window.addEventListener("beforeunload",voiceReset);
init();
