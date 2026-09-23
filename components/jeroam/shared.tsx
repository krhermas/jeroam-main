"use client";

import Link from "next/link";
import {useEffect,useState,type ReactNode} from "react";
import {usePathname,useRouter} from "next/navigation";
import {Compass,Menu,X,UserRound,ArrowUpRight,Bookmark,Check,Clock,ShieldCheck,MapPin,ChevronRight,Sparkles,Map as MapIcon,Route as RouteIcon,CalendarDays,Plus,Phone,MessageCircle,Building,AlertTriangle,Hotel,ExternalLink} from "lucide-react";
import {useApp} from "./provider";
import {LanguageSwitcher,localeConfig,useI18n} from "./i18n";
import {ThemeSwitcher} from "./theme";
import {GlobalSearch} from "./global-search";
import type {Photo,Place,CulturalRoute,Claim} from "@/lib/contracts";
import {claimText,displayPlaceName,displayRouteTitle,formatDistanceKm,formatMinutes,placeSummary,priceLabel,routeDescription,routeImage} from "@/lib/catalog";
import {defaultPreferences} from "@/lib/contracts";
import {scheduleItems} from "@/lib/planner";

export function EmergencyModal({open,onClose}:{open:boolean;onClose:()=>void}){
  const {locale}=useI18n();
  const isArabic=locale==="ar";
  const isHebrew=locale==="he";
  if(!open)return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position:"fixed",inset:0,background:"rgba(14,56,76,0.68)",backdropFilter:"blur(8px)",
        zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"
      }}
      onClick={onClose}
    >
      <div
        style={{
          background:"#ffffff",borderRadius:"24px",border:"2px solid #ff4d4f",
          maxWidth:"460px",width:"100%",padding:"clamp(24px, 4vh, 32px)",textAlign:"center",
          boxShadow:"0 20px 60px rgba(217,54,62,0.22)",position:"relative"
        }}
        onClick={e=>e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position:"absolute",top:"14px",right:"14px",width:"34px",height:"34px",
            borderRadius:"50%",background:"#fef0f0",border:"1px solid rgba(255,77,79,0.3)",
            display:"grid",placeItems:"center",cursor:"pointer",color:"#d9363e"
          }}
        >
          <X size={17}/>
        </button>

        <div style={{fontSize:"2.2rem",marginBottom:"10px"}}>🚨</div>
        <h2 style={{fontFamily:"'Georgia',serif",fontSize:"1.5rem",color:"#d9363e",margin:"0 0 6px 0"}}>
          {isArabic?"طوارئ القدس · SOS":isHebrew?"חירום ירושלים · SOS":"Jerusalem Emergency · SOS"}
        </h2>
        <p style={{fontSize:"0.88rem",color:"#5a7585",lineHeight:1.6,margin:"0 0 20px 0"}}>
          {isArabic?"للمساعدة الفورية أو الحالات الطارئة أثناء تجوالك في القدس، تواصل مباشرة معنا:":
           isHebrew?"לעזרה מיידית או במקרי חירום בירושלים, צרו קשר ישיר:":
           "For immediate assistance or emergencies while exploring Jerusalem, reach us directly:"}
        </p>

        <div style={{background:"#fff5f5",border:"1.5px dashed #ff4d4f",borderRadius:"16px",padding:"14px",marginBottom:"20px"}}>
          <span style={{fontSize:"0.75rem",fontWeight:700,color:"#d9363e",textTransform:"uppercase",letterSpacing:"1px",display:"block",marginBottom:"4px"}}>
            {isArabic?"الرقم المباشر للطوارئ":isHebrew?"מספר חירום ישיר":"Direct Emergency Line"}
          </span>
          <span style={{fontSize:"1.4rem",fontWeight:800,color:"#0e384c",fontFamily:"monospace",direction:"ltr",display:"inline-block"}}>
            +972 595422340
          </span>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
          <a
            href="tel:+972595422340"
            style={{
              display:"flex",alignItems:"center",justifyContent:"center",gap:"10px",
              background:"linear-gradient(135deg, #d9363e 0%, #ff4d4f 100%)",color:"#ffffff",
              borderRadius:"100px",padding:"14px",fontWeight:700,fontSize:"0.96rem",
              textDecoration:"none",boxShadow:"0 6px 20px rgba(217,54,62,0.3)"
            }}
          >
            <Phone size={18}/>
            <span>{isArabic?"اتصال هاتفي مباشر":isHebrew?"חיוג ישיר עכשיו":"Direct Phone Call"}</span>
          </a>

          <a
            href="https://wa.me/972595422340?text=%D8%B7%D9%88%D8%A7%D8%B1%D8%A6%20SOS%20Jerusalem%20-%20%D8%A3%D8%AD%D8%AA%D8%A7%D8%AC%20%D9%85%D8%B3%D8%A7%D8%B9%D8%AF%D8%A9"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display:"flex",alignItems:"center",justifyContent:"center",gap:"10px",
              background:"#25D366",color:"#ffffff",borderRadius:"100px",padding:"14px",
              fontWeight:700,fontSize:"0.96rem",textDecoration:"none",
              boxShadow:"0 6px 20px rgba(37,211,102,0.3)"
            }}
          >
            <MessageCircle size={18}/>
            <span>{isArabic?"محادثة واتساب طوارئ":isHebrew?"וואטסאפ לחירום":"WhatsApp SOS Chat"}</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export function HotelsModal({open,onClose}:{open:boolean;onClose:()=>void}){
  const {locale}=useI18n();
  const isArabic=locale==="ar";
  const isHebrew=locale==="he";
  if(!open)return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position:"fixed",inset:0,background:"rgba(14,56,76,0.68)",backdropFilter:"blur(8px)",
        zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"
      }}
      onClick={onClose}
    >
      <div
        style={{
          background:"#ffffff",borderRadius:"24px",border:"2px solid rgba(245,166,35,0.45)",
          maxWidth:"520px",width:"100%",padding:"clamp(22px, 3.8vh, 32px)",
          boxShadow:"0 20px 60px rgba(14,56,76,0.18)",position:"relative"
        }}
        onClick={e=>e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position:"absolute",top:"14px",right:"14px",width:"34px",height:"34px",
            borderRadius:"50%",background:"#f8f6f0",border:"1px solid rgba(245,166,35,0.3)",
            display:"grid",placeItems:"center",cursor:"pointer",color:"#0e384c"
          }}
        >
          <X size={17}/>
        </button>

        <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"8px"}}>
          <div style={{background:"rgba(245,166,35,0.15)",color:"#f5a623",borderRadius:"12px",padding:"8px",display:"grid",placeItems:"center"}}>
            <Building size={24}/>
          </div>
          <div>
            <h2 style={{fontFamily:"'Georgia',serif",fontSize:"1.4rem",color:"#0e384c",margin:0}}>
              {isArabic?"فنادق القدس وحجز الإقامة":isHebrew?"מלונות ירושלים והזמנות":"Jerusalem Hotels & Booking"}
            </h2>
            <span style={{fontSize:"0.8rem",color:"#5a7585"}}>
              {isArabic?"فنادق البلدة القديمة ومحيطها":isHebrew?"מלונות בעיר העתיקה וסביבתה":"Old City & nearby accommodations"}
            </span>
          </div>
        </div>

        {/* 2 Primary Actions: Google Maps & Booking.com */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",margin:"18px 0"}}>
          <a
            href="https://www.google.com/maps/search/Hotels+near+Jerusalem+Old+City"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
              gap:"6px",background:"linear-gradient(135deg, #f5a623 0%, #ffba3b 100%)",
              color:"#0e384c",borderRadius:"16px",padding:"14px 10px",fontWeight:700,
              fontSize:"0.84rem",textDecoration:"none",textAlign:"center",
              boxShadow:"0 4px 14px rgba(245,166,35,0.3)"
            }}
          >
            <MapPin size={20}/>
            <span>{isArabic?"فنادق على خرائط جوجل":isHebrew?"מלונות בגוגל מפות":"Hotels on Google Maps"}</span>
            <small style={{fontSize:"0.72rem",fontWeight:500,opacity:0.85}}>
              {isArabic?"أقرب الفنادق لموقعك":isHebrew?"קרוב למיקומך":"Closest to Old City"}
            </small>
          </a>

          <a
            href="https://www.booking.com/searchresults.html?ss=Jerusalem"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
              gap:"6px",background:"#0e384c",color:"#ffffff",borderRadius:"16px",
              padding:"14px 10px",fontWeight:700,fontSize:"0.84rem",textDecoration:"none",textAlign:"center",
              boxShadow:"0 4px 14px rgba(14,56,76,0.2)"
            }}
          >
            <Hotel size={20} style={{color:"#f5a623"}}/>
            <span>{isArabic?"حجز عبر Booking.com":isHebrew?"הזמנה ב־Booking.com":"Book on Booking.com"}</span>
            <small style={{fontSize:"0.72rem",fontWeight:500,color:"#e1e9ed"}}>
              {isArabic?"أسعار وتوافر الغرف":isHebrew?"מחירים וזמינות":"Check Best Rates"}
            </small>
          </a>
        </div>

        {/* Featured Jerusalem Hotels */}
        <div style={{background:"#fbf9f4",border:"1px solid rgba(245,166,35,0.25)",borderRadius:"16px",padding:"14px"}}>
          <div style={{fontSize:"0.78rem",fontWeight:700,color:"#f5a623",textTransform:"uppercase",marginBottom:"8px"}}>
            {isArabic?"فنادق مقدسية مميزة وعريقة":isHebrew?"מלונות נבחרים בעיר":"Historic Jerusalem Stays"}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:"8px",fontSize:"0.82rem"}}>
            <a
              href="https://www.google.com/maps/search/The+American+Colony+Hotel+Jerusalem"
              target="_blank"
              rel="noopener noreferrer"
              style={{display:"flex",alignItems:"center",justifyContent:"space-between",color:"#0e384c",textDecoration:"none",padding:"6px 8px",borderRadius:"8px",background:"#ffffff",border:"1px solid rgba(14,56,76,0.08)"}}
            >
              <div>
                <strong>The American Colony Hotel</strong>
                <div style={{fontSize:"0.72rem",color:"#7a919f"}}>{isArabic?"فندق الأمريكان كولوني · الشيخ جراح":"Sheikh Jarrah heritage mansion"}</div>
              </div>
              <ExternalLink size={13} style={{color:"#f5a623"}}/>
            </a>

            <a
              href="https://www.google.com/maps/search/Hashimi+Hotel+Jerusalem"
              target="_blank"
              rel="noopener noreferrer"
              style={{display:"flex",alignItems:"center",justifyContent:"space-between",color:"#0e384c",textDecoration:"none",padding:"6px 8px",borderRadius:"8px",background:"#ffffff",border:"1px solid rgba(14,56,76,0.08)"}}
            >
              <div>
                <strong>Hashimi Hotel & Hostel</strong>
                <div style={{fontSize:"0.72rem",color:"#7a919f"}}>{isArabic?"فندق الهاشمي · سوق خان الزيت، البلدة القديمة":"Old City Souk overlooking Al-Aqsa"}</div>
              </div>
              <ExternalLink size={13} style={{color:"#f5a623"}}/>
            </a>

            <a
              href="https://www.google.com/maps/search/Golden+Walls+Hotel+Jerusalem"
              target="_blank"
              rel="noopener noreferrer"
              style={{display:"flex",alignItems:"center",justifyContent:"space-between",color:"#0e384c",textDecoration:"none",padding:"6px 8px",borderRadius:"8px",background:"#ffffff",border:"1px solid rgba(14,56,76,0.08)"}}
            >
              <div>
                <strong>Golden Walls Hotel</strong>
                <div style={{fontSize:"0.72rem",color:"#7a919f"}}>{isArabic?"فندق الأسوار الذهبية · مقابل باب العامود":"Opposite historic Damascus Gate"}</div>
              </div>
              <ExternalLink size={13} style={{color:"#f5a623"}}/>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Header(){
 const path=usePathname();const {user}=useApp();const {t,locale}=useI18n();const [open,setOpen]=useState(false);
 const [sosOpen,setSosOpen]=useState(false);
 const [hotelsOpen,setHotelsOpen]=useState(false);

 const isArabic=locale==="ar";
 const isHebrew=locale==="he";
 const isMinimal=path==="/"||path==="/start"||path==="/login";

 useEffect(()=>{if(!open)return;const onKeyDown=(event:KeyboardEvent)=>{if(event.key==="Escape")setOpen(false);};document.addEventListener("keydown",onKeyDown);return()=>document.removeEventListener("keydown",onKeyDown);},[open]);
 const links=[["/explore","nav.explore"],["/routes","nav.routes"]] as const;
 const mobileLinks=[["/explore","nav.explore",<MapIcon size={17} key="explore"/>],["/routes","nav.routes",<RouteIcon size={17} key="routes"/>]] as const;
 const isMobileActive=(href:string)=>path===href||path.startsWith(href+"/");

 return (
  <>
   <header className="site-header" style={{height:"64px",background:"#ffffff",borderBottom:"1px solid rgba(245,166,35,0.22)",boxShadow:"0 2px 14px rgba(14,56,76,0.04)",padding:"0 clamp(12px, 3vw, 24px)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
    <Link href="/" className="brand" aria-label={t("nav.home")} style={{color:"#0e384c",gap:"10px",fontSize:"20px",textDecoration:"none",display:"inline-flex",alignItems:"center"}}>
      <img src="/images/jeroam-logo.jpg" alt="Jeroam Logo" style={{height:"36px",width:"36px",borderRadius:"50%",objectFit:"cover",border:"2px solid #f5a623",boxShadow:"0 2px 8px rgba(245,166,35,0.3)"}}/>
      <span style={{fontWeight:800,fontFamily:"'Manrope',sans-serif",letterSpacing:"-0.5px",color:"#0e384c"}}>Jeroam</span>
      <span style={{fontSize:"11px",color:"#f5a623",fontWeight:700,background:"rgba(245,166,35,0.14)",padding:"2px 8px",borderRadius:"100px"}}>
        {isArabic?"القدس":isHebrew?"ירושלים":"Jerusalem"}
      </span>
    </Link>

    {!isMinimal && (
      <nav aria-label={t("nav.explore")} className={open?"open":""} style={{gap:"20px"}}>
        {links.map(([href,key])=><Link onClick={()=>setOpen(false)} style={{color:path===href||path.startsWith(href+"/")?"#f5a623":"#0e384c",fontWeight:path===href||path.startsWith(href+"/")?700:500,fontSize:"0.92rem",textDecoration:"none"}} className={path===href||path.startsWith(href+"/")?"active":""} href={href} key={href}>{t(key)}</Link>)}
      </nav>
    )}

    <div className="header-actions" style={{display:"flex",alignItems:"center",gap:"8px"}}>
      {/* AI Trip Planner Button */}
      <Link
        href="/onboarding"
        style={{
          display:"inline-flex",alignItems:"center",gap:"5px",
          background:"linear-gradient(135deg, #f5a623 0%, #ffba3b 100%)",
          borderRadius:"100px",padding:"5px 12px",fontSize:"0.78rem",fontWeight:700,
          color:"#0e384c",textDecoration:"none",boxShadow:"0 2px 8px rgba(245,166,35,0.25)"
        }}
      >
        <Sparkles size={13}/>
        <span>{isArabic?"تخطيط ذكي ✨":isHebrew?"תכנון AI ✨":"AI Planner ✨"}</span>
      </Link>

      {/* Nearby Hotels Button */}
      <button
        type="button"
        onClick={()=>setHotelsOpen(true)}
        aria-label="Hotels"
        style={{
          display:"inline-flex",alignItems:"center",gap:"5px",
          background:"#ffffff",border:"1.5px solid rgba(245,166,35,0.45)",
          borderRadius:"100px",padding:"5px 12px",fontSize:"0.78rem",fontWeight:700,
          color:"#0e384c",cursor:"pointer",boxShadow:"0 2px 6px rgba(14,56,76,0.04)"
        }}
      >
        <Building size={14} style={{color:"#f5a623"}}/>
        <span>{isArabic?"فنادق":isHebrew?"מלונות":"Hotels"}</span>
      </button>

      {/* Emergency SOS Button */}
      <button
        type="button"
        onClick={()=>setSosOpen(true)}
        aria-label="Emergency SOS"
        style={{
          display:"inline-flex",alignItems:"center",gap:"5px",
          background:"#fff1f1",border:"1.5px solid #ff4d4f",
          borderRadius:"100px",padding:"5px 12px",fontSize:"0.78rem",fontWeight:700,
          color:"#d9363e",cursor:"pointer",boxShadow:"0 2px 8px rgba(217,54,62,0.15)"
        }}
      >
        <AlertTriangle size={14}/>
        <span>{isArabic?"طوارئ":isHebrew?"חירום":"SOS"}</span>
      </button>

      {/* Persistent Language Switcher */}
      <LanguageSwitcher/>
    </div>
   </header>

   <EmergencyModal open={sosOpen} onClose={()=>setSosOpen(false)}/>
   <HotelsModal open={hotelsOpen} onClose={()=>setHotelsOpen(false)}/>

   {!isMinimal && (
     <nav className="mobile-bottom-nav" aria-label={t("nav.explore")}>
       {mobileLinks.map(([href,key,icon])=><Link href={href} key={href} aria-current={isMobileActive(href)?"page":undefined} className={isMobileActive(href)?"active":""}>{icon}<span>{t(key)}</span></Link>)}
     </nav>
   )}
  </>
 );
}

function FooterGroup({title,links}:{title:string;links:Array<{href:string;label:string}>}){return <section className="footer-group" aria-labelledby={`footer-${title.toLowerCase().replace(/\s+/g,"-")}`}><h2 id={`footer-${title.toLowerCase().replace(/\s+/g,"-")}`}>{title}</h2><ul>{links.map(link=><li key={link.href+link.label}><Link href={link.href}>{link.label}</Link></li>)}</ul></section>;}

export function Footer(){const {t}=useI18n();const groups=[
 {title:t("footer.jeroam"),links:[{href:"/about",label:t("footer.about")},{href:"/about#how-it-works",label:t("footer.howItWorks")},{href:"/sources",label:t("footer.methodology")}]},
 {title:t("footer.explore"),links:[{href:"/explore",label:t("footer.places")},{href:"/routes",label:t("footer.routes")},{href:"/my-trip",label:t("footer.myTrip")},{href:"/guide",label:t("footer.aiGuide")}]},
 {title:t("footer.information"),links:[{href:"/travel-information",label:t("footer.travelInformation")},{href:"/travel-information#accessibility",label:t("footer.accessibility")},{href:"/sources",label:t("footer.sourcesMethodology")}]},
 {title:t("footer.support"),links:[{href:"/contact",label:t("footer.contact")},{href:"/faq",label:t("footer.faq")},{href:"/report",label:t("footer.report")}]},
 {title:t("footer.legal"),links:[{href:"/terms",label:t("footer.terms")},{href:"/privacy",label:t("footer.privacy")},{href:"/cookies",label:t("footer.cookies")}]},
 ];return <footer className="site-footer"><div className="footer-main"><div className="footer-brand-col"><Link href="/" className="brand" aria-label={t("nav.home")} style={{display:"inline-flex",alignItems:"center",gap:"8px"}}><img src="/images/jeroam-logo.jpg" alt="Jeroam Logo" style={{height:"28px",width:"28px",borderRadius:"50%",objectFit:"cover",border:"1.5px solid #f5a623"}}/>jeroam<span>®</span></Link><p>{t("footer.description")}</p><Link className="footer-method-link" href="/sources">{t("footer.sourcePromise")} <ArrowUpRight size={14}/></Link></div><nav className="footer-nav-grid" aria-label={t("footer.navigation")}>{groups.map(group=><FooterGroup key={group.title} {...group}/>)}</nav></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Jeroam · {t("footer.copyright")}</span><div className="footer-bottom-links"><Link href="/credits">{t("footer.credits")}</Link><Link href="/setup">{t("footer.setup")}</Link></div><div className="footer-controls"><ThemeSwitcher/><LanguageSwitcher/></div></div></footer>;}

export function Notices(){const {error,notice,retry,report,notify}=useApp();const {t}=useI18n();return <>{error&&<div key={error} className="global-notice error" role="alert"><span>{error}</span><button onClick={()=>{report("");retry();}}>{t("common.retry")}</button><button aria-label={t("common.close")} onClick={()=>report("")}><X size={16}/></button></div>}{notice&&<div key={notice} className="global-notice success" role="status"><span>{notice.startsWith("notice.")?t(notice):notice}</span><button aria-label={t("common.close")} onClick={()=>notify("")}><X size={16}/></button></div>}</>;}

export function PhotoCredit({photo}:{photo:Photo}){const {t}=useI18n();return <span className="image-credit"><a href={photo.sourceUrl} target="_blank" rel="noreferrer">{photo.author}</a> · <a href={photo.licenseUrl} target="_blank" rel="noreferrer">{photo.license}</a><span> · {t("common.cropped")}</span></span>;}

export function SaveButton({id,kind="place",compact=false}:{id:string;kind?:"place"|"route";compact?:boolean}){
 const {user,saveItem,savedPlaces,savedRoutes,report}=useApp();const {t}=useI18n();const router=useRouter();const [busy,setBusy]=useState(false);const saved=(kind==="place"?savedPlaces:savedRoutes).includes(id);const noun=kind==="place"?t("common.place"):t("common.route");
 async function save(){if(!user){router.push("/login?next="+encodeURIComponent((kind==="place"?"/places/":"/routes/")+id));return;}setBusy(true);try{await saveItem(kind,id);}catch(e){report((e as Error).message);}finally{setBusy(false);}}
 return <button className={(compact?"save-icon":"button secondary")+" save-button"+(saved?" is-saved":"")+(busy?" is-busy":"")} aria-label={saved?t("common.unsave",{kind:noun}):t("common.save",{kind:noun})} aria-pressed={saved} disabled={busy} onClick={()=>void save()}>{saved?<Check size={18}/>:<Bookmark size={18}/>} {!compact&&(busy?t("common.saving"):saved?t("common.saved"):t("common.save",{kind:noun}))}</button>;
}

/** Add a catalog place or route to the first day of the visitor's local trip.
 * This keeps discovery actions connected to the same itinerary state used by
 * My Trip and the Guide, while remaining usable before an account exists. */
export function AddToTripButton({id,kind="place",compact=false}:{id:string;kind?:"place"|"route";compact?:boolean}){
 const {catalog,trip,preferences,updateTrip,notify}=useApp();const {t}=useI18n();const router=useRouter();
 function add(){
  if(!trip){router.push("/onboarding?next=/my-trip");return;}
  const day=trip.days[0];if(!day){router.push("/onboarding?next=/my-trip");return;}
  const route=kind==="route"?catalog.routes.find(item=>item.id===id):undefined;
  const ids=kind==="route"?(route?.stopIds??[]):[id];
  const existing=new Set(trip.days.flatMap(item=>item.items.map(entry=>entry.placeId)));
  const newIds=ids.filter(placeId=>!existing.has(placeId));
  if(!newIds.length){notify(kind==="route"?"notice.routeAlreadyInTrip":"notice.alreadyInTrip");return;}
  const p=preferences??defaultPreferences;
  const items=scheduleItems(day.items.map(item=>item.placeId).concat(newIds),catalog,p,{},"manual");
  updateTrip({...trip,mode:"manual",days:trip.days.map(item=>item.day===day.day?{...item,items}:item)});
  notify(kind==="route"?"notice.routeAddedToTrip":"notice.placeAddedToTrip");
 }
 const label=kind==="route"?t("common.addRouteToTrip"):t("common.addPlaceToTrip");
 return <button type="button" className={`trip-add-button${compact?" compact":""}`} onClick={add}><Plus size={compact?14:16}/><span>{label}</span></button>;
}

/** A single trust vocabulary used across cards, stories and the guide. */
export type TrustTone="verified"|"ai"|"demo";
export function TrustBadge({tone="verified",children}:{tone?:TrustTone;children?:ReactNode}){
 const {t}=useI18n();
 const label=children??(tone==="verified"?t("common.verifiedFact"):tone==="ai"?t("common.aiGenerated"):t("common.userDemo"));
 const icon=tone==="verified"?<ShieldCheck size={13}/>:tone==="ai"?<Sparkles size={13}/>:<Compass size={13}/>;
 return <span className={`badge ${tone}`}>{icon}{label}</span>;
}

export function PlaceCard({place}:{place:Place}){
 const {catalog}=useApp();const {t,locale}=useI18n();const photo=place.imageId?catalog.images[place.imageId]:null;const rawPrice=priceLabel(place);const price=rawPrice==="Price not verified"?t("common.priceNotVerified"):rawPrice==="Free entry listed"?t("common.freeEntry"):rawPrice;const displayName=displayPlaceName(place,locale);const area=t(`area.${place.area}`);
 return <article className={"place-card"+(!photo?" no-photo":"")}><div className="place-card-image"><Link href={`/places/${place.id}`} tabIndex={-1} aria-hidden="true">{photo?<img src={photo.path} alt={displayName} loading="lazy"/>:<div className="place-card-symbol"><MapPin size={30}/><span>{area}</span></div>}</Link><span className="photo-label">{t(`category.${place.category}`)}</span><SaveButton id={place.id} compact/></div><div className="place-card-body"><div className="card-location"><MapPin size={12}/>{area}</div><Link href={`/places/${place.id}`}><h3>{displayName}<ArrowUpRight size={18}/></h3></Link><p>{placeSummary(place,locale)}</p><div className="card-meta"><span><Clock size={14}/>{formatMinutes(place.visitMinutes,locale)} {t("common.suggested")}</span><span>{price}</span></div><SourceDisclosure ids={place.sourceIds}/></div></article>;
}

export function RouteCard({route}:{route:CulturalRoute}){const {catalog}=useApp();const {t,locale}=useI18n();const photo=routeImage(route,catalog);const title=displayRouteTitle(route,locale);return <article className="route-card"><Link href={`/routes/${route.id}`} className="route-image">{photo?<img src={photo.path} alt={title} loading="lazy"/>:<div className="route-image-placeholder"><Compass size={30}/><span>{t("common.imageUnavailable")}</span></div>}<span>{t(`theme.${route.theme}`)}</span></Link><div className="route-card-body"><div className="card-location">{route.stopIds.length} {t("common.stops")} · {formatMinutes(route.durationMinutes,locale)} {t("common.suggested")} · {route.distanceKm==null?t("common.distanceUnavailable"):formatDistanceKm(route.distanceKm,locale)}</div><Link href={`/routes/${route.id}`}><h3>{title}<ArrowUpRight size={20}/></h3></Link><p>{routeDescription(route,locale)}</p><div className="card-meta"><span>{t(`difficulty.${route.difficulty}`)} · {t("common.walking")}</span><SaveButton id={route.id} kind="route" compact/></div><SourceDisclosure ids={route.sourceIds}/></div></article>;}

export function SourceLinks({ids}:{ids:string[]}){const {catalog}=useApp();const {locale,t}=useI18n();const language=localeConfig[locale??"en"].htmlLang;return <span className="source-links">{ids.map(id=>{const source=catalog.sources.find(s=>s.id===id);if(!source)return null;const date=source.lastVerifiedAt??source.accessedAt;const formatted=(()=>{const parsed=new Date(date);return Number.isNaN(parsed.getTime())?date:new Intl.DateTimeFormat(language,{year:"numeric",month:"short",day:"numeric"}).format(parsed);})();return <a key={id} href={source.url} target="_blank" rel="noreferrer" aria-label={`${source.publisher} · ${t("common.lastVerified")} ${formatted}`}><span>{source.publisher}</span><small>{t("common.lastVerified")} {formatted}</small><ArrowUpRight size={12}/></a>;})}</span>;}
export function SourceDisclosure({ids}:{ids:string[]}){const {t}=useI18n();if(!ids.length)return null;return <details className="source-disclosure"><summary><TrustBadge/><span>{t("common.showSources")}</span><ChevronRight size={14}/></summary><SourceLinks ids={ids}/></details>;}
export function Fact({claim}:{claim:Claim}){const {locale}=useI18n();return <div className="fact"><TrustBadge/><p>{claimText(claim,locale)}</p><SourceLinks ids={claim.sourceIds}/></div>;}
export function Empty({title,children}:{title:string;children:React.ReactNode}){return <div className="empty-state"><Compass size={38}/><h3>{title}</h3>{children}</div>;}
export function PageHeading({eyebrow,title,description,children}:{eyebrow:string;title:string;description?:string;children?:React.ReactNode}){return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{description&&<p>{description}</p>}</div>{children}</div>;}
export function AiUnavailable(){const {t}=useI18n();return <div className="service-note"><Sparkles size={20}/><div><strong>{t("common.localGuideDemo")}</strong><p>{t("common.aiDemoCopy")}</p><Link href="/setup">{t("common.setupDetails")} <ArrowUpRight size={13}/></Link></div></div>;}


