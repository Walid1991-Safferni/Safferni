import { gc } from "./cities.js";

export const routeMap = [
  {from:"dam",to:"bei", seat:35, seatMin:30,seatMax:40, car:140,van:200},
  {from:"daa",to:"bei", seat:40, seatMin:35,seatMax:40, car:150,van:220},
  {from:"dam",to:"amm", seat:50, seatMin:45,seatMax:55, car:190,van:250},
  {from:"dam",to:"qaa", seat:50, seatMin:45,seatMax:55, car:200,van:260},
  {from:"qaa",to:"dam", seat:70, seatMin:65,seatMax:75, car:260,van:320},
  {from:"dam",to:"hom", seat:30, seatMin:25,seatMax:35, car:110,van:150},
  {from:"dam",to:"ale", seat:50, seatMin:45,seatMax:55, car:180,van:240},
  {from:"hom",to:"ale", seat:25, seatMin:20,seatMax:30, car:90, van:130},
  {from:"hom",to:"ham", seat:18, seatMin:15,seatMax:20, car:65, van:90},
  {from:"ham",to:"ale", seat:25, seatMin:20,seatMax:30, car:90, van:130},
  {from:"dam",to:"daa", seat:25, seatMin:22,seatMax:28, car:90, van:130},
  {from:"dam",to:"dar", seat:30, seatMin:25,seatMax:35, car:110,van:150},
  {from:"hom",to:"tar", seat:30, seatMin:25,seatMax:35, car:110,van:150},
  {from:"hom",to:"lat", seat:30, seatMin:25,seatMax:35, car:110,van:150},
  {from:"dam",to:"lat", seat:50, seatMin:45,seatMax:55, car:180,van:240},
  {from:"dam",to:"tar", seat:50, seatMin:45,seatMax:55, car:180,van:240},
];

export const findRoute = (a, b) =>
  routeMap.find(r => r.from === a && r.to === b)
  || routeMap.find(r => r.from === b && r.to === a)
  || { comingSoon: true };

export const pricingRoutes = routeMap.map(r => ({
  from: gc(r.from),
  to: gc(r.to),
  seat: r.seat,
  seatMin: r.seatMin,
  seatMax: r.seatMax,
  car: r.car,
  van: r.van,
}));
