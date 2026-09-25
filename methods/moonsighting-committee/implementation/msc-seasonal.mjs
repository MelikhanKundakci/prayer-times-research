// MSC seasonal coefficients from Adhan4.4.6, Copyright(c)2016 BatoulApps,
// MIT license: see repository-root THIRD_PARTY_NOTICES.md. Independent interpolation
// preserves fractional seconds until the final displayed-minute rounding.
export function seasonMinutes(latitude,dayNumber,year,event,shafaq='general'){
 const leap=year%4===0&&(year%100!==0||year%400===0),yearDays=leap?366:365;
 const offset=latitude>=0?10:-(leap?173:172);
 const x=((dayNumber+offset)%yearDays+yearDays)%yearDays,scale=Math.abs(latitude)/55;
 const coefficients=event==='fajr'?[75,28.65,19.44,32.74,48.10]:shafaq==='ahmar'?[62,17.4,-7.16,5.12,19.44]:shafaq==='abyad'?[75,25.6,7.16,36.84,81.84]:[75,25.6,2.05,-9.21,6.14];
 const[base,...factors]=coefficients,[a,b,c,d]=factors.map(v=>base+scale*v);
 const knots=[0,91,137,183,229,275,366],values=[a,b,c,d,c,b,a];
 let i=0;while(i<knots.length-2&&x>=knots[i+1])i++;
 return values[i]+(values[i+1]-values[i])*(x-knots[i])/(knots[i+1]-knots[i]);
}
