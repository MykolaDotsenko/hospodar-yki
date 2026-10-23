import {newSession,submitStage,visibleStage} from "./real-life-core.mjs";
const root=document.getElementById("reallife-root");
const status=document.getElementById("reallife-status");
const escapeHTML=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const localURL=path=>{
 if(typeof path!=="string"||!path.startsWith("assets/")||path.split("/").includes(".."))throw new Error("Unsafe local media path");
 return new URL("../"+path,import.meta.url).href;
};
const sourceURL=url=>typeof url==="string"&&url.startsWith("https://")?url:"#";
let lessons=[],audioById=new Map(),audioReady=new Map(),photoById=new Map(),svgById=new Map(),selected=0,session=newSession();
async function readJSON(path){
 const response=await fetch(new URL("../"+path,import.meta.url),{cache:"no-cache"});
 if(!response.ok)throw new Error("Не вдалося відкрити "+path+" ("+response.status+")");
 return response.json();
}
function render(){
 const lesson=lessons[selected],view=visibleStage(lesson,session);
 const audio=audioById.get(lesson.audio_id),ready=audioReady.get(lesson.audio_id),photo=photoById.get(lesson.image_id);
 if(!audio||!ready||audio.path!==ready.path||ready.audio_verified!==true||audio.actual_human!==true||!photo||photo.state!=="verified_binary")throw new Error("Відсутній підтверджений медіафайл");
 const src=localURL(audio.path),photoSrc=localURL(photo.path);
 const hint=svgById.get(view.illustration_id);
 const options=lessons.map((x,i)=>'<option value="'+i+'"'+(i===selected?" selected":"")+'>'+escapeHTML(x.level+" · "+x.title_uk)+"</option>").join("");
 let content="";
 if(view.phase==="done"){
  content='<h2>Три кроки виконано — без автоматичної оцінки</h2><p>Ця спроба не нараховує бали й не зберігається після перезавантаження сторінки.</p><h3>Перевірка в новій ситуації</h3><p class="prompt">'+escapeHTML(lesson.delayed_prompt_fi)+'</p><p>Рекомендовані повторення: через 1, 7 і 14 днів. Нагадування поки не налаштовані.</p><button class="btn" type="button" id="restart-lesson">Пройти заново</button>';
 }else{
  const n=view.phase==="attempt"?"1/3 · Перша незалежна спроба":view.phase==="repair"?"2/3 · Самовиправлення":"3/3 · Новий контекст";
  const model=view.models.length?'<h3>Приклади лише після першої відповіді</h3><ul>'+view.models.map(x=>'<li lang="fi">'+escapeHTML(x)+'</li>').join("")+'</ul>':"";
  const diagram=hint?'<img src="'+escapeHTML(localURL(hint.path))+'" alt="'+escapeHTML(hint.alt_uk)+'" loading="lazy" style="width:100%;max-width:740px;height:auto">':"";
  const ukrainian=view.phase==="attempt"?lesson.first_task_uk:view.phase==="transfer"?lesson.transfer_task_uk:"Виправ власну відповідь; приклади вище доступні тільки після першої спроби.";
  content='<p class="eyebrow">'+escapeHTML(n)+'</p><h2 lang="fi">'+escapeHTML(view.prompt)+'</h2><p class="muted">'+escapeHTML(ukrainian)+'</p>'+model+diagram+
   '<form id="stage-form"><label class="field" for="response">Твоя відповідь фінською (можеш також промовити вголос)</label><textarea id="response" name="response" required maxlength="4000" spellcheck="true" lang="fi" autocomplete="off"></textarea><div class="actions"><button type="submit" class="btn">'+(view.phase==="attempt"?"Зберегти першу спробу":view.phase==="repair"?"Перейти до нової ситуації":"Завершити")+'</button></div></form>';
 }
 root.innerHTML='<section class="panel"><label class="field" for="lesson-picker">Місія A1.3–A2.2</label><select id="lesson-picker" style="max-width:100%;padding:10px;margin-bottom:16px">'+options+'</select>'+
 '<h1>'+escapeHTML(lesson.title_uk)+'</h1><p class="muted">Рівень '+escapeHTML(lesson.level)+' · LEARN, не офіційний YKI · Teacher review pending</p>'+
 '<img src="'+escapeHTML(photoSrc)+'" alt="'+escapeHTML(photo.alt_uk)+'" style="display:block;width:100%;max-height:420px;object-fit:contain;margin:12px 0" loading="lazy">'+
 '<p class="caption">Фото: '+escapeHTML(photo.author)+' · '+escapeHTML(photo.license)+' · <a href="'+escapeHTML(sourceURL(photo.source_url))+'" target="_blank" rel="noopener noreferrer">Першоджерело</a></p>'+
 '<div class="prompt small" lang="fi">'+escapeHTML(lesson.listen_fi)+'</div><audio controls preload="metadata" src="'+escapeHTML(src)+'" style="width:100%" aria-label="Запис природної фінської"></audio>'+
 '<p class="caption">Аудіо: '+escapeHTML(audio.author)+' · '+escapeHTML(audio.license)+' · <a href="'+escapeHTML(sourceURL(audio.source_page))+'" target="_blank" rel="noopener noreferrer">Першоджерело</a></p>'+
 '<p class="muted">'+escapeHTML(lesson.audio_relation)+'</p><hr>'+content+
 '<p class="qualification">Відповідь не перевіряється автоматично; перша спроба не перетворюється на SRS-оцінку. Медіа зберігаються локально в репозиторії, але для першого відкриття цього вебпрототипу потрібен HTTP-сервер.</p></section>';
 document.getElementById("lesson-picker").addEventListener("change",event=>{
  selected=Number(event.target.value);session=newSession();status.textContent="Урок змінено. Попередня незбережена відповідь скинута.";render();
 });
 const form=document.getElementById("stage-form");
 if(form)form.addEventListener("submit",event=>{
  event.preventDefault();
  try{session=submitStage(session,form.elements.response.value);status.textContent="Етап зафіксовано лише в пам'яті вкладки. Оцінка не виставляється.";render();}
  catch(err){status.textContent=err.message;}
 });
 const restart=document.getElementById("restart-lesson");
 if(restart)restart.addEventListener("click",()=>{session=newSession();status.textContent="Починаємо нову незалежну спробу.";render();});
}
try{
 const [catalog,audio,availability,pictures,illustrations]=await Promise.all([
  readJSON("learning/exercises/a1/audio-visual/lessons.json"),
  readJSON("assets/audio/library.json"),
  readJSON("assets/audio/available.json"),
  readJSON("assets/images/pictures/available.json"),
  readJSON("assets/images/illustrations/library.json")
 ]);
 lessons=catalog.items;
 if(!Array.isArray(lessons)||lessons.length<5)throw new Error("Немає навчальних місій");
 audioById=new Map(audio.entries.map(x=>[x.id,x]));
 audioReady=new Map(availability.items.map(x=>[x.id,x]));
 photoById=new Map(pictures.assets.map(x=>[x.id,x]));
 svgById=new Map(illustrations.items.map(x=>[x.id,x]));
 render();
}catch(err){
 root.textContent="Не вдалося відкрити вправи: "+err.message+" Перевірте з'єднання й локальний HTTP-сервер.";
}
