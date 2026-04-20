import { useState, useRef, useEffect } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://httsiptnvtchtqvabkyp.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0dHNpcHRudnRjaHRxdmFia3lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NjcyMzgsImV4cCI6MjA5MjI0MzIzOH0.ypI-BaFF-L1jttheMiFbaeQE2AQOskPQK2d1UfiDA2c";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

const SHEET_URL = "https://script.google.com/macros/s/AKfycbxfCu6s3k-Pt618KoEdZuPV6mfv98L2J3ZAptGUURFiVKkUdIQnZh66ZNSAWcfL42r0/exec";
const USDT_ADDRESS = "0x79F8b2d4e412f8A25Dc19487c878C203ce1e9b69";
const WA_PHONE = "963949191411";
const ADMIN_EMAILS = ["admin@safferni.com", "mearmrstane@gmail.com"];

const cities = [
  { id:"dam", ar:"دمشق", en:"Damascus" },
  { id:"bei", ar:"بيروت", en:"Beirut" },
  { id:"hom", ar:"حمص", en:"Homs" },
  { id:"ale", ar:"حلب", en:"Aleppo" },
  { id:"amm", ar:"عمّان", en:"Amman" },
  { id:"qaa", ar:"مطار الملكة علياء", en:"Queen Alia Airport" },
  { id:"daa", ar:"مطار دمشق الدولي", en:"Damascus Int'l Airport" },
];

const routeMap = [
  { from:"dam", to:"bei", car:100, van:110, seat:25, carOnly:false },
  { from:"dam", to:"hom", car:100, van:110, seat:25, carOnly:false },
  { from:"dam", to:"ale", car:175, van:195, seat:45, carOnly:false },
  { from:"dam", to:"amm", car:175, van:195, seat:45, carOnly:false },
  { from:"dam", to:"qaa", car:200, van:220, seat:50, carOnly:false },
  { from:"dam", to:"daa", car:25, van:28, seat:null, carOnly:true },
  { from:"ale", to:"hom", car:100, van:110, seat:25, carOnly:false },
];

const getDests=(f)=>{const d=[];routeMap.forEach(r=>{if(r.from===f)d.push(r.to);if(r.to===f)d.push(r.from)});return[...new Set(d)]};
const findRoute=(a,b)=>routeMap.find(r=>(r.from===a&&r.to===b)||(r.from===b&&r.to===a));
const gc=(id)=>cities.find(c=>c.id===id);
const genRef=()=>{const d=new Date();return`SAF-${d.getFullYear().toString().slice(-2)}${String(d.getMonth()+1).padStart(2,"0")}-${Math.floor(Math.random()*9000)+1000}`};
const pricingRoutes=routeMap.map(r=>({from:gc(r.from),to:gc(r.to),car:r.car,van:r.van,seat:r.seat,carOnly:r.carOnly}));

