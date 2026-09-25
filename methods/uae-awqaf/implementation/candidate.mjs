// Frozen global training-selected recipe. No per-city/time corrections.
import { calculateDay } from './model.mjs';
export const RECIPE = Object.freeze({ geometry:'width-and-height', angle:18, atmosphere:'standard',
  asrRefraction:'noon-and-event', asrOffsetMinutes:0, dhuhrOffsetMinutes:2 });
export function calculateCandidate(date,point) {
  const result=calculateDay(date,point,RECIPE);
  return {...result,profile:'uae-vendor-geometry-v2-candidate',version:'0.2.0-research'};
}
