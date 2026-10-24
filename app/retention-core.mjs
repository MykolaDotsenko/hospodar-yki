/** Pure delayed independent Finnish transfer prompts. Separate from SRS and EXAM. */
export const TRANSFER_DAYS = Object.freeze([7,14,30]);
const idValid = value => typeof value === "string" && /^[a-z\d_-]{1,100}$/i.test(value);
const calendarDay = date => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) throw new Error("Invalid date");
  const p = value => String(value).padStart(2,"0");
  return date.getFullYear()+"-"+p(date.getMonth()+1)+"-"+p(date.getDate());
};
const ordinalDay = value => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y,m,d] = value.split("-").map(Number);
  const t=Date.UTC(y,m-1,d);
  const check=new Date(t);
  if (check.getUTCFullYear()!==y||check.getUTCMonth()!==m-1||check.getUTCDate()!==d) return null;
  return Math.floor(t/86400000);
};
const completedDate = entry => {
  if (typeof entry?.completedAt !== "string") return null;
  const date = new Date(entry.completedAt);
  return Number.isNaN(date.getTime()) ? null : calendarDay(date);
};
export function delayedTransferQueue(state, bank, now = new Date()) {
  const today=ordinalDay(calendarDay(now));
  if (!bank || !Array.isArray(bank.items)) throw new Error("Invalid transfer bank");
  return bank.items.flatMap(item => {
    if (!idValid(item.task_id) || !Array.isArray(item.checkpoints) ||
        item.checkpoints.length!==TRANSFER_DAYS.length ||
        !item.checkpoints.every((c,i)=>c.day===TRANSFER_DAYS[i]&&typeof c.prompt_fi==="string"&&c.prompt_fi.trim())) {
      throw new Error("Invalid transfer item");
    }
    const attempts=(state.attempts||[]).filter(a=>a.taskId===item.task_id && a.skill==="grammar")
      .map(a=>completedDate(a)).filter(Boolean).sort();
    if (!attempts.length) return [];
    const start=ordinalDay(attempts[0]);
    if (start===null || today<start) return [];
    const age=today-start;
    const reached=item.checkpoints.filter(c=>c.day<=age);
    const lastReached=reached[reached.length-1];
    const records=(state.retention||[]).filter(x=>x.taskId===item.task_id &&
      x.status==="ungraded" && x.independent===true &&
      TRANSFER_DAYS.includes(x.day));
    const completed=records.map(x=>x.day);
    return [{
      taskId:item.task_id,grammarTag:item.grammar_tag,ageDays:age,
      firstMissionDate:attempts[0],
      due:lastReached && !completed.includes(lastReached.day) &&
        !completed.some(day=>day>lastReached.day) ? {
        taskId:item.task_id,day:lastReached.day,prompt_fi:lastReached.prompt_fi,
        grammarTag:item.grammar_tag
      } : null,
      completed:TRANSFER_DAYS.filter(day=>completed.includes(day)),
      missed:TRANSFER_DAYS.filter(day=>day<=(lastReached?.day||0)&&
        day!==lastReached?.day&&!completed.includes(day)),
      nextDay:TRANSFER_DAYS.find(day=>day>age)??null
    }];
  });
}
export function recordDelayedTransfer(state, bank, {taskId,day,response}={}, now=new Date()) {
  if (!idValid(taskId) || !TRANSFER_DAYS.includes(day) ||
      typeof response!=="string" || !response.trim() || response.trim().length>1600) {
    throw new Error("Invalid independent response");
  }
  const checkpoint=delayedTransferQueue(state,bank,now).find(x=>x.taskId===taskId);
  const eligible=checkpoint?.due;
  if (!eligible || eligible.day!==day) throw new Error("Transfer not due or already submitted");
  const next=structuredClone(state);
  next.retention=[...(next.retention||[]),{
    taskId,day,response:response.trim(),status:"ungraded",independent:true,
    promptVersion:bank.schema_version,actualAgeDays:checkpoint.ageDays,
    lateByDays:checkpoint.ageDays-day,submittedAt:now.toISOString()
  }].slice(-120);
  return next;
}
