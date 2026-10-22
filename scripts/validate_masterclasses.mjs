#!/usr/bin/env node
import fs from "node:fs";
const load=p=>JSON.parse(fs.readFileSync(p,"utf8"));
const data=load("learning/exercises/b1/masterclasses/lessons.json");
const sources=load("sources/learning/10-yki-resources-machine-index.json");
const audio=load("learning/exercises/b1/audio-training/index.json");
const sourceIds=new Set(sources.resources.map(x=>x.id));
const audioIds=new Set(audio.lessons.map(x=>x.id));
const check=(b,m)=>{if(!b)throw new Error(m)};
const seen=new Set();
let acts=0,mc=0,modelCount=0,unseenCount=0,timing=0;
const answerIndices=[0,0,0];
check(data.count===12&&data.total_activities===60&&data.objective_questions===24,"Wrong index totals");
for(const lesson of data.lessons){
 check(!seen.has(lesson.id),"Duplicate "+lesson.id);seen.add(lesson.id);
 check(lesson.not_official_yki&&lesson.teacher_review==="pending","Mislabelled as calibrated");
 check(lesson.audio_lesson_id===null||audioIds.has(lesson.audio_lesson_id),"Unknown audio id");
 check(lesson.source_ids.every(x=>sourceIds.has(x)),"Unknown web inspiration id");
 check(lesson.teaching_input_fi.length>100&&lesson.activities.length===5,"Incomplete input");
 check(lesson.stages.reduce((a,b)=>a+b.minutes,0)===25,"Bad study duration");
 timing+=lesson.duration_min;
 for(const task of lesson.activities){
  acts++;
  if(task.kind==="multiple_choice"){
   mc++;
   check(task.options_fi.length===3&&new Set(task.options_fi).size===3,"Choices invalid");
   check(task.correct_index>=0&&task.correct_index<3&&Number.isInteger(task.correct_index),"Key invalid");
   check(lesson.teaching_input_fi.includes(task.evidence_fi),"Evidence absent: "+lesson.id);
   check(task.reveal_after_attempt===true,"Answer prematurely shown");
   answerIndices[task.correct_index]++;
  } else if(task.kind==="self_correction"){
   check(task.bad_example_fi&&task.corrected_fi&&task.explanation_uk&&task.correct_answer_hidden_until_attempt,"Repair incomplete");
  } else if(task.kind==="productive"){
   modelCount++;
   check(task.prompt_fi&&task.model_fi&&task.model_hidden_until_attempt&&task.feedback_dimensions.length>=3,"Free production incomplete");
  } else if(task.kind==="new_unseen_task"){
   unseenCount++;
   check(task.prompt_fi&&task.automatic_yki_grade===false,"Transfer not independent");
  } else throw new Error("Unknown kind "+task.kind);
 }
}
check(acts===60&&mc===24&&timing===300&&modelCount===12&&unseenCount===12,"Distribution invalid");
check(answerIndices.every(v=>v===8),"MC correct-choice position imbalance");
console.log(JSON.stringify({status:"PASS",lessons:seen.size,activities:acts,mc,models:modelCount,unseen:unseenCount,minutes:timing,answer_positions:answerIndices},null,2));
