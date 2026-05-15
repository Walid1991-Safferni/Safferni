export const cities = [
  // 14 Syrian governorates
  { id:"dam", ar:"دمشق", en:"Damascus" },
  { id:"ale", ar:"حلب", en:"Aleppo" },
  { id:"hom", ar:"حمص", en:"Homs" },
  { id:"ham", ar:"حماة", en:"Hama" },
  { id:"lat", ar:"اللاذقية", en:"Latakia" },
  { id:"tar", ar:"طرطوس", en:"Tartus" },
  { id:"dar", ar:"درعا", en:"Daraa" },
  { id:"dez", ar:"دير الزور", en:"Deir ez-Zor" },
  { id:"has", ar:"الحسكة", en:"Al-Hasakah" },
  { id:"raq", ar:"الرقة", en:"Raqqa" },
  { id:"idl", ar:"إدلب", en:"Idlib" },
  { id:"qun", ar:"القنيطرة", en:"Quneitra" },
  { id:"suw", ar:"السويداء", en:"As-Suwayda" },
  { id:"rif", ar:"ريف دمشق", en:"Rural Damascus" },
  // International
  { id:"bei", ar:"بيروت", en:"Beirut" },
  { id:"amm", ar:"عمّان", en:"Amman" },
  { id:"qaa", ar:"مطار الملكة علياء", en:"Queen Alia Airport" },
  { id:"daa", ar:"مطار دمشق الدولي", en:"Damascus Int'l Airport" },
];

export const getDests = (f) => cities.filter(c => c.id !== f).map(c => c.id);
export const gc = (id) => cities.find(c => c.id === id);
