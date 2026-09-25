import {calculateOwnFcna} from '../model.mjs';
import {findPhysicalAsr,solarTransit} from '../../../../core/astronomy/physical-asr-solver.mjs';
const DAY=86400000;
function render(epoch,timeZone){
 const fmt=new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23',timeZoneName:'longOffset'});
 const p=Object.fromEntries(fmt.formatToParts(epoch).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
 const offset=p.timeZoneName==='GMT'?'+00:00':p.timeZoneName.replace('GMT','');
 if(!/^[+-]\d\d:\d\d$/.test(offset))throw new Error('Unsupported offset format');
 const localDate=`${p.year}-${p.month}-${p.day}`,time=`${p.hour}:${p.minute}`;
 return {localDate,time,localIso:`${localDate}T${time}:00${offset}`,utc:new Date(epoch).toISOString()};
}
export function calculateOwnFcnaReviewed(input,configuration={ephemeris:'usno',rounding:'nearest'}){
 // The historical entry validates strict records, ranges, dates, coordinates,
 // timezone and prescribed numerical configuration before anything is read.
 const result=calculateOwnFcna(input,configuration),round=configuration.rounding==='nearest'?Math.round:Math.ceil;
 const changes=[];
 for(const day of result.days){
  const transit=solarTransit(day.solarCalculationDate,result.location.longitude,configuration.ephemeris);
  const diagnostic=findPhysicalAsr({transit,...result.location,asrFactor:result.engine.asrFactor,ephemeris:configuration.ephemeris});
  const before=day.events.asr;
  if(diagnostic.rawEpoch===null){
   if(before.status!=='unavailable')throw new Error('Review lost a previously available Asr; requires further audit');
   // Preserve the historical unavailable record and its reason verbatim.
  } else if(before.status!=='unavailable'){
   // Preserve equivalent historical roots/clock rendering bit for bit.
   // Raw UTC strings have millisecond, rather than submillisecond, precision.
   if(Math.abs(Date.parse(before.rawUtc)-diagnostic.rawEpoch)>2)throw new Error('Available Asr moved by more than source timestamp resolution');
  } else {
   const rounded=round(diagnostic.rawEpoch/60000)*60000;
   day.events.asr={status:'calculated-experimental',...render(rounded,result.location.timeZone),rawUtc:new Date(diagnostic.rawEpoch).toISOString(),basis:'auxiliary-astronomical-convention-not-specified-by-FCNA-source'};
   changes.push({date:day.date,previousReason:before.reason,rawUtc:day.events.asr.rawUtc,roundedUtc:day.events.asr.utc,geometry:diagnostic.atRoot});
  }
 }
 result.engine.asrDomainReview={version:'1.0.0',method:'Finite algebraic continuation through the target-height boundary; retain only physically positive setting crossings',changedDays:changes.length};
 result.asrDomainReview={changes,highLatitudeReplacement:null,transitNoonShadowConvention:'Preserves historical time-varying declination target; not a new fixed-noon-shadow profile',scope:'Numerical correction of missing auxiliary Asr only; does not validate a religious polar prayer prescription'};
 return result;
}
