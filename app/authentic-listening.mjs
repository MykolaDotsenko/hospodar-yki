import {newSession,nextSession,currentTask,sourceUrlForStage,combineVerifiedExternalLessons} from "./authentic-listening-core.mjs";
const root=document.getElementById("authentic-root");
const status=document.getElementById("authentic-status");
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let lessons=[],selected=0,session=newSession();
function label(item){const c=item.reported_components;return c.publisher_reported_count?c.publisher_reported_count+" "+(c.type==="audio"?"заявлених аудіозаписів":c.type==="video"?"заявлених відео":"текстових діалогів"):"Зовнішній "+(c.type==="video"?"відеокурс":c.type==="text"?"текстовий матеріал":"ресурс");}
function render(){
 const item=lessons[selected],task=currentTask(item,session);
 const url=sourceUrlForStage(item,session);
 const options=lessons.map((x,i)=>'<option value="'+i+'"'+(i===selected?' selected':'')+'>'+esc(x.cefr_suggested+" · "+x.title_fi)+'</option>').join("");
 const phase=task.phase==="attempt"?"Крок 1/3 · Самостійна спроба":task.phase==="repair"?"Крок 2/3 · Самоперевірка":task.phase==="transfer"?"Крок 3/3 · Нова ситуація":"Повторення через день";
 const action=task.phase==="attempt"?"Я виконав першу спробу":task.phase==="repair"?"Перейти до нової ситуації":"Завершити вправу";
 const language=task.phase==="repair"?"uk":"fi";
 const form=task.phase==="done"?'<p>Виконано без автоматичної оцінки. За потреби повернися до оригіналу та повтори через 1, 7 і 14 днів самостійно — нагадувань поки немає.</p><button type="button" id="restart" class="btn">Почати знову</button>':
 '<form id="practice-form"><label for="answer" class="field">Твоя відповідь фінською / нотатки до вправи</label><textarea id="answer" name="answer" lang="fi" maxlength="4000" required spellcheck="true"></textarea><div class="actions"><button class="btn" type="submit">'+action+'</button></div></form>';
 root.innerHTML='<section class="panel"><label class="field" for="authentic-lesson">Вибери ситуацію</label><select id="authentic-lesson" style="max-width:100%;padding:10px;margin-bottom:16px">'+options+'</select>'+
 '<h1>'+esc(item.title_fi)+'</h1><p>'+esc(item.cefr_suggested)+' · '+esc(label(item))+' · '+esc(item.material_kind)+'</p>'+
 '<p>Зовнішній матеріал: <strong>'+esc(item.publisher)+'</strong> · '+esc(item.license)+' · '+esc(item.author)+'</p>'+
 '<p><a class="btn" href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+(item.audio_index_url?(task.phase==="attempt"?"Слухати плейлист без відповідей ↗":"Перевірити сторінку матеріалу ↗"):"Відкрити джерело ↗")+'</a></p>'+
 (item.audio_index_url?'<p class="qualification">Спочатку відкривається лише плейлист видавця: знайди запис за назвою завдання. <strong>Сторінка з відповідями стане доступною тільки після твоєї першої спроби.</strong> Наявність окремого треку та його якість тут не перевірені.</p>':'')+(item.source_note_uk?'<p class="muted">'+esc(item.source_note_uk)+'</p>':'')+
 '<p class="qualification">Джерело відкривається тільки на сайті видавця. У матеріалів різний формат: аудіо, відео, PDF або текстові вправи; PDF для аудіювання НЕ підтверджує наявності доступного звукового файлу. Ця сторінка не завантажує, не копіює й не змінює сторонні файли. Неофіційний YKI.</p>'+
 '<hr><p class="eyebrow">'+esc(phase)+'</p><h2 lang="'+language+'">'+esc(task.prompt)+'</h2>'+
 (task.phase!=="attempt"?'<p>Перша незалежна спроба збережена тільки в пам’яті вкладки; зразок відповіді з джерела не показується автоматично.</p>':"")+
 form+'<p class="muted">Teacher review pending. Ваші відповіді не оцінюються і не передаються на сервер.</p></section>';
 document.getElementById("authentic-lesson").addEventListener("change",e=>{selected=Number(e.target.value);session=newSession();status.textContent="Вибрано новий урок; попередню локальну чернетку скинуто.";render();});
 const f=document.getElementById("practice-form");
 if(f)f.addEventListener("submit",e=>{e.preventDefault();try{session=nextSession(session,f.elements.answer.value);status.textContent="Етап виконано без оцінювання. Відповідь збережено лише до перезавантаження вкладки.";render();}catch(err){status.textContent=err.message;}});
 const btn=document.getElementById("restart");if(btn)btn.addEventListener("click",()=>{session=newSession();status.textContent="Починаємо заново.";render();});
}
try{
 async function load(path){
  const response=await fetch(new URL("../"+path,import.meta.url),{cache:"no-cache"});
  if(!response.ok)throw new Error("Каталог недоступний: "+path+" ("+response.status+")");
  return response.json();
 }
 const [oldCatalog,newCatalog,ophCatalog,openS2Catalog]=await Promise.all([
  load("sources/audio/authentic-dialogues-2026-10.json"),
  load("sources/learning/practical-s2-resources-2026-10.json"),
  load("sources/audio/oph-adult-spoken-finnish-2026-10.json"),
  load("sources/learning/a2-b1-verified-source-missions-2026-10.json")
 ]);
 lessons=combineVerifiedExternalLessons(oldCatalog.items,newCatalog.items,ophCatalog.items,openS2Catalog.items);
 render();
}catch(error){
 status.textContent="Неможливо відкрити зовнішній каталог: "+error.message;
 root.innerHTML='<section class="panel"><h1>Не вдалося завантажити вправи</h1><p>Запустіть застосунок через HTTP-сервер з кореня репозиторію. Жодних відповідей не було надіслано.</p></section>';
}
