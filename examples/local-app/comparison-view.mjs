import {localizedEventName,localizedStatus,normalizeLanguage,translate} from './i18n.mjs';

const EVENTS=['fajr','sunrise','dhuhr','asr','maghrib','isha'];
const available=event=>['calculated','estimated'].includes(event.status)&&typeof event.time==='string';

function side(event,seconds,language){
  const present=available(event);
  return{available:present,clock:present?(seconds&&event.seconds?event.seconds:event.time):'—',
    date:present?(seconds&&event.seconds?event.secondsDate:event.calendarDate):null,
    status:localizedStatus(event.status,event.role,language)};
}
function signed(value,digits,language){
  const rounded=Number(value.toFixed(digits));
  const locale={en:'en-GB',de:'de-DE',tr:'tr-TR'}[normalizeLanguage(language)];
  return`${rounded<0?'−':rounded>0?'+':''}${Math.abs(rounded).toLocaleString(locale,{maximumFractionDigits:digits})}`;
}

/** Presentation only: preserve both models' availability, dates and absolute-time differences. */
export function diyanetComparisonRows(comparison,{seconds=false,language='en'}={}){
  const lang=normalizeLanguage(language);
  return EVENTS.map(event=>{
    const pair=comparison.events[event],paired=pair.localAvailable&&pair.calendarAvailable;
    return{event,name:localizedEventName(event,lang),local:side(pair.local,seconds,lang),calendar:side(pair.calendar,seconds,lang),
      difference:paired?`${signed(pair.roundedEpochDifferenceMilliseconds/60000,0,lang)} ${translate('comparison.minutes',lang)}`:'—',
      rawDifference:paired?translate('comparison.raw',lang,{value:signed(pair.rawDifferenceSeconds,1,lang)}):translate('comparison.rawMissing',lang)};
  });
}
