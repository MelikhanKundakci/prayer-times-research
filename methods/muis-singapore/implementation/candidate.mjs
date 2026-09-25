import{calculateDay}from'./model.mjs';
export function calculateSingaporeCandidate(input){
 if(arguments.length!==1||!input||Object.getPrototypeOf(input)!==Object.prototype)throw new TypeError('Plain region input required.');
 const ds=Object.getOwnPropertyDescriptors(input),keys=Reflect.ownKeys(ds);
 if(keys.length!==3||!keys.every(k=>typeof k==='string'&&['date','region','timeZone'].includes(k)&&Object.hasOwn(ds[k],'value')&&ds[k].enumerable))throw new TypeError('Exactly own date/region/timeZone required; no engine or GPS override.');
 return calculateDay({...input,engine:'usno-continuous'});
}
