// Versioned application recipes; institute names identify criteria, not endorsements.
import {getLocalProfile} from './profiles.mjs';

const sources={
  catalog:'https://github.com/batoulapps/adhan-js/blob/develop/METHODS.md',
  egypt:'https://www.dar-alifta.org/ar/fatwa/details/13816/فتوى-دار-الإفتاء-المصرية-في-توقيت-الفجر',
  fcna:'https://fiqhcouncil.org/the-suggested-calculation-method-for-fajr-and-isha/',
  asr:'https://kurul.diyanet.gov.tr/tr/fetva/asr-i-evvel-ve-asr-i-sani-ne-demektir/0193c42d-4d64-7acf-2961-12b0db4e1723',
  horizon:'https://aa.usno.navy.mil/faq/RST_defs',
  night:'https://praytimes.org/docs/calculation',
  jakim:'https://mufti.pahang.gov.my/muat-turun-dokumen/nota-kursus-taklimat/3-asas-falak-dalam-ibadah/file',
  rounding:'https://www.muftiselangor.gov.my/soalan-lazim/',
  noon:'https://www.muftiselangor.gov.my/2024/08/09/66-taudhih-al-hukmi-hukum-solat-pada-waktu-rembang/',
  malaysiaHorizon:'https://www.islam.gov.my/images/ePenerbitan/jurnal_falak_bil1_2015.pdf',
};
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
const event=(kind,description,sourceKeys=[],evidence='local-convention',marginMinutes=0)=>({
  kind,role:'prayer-start-model',marginMinutes,rounding:'none',resolution:'model-instant',evidence,sourceKeys,description,
});
const families=[
  {id:'mwl',label:'Muslim World League (MWL)',fajr:18,isha:17,evidence:'software-convention',angleSource:'catalog',
    scope:'The common MWL-labelled 18°/17° application convention. A complete current issuing-body recipe has not been established.'},
  {id:'karachi',label:'Karachi',fajr:18,isha:18,evidence:'software-convention',angleSource:'catalog',
    scope:'The common Karachi-labelled 18°/18° application convention. The Asr factor is an independent user choice, not an implication of the twilight angles.'},
  {id:'egyptian',label:'Egyptian',fajr:19.5,isha:17.5,evidence:'published-criterion',angleSource:'egypt',
    scope:'Egyptian Dar al-Ifta supports the 19.5°/17.5° angle criteria. The remaining choices compose a local point recipe, not the complete Egyptian Survey production engine.'},
  {id:'isna',label:'ISNA',fajr:15,isha:15,evidence:'software-convention',angleSource:'catalog',
    scope:'The common ISNA-labelled 15°/15° application convention. FCNA separately recommends these angles for the USA; its 13°/13° Canadian recommendation remains a separate profile.'},
];
function rules(family,factor){return{
  fajr:event('solar-crossing',`Fajr at −${family.fajr}°.`,[family.angleSource],family.evidence),
  sunrise:{...event('solar-crossing','Flat −50′ apparent-horizon sunrise marker.',['horizon']),role:'sunrise-marker'},
  dhuhr:event('solar-transit','Solar transit plus one elapsed minute: an explicit project margin.',[], 'local-convention',1),
  asr:event('noon-shadow',`Afternoon shadow factor ${factor} beyond the noon shadow; independently selected.`,['asr'],'published-criterion'),
  maghrib:event('solar-crossing','Flat −50′ apparent-horizon sunset, without additional safety margin.',['horizon']),
  isha:event('solar-crossing',`Isha at −${family.isha}°.`,[family.angleSource],family.evidence),
};}
function base(family,factor){return{
  family:family.id,authority:'Declared local application recipe',official:false,institutionalEquivalence:'not-claimed',
  sourceScope:family.scope+' SPA geocentric point astronomy, fixed flat horizon, and declared project choices are used; no institutional calendar equivalence is claimed.',
  sources:{asr:sources.asr,horizon:sources.horizon,
    ...(family.angleSource?{[family.angleSource]:sources[family.angleSource]}:{}),
    ...(family.id==='isna'?{fcna:sources.fcna}:{})},
  astronomy:{fajrAngleDegrees:family.fajr,ishaAngleDegrees:family.isha,asrShadowFactor:factor,horizonDepressionDegrees:50/60,solarModel:'spa'},
  domain:null,northern:null,nightPolicy:null,intervalPolicy:null,events:rules(family,factor),
  composition:{asrShadowFactor:factor,highLatitudeMode:'physical',astronomy:'geocentric'},
};}
const profiles=[];
for(const family of families)for(const factor of [1,2])for(const mode of ['physical','angle-night']){
  const profile=base(family,factor);
  if(mode==='angle-night')profile.sources.night=sources.night;
  profiles.push({...profile,id:`sunni-${family.id}-shadow${factor}-${mode}-v1`,
    label:`${family.label} · Asr ${factor} · ${mode}`,
    composition:{asrShadowFactor:factor,highLatitudeMode:mode,astronomy:'geocentric'},
    nightPolicy:mode==='angle-night'?{kind:'angle-fraction',fajrAngleDegrees:family.fajr,ishaAngleDegrees:family.isha}:null,
  });
}
for(const factor of [1,2])for(const mode of ['calendar','ramadan','ordinary']){
  const family={id:'umm-al-qura',label:'Umm al-Qura',fajr:18.5,isha:18,evidence:'software-convention',angleSource:'catalog',
    scope:'Umm al-Qura-labelled application convention: Fajr 18.5° and Isha 90/120 elapsed minutes after sunset. Automatic Ramadan uses the source civil date in the offline ICU Umm al-Qura calendar, not a moon-sighting announcement.'};
  const profile=base(family,factor);
  // Null is deliberate: this recipe does not select an Isha altitude crossing.
  profile.astronomy.ishaAngleDegrees=null;
  profile.events.isha=event('sunset-interval','90 minutes after physical sunset, or 120 in Ramadan; the calendar/override convention is explicit.',['catalog'],'software-convention');
  profiles.push({...profile,id:`sunni-umm-al-qura-shadow${factor}-${mode}-v1`,label:`Umm al-Qura · Asr ${factor} · ${mode}`,
    intervalPolicy:{kind:'sunset-interval',mode,ordinaryMinutes:90,ramadanMinutes:120,calendar:'islamic-umalqura',dateBasis:'source-civil-date'},
  });
}
const jakim=base({id:'jakim',fajr:18,isha:18,evidence:'published-criterion',angleSource:'jakim',
  scope:'Malaysian local point composition using the cited 18°/18° criteria, a declared flat reference horizon, transit +64 seconds and Selangor-style minute selection. It is not a zonal e-Solat calendar and does not implement every state variation.'},1);
