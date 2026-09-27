import {listSunniMethods} from './sunni-profiles.mjs';
import {listReferenceProfiles} from './sunni-reference.mjs';

/** Current application catalogue; frozen historical registries remain unchanged. */
export function listAvailableMethods(){
  const reference=listReferenceProfiles();
  return listSunniMethods().map(method=>{
    const additions=reference.filter(profile=>profile.family===method.id).map(profile=>profile.id);
    return additions.length?{...method,nightModes:[...method.nightModes,'reference45'],profiles:[...method.profiles,...additions]}:method;
  });
}
