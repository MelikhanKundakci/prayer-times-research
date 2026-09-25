// Separately attributed parameter publications. No institutional certification.
const profiles=[
 {id:'tehran-published-angles-own',label:'Tehran parameters published in Adhan4.4.6, own geometry',fajrAngle:17.7,maghribAngle:4.5,ishaAngle:14,source:'https://github.com/batoulapps/adhan-js/blob/v4.4.6/src/CalculationMethod.ts',sourceAuthority:'software-parameter-publication; no independently verified IGUT specification'},
 {id:'leva-published-angles-own',label:'Leva attribution published by AlAdhan, own geometry',fajrAngle:16,maghribAngle:4,ishaAngle:14,source:'https://api.aladhan.com/v1/methods',sourceAuthority:'software-parameter-publication; original Leva specification unverified'},
 {id:'arc-iran-angles-own',label:'ARC public Iran angle settings, own geometry',fajrAngle:18,maghribAngle:4.5,ishaAngle:null,source:'https://arabic.nojumi.org/prayertimes',sourceAuthority:'primary public calculator client practice; full server recipe unspecified'},
 {id:'arc-outside-iran-angles-own',label:'ARC public outside-Iran angle settings, own geometry',fajrAngle:18,maghribAngle:3.75,ishaAngle:null,source:'https://arabic.nojumi.org/prayertimes',sourceAuthority:'primary public calculator client practice; full server recipe unspecified'},
].map(p=>Object.freeze(p));
export function listProfiles(){return profiles.map(p=>({...p,version:'0.1.0-research',official:false}));}
export function getProfile(id){const p=profiles.find(p=>p.id===id);if(!p)throw new RangeError('Choose one explicit published-angle research profile; religious/geographical aliases are rejected');return{...p,version:'0.1.0-research',official:false};}
