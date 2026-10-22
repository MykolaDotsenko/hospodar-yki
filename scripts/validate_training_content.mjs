#!/usr/bin/env node
/**
 * HospOdar YKI learning-material integrity checks.
 * No dependencies; validates machine readability, completeness and answer keys.
 * It cannot replace review by a qualified Finnish teacher.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const get=(p)=>JSON.parse(fs.readFileSync(path.join(root,p),"utf8"));
const verify=(condition,message)=>{if(!condition)throw new Error(message);};
const nonempty=(v)=>typeof v==="string"&&v.trim().length>0;
const themesIndex=get("learning/exercises/b1/index.json");
verify(themesIndex.stats.themes===9,"Expected nine official YKI topic categories");
const allIDs = new Set();
const claimID=(id)=>{verify(nonempty(id),"Blank ID");verify(!allIDs.has(id),"Duplicate ID: "+id);allIDs.add(id);};
const verifyQs=(questions,prefix)=>{
 verify(Array.isArray(questions)&&questions.length>=2,"Missing questions: "+prefix);
 for(const q of questions){
  claimID(q.id);
  verify(nonempty(q.prompt_fi)&&nonempty(q.explanation_uk),"Incomplete question: "+q.id);
  verify(q.type==="single_choice","Unsupported objective question type: "+q.id);
  verify(Array.isArray(q.options)&&q.options.length===3&&q.options.every(nonempty),"Invalid choices: "+q.id);
  verify(new Set(q.options).size===3,"Duplicate choices: "+q.id);
  verify(Number.isInteger(q.correct_index)&&q.correct_index>=0&&q.correct_index<q.options.length,"Invalid answer: "+q.id);
 }
};
const c={themes:0,reading:0,listening:0,speaking:0,writing:0,objective_questions:0,chunks:0};
for(const row of themesIndex.themes){
 verify(row.path==="learning/exercises/b1/themes/"+row.id+".json","Unexpected theme path");
 const m=get(row.path);
 claimID(m.id);
 verify(m.id===row.id&&m.level==="B1"&&m.is_official_exam_content===false,"Incorrect theme metadata: "+row.id);
 verify(m.origin==="project_original_generated","No provenance: "+row.id);
 verify(nonempty(m.title_fi)&&nonempty(m.title_uk),"Missing titles: "+row.id);
 verify(nonempty(m.reading.text_fi)&&m.reading.text_fi.length>=220,"Short reading: "+row.id);
 claimID(m.reading.id);
 verifyQs(m.reading.questions,m.reading.id);
 verify(m.listening.audio_status==="script_only_no_recording_yet","Unrecorded audio mislabeled: "+row.id);
 claimID(m.listening.id);
 verify(Array.isArray(m.listening.turns)&&m.listening.turns.length>=5,"Missing listening script: "+row.id);
 for(const turn of m.listening.turns)verify(nonempty(turn.text_fi)&&nonempty(turn.speaker),"Blank listening turn: "+row.id);
 verifyQs(m.listening.questions,m.listening.id);
 verify(Array.isArray(m.speaking)&&m.speaking.length===2,"Missing speaking: "+row.id);
 verify(Array.isArray(m.writing)&&m.writing.length===2,"Missing writing: "+row.id);
 for(const item of [...m.speaking,...m.writing]){
  claimID(item.id);
  verify(nonempty(item.prompt_fi)&&item.required_points_fi.length>=3,"Incomplete open task: "+item.id);
  verify(item.training_timing_only===true,"Training time must not be treated as official: "+item.id);
 }
 verify(Array.isArray(m.chunks)&&m.chunks.length===6,"Missing contextual chunks: "+row.id);
 for(const unit of m.chunks){claimID(unit.id);verify(nonempty(unit.fi)&&nonempty(unit.uk)&&nonempty(unit.example_fi),"Bad chunk: "+unit.id);}
 c.themes++;c.reading++;c.listening++;c.speaking+=2;c.writing+=2;c.chunks+=m.chunks.length;
 c.objective_questions+=m.reading.questions.length+m.listening.questions.length;
}
for(const k of Object.keys(c))verify(themesIndex.stats[k]===c[k],"Index count mismatch: "+k);
const grammar=get("learning/exercises/b1/grammar/contextual-cloze.json");
verify(grammar.count===28&&grammar.exercises.length===28,"Grammar count mismatch");
for(const g of grammar.exercises){
 claimID(g.id);
 verify(g.type==="contextual_cloze"&&nonempty(g.answer_fi)&&nonempty(g.prompt_fi)&&nonempty(g.explanation_uk)&&nonempty(g.transfer_task_fi),"Invalid grammar: "+g.id);
}
const diagnostic=get("learning/exercises/b1/diagnostics/baseline-v1.json");
verify(diagnostic.id==="b1-diagnostic-v1"&&diagnostic.listening.audio_status==="script_only_no_recording_yet"&&diagnostic.listening.scoring_status.startsWith("NOT_VALID"),"Diagnostic listening cannot be scored without audio");
for(const q of [...diagnostic.reading.questions,...diagnostic.listening.questions]){
 claimID(q.id);
 verify(q.options.length===3&&new Set(q.options).size===3&&q.correct_index>=0&&q.correct_index<3&&nonempty(q.explanation_uk),"Invalid diagnostic: "+q.id);
}
for(const t of [...diagnostic.speaking,...diagnostic.writing]){claimID(t.id);verify(nonempty(t.prompt_fi)&&t.required_points_fi.length>=3,"Incomplete diagnostic task: "+t.id);}
const rubric=get("learning/exercises/b1/feedback-rubrics.json");
for(const mod of ["speaking","writing"])verify(rubric[mod].reduce((sum,x)=>sum+x.weight,0)===100,"Rubric sum must equal 100: "+mod);
verify(fs.existsSync(path.join(root,"sources/audio/recording-sources.json")),"Previously imported audio catalog missing");
console.log(JSON.stringify({result:"PASS",themes:c.themes,activities:c.reading+c.listening+c.speaking+c.writing,objective_questions:c.objective_questions,grammar:grammar.count,chunks:c.chunks,diagnostic_tasks:diagnostic.reading.questions.length+diagnostic.listening.questions.length+diagnostic.speaking.length+diagnostic.writing.length},null,2));
