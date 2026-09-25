// Additive input boundary; the frozen numerical reconstruction is unchanged.
import { calculateBanuriCandidate } from './model.mjs';
export function calculateBanuriStrict(date, location) {
  if (arguments.length !== 2) throw new Error('Exactly date and location required.');
  if (!location || typeof location !== 'object' || Array.isArray(location)) throw new Error('Plain location data object required.');
  const prototype=Object.getPrototypeOf(location);
  if (prototype!==Object.prototype && prototype!==null) throw new Error('Inherited location values are not accepted.');
  const keys=Reflect.ownKeys(location),expected=['latitude','longitude','timeZone'];
  if(keys.length!==3 || !keys.every(k=>typeof k==='string'&&expected.includes(k))) throw new Error('Exactly own latitude, longitude and timeZone fields required; no symbols.');
  const copy={};
  for(const key of expected){
    const d=Object.getOwnPropertyDescriptor(location,key);
    if(!d||!Object.hasOwn(d,'value')||!d.enumerable)throw new Error('Enumerable own data fields required; accessors rejected.');
    copy[key]=d.value;
  }
  return calculateBanuriCandidate(date,copy);
}
