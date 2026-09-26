import {fields} from '../input.mjs';

/** Apply a declared minute quantization BEFORE the elapsed-time margin. */
export function selectRuleInstant(input){
  fields(input,['epochMilliseconds','rounding','marginMinutes']);
  const {epochMilliseconds:raw,rounding,marginMinutes}=input;
  if(!Number.isFinite(raw)||Math.abs(raw)>8.64e15)throw new RangeError('A valid finite UTC epoch is required');
  if(!['none','ceil-minute','floor-minute'].includes(rounding))throw new RangeError('Unknown selection rounding');
  if(!Number.isFinite(marginMinutes)||Math.abs(marginMinutes)>1440)throw new RangeError('A finite margin within one day is required');
  const basis=rounding==='none'?raw:(rounding==='ceil-minute'?Math.ceil(raw/60000):Math.floor(raw/60000))*60000;
  const selected=basis+marginMinutes*60000;
  if(!Number.isFinite(selected)||Math.abs(selected)>8.64e15)throw new RangeError('Selected epoch is outside the Date range');
  return{solarEpochMilliseconds:raw,roundedBasisEpochMilliseconds:rounding==='none'?null:basis,
    selectedEpochMilliseconds:selected,rounding,marginMinutes,operationOrder:'quantize-then-add-elapsed-margin'};
}
