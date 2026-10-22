#!/usr/bin/env node
import fs from "node:fs";
const load=p=>JSON.parse(fs.readFileSync(p,"utf8")).items;
const root="learning/exercises/b1/high-yield/";
const [p,s,w,r]=["paraphrase-drills.json","speaking-reaction-bank.json","writing-repair-clinic.json","reading-inference-bank.json"].map(x=>load(root+x));
const ok=(value,msg)=>{if(!value)throw Error(msg)};
const opinion=load(root+"opinion-argumentation-v1.json");
const ids=[...p,...s,...w,...r,...opinion].map(x=>x.id);ok(new Set(ids).size===ids.length,"Duplicate IDs");
ok(p.length===24&&s.length===18&&w.length===6&&r.length===5,"Item count changed");
ok(p.filter(x=>x.correct_index===0).length===12&&p.filter(x=>x.correct_index===1).length===12,"Answer key imbalance");
for(const x of p)ok(x.choices_fi.length===2&&x.choices_fi[0]!==x.choices_fi[1]&&x.source_fi&&x.explanation_uk&&x.transfer_prompt_fi,"Bad paraphrase "+x.id);
for(const x of s)ok(x.stimulus_fi&&x.model_answer_fi&&x.transfer_prompt_fi&&x.model_visibility==="after_first_attempt"&&!x.model_is_official_yki_answer,"Bad speaking "+x.id);
for(const x of w){ok(x.issues.length>=3&&x.required.length>=4&&x.model_fi&&x.transfer_fi&&x.model_visibility==="after_attempt","Bad writing "+x.id);for(const issue of x.issues)ok(x.first_draft_fi.includes(issue.fragment_fi),"Missing fragment "+x.id)}
let total=0;
for(const x of r){ok(x.text_fi.length>500&&x.questions.length===4,"Short reading "+x.id);for(const q of x.questions){total++;ok(x.text_fi.includes(q.evidence_fi)&&q.explanation_uk,"Unverifiable evidence "+q.id);if(q.type==="single_choice")ok(q.options_fi.length===3&&new Set(q.options_fi).size===3&&q.correct_index>=0&&q.correct_index<3,"MC invalid "+q.id);else if(q.type==="true_false")ok(typeof q.answer==="boolean","TF invalid "+q.id);else if(q.type==="open")ok(q.model_answer_fi&&q.scoring.includes("semantic"),"OPEN invalid "+q.id);else throw Error("Wrong q type")}}
ok(opinion.length===18,"Expected 18 opinion tasks");
const themes=new Map();
for(const task of opinion){
  ok(task.question_fi&&task.question_uk&&Array.isArray(task.required_points_fi)&&task.required_points_fi.length===2,"Incomplete opinion "+task.id);
  ok(task.constraint_change_fi&&task.attempt_policy==="independent_first_attempt_then_feedback","Transfer or attempt policy missing "+task.id);
  ok(task.unseen_transfer_required===true&&!task.official_yki_timing,"False exam timing / missing transfer "+task.id);
  ok(task.linguistic_review==="pending_S2_teacher","Unverified prompt labeled teacher reviewed "+task.id);
  ok(task.scaffold_hidden_until_attempt.length>=4,"No scaffold policy "+task.id);
  themes.set(task.theme,(themes.get(task.theme)||0)+1);
}
ok(themes.size===9&&[...themes.values()].every(n=>n===2),"Two arguments per nine topics required");
console.log(JSON.stringify({status:"PASS",paraphrases:p.length,answer_positions:[12,12],speaking:s.length,writing:w.length,reading:r.length,reading_questions:total,opinion_tasks:opinion.length,opinion_themes:themes.size}));
