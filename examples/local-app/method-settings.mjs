import {resolveMethodProfile} from './i18n.mjs';

// Application defaults only. The versioned numerical profiles and their
// historical catalogue defaults remain unchanged. See AUTOMATIC-SETTINGS.md.
export function resolveFamilySettings(method,{automatic=true,asrFactor,nightMode,ramadanMode}={}){
  const options=automatic
    ?{nightMode:method?.id==='mwl'?'local-relative':undefined,ramadanMode:'calendar'}
    :{asrFactor,nightMode,ramadanMode};
  const profile=resolveMethodProfile(method,options);
  if(automatic&&method.id==='mwl'&&!profile.endsWith('-local-relative-v1'))
    throw new RangeError('The automatic MWL summer profile is unavailable');
  const mode=profile.match(/-(physical|angle-night|reference45|local-relative|calendar|ramadan|ordinary)-v1$/)?.[1]??'physical';
  const interval=Boolean(method.ramadanModes?.length);
  return{automatic,profile,
    asrFactor:Number(profile.match(/shadow([12])/i)?.[1]??method.asrFactors?.[0]??1),
    nightMode:interval?null:mode,ramadanMode:interval?mode:null};
}
