import {diyanetComparisonRows} from './comparison-view.mjs';
import {applyStaticTranslations,formatDateLabel,localizedError,localizedEventName,localizedProfileLabel,localizedProfileScope,localizedReason,localizedRuleDescription,localizedSourceLabel,localizedStatus,readLanguage,setLanguagePresentation,translate} from './i18n.mjs';

const $=id=>document.getElementById(id);
const EVENTS=['fajr','dhuhr','asr','maghrib','isha'];
const cities={frankfurt:[50.1109,8.6821,'Europe/Berlin'],istanbul:[41.0082,28.9784,'Europe/Istanbul'],cairo:[30.0444,31.2357,'Africa/Cairo'],
  'new-york':[40.7128,-74.006,'America/New_York'],jakarta:[-6.2,106.8,'Asia/Jakarta'],sydney:[-33.8688,151.2093,'Australia/Sydney'],oslo:[59.9139,10.7522,'Europe/Oslo']};
let language=readLanguage(),definitions=[],result=null,generation=0,requestSequence=0,comparison=null,comparisonRequest=0,locationNote={key:'location.sample'},mainMessage={key:'message.preparing'},comparisonMessage=null;
const t=(key,values)=>translate(key,language,values);
const available=e=>e?.role==='prayer-start-model'&&['calculated','estimated'].includes(e.status);
const text=(tag,value,className)=>{const e=document.createElement(tag);e.textContent=value;if(className)e.className=className;return e;};
const labelDate=date=>formatDateLabel(date,language);
function clock(e){return $('seconds').checked&&e.seconds?e.seconds:e.time;}
function clockDate(e){return $('seconds').checked&&e.seconds?e.secondsDate:e.calendarDate;}
function showLocationNote(){ $('location-note').textContent=t(locationNote.key,locationNote.values); }
function message(key,values,error=false){mainMessage={key,values,error};refreshMessage();}
function refreshMessage(){const values=mainMessage.key==='error.calculate'?{detail:localizedError(mainMessage.values?.detail,language)}:mainMessage.values;const value=t(mainMessage.key,values);$('message').textContent=value;$('message').classList.toggle('error',mainMessage.error);$('message').hidden=!value;}
function resetComparison(){comparison=null;comparisonMessage=null;comparisonRequest++;$('comparison-output').hidden=true;$('comparison-message').textContent='';$('compare-diyanet').disabled=false;}
function invalidate(){generation++;result=null;resetComparison();$('output').hidden=true;message('message.changed');}
function selectedProfile(){
  if($('profile').value!=='composed')return $('profile').value;
  const base=`local-${$('angles').value}-shadow${$('shadow').value}-${$('night').value}-v1`;
  return $('astronomy').value==='observer'?base.replace(/-v1$/,'-observer-v1'):base;
}
function profileNote(){
  const composed=$('profile').value==='composed';$('composition').hidden=!composed;
  if(composed){$('profile-note').textContent=$('astronomy').value==='observer'?t('astronomy.scope'):t('profile.composedNote');return;}
  const definition=definitions.find(item=>item.id===selectedProfile());
  $('profile-note').textContent=definition?localizedProfileScope(definition,language):'';
}
function renderProfileOptions(){
  const select=$('profile'),selected=select.value;select.replaceChildren();
  const option=text('option',t('profile.composed'));option.value='composed';select.append(option);
  for(const definition of definitions.filter(item=>!item.composition)){
    const item=text('option',localizedProfileLabel(definition,language));item.value=definition.id;select.append(item);
  }
  select.value=selected||'composed';
}
function render(){
  applyStaticTranslations(document,language);renderProfileOptions();showLocationNote();profileNote();
  refreshMessage();
  $('comparison-message').textContent=comparisonMessage? t(comparisonMessage.key,comparisonMessage.key==='comparison.failed'?{detail:localizedError(comparisonMessage.values?.detail,language)}:comparisonMessage.values):'';
  if(!result)return;
  const {day,schedule}=result;$('output').hidden=false;$('day-title').textContent=labelDate(day.date);
  const place=$('city').value==='custom'?`${day.location.latitude.toFixed(4)}°, ${day.location.longitude.toFixed(4)}°`:$('city').selectedOptions[0].textContent;
  $('day-subtitle').textContent=`${place} · ${day.location.timeZone}`;$('prayers').replaceChildren();
  for(const name of EVENTS){
    const event=day.events[name],ok=available(event),card=text('article','',`prayer ${ok?event.status:'unavailable'}`);
    card.append(text('h3',localizedEventName(name,language)),text('div',ok?clock(event):'—','time'));
    let status=localizedStatus(event.status,event.role,language);
    if(ok&&clockDate(event)!==day.date)status+=t('status.date',{date:labelDate(clockDate(event))});
    if(!ok&&event.reason)status+=` · ${localizedReason(event.reason,language)}`;
    card.append(text('p',status,'status'));$('prayers').append(card);
  }
  const sunrise=day.events.sunrise;
  $('sunrise').textContent=sunrise.time?`${t('sunrise.label')} · ${clock(sunrise)}${clockDate(sunrise)!==day.date?t('status.date',{date:labelDate(clockDate(sunrise))}):''}`:`${t('sunrise.label')} ${t('status.unavailable').toLowerCase()}`;
  $('coverage').textContent=t(day.coverage.prayerStartsComplete?'coverage.complete':'coverage.partial');
  const composition=day.profile.composition;
  const summary=composition?t('summary.composed',{factor:composition.asrShadowFactor,night:t(composition.highLatitudeMode==='physical'?'summary.noEstimate':'summary.nightEstimate')}):localizedProfileLabel(day.profile,language);
  const estimates=day.coverage.estimatedEvents.length?t('summary.estimated',{events:day.coverage.estimatedEvents.map(name=>localizedEventName(name,language)).join(', ')}):'';
  $('method-summary').textContent=`${summary}. ${estimates}`;
  const list=document.createElement('ul');
  for(const name of ['fajr','sunrise','dhuhr','asr','maghrib','isha']){
    const event=day.events[name],rule=localizedRuleDescription(day,name,language);
    list.append(text('li',`${localizedEventName(name,language)}: ${rule}${event.reason?` (${localizedReason(event.reason,language)})`:''}`));
  }
  $('rules').replaceChildren(list,text('p',localizedProfileScope(day.profile,language)),text('p',t('rules.version',{version:day.calculation.version,tzdb:result.runtime.tzdb})));
  for(const [key,url] of Object.entries(day.profile.sources??{})){
    const link=text('a',localizedSourceLabel(key,language));link.href=url;link.target='_blank';link.rel='noopener noreferrer';const row=text('p','');row.append(link);$('rules').append(row);
  }
  renderComparison();renderNext();renderWeek();
}
function renderWeek(){
  $('week').replaceChildren();
  for(let index=0;index<7;index++){
    const date=new Date(Date.parse(`${result.day.date}T00:00:00Z`)+index*86400000).toISOString().slice(0,10),row=document.createElement('tr');row.append(text('td',labelDate(date)));
    for(const name of EVENTS){
      const entry=result.schedule.entries.find(item=>item.sourceDate===date&&item.event===name),cell=text('td',entry?`${$('seconds').checked&&entry.displaySeconds?entry.displaySeconds:entry.displayTime}${entry.status==='estimated'?' *':''}`:'—');
      const shownDate=entry&&$('seconds').checked&&entry.displaySeconds?entry.displaySecondsDate:entry?.calendarDate;
      if(entry&&shownDate!==date)cell.append(text('small',` (${labelDate(shownDate)})`));row.append(cell);
    }
    $('week').append(row);
  }
}
function renderComparison(){
  $('diyanet-comparison').hidden=result?.day.profile.id!=='diyanet-published-spa-point-v1';$('comparison-output').hidden=!comparison;
  if(!comparison)return;$('comparison-rows').replaceChildren();
  for(const row of diyanetComparisonRows(comparison,{seconds:$('seconds').checked,language})){
    const tr=document.createElement('tr');tr.append(text('th',row.name));tr.firstChild.scope='row';
    for(const side of [row.local,row.calendar]){const cell=text('td',side.clock);cell.append(text('small',side.status));if(side.date&&side.date!==comparison.input.date)cell.append(text('small',labelDate(side.date)));tr.append(cell);}
    const delta=text('td',row.difference);delta.append(text('small',row.rawDifference));tr.append(delta);$('comparison-rows').append(tr);
  }
}
async function compareDiyanet(){
  if(result?.day.profile.id!=='diyanet-published-spa-point-v1')return;
  const token=generation,request=++comparisonRequest,{date,location:{latitude,longitude,timeZone}}=result.day;
  comparison=null;comparisonMessage={key:'comparison.busy'};$('comparison-output').hidden=true;$('compare-diyanet').disabled=true;$('comparison-message').textContent=t('comparison.busy');
  try{
    const response=await fetch('/api/compare-diyanet',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({date,latitude,longitude,timeZone})}),data=await response.json();
    if(token!==generation||request!==comparisonRequest)return;if(!response.ok)throw new Error(data.error);
    comparison=data;comparisonMessage={key:'comparison.done'};$('comparison-message').textContent=t('comparison.done');renderComparison();
  }catch(error){if(token===generation&&request===comparisonRequest){comparisonMessage={key:'comparison.failed',values:{detail:error.message}};$('comparison-message').textContent=t(comparisonMessage.key,{detail:localizedError(error.message,language)});}}
  finally{if(token===generation&&request===comparisonRequest)$('compare-diyanet').disabled=false;}
}
function renderNext(){
  if(!result)return;const now=Date.now(),next=result.schedule.entries.find(entry=>entry.epochMilliseconds>=now&&entry.localDate>=result.day.date);
  if(!next){$('next').textContent=t('next.none');$('next-detail').textContent=t('next.noneDetail');return;}
  const shown=$('seconds').checked&&next.displaySeconds?next.displaySeconds:next.displayTime;
  $('next').textContent=t('next.label',{event:localizedEventName(next.event,language),time:shown});
  const minutes=Math.max(0,Math.ceil((next.epochMilliseconds-now)/60000)),duration=minutes<60?t('duration.minutes',{n:minutes}):t('duration.hours',{h:Math.floor(minutes/60),m:minutes%60});
  const displayDate=$('seconds').checked&&next.displaySeconds?next.displaySecondsDate:next.calendarDate;
  $('next-detail').textContent=`${labelDate(displayDate)} · ${t('next.in',{duration})}${next.status==='estimated'?t('next.estimated'):''}${!result.schedule.complete?t('week.incomplete'):''}`;
}
async function calculate(event){
  event?.preventDefault();if(!$('settings').reportValidity())return;
  const token=++generation,request=++requestSequence;result=null;resetComparison();$('output').hidden=true;$('calculate').disabled=true;message('message.calculating');
  const input={date:$('date').value,latitude:Number($('latitude').value),longitude:Number($('longitude').value),timeZone:$('timeZone').value.trim(),profile:selectedProfile()};
  try{
    const response=await fetch('/api/calculate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)}),data=await response.json();
    if(token!==generation)return;if(!response.ok)throw new Error(data.error);result=data;
    message(data.schedule.complete?'message.complete':'message.partial');render();
  }catch(error){if(token===generation)message('error.calculate',{detail:error.message},true);}
  finally{if(request===requestSequence)$('calculate').disabled=false;}
}
function changeLanguage(value){
  language=setLanguagePresentation(value,{render:selected=>{language=selected;render();}});$('language').value=language;
  // Language selection is presentation-only: preserve the current result and all request/input state.
}

$('language').value=language;applyStaticTranslations(document,language);
$('language').addEventListener('change',()=>changeLanguage($('language').value));
$('settings').addEventListener('submit',calculate);$('compare-diyanet').addEventListener('click',compareDiyanet);
for(const id of ['latitude','longitude','timeZone','date','profile','angles','shadow','night','astronomy'])$(id).addEventListener('input',()=>{
  invalidate();if(['profile','angles','shadow','night','astronomy'].includes(id))profileNote();if(['latitude','longitude','timeZone'].includes(id))$('city').value='custom';
});
$('seconds').addEventListener('change',render);
$('city').addEventListener('change',()=>{const city=cities[$('city').value];if(city){[$('latitude').value,$('longitude').value,$('timeZone').value]=city;locationNote={key:'location.chosen'};}else locationNote={key:'location.sample'};showLocationNote();invalidate();});
$('gps').addEventListener('click',()=>{
  if(!navigator.geolocation){locationNote={key:'gps.noApi'};showLocationNote();return;}
  const gpsGeneration=generation;$('gps').disabled=true;locationNote={key:'gps.pending'};showLocationNote();
  navigator.geolocation.getCurrentPosition(position=>{
    if(gpsGeneration!==generation){$('gps').disabled=false;locationNote={key:'gps.changed'};showLocationNote();return;}
    $('latitude').value=position.coords.latitude.toFixed(6);$('longitude').value=position.coords.longitude.toFixed(6);$('city').value='custom';$('timeZone').value=Intl.DateTimeFormat().resolvedOptions().timeZone;
    locationNote={key:'gps.success',values:{accuracy:Math.round(position.coords.accuracy)}};$('gps').disabled=false;showLocationNote();invalidate();
  },()=>{$('gps').disabled=false;locationNote={key:'gps.failed'};showLocationNote();},{enableHighAccuracy:true,timeout:15000,maximumAge:60000});
});
$('download').addEventListener('click',()=>{if(!result)return;const url=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download=`prayer-times-${result.day.date}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
try{
  $('date').value=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const response=await fetch('/api/profiles');if(!response.ok)throw new Error(t('error.prepare'));const data=await response.json();definitions=data.profiles;
  renderProfileOptions();$('profile').value='composed';profileNote();await calculate();
  }catch(error){message('error.prepare',undefined,true);}
setInterval(renderNext,15000);
