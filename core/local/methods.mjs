import {listSunniMethods} from './sunni-profiles.mjs';
import {listReferenceProfiles} from './sunni-reference.mjs';
import {listRelativeProfiles} from './sunni-relative.mjs';
import {LOCAL_DIYANET_LOCAL_PROFILES} from './diyanet-local.mjs';

/** Current application catalogue; frozen historical registries remain unchanged. */
export function listAvailableMethods(){
  const reference=listReferenceProfiles(),relative=listRelativeProfiles();
  return listSunniMethods().map(method=>{
    const additions=reference.filter(profile=>profile.family===method.id).map(profile=>profile.id);
    const transitions=relative.filter(profile=>profile.family===method.id).map(profile=>profile.id);
    const seasonal=method.id==='diyanet'?LOCAL_DIYANET_LOCAL_PROFILES:[];
    return {...method,nightModes:[...method.nightModes,...(additions.length?['reference45']:[]),...(transitions.length?['local-relative']:[]),...(seasonal.length?['local-seasonal']:[])],
      profiles:[...method.profiles,...additions,...transitions,...seasonal]};
  });
}
