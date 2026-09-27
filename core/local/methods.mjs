import {listSunniMethods} from './sunni-profiles.mjs';
import {listReferenceProfiles} from './sunni-reference.mjs';
import {listRelativeProfiles} from './sunni-relative.mjs';

/** Current application catalogue; frozen historical registries remain unchanged. */
export function listAvailableMethods(){
  const reference=listReferenceProfiles(),relative=listRelativeProfiles();
  return listSunniMethods().map(method=>{
    const additions=reference.filter(profile=>profile.family===method.id).map(profile=>profile.id);
    const transitions=relative.filter(profile=>profile.family===method.id).map(profile=>profile.id);
    return {...method,nightModes:[...method.nightModes,...(additions.length?['reference45']:[]),...(transitions.length?['local-relative']:[])],
      profiles:[...method.profiles,...additions,...transitions]};
  });
}
