import { useState, useRef, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
const SHEET_URL = import.meta.env.VITE_SHEET_URL;
const USDT_ADDRESS = import.meta.env.VITE_USDT_ADDRESS;
const WA_PHONE = import.meta.env.VITE_WA_PHONE;
const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || "").split(",").map(e => e.trim()).filter(Boolean);

const cities = [
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

const routeMap=[
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
  {from:"dam",to:"dar", seat:30, seatMin:25,seatMax:35, car:110,van:150},
  {from:"hom",to:"tar", seat:30, seatMin:25,seatMax:35, car:110,van:150},
  {from:"hom",to:"lat", seat:30, seatMin:25,seatMax:35, car:110,van:150},
  {from:"dam",to:"lat", seat:50, seatMin:45,seatMax:55, car:180,van:240},
  {from:"dam",to:"tar", seat:50, seatMin:45,seatMax:55, car:180,van:240},
];

const getDests=(f)=>cities.filter(c=>c.id!==f).map(c=>c.id);
const findRoute=(a,b)=>routeMap.find(r=>r.from===a&&r.to===b)||routeMap.find(r=>r.from===b&&r.to===a)||{comingSoon:true};
const gc=(id)=>cities.find(c=>c.id===id);
const genRef=()=>{const d=new Date();const rand=crypto.randomUUID().replace(/-/g,"").slice(0,5).toUpperCase();return`SAF-${d.getFullYear().toString().slice(-2)}${String(d.getMonth()+1).padStart(2,"0")}-${rand}`};
const genAppRef=()=>{const d=new Date();const rand=crypto.randomUUID().replace(/-/g,"").slice(0,5).toUpperCase();return`DRV-${String(d.getDate()).padStart(2,"0")}${String(d.getMonth()+1).padStart(2,"0")}-${rand}`};
const pricingRoutes=routeMap.map(r=>({from:gc(r.from),to:gc(r.to),seat:r.seat,seatMin:r.seatMin,seatMax:r.seatMax,car:r.car,van:r.van}));
const timeToMinutes=(t)=>{if(!t)return 0;const[h,m]=t.split(":").map(Number);return h*60+m};
const formatTime=(t)=>{if(!t)return"—";const h=parseInt(t.slice(0,2));const m=t.slice(3,5);const ampm=h>=12?"PM":"AM";const h12=h===0?12:h>12?h-12:h;return`${h12}:${m} ${ampm}`};

const StarRating=({value,onChange,readOnly=false})=>(
  <div style={{display:"flex",gap:4}}>
    {[1,2,3,4,5].map(s=>(<span key={s} onClick={()=>!readOnly&&onChange&&onChange(s)} style={{fontSize:22,cursor:readOnly?"default":"pointer",color:s<=value?"#F59E0B":"#DDD",transition:"color 0.15s"}}>★</span>))}
  </div>
);

const GenderBadge=({type,lang})=>{
  const isWomen=type==="women_only";
  return(<span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:isWomen?"#F3E8FF":"#F0FDF4",color:isWomen?"#7C3AED":"#065F46",border:`1px solid ${isWomen?"#DDD6FE":"#BBF7D0"}`}}>{isWomen?"💜 "+(lang==="ar"?"نساء فقط":"Women Only"):"🚗 "+(lang==="ar"?"مختلط":"Mixed")}</span>);
};

const SeatMap=({total,available})=>(
  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:8}}>
    {Array.from({length:total},(_,i)=>{
      const isBooked=i<(total-available);
      return(<div key={i} style={{width:22,height:22,borderRadius:"50%",background:isBooked?"#EF4444":"#22C55E",border:`2px solid ${isBooked?"#DC2626":"#16A34A"}`,transition:"background 0.3s"}}/>);
    })}
  </div>
);

