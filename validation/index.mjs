// Source-independent calendar comparison. No model, calendar, file or network I/O.
const DAY = 86400000, MINUTE = 60000;
const MODES = ['printed-date', 'conditional-isha-after-maghrib'];
const owns = (o, k) => Object.hasOwn(o, k);
function record(value, required, optional = [], label = 'record') {
  if (!value || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) throw new TypeError(`${label}: plain own-data record required`);
  const ds = Object.getOwnPropertyDescriptors(value), keys = Reflect.ownKeys(ds);
  if (keys.some(k => typeof k !== 'string' || ![...required, ...optional].includes(k) || !owns(ds[k], 'value') || !ds[k].enumerable)
      || required.some(k => !owns(ds, k))) throw new TypeError(`${label}: missing, unknown or accessor field`);
}
function eventRecord(value, label) {
  if (!value || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) throw new TypeError(`${label}: plain event record required`);
  const ds = Object.getOwnPropertyDescriptors(value);
  for (const key of Reflect.ownKeys(ds)) {
    name(key); if (!owns(ds[key], 'value') || !ds[key].enumerable) throw new TypeError(`${label}: own data events required`);
  }
}
function array(value, label) {
  if (!Array.isArray(value) || Object.getPrototypeOf(value)!==Array.prototype) throw new TypeError(`${label}: plain array required`);
  const ds=Object.getOwnPropertyDescriptors(value),keys=Reflect.ownKeys(ds);
  if(keys.length!==value.length+1 || !owns(ds,'length') || Array.from({length:value.length},(_,i)=>ds[i]).some(d=>!d||!owns(d,'value')||!d.enumerable)) throw new TypeError(`${label}: dense own-data array required`);
}
function name(value) {
  if (typeof value !== 'string' || !/^[A-Za-z][A-Za-z0-9_-]{0,79}$/.test(value)) throw new TypeError('Invalid case or field name');
}
function dateEpoch(value) {
  if (typeof value !== 'string' || !/^20\d\d-\d\d-\d\d$/.test(value)) throw new RangeError('Gregorian date in2000–2099 required');
  const epoch = Date.parse(`${value}T00:00:00Z`);
  if (!Number.isFinite(epoch) || new Date(epoch).toISOString().slice(0,10) !== value) throw new RangeError('Invalid Gregorian date');
  return epoch;
}
function clock(value) {
  if (value !== null && (typeof value !== 'string' || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value))) throw new TypeError('Reference clocks must be HH:mm or explicit null');
}
function utcEpoch(value) {
  if (value === null) return null;
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:00(?:\.000)?Z$/.test(value)) throw new TypeError('Predicted UTC must be an absolute whole-minute ISO string ending in Z, or null');
  const epoch = Date.parse(value);
  if (!Number.isFinite(epoch) || new Date(epoch).toISOString() !== value.replace(/:00Z$/, ':00.000Z')) throw new RangeError('Invalid predicted UTC instant');
  return epoch;
}
function formatter(timeZone) {
  if (typeof timeZone !== 'string' || (timeZone !== 'UTC' && !timeZone.includes('/'))) throw new RangeError('Explicit IANA timezone required');
  return new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn', {timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
}
function parts(epoch, fmt) {
  const p = Object.fromEntries(fmt.formatToParts(epoch).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
  return {date:`${p.year}-${p.month}-${p.day}`,time:`${p.hour}:${p.minute}`};
}
// Enumerate UTC minutes across the complete ±24-hour offset domain rather than
// guessing the offset at noon. All supported source dates are modern (2000–2099).
// A per-date index is reused across fields. Duplicate clocks retain every instant.
function clockResolver() {
  const cache = new Map();
  return (date, value, timeZone) => {
    const key = `${timeZone}/${date}`;
    if (!cache.has(key)) {
      const epoch = dateEpoch(date), fmt = formatter(timeZone), index = new Map();
      for (let t=epoch-DAY; t<epoch+2*DAY; t+=MINUTE) {
        const p=parts(t,fmt);
        if (p.date===date) {if(!index.has(p.time))index.set(p.time,[]);index.get(p.time).push(t);}
      }
      if(cache.size>=32)cache.delete(cache.keys().next().value);
      cache.set(key,index);
    }
    const candidates=cache.get(key).get(value)??[];
    return {epoch:candidates.length===1?candidates[0]:null,
      status:candidates.length===0?'nonexistent-local-clock':candidates.length>1?'ambiguous-local-clock':'resolved',
      candidates:candidates.map(t=>new Date(t).toISOString())};
  };
}
export function summarizeRows(rows) {
  const numeric=rows.filter(r=>r.deltaMinutes!==null), unavailable={};
  for(const row of rows)if(row.deltaMinutes===null){const key=row.unavailableReasons.join('|');unavailable[key]=(unavailable[key]??0)+1;}
  const histogram={};for(const row of numeric)histogram[row.deltaMinutes]=(histogram[row.deltaMinutes]??0)+1;
  return {slots:rows.length,compared:numeric.length,notCompared:rows.length-numeric.length,
    exact:numeric.filter(r=>r.deltaMinutes===0).length,withinOneMinute:numeric.filter(r=>Math.abs(r.deltaMinutes)<=1).length,
    maxAbsoluteMinutes:numeric.length?numeric.reduce((max,r)=>Math.max(max,Math.abs(r.deltaMinutes)),0):null,
    predictedDateDiffers:numeric.filter(r=>r.predictedLocalDate!==r.sourceAssignedDate).length,histogram,unavailable};
}
function indexInput(list, plan, source) {
  array(list, source?'references':'predictions'); const cases=new Map();
  for(const c of list){
    record(c,source?['id','status','days']:['id','days'],source?['reason']:[],source?'reference case':'prediction case');
    if(!plan.has(c.id)||cases.has(c.id))throw new RangeError('Unknown or duplicate input case');
    if(source&&(!['parsed','unavailable'].includes(c.status)||(owns(c,'reason')&&(typeof c.reason!=='string'||!c.reason))))throw new TypeError('Invalid source status/reason');
    if(source&&c.status==='unavailable'&&(!c.reason||c.days.length))throw new TypeError('Unavailable source requires reason and no invented days');
    array(c.days,'days');const days=new Map(),p=plan.get(c.id),allowed=new Set(p.fields.map(f=>source?f.reference:f.predicted));
    if(source&&p.conditional)allowed.add(p.conditional.maghribField);
    for(const d of c.days){
      record(d,['date','events'],[],'day');dateEpoch(d.date);
      if(!p.dates.includes(d.date)||days.has(d.date))throw new RangeError('Unplanned or duplicate input date');
      eventRecord(d.events,'events');
      for(const [key,value]of Object.entries(d.events)){
        if(!allowed.has(key))throw new RangeError('Unplanned event field');
        if(source)clock(value);else{record(value,['utc'],['reason'],'prediction event');utcEpoch(value.utc);if(owns(value,'reason')&&value.reason!==null&&(typeof value.reason!=='string'||!value.reason))throw new TypeError('Prediction reason must be string or null');}
      }
      days.set(d.date,d);
    }
    cases.set(c.id,{...c,days});
  }
  return cases;
}
/** Compare only explicit planned slots. Missing observations never count as exact. */
export function compareCalendars(input) {
  record(input,['plan','references','predictions','mode','zeroClockPolicy'],['conditional'],'comparison options');
  if(!MODES.includes(input.mode))throw new RangeError('Explicit supported comparison mode required');
  if(!['unresolved','literal'].includes(input.zeroClockPolicy))throw new RangeError('Explicit zeroClockPolicy unresolved/literal required');
  if(input.mode==='conditional-isha-after-maghrib'){
    record(input.conditional,['ishaField','maghribField'],[],'conditional field names');
    name(input.conditional.ishaField);name(input.conditional.maghribField);
    if(input.conditional.ishaField===input.conditional.maghribField)throw new RangeError('Isha and Maghrib anchor must differ');
  }else if(owns(input,'conditional'))throw new TypeError('Conditional fields only apply to the explicitly conditional mode');
  array(input.plan,'plan');if(!input.plan.length)throw new RangeError('A nonempty explicit plan is required');
  const plan=new Map();let plannedSlots=0,plannedDays=0;
  for(const c of input.plan){
    record(c,['id','timeZone','dates','fields'],[],'planned case');name(c.id);formatter(c.timeZone);
    if(plan.has(c.id))throw new RangeError('Duplicate planned case');
    array(c.dates,'planned dates');array(c.fields,'planned fields');
    if(!c.dates.length||!c.fields.length||new Set(c.dates).size!==c.dates.length)throw new RangeError('Nonempty distinct dates and fields required');
    c.dates.forEach(dateEpoch);const ref=new Set(),pred=new Set();
    for(const f of c.fields){record(f,['reference','predicted'],[],'field mapping');name(f.reference);name(f.predicted);if(ref.has(f.reference)||pred.has(f.predicted))throw new RangeError('Duplicate field mapping');ref.add(f.reference);pred.add(f.predicted);}
    if(input.conditional&&!ref.has(input.conditional.ishaField))throw new RangeError('Conditional Isha field must be in each planned case');
    plannedSlots+=c.dates.length*c.fields.length;plannedDays+=c.dates.length;
    if(plannedSlots>100000||plannedDays>10000)throw new RangeError('Bounded comparison supports at most100000 slots/10000 case-days');
    plan.set(c.id,{...c,conditional:input.conditional});
  }
  const references=indexInput(input.references,plan,true),predictions=indexInput(input.predictions,plan,false);
  const resolve=clockResolver(),rows=[];
  for(const c of plan.values()){
    const fmt=formatter(c.timeZone),ref=references.get(c.id),pred=predictions.get(c.id);
    for(const date of c.dates)for(const field of c.fields){
      const r=ref?.days.get(date),p=pred?.days.get(date),hasRef=r&&owns(r.events,field.reference),hasPred=p&&owns(p.events,field.predicted);
      const sourceClock=hasRef?r.events[field.reference]:null,predicted=hasPred?p.events[field.predicted]:null;
      const predictedEpoch=predicted?utcEpoch(predicted.utc):null,rendered=predictedEpoch===null?null:parts(predictedEpoch,fmt);
      let sourceStatus=!ref?'missing-case':ref.status==='unavailable'?'case-unavailable':!r?'missing-day':!hasRef?'missing-field':sourceClock===null?'explicit-null':sourceClock==='00:00'&&input.zeroClockPolicy==='unresolved'?'zero-clock-unresolved':'pending';
      let assignedDate=null,inferred=false,resolution={epoch:null,candidates:[]};
      if(sourceStatus==='pending'){
        assignedDate=date;
        if(input.mode==='conditional-isha-after-maghrib'&&field.reference===input.conditional.ishaField){
          const anchor=r.events[input.conditional.maghribField];
          if(anchor===undefined||anchor===null||(anchor==='00:00'&&input.zeroClockPolicy==='unresolved'))sourceStatus='conditional-maghrib-anchor-unavailable';
          else{
            const anchorResolution=resolve(date,anchor,c.timeZone);
            if(anchorResolution.epoch===null)sourceStatus='conditional-maghrib-anchor-'+anchorResolution.status;
            else if(sourceClock<anchor){assignedDate=new Date(dateEpoch(date)+DAY).toISOString().slice(0,10);inferred=true;}
          }
        }
        if(sourceStatus==='pending'){
          if(!assignedDate.startsWith('20'))sourceStatus='conditional-date-outside-domain';
          else{resolution=resolve(assignedDate,sourceClock,c.timeZone);sourceStatus=resolution.status;}
        }
      }
      const unavailableReasons=[];
      if(sourceStatus!=='resolved')unavailableReasons.push('source:'+sourceStatus);
      if(!pred)unavailableReasons.push('model:missing-case');else if(!p)unavailableReasons.push('model:missing-day');else if(!hasPred)unavailableReasons.push('model:missing-field');else if(predictedEpoch===null)unavailableReasons.push('model:'+(predicted.reason??'explicit-null'));
      rows.push({caseId:c.id,date,referenceField:field.reference,predictedField:field.predicted,timeZone:c.timeZone,
        sourceClock,sourceStatus,sourceFailureReason:ref?.status==='unavailable'?ref.reason:null,sourceAssignedDate:assignedDate,sourceDateInferred:inferred,
        sourceUtc:resolution.epoch===null?null:new Date(resolution.epoch).toISOString(),sourceUtcCandidates:resolution.candidates,
        predictedUtc:predictedEpoch===null?null:new Date(predictedEpoch).toISOString(),predictedLocalDate:rendered?.date??null,predictedClock:rendered?.time??null,modelReason:predicted?.reason??null,
        unavailableReasons,deltaMinutes:unavailableReasons.length?null:(predictedEpoch-resolution.epoch)/MINUTE});
    }
  }
  return {schemaVersion:1,mode:input.mode,zeroClockPolicy:input.zeroClockPolicy,conditional:input.conditional??null,
    runtime:{node:process.version,icu:process.versions.icu??null,tzdb:process.versions.tz??null},
    interpretation:'Predicted UTC minus the explicitly interpreted source UTC; no modulo-24 comparison, clock correction, model retuning or source algorithm inference.',
    official:false,overall:summarizeRows(rows),cases:[...plan.values()].map(c=>{const own=rows.filter(r=>r.caseId===c.id);return{id:c.id,score:summarizeRows(own),byField:Object.fromEntries(c.fields.map(f=>[f.reference,summarizeRows(own.filter(r=>r.referenceField===f.reference))]))};}),rows};
}
