const $=id=>document.getElementById(id);
const names={fajr:'Fajr',dhuhr:'Dhuhr',asr:'Asr',maghrib:'Maghrib',isha:'Ischa'};
const cities={frankfurt:[50.1109,8.6821,'Europe/Berlin'],istanbul:[41.0082,28.9784,'Europe/Istanbul'],cairo:[30.0444,31.2357,'Africa/Cairo'],
  'new-york':[40.7128,-74.006,'America/New_York'],jakarta:[-6.2,106.8,'Asia/Jakarta'],sydney:[-33.8688,151.2093,'Australia/Sydney'],oslo:[59.9139,10.7522,'Europe/Oslo']};
let definitions=[],result=null,generation=0,requestSequence=0;
const available=e=>e?.role==='prayer-start-model'&&['calculated','estimated'].includes(e.status);
const text=(tag,value,className)=>{const e=document.createElement(tag);e.textContent=value;if(className)e.className=className;return e;};
const labelDate=date=>new Intl.DateTimeFormat('de-DE',{dateStyle:'medium',timeZone:'UTC'}).format(new Date(`${date}T12:00:00Z`));
function clock(e){return $('seconds').checked&&e.seconds?e.seconds:e.time;}
function clockDate(e){return $('seconds').checked&&e.seconds?e.secondsDate:e.calendarDate;}
function message(value,error=false){$('message').textContent=value;$('message').classList.toggle('error',error);$('message').hidden=!value;}
function invalidate(){generation++;result=null;$('output').hidden=true;message('Eingaben geändert. Bitte neu berechnen.');}
function selectedProfile(){return $('profile').value==='composed'?`local-${$('angles').value}-shadow${$('shadow').value}-${$('night').value}-v1`:$('profile').value;}
function profileNote(){const composed=$('profile').value==='composed';$('composition').hidden=!composed;const d=definitions.find(d=>d.id===selectedProfile());$('profile-note').textContent=composed?'Vollständiges lokales Profil mit den unten gewählten Regeln. Kein offizieller Institutskalender.':d?.sourceScope??'';}
function render(){
  if(!result)return;
  const {day,schedule}=result;
  $('output').hidden=false;$('day-title').textContent=labelDate(day.date);$('day-subtitle').textContent=`${$('city').value==='custom'?`${day.location.latitude.toFixed(4)}°, ${day.location.longitude.toFixed(4)}°`:$('city').selectedOptions[0].textContent} · ${day.location.timeZone}`;
  $('prayers').replaceChildren();
  for(const name of Object.keys(names)){
    const e=day.events[name],ok=available(e),card=text('article','',`prayer ${ok?e.status:'unavailable'}`);
    card.append(text('h3',names[name]),text('div',ok?clock(e):'—','time'));
    let status=!ok?'Nicht verfügbar':e.status==='estimated'?'Geschätzt':'Berechnet';
    if(e.role!=='prayer-start-model')status='Nur Sonnenmarkierung';
    if(ok&&clockDate(e)!==day.date)status+=` · ${labelDate(clockDate(e))}`;
    card.append(text('p',status,'status'));$('prayers').append(card);
  }
  const sunrise=day.events.sunrise;
  $('sunrise').textContent=sunrise.time?`Sonnenaufgangsmarkierung · ${clock(sunrise)}${clockDate(sunrise)!==day.date?` · ${labelDate(clockDate(sunrise))}`:''}`:'Sonnenaufgangsmarkierung nicht verfügbar';
  $('coverage').textContent=day.coverage.prayerStartsComplete?'Alle fünf Gebetsbeginne sind für diesen Tag nach dem gewählten Profil berechnet.':
    'Dieses Profil liefert hier keine vollständigen fünf Gebetsbeginne. Fehlende Zeiten werden nicht erfunden. Wähle bei Bedarf bewusst ein vollständiges lokales Profil oder eine passende Schätzregel.';
  const composition=day.profile.composition;
  $('method-summary').textContent=`${composition?`Lokale Regeln · Asr-Faktor ${composition.asrShadowFactor} · ${composition.highLatitudeMode==='physical'?'ohne Schätzung':'mit gewählter Nachtregel'}`:day.profile.label}. ${day.coverage.estimatedEvents.length?`Geschätzt: ${day.coverage.estimatedEvents.map(n=>names[n]??n).join(', ')}.`:''}`;
  const list=document.createElement('ul');
  for(const name of Object.keys(names)){const e=day.events[name];list.append(text('li',`${names[name]}: ${e.ruleEvidence.description}${e.reason?` (${e.reason})`:''}`));}
  $('rules').replaceChildren(list,text('p',day.profile.sourceScope),text('p',`Berechnungsversion ${day.calculation.version}; Zeitzonendaten ${result.runtime.tzdb}.`));
  for(const [key,url] of Object.entries(day.profile.sources)){const a=text('a',key);a.href=url;a.target='_blank';a.rel='noopener noreferrer';const p=text('p','');p.append(a);$('rules').append(p);}
  $('week').replaceChildren();
  for(let i=0;i<7;i++){
    const date=new Date(Date.parse(`${day.date}T00:00:00Z`)+i*86400000).toISOString().slice(0,10),row=document.createElement('tr');
    row.append(text('td',labelDate(date)));
    for(const name of Object.keys(names)){
      const e=schedule.entries.find(e=>e.sourceDate===date&&e.event===name);
      const cell=text('td',e?`${$('seconds').checked&&e.displaySeconds?e.displaySeconds:e.displayTime}${e.status==='estimated'?' *':''}`:'—');
      const displayDate=e&&$('seconds').checked&&e.displaySeconds?e.displaySecondsDate:e?.calendarDate;
      if(e&&displayDate!==date)cell.append(text('small',` (${labelDate(displayDate)})`));
      row.append(cell);
    }
    $('week').append(row);
  }
  renderNext();
}
function renderNext(){
  if(!result)return;
  const now=Date.now(),next=result.schedule.entries.find(e=>e.epochMilliseconds>=now&&e.localDate>=result.day.date);
  if(!next){$('next').textContent='Kein weiterer Beginn';$('next-detail').textContent='Im ausgewählten Zeitraum liegt kein berechneter Beginn mehr in der Zukunft.';return;}
  const shown=$('seconds').checked&&next.displaySeconds?next.displaySeconds:next.displayTime;
  $('next').textContent=`${names[next.event]} · ${shown}`;
  const minutes=Math.max(0,Math.ceil((next.epochMilliseconds-now)/60000)),duration=minutes<60?`${minutes} Min.`:`${Math.floor(minutes/60)} Std. ${minutes%60} Min.`;
  const displayDate=$('seconds').checked&&next.displaySeconds?next.displaySecondsDate:next.calendarDate;
  $('next-detail').textContent=`${labelDate(displayDate)} · in ${duration}${next.status==='estimated'?' · geschätzt':''}${!result.schedule.complete?' · Unvollständiger Zeitraum: frühere fehlende Gebetsbeginne sind möglich.':''}`;
}
async function calculate(event){
  event?.preventDefault();if(!$('settings').reportValidity())return;
  const token=++generation,request=++requestSequence;result=null;$('output').hidden=true;$('calculate').disabled=true;message('Die Zeiten werden lokal berechnet …');
  const input={date:$('date').value,latitude:Number($('latitude').value),longitude:Number($('longitude').value),timeZone:$('timeZone').value.trim(),profile:selectedProfile()};
  try{
    const response=await fetch('/api/calculate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)}),data=await response.json();
    if(token!==generation)return;if(!response.ok)throw new Error(data.error);
    result=data;message(data.schedule.complete?'Berechnet · vollständiger Zeitraum':'Berechnet · einzelne Gebetsbeginne fehlen');render();
  }catch(error){if(token===generation)message(`Berechnung nicht möglich: ${error.message}`,true);}
  finally{if(request===requestSequence)$('calculate').disabled=false;}
}
$('settings').addEventListener('submit',calculate);
for(const id of ['latitude','longitude','timeZone','date','profile','angles','shadow','night'])$(id).addEventListener('input',()=>{invalidate();if(['profile','angles','shadow','night'].includes(id))profileNote();if(['latitude','longitude','timeZone'].includes(id))$('city').value='custom';});
$('seconds').addEventListener('change',render);
$('city').addEventListener('change',()=>{const c=cities[$('city').value];if(c){[$('latitude').value,$('longitude').value,$('timeZone').value]=c;$('location-note').textContent='Beispielkoordinaten für den gewählten Ort.';}invalidate();});
$('gps').addEventListener('click',()=>{
  if(!navigator.geolocation){$('location-note').textContent='Dieser Browser stellt keinen Standort bereit. Bitte Koordinaten eingeben.';return;}
  const gpsGeneration=generation;
  $('gps').disabled=true;$('location-note').textContent='Standort wird abgefragt …';
  navigator.geolocation.getCurrentPosition(p=>{
    if(gpsGeneration!==generation){$('gps').disabled=false;$('location-note').textContent='Deine zwischenzeitlich geänderten Eingaben bleiben erhalten. Standort bei Bedarf erneut abfragen.';return;}
    $('latitude').value=p.coords.latitude.toFixed(6);$('longitude').value=p.coords.longitude.toFixed(6);$('city').value='custom';
    $('timeZone').value=Intl.DateTimeFormat().resolvedOptions().timeZone;
    $('location-note').textContent=`Standortgenauigkeit laut Gerät: etwa ${Math.round(p.coords.accuracy)} m. Die Zeitzone stammt aus deiner Geräteeinstellung; bitte für diesen Ort prüfen.`;
    $('gps').disabled=false;invalidate();
  },()=>{$('gps').disabled=false;$('location-note').textContent='Standort nicht verfügbar oder nicht erlaubt. Du kannst Koordinaten weiterhin selbst eingeben.';},{enableHighAccuracy:true,timeout:15000,maximumAge:60000});
});
$('download').addEventListener('click',()=>{if(!result)return;const url=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`prayer-times-${result.day.date}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
try{
  $('date').value=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const response=await fetch('/api/profiles');if(!response.ok)throw new Error('Profilauswahl nicht verfügbar');const data=await response.json();definitions=data.profiles;
  const composed=text('option','Eigene lokale Regeln · fünf Gebete');composed.value='composed';$('profile').append(composed);
  for(const d of definitions.filter(d=>!d.composition)){const option=text('option',d.label);option.value=d.id;$('profile').append(option);}
  $('profile').value='composed';profileNote();await calculate();
}catch(error){message(error.message,true);}
setInterval(renderNext,15000);
