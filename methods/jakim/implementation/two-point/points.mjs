// Coordinates transcribed from independent institutional sources, never fitted.
// GDM2000 village coordinates are a proxy, not a verified prayer production point.
const dms=(d,m,s)=>d+m/60+s/3600;
export const POINTS=Object.freeze({
 gedangsa:Object.freeze({id:'gedangsa-jupem',latitude:dms(3,44,30),longitude:dms(101,23,3),
  source:'https://www.jupem.gov.my/storage/upload/almanak/alamanak2023-1732247110.pdf',sourceRole:'published-western-prayer-reference',productionUseConfirmed:false}),
 tanjungRhu:Object.freeze({id:'tanjung-rhu-village-proxy',latitude:dms(2,38,5.1),longitude:dms(101,37,35.6),
  source:'https://mygeoname.mygeoportal.gov.my/pdf/10.pdf',sourceRole:'official-general-village-gazetteer; NOT verified prayer point',datum:'GDM2000',datumTransformation:'none',sourcePublicationYear:null,productionUseConfirmed:false}),
 broga:Object.freeze({id:'broga-jupem-sunrise',latitude:dms(2,56,24),longitude:dms(101,54,41),
  source:'https://www.jupem.gov.my/storage/upload/almanak/alamanak2023-1732247110.pdf',sourceRole:'published-eastern-prayer-reference retained for sunrise',productionUseConfirmed:false}),
});