const COUNTRY_CODES=[
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
const SORTED_CODES=[...COUNTRY_CODES].sort((a,b)=>b.v.length-a.v.length);
const detectCC=(val="")=>{const m=SORTED_CODES.find(c=>val.startsWith(c.v));return m?{cc:m.v,num:val.slice(m.v.length)}:{cc:"+963",num:val};};

const PhoneField=({value="",onChange,lang,inp})=>{
  const {cc:initCC}=detectCC(value);
  const [cc,setCc]=useState(initCC);
  const [search,setSearch]=useState("");
  const [open,setOpen]=useState(false);
  // Sync cc state when value prop changes externally (e.g. profile loads after mount)
  useEffect(()=>{const detected=detectCC(value).cc;if(detected!==cc)setCc(detected);},[value]);
  const num=detectCC(value).num;
  const filtered=COUNTRY_CODES.filter(c=>!search||c.name.toLowerCase().includes(search.toLowerCase())||c.v.includes(search));
  const pickCC=v=>{setCc(v);setOpen(false);setSearch("");onChange(v+num);};
  const flag=COUNTRY_CODES.find(c=>c.v===cc)?.f||"🌍";
  return(
    <div style={{display:"flex",gap:8}}>
      <div style={{position:"relative",flexShrink:0}}>
        <button type="button" onClick={()=>setOpen(o=>!o)} onBlur={()=>setTimeout(()=>setOpen(false),150)}
          style={{...inp,width:90,display:"flex",alignItems:"center",justifyContent:"space-between",gap:4,cursor:"pointer",background:"white",padding:"11px 10px"}}>
          <span style={{fontSize:16}}>{flag}</span><span style={{fontSize:12,fontWeight:700,color:"#333"}}>{cc}</span><span style={{fontSize:9,color:"#AAA"}}>▾</span>
        </button>
        {open&&(
          <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,zIndex:300,background:"white",border:"1px solid #E8E6E1",borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,0.12)",width:250,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <input autoFocus value={search} onChange={e=>setSearch(e.target.value)}
              placeholder={lang==="ar"?"ابحث عن دولة...":"Search country..."}
              style={{border:"none",borderBottom:"1px solid #E8E6E1",padding:"10px 12px",fontSize:13,outline:"none",fontFamily:"inherit",background:"#FAFAF9"}}/>
            <div style={{overflowY:"auto",maxHeight:200}}>
              {filtered.length===0
                ?<div style={{padding:"12px",color:"#AAA",textAlign:"center",fontSize:13}}>{lang==="ar"?"لا توجد نتائج":"No results"}</div>
                :filtered.map(c=>(
                  <div key={c.v} onMouseDown={()=>pickCC(c.v)}
                    style={{padding:"8px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:8,fontSize:13,background:cc===c.v?"#F0F7F3":"white"}}>
                    <span style={{fontSize:17}}>{c.f}</span>
                    <span style={{flex:1,fontWeight:cc===c.v?700:400,color:"#222"}}>{c.name}</span>
                    <span style={{color:"#888",fontSize:12,fontWeight:600}}>{c.v}</span>
                  </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <input value={num} onChange={e=>onChange(cc+e.target.value)} type="tel"
        style={{...inp,flex:1,direction:"ltr",textAlign:"left"}}
        placeholder={lang==="ar"?"رقم الهاتف":"Phone number"}/>
    </div>
  );
};

const T={
  ar:{
    brand:"سفّرني",brandEn:"SAFFERNI",
    tagline:"وجهتك علينا... بس قلنا وين!",
    subtitle:"خدمة نقل بين المحافظات — من سوريا لعمّان وبيروت.",
    nav:{home:"الرئيسية",pricing:"الأسعار",contact:"تواصل معنا",book:"احجز الآن",login:"تسجيل الدخول",logout:"خروج",admin:"لوحة الإدارة",driver:"لوحة السائق",apply:"سجّل كسائق",profile:"حسابي"},
    about:{title:"من نحن",p1:"سفّرني هي خدمة نقل بين المحافظات تربط سوريا بعمّان وبيروت.",p2:"سائقونا محترفون وذوو خبرة، ونلتزم بالمواعيد المحددة.",p3:"سواء كنت مسافراً لوحدك أو مع عائلتك، عندنا الخيار المناسب لك."},
    features:[
      {icon:"🛣️",t:"١٤ محافظة سورية",d:"من الصحراء إلى الشاطئ، ومن الجبال إلى الوديان — نربط كل محافظات سوريا وما وراءها حتى عمّان وبيروت"},
      {icon:"🚗",t:"سيارة أو فان",d:"احجز مقعد واحد في سيارة مشتركة، أو استأجر سيارة كاملة لحد ٤ ركاب، أو فان لحد ١٠ ركاب — الخيار بيدك"},
      {icon:"💜",t:"رحلات للنساء فقط — قريباً",d:"مو مرتاحة تسافرين مع رجال؟ عندنا سيارات مخصصة للنساء فقط — سافري براحة بال 💅"},
    ],
    deal:{from:"من",to:"إلى",selectCity:"اختر المحافظة",selectDest:"اختر الوجهة",selectFromFirst:"اختر نقطة الانطلاق أولاً",dateRange:"أي وقت بين",dateFrom:"من تاريخ",dateTo:"إلى تاريخ",name:"الاسم",phone:"رقم الهاتف",submit:"خبرني!",fillAll:"يرجى ملء جميع الحقول",confirmTitle:"تم تسجيل طلبك!",confirmMsg:"سنخبرك عبر واتساب لما يتوفر مقعد فاضي.",confirmClose:"تمام"},
    b:{title:"احجز رحلة خاصة",searchTitle:"ابحث عن رحلة",searchDate:"تاريخ السفر",searchBtn:"ابحث",noTrips:"لا توجد رحلات متاحة",customBook:"احجز رحلة خاصة",availableTrips:"الرحلات المتاحة",bookSeat:"احجز مقعد",seatsLeft:"مقاعد متبقية",from:"من",to:"إلى",filterGender:"نوع الرحلة",mixedOnly:"مختلط",womenOnly:"نساء فقط",type:"نوع الحجز",seat:"مقعد واحد",car:"سيارة كاملة (حتى ٤ ركاب)",van:"فان (حتى ١٠ ركاب)",date:"التاريخ",time:"الوقت",name:"الاسم الكامل",phone:"رقم الهاتف",passengers:"عدد الركاب",bags:"عدد الحقائب",notes:"ملاحظات إضافية",submit:"تأكيد الحجز",selectCity:"اختر المحافظة",selectDest:"اختر الوجهة",selectFromFirst:"اختر نقطة الانطلاق أولاً",price:"السعر",fillAll:"يرجى ملء جميع الحقول المطلوبة",carOnlyNote:"هذا المسار متاح للسيارة الكاملة فقط",formNote:"عبّي المعلومات وبنتواصل معك",payment:"طريقة الدفع",cash:"كاش",crypto:"عملات رقمية",shamcash:"شام كاش",shamcashSoon:"قريباً...",cryptoNote:"أرسل المبلغ بـ USDT على شبكة BEP20 إلى العنوان التالي:",copied:"تم النسخ!",copyAddress:"نسخ العنوان",confirmTitle:"تم الحجز بنجاح!",confirmRef:"رقم الحجز",confirmMsg:"سيتم إرسال تأكيد الحجز عبر واتساب مع تعليمات التواصل مع السائق.",confirmClose:"إغلاق",rateTrip:"قيّم رحلتك",submitRating:"إرسال التقييم",ratingThanks:"شكراً على تقييمك!"},
    pricing:{title:"الأسعار",desc:"أسعار واضحة وثابتة — بدون مفاجآت",route:"المسار",seat:"مقعد",car:"سيارة (٤ ركاب)",van:"فان (١٠ ركاب)",note:"الأسعار بالدولار الأمريكي — نفس الأسعار بالاتجاهين",carOnly:"سيارة فقط"},
    contact:{title:"تواصل معنا",desc:"لأي استفسار أو حجز — نحن بخدمتك",email:"البريد الإلكتروني",whatsapp:"واتساب",hours:"ساعات العمل",hoursVal:"٧ أيام في الأسبوع، ٢٤ ساعة"},
    auth:{
      login:"تسجيل الدخول",signup:"إنشاء حساب",
      email:"البريد الإلكتروني",password:"كلمة المرور",
      fullName:"الاسم الكامل",phone:"رقم الهاتف",dob:"تاريخ الميلاد",
      loginBtn:"دخول",signupBtn:"إنشاء حساب",
      noAccount:"ليس لديك حساب؟",haveAccount:"لديك حساب؟",
      error:"حدث خطأ، حاول مرة أخرى",
      forgotPassword:"نسيت كلمة المرور؟",
      sendOtp:"إرسال كود التحقق",
      verifyOtp:"تحقق من الكود",
      newPassword:"كلمة المرور الجديدة",
      resetPassword:"تغيير كلمة المرور",
      backToLogin:"← العودة لتسجيل الدخول",
      otpSent:"تم إرسال كود التحقق إلى",
      otpWrong:"الكود غير صحيح، حاول مرة أخرى",
      passwordUpdated:"تم تحديث كلمة المرور بنجاح!",
      createAccount:"إنشاء الحساب",
      passwordHint:"ستستخدم هذه الكلمة لتسجيل الدخول لاحقاً بالبريد الإلكتروني",
      locationQ:"هل أنت حالياً في سوريا؟",
      inSyria:"نعم، أنا في سوريا",
      notInSyria:"لا، أنا خارج سوريا",
      sendSmsCode:"إرسال كود SMS",
      emailOtpSent:"تم إرسال كود التحقق إلى بريدك الإلكتروني",
    },
    apply:{title:"سجّل كسائق",desc:"انضم إلى فريق سفّرني وابدأ بنشر رحلاتك",alreadyApplied:"طلبك قيد المراجعة أو تم قبوله",fullName:"الاسم الكامل",phone:"رقم الهاتف",city:"مدينتك",carType:"نوع السيارة",carModel:"موديل السيارة",licensePlate:"رقم اللوحة",notes:"ملاحظات إضافية",submit:"تقديم الطلب",success:"تم إرسال طلبك! سنراجعه ونتواصل معك قريباً.",fillAll:"يرجى ملء جميع الحقول المطلوبة"},
    admin:{title:"لوحة الإدارة",applications:"طلبات السائقين",editRequests:"طلبات تعديل الوقت",drivers:"السائقون",allTrips:"كل الرحلات",pending:"قيد المراجعة",approved:"مقبول",denied:"مرفوض",approve:"قبول",deny:"رفض",approveTrip:"قبول الرحلة",noApps:"لا توجد طلبات",noTrips:"لا توجد رحلات",revokeAndDelete:"إلغاء وحذف رحلاته",cancelTrip:"إلغاء",deleteTrip:"حذف",filterByDriver:"فلتر حسب السائق",filterByDate:"فلتر حسب التاريخ",allDrivers:"كل السائقين",phone:"الهاتف",city:"المدينة",car:"السيارة",requestedTime:"الوقت المطلوب",currentTime:"الوقت الحالي",driver:"السائق",bookings:"حجوزات",notApprovedYet:"قيد المراجعة"},
    driver:{title:"لوحة السائق",addTrip:"أضف رحلة",from:"من",to:"إلى",date:"التاريخ",time:"الوقت",pricePerSeat:"سعر المقعد ($)",totalSeats:"عدد المقاعد",carType:"نوع السيارة",genderType:"نوع الرحلة",mixed:"مختلط 🚗",womenOnly:"نساء فقط 💜",submit:"نشر الرحلة",myTrips:"رحلاتي",noTrips:"لم تنشر أي رحلات بعد",cancel:"إلغاء",requestTimeEdit:"طلب تعديل الوقت",newTime:"الوقت الجديد",submitRequest:"إرسال الطلب",selectCity:"اختر المحافظة",fillAll:"يرجى ملء جميع الحقول",success:"تم إرسال الرحلة للمراجعة!",notApproved:"طلبك قيد المراجعة. سنتواصل معك عند الموافقة.",limitReached:"وصلت الحد الأقصى من الرحلات (١٠ رحلات)",dayLimitReached:"لا يمكن إضافة أكثر من رحلتين في نفس اليوم",timeTooClose:"يجب أن يكون الفارق ٥ ساعات على الأقل بين رحلتي نفس اليوم",noticeRequired:"يجب نشر الرحلة قبل موعدها بساعتين على الأقل",bookings:"حجز",requestSent:"تم إرسال طلب التعديل للمراجعة",pendingApproval:"⏳ قيد المراجعة من الإدارة"},
    profile:{
      title:"حسابي",editProfile:"تعديل الملف الشخصي",
      upcomingTrips:"رحلاتي القادمة",pastTrips:"رحلاتي السابقة",
      applyDriver:"التقديم كسائق",applicationStatus:"حالة الطلب",
      noUpcoming:"لا توجد رحلات قادمة",noPast:"لا توجد رحلات سابقة",
      cancelBooking:"إلغاء الحجز",cancelConfirm:"هل أنت متأكد من إلغاء هذا الحجز؟",
      rateNow:"قيّم الآن",saveChanges:"حفظ التغييرات",saved:"تم الحفظ ✓",
      changePassword:"تغيير كلمة المرور",currentPassword:"كلمة المرور الحالية",
      newPassword:"كلمة المرور الجديدة",passwordChanged:"تم تغيير كلمة المرور",
      tabs:{profile:"الملف الشخصي",upcoming:"القادمة",past:"السابقة",apply:"كن سائقاً"},
      driverStatus:{pending:"طلبك قيد المراجعة ⏳",approved:"أنت سائق معتمد ✓",denied:"تم رفض طلبك"},
    },
    footer:"جميع الحقوق محفوظة",
  },
  en:{
    brand:"سفّرني",brandEn:"SAFFERNI",
    tagline:"Your destination is on us — just tell us where!",
    subtitle:"Intercity transport from Syria to Amman and Beirut.",
    nav:{home:"Home",pricing:"Pricing",contact:"Contact",book:"Book Now",login:"Login",logout:"Logout",admin:"Admin Panel",driver:"Driver Panel",apply:"Become a Driver",profile:"My Account"},
    about:{title:"About Us",p1:"Safferni is an intercity transport service connecting Syria with Amman and Beirut.",p2:"Our drivers are experienced professionals, and we stick to our schedules.",p3:"Whether you're traveling solo or with family, we have the right option for you."},
    features:[
      {icon:"🛣️",t:"14 Syrian Governorates",d:"From the desert to the beach, from the mountains to the valleys — connecting every Syrian governorate and beyond to Amman and Beirut"},
      {icon:"🚗",t:"Car or van",d:"Book a single seat in a shared car, rent a full car for up to 4, or a van for up to 10 — your choice"},
      {icon:"💜",t:"Women-only rides — Coming Soon",d:"Not comfortable riding with men? We have dedicated cars for women only — travel with peace of mind 💅"},
    ],
    deal:{from:"From",to:"To",selectCity:"Select city",selectDest:"Select destination",selectFromFirst:"Select origin first",dateRange:"Anytime between",dateFrom:"From date",dateTo:"To date",name:"Name",phone:"Phone number",submit:"Let me know!",fillAll:"Please fill all fields",confirmTitle:"You're on the list!",confirmMsg:"We'll notify you via WhatsApp when a seat is available.",confirmClose:"Got it"},
    b:{title:"Book a Custom Ride",searchTitle:"Find a Trip",searchDate:"Travel Date",searchBtn:"Search",noTrips:"No trips available",customBook:"Book a custom ride",availableTrips:"Available Trips",bookSeat:"Book a Seat",seatsLeft:"seats left",from:"From",to:"To",filterGender:"Trip Type",mixedOnly:"Mixed",womenOnly:"Women Only",type:"Booking Type",seat:"Single Seat",car:"Full Car (up to 4 pax)",van:"Van (up to 10 pax)",date:"Date",time:"Time",name:"Full Name",phone:"Phone Number",passengers:"Passengers",bags:"Bags",notes:"Additional Notes",submit:"Confirm Booking",selectCity:"Select city",selectDest:"Select destination",selectFromFirst:"Select origin first",price:"Price",fillAll:"Please fill all required fields",carOnlyNote:"This route is available for whole car only",formNote:"Fill in the details and we'll get back to you",payment:"Payment Method",cash:"Cash",crypto:"Crypto",shamcash:"Sham Cash",shamcashSoon:"Coming soon...",cryptoNote:"Send the amount in USDT on BEP20 network to the following address:",copied:"Copied!",copyAddress:"Copy Address",confirmTitle:"Booking Confirmed!",confirmRef:"Booking Reference",confirmMsg:"Your booking confirmation will be sent to you via WhatsApp along with instructions on how to connect with the driver.",confirmClose:"Close",rateTrip:"Rate Your Trip",submitRating:"Submit Rating",ratingThanks:"Thanks for your rating!"},
    pricing:{title:"Pricing",desc:"Clear, fixed prices — no surprises",route:"Route",seat:"Seat",car:"Car (4 pax)",van:"Van (10 pax)",note:"Prices in USD — same prices both directions",carOnly:"Car only"},
    contact:{title:"Contact Us",desc:"For any inquiries or bookings — we're here for you",email:"Email",whatsapp:"WhatsApp",hours:"Working Hours",hoursVal:"7 days a week, 24 hours"},
    auth:{
      login:"Login",signup:"Sign Up",
      email:"Email Address",password:"Password",
      fullName:"Full Name",phone:"Phone Number",dob:"Date of Birth",
      loginBtn:"Login",signupBtn:"Create Account",
      noAccount:"Don't have an account?",haveAccount:"Already have an account?",
      error:"An error occurred, please try again",
      forgotPassword:"Forgot your password?",
      sendOtp:"Send Verification Code",
      verifyOtp:"Verify Code",
      newPassword:"New Password",
      resetPassword:"Reset Password",
      backToLogin:"← Back to Login",
      otpSent:"Verification code sent to",
      otpWrong:"Incorrect code, please try again",
      passwordUpdated:"Password updated successfully!",
      createAccount:"Create Account",
      passwordHint:"You'll use this password to log in later with your email",
      locationQ:"Are you currently located in Syria?",
      inSyria:"Yes, I'm in Syria",
      notInSyria:"No, I'm outside Syria",
      sendSmsCode:"Send SMS Code",
      emailOtpSent:"Verification code sent to your email",
    },
    apply:{title:"Become a Driver",desc:"Join the Safferni team and start posting your trips",alreadyApplied:"Your application is under review or already approved",fullName:"Full Name",phone:"Phone Number",city:"Your City",carType:"Car Type",carModel:"Car Model",licensePlate:"License Plate",notes:"Additional Notes",submit:"Submit Application",success:"Application submitted! We'll review it and get back to you soon.",fillAll:"Please fill all required fields"},
    admin:{title:"Admin Panel",applications:"Driver Applications",editRequests:"Time Edit Requests",drivers:"Drivers",allTrips:"All Trips",pending:"Pending",approved:"Approved",denied:"Denied",approve:"Approve",deny:"Deny",approveTrip:"Approve Trip",noApps:"No applications",noTrips:"No trips",revokeAndDelete:"Revoke & Delete Trips",cancelTrip:"Cancel",deleteTrip:"Delete",filterByDriver:"Filter by Driver",filterByDate:"Filter by Date",allDrivers:"All Drivers",phone:"Phone",city:"City",car:"Car",requestedTime:"Requested Time",currentTime:"Current Time",driver:"Driver",bookings:"bookings",notApprovedYet:"Pending Review"},
    driver:{title:"Driver Panel",addTrip:"Add a Trip",from:"From",to:"To",date:"Date",time:"Time",pricePerSeat:"Price per Seat ($)",totalSeats:"Total Seats",carType:"Car Type",genderType:"Trip Type",mixed:"Mixed 🚗",womenOnly:"Women Only 💜",submit:"Post Trip",myTrips:"My Trips",noTrips:"You haven't posted any trips yet",cancel:"Cancel",requestTimeEdit:"Request Time Edit",newTime:"New Time",submitRequest:"Submit Request",selectCity:"Select city",fillAll:"Please fill all fields",success:"Trip submitted for review!",notApproved:"Your application is under review. We'll contact you when approved.",limitReached:"You've reached the maximum of 10 trips",dayLimitReached:"Maximum 2 trips per day allowed",timeTooClose:"Trips on the same day must be at least 5 hours apart",noticeRequired:"Trips must be posted at least 2 hours before departure",bookings:"bookings",requestSent:"Time edit request sent for review",pendingApproval:"⏳ Pending admin approval"},
    profile:{
      title:"My Account",editProfile:"Edit Profile",
      upcomingTrips:"Upcoming Trips",pastTrips:"Past Trips",
      applyDriver:"Apply as Driver",applicationStatus:"Application Status",
      noUpcoming:"No upcoming trips",noPast:"No past trips",
      cancelBooking:"Cancel Booking",cancelConfirm:"Are you sure you want to cancel this booking?",
      rateNow:"Rate Now",saveChanges:"Save Changes",saved:"Saved ✓",
      changePassword:"Change Password",currentPassword:"Current Password",
      newPassword:"New Password",passwordChanged:"Password changed successfully",
      tabs:{profile:"Profile",upcoming:"Upcoming",past:"Past Trips",apply:"Become a Driver"},
      driverStatus:{pending:"Your application is under review ⏳",approved:"You are an approved driver ✓",denied:"Your application was denied"},
    },
    footer:"All rights reserved",
  },
};

const LogoSVG=({light})=>(<svg width="48" height="48" viewBox="0 0 48 48"><path d="M18 4 L14 44 L34 44 L30 4 Z" fill={light?"rgba(255,255,255,0.15)":"#1B3A2A"}/><rect x="22.5" y="10" width="3" height="7" rx="1.5" fill={light?"rgba(255,255,255,0.6)":"#F0F7F3"}/><rect x="22.5" y="21" width="3" height="7" rx="1.5" fill={light?"rgba(255,255,255,0.6)":"#F0F7F3"}/><rect x="22.5" y="32" width="3" height="7" rx="1.5" fill={light?"rgba(255,255,255,0.6)":"#F0F7F3"}/></svg>);

export default function App(){
  const [lang,setLang]=useState("ar");
  const [page,setPage]=useState("home");
  const [menuOpen,setMenuOpen]=useState(false);
  const [user,setUser]=useState(null);
  const [profile,setProfile]=useState(null);
  const [driverApproved,setDriverApproved]=useState(false);
  const didLogOut=useRef(false);
  const pendingSignupData=useRef(null);
  const [loading,setLoading]=useState(true);

  // Booking form
  const [form,setForm]=useState({from:"",to:"",type:"car",date:"",time:"",name:"",phone:"",passengers:"1",bags:"0",notes:"",payment:"cash"});
  const [submitted,setSubmitted]=useState(false);
  const [bookingRef,setBookingRef]=useState("");
  const [error,setError]=useState("");
  const [copied,setCopied]=useState(false);
  const [shareCopiedId,setShareCopiedId]=useState(null);

  // Trip search
  const [searchDate,setSearchDate]=useState("");
  const [searchFrom,setSearchFrom]=useState("");
  const [searchTo,setSearchTo]=useState("");
  const [searchGender,setSearchGender]=useState("mixed");
  const [tripSort,setTripSort]=useState("time");
  const [savedRoutes,setSavedRoutes]=useState(()=>{try{return JSON.parse(localStorage.getItem("safferni_saved_routes")||"[]");}catch{return[];}});
  const [trips,setTrips]=useState([]);
  const [tripsLoaded,setTripsLoaded]=useState(false);
  const [selectedTrip,setSelectedTrip]=useState(null);
  const [tripBooking,setTripBooking]=useState({name:"",phone:"",seats:1,payment:"cash"});
  const [tripBooked,setTripBooked]=useState(false);
  const [lastBookingId,setLastBookingId]=useState(null);
  const [tripRating,setTripRating]=useState(0);
  const [seatBookingError,setSeatBookingError]=useState("");
  const [ratingSubmitted,setRatingSubmitted]=useState(false);
  const [selectedBookingDetail,setSelectedBookingDetail]=useState(null);
  const [selectedTripDetail,setSelectedTripDetail]=useState(null);
  const [tripDetailBookings,setTripDetailBookings]=useState([]);
  const [tripDetailLoading,setTripDetailLoading]=useState(false);

  // AUTH STATE — new unified flow
  // authStep: "choice" | "login" | "signup_country" | "signup_info_sy" | "signup_otp_email" | "signup_info_other" | "signup_otp_sms" | "forgot_phone" | "forgot_newpass"
  const [authStep,setAuthStep]=useState("choice");
  const [authForm,setAuthForm]=useState({fullName:"",email:"",phone:"+963",password:"",dob:""});
  const [authOtp,setAuthOtp]=useState("");
  const [authError,setAuthError]=useState("");
  const [authPhoneExists,setAuthPhoneExists]=useState(false);
  const [authLoading,setAuthLoading]=useState(false);
  const [authSuccess,setAuthSuccess]=useState("");
  // temp storage during signup otp flow
  const [pendingPhone,setPendingPhone]=useState("");

  // Apply
  const [applyForm,setApplyForm]=useState({fullName:"",phone:"",dob:"",carKindYear:"",carLicense:"",driverLicenseNum:"",notes:"",hasWifi:false,hasWater:false,hasAc:false});
  const [applySubmitted,setApplySubmitted]=useState(false);
  const [applyError,setApplyError]=useState("");
  const [driverApplication,setDriverApplication]=useState(null);
  const [appRef,setAppRef]=useState("");

  // Admin
  const [applications,setApplications]=useState([]);
  const [adminDrivers,setAdminDrivers]=useState([]);
  const [adminAllTrips,setAdminAllTrips]=useState([]);
  const [editRequests,setEditRequests]=useState([]);
  const [adminTab,setAdminTab]=useState("applications");
  const [tripFilterDriver,setTripFilterDriver]=useState("");
  const [tripFilterDate,setTripFilterDate]=useState("");
  const [draggedTripId,setDraggedTripId]=useState(null);
  const [dragOverStatus,setDragOverStatus]=useState(null);
  const [dashStats,setDashStats]=useState({activeTrips:0,totalDrivers:0,bookingsToday:0,popularRoute:"—"});
  const [selectedDriver,setSelectedDriver]=useState(null);
  const [driverProfile,setDriverProfile]=useState({fullName:"",dob:"",idNumber:"",carKindYear:"",carPlate:"",transportLicense:"",driverLicense:"",hasWifi:false,hasWater:false,hasAc:false});
  const [driverPublicPage,setDriverPublicPage]=useState(null);
  const [driverProfileMsg,setDriverProfileMsg]=useState("");

  // Driver panel
  const [driverTrips,setDriverTrips]=useState([]);
  const [tripForm,setTripForm]=useState({from:"",to:"",date:"",time:"",pricePerSeat:"",totalSeats:"4",carType:"",genderType:"mixed"});
  const [tripError,setTripError]=useState("");
  const [tripSuccess,setTripSuccess]=useState(false);
  const [editRequestForm,setEditRequestForm]=useState({tripId:null,newTime:""});
  const [showEditModal,setShowEditModal]=useState(false);
  const [editRequestMsg,setEditRequestMsg]=useState("");
  const [bookingCounts,setBookingCounts]=useState({});

  // Reviews
  const [reviewSidebarDriver,setReviewSidebarDriver]=useState(null);
  const [driverReviews,setDriverReviews]=useState([]);
  const [reviewForm,setReviewForm]=useState({rating:0,text:""});
  const [reviewSubmitted,setReviewSubmitted]=useState(false);

  // Promo
  const [promoCode,setPromoCode]=useState("");
  const [promoDiscount,setPromoDiscount]=useState(null);
  const [promoError,setPromoError]=useState("");
  const [promoCodes,setPromoCodes]=useState([]);
  const [newPromo,setNewPromo]=useState({code:"",discount_type:"fixed",discount_value:"",max_uses:"",expires_at:""});

  // Trip passengers (admin expand)
  const [expandedTrip,setExpandedTrip]=useState(null);
  const [tripPassengers,setTripPassengers]=useState({});

  // Passenger profile page
  const [profileTab,setProfileTab]=useState("profile");
  const [profileEdit,setProfileEdit]=useState({fullName:"",phone:"",email:"",emergencyEmail:""});
 const [profileSaved,setProfileSaved]=useState(false);
const [profileEditing,setProfileEditing]=useState(false);
const [driverEditing,setDriverEditing]=useState(false);
  const [upcomingBookings,setUpcomingBookings]=useState([]);
  const [pastBookings,setPastBookings]=useState([]);
  const [profileLoading,setProfileLoading]=useState(false);
  const [pwForm,setPwForm]=useState({next:""});
  const [pwMsg,setPwMsg]=useState("");

  // Notifications
  const [notifications,setNotifications]=useState([]);
  const [showNotifications,setShowNotifications]=useState(false);
  const [adminActivity,setAdminActivity]=useState([]);

  const t=T[lang];const b=t.b;const adm=t.admin;const drv=t.driver;const prof=t.profile;
  const isRTL=lang==="ar";
  const searchRef=useRef(null);
  const bkRef=useRef(null);
  const isAdmin=user&&ADMIN_EMAILS.includes(user.email);
  const isDriverApplied=driverApproved||(driverApplication&&(driverApplication.status==="pending"||driverApplication.status==="approved"));
  const fade={animation:"fadeUp 0.7s ease both"};
  const unreadCount=notifications.filter(n=>!n.read).length;

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{
      setUser(session?.user??null);
      if(session?.user) loadProfile(session.user);
      else setLoading(false);
    });
    const{data:{subscription}}=supabase.auth.onAuthStateChange((event,session)=>{
      if(event==="PASSWORD_RECOVERY"){setPage("login");setAuthStep("forgot_newpass");return;}
      if(event==="SIGNED_OUT"){didLogOut.current=false;}
      if((event==="TOKEN_REFRESHED"||event==="SIGNED_IN")&&didLogOut.current&&session?.user){
        // Stale session resurfaced after explicit logout — kill it
        supabase.auth.signOut({scope:"global"}).catch(()=>{});return;
      }
      setUser(session?.user??null);
      if(session?.user) loadProfile(session.user);
      else{setProfile(null);setDriverApproved(false);setLoading(false);}
    });
    return()=>subscription.unsubscribe();
  },[]);

  useEffect(()=>{if(user) checkDriverApplication();},[user]);

  useEffect(()=>{
    const tripId=new URLSearchParams(window.location.search).get("trip");
    if(!tripId) return;
    window.history.replaceState({},"",window.location.pathname);
    supabase.from("trips").select("*").eq("id",tripId).eq("status","active").eq("approved",true).maybeSingle().then(({data})=>{
      if(data){setSelectedTrip(data);setTripBooked(false);setRatingSubmitted(false);setTripRating(0);setTripBooking({name:"",phone:"",seats:1,payment:"cash"});}
    });
  },[]);

  const timeAgo=(ts)=>{const diff=Date.now()-new Date(ts).getTime();const m=Math.floor(diff/60000);if(m<1)return lang==="ar"?"الآن":"just now";if(m<60)return lang==="ar"?`منذ ${m}د`:`${m}m ago`;const h=Math.floor(m/60);if(h<24)return lang==="ar"?`منذ ${h}س`:`${h}h ago`;const d=Math.floor(h/24);return lang==="ar"?`منذ ${d}ي`:`${d}d ago`;};
  const createNotif=async(userId,type,title,message)=>{if(!userId)return;try{await supabase.from("notifications").insert({user_id:userId,type,title,message});}catch(e){}};
  const markNotifRead=async(id)=>{await supabase.from("notifications").update({read:true}).eq("id",id);setNotifications(prev=>prev.map(n=>n.id===id?{...n,read:true}:n));};
  const markAllRead=async()=>{if(!user)return;await supabase.from("notifications").update({read:true}).eq("user_id",user.id).eq("read",false);setNotifications(prev=>prev.map(n=>({...n,read:true})));};
  const loadAdminActivity=async()=>{const[{data:apps},{data:bks},{data:edits}]=await Promise.all([supabase.from("driver_applications").select("id,full_name,status,created_at").order("created_at",{ascending:false}).limit(20),supabase.from("bookings").select("id,passenger_name,seats,status,created_at,trips(from_city,to_city,trip_date)").order("created_at",{ascending:false}).limit(20),supabase.from("trip_edit_requests").select("id,status,requested_time,created_at,trips(from_city,to_city)").order("created_at",{ascending:false}).limit(10)]);const events=[...(apps||[]).map(a=>({type:"application",id:a.id,title:a.full_name,status:a.status,ts:a.created_at})),...(bks||[]).map(b=>({type:"booking",id:b.id,title:b.passenger_name,status:b.status,seats:b.seats,route:`${gc(b.trips?.from_city)?.[lang]||b.trips?.from_city||"?"}→${gc(b.trips?.to_city)?.[lang]||b.trips?.to_city||"?"}`,date:b.trips?.trip_date,ts:b.created_at})),...(edits||[]).map(e=>({type:"edit",id:e.id,status:e.status,route:`${gc(e.trips?.from_city)?.[lang]||e.trips?.from_city||"?"}→${gc(e.trips?.to_city)?.[lang]||e.trips?.to_city||"?"}`,newTime:e.requested_time,ts:e.created_at}))].sort((a,b)=>new Date(b.ts)-new Date(a.ts));setAdminActivity(events);};

  useEffect(()=>{
    if(!user?.id){setNotifications([]);return;}
    supabase.from("notifications").select("*").eq("user_id",user.id).order("created_at",{ascending:false}).limit(50).then(({data})=>{if(data)setNotifications(data);});
    const ch=supabase.channel(`notifs-${user.id}`).on("postgres_changes",{event:"INSERT",schema:"public",table:"notifications",filter:`user_id=eq.${user.id}`},pl=>{setNotifications(prev=>[pl.new,...prev]);}).subscribe();
    return()=>supabase.removeChannel(ch);
  },[user?.id]);
  useEffect(()=>{if(adminTab==="activity"&&isAdmin)loadAdminActivity();},[adminTab]);
  useEffect(()=>{if(page==="admin"&&isAdmin){loadAdminData();if(adminTab==="promoCodes") loadPromoCodes();}},[page,adminTab]);
  useEffect(()=>{if(page==="driver"&&user){setSelectedDriver(null);loadProfile(user);loadDriverData();}},[page,user]);
  useEffect(()=>{
    if(page==="profile"&&user){
      setProfileEdit({fullName:profile?.full_name||"",phone:profile?.phone||"",email:profile?.email||user.email||"",emergencyEmail:profile?.emergency_contact_email||""});
      setApplyForm(f=>({...f,fullName:profile?.full_name||"",phone:profile?.phone||""}));
      loadPassengerBookings();
    }
  },[page,user,profile]);

  const loadProfile=async(u)=>{
    const{data,error}=await supabase.from("profiles").select("*").eq("id",u.id).maybeSingle();
    if(error){console.error("loadProfile failed",error);setLoading(false);return;}
    if(data){setProfile(data);setDriverApproved(data?.role==="driver");setLoading(false);return;}
    // No profile yet — race-free creation from pending signup data
    const stash=pendingSignupData.current;
    const matchesEmail=stash?.email&&stash.email===u.email;
    const matchesPhone=stash?.phone&&stash.phone===u.phone;
    if(stash&&(matchesEmail||matchesPhone)){
      const profileEmail=stash.email||u.email||null;
      const role=profileEmail&&ADMIN_EMAILS.includes(profileEmail)?"admin":"passenger";
      const newProfile={id:u.id,email:profileEmail,full_name:stash.full_name,phone:stash.phone||u.phone||"",role,date_of_birth:stash.date_of_birth||null};
      const{error:upErr}=await supabase.from("profiles").upsert(newProfile);
      if(upErr){console.error("profile upsert failed",upErr);setLoading(false);return;}
      pendingSignupData.current=null;
      setProfile(newProfile);setDriverApproved(false);
    } else {
      setProfile(null);setDriverApproved(false);
    }
    setLoading(false);
  };

  const checkDriverApplication=async()=>{
    if(!user) return;
    const{data}=await supabase.from("driver_applications").select("*").eq("user_id",user.id).order("created_at",{ascending:false}).limit(1).maybeSingle();
    setDriverApplication(data);
  };

  const handleLogout=async()=>{
    didLogOut.current=true;
    setUser(null);setProfile(null);setDriverApproved(false);setDriverApplication(null);setPage("home");
    await supabase.auth.signOut({scope:"global"}).catch(()=>{});
    Object.keys(localStorage).filter(k=>k.startsWith("sb-")).forEach(k=>localStorage.removeItem(k));
  };

  // ─── AUTH FLOW ────────────────────────────────────────────────────────────

  const resetAuth=()=>{
    setAuthStep("choice");setAuthForm({fullName:"",email:"",phone:"+963",password:"",dob:""});
    setAuthOtp("");setAuthError("");setAuthPhoneExists(false);setAuthSuccess("");setPendingPhone("");setAuthLoading(false);
  };

  const fullPhone=()=>authForm.phone;

  // Step 1: Login with email or phone + password
  const handleLogin=async()=>{
    const idInput=authForm.email.trim();
    if(!idInput||!authForm.password){setAuthError(lang==="ar"?"يرجى إدخال البريد/الهاتف وكلمة المرور":"Enter your email/phone and password");return;}
    didLogOut.current=false;
    setAuthLoading(true);setAuthError("");
    // Detect: starts with + or only digits/spaces/dashes (no @) → phone, else email
    const isPhone=/^\+?[\d\s-]+$/.test(idInput)&&!idInput.includes("@");
    const credentials=isPhone
      ?{phone:idInput.replace(/[\s-]/g,""),password:authForm.password}
      :{email:idInput.toLowerCase(),password:authForm.password};
    const{error}=await supabase.auth.signInWithPassword(credentials);
    if(error){
      if(error.message?.toLowerCase().includes("invalid")) setAuthError(lang==="ar"?"بيانات الدخول غير صحيحة":"Invalid credentials");
      else setAuthError(error.message||t.auth.error);
    } else {resetAuth();setPage("home");}
    setAuthLoading(false);
  };

  // Signup Syria: send email OTP code
  const handleSignupSyriaStart=async()=>{
    const phoneNum=detectCC(authForm.phone).num;
    if(!authForm.fullName.trim()||!authForm.dob||!authForm.email.trim()||phoneNum.length<6||!authForm.password){setAuthError(lang==="ar"?"يرجى ملء جميع الحقول":"Please fill all fields");return;}
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authForm.email.trim())){setAuthError(lang==="ar"?"البريد الإلكتروني غير صالح":"Invalid email address");return;}
    if(authForm.password.length<8){setAuthError(lang==="ar"?"كلمة المرور يجب أن تكون ٨ أحرف على الأقل":"Password must be at least 8 characters");return;}
    const ageYears=(Date.now()-new Date(authForm.dob).getTime())/(365.25*24*3600*1000);
    if(isNaN(ageYears)||ageYears<13||ageYears>120){setAuthError(lang==="ar"?"تاريخ الميلاد غير صالح":"Invalid date of birth");return;}
    didLogOut.current=false;
    setAuthLoading(true);setAuthError("");
    const email=authForm.email.trim().toLowerCase();
    const{data:existingEmail}=await supabase.from("profiles").select("id").eq("email",email).maybeSingle();
    if(existingEmail){setAuthError(lang==="ar"?"هذا البريد الإلكتروني مسجل مسبقاً. سجّل الدخول بدلاً من ذلك.":"This email is already registered. Please log in instead.");setAuthLoading(false);return;}
    const{error}=await supabase.auth.signInWithOtp({email,options:{shouldCreateUser:true}});
    if(error){setAuthError(error.message||t.auth.error);setAuthLoading(false);return;}
    // Stash for race-free profile creation in loadProfile
    pendingSignupData.current={email,full_name:authForm.fullName.trim(),phone:authForm.phone,date_of_birth:authForm.dob};
    setAuthStep("signup_otp_email");
    setAuthLoading(false);
  };

  // Signup Syria: verify email OTP — profile creation happens in loadProfile via stash
  const handleSignupSyriaVerify=async()=>{
    if(!authOtp){setAuthError(t.auth.error);return;}
    setAuthLoading(true);setAuthError("");
    const email=authForm.email.trim().toLowerCase();
    const{error}=await supabase.auth.verifyOtp({email,token:authOtp,type:"email"});
    if(error){setAuthError(t.auth.otpWrong);setAuthLoading(false);return;}
    const{error:pwErr}=await supabase.auth.updateUser({password:authForm.password});
    if(pwErr){setAuthError((lang==="ar"?"فشل في تعيين كلمة المرور: ":"Failed to set password: ")+(pwErr.message||""));setAuthLoading(false);return;}
    resetAuth();setPage("home");
    setAuthLoading(false);
  };

  // Resend Syria email OTP
  const handleResendEmailOtp=async()=>{
    setAuthLoading(true);setAuthError("");setAuthSuccess("");
    const email=authForm.email.trim().toLowerCase();
    const{error}=await supabase.auth.signInWithOtp({email,options:{shouldCreateUser:true}});
    if(error){setAuthError(error.message||t.auth.error);}
    else{setAuthSuccess(lang==="ar"?"تم إعادة إرسال الكود إلى بريدك":"Code resent to your email");}
    setAuthLoading(false);
  };

  // Signup Other: send SMS OTP via Supabase phone auth (Twilio configured in Supabase dashboard)
  const handleSignupOtherStart=async()=>{
    if(!authForm.fullName.trim()||detectCC(authForm.phone).num.length<6||!authForm.email.trim()||!authForm.password){setAuthError(lang==="ar"?"يرجى ملء جميع الحقول":"Please fill all fields");return;}
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authForm.email.trim())){setAuthError(lang==="ar"?"البريد الإلكتروني غير صالح":"Invalid email address");return;}
    if(authForm.password.length<8){setAuthError(lang==="ar"?"كلمة المرور يجب أن تكون ٨ أحرف على الأقل":"Password must be at least 8 characters");return;}
    didLogOut.current=false;
    setAuthLoading(true);setAuthError("");
    const email=authForm.email.trim().toLowerCase();
    const phone=fullPhone();
    const[{data:existingPhone},{data:existingEmail}]=await Promise.all([
      supabase.from("profiles").select("id").eq("phone",phone).maybeSingle(),
      supabase.from("profiles").select("id").eq("email",email).maybeSingle(),
    ]);
    if(existingPhone){setAuthPhoneExists(true);setAuthLoading(false);return;}
    if(existingEmail){setAuthError(lang==="ar"?"هذا البريد الإلكتروني مسجل مسبقاً. سجّل الدخول بدلاً من ذلك.":"This email is already registered. Please log in instead.");setAuthLoading(false);return;}
    const{error}=await supabase.auth.signInWithOtp({phone,options:{shouldCreateUser:true}});
    if(error){setAuthError(error.message||t.auth.error);setAuthLoading(false);return;}
    // Stash for race-free profile creation in loadProfile
    pendingSignupData.current={phone,email,full_name:authForm.fullName.trim()};
    setPendingPhone(phone);
    setAuthStep("signup_otp_sms");
    setAuthLoading(false);
  };

  // Signup Other: verify SMS OTP — profile created in loadProfile via stash
  const handleSignupOtherVerify=async()=>{
    if(!authOtp){setAuthError(t.auth.error);return;}
    setAuthLoading(true);setAuthError("");
    const phone=pendingPhone||fullPhone();
    const{error}=await supabase.auth.verifyOtp({phone,token:authOtp,type:"sms"});
    if(error){setAuthError(t.auth.otpWrong);setAuthLoading(false);return;}
    const{error:pwErr}=await supabase.auth.updateUser({password:authForm.password});
    if(pwErr){setAuthError((lang==="ar"?"فشل في تعيين كلمة المرور: ":"Failed to set password: ")+(pwErr.message||""));setAuthLoading(false);return;}
    resetAuth();setPage("home");
    setAuthLoading(false);
  };

  // Resend SMS OTP via Supabase phone auth
  const handleResendPhoneOtp=async()=>{
    setAuthLoading(true);setAuthError("");setAuthSuccess("");
    const phone=pendingPhone||fullPhone();
    const{error}=await supabase.auth.signInWithOtp({phone,options:{shouldCreateUser:true}});
    if(error){setAuthError(error.message||t.auth.error);}
    else{setAuthSuccess(lang==="ar"?"تم إعادة إرسال الكود عبر SMS":"Code resent via SMS");}
    setAuthLoading(false);
  };

  // Forgot password: send reset link to email
  const handleForgotSendEmail=async()=>{
    if(!authForm.email){setAuthError(t.auth.error);return;}
    setAuthLoading(true);setAuthError("");
    const{error}=await supabase.auth.resetPasswordForEmail(authForm.email.trim().toLowerCase(),{redirectTo:window.location.origin});
    if(error){setAuthError(t.auth.error);}
    else{setAuthSuccess(lang==="ar"?"تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني. تحقق من صندوق الوارد.":"Password reset link sent to your email. Check your inbox.");}
    setAuthLoading(false);
  };

  // Forgot password: set new password (reached via email reset link)
  const handleForgotNewPass=async()=>{
    if(!authForm.password||authForm.password.length<8){setAuthError(lang==="ar"?"كلمة المرور يجب أن تكون ٨ أحرف على الأقل":"Password must be at least 8 characters");return;}
    setAuthLoading(true);setAuthError("");
    const{data:meData}=await supabase.auth.getUser();
    const currentUser=meData?.user;
    const{error}=await supabase.auth.updateUser({password:authForm.password});
    if(error){setAuthError(t.auth.error);setAuthLoading(false);return;}
    const email=currentUser?.email||authForm.email;
    await supabase.auth.signOut({scope:"global"}).catch(()=>{});
    const{error:loginErr}=await supabase.auth.signInWithPassword({email,password:authForm.password});
    if(loginErr){setAuthError(t.auth.error);setAuthLoading(false);return;}
    setAuthSuccess(t.auth.passwordUpdated);
    setTimeout(()=>{resetAuth();setPage("home");},1500);
    setAuthLoading(false);
  };

  // ─── PASSENGER PROFILE ────────────────────────────────────────────────────

  const loadTripBookings=async(tripId)=>{
    setTripDetailLoading(true);
    const{data}=await supabase.from("bookings").select("*").eq("trip_id",tripId).neq("status","cancelled").order("created_at",{ascending:false});
    setTripDetailBookings(data||[]);
    setTripDetailLoading(false);
  };

  const loadPassengerBookings=async()=>{
    if(!user) return;
    setProfileLoading(true);
    const today=new Date().toISOString().split("T")[0];
    const{data:all}=await supabase
    .from("bookings").select("*, trips(trip_date,trip_time,from_city,to_city,driver_id,gender_type,price_per_seat,status)")
    .eq("user_id",user.id).neq("status","cancelled")
    .order("created_at",{ascending:false});
  const upcoming=(all||[]).filter(b=>b.trips?.trip_date>=today);
  const past=(all||[]).filter(b=>b.trips?.trip_date<today);
  setUpcomingBookings(upcoming);
  setPastBookings(past);
    setProfileLoading(false);
  };

  const [profileSaving,setProfileSaving]=useState(false);
  const saveProfile=async()=>{
    if(!user||profileSaving) return;
    setProfileSaving(true);
    const{error}=await supabase.from("profiles").update({full_name:profileEdit.fullName,phone:profileEdit.phone,emergency_contact_email:profileEdit.emergencyEmail}).eq("id",user.id);
    setProfileSaving(false);
    if(error){console.error("saveProfile failed",error);return;}
    setProfile(p=>({...p,full_name:profileEdit.fullName,phone:profileEdit.phone,emergency_contact_email:profileEdit.emergencyEmail}));
    setProfileSaved(true);setTimeout(()=>setProfileSaved(false),3000);
  };

  const confirmBooking=async(bookingId)=>{
    const bk=tripDetailBookings.find(b=>b.id===bookingId);
    const{error}=await supabase.rpc("driver_action_booking",{p_booking_id:bookingId,p_action:"confirm"});
    if(error) return;
    setTripDetailBookings(bs=>bs.map(b=>b.id===bookingId?{...b,status:"confirmed"}:b));
    if(bk?.user_id&&selectedTripDetail) createNotif(bk.user_id,"booking_confirmed",lang==="ar"?"تم تأكيد حجزك ✅":"Booking Confirmed ✅",lang==="ar"?`تم تأكيد حجزك على رحلة ${gc(selectedTripDetail.from_city)?.[lang]||selectedTripDetail.from_city} إلى ${gc(selectedTripDetail.to_city)?.[lang]||selectedTripDetail.to_city} بتاريخ ${selectedTripDetail.trip_date}`:`Your booking on ${gc(selectedTripDetail.from_city)?.en||selectedTripDetail.from_city} → ${gc(selectedTripDetail.to_city)?.en||selectedTripDetail.to_city} on ${selectedTripDetail.trip_date} was confirmed by the driver`);
  };

  const rejectBooking=async(bookingId)=>{
    const bk=tripDetailBookings.find(b=>b.id===bookingId);
    const tripId=selectedTripDetail?.id;
    const{error}=await supabase.rpc("driver_action_booking",{p_booking_id:bookingId,p_action:"reject"});
    if(error) return;
    setTripDetailBookings(bs=>bs.map(b=>b.id===bookingId?{...b,status:"cancelled"}:b));
    if(bk&&tripId){
      setSelectedTripDetail(t=>({...t,available_seats:(t.available_seats||0)+bk.seats}));
      setDriverTrips(ts=>ts.map(t=>t.id===tripId?{...t,available_seats:(t.available_seats||0)+bk.seats}:t));
      if(bk.user_id) createNotif(bk.user_id,"booking_rejected",lang==="ar"?"تم رفض حجزك":"Booking Rejected",lang==="ar"?`تم رفض حجزك على رحلة ${gc(selectedTripDetail.from_city)?.[lang]||selectedTripDetail.from_city} إلى ${gc(selectedTripDetail.to_city)?.[lang]||selectedTripDetail.to_city}`:`Your booking on ${gc(selectedTripDetail.from_city)?.en||selectedTripDetail.from_city} → ${gc(selectedTripDetail.to_city)?.en||selectedTripDetail.to_city} was rejected by the driver`);
    }
  };

  const markTripCompleted=async(tripId)=>{
    await supabase.from("trips").update({status:"completed"}).eq("id",tripId);
    setDriverTrips(ts=>ts.map(t=>t.id===tripId?{...t,status:"completed"}:t));
    setSelectedTripDetail(t=>t?.id===tripId?{...t,status:"completed"}:t);
  };

  const cancelBooking=async(bookingId)=>{
    const bk=upcomingBookings.find(b=>b.id===bookingId);
    if(bk?.trips){
      const tripDateTime=new Date(`${bk.trips.trip_date}T${bk.trips.trip_time||"00:00"}`);
      if((tripDateTime-new Date())<24*60*60*1000){
        alert(lang==="ar"?"لا يمكن إلغاء الحجز قبل أقل من 24 ساعة من موعد الرحلة":"Bookings cannot be cancelled less than 24 hours before departure");
        return;
      }
    }
    if(!window.confirm(prof.cancelConfirm)) return;
    const{data:result,error}=await supabase.rpc("cancel_passenger_booking",{p_booking_id:bookingId});
    if(error||!result?.success){
      if(result?.error==="too_late") alert(lang==="ar"?"لا يمكن إلغاء الحجز قبل أقل من 24 ساعة من موعد الرحلة":"Bookings cannot be cancelled less than 24 hours before departure");
      return;
    }
    if(bk?.trips?.driver_id) createNotif(bk.trips.driver_id,"booking_cancelled",lang==="ar"?"إلغاء حجز":"Booking Cancelled",lang==="ar"?`${bk.passenger_name||"راكب"} ألغى حجزه على رحلة ${gc(bk.trips.from_city)?.[lang]||bk.trips.from_city} إلى ${gc(bk.trips.to_city)?.[lang]||bk.trips.to_city} (${bk.trips.trip_date})`:`${bk.passenger_name||"A passenger"} cancelled their booking on ${gc(bk.trips.from_city)?.en||bk.trips.from_city} → ${gc(bk.trips.to_city)?.en||bk.trips.to_city} (${bk.trips.trip_date})`);
    loadPassengerBookings();
  };

  const changePassword=async()=>{
    if(!pwForm.next||pwForm.next.length<8){setPwMsg(lang==="ar"?"كلمة المرور يجب أن تكون ٨ أحرف على الأقل":"Password must be at least 8 characters");return;}
    const{error}=await supabase.auth.updateUser({password:pwForm.next});
    if(error) setPwMsg(t.auth.error);
    else{setPwMsg(prof.passwordChanged+" ✓");setPwForm({next:""});}
    setTimeout(()=>setPwMsg(""),3000);
  };

  const deleteAccount=async()=>{
    if(!window.confirm(lang==="ar"?"هل أنت متأكد تماماً؟ سيتم حذف حسابك وجميع بياناتك نهائياً ولا يمكن التراجع عن ذلك.":"Are you absolutely sure? Your account and all data will be permanently deleted and cannot be recovered.")) return;
    const{data,error}=await supabase.rpc("delete_own_account");
    if(error){alert((lang==="ar"?"حدث خطأ: ":"Error: ")+error.message);return;}
    if(!data?.success&&data?.error==="active_trips"){
      alert(lang==="ar"?"لا يمكن حذف الحساب لأن لديك رحلات قادمة نشطة كراكب أو كسائق. يرجى إلغاؤها أولاً.":"Cannot delete account because you have upcoming active trips as a passenger or driver. Please cancel them first.");
      return;
    }
    didLogOut.current=true;
    await supabase.auth.signOut({scope:"global"}).catch(()=>{});
    Object.keys(localStorage).filter(k=>k.startsWith("sb-")).forEach(k=>localStorage.removeItem(k));
    setUser(null);setProfile(null);setDriverApproved(false);setDriverApplication(null);setPage("home");
    setTimeout(()=>{didLogOut.current=false;},3000);
  };

  // ─── BOOKING HELPERS ──────────────────────────────────────────────────────

  const handleApply=async()=>{
    if(!applyForm.fullName||!applyForm.phone||!applyForm.carKindYear){setApplyError(t.apply.fillAll);return;}
    if(applyForm.dob){
      const cutoff=new Date();cutoff.setFullYear(cutoff.getFullYear()-18);
      if(new Date(applyForm.dob)>cutoff){setApplyError(lang==="ar"?"يجب أن يكون عمرك 18 عامًا على الأقل":"Must be at least 18 years old");return;}
    }
    const ref=genAppRef();
    const{error}=await supabase.from("driver_applications").insert({user_id:user?.id||null,full_name:applyForm.fullName,phone:applyForm.phone,car_type:applyForm.carKindYear,license_plate:applyForm.carLicense,driver_license_number:applyForm.driverLicenseNum,notes:applyForm.notes,app_ref:ref,date_of_birth:applyForm.dob||null,has_wifi:applyForm.hasWifi,has_water:applyForm.hasWater,has_ac:applyForm.hasAc});
    if(!error){setAppRef(ref);setApplySubmitted(true);setApplyForm({fullName:"",phone:"",dob:"",carKindYear:"",carLicense:"",driverLicenseNum:"",notes:"",hasWifi:false,hasWater:false,hasAc:false});}
    else setApplyError(error.message||t.apply.fillAll);
  };

  const loadAdminData=async()=>{
    const{data:apps}=await supabase.from("driver_applications").select("*").order("created_at",{ascending:false});
    setApplications(apps||[]);
    const{data:drivers}=await supabase.from("profiles").select("*").eq("role","driver");
    setAdminDrivers(drivers||[]);
    const{data:edits}=await supabase.from("trip_edit_requests").select("*, trips(from_city,to_city,trip_date,trip_time)").eq("status","pending").order("created_at",{ascending:false});
    setEditRequests(edits||[]);
    const{data:allTrips}=await supabase.from("trips").select("*, profiles(full_name,email)").order("trip_date",{ascending:false});
    setAdminAllTrips(allTrips||[]);
    const today=new Date().toISOString().split("T")[0];
    const{count:bookingsToday}=await supabase.from("bookings").select("*",{count:"exact",head:true}).gte("created_at",today);
    const activeCount=(allTrips||[]).filter(t=>t.status==="active").length;
    const routeCounts={};
    (allTrips||[]).forEach(t=>{const key=`${t.from_city}-${t.to_city}`;routeCounts[key]=(routeCounts[key]||0)+1;});
    const popularRoute=Object.entries(routeCounts).sort((a,b)=>b[1]-a[1])[0];
    const popularLabel=popularRoute?`${gc(popularRoute[0].split("-")[0])?.[lang]||popularRoute[0].split("-")[0]} → ${gc(popularRoute[0].split("-")[1])?.[lang]||popularRoute[0].split("-")[1]}`:"—";
    setDashStats({activeTrips:activeCount,totalDrivers:(drivers||[]).length,bookingsToday:bookingsToday||0,popularRoute:popularLabel});
  };

  const updateApplication=async(id,status)=>{
    await supabase.from("driver_applications").update({status,reviewed_by:user.id}).eq("id",id);
    const app=applications.find(a=>a.id===id);
    if(status==="approved"){
      if(app?.user_id){
        const{error:upsertErr}=await supabase.from("profiles").upsert({id:app.user_id,full_name:app.full_name,phone:app.phone,role:"driver"},{onConflict:"id",ignoreDuplicates:false});
        if(upsertErr){console.error("Profile upsert failed",upsertErr);}
        else createNotif(app.user_id,"application_approved",lang==="ar"?"تهانينا! طلبك موافق عليه 🎉":"Application Approved 🎉",lang==="ar"?"تم قبول طلبك كسائق! يمكنك الآن تسجيل الدخول والبدء بنشر الرحلات":"Your driver application has been approved! You can now log in and start posting trips.");
      }
    } else if(status==="denied"&&app?.user_id){
      createNotif(app.user_id,"application_denied",lang==="ar"?"طلبك غير مقبول":"Application Not Approved",lang==="ar"?"نأسف، لم يتم قبول طلبك هذه المرة. يمكنك التواصل معنا للاستفسار":"We're sorry, your driver application was not approved this time. Please contact us for more information.");
    }
    loadAdminData();
  };

  const handleEditRequest=async(id,status,tripId,newTime)=>{
    await supabase.from("trip_edit_requests").update({status,reviewed_by:user.id}).eq("id",id);
    if(status==="approved") await supabase.from("trips").update({trip_time:newTime}).eq("id",tripId);
    loadAdminData();
  };

  const adminApproveTrip=async(id)=>adminMoveTripTo(id,"active");
  const adminCancelTrip=async(id)=>adminMoveTripTo(id,"cancelled");
  const adminMoveTripTo=async(id,newStatus)=>{
    if(newStatus==="active"){
      await supabase.from("trips").update({approved:true,status:"active"}).eq("id",id);
      const trip=adminAllTrips.find(t=>t.id===id);
      if(trip?.driver_id) createNotif(trip.driver_id,"trip_approved",lang==="ar"?"رحلتك موافق عليها 🚗":"Trip Approved 🚗",lang==="ar"?`تم الموافقة على رحلتك من ${gc(trip.from_city)?.[lang]||trip.from_city} إلى ${gc(trip.to_city)?.[lang]||trip.to_city} بتاريخ ${trip.trip_date} وهي الآن متاحة للحجز`:`Your trip from ${gc(trip.from_city)?.en||trip.from_city} to ${gc(trip.to_city)?.en||trip.to_city} on ${trip.trip_date} has been approved and is now live`);
    } else if(newStatus==="pending"){
      await supabase.from("trips").update({approved:false,status:"pending"}).eq("id",id);
    } else if(newStatus==="cancelled"){
      await supabase.from("trips").update({status:"cancelled"}).eq("id",id);
    }
    loadAdminData();
  };

  const adminDeleteTrip=async(id)=>{
    await supabase.from("bookings").delete().eq("trip_id",id);
    await supabase.from("trip_ratings").delete().eq("trip_id",id);
    await supabase.from("trip_edit_requests").delete().eq("trip_id",id);
    await supabase.from("trips").delete().eq("id",id);
    loadAdminData();
  };

  const adminRevokeDriver=async(driverId)=>{
    await supabase.from("trips").update({status:"cancelled",approved:false}).eq("driver_id",driverId).eq("status","active");
    await supabase.from("profiles").update({role:"passenger"}).eq("id",driverId);
    await supabase.from("driver_applications").update({status:"denied"}).eq("user_id",driverId);
    loadAdminData();
  };

  const loadDriverReviews=async(driverId)=>{
    const{data}=await supabase.from("trip_reviews").select("*").eq("driver_id",driverId).order("created_at",{ascending:false});
    setDriverReviews(data||[]);
  };

  const submitReview=async(tripId,driverId,bookingId)=>{
    if(!reviewForm.rating||!bookingId||!user) return;
    const{data:myBooking}=await supabase.from("bookings").select("id").eq("id",bookingId).eq("user_id",user.id).neq("status","cancelled").maybeSingle();
    if(!myBooking) return;
    const{error:reviewErr}=await supabase.from("trip_reviews").insert({trip_id:tripId,booking_id:bookingId,driver_id:driverId,passenger_name:tripBooking.name||profile?.full_name||"Anonymous",rating:reviewForm.rating,review_text:reviewForm.text});
    if(reviewErr) return;
    const{data:reviews}=await supabase.from("trip_reviews").select("rating").eq("driver_id",driverId);
    if(reviews&&reviews.length>0){
      const avg=reviews.reduce((a,r)=>a+r.rating,0)/reviews.length;
      await supabase.from("trips").update({avg_rating:avg,rating_count:reviews.length}).eq("driver_id",driverId);
    }
    setReviewSubmitted(true);
    setTimeout(()=>setReviewSubmitted(false),2000);
  };

  const checkPromoCode=async()=>{
    if(!promoCode) return;
    if(!/^[A-Z0-9]{1,20}$/.test(promoCode.toUpperCase())){setPromoError(lang==="ar"?"كود غير صحيح":"Invalid code");return;}
    const{data,error:promoErr}=await supabase.from("promo_codes").select("*").eq("code",promoCode.toUpperCase()).eq("active",true).maybeSingle();
    if(promoErr){setPromoError(lang==="ar"?"حدث خطأ، حاول مجدداً":"Something went wrong, try again");return;}
    if(!data){setPromoError(lang==="ar"?"كود غير صحيح":"Invalid code");setPromoDiscount(null);}
    else if(data.expires_at&&new Date(data.expires_at)<new Date()){setPromoError(lang==="ar"?"انتهت صلاحية هذا الكود":"This promo code has expired");setPromoDiscount(null);}
    else if(data.max_uses!==null&&data.max_uses!==undefined&&(data.uses_count||0)>=data.max_uses){setPromoError(lang==="ar"?"انتهى الحد المسموح به لهذا الكود":"This promo code has reached its usage limit");setPromoDiscount(null);}
    else{setPromoDiscount(data);setPromoError("");}
  };

  const applyDiscount=(originalPrice)=>{
    if(!promoDiscount) return originalPrice;
    if(promoDiscount.discount_type==="percentage") return Math.max(0,originalPrice*(1-promoDiscount.discount_value/100));
    return Math.max(0,originalPrice-promoDiscount.discount_value);
  };

  const loadTripPassengers=async(tripId)=>{
    if(tripPassengers[tripId]) return;
    const{data}=await supabase.from("bookings").select("*").eq("trip_id",tripId).neq("status","cancelled");
    setTripPassengers(prev=>({...prev,[tripId]:data||[]}));
  };

  const loadPromoCodes=async()=>{
    const{data}=await supabase.from("promo_codes").select("*").order("created_at",{ascending:false});
    setPromoCodes(data||[]);
  };

  const createPromoCode=async()=>{
    if(!newPromo.code||!newPromo.discount_value) return;
    const val=parseFloat(newPromo.discount_value);
    if(isNaN(val)||val<=0||(newPromo.discount_type==="percentage"&&val>100)) return;
    const maxUses=newPromo.max_uses?parseInt(newPromo.max_uses):null;
    const expiresAt=newPromo.expires_at?new Date(newPromo.expires_at).toISOString():null;
    const{error:insertErr}=await supabase.from("promo_codes").insert({code:newPromo.code.toUpperCase(),discount_type:newPromo.discount_type,discount_value:val,active:true,max_uses:maxUses,uses_count:0,expires_at:expiresAt});
    if(insertErr){alert(lang==="ar"?"فشل إنشاء الكود: "+insertErr.message:"Failed to create code: "+insertErr.message);return;}
    setNewPromo({code:"",discount_type:"fixed",discount_value:"",max_uses:"",expires_at:""});
    loadPromoCodes();
  };

  const openDriverProfile=async(driver)=>{
    setSelectedDriver(driver);
    setDriverProfile({fullName:driver.full_name||"",dob:driver.date_of_birth||"",idNumber:driver.id_number||"",carKindYear:driver.car_type||"",carPlate:driver.car_plate||"",transportLicense:driver.transport_license||"",driverLicense:driver.driver_license||"",hasWifi:driver.has_wifi||false,hasWater:driver.has_water||false,hasAc:driver.has_ac||false});
  };

  const openDriverPublicPage=async(driverId)=>{
    const{data:prof}=await supabase.from("profiles").select("full_name,car_type,has_wifi,has_water,has_ac").eq("id",driverId).maybeSingle();
    const{data:reviews}=await supabase.from("trip_reviews").select("*").eq("driver_id",driverId).order("created_at",{ascending:false});
    setDriverPublicPage({profile:prof,reviews:reviews||[]});
  };

  const saveDriverProfile=async()=>{
    const targetId=selectedDriver?.id||user?.id;
    if(!targetId) return;
    if(driverProfile.dob){
      const cutoff=new Date();cutoff.setFullYear(cutoff.getFullYear()-18);
      if(new Date(driverProfile.dob)>cutoff){
        setDriverProfileMsg(lang==="ar"?"يجب أن يكون عمرك 18 عامًا على الأقل":"Must be at least 18 years old");
        return;
      }
    }
    const{error}=await supabase.from("profiles").update({full_name:driverProfile.fullName,date_of_birth:driverProfile.dob||null,id_number:driverProfile.idNumber,car_type:driverProfile.carKindYear,car_plate:driverProfile.carPlate,transport_license:driverProfile.transportLicense,driver_license:driverProfile.driverLicense,has_wifi:driverProfile.hasWifi,has_water:driverProfile.hasWater,has_ac:driverProfile.hasAc}).eq("id",targetId);
    if(error){setDriverProfileMsg(lang==="ar"?"حدث خطأ أثناء الحفظ":"Save failed: "+error.message);return;}
    setDriverProfileMsg(lang==="ar"?"تم الحفظ بنجاح ✓":"Saved successfully ✓");
    setTimeout(()=>setDriverProfileMsg(""),3000);
    if(selectedDriver) loadAdminData();
    else loadDriverData();
  };

  const exportBookingsCSV=async()=>{
    const{data:rows,error:csvErr}=await supabase.from("bookings").select("ref_code,passenger_name,passenger_phone,seats,total_price,payment_method,status,created_at,trips(trip_date,trip_time,from_city,to_city,profiles(full_name))").order("created_at",{ascending:false});
    if(csvErr){alert(lang==="ar"?"فشل التصدير: "+csvErr.message:"Export failed: "+csvErr.message);return;}
    if(!rows||rows.length===0){alert(lang==="ar"?"لا توجد حجوزات للتصدير":"No bookings to export");return;}
    const headers=["Ref","Passenger","Phone","Seats","Price","Payment","Status","Booked At","Trip Date","Trip Time","From","To","Driver"];
    const esc=v=>{const s=v==null?"":String(v);return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s;};
    const lines=[headers.join(",")].concat(rows.map(r=>[r.ref_code,r.passenger_name,r.passenger_phone,r.seats,r.total_price,r.payment_method,r.status,r.created_at,r.trips?.trip_date,r.trips?.trip_time,r.trips?.from_city,r.trips?.to_city,r.trips?.profiles?.full_name].map(esc).join(",")));
    const blob=new Blob([lines.join("\n")],{type:"text/csv;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=url;a.download=`safferni-bookings-${new Date().toISOString().split("T")[0]}.csv`;a.click();
    URL.revokeObjectURL(url);
  };

  const filteredAdminTrips=adminAllTrips.filter(trip=>{
    if(tripFilterDriver&&trip.driver_id!==tripFilterDriver) return false;
    if(tripFilterDate&&trip.trip_date!==tripFilterDate) return false;
    return true;
  });

  const loadDriverData=async()=>{
    if(!user) return;
    await loadProfile(user);
    const{data:myApp}=await supabase.from("driver_applications").select("*").eq("user_id",user.id).order("created_at",{ascending:false}).limit(1).maybeSingle();
    const{data:myProfileData}=await supabase.from("profiles").select("*").eq("id",user.id).maybeSingle();
    setDriverProfile({fullName:myProfileData?.full_name||"",dob:myProfileData?.date_of_birth||"",idNumber:myProfileData?.id_number||"",carKindYear:myProfileData?.car_type||myApp?.car_type||"",carPlate:myProfileData?.car_plate||"",transportLicense:myProfileData?.transport_license||"",driverLicense:myProfileData?.driver_license||"",hasWifi:myProfileData?.has_wifi||false,hasWater:myProfileData?.has_water||false,hasAc:myProfileData?.has_ac||false});
    const{data:myTrips}=await supabase.from("trips").select("*").eq("driver_id",user.id).order("trip_date",{ascending:false});
    setDriverTrips(myTrips||[]);
    if(myTrips){
      const counts={};
      for(const trip of myTrips){
        const{count}=await supabase.from("bookings").select("*",{count:"exact",head:true}).eq("trip_id",trip.id).neq("status","cancelled");
        counts[trip.id]=count||0;
      }
      setBookingCounts(counts);
    }
  };

  const validateTrip=async()=>{
    const today=new Date(new Date().toDateString());
    if(tripForm.date&&new Date(tripForm.date)<today){setTripError(lang==="ar"?"لا يمكن نشر رحلة بتاريخ سابق":"Cannot post a trip with a past date");return false;}
    const{data:activeTripsList}=await supabase.from("trips").select("id").eq("driver_id",user.id).eq("status","active");
    if((activeTripsList?.length||0)>=10){setTripError(drv.limitReached);return false;}
    const{data:dayTrips}=await supabase.from("trips").select("trip_time").eq("driver_id",user.id).eq("trip_date",tripForm.date).neq("status","cancelled");
    if((dayTrips?.length||0)>=2){setTripError(drv.dayLimitReached);return false;}
    if(dayTrips&&dayTrips.length===1&&tripForm.time){
      const existingMins=timeToMinutes(dayTrips[0].trip_time);
      const newMins=timeToMinutes(tripForm.time);
      if(Math.abs(newMins-existingMins)<300){setTripError(drv.timeTooClose);return false;}
    }
    if(tripForm.time){
      const tripDateTime=new Date(`${tripForm.date}T${tripForm.time}`);
      const now=new Date();
      if((tripDateTime-now)<2*60*60*1000){setTripError(drv.noticeRequired);return false;}
    }
    const driverRoute=findRoute(tripForm.from,tripForm.to);
    if(driverRoute&&!driverRoute.comingSoon){
      const p=parseFloat(tripForm.pricePerSeat);
      if(isNaN(p)||p<driverRoute.seatMin||p>driverRoute.seatMax){setTripError(lang==="ar"?`السعر يجب أن يكون بين $${driverRoute.seatMin} و $${driverRoute.seatMax} لهذا المسار`:`Price must be between $${driverRoute.seatMin} and $${driverRoute.seatMax} for this route`);return false;}
    }
    return true;
  };

  const postTrip=async()=>{
    if(!tripForm.from||!tripForm.to||!tripForm.date||!tripForm.pricePerSeat){setTripError(drv.fillAll);return;}
    const valid=await validateTrip();
    if(!valid) return;
    const{error}=await supabase.from("trips").insert({driver_id:user.id,from_city:tripForm.from,to_city:tripForm.to,trip_date:tripForm.date,trip_time:tripForm.time||null,price_per_seat:parseFloat(tripForm.pricePerSeat),total_seats:parseInt(tripForm.totalSeats),available_seats:parseInt(tripForm.totalSeats),car_type:tripForm.carType,gender_type:tripForm.genderType,approved:false,status:"pending"});
    if(!error){setTripSuccess(true);setTimeout(()=>setTripSuccess(false),3000);setTripForm({from:"",to:"",date:"",time:"",pricePerSeat:"",totalSeats:"4",carType:"",genderType:"mixed"});loadDriverData();}
    else setTripError(drv.fillAll);
  };

  const cancelDriverTrip=async(id)=>{
    if(!window.confirm(lang==="ar"?"هل أنت متأكد من إلغاء هذه الرحلة؟":"Are you sure you want to cancel this trip?")) return;
    await supabase.from("trips").update({status:"cancelled"}).eq("id",id);
    loadDriverData();
  };

  const requestTimeEdit=async()=>{
    if(!editRequestForm.newTime) return;
    await supabase.from("trip_edit_requests").insert({trip_id:editRequestForm.tripId,driver_id:user.id,requested_time:editRequestForm.newTime});
    setEditRequestMsg(drv.requestSent);setShowEditModal(false);setTimeout(()=>setEditRequestMsg(""),3000);
  };

  const searchTrips=async()=>{
    if(!searchDate){setTripsLoaded(true);setTrips([]);return;}
    setTripsLoaded(false);
    let query=supabase.from("trips").select("*").eq("trip_date",searchDate).eq("status","active").eq("approved",true).order("trip_time");
    if(searchFrom) query=query.eq("from_city",searchFrom);
    if(searchTo) query=query.eq("to_city",searchTo);
    query=query.eq("gender_type",searchGender);
    const{data}=await query;
    setTrips(data||[]);
    setTripsLoaded(true);
  };

  const bookTripSeat=async()=>{
    setSeatBookingError("");
    const name=tripBooking.name.trim();
    const phone=tripBooking.phone.trim();
    if(!name||!phone||!selectedTrip){setSeatBookingError(lang==="ar"?"يرجى تعبئة الاسم ورقم الهاتف":"Please fill in your name and phone number");return;}
    if(name.length<2){setSeatBookingError(lang==="ar"?"الاسم قصير جداً":"Name is too short");return;}
    if(!/^\+?[\d\s\-]{7,20}$/.test(phone)){setSeatBookingError(lang==="ar"?"رقم الهاتف غير صحيح":"Invalid phone number");return;}
    if(tripBooking.seats>selectedTrip.available_seats){setSeatBookingError(lang==="ar"?"عدد المقاعد غير متاح":"Not enough seats available");return;}
    const ref=genRef();
    const{data:booking,error}=await supabase.rpc("book_trip_seat",{
      p_trip_id:selectedTrip.id,
      p_user_id:user?.id||null,
      p_passenger_name:name,
      p_passenger_phone:phone,
      p_seats:tripBooking.seats,
      p_payment_method:tripBooking.payment,
      p_ref_code:ref,
      p_promo_code:promoCode||null,
    });
    if(error||!booking?.success){
      const msg=booking?.error||error?.message||"";
      if(msg.includes("seats")||msg.includes("available")){setSeatBookingError(lang==="ar"?"عُذراً، لم تعد هناك مقاعد كافية":"Sorry, not enough seats left — someone else just booked");}
      else if(msg.includes("promo")){setSeatBookingError(lang==="ar"?"كود الخصم غير صالح أو منتهي":"Promo code invalid or exhausted");}
      else{setSeatBookingError(lang==="ar"?"فشل الحجز، يرجى المحاولة مرة أخرى":"Booking failed, please try again");}
      return;
    }
    if(booking) setLastBookingId(booking.booking_id||booking.id);
    // Price is now computed server-side; use booking.total_price for display
    const finalPrice=booking?.total_price??applyDiscount(selectedTrip.price_per_seat*tripBooking.seats);
    const from=gc(selectedTrip.from_city);const to=gc(selectedTrip.to_city);
    const isWomen=selectedTrip.gender_type==="women_only";
    const msg=lang==="ar"
      ?`🚗 *حجز مقعد - سفّرني*${isWomen?" 💜 نساء فقط":""}\n\n📋 رقم الحجز: ${ref}\n📍 المسار: ${from?.[lang]||selectedTrip.from_city} إلى ${to?.[lang]||selectedTrip.to_city}\n📅 التاريخ: ${selectedTrip.trip_date}\n⏰ الوقت: ${formatTime(selectedTrip.trip_time)}\n💰 السعر: $${Number(finalPrice).toFixed(2)}\n\n👤 الاسم: ${tripBooking.name}\n📞 الهاتف: ${tripBooking.phone}`
      :`🚗 *Seat Booking - Safferni*${isWomen?" 💜 Women Only":""}\n\n📋 Ref: ${ref}\n📍 Route: ${from?.en||selectedTrip.from_city} to ${to?.en||selectedTrip.to_city}\n📅 Date: ${selectedTrip.trip_date}\n⏰ Time: ${formatTime(selectedTrip.trip_time)}\n💰 Price: $${Number(finalPrice).toFixed(2)}\n\n👤 Name: ${tripBooking.name}\n📞 Phone: ${tripBooking.phone}`;
    window.open(`https://wa.me/${WA_PHONE}?text=${encodeURIComponent(msg)}`,"_blank");
    setTripBooked(true);
    if(selectedTrip?.driver_id) createNotif(selectedTrip.driver_id,"new_booking",lang==="ar"?"حجز جديد على رحلتك 👤":"New booking on your trip 👤",lang==="ar"?`${name} حجز ${tripBooking.seats} مقعد — ${gc(selectedTrip.from_city)?.[lang]||selectedTrip.from_city} إلى ${gc(selectedTrip.to_city)?.[lang]||selectedTrip.to_city} (${selectedTrip.trip_date})`:`${name} booked ${tripBooking.seats} seat(s) on ${gc(selectedTrip.from_city)?.en||selectedTrip.from_city} → ${gc(selectedTrip.to_city)?.en||selectedTrip.to_city} (${selectedTrip.trip_date})`);
  };

  const submitRating=async()=>{
    if(!tripRating||!lastBookingId||!selectedTrip) return;
    const{error:ratingErr}=await supabase.from("trip_ratings").insert({trip_id:selectedTrip.id,booking_id:lastBookingId,rating:tripRating});
    if(ratingErr) return;
    const{data:ratings}=await supabase.from("trip_ratings").select("rating").eq("trip_id",selectedTrip.id);
    if(ratings&&ratings.length>0){
      const avg=ratings.reduce((a,r)=>a+r.rating,0)/ratings.length;
      await supabase.from("trips").update({avg_rating:avg,rating_count:ratings.length}).eq("id",selectedTrip.id);
    }
    setRatingSubmitted(true);
    setTimeout(()=>{setRatingSubmitted(false);setTripBooked(false);setSelectedTrip(null);setTripRating(0);setLastBookingId(null);},2000);
  };

  const toggleLang=()=>setLang(l=>l==="ar"?"en":"ar");
  const availDests=form.from?getDests(form.from).map(id=>gc(id)):[];
  const route=form.from&&form.to?findRoute(form.from,form.to):null;
  const eType=form.type;
  const price=route&&!route.comingSoon?(eType==="seat"?route.seat:eType==="car"?route.car:route.van):null;
  const copyUSDT=()=>{
    if(navigator.clipboard){navigator.clipboard.writeText(USDT_ADDRESS).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000)});}
    else{const el=document.createElement("textarea");el.value=USDT_ADDRESS;document.body.appendChild(el);el.select();document.execCommand("copy");document.body.removeChild(el);setCopied(true);setTimeout(()=>setCopied(false),2000);}
  };
  const handleFromChange=(v)=>setForm({...form,from:v,to:""});
  const scrollToSearch=()=>{setPage("home");setMenuOpen(false);setTimeout(()=>searchRef.current?.scrollIntoView({behavior:"smooth",block:"start"}),150)};
  const scrollToCustomBook=()=>{setPage("home");setMenuOpen(false);setTimeout(()=>bkRef.current?.scrollIntoView({behavior:"smooth",block:"start"}),150)};

  const handleSubmit=()=>{
    if(!user){resetAuth();setPage("login");return;}
    if(!form.from||!form.to||!form.date||!form.name||!form.phone){setError(b.fillAll);return;}
    if(!route||route.comingSoon||price==null){setError(b.fillAll);return;}
    if(form.payment==="shamcash") return;
    setError("");
    const ref=genRef();setBookingRef(ref);
    const fc=gc(form.from),tc=gc(form.to);
    const rt=`${fc[lang]} ${lang==="ar"?"إلى":"to"} ${tc[lang]}`;
    const rtEn=`${fc.en} to ${tc.en}`;
    const tl=eType==="seat"?"Seat":eType==="car"?"Car":"Van";
    const pl=form.payment==="cash"?"Cash":form.payment==="crypto"?"Crypto (USDT)":"Sham Cash";
    try{const p=new URLSearchParams({date:form.date,time:form.time||"-",route:rtEn,type:tl,price:`$${price}`,name:form.name,phone:form.phone,passengers:form.passengers,bags:form.bags||"0",notes:form.notes||"-",payment:pl,ref});fetch(`${SHEET_URL}?${p.toString()}`,{method:"GET",mode:"no-cors"})}catch(e){console.log(e)}
    const msg=lang==="ar"
      ?`🚗 *طلب حجز جديد - سفّرني*\n\n📋 رقم الحجز: ${ref}\n📍 المسار: ${rt}\n🧾 النوع: ${eType==="seat"?"مقعد":eType==="car"?"سيارة كاملة":"فان"}\n💰 السعر: $${price}\n💳 الدفع: ${form.payment==="cash"?"كاش":form.payment==="crypto"?"عملات رقمية (USDT)":"شام كاش"}\n\n📅 التاريخ: ${form.date}\n⏰ الوقت: ${form.time?formatTime(form.time):"-"}\n👥 عدد الركاب: ${form.passengers}\n🧳 الحقائب: ${form.bags||"0"}\n\n👤 الاسم: ${form.name}\n📞 الهاتف: ${form.phone}\n📝 ملاحظات: ${form.notes||"-"}`
      :`🚗 *New Booking - Safferni*\n\n📋 Ref: ${ref}\n📍 Route: ${rt}\n🧾 Type: ${tl}\n💰 Price: $${price}\n💳 Payment: ${pl}\n\n📅 Date: ${form.date}\n⏰ Time: ${form.time?formatTime(form.time):"-"}\n👥 Passengers: ${form.passengers}\n🧳 Bags: ${form.bags||"0"}\n\n👤 Name: ${form.name}\n📞 Phone: ${form.phone}\n📝 Notes: ${form.notes||"-"}`;
    window.open(`https://wa.me/${WA_PHONE}?text=${encodeURIComponent(msg)}`,"_blank");
    setSubmitted(true);
    setForm({from:"",to:"",type:"car",date:"",time:"",name:"",phone:"",passengers:"1",bags:"0",notes:"",payment:"cash"});
  };

  const navLinks=[["home",t.nav.home],["contact",t.nav.contact],...(driverApproved?[["driver",t.nav.driver]]:[]),...(isAdmin?[["admin",t.nav.admin]]:[])];
  const statusBadge=(s)=>({padding:"4px 12px",borderRadius:20,fontSize:11,fontWeight:700,background:s==="active"?"#D1FAE5":s==="confirmed"?"#BBF7D0":s==="pending"?"#FFF3CD":s==="completed"?"#E0F2FE":"#FEE2E2",color:s==="active"?"#065F46":s==="confirmed"?"#065F46":s==="pending"?"#92400E":s==="completed"?"#0369A1":"#991B1B"});

  const timeOptions=Array.from({length:96},(_,i)=>{
    const h=Math.floor(i/4);const m=(i%4)*15;
    const ampm=h<12?"AM":"PM";const h12=h===0?12:h>12?h-12:h;
    const label=`${h12}:${String(m).padStart(2,"0")} ${ampm}`;
    const value=`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
    return{label,value};
  });

  if(loading) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",fontFamily:"Montserrat,sans-serif",color:"#1B3A2A",fontSize:18,fontWeight:700}}>سفّرني...</div>;

  return(
    <div style={{direction:isRTL?"rtl":"ltr",fontFamily:"'Montserrat',sans-serif",background:"#FAFAF8",color:"#1A1A1A",minHeight:"100vh",fontSize:15,lineHeight:1.7}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideDown{from{opacity:0;max-height:0}to{opacity:1;max-height:500px}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        *{box-sizing:border-box;margin:0;padding:0}
        input,select,textarea{font-family:'Montserrat',sans-serif;font-size:14px}
        .feat-desc{transition:color 0.25s}
        ::selection{background:#1B3A2A;color:white} html{scroll-behavior:smooth}
      `}</style>

      {/* NAV */}
      <nav style={{position:"sticky",top:0,zIndex:100,background:"rgba(250,250,248,0.95)",backdropFilter:"blur(16px)",borderBottom:"1px solid #E8E6E1",padding:"0 24px"}}>
        <div style={{maxWidth:1100,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:60}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div onClick={()=>setPage("home")} style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}><LogoSVG/><span style={{fontSize:20,fontWeight:900,color:"#1B3A2A"}}>{t.brand}</span></div>
             
          </div>
          <div style={{display:"flex",alignItems:"center",gap:20,position:"absolute",left:"50%",transform:"translateX(-50%)"}} className="dnav">
            {navLinks.map(([k,l])=>(<span key={k} onClick={()=>setPage(k)} style={{cursor:"pointer",fontSize:13,fontWeight:600,color:page===k?"#1B3A2A":"#999"}}>{l}</span>))}
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center",marginInlineStart:"auto"}} className="dnav">
              {user?(<>
                <div onClick={()=>setShowNotifications(v=>!v)} style={{position:"relative",cursor:"pointer",display:"flex",alignItems:"center",padding:"6px 9px",borderRadius:8,border:"1.5px solid #DDD",background:showNotifications?"#F0F7F3":"white"}}><span style={{fontSize:15,lineHeight:1}}>🔔</span>{unreadCount>0&&<span style={{position:"absolute",top:-5,right:-5,background:"#EF4444",color:"white",borderRadius:20,minWidth:16,height:16,fontSize:9,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 3px"}}>{unreadCount>9?"9+":unreadCount}</span>}</div>
                <button onClick={()=>setPage("profile")} style={{background:page==="profile"?"#1B3A2A":"transparent",color:page==="profile"?"white":"#555",border:"1.5px solid #DDD",borderRadius:8,padding:"6px 14px",fontSize:12,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>{t.nav.profile}</button>
                <button onClick={handleLogout} style={{background:"transparent",border:"1.5px solid #DDD",borderRadius:8,padding:"6px 14px",fontSize:12,cursor:"pointer",fontWeight:700,color:"#555",fontFamily:"inherit"}}>{t.nav.logout}</button>
              </>):(<>
                <button onClick={()=>{resetAuth();setPage("login");}} style={{background:"#1B3A2A",color:"white",border:"none",padding:"8px 18px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{t.nav.login}</button>
                <button onClick={scrollToSearch} style={{background:"#F0F7F3",color:"#1B3A2A",border:"1.5px solid #1B3A2A",padding:"8px 18px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{t.nav.book}</button>
              </>)}
            <button onClick={toggleLang} style={{background:"transparent",border:"1.5px solid #DDD",borderRadius:8,padding:"6px 14px",fontSize:12,cursor:"pointer",fontWeight:700,color:"#555",fontFamily:"inherit"}}>{lang==="ar"?"EN":"عربي"}</button>
          </div>
          <div style={{display:"none"}} className="mnav">
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <button onClick={toggleLang} style={{background:"transparent",border:"1.5px solid #DDD",borderRadius:6,padding:"5px 12px",fontSize:11,cursor:"pointer",fontWeight:700,color:"#555",fontFamily:"inherit"}}>{lang==="ar"?"EN":"عربي"}</button>
              {user&&<div onClick={()=>setShowNotifications(v=>!v)} style={{position:"relative",cursor:"pointer",padding:"5px 8px",borderRadius:6,border:"1.5px solid #DDD",background:showNotifications?"#F0F7F3":"white",display:"flex",alignItems:"center"}}><span style={{fontSize:15,lineHeight:1}}>🔔</span>{unreadCount>0&&<span style={{position:"absolute",top:-5,right:-5,background:"#EF4444",color:"white",borderRadius:20,minWidth:15,height:15,fontSize:9,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 2px"}}>{unreadCount>9?"9+":unreadCount}</span>}</div>}
              <div onClick={()=>setMenuOpen(!menuOpen)} style={{cursor:"pointer",padding:8,fontSize:20,lineHeight:1}}>{menuOpen?"✕":"☰"}</div>
            </div>
          </div>
        </div>     
        {menuOpen&&(<div style={{animation:"slideDown 0.3s ease",borderTop:"1px solid #E8E6E1",padding:"12px 0 16px"}}>
          {navLinks.map(([k,l])=>(<div key={k} onClick={()=>{setPage(k);setMenuOpen(false)}} style={{padding:"10px 24px",cursor:"pointer",fontSize:15,fontWeight:page===k?700:400,color:page===k?"#1B3A2A":"#444"}}>{l}</div>))}
          {user&&<div onClick={()=>{setPage("profile");setMenuOpen(false)}} style={{padding:"10px 24px",cursor:"pointer",fontSize:15,fontWeight:700,color:"#1B3A2A"}}>{t.nav.profile}</div>}
          {user?(<div onClick={()=>{handleLogout();setMenuOpen(false)}} style={{padding:"10px 24px",cursor:"pointer",fontSize:15,color:"#444"}}>{t.nav.logout}</div>):(<div onClick={()=>{resetAuth();setPage("login");setMenuOpen(false)}} style={{padding:"10px 24px",cursor:"pointer",fontSize:15,color:"#1B3A2A",fontWeight:700}}>{t.nav.login}</div>)}
          <div style={{padding:"8px 24px"}}><button onClick={()=>{scrollToSearch();setMenuOpen(false)}} style={{background:"#1B3A2A",color:"white",border:"none",padding:"10px 24px",borderRadius:8,fontSize:14,fontWeight:700,cursor:"pointer",width:"100%",fontFamily:"inherit"}}>{t.nav.book}</button></div>
          {user&&!isDriverApplied&&<div onClick={()=>{setPage("apply");setMenuOpen(false)}} style={{padding:"10px 24px",borderTop:"1px solid #F0EEEA",cursor:"pointer",fontSize:15,fontWeight:700,color:"#1B3A2A",marginTop:4}}>{t.nav.apply} →</div>}
        </div>)}
        <style>{`@media(max-width:700px){.dnav{display:none!important}.mnav{display:flex!important}}`}</style>
      </nav>

      {/* ─── LOGIN / SIGNUP / FORGOT PASSWORD ─────────────────────────────── */}
      {page==="login"&&(
        <section style={{maxWidth:440,margin:"0 auto",padding:"60px 24px 80px",...fade}}>
          <div style={{background:"white",borderRadius:20,padding:"40px 28px",border:"1px solid #E8E6E1",boxShadow:"0 8px 40px rgba(0,0,0,0.05)"}}>
            <div style={{textAlign:"center",marginBottom:28}}>
              <LogoSVG/>
              <h2 style={{fontSize:22,fontWeight:900,color:"#1B3A2A",marginTop:12}}>
                {authStep==="choice"||authStep==="login"?t.auth.login
                :authStep==="forgot_phone"||authStep==="forgot_newpass"?t.auth.forgotPassword
                :t.auth.signup}
              </h2>
            </div>

            {authSuccess&&<div style={{marginBottom:16,padding:"12px 16px",background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:10,color:"#166534",fontSize:13,fontWeight:700,textAlign:"center"}}>{authSuccess}</div>}
            {authError&&<div style={{marginBottom:16,padding:"10px 16px",background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:10,color:"#B91C1C",fontSize:13,fontWeight:700}}>{authError}</div>}

            {/* CHOICE: login or sign up */}
            {authStep==="choice"&&(
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                <button onClick={()=>{setAuthStep("login");setAuthError("");}} style={{width:"100%",background:"#1B3A2A",color:"white",border:"none",padding:"14px",borderRadius:12,fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>{t.auth.loginBtn}</button>
                <button onClick={()=>{setAuthStep("signup_country");setAuthError("");}} style={{width:"100%",background:"white",color:"#1B3A2A",border:"2px solid #1B3A2A",padding:"14px",borderRadius:12,fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>{t.auth.signupBtn}</button>
              </div>
            )}

            {/* LOGIN */}
            {authStep==="login"&&(<>
              <div style={{marginBottom:16}}><label style={lbl}>{lang==="ar"?"البريد الإلكتروني أو رقم الهاتف":"Email or Phone Number"}</label><input type="text" value={authForm.email} onChange={e=>setAuthForm(f=>({...f,email:e.target.value}))} style={inp} placeholder={lang==="ar"?"name@email.com أو ‎+963...":"name@email.com or +963..."}/></div>
              <div style={{marginBottom:8}}><label style={lbl}>{t.auth.password}</label><input type="password" value={authForm.password} onChange={e=>setAuthForm(f=>({...f,password:e.target.value}))} style={inp} onKeyDown={e=>e.key==="Enter"&&handleLogin()}/></div>
              <p onClick={()=>{setAuthStep("forgot_phone");setAuthError("");}} style={{textAlign:"end",fontSize:12,color:"#1B3A2A",fontWeight:700,cursor:"pointer",marginBottom:20}}>{t.auth.forgotPassword}</p>
              <button onClick={handleLogin} disabled={authLoading} style={{width:"100%",background:"#1B3A2A",color:"white",border:"none",padding:"14px",borderRadius:12,fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>{authLoading?"...":t.auth.loginBtn}</button>
              <p style={{textAlign:"center",marginTop:16,fontSize:13,color:"#888"}}>{t.auth.noAccount}{" "}<span onClick={()=>{setAuthStep("signup_country");setAuthError("");}} style={{color:"#1B3A2A",fontWeight:700,cursor:"pointer"}}>{t.auth.signupBtn}</span></p>
              <p onClick={()=>setAuthStep("choice")} style={{textAlign:"center",marginTop:8,fontSize:12,color:"#AAA",cursor:"pointer"}}>← {lang==="ar"?"رجوع":"Back"}</p>
            </>)}

            {/* SIGNUP: country selection */}
            {authStep==="signup_country"&&(
              <div>
                <p style={{textAlign:"center",fontSize:14,color:"#555",marginBottom:24,fontWeight:600}}>{t.auth.locationQ}</p>
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  <button onClick={()=>{setAuthStep("signup_info_sy");setAuthError("");setAuthForm(f=>({...f,phone:"+963"}));}} style={{width:"100%",background:"#1B3A2A",color:"white",border:"none",padding:"14px",borderRadius:12,fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>🇸🇾 {t.auth.inSyria}</button>
                  <button onClick={()=>{setAuthStep("signup_info_other");setAuthError("");setAuthForm(f=>({...f,phone:"+962",dob:""}));}} style={{width:"100%",background:"white",color:"#1B3A2A",border:"2px solid #1B3A2A",padding:"14px",borderRadius:12,fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>🌍 {t.auth.notInSyria}</button>
                </div>
                <p onClick={()=>{setAuthStep("choice");setAuthError("");}} style={{textAlign:"center",marginTop:20,fontSize:12,color:"#AAA",cursor:"pointer"}}>← {lang==="ar"?"رجوع":"Back"}</p>
              </div>
            )}

            {/* SIGNUP SYRIA: name + DOB + email + phone + password */}
            {authStep==="signup_info_sy"&&(<>
              <div style={{marginBottom:14}}><label style={lbl}>{t.auth.fullName} *</label><input value={authForm.fullName} onChange={e=>setAuthForm(f=>({...f,fullName:e.target.value}))} style={inp}/></div>
              <div style={{marginBottom:14}}><label style={lbl}>{t.auth.dob} *</label><input type="date" value={authForm.dob} onChange={e=>setAuthForm(f=>({...f,dob:e.target.value}))} style={inp}/></div>
              <div style={{marginBottom:14}}><label style={lbl}>{t.auth.email} *</label><input type="email" value={authForm.email} onChange={e=>setAuthForm(f=>({...f,email:e.target.value}))} style={inp}/></div>
              <div style={{marginBottom:14}}>
                <label style={lbl}>{t.auth.phone} *</label>
                <PhoneField value={authForm.phone} onChange={v=>setAuthForm(f=>({...f,phone:v}))} lang={lang} inp={inp}/>
              </div>
              <div style={{marginBottom:8}}><label style={lbl}>{t.auth.password} *</label><input type="password" value={authForm.password} onChange={e=>setAuthForm(f=>({...f,password:e.target.value}))} style={inp} onKeyDown={e=>e.key==="Enter"&&handleSignupSyriaStart()}/></div>
              <p style={{fontSize:11,color:"#AAA",marginBottom:20}}>{t.auth.passwordHint}</p>
              <button onClick={handleSignupSyriaStart} disabled={authLoading} style={{width:"100%",background:"#1B3A2A",color:"white",border:"none",padding:"14px",borderRadius:12,fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>{authLoading?"...":(lang==="ar"?"إرسال كود التحقق بالبريد":"Send Email Code")}</button>
              <p style={{textAlign:"center",marginTop:16,fontSize:13,color:"#888"}}>{t.auth.haveAccount}{" "}<span onClick={()=>{setAuthStep("login");setAuthError("");}} style={{color:"#1B3A2A",fontWeight:700,cursor:"pointer"}}>{t.auth.loginBtn}</span></p>
              <p onClick={()=>{setAuthStep("signup_country");setAuthError("");}} style={{textAlign:"center",marginTop:8,fontSize:12,color:"#AAA",cursor:"pointer"}}>← {lang==="ar"?"رجوع":"Back"}</p>
            </>)}

            {/* SIGNUP SYRIA OTP: verify email code */}
            {authStep==="signup_otp_email"&&(<>
              <div style={{background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:12,padding:"12px 16px",marginBottom:20,textAlign:"center"}}>
                <p style={{fontSize:13,color:"#166534",fontWeight:700}}>✉️ {t.auth.emailOtpSent}</p>
                <p style={{fontSize:12,color:"#555",marginTop:4}}>{authForm.email}</p>
              </div>
              <div style={{marginBottom:20}}><label style={lbl}>{lang==="ar"?"كود التحقق":"Verification Code"} *</label><input type="text" inputMode="numeric" maxLength={8} value={authOtp} onChange={e=>setAuthOtp(e.target.value.trim())} style={{...inp,textAlign:"center",fontSize:24,letterSpacing:5}} placeholder="— — — — — — — —" onKeyDown={e=>e.key==="Enter"&&handleSignupSyriaVerify()}/></div>
              <button onClick={handleSignupSyriaVerify} disabled={authLoading} style={{width:"100%",background:"#1B3A2A",color:"white",border:"none",padding:"14px",borderRadius:12,fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>{authLoading?"...":t.auth.verifyOtp}</button>
              <p onClick={handleResendEmailOtp} style={{textAlign:"center",marginTop:12,fontSize:12,color:"#1B3A2A",cursor:"pointer",fontWeight:600}}>{lang==="ar"?"لم تستلم الكود؟ إعادة الإرسال":"Didn't receive it? Resend"}</p>
              <p onClick={()=>{setAuthStep("signup_info_sy");setAuthOtp("");setAuthError("");}} style={{textAlign:"center",marginTop:4,fontSize:12,color:"#AAA",cursor:"pointer"}}>← {lang==="ar"?"رجوع":"Back"}</p>
            </>)}

            {/* SIGNUP NON-SYRIA: name + email + phone + password */}
            {authStep==="signup_info_other"&&(<>
              <div style={{marginBottom:14}}><label style={lbl}>{t.auth.fullName} *</label><input value={authForm.fullName} onChange={e=>setAuthForm(f=>({...f,fullName:e.target.value}))} style={inp}/></div>
              <div style={{marginBottom:14}}><label style={lbl}>{t.auth.email} *</label><input type="email" value={authForm.email} onChange={e=>setAuthForm(f=>({...f,email:e.target.value}))} style={inp}/></div>
              <div style={{marginBottom:14}}>
                <label style={lbl}>{t.auth.phone} *</label>
                <PhoneField value={authForm.phone} onChange={v=>setAuthForm(f=>({...f,phone:v}))} lang={lang} inp={inp}/>
              </div>
              <div style={{marginBottom:8}}><label style={lbl}>{t.auth.password} *</label><input type="password" value={authForm.password} onChange={e=>setAuthForm(f=>({...f,password:e.target.value}))} style={inp} onKeyDown={e=>e.key==="Enter"&&handleSignupOtherStart()}/></div>
              <p style={{fontSize:11,color:"#AAA",marginBottom:20}}>{t.auth.passwordHint}</p>
              {authPhoneExists&&<div style={{marginBottom:16,padding:"12px 16px",background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:10,fontSize:13,fontWeight:700,textAlign:"center"}}>
                <span style={{color:"#B91C1C"}}>{lang==="ar"?"هذا الرقم مسجل مسبقاً.":"This phone number is already registered."}</span>{" "}
                <span onClick={()=>{setAuthStep("login");setAuthPhoneExists(false);setAuthError("");}} style={{color:"#1B3A2A",fontWeight:800,cursor:"pointer",textDecoration:"underline"}}>{lang==="ar"?"سجّل الدخول بدلاً من ذلك":"Log in instead"}</span>
              </div>}
              <button onClick={handleSignupOtherStart} disabled={authLoading} style={{width:"100%",background:"#1B3A2A",color:"white",border:"none",padding:"14px",borderRadius:12,fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>{authLoading?"...":t.auth.sendSmsCode}</button>
              <p style={{textAlign:"center",marginTop:16,fontSize:13,color:"#888"}}>{t.auth.haveAccount}{" "}<span onClick={()=>{setAuthStep("login");setAuthError("");}} style={{color:"#1B3A2A",fontWeight:700,cursor:"pointer"}}>{t.auth.loginBtn}</span></p>
              <p onClick={()=>{setAuthStep("signup_country");setAuthError("");}} style={{textAlign:"center",marginTop:8,fontSize:12,color:"#AAA",cursor:"pointer"}}>← {lang==="ar"?"رجوع":"Back"}</p>
            </>)}

            {/* SIGNUP NON-SYRIA OTP: verify SMS code */}
            {authStep==="signup_otp_sms"&&(<>
              <div style={{background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:12,padding:"12px 16px",marginBottom:20,textAlign:"center"}}>
                <p style={{fontSize:13,color:"#166534",fontWeight:700}}>📱 {lang==="ar"?`تم إرسال كود التحقق عبر SMS إلى`:`SMS verification code sent to`}</p>
                <p style={{fontSize:12,color:"#555",marginTop:4,direction:"ltr"}}>{pendingPhone||fullPhone()}</p>
              </div>
              <div style={{marginBottom:20}}><label style={lbl}>{lang==="ar"?"كود التحقق":"Verification Code"} *</label><input type="text" inputMode="numeric" maxLength={6} value={authOtp} onChange={e=>setAuthOtp(e.target.value.trim())} style={{...inp,textAlign:"center",fontSize:28,letterSpacing:6}} placeholder="— — — — — —" onKeyDown={e=>e.key==="Enter"&&handleSignupOtherVerify()}/></div>
              <button onClick={handleSignupOtherVerify} disabled={authLoading} style={{width:"100%",background:"#1B3A2A",color:"white",border:"none",padding:"14px",borderRadius:12,fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>{authLoading?"...":t.auth.verifyOtp}</button>
              <p onClick={handleResendPhoneOtp} style={{textAlign:"center",marginTop:12,fontSize:12,color:"#1B3A2A",cursor:"pointer",fontWeight:600}}>{lang==="ar"?"لم تستلم الكود؟ إعادة الإرسال":"Didn't receive it? Resend"}</p>
              <p onClick={()=>{setAuthStep("signup_info_other");setAuthOtp("");setAuthError("");}} style={{textAlign:"center",marginTop:4,fontSize:12,color:"#AAA",cursor:"pointer"}}>← {lang==="ar"?"رجوع":"Back"}</p>
            </>)}

            {/* FORGOT STEP 1: email */}
            {authStep==="forgot_phone"&&(<>
              <p style={{fontSize:13,color:"#888",marginBottom:20,textAlign:"center"}}>{lang==="ar"?"أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور":"Enter your email and we'll send you a password reset link"}</p>
              <div style={{marginBottom:20}}><label style={lbl}>{t.auth.email} *</label><input type="email" value={authForm.email} onChange={e=>setAuthForm(f=>({...f,email:e.target.value}))} style={inp} onKeyDown={e=>e.key==="Enter"&&handleForgotSendEmail()}/></div>
              <button onClick={handleForgotSendEmail} disabled={authLoading} style={{width:"100%",background:"#1B3A2A",color:"white",border:"none",padding:"14px",borderRadius:12,fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit",marginBottom:12}}>{authLoading?"...":(lang==="ar"?"إرسال رابط إعادة التعيين":"Send Reset Link")}</button>
              <p onClick={()=>{setAuthStep("login");setAuthError("");}} style={{textAlign:"center",fontSize:13,color:"#888",cursor:"pointer"}}>{t.auth.backToLogin}</p>
            </>)}

            {/* FORGOT STEP 2: new password (after clicking email link) */}
            {authStep==="forgot_newpass"&&(<>
              <div style={{background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:12,padding:"12px 16px",marginBottom:20,textAlign:"center"}}>
                <p style={{fontSize:13,color:"#166534",fontWeight:700}}>✓ {lang==="ar"?"تم التحقق — أنشئ كلمة مرور جديدة":"Verified — set your new password"}</p>
              </div>
              <div style={{marginBottom:20}}><label style={lbl}>{t.auth.newPassword} *</label><input type="password" value={authForm.password} onChange={e=>setAuthForm(f=>({...f,password:e.target.value}))} style={inp} placeholder={lang==="ar"?"٨ أحرف على الأقل":"At least 8 characters"}/></div>
              <button onClick={handleForgotNewPass} disabled={authLoading} style={{width:"100%",background:"#1B3A2A",color:"white",border:"none",padding:"14px",borderRadius:12,fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>{authLoading?"...":t.auth.resetPassword}</button>
            </>)}
          </div>
        </section>
      )}

      {/* ─── PASSENGER PROFILE PAGE ────────────────────────────────────────── */}
      {page==="profile"&&user&&(
        <section style={{maxWidth:680,margin:"0 auto",padding:"40px 24px 80px",...fade}}>
          {/* Header */}
          <div style={{background:"linear-gradient(135deg,#1B3A2A,#234D36)",borderRadius:20,padding:"28px 32px",marginBottom:24,color:"white",display:"flex",alignItems:"center",gap:20}}>
            <div style={{width:60,height:60,borderRadius:"50%",background:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,fontWeight:900,flexShrink:0}}>
              {(profile?.full_name||"?").charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{fontSize:20,fontWeight:900}}>{profile?.full_name||user.email}</div>
              <div style={{fontSize:13,opacity:0.7,marginTop:2}}>{profile?.phone||""}</div>
              <div style={{marginTop:6}}>
                <span style={{fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,background:"rgba(255,255,255,0.2)"}}>
                  {profile?.role==="admin"?"👑 Admin":profile?.role==="driver"?"🚗 Driver":"🧳 Passenger"}
                </span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{display:"flex",gap:8,marginBottom:24,flexWrap:"wrap"}}>
            {[["profile",prof.tabs.profile],["upcoming",prof.tabs.upcoming],["past",prof.tabs.past],["apply",prof.tabs.apply]].map(([k,l])=>(
              <button key={k} onClick={()=>setProfileTab(k)} style={{padding:"9px 18px",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",border:"2px solid",borderColor:profileTab===k?"#1B3A2A":"#E8E6E1",background:profileTab===k?"#1B3A2A":"white",color:profileTab===k?"white":"#666"}}>{l}</button>
            ))}
          </div>

          {/* TAB: Profile edit */}
         {profileTab==="profile"&&(
            <div style={{background:"white",borderRadius:16,padding:"28px",border:"1px solid #E8E6E1"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
                <h3 style={{fontSize:17,fontWeight:800,color:"#1B3A2A"}}>{prof.editProfile}</h3>
                {!profileEditing&&<button onClick={()=>setProfileEditing(true)} style={{background:"#F0F7F3",color:"#1B3A2A",border:"1.5px solid #1B3A2A",padding:"7px 18px",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{lang==="ar"?"تعديل":"Edit"}</button>}
              </div>
              <div style={{marginBottom:14}}>
                <label style={lbl}>{lang==="ar"?"الاسم الكامل":"Full Name"}</label>
                {profileEditing?<input value={profileEdit.fullName} onChange={e=>setProfileEdit(p=>({...p,fullName:e.target.value}))} style={inp}/>:<div style={{fontSize:14,fontWeight:600,color:"#333",padding:"11px 0"}}>{profileEdit.fullName||"—"}</div>}
              </div>
              <div style={{marginBottom:14}}>
                <label style={lbl}>{lang==="ar"?"رقم الهاتف":"Phone Number"}</label>
                {profileEditing?<PhoneField value={profileEdit.phone} onChange={v=>setProfileEdit(p=>({...p,phone:v}))} lang={lang} inp={inp}/>:<div style={{fontSize:14,fontWeight:600,color:"#333",padding:"11px 0",direction:"ltr",textAlign:"left"}}>{profileEdit.phone||"—"}</div>}
              </div>
              <div style={{marginBottom:14}}>
                <label style={lbl}>{lang==="ar"?"البريد الإلكتروني":"Email"}</label>
                <div style={{fontSize:14,fontWeight:600,color:"#AAA",padding:"11px 0"}}>{profileEdit.email||"—"}</div>
              </div>
              <div style={{marginBottom:20,paddingBottom:20,borderBottom:"1px solid #F0F0F0"}}>
                <label style={lbl}>{lang==="ar"?"جهة الاتصال للطوارئ 🛡️":"Emergency Contact 🛡️"}</label>
                {profileEditing
                  ?<><input type="email" value={profileEdit.emergencyEmail} onChange={e=>setProfileEdit(p=>({...p,emergencyEmail:e.target.value}))} style={inp} placeholder={lang==="ar"?"البريد الإلكتروني لشخص مقرّب":"Email of a close person"}/><p style={{fontSize:11,color:"#AAA",marginTop:4,marginBottom:0}}>{lang==="ar"?"سيتلقى هذا البريد تفاصيل حجوزاتك عند التأكيد":"This email address will receive your booking details once confirmed"}</p></>
                  :<div style={{fontSize:14,fontWeight:600,color:profileEdit.emergencyEmail?"#333":"#CCC",padding:"11px 0"}}>{profileEdit.emergencyEmail||"—"}</div>}
              </div>
              {profileEditing&&(<>
                {profileSaved&&<div style={{marginBottom:12,padding:"10px 16px",background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:10,color:"#166534",fontSize:13,fontWeight:700}}>{prof.saved}</div>}
                <div style={{display:"flex",gap:10,marginBottom:24}}>
                  <button onClick={()=>{setProfileEditing(false);setProfileEdit({fullName:profile?.full_name||"",phone:profile?.phone||"",email:profile?.email||user.email||"",emergencyEmail:profile?.emergency_contact_email||""});}} style={{flex:1,background:"white",color:"#666",border:"1.5px solid #DDD",padding:"12px",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{lang==="ar"?"إلغاء":"Cancel"}</button>
                  <button onClick={async()=>{await saveProfile();setProfileEditing(false);}} disabled={profileSaving} style={{flex:2,background:"#1B3A2A",color:"white",border:"none",padding:"12px",borderRadius:10,fontSize:14,fontWeight:800,cursor:profileSaving?"not-allowed":"pointer",fontFamily:"inherit",opacity:profileSaving?0.7:1}}>{profileSaving?"...":(prof.saveChanges)}</button>
                </div>
              </>)}
              <div style={{borderTop:"1px solid #E8E6E1",paddingTop:20}}>
                <h3 style={{fontSize:15,fontWeight:800,color:"#1B3A2A",marginBottom:16}}>{prof.changePassword}</h3>
                <div style={{marginBottom:12}}><label style={lbl}>{prof.newPassword}</label><input type="password" value={pwForm.next} onChange={e=>setPwForm(p=>({...p,next:e.target.value}))} style={inp} placeholder={lang==="ar"?"٦ أحرف على الأقل":"At least 6 characters"}/></div>
                {pwMsg&&<div style={{marginBottom:12,padding:"10px 16px",background:pwMsg.includes("✓")?"#F0FDF4":"#FEF2F2",border:`1px solid ${pwMsg.includes("✓")?"#BBF7D0":"#FECACA"}`,borderRadius:10,color:pwMsg.includes("✓")?"#166534":"#B91C1C",fontSize:13,fontWeight:700}}>{pwMsg}</div>}
                <button onClick={changePassword} style={{background:"#F0F7F3",color:"#1B3A2A",border:"1.5px solid #1B3A2A",padding:"11px 24px",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{prof.changePassword}</button>
              </div>
              <div style={{borderTop:"1px solid #FECACA",paddingTop:20,marginTop:8}}>
                <h3 style={{fontSize:15,fontWeight:800,color:"#991B1B",marginBottom:6}}>{lang==="ar"?"حذف الحساب":"Delete Account"}</h3>
                <p style={{fontSize:12,color:"#AAA",marginBottom:14}}>{lang==="ar"?"سيتم حذف حسابك وجميع بياناتك نهائياً. لا يمكن التراجع عن هذا الإجراء.":"Your account and all data will be permanently deleted. This action cannot be undone."}</p>
                <button onClick={deleteAccount} style={{background:"white",color:"#991B1B",border:"1.5px solid #FECACA",padding:"10px 22px",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{lang==="ar"?"حذف حسابي نهائياً":"Permanently Delete My Account"}</button>
              </div>
            </div>
          )}
          {/* TAB: Upcoming bookings */}
          {profileTab==="upcoming"&&(
            <div>
              {profileLoading?<p style={{textAlign:"center",color:"#AAA",padding:"40px"}}>{lang==="ar"?"جاري التحميل...":"Loading..."}</p>
              :upcomingBookings.length===0?<div style={{background:"white",borderRadius:16,padding:"40px",border:"1px solid #E8E6E1",textAlign:"center"}}><div style={{fontSize:40,marginBottom:12}}>🗓️</div><p style={{color:"#AAA",fontSize:14}}>{prof.noUpcoming}</p><button onClick={scrollToSearch} style={{marginTop:16,background:"#1B3A2A",color:"white",border:"none",padding:"11px 28px",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{t.nav.book}</button></div>
              :upcomingBookings.map((bk,i)=>{
                const trip=bk.trips;
                const fc=gc(trip?.from_city);const tc=gc(trip?.to_city);
                return(<div key={bk.id} onClick={()=>setSelectedBookingDetail(bk)} style={{background:"white",borderRadius:14,padding:"20px 24px",border:"1px solid #E8E6E1",marginBottom:12,animation:`fadeUp 0.3s ease ${0.05*i}s both`,cursor:"pointer"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10}}>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:800,fontSize:15,color:"#1B3A2A",marginBottom:4}}>{fc?.[lang]||trip?.from_city} {lang==="ar"?"إلى":"to"} {tc?.[lang]||trip?.to_city}</div>
                      <div style={{fontSize:12,color:"#888"}}>{trip?.trip_date} · {formatTime(trip?.trip_time)}</div>
                      <div style={{fontSize:12,color:"#555",marginTop:4}}>📋 {bk.ref_code} · 💺 {bk.seats} {lang==="ar"?"مقعد":"seat(s)"} · 💰 ${bk.total_price||"—"}</div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end"}}>
                      <span style={statusBadge(bk.status)}>{bk.status}</span>
                      <button onClick={e=>{e.stopPropagation();cancelBooking(bk.id);}} style={{background:"#FEE2E2",color:"#991B1B",border:"none",padding:"6px 14px",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{prof.cancelBooking}</button>
                    </div>
                  </div>
                </div>);
              })}
            </div>
          )}

          {/* TAB: Past bookings */}
          {profileTab==="past"&&(
            <div>
              {profileLoading?<p style={{textAlign:"center",color:"#AAA",padding:"40px"}}>{lang==="ar"?"جاري التحميل...":"Loading..."}</p>
              :pastBookings.length===0?<div style={{background:"white",borderRadius:16,padding:"40px",border:"1px solid #E8E6E1",textAlign:"center"}}><div style={{fontSize:40,marginBottom:12}}>🕐</div><p style={{color:"#AAA",fontSize:14}}>{prof.noPast}</p></div>
              :pastBookings.map((bk,i)=>{
                const trip=bk.trips;
                const fc=gc(trip?.from_city);const tc=gc(trip?.to_city);
                return(<div key={bk.id} onClick={()=>setSelectedBookingDetail(bk)} style={{background:"white",borderRadius:14,padding:"20px 24px",border:"1px solid #E8E6E1",marginBottom:12,animation:`fadeUp 0.3s ease ${0.05*i}s both`,cursor:"pointer"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10}}>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:800,fontSize:15,color:"#555",marginBottom:4}}>{fc?.[lang]||trip?.from_city} {lang==="ar"?"إلى":"to"} {tc?.[lang]||trip?.to_city}</div>
                      <div style={{fontSize:12,color:"#888"}}>{trip?.trip_date} · {formatTime(trip?.trip_time)}</div>
                      <div style={{fontSize:12,color:"#555",marginTop:4}}>📋 {bk.ref_code} · 💺 {bk.seats} {lang==="ar"?"مقعد":"seat(s)"} · 💰 ${bk.total_price||"—"}</div>
                    </div>
                    <button onClick={async e=>{e.stopPropagation();setReviewSidebarDriver(trip?.driver_id);await loadDriverReviews(trip?.driver_id);}} style={{background:"#F0F7F3",color:"#1B3A2A",border:"1px solid #1B3A2A",padding:"6px 14px",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{prof.rateNow} ★</button>
                  </div>
                </div>);
              })}
            </div>
          )}

          {/* TAB: Apply as driver */}
          {profileTab==="apply"&&(
            <div>
              {driverApproved?(
                <div style={{background:"white",borderRadius:16,padding:"32px",border:"1px solid #BBF7D0",textAlign:"center"}}>
                  <div style={{fontSize:48,marginBottom:12}}>🚗</div>
                  <h3 style={{fontSize:18,fontWeight:900,color:"#1B3A2A",marginBottom:8}}>{prof.driverStatus.approved}</h3>
                  <button onClick={()=>setPage("driver")} style={{background:"#1B3A2A",color:"white",border:"none",padding:"12px 32px",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginTop:12}}>{t.nav.driver} →</button>
                </div>
              ):driverApplication?.status==="pending"?(
                <div style={{background:"white",borderRadius:16,padding:"32px",border:"1px solid #FFF3CD",textAlign:"center"}}>
                  <div style={{fontSize:48,marginBottom:12}}>⏳</div>
                  <h3 style={{fontSize:18,fontWeight:900,color:"#92400E",marginBottom:8}}>{prof.driverStatus.pending}</h3>
                  {driverApplication.app_ref&&<div style={{background:"#FFF9E6",borderRadius:10,padding:"10px 20px",display:"inline-block",marginTop:8}}><span style={{fontSize:11,color:"#888",fontWeight:700}}>Ref: </span><span style={{fontSize:16,fontWeight:900,color:"#1B3A2A"}}>{driverApplication.app_ref}</span></div>}
                </div>
              ):driverApplication?.status==="denied"?(
                <div style={{background:"white",borderRadius:16,padding:"32px",border:"1px solid #FECACA",textAlign:"center"}}>
                  <div style={{fontSize:48,marginBottom:12}}>❌</div>
                  <h3 style={{fontSize:18,fontWeight:900,color:"#991B1B",marginBottom:8}}>{prof.driverStatus.denied}</h3>
                  <p style={{fontSize:13,color:"#888"}}>{lang==="ar"?"يمكنك التواصل معنا عبر واتساب لمزيد من المعلومات":"Contact us via WhatsApp for more info"}</p>
                </div>
              ):(
                <div style={{background:"white",borderRadius:16,padding:"28px",border:"1px solid #E8E6E1"}}>
                  <h3 style={{fontSize:17,fontWeight:800,color:"#1B3A2A",marginBottom:6}}>{t.apply.title}</h3>
                  <p style={{fontSize:13,color:"#AAA",marginBottom:20}}>{t.apply.desc}</p>
                  <div style={{marginBottom:14}}><label style={lbl}>{t.apply.fullName} *</label><input value={applyForm.fullName||profile?.full_name||""} onChange={e=>setApplyForm(f=>({...f,fullName:e.target.value}))} style={inp}/></div>
                  <div style={{marginBottom:14}}><label style={lbl}>{t.apply.phone} *</label><PhoneField value={applyForm.phone||profile?.phone||""} onChange={v=>setApplyForm(f=>({...f,phone:v}))} lang={lang} inp={inp}/></div>
                  <div style={{marginBottom:14}}><label style={lbl}>{lang==="ar"?"تاريخ الميلاد (يجب أن يكون عمرك +18)":"Date of Birth (must be 18+)"}</label><input type="date" value={applyForm.dob} max={new Date(new Date().setFullYear(new Date().getFullYear()-18)).toISOString().split("T")[0]} onChange={e=>setApplyForm(f=>({...f,dob:e.target.value}))} style={inp}/></div>
                  <div style={{marginBottom:14}}><label style={lbl}>{lang==="ar"?"نوع السيارة والسنة *":"Car Kind & Year *"}</label><input value={applyForm.carKindYear} onChange={e=>setApplyForm(f=>({...f,carKindYear:e.target.value}))} style={inp} placeholder={lang==="ar"?"مثال: تويوتا كامري 2020":"e.g. Toyota Camry 2020"}/></div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
                    <div><label style={lbl}>{lang==="ar"?"رقم لوحة السيارة":"Car License Plate"}</label><input value={applyForm.carLicense} onChange={e=>setApplyForm(f=>({...f,carLicense:e.target.value}))} style={inp}/></div>
                    <div><label style={lbl}>{lang==="ar"?"رقم رخصة القيادة":"Driver License Number"}</label><input value={applyForm.driverLicenseNum} onChange={e=>setApplyForm(f=>({...f,driverLicenseNum:e.target.value}))} style={inp}/></div>
                  </div>
                  <div style={{marginBottom:14}}>
                    <label style={lbl}>{lang==="ar"?"المرافق المتاحة":"Available Facilities"}</label>
                    <div style={{display:"flex",gap:20,flexWrap:"wrap",marginTop:4}}>
                      {[["hasWifi","📶","WiFi","واي فاي"],["hasWater","💧",lang==="ar"?"مياه":"Water","مياه"],["hasAc","❄️",lang==="ar"?"تكييف":"AC","تكييف"]].map(([k,icon,label])=>(
                        <label key={k} style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:13,fontWeight:700,color:"#333"}}>
                          <input type="checkbox" checked={applyForm[k]} onChange={e=>setApplyForm(f=>({...f,[k]:e.target.checked}))} style={{width:16,height:16,cursor:"pointer"}}/>
                          {icon} {label}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div style={{marginBottom:20}}><label style={lbl}>{t.apply.notes}</label><textarea value={applyForm.notes} onChange={e=>setApplyForm(f=>({...f,notes:e.target.value}))} style={{...inp,minHeight:60,resize:"vertical"}} rows={2}/></div>
                  {applyError&&<div style={{marginBottom:12,padding:"10px 16px",background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:10,color:"#B91C1C",fontSize:13,fontWeight:700}}>{applyError}</div>}
                  {applySubmitted&&<div style={{marginBottom:12,padding:"10px 16px",background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:10,color:"#166534",fontSize:13,fontWeight:700}}>✓ {t.apply.success}</div>}
                  <button onClick={handleApply} style={{width:"100%",background:"#1B3A2A",color:"white",border:"none",padding:"13px",borderRadius:12,fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>{t.apply.submit}</button>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* ─── APPLY PAGE (for non-logged-in or standalone) ─────────────────── */}
      {page==="apply"&&(
        <section style={{maxWidth:550,margin:"0 auto",padding:"60px 24px 80px",...fade}}>
          {(isDriverApplied||driverApproved)?(<div style={{background:"#F0F0F0",borderRadius:20,padding:"44px 28px",textAlign:"center"}}><div style={{fontSize:48,marginBottom:12}}>🔒</div><p style={{fontSize:16,fontWeight:700,color:"#888"}}>{t.apply.alreadyApplied}</p></div>)
          :!user?(<div style={{background:"white",borderRadius:20,padding:"44px 28px",border:"1px solid #E8E6E1",textAlign:"center"}}><div style={{fontSize:48,marginBottom:12}}>🔐</div><h3 style={{fontSize:18,fontWeight:900,color:"#1B3A2A",marginBottom:12}}>{lang==="ar"?"يجب تسجيل الدخول أولاً":"Please log in first"}</h3><button onClick={()=>{resetAuth();setPage("login");}} style={{background:"#1B3A2A",color:"white",border:"none",padding:"12px 32px",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{t.nav.login}</button></div>)
          :applySubmitted?(<div style={{background:"white",borderRadius:20,padding:"44px 28px",border:"1px solid #E8E6E1",textAlign:"center"}}>
              <div style={{fontSize:48,marginBottom:16}}>🚗</div>
              <h3 style={{fontSize:20,fontWeight:900,color:"#1B3A2A",marginBottom:8}}>{lang==="ar"?"تم استلام طلبك!":"Application Received!"}</h3>
              <div style={{background:"#F0F7F3",borderRadius:12,padding:"12px 24px",display:"inline-block",marginBottom:16}}>
                <div style={{fontSize:11,color:"#888",fontWeight:700,marginBottom:2}}>{lang==="ar"?"رقم الطلب":"Application Number"}</div>
                <div style={{fontSize:22,fontWeight:900,color:"#1B3A2A",letterSpacing:2}}>{appRef}</div>
              </div>
              <button onClick={()=>{setApplySubmitted(false);setPage("home")}} style={{background:"transparent",color:"#888",border:"none",padding:"8px",fontSize:13,cursor:"pointer",fontFamily:"inherit",display:"block",margin:"0 auto"}}>{lang==="ar"?"رجوع للرئيسية":"Back to Home"}</button>
            </div>)
          :(<div style={{background:"white",borderRadius:20,padding:"40px 28px",border:"1px solid #E8E6E1",boxShadow:"0 8px 40px rgba(0,0,0,0.05)"}}>
            <h2 style={{fontSize:24,fontWeight:900,marginBottom:8,color:"#1B3A2A",textAlign:"center"}}>{t.apply.title}</h2>
            <p style={{fontSize:13,color:"#AAA",textAlign:"center",marginBottom:28}}>{t.apply.desc}</p>
            <div style={{marginBottom:16}}><label style={lbl}>{t.apply.fullName} *</label><input value={applyForm.fullName} onChange={e=>setApplyForm({...applyForm,fullName:e.target.value})} style={inp}/></div>
            <div style={{marginBottom:16}}><label style={lbl}>{t.apply.phone} *</label><PhoneField value={applyForm.phone} onChange={v=>setApplyForm({...applyForm,phone:v})} lang={lang} inp={inp}/></div>
            <div style={{marginBottom:16}}><label style={lbl}>{lang==="ar"?"تاريخ الميلاد (يجب أن يكون عمرك +18)":"Date of Birth (must be 18+)"}</label><input type="date" value={applyForm.dob} max={new Date(new Date().setFullYear(new Date().getFullYear()-18)).toISOString().split("T")[0]} onChange={e=>setApplyForm({...applyForm,dob:e.target.value})} style={inp}/></div>
            <div style={{marginBottom:16}}><label style={lbl}>{lang==="ar"?"نوع السيارة والسنة *":"Car Kind & Year *"}</label><input value={applyForm.carKindYear} onChange={e=>setApplyForm({...applyForm,carKindYear:e.target.value})} style={inp} placeholder={lang==="ar"?"مثال: تويوتا كامري 2020":"e.g. Toyota Camry 2020"}/></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
              <div><label style={lbl}>{lang==="ar"?"رقم لوحة السيارة":"Car License Plate"}</label><input value={applyForm.carLicense} onChange={e=>setApplyForm({...applyForm,carLicense:e.target.value})} style={inp}/></div>
              <div><label style={lbl}>{lang==="ar"?"رقم رخصة القيادة":"Driver License Number"}</label><input value={applyForm.driverLicenseNum} onChange={e=>setApplyForm({...applyForm,driverLicenseNum:e.target.value})} style={inp}/></div>
            </div>
            <div style={{marginBottom:16}}>
              <label style={lbl}>{lang==="ar"?"المرافق المتاحة":"Available Facilities"}</label>
              <div style={{display:"flex",gap:20,flexWrap:"wrap",marginTop:4}}>
                {[["hasWifi","📶","WiFi","واي فاي"],["hasWater","💧",lang==="ar"?"مياه":"Water","مياه"],["hasAc","❄️",lang==="ar"?"تكييف":"AC","تكييف"]].map(([k,icon,label])=>(
                  <label key={k} style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:13,fontWeight:700,color:"#333"}}>
                    <input type="checkbox" checked={applyForm[k]} onChange={e=>setApplyForm({...applyForm,[k]:e.target.checked})} style={{width:16,height:16,cursor:"pointer"}}/>
                    {icon} {label}
                  </label>
                ))}
              </div>
            </div>
            <div style={{marginBottom:20}}><label style={lbl}>{t.apply.notes}</label><textarea value={applyForm.notes} onChange={e=>setApplyForm({...applyForm,notes:e.target.value})} style={{...inp,minHeight:65,resize:"vertical"}} rows={2}/></div>
            {applyError&&<div style={{marginBottom:14,padding:"10px 16px",background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:10,color:"#B91C1C",fontSize:13,fontWeight:700}}>{applyError}</div>}
            <button onClick={handleApply} style={{width:"100%",background:"#1B3A2A",color:"white",border:"none",padding:"14px",borderRadius:12,fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>{t.apply.submit}</button>
          </div>)}
        </section>
      )}

      {/* ─── ADMIN ──────────────────────────────────────────────────────────── */}
      {page==="admin"&&isAdmin&&(
        <section style={{maxWidth:960,margin:"0 auto",padding:"40px 24px 80px",...fade}}>
          <h2 style={{fontSize:28,fontWeight:900,color:"#1B3A2A",marginBottom:24,textAlign:"center"}}>{adm.title}</h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,marginBottom:28}}>
            {[{label:lang==="ar"?"رحلات نشطة":"Active Trips",value:dashStats.activeTrips,icon:"🚗",color:"#1B3A2A"},{label:lang==="ar"?"السائقون":"Drivers",value:dashStats.totalDrivers,icon:"👤",color:"#7C3AED"},{label:lang==="ar"?"حجوزات اليوم":"Bookings Today",value:dashStats.bookingsToday,icon:"📋",color:"#C9717A"},{label:lang==="ar"?"أشهر مسار":"Top Route",value:dashStats.popularRoute,icon:"📍",color:"#D4A017"}].map((s,i)=>(
              <div key={i} style={{background:"white",borderRadius:14,padding:"18px 16px",border:"1px solid #E8E6E1",textAlign:"center"}}>
                <div style={{fontSize:24,marginBottom:6}}>{s.icon}</div>
                <div style={{fontSize:typeof s.value==="string"&&s.value.length>5?"13px":"28px",fontWeight:900,color:s.color,marginBottom:4,lineHeight:1.2}}>{s.value}</div>
                <div style={{fontSize:11,color:"#AAA",fontWeight:600}}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:8,marginBottom:28,justifyContent:"center",flexWrap:"wrap"}}>
            {[["applications",adm.applications],["editRequests",adm.editRequests],["drivers",adm.drivers],["allTrips",adm.allTrips],["promoCodes",lang==="ar"?"كودات الخصم":"Promo Codes"],["activity",lang==="ar"?"سجل النشاط 📋":"Activity Log 📋"]].map(([k,l])=>(
              <button key={k} onClick={()=>setAdminTab(k)} style={{padding:"10px 20px",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",border:"2px solid",borderColor:adminTab===k?"#1B3A2A":"#E8E6E1",background:adminTab===k?"#1B3A2A":"white",color:adminTab===k?"white":"#666"}}>{l}</button>
            ))}
          </div>

          {adminTab==="applications"&&(<div>
            <div style={{display:"flex",gap:20,alignItems:"flex-start",flexWrap:"wrap"}}>
            {["pending","approved","denied"].map(status=>{
              const filtered=applications.filter(a=>a.status===status);
              return(<div key={status} style={{flex:1,minWidth:280}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                  <h3 style={{fontSize:15,fontWeight:800,color:status==="approved"?"#065F46":status==="denied"?"#991B1B":"#92400E"}}>{adm[status]} ({filtered.length})</h3>
                  <div style={{flex:1,height:1,background:"#E8E6E1"}}/>
                </div>
                {filtered.length===0?<p style={{color:"#CCC",fontSize:13,paddingInlineStart:8}}>{adm.noApps}</p>:
                filtered.map((app,i)=>(
                  <div key={app.id} style={{background:"white",borderRadius:14,padding:"20px 24px",border:"1px solid #E8E6E1",marginBottom:12,animation:`fadeUp 0.4s ease ${0.05*i}s both`}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
                      <div>
                        <div style={{fontWeight:800,fontSize:16,color:"#1B3A2A",marginBottom:4}}>{app.full_name}</div>
                        <div style={{fontSize:12,color:"#888"}}>{adm.phone}: {app.phone} · {adm.city}: {gc(app.city)?.[lang]||app.city} · {adm.car}: {app.car_type} {app.car_model}</div>
                        {app.notes&&<div style={{fontSize:12,color:"#AAA",marginTop:4}}>{app.notes}</div>}
                      </div>
                      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                        {status==="pending"&&(<>
                          <button onClick={()=>{if(window.confirm(lang==="ar"?"هل أنت متأكد من قبول هذا السائق؟":"Approve this driver?")) updateApplication(app.id,"approved")}} style={{background:"#1B3A2A",color:"white",border:"none",padding:"8px 16px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{adm.approve}</button>
                          <button onClick={()=>updateApplication(app.id,"denied")} style={{background:"#EF4444",color:"white",border:"none",padding:"8px 16px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{adm.deny}</button>
                        </>)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>);
            })}
            </div>
          </div>)}

          {adminTab==="editRequests"&&(<div>
            {editRequests.length===0?<p style={{textAlign:"center",color:"#AAA",padding:"40px"}}>{adm.noApps}</p>:
            editRequests.map((req,i)=>{
              const trip=req.trips;const fc=gc(trip?.from_city);const tc=gc(trip?.to_city);
              return(<div key={req.id} style={{background:"white",borderRadius:14,padding:"20px 24px",border:"1px solid #E8E6E1",marginBottom:12,animation:`fadeUp 0.4s ease ${0.05*i}s both`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
                  <div>
                    <div style={{fontWeight:800,fontSize:15,color:"#1B3A2A",marginBottom:4}}>{fc?.[lang]||trip?.from_city} {lang==="ar"?"إلى":"to"} {tc?.[lang]||trip?.to_city}</div>
                    <div style={{fontSize:12,color:"#888"}}>{trip?.trip_date} · {adm.currentTime}: {formatTime(trip?.trip_time)} → {adm.requestedTime}: <span style={{fontWeight:700,color:"#1B3A2A"}}>{formatTime(req.requested_time)}</span></div>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>handleEditRequest(req.id,"approved",req.trip_id,req.requested_time)} style={{background:"#1B3A2A",color:"white",border:"none",padding:"8px 16px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{adm.approve}</button>
                    <button onClick={()=>handleEditRequest(req.id,"denied",req.trip_id,null)} style={{background:"#EF4444",color:"white",border:"none",padding:"8px 16px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{adm.deny}</button>
                  </div>
                </div>
              </div>);
            })}</div>
          )}

          {adminTab==="drivers"&&(<div>
            {adminDrivers.length===0?<p style={{textAlign:"center",color:"#AAA",padding:"40px"}}>{adm.noApps}</p>:
            adminDrivers.map((d,i)=>(
              <div key={d.id} style={{background:"white",borderRadius:14,padding:"20px 24px",border:"1px solid #E8E6E1",marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12,animation:`fadeUp 0.4s ease ${0.05*i}s both`}}>
                <div onClick={()=>openDriverProfile(d)} style={{cursor:"pointer",flex:1}}>
                  <div style={{fontWeight:800,fontSize:15,color:"#1B3A2A",textDecoration:"underline"}}>{d.full_name}</div>
                  <div style={{fontSize:12,color:"#888"}}>{d.email} · {d.phone}</div>
                </div>
                <button onClick={()=>{if(window.confirm(lang==="ar"?"هل أنت متأكد؟":"Are you sure?")) adminRevokeDriver(d.id)}} style={{background:"#EF4444",color:"white",border:"none",padding:"8px 16px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{adm.revokeAndDelete}</button>
              </div>
            ))}</div>
          )}

          {adminTab==="allTrips"&&(<div>
            <div style={{background:"white",borderRadius:14,padding:"20px",border:"1px solid #E8E6E1",marginBottom:20,display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div><label style={lbl}>{adm.filterByDriver}</label><select value={tripFilterDriver} onChange={e=>setTripFilterDriver(e.target.value)} style={inp}><option value="">{adm.allDrivers}</option>{adminDrivers.map(d=><option key={d.id} value={d.id}>{d.full_name}</option>)}</select></div>
              <div><label style={lbl}>{adm.filterByDate}</label><input type="date" value={tripFilterDate} onChange={e=>setTripFilterDate(e.target.value)} style={inp}/></div>
            </div>
            <div style={{marginBottom:16,textAlign:"center",display:"flex",gap:8,justifyContent:"center"}}>
              <button onClick={loadAdminData} style={{background:"#1B3A2A",color:"white",border:"none",padding:"11px 28px",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>🔍 {lang==="ar"?"تحديث":"Refresh"}</button>
              <button onClick={exportBookingsCSV} style={{background:"#0369A1",color:"white",border:"none",padding:"11px 28px",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>⬇ {lang==="ar"?"تصدير الحجوزات CSV":"Export Bookings CSV"}</button>
            </div>
            <div style={{display:"flex",gap:20,alignItems:"flex-start",flexWrap:"wrap"}}>
            {["pending","active","cancelled"].map(status=>{
              const filtered=filteredAdminTrips.filter(t=>t.status===status);
              const colColor=status==="active"?"#065F46":status==="cancelled"?"#991B1B":"#92400E";
              const isDragTarget=dragOverStatus===status;
              return(<div key={status} style={{flex:1,minWidth:280,transition:"background 0.15s",borderRadius:16,padding:"8px",background:isDragTarget?"#F0F7F3":"transparent",border:isDragTarget?"2px dashed #1B3A2A":"2px dashed transparent"}}
                onDragOver={e=>{e.preventDefault();setDragOverStatus(status);}}
                onDragLeave={e=>{if(!e.currentTarget.contains(e.relatedTarget))setDragOverStatus(null);}}
                onDrop={e=>{e.preventDefault();setDragOverStatus(null);if(draggedTripId){const trip=adminAllTrips.find(t=>t.id===draggedTripId);if(trip&&trip.status!==status)adminMoveTripTo(draggedTripId,status);setDraggedTripId(null);}}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                  <h3 style={{fontSize:15,fontWeight:800,color:colColor}}>{status==="pending"?adm.notApprovedYet:status==="active"?(lang==="ar"?"نشط":"Active"):(lang==="ar"?"ملغى":"Cancelled")} ({filtered.length})</h3>
                  <div style={{flex:1,height:1,background:"#E8E6E1"}}/>
                </div>
                {isDragTarget&&filtered.length===0&&<div style={{height:80,borderRadius:12,border:"2px dashed #1B3A2A",display:"flex",alignItems:"center",justifyContent:"center",color:"#1B3A2A",fontSize:13,fontWeight:700,opacity:0.5}}>{lang==="ar"?"أفلت هنا":"Drop here"}</div>}
                {!isDragTarget&&filtered.length===0&&<p style={{color:"#CCC",fontSize:13,paddingInlineStart:8}}>{adm.noTrips}</p>}
                {filtered.map((trip,i)=>{
                  const fc=gc(trip.from_city);const tc=gc(trip.to_city);
                  return(<div key={trip.id} draggable onDragStart={()=>setDraggedTripId(trip.id)} onDragEnd={()=>{setDraggedTripId(null);setDragOverStatus(null);}} style={{background:"white",borderRadius:14,padding:"18px 20px",border:`1px solid ${draggedTripId===trip.id?"#1B3A2A":"#E8E6E1"}`,marginBottom:10,animation:`fadeUp 0.3s ease ${0.03*i}s both`,cursor:"grab",opacity:draggedTripId===trip.id?0.5:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10}}>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                          <span style={{fontWeight:800,fontSize:14,color:"#1B3A2A"}}>{fc?.[lang]||trip.from_city} {lang==="ar"?"إلى":"to"} {tc?.[lang]||trip.to_city}</span>
                          <GenderBadge type={trip.gender_type} lang={lang}/>
                        </div>
                        <div style={{fontSize:12,color:"#888"}}>{trip.trip_date} {formatTime(trip.trip_time)} · ${trip.price_per_seat}/seat · {trip.available_seats}/{trip.total_seats} seats</div>
                        {trip.profiles?.full_name&&<div style={{fontSize:12,color:"#555",marginTop:2}}>{adm.driver}: {trip.profiles.full_name}</div>}
                      </div>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                        {status==="pending"&&<button onClick={()=>adminApproveTrip(trip.id)} style={{background:"#1B3A2A",color:"white",border:"none",padding:"6px 12px",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{adm.approveTrip}</button>}
                        {status==="active"&&<button onClick={()=>{if(window.confirm(lang==="ar"?"إعادة الرحلة إلى قيد المراجعة؟":"Revert trip back to pending?"))adminMoveTripTo(trip.id,"pending")}} style={{background:"#F59E0B",color:"white",border:"none",padding:"6px 12px",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{lang==="ar"?"إلغاء الموافقة":"Revert"}</button>}
                        <button onClick={async()=>{setExpandedTrip(expandedTrip===trip.id?null:trip.id);if(expandedTrip!==trip.id) await loadTripPassengers(trip.id);}} style={{background:"#3B82F6",color:"white",border:"none",padding:"6px 12px",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{lang==="ar"?"الحجوزات":"Bookings"}</button>
                        <button onClick={()=>{if(window.confirm("Delete?")) adminDeleteTrip(trip.id)}} style={{background:"#EF4444",color:"white",border:"none",padding:"6px 12px",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{adm.deleteTrip}</button>
                      </div>
                    </div>
                    {expandedTrip===trip.id&&(<div style={{marginTop:12,borderTop:"1px solid #F0EEEA",paddingTop:12}}>
                      {!tripPassengers[trip.id]?<p style={{fontSize:12,color:"#AAA"}}>{lang==="ar"?"جاري التحميل...":"Loading..."}</p>
                      :tripPassengers[trip.id].length===0?<p style={{fontSize:12,color:"#AAA"}}>{lang==="ar"?"لا توجد حجوزات":"No bookings yet"}</p>
                      :tripPassengers[trip.id].map((bk,j)=>(
                        <div key={j} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:j<tripPassengers[trip.id].length-1?"1px solid #F5F5F5":"none"}}>
                          <div>
                            <span style={{fontSize:12,fontWeight:700,color:"#1B3A2A"}}>{bk.passenger_name}</span>
                            <span style={{fontSize:11,color:"#888",marginInlineStart:8}}>📞 {bk.passenger_phone}</span>
                          </div>
                          <span style={{fontSize:11,fontWeight:700,color:"#555"}}>{bk.seats} {lang==="ar"?"مقعد":"seat(s)"} · {bk.ref_code}</span>
                        </div>
                      ))}
                    </div>)}
                  </div>);
                })}
              </div>);
            })}
            </div>
          </div>)}

          {adminTab==="promoCodes"&&(<div>
            <div style={{background:"white",borderRadius:14,padding:"24px",border:"1px solid #E8E6E1",marginBottom:24}}>
              <h3 style={{fontSize:16,fontWeight:800,color:"#1B3A2A",marginBottom:16}}>{lang==="ar"?"إنشاء كود جديد":"Create New Code"}</h3>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr auto",gap:10,alignItems:"flex-end"}}>
                <div><label style={lbl}>{lang==="ar"?"الكود":"Code"}</label><input value={newPromo.code} onChange={e=>setNewPromo({...newPromo,code:e.target.value.toUpperCase()})} style={inp} placeholder="SAFFERNI10"/></div>
                <div><label style={lbl}>{lang==="ar"?"نوع الخصم":"Type"}</label><select value={newPromo.discount_type} onChange={e=>setNewPromo({...newPromo,discount_type:e.target.value})} style={inp}><option value="fixed">{lang==="ar"?"مبلغ ثابت ($)":"Fixed ($)"}</option><option value="percentage">{lang==="ar"?"نسبة (%)":"Percentage (%)"}</option></select></div>
                <div><label style={lbl}>{lang==="ar"?"القيمة":"Value"}</label><input type="number" value={newPromo.discount_value} onChange={e=>setNewPromo({...newPromo,discount_value:e.target.value})} style={inp} placeholder="10"/></div>
                <div><label style={lbl}>{lang==="ar"?"الحد الأقصى":"Max Uses"}</label><input type="number" value={newPromo.max_uses} onChange={e=>setNewPromo({...newPromo,max_uses:e.target.value})} style={inp} placeholder={lang==="ar"?"غير محدود":"Unlimited"}/></div>
                <div><label style={lbl}>{lang==="ar"?"تاريخ الانتهاء":"Expires"}</label><input type="date" value={newPromo.expires_at} onChange={e=>setNewPromo({...newPromo,expires_at:e.target.value})} style={inp}/></div>
                <button onClick={createPromoCode} style={{background:"#1B3A2A",color:"white",border:"none",padding:"11px 20px",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{lang==="ar"?"إنشاء":"Create"}</button>
              </div>
            </div>
            {promoCodes.length===0?<p style={{textAlign:"center",color:"#AAA",padding:"40px"}}>{lang==="ar"?"لا توجد كودات":"No promo codes yet"}</p>:
            promoCodes.map((p,i)=>(
              <div key={p.id} style={{background:"white",borderRadius:12,padding:"16px 20px",border:"1px solid #E8E6E1",marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
                <div><span style={{fontWeight:900,fontSize:16,color:"#1B3A2A",letterSpacing:1}}>{p.code}</span><span style={{marginInlineStart:12,fontSize:13,color:"#888"}}>{p.discount_type==="fixed"?`$${p.discount_value} off`:`${p.discount_value}% off`}</span>{p.max_uses!=null&&<span style={{marginInlineStart:10,fontSize:11,color:"#AAA"}}>{p.uses_count||0}/{p.max_uses} {lang==="ar"?"مستخدم":"uses"}</span>}{p.expires_at&&<span style={{marginInlineStart:10,fontSize:11,color:new Date(p.expires_at)<new Date()?"#EF4444":"#AAA"}}>{lang==="ar"?"ينتهي":"exp"} {String(p.expires_at).split("T")[0]}</span>}</div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <span style={{fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,background:p.active?"#D1FAE5":"#FEE2E2",color:p.active?"#065F46":"#991B1B"}}>{p.active?(lang==="ar"?"نشط":"Active"):(lang==="ar"?"معطل":"Inactive")}</span>
                  <button onClick={async()=>{await supabase.from("promo_codes").update({active:!p.active}).eq("id",p.id);loadPromoCodes();}} style={{background:p.active?"#EF4444":"#1B3A2A",color:"white",border:"none",padding:"6px 14px",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{p.active?(lang==="ar"?"تعطيل":"Disable"):(lang==="ar"?"تفعيل":"Enable")}</button>
                </div>
              </div>
            ))}
          </div>)}

          {adminTab==="activity"&&(<div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
              <div>
                <h3 style={{fontSize:16,fontWeight:800,color:"#1B3A2A",marginBottom:4}}>{lang==="ar"?"سجل النشاط الأخير":"Recent Activity Log"}</h3>
                <p style={{fontSize:12,color:"#AAA",margin:0}}>{lang==="ar"?"آخر الطلبات والحجوزات وطلبات التعديل":"Latest applications, bookings, and edit requests"}</p>
              </div>
              <button onClick={loadAdminActivity} style={{background:"#1B3A2A",color:"white",border:"none",padding:"8px 18px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{lang==="ar"?"🔄 تحديث":"🔄 Refresh"}</button>
            </div>
            {adminActivity.length===0?<div style={{padding:"60px",textAlign:"center",color:"#CCC",background:"white",borderRadius:16,border:"1px solid #E8E6E1"}}><div style={{fontSize:36,marginBottom:8}}>📋</div><div style={{fontSize:14,fontWeight:600}}>{lang==="ar"?"لا توجد بيانات — انقر تحديث":"No data — click Refresh"}</div></div>:(
              <div style={{background:"white",borderRadius:16,border:"1px solid #E8E6E1",overflow:"hidden"}}>
                <div style={{display:"grid",gridTemplateColumns:"130px 1fr 90px 90px",padding:"12px 20px",background:"#1B3A2A",fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.85)",textTransform:"uppercase",gap:12}}>
                  <div>{lang==="ar"?"النوع":"Type"}</div>
                  <div>{lang==="ar"?"التفاصيل":"Details"}</div>
                  <div style={{textAlign:"center"}}>{lang==="ar"?"الحالة":"Status"}</div>
                  <div style={{textAlign:"right"}}>{lang==="ar"?"الوقت":"Time"}</div>
                </div>
                {adminActivity.map((ev,i)=>{
                  const typeLabel=ev.type==="application"?(lang==="ar"?"طلب سائق 👤":"Application 👤"):ev.type==="booking"?(lang==="ar"?"حجز 📋":"Booking 📋"):(lang==="ar"?"طلب تعديل ✏️":"Edit Request ✏️");
                  const statusBg={pending:"#FFF3CD",approved:"#D1FAE5",denied:"#FEE2E2",confirmed:"#BBF7D0",cancelled:"#FEE2E2",active:"#D1FAE5"}[ev.status]||"#F3F4F6";
                  const statusFg={pending:"#92400E",approved:"#065F46",denied:"#991B1B",confirmed:"#065F46",cancelled:"#991B1B",active:"#065F46"}[ev.status]||"#555";
                  return(<div key={`${ev.type}-${ev.id}`} style={{display:"grid",gridTemplateColumns:"130px 1fr 90px 90px",padding:"13px 20px",borderBottom:i<adminActivity.length-1?"1px solid #F0EEEA":"none",fontSize:13,gap:12,alignItems:"center"}} onMouseEnter={e=>e.currentTarget.style.background="#FAFAF8"} onMouseLeave={e=>e.currentTarget.style.background="white"}>
                    <div style={{fontWeight:700,color:"#444",fontSize:12}}>{typeLabel}</div>
                    <div style={{color:"#333",fontWeight:600,fontSize:13}}>
                      {ev.type==="application"&&ev.title}
                      {ev.type==="booking"&&`${ev.title||"—"} · ${ev.seats} ${lang==="ar"?"مقعد":"seat(s)"} · ${ev.route||""} ${ev.date?`(${ev.date})`:""}`}
                      {ev.type==="edit"&&`${ev.route||""} → ${ev.newTime||""}`}
                    </div>
                    <div style={{textAlign:"center"}}><span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:statusBg,color:statusFg}}>{ev.status||"—"}</span></div>
                    <div style={{textAlign:"right",fontSize:11,color:"#AAA",fontWeight:600}}>{timeAgo(ev.ts)}</div>
                  </div>);
                })}
              </div>
            )}
          </div>)}
        </section>
      )}

      {/* ─── DRIVER PANEL ───────────────────────────────────────────────────── */}
      {page==="driver"&&user&&driverApproved&&(
        <section style={{maxWidth:700,margin:"0 auto",padding:"40px 24px 80px",...fade}}>
          <h2 style={{fontSize:28,fontWeight:900,color:"#1B3A2A",marginBottom:24,textAlign:"center"}}>{drv.title}</h2>
          <div>
            {editRequestMsg&&<div style={{marginBottom:16,padding:"12px 20px",background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:10,color:"#166534",fontSize:13,fontWeight:700,textAlign:"center"}}>{editRequestMsg}</div>}
            <div style={{background:"white",borderRadius:16,padding:"28px",border:"1px solid #E8E6E1",marginBottom:24}}>
              <h3 style={{fontSize:18,fontWeight:800,color:"#1B3A2A",marginBottom:20}}>{drv.addTrip}</h3>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
                <div><label style={lbl}>{drv.from} *</label><select value={tripForm.from} onChange={e=>setTripForm({...tripForm,from:e.target.value,to:""})} style={inp}><option value="">{drv.selectCity}</option>{cities.map(c=><option key={c.id} value={c.id}>{c[lang]}</option>)}</select></div>
                <div><label style={lbl}>{drv.to} *</label><select value={tripForm.to} onChange={e=>setTripForm({...tripForm,to:e.target.value})} style={inp} disabled={!tripForm.from}><option value="">{tripForm.from?b.selectDest:b.selectFromFirst}</option>{tripForm.from?getDests(tripForm.from).map(id=>{const c=gc(id);return<option key={id} value={id}>{c[lang]}</option>}):null}</select></div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
                <div><label style={lbl}>{drv.date} *</label><input type="date" value={tripForm.date} min={new Date().toISOString().split("T")[0]} onChange={e=>setTripForm({...tripForm,date:e.target.value})} style={inp}/></div>
                <div><label style={lbl}>{drv.time}</label><select value={tripForm.time} onChange={e=>setTripForm({...tripForm,time:e.target.value})} style={inp}><option value="">--</option>{timeOptions.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:16}}>
                <div>{(()=>{const dr=tripForm.from&&tripForm.to?findRoute(tripForm.from,tripForm.to):null;const lim=dr&&!dr.comingSoon?dr:null;return(<><label style={lbl}>{drv.pricePerSeat} *{lim&&<span style={{fontWeight:600,color:"#1B3A2A",marginInlineStart:4,fontSize:10}}>(${lim.seatMin}–${lim.seatMax})</span>}</label><input type="number" min={lim?.seatMin} max={lim?.seatMax} value={tripForm.pricePerSeat} onChange={e=>setTripForm({...tripForm,pricePerSeat:e.target.value})} style={inp} placeholder={lim?`${lim.seatMin}–${lim.seatMax}`:"0"}/></>)})()}</div>
                <div><label style={lbl}>{drv.totalSeats}</label><select value={tripForm.totalSeats} onChange={e=>setTripForm({...tripForm,totalSeats:e.target.value})} style={inp}>{[2,3,4,5,6,7,8,9,10].map(n=><option key={n} value={n}>{n}</option>)}</select></div>
                <div><label style={lbl}>{drv.carType}</label><input value={tripForm.carType} onChange={e=>setTripForm({...tripForm,carType:e.target.value})} style={inp}/></div>
              </div>
              <div style={{marginBottom:16}}>
                <label style={lbl}>{drv.genderType} *</label>
                <div style={{display:"flex",gap:10}}>
                  <button onClick={()=>setTripForm({...tripForm,genderType:"mixed"})} style={{flex:1,padding:"12px",borderRadius:12,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",border:"2px solid",transition:"all 0.2s",borderColor:tripForm.genderType==="mixed"?"#1B3A2A":"#E8E6E1",background:tripForm.genderType==="mixed"?"#1B3A2A":"white",color:tripForm.genderType==="mixed"?"white":"#666"}}>{drv.mixed}</button>
                  <button disabled style={{flex:1,padding:"12px",borderRadius:12,fontSize:13,fontWeight:700,cursor:"not-allowed",fontFamily:"inherit",border:"2px solid #E8E6E1",background:"#F8F8F8",color:"#CCC"}}>💜 {lang==="ar"?"نساء فقط — قريباً":"Women Only — Soon"}</button>
                </div>
              </div>
              {tripError&&<div style={{marginBottom:12,padding:"10px 16px",background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:10,color:"#B91C1C",fontSize:13,fontWeight:700}}>{tripError}</div>}
              {tripSuccess&&<div style={{marginBottom:12,padding:"10px 16px",background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:10,color:"#166534",fontSize:13,fontWeight:700}}>✓ {drv.success}</div>}
              <button onClick={postTrip} style={{width:"100%",background:"#1B3A2A",color:"white",border:"none",padding:"14px",borderRadius:12,fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>{drv.submit}</button>
            </div>

            {/* Driver profile quick edit */}
            <div style={{background:"white",borderRadius:16,padding:"28px",border:"1px solid #E8E6E1",marginBottom:24}}>
              <h3 style={{fontSize:18,fontWeight:800,color:"#1B3A2A",marginBottom:20}}>{lang==="ar"?"ملفي الشخصي":"My Profile"}</h3>
              <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
                {!driverEditing&&<button onClick={()=>setDriverEditing(true)} style={{background:"#F0F7F3",color:"#1B3A2A",border:"1.5px solid #1B3A2A",padding:"7px 18px",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{lang==="ar"?"تعديل":"Edit"}</button>}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                <div><label style={lbl}>{lang==="ar"?"الاسم الكامل":"Full Name"}</label>{driverEditing?<input value={driverProfile.fullName} onChange={e=>setDriverProfile({...driverProfile,fullName:e.target.value})} style={inp}/>:<div style={{fontSize:14,fontWeight:600,color:"#333",padding:"11px 0"}}>{driverProfile.fullName||"—"}</div>}</div>
                <div><label style={lbl}>{lang==="ar"?"تاريخ الميلاد":"Date of Birth"}</label>{driverEditing?<input type="date" value={driverProfile.dob} max={new Date(new Date().setFullYear(new Date().getFullYear()-18)).toISOString().split("T")[0]} onChange={e=>setDriverProfile({...driverProfile,dob:e.target.value})} style={inp}/>:<div style={{fontSize:14,fontWeight:600,color:"#333",padding:"11px 0"}}>{driverProfile.dob||"—"}</div>}</div>
              </div>
              <div style={{marginBottom:12}}><label style={lbl}>{lang==="ar"?"رقم الهوية أو الجواز":"ID / Passport Number"}</label>{driverEditing?<input value={driverProfile.idNumber} onChange={e=>setDriverProfile({...driverProfile,idNumber:e.target.value})} style={inp}/>:<div style={{fontSize:14,fontWeight:600,color:"#333",padding:"11px 0"}}>{driverProfile.idNumber||"—"}</div>}</div>
              <div style={{marginBottom:12}}><label style={lbl}>{lang==="ar"?"نوع السيارة والسنة":"Car Kind & Year"}</label>{driverEditing?<input value={driverProfile.carKindYear} onChange={e=>setDriverProfile({...driverProfile,carKindYear:e.target.value})} style={inp} placeholder={lang==="ar"?"مثال: تويوتا كامري 2020":"e.g. Toyota Camry 2020"}/>:<div style={{fontSize:14,fontWeight:600,color:"#333",padding:"11px 0"}}>{driverProfile.carKindYear||"—"}</div>}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                <div><label style={lbl}>{lang==="ar"?"رقم اللوحة":"License Plate"}</label>{driverEditing?<input value={driverProfile.carPlate} onChange={e=>setDriverProfile({...driverProfile,carPlate:e.target.value})} style={inp}/>:<div style={{fontSize:14,fontWeight:600,color:"#333",padding:"11px 0"}}>{driverProfile.carPlate||"—"}</div>}</div>
                <div><label style={lbl}>{lang==="ar"?"رقم رخصة النقل":"Transport License"}</label>{driverEditing?<input value={driverProfile.transportLicense} onChange={e=>setDriverProfile({...driverProfile,transportLicense:e.target.value})} style={inp}/>:<div style={{fontSize:14,fontWeight:600,color:"#333",padding:"11px 0"}}>{driverProfile.transportLicense||"—"}</div>}</div>
              </div>
              <div style={{marginBottom:12}}><label style={lbl}>{lang==="ar"?"رقم رخصة القيادة":"Driver License Number"}</label>{driverEditing?<input value={driverProfile.driverLicense} onChange={e=>setDriverProfile({...driverProfile,driverLicense:e.target.value})} style={inp}/>:<div style={{fontSize:14,fontWeight:600,color:"#333",padding:"11px 0"}}>{driverProfile.driverLicense||"—"}</div>}</div>
              <div style={{marginBottom:16}}>
                <label style={lbl}>{lang==="ar"?"المرافق المتاحة":"Available Facilities"}</label>
                <div style={{display:"flex",gap:20,flexWrap:"wrap",marginTop:6}}>
                  {[["hasWifi","📶","WiFi","واي فاي"],["hasWater","💧",lang==="ar"?"مياه":"Water","مياه"],["hasAc","❄️",lang==="ar"?"تكييف":"AC","تكييف"]].map(([k,icon,label])=>(
                    driverEditing
                      ?<label key={k} style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:13,fontWeight:700,color:"#333"}}><input type="checkbox" checked={driverProfile[k]} onChange={e=>setDriverProfile({...driverProfile,[k]:e.target.checked})} style={{width:16,height:16,cursor:"pointer"}}/>{icon} {label}</label>
                      :<span key={k} style={{fontSize:13,fontWeight:700,color:driverProfile[k]?"#1B3A2A":"#CCC"}}>{icon} {label}</span>
                  ))}
                </div>
              </div>
              {driverProfileMsg&&<div style={{marginBottom:12,padding:"10px 16px",background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:10,color:"#166534",fontSize:13,fontWeight:700}}>{driverProfileMsg}</div>}
              {driverEditing&&<div style={{display:"flex",gap:10}}>
                <button onClick={()=>setDriverEditing(false)} style={{flex:1,background:"white",color:"#666",border:"1.5px solid #DDD",padding:"12px",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{lang==="ar"?"إلغاء":"Cancel"}</button>
                <button onClick={()=>{saveDriverProfile();setDriverEditing(false);}} style={{flex:2,background:"#1B3A2A",color:"white",border:"none",padding:"12px",borderRadius:10,fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>{lang==="ar"?"حفظ التغييرات":"Save Changes"}</button>
              </div>}
            </div>

            <h3 style={{fontSize:18,fontWeight:800,color:"#1B3A2A",marginBottom:16}}>{drv.myTrips}</h3>
            {driverTrips.length===0?<p style={{color:"#AAA",textAlign:"center",padding:"24px"}}>{drv.noTrips}</p>:
            driverTrips.map((trip,i)=>{
              const fc=gc(trip.from_city);const tc=gc(trip.to_city);
              const isPast=new Date(trip.trip_date)<new Date(new Date().toDateString());
              return(<div key={trip.id} onClick={()=>{setSelectedTripDetail(trip);loadTripBookings(trip.id);}} style={{background:"white",borderRadius:14,padding:"18px 20px",border:"1px solid #E8E6E1",marginBottom:10,animation:`fadeUp 0.4s ease ${0.05*i}s both`,cursor:"pointer"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10}}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                      <span style={{fontWeight:800,fontSize:14,color:"#1B3A2A"}}>{fc?.[lang]||trip.from_city} {lang==="ar"?"إلى":"to"} {tc?.[lang]||trip.to_city}</span>
                      <GenderBadge type={trip.gender_type} lang={lang}/>
                    </div>
                    <div style={{fontSize:12,color:"#888"}}>{trip.trip_date} {formatTime(trip.trip_time)} · ${trip.price_per_seat}/seat</div>
                    <div style={{display:"flex",gap:12,marginTop:6,alignItems:"center"}}>
                      <span style={{fontSize:12,color:"#1B3A2A",fontWeight:700}}>📋 {bookingCounts[trip.id]||0} {drv.bookings}</span>
                      {trip.avg_rating>0&&<span style={{fontSize:12,color:"#F59E0B",fontWeight:700}}>★ {trip.avg_rating?.toFixed(1)}</span>}
                    </div>
                    <SeatMap total={trip.total_seats} available={trip.available_seats}/>
                    {!trip.approved&&<div style={{marginTop:6,fontSize:11,fontWeight:700,color:"#92400E"}}>{drv.pendingApproval}</div>}
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end"}}>
                    <span style={statusBadge(trip.status)}>{trip.status}</span>
                    {(trip.status==="active"||trip.status==="pending")&&!isPast&&(<div style={{display:"flex",gap:6}}>
                      {trip.status==="active"&&<button onClick={e=>{e.stopPropagation();setEditRequestForm({tripId:trip.id,newTime:""});setShowEditModal(true);}} style={{background:"#F0F7F3",color:"#1B3A2A",border:"1px solid #1B3A2A",padding:"5px 12px",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{drv.requestTimeEdit}</button>}
                      <button onClick={e=>{e.stopPropagation();cancelDriverTrip(trip.id);}} style={{background:"#EF4444",color:"white",border:"none",padding:"5px 12px",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{drv.cancel}</button>
                    </div>)}
                  </div>
                </div>
              </div>);
            })}
          </div>
        </section>
      )}

      {/* DRIVER PROFILE MODAL (admin) */}
      {selectedDriver&&page==="admin"&&(
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.5)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px",overflowY:"auto"}}>
          <div style={{background:"white",borderRadius:20,padding:"32px",maxWidth:520,width:"100%",animation:"fadeUp 0.3s ease",maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
              <h3 style={{fontSize:18,fontWeight:900,color:"#1B3A2A"}}>{lang==="ar"?"ملف السائق":"Driver Profile"}</h3>
              <button onClick={()=>setSelectedDriver(null)} style={{background:"transparent",border:"none",fontSize:20,cursor:"pointer",color:"#888"}}>✕</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              <div><label style={lbl}>{lang==="ar"?"الاسم الكامل":"Full Name"}</label><input value={driverProfile.fullName} onChange={e=>setDriverProfile({...driverProfile,fullName:e.target.value})} style={inp}/></div>
              <div><label style={lbl}>{lang==="ar"?"تاريخ الميلاد":"Date of Birth"}</label><input type="date" value={driverProfile.dob} max={new Date(new Date().setFullYear(new Date().getFullYear()-18)).toISOString().split("T")[0]} onChange={e=>setDriverProfile({...driverProfile,dob:e.target.value})} style={inp}/></div>
            </div>
            <div style={{marginBottom:12}}><label style={lbl}>{lang==="ar"?"رقم الهوية أو الجواز":"ID / Passport Number"}</label><input value={driverProfile.idNumber} onChange={e=>setDriverProfile({...driverProfile,idNumber:e.target.value})} style={inp}/></div>
            <div style={{marginBottom:12}}><label style={lbl}>{lang==="ar"?"نوع السيارة والسنة":"Car Kind & Year"}</label><input value={driverProfile.carKindYear} onChange={e=>setDriverProfile({...driverProfile,carKindYear:e.target.value})} style={inp} placeholder={lang==="ar"?"مثال: تويوتا كامري 2020":"e.g. Toyota Camry 2020"}/></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              <div><label style={lbl}>{lang==="ar"?"رقم اللوحة":"License Plate"}</label><input value={driverProfile.carPlate} onChange={e=>setDriverProfile({...driverProfile,carPlate:e.target.value})} style={inp}/></div>
              <div><label style={lbl}>{lang==="ar"?"رقم رخصة النقل":"Transport License"}</label><input value={driverProfile.transportLicense} onChange={e=>setDriverProfile({...driverProfile,transportLicense:e.target.value})} style={inp}/></div>
            </div>
            <div style={{marginBottom:12}}><label style={lbl}>{lang==="ar"?"رقم رخصة القيادة":"Driver License Number"}</label><input value={driverProfile.driverLicense} onChange={e=>setDriverProfile({...driverProfile,driverLicense:e.target.value})} style={inp}/></div>
            <div style={{marginBottom:20}}>
              <label style={lbl}>{lang==="ar"?"المرافق المتاحة":"Available Facilities"}</label>
              <div style={{display:"flex",gap:20,flexWrap:"wrap",marginTop:6}}>
                {[["hasWifi","📶","WiFi","واي فاي"],["hasWater","💧",lang==="ar"?"مياه":"Water","مياه"],["hasAc","❄️",lang==="ar"?"تكييف":"AC","تكييف"]].map(([k,icon,label])=>(
                  <label key={k} style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:13,fontWeight:700,color:"#333"}}><input type="checkbox" checked={driverProfile[k]} onChange={e=>setDriverProfile({...driverProfile,[k]:e.target.checked})} style={{width:16,height:16,cursor:"pointer"}}/>{icon} {label}</label>
                ))}
              </div>
            </div>
            {driverProfileMsg&&<div style={{marginBottom:12,padding:"10px 16px",background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:10,color:"#166534",fontSize:13,fontWeight:700}}>{driverProfileMsg}</div>}
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setSelectedDriver(null)} style={{flex:1,background:"white",color:"#666",border:"1.5px solid #DDD",padding:"12px",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>✕</button>
              <button onClick={saveDriverProfile} style={{flex:2,background:"#1B3A2A",color:"white",border:"none",padding:"12px",borderRadius:10,fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>{lang==="ar"?"حفظ":"Save"}</button>
            </div>
          </div>
        </div>
      )}

      {/* PASSENGER BOOKING DETAIL MODAL */}
      {selectedBookingDetail&&(
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.5)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px"}} onClick={()=>setSelectedBookingDetail(null)}>
          <div style={{background:"white",borderRadius:20,padding:"32px",maxWidth:420,width:"100%",animation:"fadeUp 0.3s ease",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h3 style={{fontSize:18,fontWeight:900,color:"#1B3A2A"}}>{lang==="ar"?"تفاصيل الرحلة":"Trip Details"}</h3>
              <button onClick={()=>setSelectedBookingDetail(null)} style={{background:"transparent",border:"none",fontSize:20,cursor:"pointer",color:"#888"}}>✕</button>
            </div>
            {(()=>{
              const bk=selectedBookingDetail;const trip=bk.trips;
              const fc=gc(trip?.from_city);const tc=gc(trip?.to_city);
              return(<>
                <div style={{background:"#F0F7F3",borderRadius:14,padding:"16px 20px",marginBottom:16}}>
                  <div style={{fontWeight:900,fontSize:16,color:"#1B3A2A",marginBottom:6}}>{fc?.[lang]||trip?.from_city} → {tc?.[lang]||trip?.to_city}</div>
                  <div style={{fontSize:13,color:"#555"}}>{trip?.trip_date} · {formatTime(trip?.trip_time)}</div>
                  {trip?.car_type&&<div style={{fontSize:12,color:"#888",marginTop:4}}>🚗 {trip.car_type}</div>}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
                  {[
                    [lang==="ar"?"رقم الحجز":"Ref",bk.ref_code],
                    [lang==="ar"?"المقاعد":"Seats",bk.seats],
                    [lang==="ar"?"الدفع":"Payment",bk.payment_method],
                    [lang==="ar"?"الإجمالي":"Total","$"+(bk.total_price||"—")],
                    [lang==="ar"?"الحالة":"Status",bk.status],
                  ].map(([label,val])=>(
                    <div key={label} style={{background:"#FAFAF8",borderRadius:10,padding:"10px 14px",border:"1px solid #E8E6E1"}}>
                      <div style={{fontSize:10,fontWeight:700,color:"#AAA",marginBottom:2}}>{label}</div>
                      <div style={{fontSize:13,fontWeight:800,color:"#1B3A2A"}}>{val}</div>
                    </div>
                  ))}
                </div>
                {trip?.driver_id&&(
                  <button onClick={async()=>{await openDriverPublicPage(trip.driver_id);}} style={{width:"100%",background:"#1B3A2A",color:"white",border:"none",padding:"12px",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginBottom:10}}>
                    👤 {lang==="ar"?"عرض ملف السائق":"View Driver Profile"}
                  </button>
                )}
              </>);
            })()}
          </div>
        </div>
      )}

      {/* DRIVER TRIP BOOKINGS MODAL */}
      {selectedTripDetail&&(
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.5)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px"}} onClick={()=>setSelectedTripDetail(null)}>
          <div style={{background:"white",borderRadius:20,padding:"32px",maxWidth:500,width:"100%",animation:"fadeUp 0.3s ease",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h3 style={{fontSize:18,fontWeight:900,color:"#1B3A2A"}}>{lang==="ar"?"حجوزات الرحلة":"Trip Bookings"}</h3>
              <button onClick={()=>setSelectedTripDetail(null)} style={{background:"transparent",border:"none",fontSize:20,cursor:"pointer",color:"#888"}}>✕</button>
            </div>
            {(()=>{
              const trip=selectedTripDetail;
              const fc=gc(trip.from_city);const tc=gc(trip.to_city);
              return(<>
                <div style={{background:"#F0F7F3",borderRadius:14,padding:"14px 18px",marginBottom:20}}>
                  <div style={{fontWeight:900,fontSize:15,color:"#1B3A2A"}}>{fc?.[lang]||trip.from_city} → {tc?.[lang]||trip.to_city}</div>
                  <div style={{fontSize:12,color:"#555",marginTop:4}}>{trip.trip_date} · {formatTime(trip.trip_time)} · {trip.total_seats-trip.available_seats}/{trip.total_seats} {lang==="ar"?"مقعد محجوز":"seats booked"}</div>
                  {trip.status==="active"&&<button onClick={()=>markTripCompleted(trip.id)} style={{marginTop:10,background:"#0369A1",color:"white",border:"none",padding:"7px 18px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>✓ {lang==="ar"?"تحديد كمكتملة":"Mark as Completed"}</button>}
                  {trip.status==="completed"&&<div style={{marginTop:8,fontSize:12,fontWeight:700,color:"#0369A1"}}>✓ {lang==="ar"?"الرحلة مكتملة":"Trip completed"}</div>}
                </div>
                {tripDetailLoading?<p style={{textAlign:"center",color:"#AAA",padding:"24px"}}>{lang==="ar"?"جاري التحميل...":"Loading..."}</p>
                :tripDetailBookings.length===0?<p style={{textAlign:"center",color:"#AAA",padding:"24px"}}>{lang==="ar"?"لا توجد حجوزات بعد":"No bookings yet"}</p>
                :tripDetailBookings.map((bk,i)=>(
                  <div key={bk.id} style={{background:"#FAFAF8",borderRadius:12,padding:"14px 16px",border:"1px solid #E8E6E1",marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,flexWrap:"wrap"}}>
                      <div>
                        <div style={{fontWeight:800,fontSize:14,color:"#1B3A2A",marginBottom:2}}>{bk.passenger_name}</div>
                        <div style={{fontSize:12,color:"#555"}}>{bk.status==="confirmed"?bk.passenger_phone:(lang==="ar"?"📞 يظهر الرقم بعد التأكيد":"📞 Phone visible after confirming")}</div>
                        <div style={{fontSize:11,color:"#888",marginTop:4}}>💺 {bk.seats} {lang==="ar"?"مقعد":"seat(s)"} · {bk.payment_method} · 📋 {bk.ref_code}</div>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end"}}>
                        <span style={statusBadge(bk.status)}>{bk.status}</span>
                        {bk.status==="pending"&&<div style={{display:"flex",gap:6}}>
                          <button onClick={()=>confirmBooking(bk.id)} style={{background:"#1B3A2A",color:"white",border:"none",padding:"5px 12px",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{lang==="ar"?"قبول":"Confirm"}</button>
                          <button onClick={()=>rejectBooking(bk.id)} style={{background:"#EF4444",color:"white",border:"none",padding:"5px 12px",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{lang==="ar"?"رفض":"Reject"}</button>
                        </div>}
                      </div>
                    </div>
                  </div>
                ))}
              </>);
            })()}
          </div>
        </div>
      )}

      {/* DRIVER PUBLIC PROFILE MODAL */}
      {driverPublicPage&&(
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.5)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px"}} onClick={()=>setDriverPublicPage(null)}>
          <div style={{background:"white",borderRadius:20,padding:"32px",maxWidth:420,width:"100%",animation:"fadeUp 0.3s ease",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h3 style={{fontSize:18,fontWeight:900,color:"#1B3A2A"}}>👤 {lang==="ar"?"ملف السائق":"Driver Profile"}</h3>
              <button onClick={()=>setDriverPublicPage(null)} style={{background:"transparent",border:"none",fontSize:20,cursor:"pointer",color:"#888"}}>✕</button>
            </div>
            <div style={{background:"#F0F7F3",borderRadius:14,padding:"18px 20px",marginBottom:20}}>
              <div style={{fontSize:20,fontWeight:900,color:"#1B3A2A",marginBottom:4}}>{driverPublicPage.profile?.full_name||"—"}</div>
              {driverPublicPage.profile?.car_type&&<div style={{fontSize:14,color:"#555",fontWeight:600}}>🚗 {driverPublicPage.profile.car_type}</div>}
            </div>
            <div style={{marginBottom:20}}>
              <div style={{fontSize:12,fontWeight:700,color:"#888",textTransform:"uppercase",marginBottom:10}}>{lang==="ar"?"المرافق المتاحة":"Available Facilities"}</div>
              <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                {[["has_wifi","📶","WiFi","واي فاي"],["has_water","💧",lang==="ar"?"مياه":"Water","مياه"],["has_ac","❄️",lang==="ar"?"تكييف":"AC","تكييف"]].map(([k,icon,label])=>{
                  const has=driverPublicPage.profile?.[k];
                  return(<span key={k} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:20,fontSize:12,fontWeight:700,background:has?"#D1FAE5":"#F3F4F6",color:has?"#065F46":"#9CA3AF",border:`1px solid ${has?"#A7F3D0":"#E5E7EB"}`}}>{icon} {label}</span>);
                })}
              </div>
            </div>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:"#888",textTransform:"uppercase",marginBottom:10}}>{lang==="ar"?"تقييمات الركاب":"Passenger Reviews"}</div>
              {driverPublicPage.reviews.length===0
                ?<p style={{textAlign:"center",color:"#CCC",padding:"20px 0",fontSize:13}}>{lang==="ar"?"لا توجد تقييمات بعد":"No reviews yet"}</p>
                :driverPublicPage.reviews.map((r,i)=>(
                  <div key={i} style={{borderBottom:i<driverPublicPage.reviews.length-1?"1px solid #F0EEEA":"none",paddingBottom:12,marginBottom:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                      <span style={{fontSize:13,fontWeight:700,color:"#1B3A2A"}}>{r.passenger_name||"—"}</span>
                      <StarRating value={r.rating} readOnly/>
                    </div>
                    {r.review_text&&<p style={{fontSize:13,color:"#555",lineHeight:1.6,margin:0}}>{r.review_text}</p>}
                    <span style={{fontSize:11,color:"#BBB"}}>{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}

      {/* TIME EDIT MODAL */}
      {showEditModal&&(
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.5)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px"}}>
          <div style={{background:"white",borderRadius:20,padding:"32px",maxWidth:360,width:"100%",animation:"fadeUp 0.3s ease"}}>
            <h3 style={{fontSize:18,fontWeight:900,color:"#1B3A2A",marginBottom:16}}>{drv.requestTimeEdit}</h3>
            <div style={{marginBottom:20}}><label style={lbl}>{drv.newTime} *</label>
              <select value={editRequestForm.newTime} onChange={e=>setEditRequestForm({...editRequestForm,newTime:e.target.value})} style={inp}>
                <option value="">--</option>
                {timeOptions.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setShowEditModal(false)} style={{flex:1,background:"white",color:"#666",border:"1.5px solid #DDD",padding:"12px",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>✕</button>
              <button onClick={requestTimeEdit} style={{flex:2,background:"#1B3A2A",color:"white",border:"none",padding:"12px",borderRadius:10,fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>{drv.submitRequest}</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── HOME ────────────────────────────────────────────────────────────── */}
      {page==="home"&&(<div>
        {/* HERO */}
        <section style={{background:"linear-gradient(180deg,#1B3A2A,#234D36)",padding:"70px 24px 80px",textAlign:"center",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:3,height:"100%",background:"rgba(255,255,255,0.05)"}}/>
          <svg style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",opacity:0.04}} viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice"><g fill="white"><path d="M60 320 l10-20 h30 l5-15 h25 l5 15 h30 l10 20z M75 320a8 8 0 1 0 16 0M125 320a8 8 0 1 0 16 0"/><path d="M550 300 l12-24 h36 l6-18 h30 l6 18 h36 l12 24z M568 300a10 10 0 1 0 20 0M628 300a10 10 0 1 0 20 0"/><path d="M250 350 l8-16 h24 l4-12 h20 l4 12 h24 l8 16z M262 350a6 6 0 1 0 12 0M302 350a6 6 0 1 0 12 0"/><path d="M420 340 l10-20 h30 l5-15 h25 l5 15 h30 l10 20z M435 340a8 8 0 1 0 16 0M485 340a8 8 0 1 0 16 0"/></g></svg>
          <div style={{position:"relative",zIndex:1,...fade}}>
            <div style={{animation:"float 3s ease-in-out infinite",marginBottom:20}}><LogoSVG light/></div>
            <h1 style={{fontSize:"clamp(48px,10vw,80px)",fontWeight:900,color:"white",lineHeight:1.1,marginBottom:4}}>{t.brand}</h1>
            <div style={{fontSize:16,fontWeight:700,color:"rgba(255,255,255,0.4)",letterSpacing:10,marginBottom:24}}>{t.brandEn}</div>
            <p style={{fontSize:"clamp(16px,3vw,22px)",fontWeight:600,color:"rgba(255,255,255,0.9)",marginBottom:12,maxWidth:500,marginInline:"auto"}}>{t.tagline}</p>
            <p style={{fontSize:13,color:"rgba(255,255,255,0.4)",maxWidth:460,marginInline:"auto",marginBottom:32}}>{t.subtitle}</p>
            <button onClick={scrollToSearch} style={{background:"white",color:"#1B3A2A",border:"none",padding:"14px 44px",borderRadius:12,fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 20px rgba(0,0,0,0.2)",transition:"transform 0.2s"}} onMouseEnter={e=>e.target.style.transform="scale(1.04)"} onMouseLeave={e=>e.target.style.transform="scale(1)"}>{t.nav.book}</button>
          </div>
        </section>

        {/* TWO CARDS BANNER */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0}}>
          <div style={{background:"linear-gradient(135deg,#C9717A,#D4848C)",padding:"28px 20px",cursor:"default",position:"relative",overflow:"hidden",opacity:0.9}}>
            <div style={{position:"absolute",top:"-10px",right:"-10px",fontSize:60,opacity:0.1}}>💜</div>
            <div style={{textAlign:"center",position:"relative",zIndex:1}}>
              <div style={{width:44,height:44,borderRadius:"50%",background:"rgba(255,255,255,0.25)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 10px",fontSize:20}}>🤍</div>
              <div style={{fontSize:"clamp(13px,3vw,17px)",fontWeight:900,color:"white",marginBottom:8}}>{lang==="ar"?"سافري بأمان وراحة 💜":"Travel safe & comfortable 💜"}</div>
              <div style={{display:"inline-block",background:"rgba(255,255,255,0.25)",borderRadius:20,padding:"3px 14px",fontSize:11,fontWeight:700,color:"white",marginBottom:10}}>{lang==="ar"?"نساء فقط":"Women Only"}</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.85)",lineHeight:1.6,marginBottom:14}}>{lang==="ar"?"بيئة مخصصة للسيدات فقط — سافري براحة بال 💅":"A safe space for women travelers only 💅"}</div>
              <div style={{background:"rgba(0,0,0,0.25)",border:"1px solid rgba(255,255,255,0.3)",borderRadius:20,padding:"6px 16px",fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.85)",display:"inline-block"}}>{lang==="ar"?"قريباً... 💜":"Coming Soon 💜"}</div>
            </div>
          </div>
          <div onClick={()=>{setSearchGender("mixed");searchRef.current?.scrollIntoView({behavior:"smooth"})}} style={{background:"linear-gradient(135deg,#4A5C45,#5C7055)",padding:"28px 20px",cursor:"pointer",position:"relative",overflow:"hidden",transition:"filter 0.2s"}} onMouseEnter={e=>e.currentTarget.style.filter="brightness(1.08)"} onMouseLeave={e=>e.currentTarget.style.filter="brightness(1)"}>
            <div style={{position:"absolute",top:"-10px",left:"-10px",fontSize:60,opacity:0.1}}>🚗</div>
            <div style={{textAlign:"center",position:"relative",zIndex:1}}>
              <div style={{width:44,height:44,borderRadius:"50%",background:"rgba(255,255,255,0.25)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 10px",fontSize:20}}>🤍</div>
              <div style={{fontSize:"clamp(13px,3vw,17px)",fontWeight:900,color:"white",marginBottom:8}}>{lang==="ar"?"سافر بأمان وراحة 🚗":"Travel safe & comfortable 🚗"}</div>
              <div style={{display:"inline-block",background:"rgba(255,255,255,0.25)",borderRadius:20,padding:"3px 14px",fontSize:11,fontWeight:700,color:"white",marginBottom:10}}>{lang==="ar"?"للجميع":"For Everyone"}</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.85)",lineHeight:1.6,marginBottom:14}}>{lang==="ar"?"رحلات مريحة وآمنة لجميع المسافرين — خدمة موثوقة وسعر مناسب":"Comfortable rides for all travelers — trusted service & fair prices"}</div>
              <div style={{background:"rgba(255,255,255,0.2)",border:"1px solid rgba(255,255,255,0.4)",borderRadius:20,padding:"6px 16px",fontSize:11,fontWeight:700,color:"white",display:"inline-block"}}>{lang==="ar"?"اضغط هنا للبحث 🚗":"Tap to search 🚗"}</div>
            </div>
          </div>
        </div>

        {/* ABOUT */}
        <section style={{maxWidth:800,margin:"0 auto",padding:"60px 24px 20px",textAlign:"center"}}>
          <h2 style={{fontSize:26,fontWeight:900,color:"#1B3A2A",marginBottom:16}}>{t.about.title}</h2>
          {[t.about.p1,t.about.p2,t.about.p3].map((p,i)=>(<p key={i} style={{fontSize:15,color:"#555",lineHeight:1.9,maxWidth:620,margin:"0 auto 10px"}}>{p}</p>))}
        </section>

        {/* FEATURES */}
        <section style={{maxWidth:900,margin:"0 auto",padding:"40px 24px 50px"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:14}}>
            {t.features.map((f,i)=>{
              const isWomenFeature=f.icon==="💜";
              return(<div key={i} style={{background:isWomenFeature?"linear-gradient(135deg,#F5F3FF,#EDE9FE)":"white",border:`1px solid ${isWomenFeature?"#DDD6FE":"#ECEAE6"}`,borderRadius:14,padding:"28px 20px",textAlign:"center",animation:`fadeUp 0.6s ease ${0.15*i+0.3}s both`,transition:"transform 0.25s,box-shadow 0.25s",position:"relative",zIndex:0}} onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.06)";e.currentTarget.style.zIndex="2";e.currentTarget.style.boxShadow=`0 20px 48px ${isWomenFeature?"rgba(124,58,237,0.18)":"rgba(27,58,42,0.13)"}`;e.currentTarget.querySelector(".feat-desc").style.color=isWomenFeature?"#7C3AED":"#444";}} onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.zIndex="0";e.currentTarget.style.boxShadow="none";e.currentTarget.querySelector(".feat-desc").style.color=isWomenFeature?"rgba(124,58,237,0.6)":"#999";}}>
                <div style={{fontSize:32,marginBottom:10}}>{f.icon}</div>
                <div style={{fontWeight:800,fontSize:14,color:isWomenFeature?"#6D28D9":"#1B3A2A",marginBottom:6}}>{f.t}</div>
                <div className="feat-desc" style={{fontSize:12,color:isWomenFeature?"rgba(124,58,237,0.6)":"#999",lineHeight:1.6,transition:"color 0.25s"}}>{f.d}</div>
              </div>);
            })}
          </div>
        </section>

        <div style={{maxWidth:120,margin:"0 auto 10px",borderTop:"2px solid #E8E6E1"}}/>

        {/* TRIP SEARCH */}
        <section ref={searchRef} style={{maxWidth:680,margin:"0 auto",padding:"40px 24px 20px"}}>
          <div style={{background:"white",borderRadius:16,padding:"28px",border:"1px solid #E8E6E1",boxShadow:"0 4px 20px rgba(0,0,0,0.04)"}}>
            <h3 style={{fontSize:18,fontWeight:900,color:"#1B3A2A",marginBottom:16,textAlign:"center"}}>{b.searchTitle}</h3>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              <div><label style={lbl}>{b.from}</label><select value={searchFrom} onChange={e=>{setSearchFrom(e.target.value);setSearchTo("")}} style={inp}><option value="">{b.selectCity}</option>{cities.map(c=><option key={c.id} value={c.id}>{c[lang]}</option>)}</select></div>
              <div><label style={lbl}>{b.to}</label><select value={searchTo} onChange={e=>setSearchTo(e.target.value)} style={inp} disabled={!searchFrom}><option value="">{searchFrom?b.selectDest:b.selectFromFirst}</option>{searchFrom?getDests(searchFrom).map(id=>{const c=gc(id);return<option key={id} value={id}>{c[lang]}</option>}):null}</select></div>
            </div>
            <div style={{marginBottom:12}}>
              <label style={lbl}>{b.filterGender}</label>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>setSearchGender("mixed")} style={{flex:1,padding:"9px",borderRadius:10,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",border:"2px solid",transition:"all 0.2s",borderColor:searchGender==="mixed"?"#1B3A2A":"#E8E6E1",background:searchGender==="mixed"?"#1B3A2A":"white",color:searchGender==="mixed"?"white":"#666"}}>🚗 {b.mixedOnly}</button>
                <button disabled style={{flex:1,padding:"9px",borderRadius:10,fontSize:12,fontWeight:700,cursor:"not-allowed",fontFamily:"inherit",border:"2px solid #E8E6E1",background:"#F8F8F8",color:"#CCC"}}>💜 {lang==="ar"?"نساء فقط — قريباً":"Women Only — Soon"}</button>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              <div><label style={lbl}>{b.searchDate}</label><input type="date" value={searchDate} onChange={e=>setSearchDate(e.target.value)} style={inp}/></div>
              <div><label style={lbl}>{lang==="ar"?"ترتيب":"Sort by"}</label><select value={tripSort} onChange={e=>setTripSort(e.target.value)} style={inp}><option value="time">{lang==="ar"?"وقت المغادرة":"Departure time"}</option><option value="price_asc">{lang==="ar"?"السعر: من الأقل":"Price: low to high"}</option><option value="price_desc">{lang==="ar"?"السعر: من الأعلى":"Price: high to low"}</option></select></div>
            </div>
            <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:6}}>
              <button onClick={searchTrips} style={{flex:1,background:"#1B3A2A",color:"white",border:"none",padding:"11px 24px",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>{b.searchBtn}</button>
              {searchFrom&&searchTo&&(()=>{const isSaved=savedRoutes.some(r=>r.from===searchFrom&&r.to===searchTo);return(
                <button onClick={()=>{const next=isSaved?savedRoutes.filter(r=>!(r.from===searchFrom&&r.to===searchTo)):[...savedRoutes,{from:searchFrom,to:searchTo}];setSavedRoutes(next);localStorage.setItem("safferni_saved_routes",JSON.stringify(next));}} title={lang==="ar"?"حفظ المسار":"Save route"} style={{background:"white",color:isSaved?"#F59E0B":"#999",border:"2px solid "+(isSaved?"#F59E0B":"#E8E6E1"),padding:"9px 14px",borderRadius:10,fontSize:16,cursor:"pointer",fontFamily:"inherit"}}>{isSaved?"★":"☆"}</button>
              );})()}
            </div>
            {savedRoutes.length>0&&(
              <div style={{marginTop:6,display:"flex",flexWrap:"wrap",gap:6}}>
                <span style={{fontSize:11,color:"#666",fontWeight:700,alignSelf:"center"}}>{lang==="ar"?"المحفوظة:":"Saved:"}</span>
                {savedRoutes.map((r,idx)=>{const fc=gc(r.from);const tc=gc(r.to);return(
                  <button key={idx} onClick={()=>{setSearchFrom(r.from);setSearchTo(r.to);}} style={{background:"#F0EBE3",color:"#1B3A2A",border:"none",padding:"5px 10px",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{fc?.[lang]||r.from} → {tc?.[lang]||r.to}</button>
                );})}
              </div>
            )}
            {!searchDate&&tripsLoaded&&<p style={{marginTop:12,fontSize:12,color:"#EF4444",fontWeight:700}}>{lang==="ar"?"الرجاء اختيار تاريخ السفر":"Please select a travel date"}</p>}

            {tripsLoaded&&(<div style={{marginTop:20}}>
              {trips.length===0?(<div style={{textAlign:"center",padding:"24px 0"}}><p style={{color:"#AAA",fontSize:14,marginBottom:16}}>{b.noTrips}</p></div>)
              :(<div>
                <p style={{fontSize:13,fontWeight:700,color:"#1B3A2A",marginBottom:12}}>{b.availableTrips}:</p>
                {[...trips].sort((a,b)=>tripSort==="price_asc"?(a.price_per_seat||0)-(b.price_per_seat||0):tripSort==="price_desc"?(b.price_per_seat||0)-(a.price_per_seat||0):(a.trip_time||"").localeCompare(b.trip_time||"")).map((trip,i)=>{
                  const fc=gc(trip.from_city);const tc=gc(trip.to_city);
                  const isWomen=trip.gender_type==="women_only";
                  return(<div key={trip.id} style={{border:`1px solid ${isWomen?"#DDD6FE":"#E8E6E1"}`,borderRadius:12,padding:"16px",marginBottom:10,background:isWomen?"#FAFAFF":"#FAFAF8",animation:`fadeUp 0.3s ease ${0.05*i}s both`}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                          <span style={{fontWeight:800,fontSize:14,color:isWomen?"#6D28D9":"#1B3A2A"}}>{fc?.[lang]||trip.from_city} {lang==="ar"?"إلى":"to"} {tc?.[lang]||trip.to_city}</span>
                          <GenderBadge type={trip.gender_type} lang={lang}/>
                        </div>
                        <div style={{fontSize:12,color:"#888"}}>{formatTime(trip.trip_time)} · {trip.car_type||""}</div>
                        {trip.available_seats<=0
                          ?<div style={{fontSize:11,fontWeight:700,color:"#991B1B",marginTop:3}}>🔴 {lang==="ar"?"اكتملت المقاعد":"Fully Booked"}</div>
                          :trip.available_seats<=2
                            ?<div style={{fontSize:11,fontWeight:700,color:"#DC2626",marginTop:3}}>🔴 {lang==="ar"?`${trip.available_seats===1?"مقعد واحد متبقي فقط!":"مقعدان متبقيان فقط!"}`:trip.available_seats===1?"Only 1 seat left!":"Only 2 seats left!"}</div>
                            :<div style={{fontSize:12,color:"#888",marginTop:2}}>{trip.available_seats} {b.seatsLeft}</div>
                        }
                        <div style={{display:"flex",alignItems:"center",gap:8,marginTop:4,flexWrap:"wrap"}}>
                          {trip.avg_rating>0&&<StarRating value={Math.round(trip.avg_rating)} readOnly/>}
                          {trip.avg_rating>0&&<span style={{fontSize:11,color:"#888"}}>({trip.rating_count})</span>}
                          <button onClick={async(e)=>{e.stopPropagation();setReviewSidebarDriver(trip.driver_id);await loadDriverReviews(trip.driver_id);}} style={{background:"transparent",border:"1px solid #DDD",borderRadius:20,padding:"2px 10px",fontSize:11,fontWeight:700,color:"#555",cursor:"pointer",fontFamily:"inherit"}}>{lang==="ar"?"التقييمات":"See reviews"}</button>
                          <button onClick={async(e)=>{e.stopPropagation();await openDriverPublicPage(trip.driver_id);}} style={{background:"transparent",border:"1px solid #C7D2CC",borderRadius:20,padding:"2px 10px",fontSize:11,fontWeight:700,color:"#1B3A2A",cursor:"pointer",fontFamily:"inherit"}}>👤 {lang==="ar"?"السائق":"Driver"}</button>
                          <button onClick={e=>{e.stopPropagation();const link=`${window.location.origin}${window.location.pathname}?trip=${trip.id}`;navigator.clipboard?.writeText(link).catch(()=>{const el=document.createElement("textarea");el.value=link;document.body.appendChild(el);el.select();document.execCommand("copy");document.body.removeChild(el);});setShareCopiedId(trip.id);setTimeout(()=>setShareCopiedId(null),2000);}} style={{background:shareCopiedId===trip.id?"#D1FAE5":"transparent",border:`1px solid ${shareCopiedId===trip.id?"#34D399":"#25D366"}`,borderRadius:20,padding:"2px 10px",fontSize:11,fontWeight:700,color:shareCopiedId===trip.id?"#065F46":"#25D366",cursor:"pointer",fontFamily:"inherit",transition:"all 0.2s"}}>{shareCopiedId===trip.id?"✓ "+(lang==="ar"?"تم النسخ":"Copied!"):"📤 "+(lang==="ar"?"شارك":"Share")}</button>
                        </div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:12}}>
                        <span style={{fontSize:20,fontWeight:900,color:isWomen?"#6D28D9":"#1B3A2A"}}>${trip.price_per_seat}</span>
                        {trip.available_seats<=0
                          ?<button disabled style={{background:"#D1D5DB",color:"#6B7280",border:"none",padding:"8px 16px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"not-allowed",fontFamily:"inherit"}}>{lang==="ar"?"اكتملت المقاعد":"Trip Full"}</button>
                          :<button onClick={()=>{
                            if(!user){resetAuth();setPage("login");return;}
                            setSelectedTrip(trip);setTripBooked(false);setRatingSubmitted(false);setTripRating(0);
                            setTripBooking({name:profile?.full_name||"",phone:profile?.phone||"",seats:1,payment:"cash"});
                          }} style={{background:isWomen?"#7C3AED":"#1B3A2A",color:"white",border:"none",padding:"8px 16px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{b.bookSeat}</button>
                        }
                      </div>
                    </div>
                  </div>);
                })}
              </div>)}
              <div style={{marginTop:16,paddingTop:16,borderTop:"1px solid #E8E6E1",textAlign:"center"}}>
                <span style={{fontSize:13,color:"#888"}}>{b.customBook} → </span>
                <span onClick={scrollToCustomBook} style={{fontSize:13,color:"#1B3A2A",fontWeight:700,cursor:"pointer"}}>{b.title}</span>
              </div>
            </div>)}
          </div>
        </section>

        {/* TRIP BOOKING MODAL */}
        {selectedTrip&&(
          <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.5)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px"}}>
            <div style={{background:"white",borderRadius:20,padding:"32px",maxWidth:420,width:"100%",animation:"fadeUp 0.3s ease",maxHeight:"90vh",overflowY:"auto"}}>
              {ratingSubmitted?(<div style={{textAlign:"center",padding:"20px"}}><div style={{fontSize:48,marginBottom:12}}>⭐</div><h3 style={{fontSize:18,fontWeight:900,color:"#1B3A2A"}}>{b.ratingThanks}</h3></div>)
              :tripBooked?(<div style={{textAlign:"center"}}>
                <div style={{fontSize:48,marginBottom:12}}>{selectedTrip.gender_type==="women_only"?"💜":"✓"}</div>
                <h3 style={{fontSize:20,fontWeight:900,color:selectedTrip.gender_type==="women_only"?"#7C3AED":"#1B3A2A",marginBottom:8}}>{b.confirmTitle}</h3>
                <p style={{fontSize:13,color:"#555",marginBottom:16}}>{b.confirmMsg}</p>
                {new Date(selectedTrip.trip_date)<new Date(new Date().toDateString())?(
                  <div style={{borderTop:"1px solid #E8E6E1",paddingTop:16,marginBottom:16}}>
                    <p style={{fontSize:13,fontWeight:700,color:"#555",marginBottom:10}}>{b.rateTrip}</p>
                    <div style={{display:"flex",justifyContent:"center",marginBottom:10}}><StarRating value={reviewForm.rating} onChange={v=>setReviewForm({...reviewForm,rating:v})}/></div>
                    {reviewForm.rating>0&&(<>
                      <textarea value={reviewForm.text} onChange={e=>setReviewForm({...reviewForm,text:e.target.value})} placeholder={lang==="ar"?"أضف تعليقاً (اختياري)":"Add a comment (optional)"} style={{...inp,minHeight:60,resize:"vertical",marginBottom:10,textAlign:isRTL?"right":"left"}} rows={2}/>
                      {reviewSubmitted?<p style={{fontSize:13,color:"#065F46",fontWeight:700}}>✓ {b.ratingThanks}</p>:
                      <button onClick={()=>submitReview(selectedTrip.id,selectedTrip.driver_id,lastBookingId)} style={{background:"#F59E0B",color:"white",border:"none",padding:"10px 28px",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{b.submitRating}</button>}
                    </>)}
                  </div>
                ):<p style={{fontSize:11,color:"#AAA",marginBottom:16}}>{lang==="ar"?"يمكنك تقييم الرحلة بعد انتهائها":"You can rate this trip after it takes place"}</p>}
                <button onClick={()=>{setTripBooked(false);setSelectedTrip(null);setReviewForm({rating:0,text:""});setPromoCode("");setPromoDiscount(null);}} style={{background:"white",color:"#666",border:"1.5px solid #DDD",padding:"10px 24px",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{b.confirmClose}</button>
              </div>)
              :(<div>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
                  <h3 style={{fontSize:18,fontWeight:900,color:selectedTrip.gender_type==="women_only"?"#7C3AED":"#1B3A2A"}}>{b.bookSeat}</h3>
                  <GenderBadge type={selectedTrip.gender_type} lang={lang}/>
                </div>
                <div style={{marginBottom:12}}><label style={lbl}>{b.name} *</label><input value={tripBooking.name} onChange={e=>setTripBooking({...tripBooking,name:e.target.value})} style={inp}/></div>
                <div style={{marginBottom:12}}><label style={lbl}>{b.phone} *</label><PhoneField value={tripBooking.phone} onChange={v=>setTripBooking({...tripBooking,phone:v})} lang={lang} inp={inp}/></div>
                <div style={{marginBottom:12}}><label style={lbl}>{b.passengers}</label><select value={tripBooking.seats} onChange={e=>setTripBooking({...tripBooking,seats:parseInt(e.target.value)})} style={inp}>{Array.from({length:Math.min(selectedTrip.available_seats,10)},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</select></div>
                <div style={{marginBottom:12}}>
                  <label style={lbl}>{lang==="ar"?"كود الخصم (اختياري)":"Promo Code (optional)"}</label>
                  <div style={{display:"flex",gap:8}}>
                    <input value={promoCode} onChange={e=>setPromoCode(e.target.value.toUpperCase())} style={{...inp,flex:1}} placeholder="SAFFERNI10"/>
                    <button onClick={checkPromoCode} style={{background:"#1B3A2A",color:"white",border:"none",padding:"0 14px",borderRadius:10,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{lang==="ar"?"تحقق":"Apply"}</button>
                  </div>
                  {promoDiscount&&<div style={{fontSize:11,color:"#065F46",fontWeight:700,marginTop:4}}>✓ {lang==="ar"?`خصم ${promoDiscount.discount_type==="fixed"?"$"+promoDiscount.discount_value:promoDiscount.discount_value+"%"}`:`${promoDiscount.discount_type==="fixed"?"$"+promoDiscount.discount_value:promoDiscount.discount_value+"% off"} applied`}</div>}
                  {promoError&&<div style={{fontSize:11,color:"#DC2626",fontWeight:700,marginTop:4}}>{promoError}</div>}
                </div>
                <div style={{background:selectedTrip.gender_type==="women_only"?"#F5F3FF":"#F0F7F3",borderRadius:10,padding:"12px 16px",marginBottom:16,display:"flex",justifyContent:"space-between"}}>
                  <span style={{fontSize:13,fontWeight:700,color:"#555"}}>{b.price}</span>
                  <div style={{textAlign:"end"}}>
                    {promoDiscount&&<div style={{fontSize:12,color:"#888",textDecoration:"line-through"}}>${selectedTrip.price_per_seat*tripBooking.seats}</div>}
                    <span style={{fontSize:20,fontWeight:900,color:selectedTrip.gender_type==="women_only"?"#7C3AED":"#1B3A2A"}}>${applyDiscount(selectedTrip.price_per_seat*tripBooking.seats).toFixed(2)}</span>
                  </div>
                </div>
                {seatBookingError&&<div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:8,padding:"10px 14px",marginBottom:12,fontSize:13,color:"#DC2626",fontWeight:600,textAlign:"center"}}>{seatBookingError}</div>}
                <div style={{display:"flex",gap:10}}>
                  <button onClick={()=>{setSelectedTrip(null);setSeatBookingError("");}} style={{flex:1,background:"white",color:"#666",border:"1.5px solid #DDD",padding:"12px",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>✕</button>
                  <button onClick={bookTripSeat} style={{flex:2,background:selectedTrip.gender_type==="women_only"?"#7C3AED":"#1B3A2A",color:"white",border:"none",padding:"12px",borderRadius:10,fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>{b.submit}</button>
                </div>
              </div>)}
            </div>
          </div>
        )}

        {/* CUSTOM BOOKING */}
        <section ref={bkRef} style={{maxWidth:580,margin:"0 auto",padding:"20px 24px 80px"}}>
          {!user?(<div style={{background:"white",borderRadius:20,padding:"44px 28px",border:"1px solid #E8E6E1",boxShadow:"0 8px 40px rgba(0,0,0,0.05)",textAlign:"center"}}>
            <div style={{fontSize:40,marginBottom:12}}>🔐</div>
            <h3 style={{fontSize:18,fontWeight:900,color:"#1B3A2A",marginBottom:8}}>{lang==="ar"?"يجب تسجيل الدخول أولاً":"Login required"}</h3>
            <p style={{fontSize:13,color:"#888",marginBottom:20}}>{lang==="ar"?"يرجى تسجيل الدخول أو إنشاء حساب للحجز":"Please log in or create an account to book a ride"}</p>
            <button onClick={()=>{resetAuth();setPage("login");}} style={{background:"#1B3A2A",color:"white",border:"none",padding:"12px 32px",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{t.nav.login}</button>
          </div>)
          :submitted?(<div style={{background:"white",borderRadius:20,padding:"44px 28px",border:"1px solid #E8E6E1",boxShadow:"0 8px 40px rgba(0,0,0,0.05)",textAlign:"center",animation:"fadeUp 0.5s ease"}}>
            <div style={{width:64,height:64,borderRadius:"50%",background:"#F0FDF4",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",fontSize:30}}>✓</div>
            <h3 style={{fontSize:22,fontWeight:900,color:"#1B3A2A",marginBottom:8}}>{b.confirmTitle}</h3>
            <div style={{background:"#F0F7F3",borderRadius:10,padding:"10px 20px",display:"inline-block",marginBottom:16}}><span style={{fontSize:11,fontWeight:700,color:"#888"}}>{b.confirmRef}: </span><span style={{fontSize:16,fontWeight:900,color:"#1B3A2A",letterSpacing:1}}>{bookingRef}</span></div>
            <p style={{fontSize:14,color:"#555",lineHeight:1.8,maxWidth:400,margin:"0 auto 24px"}}>{b.confirmMsg}</p>
            <button onClick={()=>setSubmitted(false)} style={{background:"#1B3A2A",color:"white",border:"none",padding:"12px 36px",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{b.confirmClose}</button>
          </div>)
          :(<div style={{background:"white",borderRadius:20,padding:"40px 28px",border:"1px solid #E8E6E1",boxShadow:"0 8px 40px rgba(0,0,0,0.05)"}}>
            <h2 style={{fontSize:24,fontWeight:900,marginBottom:6,color:"#1B3A2A",textAlign:"center"}}>{b.title}</h2>
            <p style={{fontSize:12,color:"#AAA",textAlign:"center",marginBottom:28}}>{b.formNote}</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:18}}>
              <div><label style={lbl}>{b.from} *</label><select value={form.from} onChange={e=>handleFromChange(e.target.value)} style={inp}><option value="">{b.selectCity}</option>{cities.map(c=><option key={c.id} value={c.id}>{c[lang]}</option>)}</select></div>
              <div><label style={lbl}>{b.to} *</label><select value={form.to} onChange={e=>setForm({...form,to:e.target.value})} style={inp} disabled={!form.from}><option value="">{form.from?b.selectDest:b.selectFromFirst}</option>{availDests.map(c=><option key={c.id} value={c.id}>{c[lang]}</option>)}</select></div>
            </div>
            <div style={{marginBottom:18}}><label style={lbl}>{b.type} *</label>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {[["seat",b.seat],["car",b.car],["van",b.van]].map(([k,l])=>(<button key={k} onClick={()=>setForm({...form,type:k})} style={{flex:1,minWidth:130,padding:"11px 10px",borderRadius:10,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",border:"2px solid",transition:"all 0.2s",borderColor:eType===k?"#1B3A2A":"#E8E6E1",background:eType===k?"#1B3A2A":"white",color:eType===k?"white":"#666"}}>{l}</button>))}
              </div>
            </div>
            {route?.comingSoon&&form.to&&<div style={{background:"#FFF3CD",border:"1px solid #FFE082",borderRadius:12,padding:"14px 20px",marginBottom:18,textAlign:"center"}}><span style={{fontSize:14,fontWeight:700,color:"#92400E"}}>🚧 {lang==="ar"?"هذا المسار قريباً":"This route is coming soon"}</span></div>}
            {price!==null&&<div style={{background:"linear-gradient(135deg,#F0F7F3,#E8F5ED)",borderRadius:12,padding:"14px 20px",marginBottom:18,display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:13,fontWeight:700,color:"#555"}}>{b.price}</span><span style={{fontSize:28,fontWeight:900,color:"#1B3A2A"}}>${price}</span></div>}
            <div style={{marginBottom:18}}><label style={lbl}>{b.payment} *</label>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {[["cash",b.cash,"💵"],["crypto",b.crypto,"₿"],["shamcash",b.shamcash,"📱"]].map(([k,l,ic])=>(<button key={k} onClick={()=>setForm({...form,payment:k})} style={{flex:1,minWidth:100,padding:"11px 10px",borderRadius:10,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",border:"2px solid",transition:"all 0.2s",borderColor:form.payment===k?"#1B3A2A":"#E8E6E1",background:form.payment===k?"#1B3A2A":"white",color:form.payment===k?"white":"#666"}}>{ic} {l}</button>))}
              </div>
            </div>
            {form.payment==="crypto"&&<div style={{background:"#FFF9E6",border:"1px solid #FFE082",borderRadius:12,padding:"16px",marginBottom:18}}><p style={{fontSize:12,fontWeight:600,color:"#666",marginBottom:10}}>{b.cryptoNote}</p><div style={{display:"flex",alignItems:"center",gap:8}}><code style={{flex:1,fontSize:11,background:"white",padding:"10px 12px",borderRadius:8,border:"1px solid #E8E6E1",wordBreak:"break-all",color:"#333",direction:"ltr",textAlign:"left"}}>{USDT_ADDRESS}</code><button onClick={copyUSDT} style={{background:copied?"#166534":"#1B3A2A",color:"white",border:"none",padding:"10px 14px",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>{copied?"✓ "+b.copied:b.copyAddress}</button></div><p style={{fontSize:10,color:"#999",marginTop:8}}>Network: BEP20 (BSC) · Token: USDT</p></div>}
            {form.payment==="shamcash"&&<div style={{background:"#F0F0F0",borderRadius:12,padding:"16px",marginBottom:18,textAlign:"center"}}><p style={{fontSize:13,fontWeight:700,color:"#888"}}>{b.shamcashSoon}</p></div>}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:18}}>
              <div><label style={lbl}>{b.date} *</label><input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} style={inp}/></div>
              <div><label style={lbl}>{b.time}</label><select value={form.time} onChange={e=>setForm({...form,time:e.target.value})} style={inp}><option value="">--</option>{timeOptions.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:18}}>
              <div><label style={lbl}>{b.passengers} *</label><select value={form.passengers} onChange={e=>setForm({...form,passengers:e.target.value})} style={inp}>{[1,2,3,4,5,6,7,8,9,10].map(n=><option key={n} value={n}>{n}</option>)}</select></div>
              <div><label style={lbl}>{b.bags} *</label><select value={form.bags} onChange={e=>setForm({...form,bags:e.target.value})} style={inp}>{[0,1,2,3,4,5,6,7,8,9,10].map(n=><option key={n} value={n}>{n}</option>)}</select></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:18}}>
              <div><label style={lbl}>{b.name} *</label><input type="text" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} style={inp}/></div>
              <div><label style={lbl}>{b.phone} *</label><PhoneField value={form.phone} onChange={v=>setForm({...form,phone:v})} lang={lang} inp={inp}/></div>
            </div>
            <div style={{marginBottom:18}}><label style={lbl}>{b.notes}</label><textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} style={{...inp,minHeight:65,resize:"vertical"}} rows={2}/></div>
            {error&&<div style={{marginBottom:14,padding:"10px 16px",background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:10,color:"#B91C1C",fontSize:13,fontWeight:700}}>{error}</div>}
            <button onClick={handleSubmit} disabled={form.payment==="shamcash"} style={{width:"100%",background:form.payment==="shamcash"?"#CCC":"#1B3A2A",color:"white",border:"none",padding:"15px",borderRadius:12,fontSize:16,fontWeight:800,cursor:form.payment==="shamcash"?"not-allowed":"pointer",fontFamily:"inherit",transition:"background 0.2s"}}>{b.submit}</button>
          </div>)}
        </section>
      </div>)}

      {/* PRICING */}
      {page==="pricing"&&(<section style={{maxWidth:800,margin:"0 auto",padding:"60px 24px 80px",...fade}}>
        <h2 style={{fontSize:32,fontWeight:900,marginBottom:10,textAlign:"center",color:"#1B3A2A"}}>{t.pricing.title}</h2>
        <p style={{textAlign:"center",color:"#888",marginBottom:24,fontSize:15}}>{t.pricing.desc}</p>
        <div style={{background:"white",borderRadius:16,border:"1px solid #E8E6E1",overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.03)"}}>
          <div style={{display:"grid",gridTemplateColumns:"1.8fr 1fr 1fr 1fr",padding:"14px 20px",background:"#1B3A2A",fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.85)",textTransform:"uppercase"}}>
            <div>{t.pricing.route}</div><div style={{textAlign:"center"}}>{lang==="ar"?"مقعد / شخص":"Per Seat"}</div><div style={{textAlign:"center"}}>{t.pricing.car}</div><div style={{textAlign:"center"}}>{t.pricing.van}</div>
          </div>
          {pricingRoutes.map((r,i)=>(<div key={i} style={{display:"grid",gridTemplateColumns:"1.8fr 1fr 1fr 1fr",padding:"14px 20px",borderBottom:i<pricingRoutes.length-1?"1px solid #F0EEEA":"none",fontSize:13,transition:"background 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background="#FAFAF8"} onMouseLeave={e=>e.currentTarget.style.background="white"}>
            <div style={{fontWeight:800,color:"#1B3A2A"}}>{r.from[lang]} → {r.to[lang]}</div>
            <div style={{textAlign:"center",fontWeight:700}}>${r.seat}</div>
            <div style={{textAlign:"center",fontWeight:700}}>${r.car}</div>
            <div style={{textAlign:"center",fontWeight:700}}>${r.van}</div>
          </div>))}
        </div>
        <p style={{marginTop:20,fontSize:12,color:"#999",textAlign:"center",fontStyle:"italic"}}>{t.pricing.note}</p>
        <div style={{textAlign:"center",marginTop:36}}><button onClick={scrollToSearch} style={{background:"#1B3A2A",color:"white",border:"none",padding:"14px 40px",borderRadius:12,fontSize:16,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{t.nav.book}</button></div>
      </section>)}

      {/* CONTACT */}
      {page==="contact"&&(<section style={{maxWidth:550,margin:"0 auto",padding:"60px 24px 80px",...fade}}>
        <h2 style={{fontSize:32,fontWeight:900,marginBottom:10,textAlign:"center",color:"#1B3A2A"}}>{t.contact.title}</h2>
        <p style={{textAlign:"center",color:"#888",marginBottom:32,fontSize:15}}>{t.contact.desc}</p>
        <div style={{background:"white",borderRadius:16,padding:"28px",border:"1px solid #E8E6E1",boxShadow:"0 2px 12px rgba(0,0,0,0.03)"}}>
          {[{l:t.contact.email,v:"info@safferni.com",ic:"✉️",link:"mailto:info@safferni.com"},{l:t.contact.whatsapp,v:lang==="ar"?"قريباً...":"Coming soon...",ic:"💬",link:null},{l:t.contact.hours,v:t.contact.hoursVal,ic:"🕐",link:null}].map((item,i)=>(
            <div key={i} onClick={()=>item.link&&window.open(item.link)} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 0",borderBottom:i<2?"1px solid #F0EEEA":"none",cursor:item.link?"pointer":"default"}}>
              <div style={{width:42,height:42,borderRadius:10,background:"#F0F7F3",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{item.ic}</div>
              <div><div style={{fontSize:11,color:"#AAA",fontWeight:700,textTransform:"uppercase",marginBottom:1}}>{item.l}</div><div style={{fontSize:14,fontWeight:600,color:item.link?"#1B3A2A":"#333"}}>{item.v}</div></div>
            </div>
          ))}
        </div>
      </section>)}

      {/* REVIEW SIDEBAR */}
      {reviewSidebarDriver&&(
        <div style={{position:"fixed",top:0,[isRTL?"left":"right"]:0,width:"min(380px,100vw)",height:"100vh",background:"white",boxShadow:"-4px 0 24px rgba(0,0,0,0.1)",zIndex:300,display:"flex",flexDirection:"column",animation:"slideIn 0.3s ease"}}>
          <style>{`@keyframes slideIn{from{transform:translateX(${isRTL?"-100%":"100%"})}to{transform:translateX(0)}}`}</style>
          <div style={{padding:"20px 24px",borderBottom:"1px solid #E8E6E1",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <h3 style={{fontSize:16,fontWeight:900,color:"#1B3A2A"}}>{lang==="ar"?"تقييمات السائق":"Driver Reviews"}</h3>
            <button onClick={()=>setReviewSidebarDriver(null)} style={{background:"transparent",border:"none",fontSize:20,cursor:"pointer",color:"#888"}}>✕</button>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"16px 24px"}}>
            {driverReviews.length===0?(<p style={{textAlign:"center",color:"#AAA",padding:"40px 0"}}>{lang==="ar"?"لا توجد تقييمات بعد":"No reviews yet"}</p>)
            :driverReviews.map((r,i)=>(
              <div key={i} style={{borderBottom:"1px solid #F0EEEA",paddingBottom:14,marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                  <span style={{fontSize:13,fontWeight:700,color:"#1B3A2A"}}>{r.passenger_name||"—"}</span>
                  <StarRating value={r.rating} readOnly/>
                </div>
                {r.review_text&&<p style={{fontSize:13,color:"#555",lineHeight:1.6}}>{r.review_text}</p>}
                <span style={{fontSize:11,color:"#BBB"}}>{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {reviewSidebarDriver&&<div onClick={()=>setReviewSidebarDriver(null)} style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.3)",zIndex:299}}/>}

      {user&&showNotifications&&(
        <>
          <div onClick={()=>setShowNotifications(false)} style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:149}}/>
          <div style={{position:"fixed",top:68,[isRTL?"left":"right"]:16,width:360,maxWidth:"calc(100vw - 32px)",maxHeight:520,background:"white",borderRadius:16,boxShadow:"0 8px 40px rgba(0,0,0,0.18)",border:"1px solid #E8E6E1",zIndex:150,overflow:"hidden",display:"flex",flexDirection:"column"}}>
            <div style={{padding:"16px 20px",borderBottom:"1px solid #F0EEEA",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
              <span style={{fontSize:15,fontWeight:800,color:"#1B3A2A"}}>{lang==="ar"?"الإشعارات":"Notifications"}{unreadCount>0&&<span style={{background:"#EF4444",color:"white",borderRadius:20,padding:"2px 8px",fontSize:11,fontWeight:700,marginInlineStart:8}}>{unreadCount}</span>}</span>
              {unreadCount>0&&<button onClick={markAllRead} style={{fontSize:11,fontWeight:700,color:"#1B3A2A",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",textDecoration:"underline"}}>{lang==="ar"?"تعيين الكل مقروءاً":"Mark all read"}</button>}
            </div>
            <div style={{overflowY:"auto",flex:1}}>
              {notifications.length===0?(<div style={{padding:"48px 20px",textAlign:"center",color:"#CCC"}}><div style={{fontSize:36,marginBottom:8}}>🔔</div><div style={{fontSize:13,fontWeight:600}}>{lang==="ar"?"لا توجد إشعارات بعد":"No notifications yet"}</div></div>)
              :notifications.map((n,i)=>{
                const icons={new_booking:"👤",booking_confirmed:"✅",booking_rejected:"❌",booking_cancelled:"🚫",application_approved:"🎉",application_denied:"😞",trip_approved:"🚗"};
                return(<div key={n.id} onClick={()=>markNotifRead(n.id)} style={{padding:"14px 20px",borderBottom:i<notifications.length-1?"1px solid #F8F6F2":"none",background:n.read?"white":"#F0F7F3",cursor:"pointer",transition:"background 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background="#F8F8F6"} onMouseLeave={e=>e.currentTarget.style.background=n.read?"white":"#F0F7F3"}>
                  <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                    <span style={{fontSize:20,lineHeight:1,marginTop:2,flexShrink:0}}>{icons[n.type]||"🔔"}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:3}}>
                        <span style={{fontSize:13,fontWeight:800,color:"#1B3A2A"}}>{n.title}</span>
                        {!n.read&&<span style={{width:8,height:8,borderRadius:"50%",background:"#1B3A2A",flexShrink:0,marginTop:4,marginInlineStart:8}}/>}
                      </div>
                      <p style={{fontSize:12,color:"#666",margin:"0 0 4px",lineHeight:1.5}}>{n.message}</p>
                      <span style={{fontSize:10,color:"#AAA",fontWeight:600}}>{timeAgo(n.created_at)}</span>
                    </div>
                  </div>
                </div>);
              })}
            </div>
          </div>
        </>
      )}

      {page==="home"&&user&&!isDriverApplied&&(
        <div style={{background:"linear-gradient(135deg,#1B3A2A,#2D5A3D)",padding:"48px 24px",textAlign:"center"}}>
          <h3 style={{fontSize:22,fontWeight:900,color:"white",marginBottom:8}}>{lang==="ar"?"هل تريد أن تصبح سائقاً؟":"Want to become a driver?"}</h3>
          <p style={{fontSize:14,color:"rgba(255,255,255,0.75)",maxWidth:480,margin:"0 auto 24px"}}>{lang==="ar"?"انضم لفريق سفّرني وابدأ بنشر رحلاتك":"Join the Safferni team and start posting your trips"}</p>
          <button onClick={()=>setPage("apply")} style={{background:"white",color:"#1B3A2A",border:"none",padding:"14px 40px",borderRadius:12,fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>{t.nav.apply}</button>
        </div>
      )}
      <footer style={{borderTop:"1px solid #E8E6E1",padding:"20px",textAlign:"center",color:"#BBB",fontSize:12,background:"white",fontWeight:500}}>© 2026 {t.brand} — {t.footer}</footer>

      <a href={`https://wa.me/${WA_PHONE}`} target="_blank" rel="noopener noreferrer" style={{position:"fixed",bottom:24,[isRTL?"left":"right"]:24,zIndex:999,width:56,height:56,borderRadius:"50%",background:"#25D366",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 16px rgba(0,0,0,0.2)",transition:"transform 0.2s",cursor:"pointer",textDecoration:"none"}} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      </a>
    </div>
  );
}

const lbl={display:"block",fontSize:12,fontWeight:700,color:"#666",marginBottom:6};
const inp={width:"100%",padding:"11px 14px",border:"1.5px solid #E0DDD8",borderRadius:10,background:"#FAFAF8",outline:"none",transition:"border-color 0.2s"};
