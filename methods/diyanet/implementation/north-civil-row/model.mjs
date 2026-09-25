import { replayKernel, SeasonalContractError } from './kernel.mjs';
import { unsupportedAnnual } from '../missing-window/model.mjs';

export function calculateNorthernCivilRow(options) {
  if (arguments.length !== 1) throw new TypeError('Exactly one options object required');
  let result, unsupported = null;
  try { result = replayKernel(options); }
  catch (error) {
    if (!(error instanceof SeasonalContractError)) throw error;
    unsupported = {code:'unsupported-northern-civil-row-season-contract',message:error.message};
    result = unsupportedAnnual(options,error.observations,unsupported);
  }
  result.profile = {...result.profile,id:'diyanet-north-civil-row-research',version:'0.1.0-experimental',
    parameters:{...result.profile.parameters,sourceRecipe:'Missing-window arithmetic with civil-row UTC00 ephemeris and civil June21 envelope',
      declinationEpoch:'requested civil row UTC00',equationOfTimeEpoch:'requested civil row UTC00',
      solsticeAnchorBasis:'requested civil June21'},selectionStatus:'Explicit source-free research candidate; no institutional validation'};
  result.engine = {...result.engine,name:'independent-USNO-civil-row-UTC00',civilDateAnchorEngine:'independent-USNO-civil-row-UTC00'};
  result.variant = 'north-civil-row';
  result.researchOnly = true;
  result.official = false;
  result.appReady = false;
  result.eligibleForAutomaticNotifications = false;
  result.experiment = {supported:unsupported===null,unsupported,candidateCount:1,
    changedFactor:'civil-row ephemeris sampling and civil-June21 envelope reference',
    seasonalArithmeticChanged:false,automaticPromotion:false};
  result.reconstruction = {...result.reconstruction,solarVariant:'usno-civil-row-utc0',solsticeAnchorBasis:'requested civil June21'};
  result.qualityFlags = ['experimental-compatibility-hypothesis','civil-row-ephemeris-unconfirmed',
    'production-point-unverified','not-notification-eligible'];
  result.limitations = [
    'Experimental northern civil-row extension; no Diyanet source or accuracy validation for this variant.',
    'Daily ephemeris UTC00 and civil June21 envelope are an explicit convention; not more accurate physical astronomy by definition.',
    'Original seasonal equations, horizon substitutions, fixed daily Asr and final rounding remain research assumptions.',
    'Source row dates, production points and extreme-latitude rules are not established by model-only continuity tests.',
    'Ordering exceptions and unsupported seasonal contracts remain possible; no notifications are enabled.',
  ];
  for (const day of result.days) {
    day.ephemerisDate = day.solarCalculationDate === null ? null : day.date;
    day.solarTimeCarrierDate = day.solarCalculationDate;
  }
  return result;
}
