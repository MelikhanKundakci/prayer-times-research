// JUPEM Almanak2025, printed167/168/170 (PDF175/176/178).
// All listed points are retained; no position is inferred from calendar times.
const dms=(d,m,s)=>d+m/60+s/3600;
const point=(id,a,b,c,d,e,f)=>Object.freeze({id,latitude:dms(a,b,c),longitude:dms(d,e,f)});
const zone=(printedPage,points)=>Object.freeze({printedPage,points:Object.freeze(points)});
export const ZONES=Object.freeze({
  PNG01:zone(170,[point('r1',5,32,57,100,10,38),point('r2',5,28,37,100,10,38),
    point('r3',5,17,4,100,10,38),point('r4',5,16,0,100,11,9),point('r5',5,8,12,100,33,36)]),
  KDH01:zone(167,[point('r1',6,32,30,100,22,30),point('r2',6,28,30,100,36,30),
    point('r3',6,13,30,100,35,30),point('r4',6,6,30,100,39,0),point('r5',6,5,0,100,29,0),
    point('r6',5,58,30,100,21,0),point('r7',6,11,0,100,15,30),point('r8',6,15,0,100,11,30)]),
  KDH03:zone(168,[point('r15',6,30,30,100,44,0),point('r16',5,41,30,100,52,30),
    point('r17',5,50,30,100,36,0),point('r18',6,15,30,100,30,30)]),
});
