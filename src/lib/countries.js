export const COUNTRY_CODES = [
  {v:"+963",f:"🇸🇾",name:"Syria"},{v:"+962",f:"🇯🇴",name:"Jordan"},{v:"+961",f:"🇱🇧",name:"Lebanon"},
  {v:"+966",f:"🇸🇦",name:"Saudi Arabia"},{v:"+971",f:"🇦🇪",name:"UAE"},{v:"+965",f:"🇰🇼",name:"Kuwait"},
  {v:"+974",f:"🇶🇦",name:"Qatar"},{v:"+973",f:"🇧🇭",name:"Bahrain"},{v:"+968",f:"🇴🇲",name:"Oman"},
  {v:"+967",f:"🇾🇪",name:"Yemen"},{v:"+964",f:"🇮🇶",name:"Iraq"},{v:"+970",f:"🇵🇸",name:"Palestine"},
  {v:"+20",f:"🇪🇬",name:"Egypt"},{v:"+212",f:"🇲🇦",name:"Morocco"},{v:"+213",f:"🇩🇿",name:"Algeria"},
  {v:"+216",f:"🇹🇳",name:"Tunisia"},{v:"+218",f:"🇱🇾",name:"Libya"},{v:"+249",f:"🇸🇩",name:"Sudan"},
  {v:"+90",f:"🇹🇷",name:"Turkey"},{v:"+98",f:"🇮🇷",name:"Iran"},{v:"+92",f:"🇵🇰",name:"Pakistan"},
  {v:"+93",f:"🇦🇫",name:"Afghanistan"},{v:"+994",f:"🇦🇿",name:"Azerbaijan"},{v:"+995",f:"🇬🇪",name:"Georgia"},
  {v:"+374",f:"🇦🇲",name:"Armenia"},{v:"+7",f:"🇷🇺",name:"Russia"},{v:"+380",f:"🇺🇦",name:"Ukraine"},
  {v:"+44",f:"🇬🇧",name:"UK"},{v:"+49",f:"🇩🇪",name:"Germany"},{v:"+33",f:"🇫🇷",name:"France"},
  {v:"+39",f:"🇮🇹",name:"Italy"},{v:"+34",f:"🇪🇸",name:"Spain"},{v:"+31",f:"🇳🇱",name:"Netherlands"},
  {v:"+32",f:"🇧🇪",name:"Belgium"},{v:"+41",f:"🇨🇭",name:"Switzerland"},{v:"+43",f:"🇦🇹",name:"Austria"},
  {v:"+46",f:"🇸🇪",name:"Sweden"},{v:"+47",f:"🇳🇴",name:"Norway"},{v:"+45",f:"🇩🇰",name:"Denmark"},
  {v:"+358",f:"🇫🇮",name:"Finland"},{v:"+48",f:"🇵🇱",name:"Poland"},{v:"+30",f:"🇬🇷",name:"Greece"},
  {v:"+40",f:"🇷🇴",name:"Romania"},{v:"+36",f:"🇭🇺",name:"Hungary"},{v:"+420",f:"🇨🇿",name:"Czech Republic"},
  {v:"+351",f:"🇵🇹",name:"Portugal"},{v:"+1",f:"🇺🇸",name:"USA / Canada"},{v:"+52",f:"🇲🇽",name:"Mexico"},
  {v:"+55",f:"🇧🇷",name:"Brazil"},{v:"+54",f:"🇦🇷",name:"Argentina"},{v:"+57",f:"🇨🇴",name:"Colombia"},
  {v:"+56",f:"🇨🇱",name:"Chile"},{v:"+86",f:"🇨🇳",name:"China"},{v:"+81",f:"🇯🇵",name:"Japan"},
  {v:"+82",f:"🇰🇷",name:"South Korea"},{v:"+91",f:"🇮🇳",name:"India"},{v:"+60",f:"🇲🇾",name:"Malaysia"},
  {v:"+65",f:"🇸🇬",name:"Singapore"},{v:"+62",f:"🇮🇩",name:"Indonesia"},{v:"+61",f:"🇦🇺",name:"Australia"},
  {v:"+64",f:"🇳🇿",name:"New Zealand"},
];

const SORTED_CODES = [...COUNTRY_CODES].sort((a, b) => b.v.length - a.v.length);

export const detectCC = (val = "") => {
  const m = SORTED_CODES.find(c => val.startsWith(c.v));
  return m ? { cc: m.v, num: val.slice(m.v.length) } : { cc: "+963", num: val };
};
