const D={
  twilight:'https://www.diyanet.gov.tr/tr-TR/Kurumsal/Detay/2921/basin-aciklamasi',
  temkin:'https://vakithesaplama.diyanet.gov.tr/temkin.php',
  asr:'https://kurul.diyanet.gov.tr/tr/fetva/asr-i-evvel-ve-asr-i-sani-ne-demektir/0193c42d-4d64-7acf-2961-12b0db4e1723',
  north:'https://www.awqatsalah.com/sub/34/tespit-kriterleri',
};
const EGYPT={fatwa:'https://www.dar-alifta.org/ar/fatwa/details/13816/فتوى-دار-الإفتاء-المصرية-في-توقيت-الفجر',
  esa:'https://www.esa.gov.eg/praytimes.aspx'};
const FCNA={recommendation:'https://fiqhcouncil.org/the-suggested-calculation-method-for-fajr-and-isha/',
  discussion:'https://fiqhcouncil.org/fifteen-or-eighteen-degrees-calculating-prayer-fasting-times-in-islam/'};
const KEMENAG={book:'https://gerubok.kemenagbelitungtimur.id/uploads/ebook/1790043937_ebook_ephemeris_hisab_rukyat_2026_69566ee622db8.pdf',
  rounding:'https://temanggung.kemenag.go.id/bimbingan-masyarakat-islam/standar-baku-hisab-rukyat-dalam-pelatihan-perhitungan-jadwal-shalat/',
  fajr:'https://kalteng.kemenag.go.id/kanwil/cetak/537222/Soal-Penetapan-Waktu-Subuh-di-Indonesia-Ini-Penjelasan-Kemenag'};

const prayer=(kind,role,marginMinutes,rounding,resolution,evidence,sourceKeys,description)=>({
  kind,role,marginMinutes,rounding,resolution,evidence,sourceKeys,description,
});
const diyanetEvents={
  fajr:prayer('solar-crossing','prayer-start-model',0,'none','model-instant','published-criterion',['twilight'],'Solar crossing at −18°; the source states the angle but not this profile’s complete point ephemeris.'),
  sunrise:prayer('solar-crossing','sunrise-marker',-7,'none','model-instant','published-criterion',['temkin'],'Geometric sunrise with the local 50-arcminute convention and −7-minute adjustment.'),
  dhuhr:prayer('solar-transit','prayer-start-model',5,'none','model-instant','published-criterion',['temkin'],'Solar transit with the documented +5-minute Temkin adjustment.'),
  asr:prayer('noon-shadow','prayer-start-model',4,'none','model-instant','published-criterion',['asr','temkin'],'Factor-one afternoon shadow event with the documented +4-minute adjustment.'),
  maghrib:prayer('solar-crossing','prayer-start-model',7,'none','model-instant','published-criterion',['temkin'],'Geometric sunset with the local 50-arcminute convention and +7-minute adjustment.'),
  isha:prayer('solar-crossing','prayer-start-model',0,'none','model-instant','published-criterion',['twilight','north'],'Solar crossing at −17° below the northern threshold and −16° in the separate northern policy.'),
};
const seasonalDiyanetEvents={...diyanetEvents,
  fajr:{...diyanetEvents.fajr,evidence:'local-convention',sourceKeys:['north'],
    description:'Raw −18° crossing or project-defined annual q candidate with a one-sided smooth transition; not the unpublished full institutional summer implementation.'},
  isha:{...diyanetEvents.isha,evidence:'local-convention',sourceKeys:['north'],
    description:'Raw −16° crossing or project-defined annual q candidate with a one-sided smooth transition; not the unpublished full institutional summer implementation.'},
};
const sourceEvents=(angleKeys)=>({
  fajr:prayer('solar-crossing','prayer-start-model',0,'none','model-instant','published-criterion',angleKeys,'Published Fajr angle; continuous USNO point astronomy is a local implementation choice.'),
  sunrise:prayer('solar-crossing','sunrise-marker',0,'none','model-instant','local-convention',[],'Geometric sunrise marker under the local flat-horizon convention.'),
  dhuhr:prayer('solar-transit','solar-noon-marker',0,'none','model-instant','local-convention',[],'Upper-meridian transit marker; the cited angle recommendation does not prescribe a full noon engine.'),
  asr:prayer('noon-shadow','shadow-marker',0,'none','model-instant','local-convention',[],'Factor-one afternoon shadow crossing is an explicit local convention.'),
  maghrib:prayer('solar-crossing','sunset-marker',0,'none','model-instant','local-convention',[],'Geometric sunset marker under the local flat-horizon convention.'),
  isha:prayer('solar-crossing','prayer-start-model',0,'none','model-instant','published-criterion',angleKeys,'Published Isha angle; continuous USNO point astronomy is a local implementation choice.'),
});
const kemenagEvents={
  fajr:prayer('solar-crossing','prayer-start-model',2,'ceil-minute','minute','worked-example',['book','rounding','fajr'],'Book-example Fajr angle and upward minute rounding, then +2 minutes.'),
  sunrise:prayer('solar-crossing','sunrise-marker',-2,'floor-minute','minute','worked-example',['book','rounding'],'Book-example horizon event, downward minute rounding, then −2 minutes.'),
  dhuhr:prayer('solar-transit','prayer-start-model',3,'ceil-minute','minute','worked-example',['book','rounding'],'Book-example solar-noon marker, upward minute rounding, then +3 minutes.'),
  asr:prayer('noon-shadow','prayer-start-model',2,'ceil-minute','minute','worked-example',['book','rounding'],'Book-example factor-one Asr, upward minute rounding, then +2 minutes.'),
  maghrib:prayer('solar-crossing','prayer-start-model',2,'ceil-minute','minute','worked-example',['book','rounding'],'Book-example sunset, upward minute rounding, then +2 minutes.'),
  isha:prayer('solar-crossing','prayer-start-model',2,'ceil-minute','minute','worked-example',['book','rounding'],'Book-example Isha angle, upward minute rounding, then +2 minutes.'),
};