Object.assign(jakim.sources,{malaysiaRounding:sources.rounding,noon:sources.noon});
delete jakim.sources.asr;delete jakim.sources.horizon;
jakim.sources.malaysiaHorizon=sources.malaysiaHorizon;
jakim.events.asr.sourceKeys=['jakim'];
jakim.events.sunrise.sourceKeys=['malaysiaHorizon'];
jakim.events.maghrib.sourceKeys=['malaysiaHorizon'];
for(const [name,rule] of Object.entries(jakim.events)){
  Object.assign(rule,{rounding:name==='sunrise'?'floor-minute':'ceil-minute',resolution:'minute',marginMinutes:0,
    sourceKeys:[...rule.sourceKeys,'malaysiaRounding'],description:rule.description+' Then select a whole minute (upward for starts; downward for sunrise).'});
}
Object.assign(jakim.events.dhuhr,{marginMinutes:64/60,marginOrder:'before-rounding',sourceKeys:['noon','malaysiaRounding'],evidence:'published-criterion',
  description:'Transit plus 64 elapsed seconds (the cited Malaysian noon convention), then upward whole-minute selection. No fitted floor-to-seconds step.'});
profiles.push({...jakim,id:'sunni-jakim-shadow1-physical-v1',label:'JAKIM · local Malaysian point',
  domain:{latitude:[0,8],longitude:[99,120],timeZones:['Asia/Kuala_Lumpur','Asia/Kuching']}});

const registry=new Map(profiles.map(profile=>[profile.id,freeze(profile)]));
export const LOCAL_SUNNI_PROFILES=Object.freeze([...registry.keys()]);
const legacyIds=['diyanet-published-spa-point-v1','kemenag-worked-example-point-v1'];
export function getSunniProfile(id){
  if(legacyIds.includes(id))return getLocalProfile(id);
  if(typeof id!=='string'||!registry.has(id))throw new RangeError('Unknown Sunni local profile');
  return registry.get(id);
}
export const listSunniProfiles=()=>[...registry.values()].map(profile=>structuredClone(profile));
const catalogue=[...families.map(family=>({id:family.id,label:family.label,
  defaultProfile:`sunni-${family.id}-shadow${family.id==='karachi'?2:1}-physical-v1`,asrFactors:[1,2],
  nightModes:['physical','angle-night'],ramadanModes:[],scope:family.scope})),
  {id:'umm-al-qura',label:'Umm al-Qura',defaultProfile:'sunni-umm-al-qura-shadow1-calendar-v1',asrFactors:[1,2],nightModes:['physical'],ramadanModes:['calendar','ramadan','ordinary'],scope:profiles.find(p=>p.family==='umm-al-qura').sourceScope},
  {id:'diyanet',label:'Diyanet',defaultProfile:legacyIds[0],asrFactors:[1],nightModes:['physical'],ramadanModes:[],scope:getLocalProfile(legacyIds[0]).sourceScope},
  {id:'kemenag',label:'Kemenag (Indonesia)',defaultProfile:legacyIds[1],asrFactors:[1],nightModes:['physical'],ramadanModes:[],scope:getLocalProfile(legacyIds[1]).sourceScope},
  {id:'jakim',label:'JAKIM (Malaysia)',defaultProfile:'sunni-jakim-shadow1-physical-v1',asrFactors:[1],nightModes:['physical'],ramadanModes:[],scope:jakim.sourceScope},
];
const order=['mwl','karachi','egyptian','umm-al-qura','isna','diyanet','kemenag','jakim'];
export const listSunniMethods=()=>order.map(id=>{
  const method=catalogue.find(m=>m.id===id);
  return structuredClone({...method,profiles:legacyIds.includes(method.defaultProfile)?[method.defaultProfile]:profiles.filter(p=>p.family===id).map(p=>p.id)});
});