const T = {
  ar: {
    brand:"سفّرني", brandEn:"SAFFERNI",
    tagline:"وجهتك علينا... بس قلنا وين!",
    subtitle:"خدمة نقل بين المحافظات — من سوريا لعمّان وبيروت.",
    nav:{ home:"الرئيسية", pricing:"الأسعار", contact:"تواصل معنا", book:"احجز الآن", login:"تسجيل الدخول", logout:"خروج", admin:"لوحة الإدارة", driver:"لوحة السائق", apply:"سجّل كسائق" },
    about:{ title:"من نحن", p1:"سفّرني هي خدمة نقل بين المحافظات تربط سوريا بعمّان وبيروت.", p2:"سائقونا محترفون وذوو خبرة، ونلتزم بالمواعيد المحددة.", p3:"سواء كنت مسافراً لوحدك أو مع عائلتك، عندنا الخيار المناسب لك." },
    features:[
      { icon:"🛣️", t:"٧ مسارات", d:"رحلات بين المحافظات الرئيسية والمطارات" },
      { icon:"🚗", t:"سيارة أو فان", d:"سيارة لحد ٤ ركاب أو فان لحد ١٠ ركاب" },
      { icon:"💺", t:"مقعد واحد", d:"مو لازم تحجز سيارة كاملة — احجز مقعد بس" },
      { icon:"💵", t:"أسعار ثابتة", d:"تعرفة واضحة — نفس السعر بالاتجاهين" },
    ],
    deal:{ banner:"سافر بـ 10$ لأي مكان!", bannerSub:"مقاعد محدودة — لا تفوّت الفرصة", title:"سافر ابتداءً من 10$", desc:"إذا عندك مرونة بالوقت، شاركنا خطتك وبنخبرك لما يتوفر مقعد فاضي.", from:"من", to:"إلى", selectCity:"اختر المحافظة", selectDest:"اختر الوجهة", selectFromFirst:"اختر نقطة الانطلاق أولاً", dateRange:"أي وقت بين", dateFrom:"من تاريخ", dateTo:"إلى تاريخ", name:"الاسم", phone:"رقم الهاتف", submit:"خبرني!", fillAll:"يرجى ملء جميع الحقول", confirmTitle:"تم تسجيل طلبك!", confirmMsg:"سنخبرك عبر واتساب لما يتوفر مقعد فاضي.", confirmClose:"تمام" },
    b:{ title:"احجز رحلتك", searchTitle:"ابحث عن رحلة", searchDate:"تاريخ السفر", searchBtn:"ابحث", noTrips:"لا توجد رحلات متاحة لهذا اليوم", customBook:"احجز رحلة خاصة", availableTrips:"الرحلات المتاحة", bookSeat:"احجز مقعد", seatsLeft:"مقاعد متبقية", from:"من", to:"إلى", type:"نوع الحجز", seat:"مقعد واحد", car:"سيارة كاملة (حتى ٤ ركاب)", van:"فان (حتى ١٠ ركاب)", date:"التاريخ", time:"الوقت", name:"الاسم الكامل", phone:"رقم الهاتف", passengers:"عدد الركاب", bags:"عدد الحقائب", notes:"ملاحظات إضافية", submit:"تأكيد الحجز", selectCity:"اختر المحافظة", selectDest:"اختر الوجهة", selectFromFirst:"اختر نقطة الانطلاق أولاً", price:"السعر", fillAll:"يرجى ملء جميع الحقول المطلوبة", carOnlyNote:"هذا المسار متاح للسيارة الكاملة فقط", formNote:"عبّي المعلومات وبنتواصل معك", payment:"طريقة الدفع", cash:"كاش", crypto:"عملات رقمية", shamcash:"شام كاش", shamcashSoon:"قريباً...", cryptoNote:"أرسل المبلغ بـ USDT على شبكة BEP20 إلى العنوان التالي:", copied:"تم النسخ!", copyAddress:"نسخ العنوان", confirmTitle:"تم الحجز بنجاح!", confirmRef:"رقم الحجز", confirmMsg:"سيتم إرسال تأكيد الحجز عبر واتساب مع تعليمات التواصل مع السائق.", confirmClose:"إغلاق" },
    pricing:{ title:"الأسعار", desc:"أسعار واضحة وثابتة — بدون مفاجآت", route:"المسار", seat:"مقعد", car:"سيارة (٤ ركاب)", van:"فان (١٠ ركاب)", note:"الأسعار بالدولار الأمريكي — نفس الأسعار بالاتجاهين", carOnly:"سيارة فقط" },
    contact:{ title:"تواصل معنا", desc:"لأي استفسار أو حجز — نحن بخدمتك", email:"البريد الإلكتروني", whatsapp:"واتساب", hours:"ساعات العمل", hoursVal:"٧ أيام في الأسبوع، ٢٤ ساعة" },
    auth:{ login:"تسجيل الدخول", signup:"إنشاء حساب", email:"البريد الإلكتروني", password:"كلمة المرور", fullName:"الاسم الكامل", phone:"رقم الهاتف", loginBtn:"دخول", signupBtn:"إنشاء حساب", noAccount:"ليس لديك حساب؟", haveAccount:"لديك حساب؟", orLogin:"أو سجّل الدخول", error:"حدث خطأ، حاول مرة أخرى" },
    apply:{ title:"سجّل كسائق", desc:"انضم إلى فريق سفّرني وابدأ بنشر رحلاتك", fullName:"الاسم الكامل", phone:"رقم الهاتف", city:"مدينتك", carType:"نوع السيارة", carModel:"موديل السيارة", licensePlate:"رقم اللوحة", notes:"ملاحظات إضافية", submit:"تقديم الطلب", success:"تم إرسال طلبك! سنراجعه ونتواصل معك قريباً.", fillAll:"يرجى ملء جميع الحقول المطلوبة" },
    admin:{ title:"لوحة الإدارة", applications:"طلبات السائقين", pending:"قيد المراجعة", approved:"مقبول", denied:"مرفوض", approve:"قبول", deny:"رفض", noApps:"لا توجد طلبات", drivers:"السائقون", allowTrips:"السماح بنشر رحلات", revokeTrips:"إلغاء الصلاحية", phone:"الهاتف", city:"المدينة", car:"السيارة" },
    driver:{ title:"لوحة السائق", addTrip:"أضف رحلة", from:"من", to:"إلى", date:"التاريخ", time:"الوقت", pricePerSeat:"سعر المقعد ($)", totalSeats:"عدد المقاعد", carType:"نوع السيارة", submit:"نشر الرحلة", myTrips:"رحلاتي", noTrips:"لم تنشر أي رحلات بعد", cancel:"إلغاء الرحلة", selectCity:"اختر المحافظة", fillAll:"يرجى ملء جميع الحقول", success:"تم نشر الرحلة بنجاح!", notApproved:"طلبك قيد المراجعة. سنتواصل معك عند الموافقة." },
    footer:"جميع الحقوق محفوظة",
  },
  en: {
    brand:"سفّرني", brandEn:"SAFFERNI",
    tagline:"Your destination is on us — just tell us where!",
    subtitle:"Intercity transport from Syria to Amman and Beirut.",
    nav:{ home:"Home", pricing:"Pricing", contact:"Contact", book:"Book Now", login:"Login", logout:"Logout", admin:"Admin Panel", driver:"Driver Panel", apply:"Become a Driver" },
    about:{ title:"About Us", p1:"Safferni is an intercity transport service connecting Syria with Amman and Beirut.", p2:"Our drivers are experienced professionals, and we stick to our schedules.", p3:"Whether you're traveling solo or with family, we have the right option for you." },
    features:[
      { icon:"🛣️", t:"7 routes", d:"Trips between major cities and airports" },
      { icon:"🚗", t:"Car or van", d:"Car up to 4 passengers or van up to 10" },
      { icon:"💺", t:"Single seat", d:"No need to book a whole car — just a seat" },
      { icon:"💵", t:"Fixed prices", d:"Clear fares — same price both directions" },
    ],
    deal:{ banner:"Travel for $10 anywhere!", bannerSub:"Limited seats — don't miss out", title:"Travel starting from $10", desc:"If you're flexible with your travel dates, share your plan and we'll notify you when a seat opens up.", from:"From", to:"To", selectCity:"Select city", selectDest:"Select destination", selectFromFirst:"Select origin first", dateRange:"Anytime between", dateFrom:"From date", dateTo:"To date", name:"Name", phone:"Phone number", submit:"Let me know!", fillAll:"Please fill all fields", confirmTitle:"You're on the list!", confirmMsg:"We'll notify you via WhatsApp when a seat is available.", confirmClose:"Got it" },
    b:{ title:"Book Your Ride", searchTitle:"Find a Trip", searchDate:"Travel Date", searchBtn:"Search", noTrips:"No trips available for this day", customBook:"Book a custom ride", availableTrips:"Available Trips", bookSeat:"Book a Seat", seatsLeft:"seats left", from:"From", to:"To", type:"Booking Type", seat:"Single Seat", car:"Full Car (up to 4 pax)", van:"Van (up to 10 pax)", date:"Date", time:"Time", name:"Full Name", phone:"Phone Number", passengers:"Passengers", bags:"Bags", notes:"Additional Notes", submit:"Confirm Booking", selectCity:"Select city", selectDest:"Select destination", selectFromFirst:"Select origin first", price:"Price", fillAll:"Please fill all required fields", carOnlyNote:"This route is available for whole car only", formNote:"Fill in the details and we'll get back to you", payment:"Payment Method", cash:"Cash", crypto:"Crypto", shamcash:"Sham Cash", shamcashSoon:"Coming soon...", cryptoNote:"Send the amount in USDT on BEP20 network to the following address:", copied:"Copied!", copyAddress:"Copy Address", confirmTitle:"Booking Confirmed!", confirmRef:"Booking Reference", confirmMsg:"Your booking confirmation will be sent to you via WhatsApp along with instructions on how to connect with the driver.", confirmClose:"Close" },
    pricing:{ title:"Pricing", desc:"Clear, fixed prices — no surprises", route:"Route", seat:"Seat", car:"Car (4 pax)", van:"Van (10 pax)", note:"Prices in USD — same prices both directions", carOnly:"Car only" },
    contact:{ title:"Contact Us", desc:"For any inquiries or bookings — we're here for you", email:"Email", whatsapp:"WhatsApp", hours:"Working Hours", hoursVal:"7 days a week, 24 hours" },
    auth:{ login:"Login", signup:"Sign Up", email:"Email", password:"Password", fullName:"Full Name", phone:"Phone Number", loginBtn:"Login", signupBtn:"Create Account", noAccount:"Don't have an account?", haveAccount:"Already have an account?", orLogin:"or login", error:"An error occurred, please try again" },
    apply:{ title:"Become a Driver", desc:"Join the Safferni team and start posting your trips", fullName:"Full Name", phone:"Phone Number", city:"Your City", carType:"Car Type", carModel:"Car Model", licensePlate:"License Plate", notes:"Additional Notes", submit:"Submit Application", success:"Application submitted! We'll review it and get back to you soon.", fillAll:"Please fill all required fields" },
    admin:{ title:"Admin Panel", applications:"Driver Applications", pending:"Pending", approved:"Approved", denied:"Denied", approve:"Approve", deny:"Deny", noApps:"No applications", drivers:"Drivers", allowTrips:"Allow Trip Posting", revokeTrips:"Revoke Access", phone:"Phone", city:"City", car:"Car" },
    driver:{ title:"Driver Panel", addTrip:"Add a Trip", from:"From", to:"To", date:"Date", time:"Time", pricePerSeat:"Price per Seat ($)", totalSeats:"Total Seats", carType:"Car Type", submit:"Post Trip", myTrips:"My Trips", noTrips:"You haven't posted any trips yet", cancel:"Cancel Trip", selectCity:"Select city", fillAll:"Please fill all fields", success:"Trip posted successfully!", notApproved:"Your application is under review. We'll contact you when approved." },
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
  const [loading,setLoading]=useState(true);

  // Booking state
  const [form,setForm]=useState({from:"",to:"",type:"car",date:"",time:"",name:"",phone:"",passengers:"1",bags:"0",notes:"",payment:"cash"});
  const [submitted,setSubmitted]=useState(false);
  const [bookingRef,setBookingRef]=useState("");
  const [error,setError]=useState("");
  const [copied,setCopied]=useState(false);

  // Trip search state
  const [searchDate,setSearchDate]=useState("");
  const [trips,setTrips]=useState([]);
  const [tripsLoaded,setTripsLoaded]=useState(false);
  const [selectedTrip,setSelectedTrip]=useState(null);
  const [tripBooking,setTripBooking]=useState({name:"",phone:"",seats:1,payment:"cash"});
  const [tripBooked,setTripBooked]=useState(false);

  // Deal state
  const [dealForm,setDealForm]=useState({from:"",to:"",dateFrom:"",dateTo:"",name:"",phone:""});
  const [dealSubmitted,setDealSubmitted]=useState(false);
  const [dealError,setDealError]=useState("");

  // Auth state
  const [authMode,setAuthMode]=useState("login");
  const [authForm,setAuthForm]=useState({email:"",password:"",fullName:"",phone:""});
  const [authError,setAuthError]=useState("");
  const [authLoading,setAuthLoading]=useState(false);

  // Apply state
  const [applyForm,setApplyForm]=useState({fullName:"",phone:"",city:"",carType:"",carModel:"",licensePlate:"",notes:""});
  const [applySubmitted,setApplySubmitted]=useState(false);
  const [applyError,setApplyError]=useState("");

  // Admin state
  const [applications,setApplications]=useState([]);
  const [adminDrivers,setAdminDrivers]=useState([]);
  const [adminTab,setAdminTab]=useState("applications");

  // Driver state
  const [driverApp,setDriverApp]=useState(null);
  const [driverTrips,setDriverTrips]=useState([]);
  const [tripForm,setTripForm]=useState({from:"",to:"",date:"",time:"",pricePerSeat:"",totalSeats:"4",carType:""});
  const [tripError,setTripError]=useState("");
  const [tripSuccess,setTripSuccess]=useState(false);

  const t=T[lang]; const b=t.b; const dl=t.deal;
  const isRTL=lang==="ar";
  const bkRef=useRef(null);
  const isAdmin=user&&ADMIN_EMAILS.includes(user.email);

  // Auth listener
  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{
      setUser(session?.user??null);
      if(session?.user) loadProfile(session.user);
      else setLoading(false);
    });
    const{data:{subscription}}=supabase.auth.onAuthStateChange((_,session)=>{
      setUser(session?.user??null);
      if(session?.user) loadProfile(session.user);
      else{ setProfile(null); setLoading(false); }
    });
    return()=>subscription.unsubscribe();
  },[]);

  const loadProfile=async(u)=>{
    const{data}=await supabase.from("profiles").select("*").eq("id",u.id).single();
    setProfile(data);
    setLoading(false);
  };

  const handleAuth=async()=>{
    setAuthLoading(true); setAuthError("");
    try{
      if(authMode==="login"){
        const{error}=await supabase.auth.signInWithPassword({email:authForm.email,password:authForm.password});
        if(error) setAuthError(t.auth.error);
        else setPage("home");
      } else {
        const{data,error}=await supabase.auth.signUp({email:authForm.email,password:authForm.password});
        if(error){ setAuthError(t.auth.error); }
        else if(data.user){
          await supabase.from("profiles").insert({id:data.user.id,email:authForm.email,full_name:authForm.fullName,phone:authForm.phone,role:ADMIN_EMAILS.includes(authForm.email)?"admin":"passenger"});
          setPage("home");
        }
      }
    }catch(e){ setAuthError(t.auth.error); }
    setAuthLoading(false);
  };

  const handleLogout=async()=>{ await supabase.auth.signOut(); setUser(null); setProfile(null); setPage("home"); };

  const handleApply=async()=>{
    if(!applyForm.fullName||!applyForm.phone||!applyForm.city||!applyForm.carType){ setApplyError(t.apply.fillAll); return; }
    const{error}=await supabase.from("driver_applications").insert({user_id:user?.id||null,full_name:applyForm.fullName,phone:applyForm.phone,city:applyForm.city,car_type:applyForm.carType,car_model:applyForm.carModel,license_plate:applyForm.licensePlate,notes:applyForm.notes});
    if(!error){ setApplySubmitted(true); setApplyForm({fullName:"",phone:"",city:"",carType:"",carModel:"",licensePlate:"",notes:""}); }
    else setApplyError(t.apply.fillAll);
  };

  const loadAdminData=async()=>{
    const{data:apps}=await supabase.from("driver_applications").select("*").order("created_at",{ascending:false});
    setApplications(apps||[]);
    const{data:drivers}=await supabase.from("profiles").select("*").eq("role","driver");
    setAdminDrivers(drivers||[]);
  };

  const updateApplication=async(id,status)=>{
    await supabase.from("driver_applications").update({status,reviewed_by:user.id}).eq("id",id);
    if(status==="approved"){
      const app=applications.find(a=>a.id===id);
      if(app?.user_id) await supabase.from("profiles").update({role:"driver"}).eq("id",app.user_id);
    }
    loadAdminData();
  };

  const loadDriverData=async()=>{
    if(!user) return;
    const{data:app}=await supabase.from("driver_applications").select("*").eq("user_id",user.id).order("created_at",{ascending:false}).limit(1).single();
    setDriverApp(app);
    const{data:trips}=await supabase.from("trips").select("*").eq("driver_id",user.id).order("trip_date",{ascending:false});
    setDriverTrips(trips||[]);
  };

  const postTrip=async()=>{
    if(!tripForm.from||!tripForm.to||!tripForm.date||!tripForm.pricePerSeat){ setTripError(t.driver.fillAll); return; }
    const{error}=await supabase.from("trips").insert({driver_id:user.id,from_city:tripForm.from,to_city:tripForm.to,trip_date:tripForm.date,trip_time:tripForm.time||null,price_per_seat:parseFloat(tripForm.pricePerSeat),total_seats:parseInt(tripForm.totalSeats),available_seats:parseInt(tripForm.totalSeats),car_type:tripForm.carType});
    if(!error){ setTripSuccess(true); setTimeout(()=>setTripSuccess(false),3000); setTripForm({from:"",to:"",date:"",time:"",pricePerSeat:"",totalSeats:"4",carType:""}); loadDriverData(); }
    else setTripError(t.driver.fillAll);
  };

  const cancelTrip=async(id)=>{ await supabase.from("trips").update({status:"cancelled"}).eq("id",id); loadDriverData(); };

  const searchTrips=async()=>{
    if(!searchDate) return;
    setTripsLoaded(false);
    const{data}=await supabase.from("trips").select("*").eq("trip_date",searchDate).eq("status","active").gt("available_seats",0).order("trip_time");
    setTrips(data||[]);
    setTripsLoaded(true);
  };

  const bookTripSeat=async()=>{
    if(!tripBooking.name||!tripBooking.phone||!selectedTrip) return;
    const ref=genRef();
    await supabase.from("bookings").insert({trip_id:selectedTrip.id,passenger_name:tripBooking.name,passenger_phone:tripBooking.phone,seats:tripBooking.seats,payment_method:tripBooking.payment,status:"pending",ref_code:ref});
    await supabase.from("trips").update({available_seats:selectedTrip.available_seats-tripBooking.seats}).eq("id",selectedTrip.id);
    const from=gc(selectedTrip.from_city);const to=gc(selectedTrip.to_city);
    const msg=lang==="ar"?`🚗 *حجز مقعد - سفّرني*\n\n📋 رقم الحجز: ${ref}\n📍 المسار: ${from?.[lang]||selectedTrip.from_city} إلى ${to?.[lang]||selectedTrip.to_city}\n📅 التاريخ: ${selectedTrip.trip_date}\n⏰ الوقت: ${selectedTrip.trip_time||"-"}\n💰 السعر: $${selectedTrip.price_per_seat} للمقعد\n\n👤 الاسم: ${tripBooking.name}\n📞 الهاتف: ${tripBooking.phone}`:
    `🚗 *Seat Booking - Safferni*\n\n📋 Ref: ${ref}\n📍 Route: ${from?.en||selectedTrip.from_city} to ${to?.en||selectedTrip.to_city}\n📅 Date: ${selectedTrip.trip_date}\n⏰ Time: ${selectedTrip.trip_time||"-"}\n💰 Price: $${selectedTrip.price_per_seat} per seat\n\n👤 Name: ${tripBooking.name}\n📞 Phone: ${tripBooking.phone}`;
    window.open(`https://wa.me/${WA_PHONE}?text=${encodeURIComponent(msg)}`,"_blank");
    setTripBooked(true); setSelectedTrip(null);
  };

  useEffect(()=>{ if(page==="admin"&&isAdmin) loadAdminData(); },[page]);
  useEffect(()=>{ if(page==="driver"&&user) loadDriverData(); },[page,user]);

  const toggleLang=()=>setLang(l=>l==="ar"?"en":"ar");
  const availDests=form.from?getDests(form.from).map(id=>gc(id)):[];
  const dealDests=dealForm.from?getDests(dealForm.from).map(id=>gc(id)):[];
  const route=form.from&&form.to?findRoute(form.from,form.to):null;
  const eType=route?.carOnly&&form.type==="seat"?"car":form.type;
  const price=route?(eType==="seat"?route.seat:eType==="car"?route.car:route.van):null;
  const copyUSDT=()=>{navigator.clipboard.writeText(USDT_ADDRESS).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000)})};
  const handleFromChange=(v)=>setForm({...form,from:v,to:""});
  const handleDealFromChange=(v)=>setDealForm({...dealForm,from:v,to:""});

  const handleSubmit=()=>{
    if(!form.from||!form.to||!form.date||!form.name||!form.phone){ setError(b.fillAll); return; }
    if(form.payment==="shamcash") return;
    setError("");
    const ref=genRef(); setBookingRef(ref);
    const fc=gc(form.from),tc=gc(form.to);
    const rt=`${fc[lang]} ${lang==="ar"?"إلى":"to"} ${tc[lang]}`;
    const rtEn=`${fc.en} to ${tc.en}`;
    const tl=eType==="seat"?"Seat":eType==="car"?"Car":"Van";
    const pl=form.payment==="cash"?"Cash":form.payment==="crypto"?"Crypto (USDT)":"Sham Cash";
    try{const p=new URLSearchParams({date:form.date,time:form.time||"-",route:rtEn,type:tl,price:`$${price}`,name:form.name,phone:form.phone,passengers:form.passengers,bags:form.bags||"0",notes:form.notes||"-",payment:pl,ref});fetch(`${SHEET_URL}?${p.toString()}`,{method:"GET",mode:"no-cors"})}catch(e){console.log(e)}
    const msg=lang==="ar"?`🚗 *طلب حجز جديد - سفّرني*\n\n📋 رقم الحجز: ${ref}\n📍 المسار: ${rt}\n🧾 النوع: ${eType==="seat"?"مقعد":eType==="car"?"سيارة كاملة":"فان"}\n💰 السعر: $${price}\n💳 الدفع: ${form.payment==="cash"?"كاش":form.payment==="crypto"?"عملات رقمية (USDT)":"شام كاش"}\n\n📅 التاريخ: ${form.date}\n⏰ الوقت: ${form.time||"-"}\n👥 عدد الركاب: ${form.passengers}\n🧳 الحقائب: ${form.bags||"0"}\n\n👤 الاسم: ${form.name}\n📞 الهاتف: ${form.phone}\n📝 ملاحظات: ${form.notes||"-"}`:
    `🚗 *New Booking - Safferni*\n\n📋 Ref: ${ref}\n📍 Route: ${rt}\n🧾 Type: ${tl}\n💰 Price: $${price}\n💳 Payment: ${pl}\n\n📅 Date: ${form.date}\n⏰ Time: ${form.time||"-"}\n👥 Passengers: ${form.passengers}\n🧳 Bags: ${form.bags||"0"}\n\n👤 Name: ${form.name}\n📞 Phone: ${form.phone}\n📝 Notes: ${form.notes||"-"}`;
    window.open(`https://wa.me/${WA_PHONE}?text=${encodeURIComponent(msg)}`,"_blank");
    setSubmitted(true);
    setForm({from:"",to:"",type:"car",date:"",time:"",name:"",phone:"",passengers:"1",bags:"0",notes:"",payment:"cash"});
  };

  const handleDealSubmit=()=>{
    if(!dealForm.from||!dealForm.to||!dealForm.dateFrom||!dealForm.dateTo||!dealForm.name||!dealForm.phone){setDealError(dl.fillAll);return}
    setDealError("");
    const fc=gc(dealForm.from),tc=gc(dealForm.to);
    const rt=`${fc[lang]} ${lang==="ar"?"إلى":"to"} ${tc[lang]}`;
    const msg=lang==="ar"?`🎫 *طلب مقعد مرن - سفّرني*\n\n📍 المسار: ${rt}\n📅 أي وقت بين: ${dealForm.dateFrom} و ${dealForm.dateTo}\n\n👤 الاسم: ${dealForm.name}\n📞 الهاتف: ${dealForm.phone}\n\n⏳ بانتظار مقعد فاضي — خبروني لما يتوفر!`:
    `🎫 *Flexible Seat Request - Safferni*\n\n📍 Route: ${rt}\n📅 Anytime between: ${dealForm.dateFrom} and ${dealForm.dateTo}\n\n👤 Name: ${dealForm.name}\n📞 Phone: ${dealForm.phone}\n\n⏳ Waiting for an available seat — notify me!`;
    window.open(`https://wa.me/${WA_PHONE}?text=${encodeURIComponent(msg)}`,"_blank");
    setDealSubmitted(true);
    setDealForm({from:"",to:"",dateFrom:"",dateTo:"",name:"",phone:""});
  };

  const scrollToBook=()=>{setPage("home");setTimeout(()=>bkRef.current?.scrollIntoView({behavior:"smooth"}),100)};
  const fade={animation:"fadeUp 0.7s ease both"};
  const navLinks=[["home",t.nav.home],["pricing",t.nav.pricing],["contact",t.nav.contact]];

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
        ::selection{background:#1B3A2A;color:white} html{scroll-behavior:smooth}
      `}</style>

      {/* NAV */}
      <nav style={{position:"sticky",top:0,zIndex:100,background:"rgba(250,250,248,0.95)",backdropFilter:"blur(16px)",borderBottom:"1px solid #E8E6E1",padding:"0 24px"}}>
        <div style={{maxWidth:1100,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:60}}>
          <div onClick={()=>setPage("home")} style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
            <LogoSVG/><span style={{fontSize:20,fontWeight:900,color:"#1B3A2A"}}>{t.brand}</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:18}} className="dnav">
            {navLinks.map(([k,l])=>(<span key={k} onClick={()=>setPage(k)} style={{cursor:"pointer",fontSize:13,fontWeight:600,color:page===k?"#1B3A2A":"#999"}}>{l}</span>))}
            <span onClick={()=>setPage("apply")} style={{cursor:"pointer",fontSize:13,fontWeight:600,color:page==="apply"?"#1B3A2A":"#999"}}>{t.nav.apply}</span>
            {isAdmin&&<span onClick={()=>setPage("admin")} style={{cursor:"pointer",fontSize:13,fontWeight:600,color:page==="admin"?"#1B3A2A":"#E8913A"}}>{t.nav.admin}</span>}
            {user&&profile?.role==="driver"&&<span onClick={()=>setPage("driver")} style={{cursor:"pointer",fontSize:13,fontWeight:600,color:page==="driver"?"#1B3A2A":"#999"}}>{t.nav.driver}</span>}
            {user?(<button onClick={handleLogout} style={{background:"transparent",border:"1.5px solid #DDD",borderRadius:8,padding:"6px 14px",fontSize:12,cursor:"pointer",fontWeight:700,color:"#555",fontFamily:"inherit"}}>{t.nav.logout}</button>):
            (<button onClick={()=>setPage("login")} style={{background:"#1B3A2A",color:"white",border:"none",padding:"8px 18px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{t.nav.login}</button>)}
            <button onClick={scrollToBook} style={{background:"#1B3A2A",color:"white",border:"none",padding:"8px 18px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{t.nav.book}</button>
            <button onClick={toggleLang} style={{background:"transparent",border:"1.5px solid #DDD",borderRadius:8,padding:"6px 14px",fontSize:12,cursor:"pointer",fontWeight:700,color:"#555",fontFamily:"inherit"}}>{lang==="ar"?"EN":"عربي"}</button>
          </div>
          <div style={{display:"none"}} className="mnav">
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <button onClick={toggleLang} style={{background:"transparent",border:"1.5px solid #DDD",borderRadius:6,padding:"5px 12px",fontSize:11,cursor:"pointer",fontWeight:700,color:"#555",fontFamily:"inherit"}}>{lang==="ar"?"EN":"عربي"}</button>
              <div onClick={()=>setMenuOpen(!menuOpen)} style={{cursor:"pointer",padding:8,fontSize:20,lineHeight:1}}>{menuOpen?"✕":"☰"}</div>
            </div>
          </div>
        </div>
        {menuOpen&&(<div style={{animation:"slideDown 0.3s ease",borderTop:"1px solid #E8E6E1",padding:"12px 0 16px"}}>
          {navLinks.map(([k,l])=>(<div key={k} onClick={()=>{setPage(k);setMenuOpen(false)}} style={{padding:"10px 24px",cursor:"pointer",fontSize:15,fontWeight:page===k?700:400,color:page===k?"#1B3A2A":"#444"}}>{l}</div>))}
          <div onClick={()=>{setPage("apply");setMenuOpen(false)}} style={{padding:"10px 24px",cursor:"pointer",fontSize:15,color:"#444"}}>{t.nav.apply}</div>
          {user?(<div onClick={()=>{handleLogout();setMenuOpen(false)}} style={{padding:"10px 24px",cursor:"pointer",fontSize:15,color:"#444"}}>{t.nav.logout}</div>):
          (<div onClick={()=>{setPage("login");setMenuOpen(false)}} style={{padding:"10px 24px",cursor:"pointer",fontSize:15,color:"#1B3A2A",fontWeight:700}}>{t.nav.login}</div>)}
          <div style={{padding:"8px 24px"}}><button onClick={()=>{scrollToBook();setMenuOpen(false)}} style={{background:"#1B3A2A",color:"white",border:"none",padding:"10px 24px",borderRadius:8,fontSize:14,fontWeight:700,cursor:"pointer",width:"100%",fontFamily:"inherit"}}>{t.nav.book}</button></div>
        </div>)}
        <style>{`@media(max-width:700px){.dnav{display:none!important}.mnav{display:flex!important}}`}</style>
      </nav>

      {/* ═══ LOGIN / SIGNUP ═══ */}
      {page==="login"&&(
        <section style={{maxWidth:420,margin:"0 auto",padding:"60px 24px 80px",...fade}}>
          <div style={{background:"white",borderRadius:20,padding:"40px 28px",border:"1px solid #E8E6E1",boxShadow:"0 8px 40px rgba(0,0,0,0.05)"}}>
            <div style={{textAlign:"center",marginBottom:28}}>
              <LogoSVG/>
              <h2 style={{fontSize:22,fontWeight:900,color:"#1B3A2A",marginTop:12}}>{authMode==="login"?t.auth.login:t.auth.signup}</h2>
            </div>
            {authMode==="signup"&&(<div style={{marginBottom:16}}><label style={lbl}>{t.auth.fullName}</label><input value={authForm.fullName} onChange={e=>setAuthForm({...authForm,fullName:e.target.value})} style={inp}/></div>)}
            {authMode==="signup"&&(<div style={{marginBottom:16}}><label style={lbl}>{t.auth.phone}</label><input value={authForm.phone} onChange={e=>setAuthForm({...authForm,phone:e.target.value})} style={inp} placeholder="+963..."/></div>)}
            <div style={{marginBottom:16}}><label style={lbl}>{t.auth.email}</label><input type="email" value={authForm.email} onChange={e=>setAuthForm({...authForm,email:e.target.value})} style={inp}/></div>
            <div style={{marginBottom:24}}><label style={lbl}>{t.auth.password}</label><input type="password" value={authForm.password} onChange={e=>setAuthForm({...authForm,password:e.target.value})} style={inp}/></div>
            {authError&&<div style={{marginBottom:14,padding:"10px 16px",background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:10,color:"#B91C1C",fontSize:13,fontWeight:700}}>{authError}</div>}
            <button onClick={handleAuth} disabled={authLoading} style={{width:"100%",background:"#1B3A2A",color:"white",border:"none",padding:"14px",borderRadius:12,fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>{authLoading?"...":authMode==="login"?t.auth.loginBtn:t.auth.signupBtn}</button>
            <p style={{textAlign:"center",marginTop:16,fontSize:13,color:"#888"}}>
              {authMode==="login"?t.auth.noAccount:t.auth.haveAccount}{" "}
              <span onClick={()=>setAuthMode(authMode==="login"?"signup":"login")} style={{color:"#1B3A2A",fontWeight:700,cursor:"pointer"}}>{authMode==="login"?t.auth.signupBtn:t.auth.loginBtn}</span>
            </p>
          </div>
        </section>
      )}

      {/* ═══ APPLY AS DRIVER ═══ */}
      {page==="apply"&&(
        <section style={{maxWidth:550,margin:"0 auto",padding:"60px 24px 80px",...fade}}>
          {applySubmitted?(
            <div style={{background:"white",borderRadius:20,padding:"44px 28px",border:"1px solid #E8E6E1",textAlign:"center"}}>
              <div style={{fontSize:48,marginBottom:16}}>🚗</div>
              <h3 style={{fontSize:22,fontWeight:900,color:"#1B3A2A",marginBottom:12}}>{t.apply.success}</h3>
              <button onClick={()=>{setApplySubmitted(false);setPage("home")}} style={{background:"#1B3A2A",color:"white",border:"none",padding:"12px 36px",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>OK</button>
            </div>
          ):(
            <div style={{background:"white",borderRadius:20,padding:"40px 28px",border:"1px solid #E8E6E1",boxShadow:"0 8px 40px rgba(0,0,0,0.05)"}}>
              <h2 style={{fontSize:24,fontWeight:900,marginBottom:8,color:"#1B3A2A",textAlign:"center"}}>{t.apply.title}</h2>
              <p style={{fontSize:13,color:"#AAA",textAlign:"center",marginBottom:28}}>{t.apply.desc}</p>
              <div style={{marginBottom:16}}><label style={lbl}>{t.apply.fullName} *</label><input value={applyForm.fullName} onChange={e=>setApplyForm({...applyForm,fullName:e.target.value})} style={inp}/></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
                <div><label style={lbl}>{t.apply.phone} *</label><input value={applyForm.phone} onChange={e=>setApplyForm({...applyForm,phone:e.target.value})} style={inp} placeholder="+963..."/></div>
                <div><label style={lbl}>{t.apply.city} *</label><select value={applyForm.city} onChange={e=>setApplyForm({...applyForm,city:e.target.value})} style={inp}><option value="">{b.selectCity}</option>{cities.map(c=><option key={c.id} value={c.id}>{c[lang]}</option>)}</select></div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
                <div><label style={lbl}>{t.apply.carType} *</label><input value={applyForm.carType} onChange={e=>setApplyForm({...applyForm,carType:e.target.value})} style={inp} placeholder={lang==="ar"?"مثال: تويوتا كامري":"e.g. Toyota Camry"}/></div>
                <div><label style={lbl}>{t.apply.carModel}</label><input value={applyForm.carModel} onChange={e=>setApplyForm({...applyForm,carModel:e.target.value})} style={inp} placeholder="2022"/></div>
              </div>
              <div style={{marginBottom:16}}><label style={lbl}>{t.apply.licensePlate}</label><input value={applyForm.licensePlate} onChange={e=>setApplyForm({...applyForm,licensePlate:e.target.value})} style={inp}/></div>
              <div style={{marginBottom:20}}><label style={lbl}>{t.apply.notes}</label><textarea value={applyForm.notes} onChange={e=>setApplyForm({...applyForm,notes:e.target.value})} style={{...inp,minHeight:65,resize:"vertical"}} rows={2}/></div>
              {applyError&&<div style={{marginBottom:14,padding:"10px 16px",background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:10,color:"#B91C1C",fontSize:13,fontWeight:700}}>{applyError}</div>}
              <button onClick={handleApply} style={{width:"100%",background:"#1B3A2A",color:"white",border:"none",padding:"14px",borderRadius:12,fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>{t.apply.submit}</button>
            </div>
          )}
        </section>
      )}

      {/* ═══ ADMIN DASHBOARD ═══ */}
      {page==="admin"&&isAdmin&&(
        <section style={{maxWidth:900,margin:"0 auto",padding:"40px 24px 80px",...fade}}>
          <h2 style={{fontSize:28,fontWeight:900,color:"#1B3A2A",marginBottom:24,textAlign:"center"}}>{t.admin.title}</h2>
          {/* Tabs */}
          <div style={{display:"flex",gap:8,marginBottom:28,justifyContent:"center"}}>
            {[["applications",t.admin.applications],["drivers",t.admin.drivers]].map(([k,l])=>(
              <button key={k} onClick={()=>setAdminTab(k)} style={{padding:"10px 24px",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",border:"2px solid",borderColor:adminTab===k?"#1B3A2A":"#E8E6E1",background:adminTab===k?"#1B3A2A":"white",color:adminTab===k?"white":"#666"}}>{l}</button>
            ))}
          </div>

          {adminTab==="applications"&&(
            <div>
              {applications.length===0?<p style={{textAlign:"center",color:"#AAA",padding:"40px"}}>{t.admin.noApps}</p>:
              applications.map((app,i)=>(
                <div key={app.id} style={{background:"white",borderRadius:14,padding:"20px 24px",border:"1px solid #E8E6E1",marginBottom:12,animation:`fadeUp 0.4s ease ${0.05*i}s both`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
                    <div>
                      <div style={{fontWeight:800,fontSize:16,color:"#1B3A2A",marginBottom:4}}>{app.full_name}</div>
                      <div style={{fontSize:12,color:"#888"}}>{t.admin.phone}: {app.phone} · {t.admin.city}: {gc(app.city)?.[lang]||app.city} · {t.admin.car}: {app.car_type} {app.car_model}</div>
                      {app.notes&&<div style={{fontSize:12,color:"#AAA",marginTop:4}}>{app.notes}</div>}
                    </div>
                    <div style={{display:"flex",gap:8,alignItems:"center"}}>
                      <span style={{fontSize:11,fontWeight:700,padding:"4px 12px",borderRadius:20,background:app.status==="pending"?"#FFF3CD":app.status==="approved"?"#D1FAE5":"#FEE2E2",color:app.status==="pending"?"#92400E":app.status==="approved"?"#065F46":"#991B1B"}}>{t.admin[app.status]}</span>
                      {app.status==="pending"&&(<>
                        <button onClick={()=>updateApplication(app.id,"approved")} style={{background:"#1B3A2A",color:"white",border:"none",padding:"8px 16px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{t.admin.approve}</button>
                        <button onClick={()=>updateApplication(app.id,"denied")} style={{background:"#EF4444",color:"white",border:"none",padding:"8px 16px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{t.admin.deny}</button>
                      </>)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {adminTab==="drivers"&&(
            <div>
              {adminDrivers.length===0?<p style={{textAlign:"center",color:"#AAA",padding:"40px"}}>{t.admin.noApps}</p>:
              adminDrivers.map((d,i)=>(
                <div key={d.id} style={{background:"white",borderRadius:14,padding:"20px 24px",border:"1px solid #E8E6E1",marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12,animation:`fadeUp 0.4s ease ${0.05*i}s both`}}>
                  <div>
                    <div style={{fontWeight:800,fontSize:15,color:"#1B3A2A"}}>{d.full_name}</div>
                    <div style={{fontSize:12,color:"#888"}}>{d.email} · {d.phone}</div>
                  </div>
                  <button onClick={async()=>{await supabase.from("profiles").update({role:"passenger"}).eq("id",d.id);loadAdminData()}} style={{background:"#EF4444",color:"white",border:"none",padding:"8px 16px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{t.admin.revokeTrips}</button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ═══ DRIVER DASHBOARD ═══ */}
      {page==="driver"&&user&&(
        <section style={{maxWidth:700,margin:"0 auto",padding:"40px 24px 80px",...fade}}>
          <h2 style={{fontSize:28,fontWeight:900,color:"#1B3A2A",marginBottom:24,textAlign:"center"}}>{t.driver.title}</h2>

          {profile?.role!=="driver"?(
            <div style={{background:"#FFF9E6",border:"1px solid #FFE082",borderRadius:16,padding:"32px",textAlign:"center"}}>
              <div style={{fontSize:40,marginBottom:12}}>⏳</div>
              <p style={{fontSize:15,fontWeight:700,color:"#92400E"}}>{t.driver.notApproved}</p>
            </div>
          ):(
            <div>
              {/* Add trip form */}
              <div style={{background:"white",borderRadius:16,padding:"28px",border:"1px solid #E8E6E1",marginBottom:24}}>
                <h3 style={{fontSize:18,fontWeight:800,color:"#1B3A2A",marginBottom:20}}>{t.driver.addTrip}</h3>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
                  <div><label style={lbl}>{t.driver.from} *</label><select value={tripForm.from} onChange={e=>setTripForm({...tripForm,from:e.target.value,to:""})} style={inp}><option value="">{t.driver.selectCity}</option>{cities.map(c=><option key={c.id} value={c.id}>{c[lang]}</option>)}</select></div>
                  <div><label style={lbl}>{t.driver.to} *</label><select value={tripForm.to} onChange={e=>setTripForm({...tripForm,to:e.target.value})} style={inp} disabled={!tripForm.from}><option value="">{tripForm.from?b.selectDest:b.selectFromFirst}</option>{tripForm.from?getDests(tripForm.from).map(id=>{const c=gc(id);return<option key={id} value={id}>{c[lang]}</option>}):null}</select></div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
                  <div><label style={lbl}>{t.driver.date} *</label><input type="date" value={tripForm.date} onChange={e=>setTripForm({...tripForm,date:e.target.value})} style={inp}/></div>
                  <div><label style={lbl}>{t.driver.time}</label><input type="time" value={tripForm.time} onChange={e=>setTripForm({...tripForm,time:e.target.value})} style={inp}/></div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:16}}>
                  <div><label style={lbl}>{t.driver.pricePerSeat} *</label><input type="number" value={tripForm.pricePerSeat} onChange={e=>setTripForm({...tripForm,pricePerSeat:e.target.value})} style={inp} placeholder="0"/></div>
                  <div><label style={lbl}>{t.driver.totalSeats}</label><select value={tripForm.totalSeats} onChange={e=>setTripForm({...tripForm,totalSeats:e.target.value})} style={inp}>{[2,3,4,5,6,7,8,9,10].map(n=><option key={n} value={n}>{n}</option>)}</select></div>
                  <div><label style={lbl}>{t.driver.carType}</label><input value={tripForm.carType} onChange={e=>setTripForm({...tripForm,carType:e.target.value})} style={inp}/></div>
                </div>
                {tripError&&<div style={{marginBottom:12,padding:"10px 16px",background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:10,color:"#B91C1C",fontSize:13,fontWeight:700}}>{tripError}</div>}
                {tripSuccess&&<div style={{marginBottom:12,padding:"10px 16px",background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:10,color:"#166534",fontSize:13,fontWeight:700}}>✓ {t.driver.success}</div>}
                <button onClick={postTrip} style={{width:"100%",background:"#1B3A2A",color:"white",border:"none",padding:"14px",borderRadius:12,fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>{t.driver.submit}</button>
              </div>

              {/* My trips */}
              <h3 style={{fontSize:18,fontWeight:800,color:"#1B3A2A",marginBottom:16}}>{t.driver.myTrips}</h3>
              {driverTrips.length===0?<p style={{color:"#AAA",textAlign:"center",padding:"24px"}}>{t.driver.noTrips}</p>:
              driverTrips.map((trip,i)=>{
                const fc=gc(trip.from_city);const tc=gc(trip.to_city);
                return(
                  <div key={trip.id} style={{background:"white",borderRadius:14,padding:"18px 20px",border:"1px solid #E8E6E1",marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10,animation:`fadeUp 0.4s ease ${0.05*i}s both`}}>
                    <div>
                      <div style={{fontWeight:800,fontSize:14,color:"#1B3A2A"}}>{fc?.[lang]||trip.from_city} → {tc?.[lang]||trip.to_city}</div>
                      <div style={{fontSize:12,color:"#888"}}>{trip.trip_date} {trip.trip_time||""} · ${trip.price_per_seat}/seat · {trip.available_seats}/{trip.total_seats} seats</div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:11,fontWeight:700,padding:"4px 12px",borderRadius:20,background:trip.status==="active"?"#D1FAE5":"#FEE2E2",color:trip.status==="active"?"#065F46":"#991B1B"}}>{trip.status}</span>
                      {trip.status==="active"&&<button onClick={()=>cancelTrip(trip.id)} style={{background:"#EF4444",color:"white",border:"none",padding:"6px 14px",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{t.driver.cancel}</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ═══ HOME ═══ */}
      {page==="home"&&(<div>
        <section style={{background:"linear-gradient(180deg,#1B3A2A,#234D36)",padding:"70px 24px 80px",textAlign:"center",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:3,height:"100%",background:"rgba(255,255,255,0.05)"}}/>
          <svg style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",opacity:0.04}} viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice"><g fill="white"><path d="M60 320 l10-20 h30 l5-15 h25 l5 15 h30 l10 20z M75 320a8 8 0 1 0 16 0M125 320a8 8 0 1 0 16 0"/><path d="M550 300 l12-24 h36 l6-18 h30 l6 18 h36 l12 24z M568 300a10 10 0 1 0 20 0M628 300a10 10 0 1 0 20 0"/><path d="M250 350 l8-16 h24 l4-12 h20 l4 12 h24 l8 16z M262 350a6 6 0 1 0 12 0M302 350a6 6 0 1 0 12 0"/><path d="M420 340 l10-20 h30 l5-15 h25 l5 15 h30 l10 20z M435 340a8 8 0 1 0 16 0M485 340a8 8 0 1 0 16 0"/></g></svg>
          <div style={{position:"relative",zIndex:1,...fade}}>
            <div style={{animation:"float 3s ease-in-out infinite",marginBottom:20}}><LogoSVG light/></div>
            <h1 style={{fontSize:"clamp(48px,10vw,80px)",fontWeight:900,color:"white",lineHeight:1.1,marginBottom:4}}>{t.brand}</h1>
            <div style={{fontSize:16,fontWeight:700,color:"rgba(255,255,255,0.4)",letterSpacing:10,marginBottom:24}}>{t.brandEn}</div>
            <p style={{fontSize:"clamp(16px,3vw,22px)",fontWeight:600,color:"rgba(255,255,255,0.9)",marginBottom:12,maxWidth:500,marginInline:"auto"}}>{t.tagline}</p>
            <p style={{fontSize:13,color:"rgba(255,255,255,0.4)",maxWidth:460,marginInline:"auto",marginBottom:32}}>{t.subtitle}</p>
            <button onClick={scrollToBook} style={{background:"white",color:"#1B3A2A",border:"none",padding:"14px 44px",borderRadius:12,fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 20px rgba(0,0,0,0.2)",transition:"transform 0.2s"}} onMouseEnter={e=>e.target.style.transform="scale(1.04)"} onMouseLeave={e=>e.target.style.transform="scale(1)"}>{t.nav.book}</button>
          </div>
        </section>

        {/* $10 DEAL BANNER */}
        <div onClick={()=>setPage("deal")} style={{background:"linear-gradient(135deg,#FF6B35,#FF8C42)",cursor:"pointer",padding:"18px 24px",textAlign:"center",transition:"filter 0.2s"}} onMouseEnter={e=>e.currentTarget.style.filter="brightness(1.05)"} onMouseLeave={e=>e.currentTarget.style.filter="brightness(1)"}>
          <div style={{maxWidth:600,margin:"0 auto"}}>
            <div style={{fontSize:"clamp(18px,4vw,26px)",fontWeight:900,color:"white",marginBottom:4}}>🎫 {dl.banner}</div>
            <div style={{fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.8)"}}>{dl.bannerSub}</div>
          </div>
        </div>

        {/* About */}
        <section style={{maxWidth:800,margin:"0 auto",padding:"60px 24px 20px",textAlign:"center"}}>
          <h2 style={{fontSize:26,fontWeight:900,color:"#1B3A2A",marginBottom:16}}>{t.about.title}</h2>
          {[t.about.p1,t.about.p2,t.about.p3].map((p,i)=>(<p key={i} style={{fontSize:15,color:"#555",lineHeight:1.9,maxWidth:620,margin:"0 auto 10px"}}>{p}</p>))}
        </section>

        {/* Features */}
        <section style={{maxWidth:900,margin:"0 auto",padding:"40px 24px 50px"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:14}}>
            {t.features.map((f,i)=>(<div key={i} style={{background:"white",border:"1px solid #ECEAE6",borderRadius:14,padding:"28px 20px",textAlign:"center",animation:`fadeUp 0.6s ease ${0.15*i+0.3}s both`,transition:"transform 0.2s,box-shadow 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,0.06)"}} onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none"}}><div style={{fontSize:28,marginBottom:10}}>{f.icon}</div><div style={{fontWeight:800,fontSize:14,color:"#1B3A2A",marginBottom:5}}>{f.t}</div><div style={{fontSize:12,color:"#999",lineHeight:1.5}}>{f.d}</div></div>))}
          </div>
        </section>

        <div style={{maxWidth:120,margin:"0 auto 10px",borderTop:"2px solid #E8E6E1"}}/>

        {/* TRIP SEARCH */}
        <section style={{maxWidth:680,margin:"0 auto",padding:"40px 24px 20px"}}>
          <div style={{background:"white",borderRadius:16,padding:"28px",border:"1px solid #E8E6E1",boxShadow:"0 4px 20px rgba(0,0,0,0.04)"}}>
            <h3 style={{fontSize:18,fontWeight:900,color:"#1B3A2A",marginBottom:16,textAlign:"center"}}>{b.searchTitle}</h3>
            <div style={{display:"flex",gap:10,alignItems:"flex-end"}}>
              <div style={{flex:1}}><label style={lbl}>{b.searchDate}</label><input type="date" value={searchDate} onChange={e=>setSearchDate(e.target.value)} style={inp}/></div>
              <button onClick={searchTrips} style={{background:"#1B3A2A",color:"white",border:"none",padding:"11px 24px",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>{b.searchBtn}</button>
            </div>

            {tripsLoaded&&(
              <div style={{marginTop:20}}>
                {trips.length===0?(
                  <div style={{textAlign:"center",padding:"24px 0"}}>
                    <p style={{color:"#AAA",fontSize:14,marginBottom:16}}>{b.noTrips}</p>
                  </div>
                ):(
                  <div>
                    <p style={{fontSize:13,fontWeight:700,color:"#1B3A2A",marginBottom:12}}>{b.availableTrips}:</p>
                    {trips.map((trip,i)=>{
                      const fc=gc(trip.from_city);const tc=gc(trip.to_city);
                      return(
                        <div key={trip.id} style={{border:"1px solid #E8E6E1",borderRadius:12,padding:"16px",marginBottom:10,background:"#FAFAF8",animation:`fadeUp 0.3s ease ${0.05*i}s both`}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
                            <div>
                              <div style={{fontWeight:800,fontSize:14,color:"#1B3A2A"}}>{fc?.[lang]||trip.from_city} → {tc?.[lang]||trip.to_city}</div>
                              <div style={{fontSize:12,color:"#888"}}>{trip.trip_time||"—"} · {trip.available_seats} {b.seatsLeft} · {trip.car_type||""}</div>
                            </div>
                            <div style={{display:"flex",alignItems:"center",gap:12}}>
                              <span style={{fontSize:20,fontWeight:900,color:"#1B3A2A"}}>${trip.price_per_seat}</span>
                              <button onClick={()=>setSelectedTrip(trip)} style={{background:"#1B3A2A",color:"white",border:"none",padding:"8px 16px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{b.bookSeat}</button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div style={{marginTop:16,paddingTop:16,borderTop:"1px solid #E8E6E1",textAlign:"center"}}>
                  <span style={{fontSize:13,color:"#888"}}>{b.customBook} →</span>
                  <span onClick={()=>bkRef.current?.scrollIntoView({behavior:"smooth"})} style={{fontSize:13,color:"#1B3A2A",fontWeight:700,cursor:"pointer",marginInlineStart:6}}>{b.title}</span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Trip booking modal */}
        {selectedTrip&&(
          <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.5)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px"}}>
            <div style={{background:"white",borderRadius:20,padding:"32px",maxWidth:420,width:"100%",animation:"fadeUp 0.3s ease"}}>
              {tripBooked?(
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:48,marginBottom:12}}>✓</div>
                  <h3 style={{fontSize:20,fontWeight:900,color:"#1B3A2A",marginBottom:8}}>{b.confirmTitle}</h3>
                  <p style={{fontSize:13,color:"#555",marginBottom:20}}>{b.confirmMsg}</p>
                  <button onClick={()=>{setTripBooked(false);setSelectedTrip(null)}} style={{background:"#1B3A2A",color:"white",border:"none",padding:"12px 32px",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{b.confirmClose}</button>
                </div>
              ):(
                <div>
                  <h3 style={{fontSize:18,fontWeight:900,color:"#1B3A2A",marginBottom:16}}>{b.bookSeat}</h3>
                  <div style={{marginBottom:12}}><label style={lbl}>{b.name} *</label><input value={tripBooking.name} onChange={e=>setTripBooking({...tripBooking,name:e.target.value})} style={inp}/></div>
                  <div style={{marginBottom:12}}><label style={lbl}>{b.phone} *</label><input type="tel" value={tripBooking.phone} onChange={e=>setTripBooking({...tripBooking,phone:e.target.value})} style={inp} placeholder="+963..."/></div>
                  <div style={{marginBottom:12}}><label style={lbl}>{b.passengers}</label><select value={tripBooking.seats} onChange={e=>setTripBooking({...tripBooking,seats:parseInt(e.target.value)})} style={inp}>{Array.from({length:selectedTrip.available_seats},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</select></div>
                  <div style={{background:"#F0F7F3",borderRadius:10,padding:"12px 16px",marginBottom:16,display:"flex",justifyContent:"space-between"}}>
                    <span style={{fontSize:13,fontWeight:700,color:"#555"}}>{b.price}</span>
                    <span style={{fontSize:20,fontWeight:900,color:"#1B3A2A"}}>${selectedTrip.price_per_seat*tripBooking.seats}</span>
                  </div>
                  <div style={{display:"flex",gap:10}}>
                    <button onClick={()=>setSelectedTrip(null)} style={{flex:1,background:"white",color:"#666",border:"1.5px solid #DDD",padding:"12px",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>✕</button>
                    <button onClick={bookTripSeat} style={{flex:2,background:"#1B3A2A",color:"white",border:"none",padding:"12px",borderRadius:10,fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>{b.submit}</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CUSTOM BOOKING */}
        <section ref={bkRef} style={{maxWidth:580,margin:"0 auto",padding:"20px 24px 80px"}}>
          {submitted?(
            <div style={{background:"white",borderRadius:20,padding:"44px 28px",border:"1px solid #E8E6E1",boxShadow:"0 8px 40px rgba(0,0,0,0.05)",textAlign:"center",animation:"fadeUp 0.5s ease"}}>
              <div style={{width:64,height:64,borderRadius:"50%",background:"#F0FDF4",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",fontSize:30}}>✓</div>
              <h3 style={{fontSize:22,fontWeight:900,color:"#1B3A2A",marginBottom:8}}>{b.confirmTitle}</h3>
              <div style={{background:"#F0F7F3",borderRadius:10,padding:"10px 20px",display:"inline-block",marginBottom:16}}><span style={{fontSize:11,fontWeight:700,color:"#888"}}>{b.confirmRef}: </span><span style={{fontSize:16,fontWeight:900,color:"#1B3A2A",letterSpacing:1}}>{bookingRef}</span></div>
              <p style={{fontSize:14,color:"#555",lineHeight:1.8,maxWidth:400,margin:"0 auto 24px"}}>{b.confirmMsg}</p>
              <button onClick={()=>setSubmitted(false)} style={{background:"#1B3A2A",color:"white",border:"none",padding:"12px 36px",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{b.confirmClose}</button>
            </div>
          ):(
            <div style={{background:"white",borderRadius:20,padding:"40px 28px",border:"1px solid #E8E6E1",boxShadow:"0 8px 40px rgba(0,0,0,0.05)"}}>
              <h2 style={{fontSize:24,fontWeight:900,marginBottom:6,color:"#1B3A2A",textAlign:"center"}}>{b.title}</h2>
              <p style={{fontSize:12,color:"#AAA",textAlign:"center",marginBottom:28}}>{b.formNote}</p>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:18}}>
                <div><label style={lbl}>{b.from} *</label><select value={form.from} onChange={e=>handleFromChange(e.target.value)} style={inp}><option value="">{b.selectCity}</option>{cities.map(c=><option key={c.id} value={c.id}>{c[lang]}</option>)}</select></div>
                <div><label style={lbl}>{b.to} *</label><select value={form.to} onChange={e=>setForm({...form,to:e.target.value})} style={inp} disabled={!form.from}><option value="">{form.from?b.selectDest:b.selectFromFirst}</option>{availDests.map(c=><option key={c.id} value={c.id}>{c[lang]}</option>)}</select></div>
              </div>
              {route?.carOnly&&form.type==="seat"&&<div style={{marginBottom:14,padding:"10px 16px",background:"#FFF8E1",border:"1px solid #FFE082",borderRadius:10,color:"#F57F17",fontSize:12,fontWeight:700}}>{b.carOnlyNote}</div>}
              <div style={{marginBottom:18}}><label style={lbl}>{b.type} *</label>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {[["seat",b.seat],["car",b.car],["van",b.van]].map(([k,l])=>{const dis=k==="seat"&&route?.carOnly;return(<button key={k} onClick={()=>!dis&&setForm({...form,type:k})} style={{flex:1,minWidth:130,padding:"11px 10px",borderRadius:10,fontSize:11,fontWeight:700,cursor:dis?"not-allowed":"pointer",fontFamily:"inherit",border:"2px solid",transition:"all 0.2s",opacity:dis?0.4:1,borderColor:eType===k?"#1B3A2A":"#E8E6E1",background:eType===k?"#1B3A2A":"white",color:eType===k?"white":"#666"}}>{l}</button>)})}
                </div>
              </div>
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
                <div><label style={lbl}>{b.time}</label><input type="time" value={form.time} onChange={e=>setForm({...form,time:e.target.value})} style={inp}/></div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:18}}>
                <div><label style={lbl}>{b.passengers} *</label><select value={form.passengers} onChange={e=>setForm({...form,passengers:e.target.value})} style={inp}>{[1,2,3,4,5,6,7,8,9,10].map(n=><option key={n} value={n}>{n}</option>)}</select></div>
                <div><label style={lbl}>{b.bags} *</label><select value={form.bags} onChange={e=>setForm({...form,bags:e.target.value})} style={inp}>{[0,1,2,3,4,5,6,7,8,9,10].map(n=><option key={n} value={n}>{n}</option>)}</select></div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:18}}>
                <div><label style={lbl}>{b.name} *</label><input type="text" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} style={inp}/></div>
                <div><label style={lbl}>{b.phone} *</label><input type="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} style={inp} placeholder="+963..."/></div>
              </div>
              <div style={{marginBottom:18}}><label style={lbl}>{b.notes}</label><textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} style={{...inp,minHeight:65,resize:"vertical"}} rows={2}/></div>
              {error&&<div style={{marginBottom:14,padding:"10px 16px",background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:10,color:"#B91C1C",fontSize:13,fontWeight:700}}>{error}</div>}
              <button onClick={handleSubmit} disabled={form.payment==="shamcash"} style={{width:"100%",background:form.payment==="shamcash"?"#CCC":"#1B3A2A",color:"white",border:"none",padding:"15px",borderRadius:12,fontSize:16,fontWeight:800,cursor:form.payment==="shamcash"?"not-allowed":"pointer",fontFamily:"inherit",transition:"background 0.2s"}} onMouseEnter={e=>form.payment!=="shamcash"&&(e.target.style.background="#142E21")} onMouseLeave={e=>form.payment!=="shamcash"&&(e.target.style.background="#1B3A2A")}>{b.submit}</button>
            </div>
          )}
        </section>
      </div>)}

      {/* ═══ DEAL PAGE ═══ */}
      {page==="deal"&&(
        <section style={{maxWidth:550,margin:"0 auto",padding:"40px 24px 80px",...fade}}>
          {dealSubmitted?(
            <div style={{background:"white",borderRadius:20,padding:"44px 28px",border:"1px solid #E8E6E1",textAlign:"center"}}>
              <div style={{width:64,height:64,borderRadius:"50%",background:"#FFF3E0",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",fontSize:30}}>🎫</div>
              <h3 style={{fontSize:22,fontWeight:900,color:"#FF6B35",marginBottom:12}}>{dl.confirmTitle}</h3>
              <p style={{fontSize:14,color:"#555",lineHeight:1.8,maxWidth:420,margin:"0 auto 24px"}}>{dl.confirmMsg}</p>
              <button onClick={()=>{setDealSubmitted(false);setPage("home")}} style={{background:"#FF6B35",color:"white",border:"none",padding:"12px 36px",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{dl.confirmClose}</button>
            </div>
          ):(
            <div>
              <div style={{textAlign:"center",marginBottom:32}}>
                <div style={{fontSize:48,marginBottom:12}}>🎫</div>
                <h2 style={{fontSize:"clamp(24px,5vw,32px)",fontWeight:900,color:"#FF6B35",marginBottom:10}}>{dl.title}</h2>
                <p style={{fontSize:14,color:"#666",lineHeight:1.8,maxWidth:460,margin:"0 auto"}}>{dl.desc}</p>
              </div>
              <div style={{background:"white",borderRadius:20,padding:"36px 28px",border:"1px solid #E8E6E1",boxShadow:"0 8px 40px rgba(0,0,0,0.05)"}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:18}}>
                  <div><label style={lbl}>{dl.from} *</label><select value={dealForm.from} onChange={e=>handleDealFromChange(e.target.value)} style={inp}><option value="">{dl.selectCity}</option>{cities.map(c=><option key={c.id} value={c.id}>{c[lang]}</option>)}</select></div>
                  <div><label style={lbl}>{dl.to} *</label><select value={dealForm.to} onChange={e=>setDealForm({...dealForm,to:e.target.value})} style={inp} disabled={!dealForm.from}><option value="">{dealForm.from?dl.selectDest:dl.selectFromFirst}</option>{dealDests.map(c=><option key={c.id} value={c.id}>{c[lang]}</option>)}</select></div>
                </div>
                <div style={{marginBottom:18}}><label style={lbl}>{dl.dateRange} *</label>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                    <div><label style={{...lbl,fontSize:10,color:"#AAA"}}>{dl.dateFrom}</label><input type="date" value={dealForm.dateFrom} onChange={e=>setDealForm({...dealForm,dateFrom:e.target.value})} style={inp}/></div>
                    <div><label style={{...lbl,fontSize:10,color:"#AAA"}}>{dl.dateTo}</label><input type="date" value={dealForm.dateTo} onChange={e=>setDealForm({...dealForm,dateTo:e.target.value})} style={inp}/></div>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
                  <div><label style={lbl}>{dl.name} *</label><input value={dealForm.name} onChange={e=>setDealForm({...dealForm,name:e.target.value})} style={inp}/></div>
                  <div><label style={lbl}>{dl.phone} *</label><input type="tel" value={dealForm.phone} onChange={e=>setDealForm({...dealForm,phone:e.target.value})} style={inp} placeholder="+963..."/></div>
                </div>
                {dealError&&<div style={{marginBottom:14,padding:"10px 16px",background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:10,color:"#B91C1C",fontSize:13,fontWeight:700}}>{dealError}</div>}
                <button onClick={handleDealSubmit} style={{width:"100%",background:"linear-gradient(135deg,#FF6B35,#FF8C42)",color:"white",border:"none",padding:"15px",borderRadius:12,fontSize:16,fontWeight:800,cursor:"pointer",fontFamily:"inherit",transition:"transform 0.2s"}} onMouseEnter={e=>e.target.style.transform="scale(1.02)"} onMouseLeave={e=>e.target.style.transform="scale(1)"}>{dl.submit}</button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* PRICING */}
      {page==="pricing"&&(
        <section style={{maxWidth:800,margin:"0 auto",padding:"60px 24px 80px",...fade}}>
          <h2 style={{fontSize:32,fontWeight:900,marginBottom:10,textAlign:"center",color:"#1B3A2A"}}>{t.pricing.title}</h2>
          <p style={{textAlign:"center",color:"#888",marginBottom:36,fontSize:15}}>{t.pricing.desc}</p>
          <div style={{background:"white",borderRadius:16,border:"1px solid #E8E6E1",overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.03)"}}>
            <div style={{display:"grid",gridTemplateColumns:"1.8fr 1fr 1fr 1fr",padding:"14px 20px",background:"#1B3A2A",fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.85)",textTransform:"uppercase"}}>
              <div>{t.pricing.route}</div><div style={{textAlign:"center"}}>{t.pricing.seat}</div><div style={{textAlign:"center"}}>{t.pricing.car}</div><div style={{textAlign:"center"}}>{t.pricing.van}</div>
            </div>
            {pricingRoutes.map((r,i)=>(<div key={i} style={{display:"grid",gridTemplateColumns:"1.8fr 1fr 1fr 1fr",padding:"14px 20px",borderBottom:i<pricingRoutes.length-1?"1px solid #F0EEEA":"none",fontSize:13,transition:"background 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background="#FAFAF8"} onMouseLeave={e=>e.currentTarget.style.background="white"}><div style={{fontWeight:800,color:"#1B3A2A"}}>{r.from[lang]} ↔ {r.to[lang]}</div><div style={{textAlign:"center",fontWeight:700}}>{r.carOnly?<span style={{fontSize:10,color:"#BBB"}}>{t.pricing.carOnly}</span>:`$${r.seat}`}</div><div style={{textAlign:"center",fontWeight:700}}>${r.car}</div><div style={{textAlign:"center",fontWeight:700}}>${r.van}</div></div>))}
          </div>
          <p style={{marginTop:20,fontSize:12,color:"#999",textAlign:"center",fontStyle:"italic"}}>{t.pricing.note}</p>
          <div style={{textAlign:"center",marginTop:36}}><button onClick={scrollToBook} style={{background:"#1B3A2A",color:"white",border:"none",padding:"14px 40px",borderRadius:12,fontSize:16,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{t.nav.book}</button></div>
        </section>
      )}

      {/* CONTACT */}
      {page==="contact"&&(
        <section style={{maxWidth:550,margin:"0 auto",padding:"60px 24px 80px",...fade}}>
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
        </section>
      )}

      <footer style={{borderTop:"1px solid #E8E6E1",padding:"20px",textAlign:"center",color:"#BBB",fontSize:12,background:"white",fontWeight:500}}>© 2026 {t.brand} — {t.footer}</footer>

      {/* FLOATING WHATSAPP */}
      <a href={`https://wa.me/${WA_PHONE}`} target="_blank" rel="noopener noreferrer" style={{position:"fixed",bottom:24,[isRTL?"left":"right"]:24,zIndex:999,width:56,height:56,borderRadius:"50%",background:"#25D366",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 16px rgba(0,0,0,0.2)",transition:"transform 0.2s",cursor:"pointer",textDecoration:"none"}} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      </a>
    </div>
  );
}

const lbl={display:"block",fontSize:12,fontWeight:700,color:"#666",marginBottom:6};
const inp={width:"100%",padding:"11px 14px",border:"1.5px solid #E0DDD8",borderRadius:10,background:"#FAFAF8",outline:"none",transition:"border-color 0.2s"};