const rawProfiles=[
  {id:'diyanet-published-point-v1',label:'Diyanet-published point rules',authority:'Presidency of Religious Affairs of Türkiye (Diyanet)',
    sourceScope:'Published Diyanet criteria with declared local point conventions for continuous astronomy, horizon, date and precision details.',
    sources:D,astronomy:{fajrAngleDegrees:18,ishaAngleDegrees:17,asrShadowFactor:1,horizonDepressionDegrees:50/60},
    northern:{thresholdLatitude:44.5,ishaAngleDegrees:16,mode:'ordinary-guard'},domain:null,events:diyanetEvents},
  {id:'local-northern-seasonal-v1',label:'Local northern seasonal night-fraction policy',authority:'Local software policy inspired by published Diyanet criteria',
    sourceScope:'Project-defined annual ratio, candidate, and transition conventions inspired by published northern criteria; not a complete institutional seasonal implementation.',
    sources:D,astronomy:{fajrAngleDegrees:18,ishaAngleDegrees:17,asrShadowFactor:1,horizonDepressionDegrees:50/60},
    northern:{thresholdLatitude:44.5,ishaAngleDegrees:16,mode:'local-seasonal'},domain:null,events:seasonalDiyanetEvents},
  {id:'egypt-published-angles-point-v1',label:'Egypt published-angle point profile',authority:'Egyptian Dar al-Ifta (angle guidance); ESA calculation administration (institutional context)',
    sourceScope:'Dar al-Ifta supports the cited Fajr/Isha angles. Point ephemeris, horizon, Asr, noon, margins, and rounding are local conventions.',
    sources:EGYPT,astronomy:{fajrAngleDegrees:19.5,ishaAngleDegrees:17.5,asrShadowFactor:1,horizonDepressionDegrees:50/60},
    northern:null,domain:null,events:sourceEvents(['fatwa'])},
  {id:'fcna-usa-2017-point-v1',label:'FCNA USA published-angle point profile',authority:'Fiqh Council of North America',
    sourceScope:'FCNA angle recommendation for USA Fajr/Isha only. Other astronomy and all non-angle event rules are local conventions.',
    sources:FCNA,astronomy:{fajrAngleDegrees:15,ishaAngleDegrees:15,asrShadowFactor:1,horizonDepressionDegrees:50/60},
    northern:null,domain:null,events:sourceEvents(['recommendation'])},
  {id:'fcna-canada-2017-point-v1',label:'FCNA Canada published-angle point profile',authority:'Fiqh Council of North America',
    sourceScope:'FCNA angle recommendation for Canada Fajr/Isha only. Other astronomy and all non-angle event rules are local conventions.',
    sources:FCNA,astronomy:{fajrAngleDegrees:13,ishaAngleDegrees:13,asrShadowFactor:1,horizonDepressionDegrees:50/60},
    northern:null,domain:null,events:sourceEvents(['recommendation'])},
  {id:'kemenag-worked-example-point-v1',label:'Kemenag 2026 worked-example point profile',authority:'Ministry of Religious Affairs of the Republic of Indonesia (Kemenag)',
    sourceScope:'Bounded recreation of the cited worked example and reported rounding order; not a nationwide current-production engine. Imsak and Dhuha are not implemented.',
    sources:KEMENAG,astronomy:{fajrAngleDegrees:20,ishaAngleDegrees:18,asrShadowFactor:1,horizonDepressionDegrees:1},
    northern:null,domain:{latitude:[-12,8],longitude:[94,142],timeZones:['Asia/Jakarta','Asia/Pontianak','Asia/Makassar','Asia/Jayapura']},events:kemenagEvents},
];

function deepFreeze(value){
  if(value&&typeof value==='object'&&!Object.isFrozen(value)){
    for(const child of Object.values(value))deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
const registry=new Map(rawProfiles.map(profile=>[profile.id,deepFreeze({...profile,official:false,institutionalEquivalence:'not-claimed'})]));

export const LOCAL_PROFILE_IDS=Object.freeze([...registry.keys()]);
// The public contract calls this the profile list; each item is a stable ID.
export const LOCAL_PROFILES=LOCAL_PROFILE_IDS;
export const LOCAL_PROFILE='diyanet-published-point-v1';
export const LOCAL_SEASONAL_PROFILE='local-northern-seasonal-v1';

export function getLocalProfile(id){
  if(typeof id!=='string'||!registry.has(id))throw new RangeError(`Unknown local profile. Supported IDs: ${LOCAL_PROFILE_IDS.join(', ')}`);
  return registry.get(id);
}

export function listLocalProfiles(){return[...registry.values()].map(profile=>structuredClone(profile));}
