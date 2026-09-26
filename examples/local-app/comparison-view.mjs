const labels={fajr:'Fajr',sunrise:'Sonnenaufgang',dhuhr:'Dhuhr',asr:'Asr',maghrib:'Maghrib',isha:'Ischa'};
const statuses={calculated:'Berechnet',estimated:'Geschätzt','policy-blocked':'Regel ungeklärt',unavailable:'Nicht verfügbar'};
const available=event=>['calculated','estimated'].includes(event.status)&&typeof event.time==='string';

function side(event,seconds){
  const present=available(event);
  return{available:present,clock:present?(seconds&&event.seconds?event.seconds:event.time):'—',
    date:present?(seconds&&event.seconds?event.secondsDate:event.calendarDate):null,
    status:statuses[event.status]??'Nicht verfügbar'};
}

function signed(value,digits){
  const rounded=Number(value.toFixed(digits));
  return`${rounded<0?'−':rounded>0?'+':''}${Math.abs(rounded).toLocaleString('de-DE',{maximumFractionDigits:digits})}`;
}

/** Presentation only: preserve both models' availability, dates and absolute-time differences. */
export function diyanetComparisonRows(comparison,{seconds=false}={}){
  return Object.entries(labels).map(([event,name])=>{
    const pair=comparison.events[event],paired=pair.localAvailable&&pair.calendarAvailable;
    return{event,name,local:side(pair.local,seconds),calendar:side(pair.calendar,seconds),
      difference:paired?`${signed(pair.roundedEpochDifferenceMilliseconds/60000,0)} Min.`:'—',
      rawDifference:paired?`Vor Minutenrundung: ${signed(pair.rawDifferenceSeconds,1)} Sek.`:'Kein gemeinsamer Zeitwert'};
  });
}
