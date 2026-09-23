"use client";
import {useMemo,useState,type FormEvent} from "react";
import Link from "next/link";
import {useSearchParams} from "next/navigation";
import {ArrowUpRight,ArrowRight,Mail,LockKeyhole,UserRound,LogOut,Bookmark,Compass,Route as RouteIcon} from "lucide-react";
import {useApp} from "./provider";
import {useI18n} from "./i18n";
import {Empty,PageHeading,PlaceCard,RouteCard} from "./shared";
import {PreferencesPanel} from "./preferences";
function returnPath(value:string|null){return value&&/^\/(explore|routes|places|my-trip|guide|profile|onboarding)(\/|$)/.test(value)&&!value.includes("\\")?value:"/my-trip";}
export function Login(){
 const {user,trip,preferences,persistTrip,savePreferences}=useApp();
 const {t,locale}=useI18n();
 const params=useSearchParams();
 const [mode,setMode]=useState<"login"|"signup">("login");
 const [showForm,setShowForm]=useState(false);
 const [email,setEmail]=useState("");
 const [password,setPassword]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");

 const isArabic=locale==="ar";
 const isHebrew=locale==="he";

 async function submit(e:FormEvent){
   e.preventDefault();
   setBusy(true);
   setError("");
   if(password.length<8){
     setError(t("common.useEight"));
     setBusy(false);
     return;
   }
   window.setTimeout(()=>{
     localStorage.setItem("jeroam-user",JSON.stringify({id:"local-demo-user",email:email.trim().toLowerCase()}));
     window.location.assign("/explore");
     setBusy(false);
   },260);
 }

 return (
   <main
     style={{
       minHeight:"calc(100vh - 64px)",
       display:"flex",
       alignItems:"center",
       justifyContent:"center",
       background:"linear-gradient(135deg, #ffffff 0%, #faf8f2 50%, #f7f2e6 100%)",
       padding:"clamp(14px, 2.5vh, 24px)",
       fontFamily:"'Inter', sans-serif",
     }}
   >
     <section
       style={{
         maxWidth:"440px",
         width:"100%",
         background:"#ffffff",
         border:"2px solid rgba(245,166,35,0.35)",
         borderRadius:"28px",
         boxShadow:"0 20px 60px rgba(14,56,76,0.09)",
         padding:"clamp(26px, 4.5vh, 40px) clamp(20px, 4vw, 32px)",
         textAlign:"center",
       }}
     >
       <img
         src="/images/jeroam-logo.jpg"
         alt="Jeroam Logo"
         style={{
           width:"82px",
           height:"82px",
           borderRadius:"50%",
           objectFit:"cover",
           border:"3px solid #f5a623",
           boxShadow:"0 6px 20px rgba(245,166,35,0.3)",
           marginBottom:"12px",
           display:"inline-block",
         }}
       />

       <div style={{fontFamily:"'Manrope', sans-serif",fontSize:"1.35rem",fontWeight:800,color:"#0e384c",marginBottom:"4px"}}>
         Jeroam <span style={{color:"#f5a623",fontSize:"0.95rem",fontWeight:700}}>
           {isArabic ? "القدس" : isHebrew ? "ירושלים" : "Jerusalem"}
         </span>
       </div>

       <h1 style={{fontFamily:"'Georgia', serif",fontSize:"1.45rem",fontWeight:400,color:"#0e384c",margin:"0 0 8px 0"}}>
         {user
           ? (isArabic ? "أهلاً بك مجدداً" : isHebrew ? "ברוכים השבים" : "Welcome Back")
           : (isArabic ? "تسجيل الدخول أو المتابعة" : isHebrew ? "כניסה או המשך" : "Sign In or Continue")}
       </h1>

       <p style={{fontSize:"0.88rem",color:"#5a7585",lineHeight:1.6,margin:"0 auto 22px auto",maxWidth:"340px"}}>
         {user
           ? user.email
           : (isArabic
               ? "احفظ مزاراتك المفضلة وتجول في أزقة القدس الشريف."
               : isHebrew
               ? "שמרו את המקומות המועדפים עליכם וטיילו בסמטאות ירושלים."
               : "Save your favorite places and explore the historic alleys of Jerusalem.")}
       </p>

       {user ? (
         <Link
           href="/explore"
           style={{
             display:"inline-flex",
             alignItems:"center",
             justifyContent:"center",
             gap:"8px",
             width:"100%",
             padding:"14px",
             background:"linear-gradient(135deg, #f5a623 0%, #ffba3b 100%)",
             color:"#0e384c",
             borderRadius:"100px",
             fontWeight:700,
             textDecoration:"none",
             boxShadow:"0 8px 24px rgba(245,166,35,0.35)",
           }}
         >
           <span>{isArabic ? "متابعة الرحلة" : isHebrew ? "המשך בסיור" : "Continue Journey"}</span>
           <ArrowRight size={18} />
         </Link>
       ) : (
         <>
           {/* Button 1: Continue as Guest */}
           <Link
             href="/explore"
             id="login-guest-btn"
             style={{
               display:"inline-flex",
               alignItems:"center",
               justifyContent:"center",
               gap:"8px",
               width:"100%",
               padding:"14px",
               background:"linear-gradient(135deg, #f5a623 0%, #ffba3b 100%)",
               color:"#0e384c",
               borderRadius:"100px",
               fontWeight:700,
               textDecoration:"none",
               boxShadow:"0 8px 24px rgba(245,166,35,0.35)",
               marginBottom:"12px",
               fontSize:"0.95rem",
               cursor:"pointer",
             }}
           >
             <span>{isArabic ? "المتابعة كزائر" : isHebrew ? "המשך כאורח" : "Continue as Guest"}</span>
             <ArrowRight size={18} />
           </Link>

           {/* Button 2: Toggle Email Form */}
           {!showForm ? (
             <button
               type="button"
               onClick={()=>setShowForm(true)}
               style={{
                 background:"none",
                 border:"1px solid rgba(14,56,76,0.18)",
                 borderRadius:"100px",
                 padding:"11px",
                 width:"100%",
                 color:"#0e384c",
                 fontSize:"0.84rem",
                 fontWeight:600,
                 cursor:"pointer",
               }}
             >
               {isArabic ? "تسجيل دخول بالبريد الإلكتروني" : isHebrew ? "כניסה באמצעות אימייל" : "Sign in with Email"}
             </button>
           ) : (
             <form onSubmit={submit} style={{textAlign:"left",marginTop:"12px"}}>
               <div style={{marginBottom:"10px"}}>
                 <label style={{fontSize:"0.78rem",fontWeight:600,color:"#0e384c",display:"block",marginBottom:"4px"}}>
                   البريد الإلكتروني
                 </label>
                 <input
                   type="email"
                   required
                   value={email}
                   onChange={e=>setEmail(e.target.value)}
                   placeholder="your@email.com"
                   style={{
                     width:"100%",
                     padding:"10px 14px",
                     border:"1px solid rgba(245,166,35,0.4)",
                     borderRadius:"8px",
                     fontSize:"0.88rem",
                     outline:"none",
                     background:"#fcfbf9",
                     color:"#0e384c",
                   }}
                 />
               </div>
               <div style={{marginBottom:"14px"}}>
                 <label style={{fontSize:"0.78rem",fontWeight:600,color:"#0e384c",display:"block",marginBottom:"4px"}}>
                   كلمة المرور
                 </label>
                 <input
                   type="password"
                   required
                   minLength={8}
                   value={password}
                   onChange={e=>setPassword(e.target.value)}
                   placeholder="••••••••"
                   style={{
                     width:"100%",
                     padding:"10px 14px",
                     border:"1px solid rgba(245,166,35,0.4)",
                     borderRadius:"8px",
                     fontSize:"0.88rem",
                     outline:"none",
                     background:"#fcfbf9",
                     color:"#0e384c",
                   }}
                 />
               </div>
               <button
                 type="submit"
                 disabled={busy}
                 style={{
                   width:"100%",
                   padding:"12px",
                   background:"#0e384c",
                   color:"#ffffff",
                   border:"none",
                   borderRadius:"100px",
                   fontWeight:700,
                   fontSize:"0.9rem",
                   cursor:"pointer",
                 }}
               >
                 {busy ? "جاري الدخول..." : "تسجيل الدخول"}
               </button>
             </form>
           )}
         </>
       )}

       {error && <p style={{color:"#d9534f",fontSize:"0.82rem",marginTop:"12px"}} role="alert">{error}</p>}
       {message && <p style={{color:"#28a745",fontSize:"0.82rem",marginTop:"12px"}} role="status">{message}</p>}
     </section>
   </main>
 );
}
export function Profile(){

 const {user,ready,savedPlaces,savedRoutes,catalog,logout,report}=useApp();const {t}=useI18n();const [busy,setBusy]=useState(false);
 async function signout(){setBusy(true);try{await logout();}catch(e){report((e as Error).message);}finally{setBusy(false);}}
 return <main className="page-wrap"><PageHeading eyebrow={t("common.yourJourney")} title={t("common.aLittleMore")} description={user?user.email:t("common.keepCurious")}>{user?<button className="button secondary" onClick={()=>void signout()} disabled={busy}><LogOut size={16}/>{busy?t("common.signingOut"):t("common.signOut")}</button>:<Link className="button secondary" href="/login?next=/profile">{t("common.signInSave")} <ArrowUpRight size={16}/></Link>}</PageHeading>{!ready?<div className="loading-row"><span className="spinner"/>{t("common.loading")}</div>:<><PreferencesPanel/><section className="related"><div className="section-heading"><h2><Bookmark size={25}/> {t("common.savedPlaces")}</h2><span>{t("common.savedCount",{count:savedPlaces.length})}</span></div>{savedPlaces.length?<div className="place-grid">{catalog.places.filter(p=>savedPlaces.includes(p.id)).map(p=><PlaceCard place={p} key={p.id}/>)}</div>:<Empty title={t("common.keepCurious")}><p>{t("common.bookmarkSave")}</p><Link href="/explore" className="text-link">{t("common.explorePlaces")} <ArrowUpRight size={16}/></Link></Empty>}</section><section className="related"><div className="section-heading"><h2>{t("common.savedRoutes")}</h2><span>{t("common.savedCount",{count:savedRoutes.length})}</span></div>{savedRoutes.length?<div className="route-grid">{catalog.routes.filter(r=>savedRoutes.includes(r.id)).map(r=><RouteCard route={r} key={r.id}/>)}</div>:<Empty title={t("common.storyReturn")}><p>{t("common.saveRouteDetail")}</p><Link href="/routes" className="text-link">{t("common.browseWalking")} <ArrowUpRight size={16}/></Link></Empty>}</section></>}</main>;
}

export function Saved(){
 const {ready,savedPlaces,savedRoutes,catalog}=useApp(); const {t}=useI18n();
 const placePicks=useMemo(()=>{const ids=["tower-of-david","mahane-yehuda","shrine-of-book","montefiore-windmill","jaffa-gate"];return ids.map(id=>catalog.places.find(place=>place.id===id)).filter((place):place is NonNullable<typeof place>=>Boolean(place)&&!savedPlaces.includes(place!.id)).slice(0,3);},[catalog.places,savedPlaces]);
 const routePicks=useMemo(()=>{const ids=["old-city-in-layers","gates-and-streets","beyond-the-walls"];return ids.map(id=>catalog.routes.find(route=>route.id===id)).filter((route):route is NonNullable<typeof route>=>Boolean(route)&&!savedRoutes.includes(route!.id)).slice(0,2);},[catalog.routes,savedRoutes]);
 return <main className="page-wrap saved-page"><PageHeading eyebrow={t("common.collection")} title={t("common.savedLater")} description={t("common.keepStories")}><Link className="button secondary" href="/explore">{t("common.explorePlaces")} <ArrowUpRight size={16}/></Link></PageHeading>{!ready?<div className="loading-row"><span className="spinner"/>{t("common.loading")}</div>:<><section className="saved-overview"><div><span className="eyebrow">{t("common.collection")}</span><h2>{t("common.keepDay")}</h2><p>{t("common.bookmarkSave")}</p></div><div className="saved-counts"><div><strong>{savedPlaces.length}</strong><span>{t("common.savedPlaces")}</span></div><div><strong>{savedRoutes.length}</strong><span>{t("common.savedRoutes")}</span></div></div></section><section className="saved-section"><div className="section-heading"><div><span className="eyebrow">{t("common.savedPlaces")}</span><h2>{t("common.keepCurious")}</h2></div><span>{t("common.savedCount",{count:savedPlaces.length})}</span></div>{savedPlaces.length?<div className="place-grid">{catalog.places.filter(place=>savedPlaces.includes(place.id)).map(place=><PlaceCard place={place} key={place.id}/>)}</div>:<><Empty title={t("common.noSavedPlaces")}><p>{t("common.bookmarkSave")}</p><Link href="/explore" className="text-link">{t("common.explorePlaces")} <ArrowUpRight size={16}/></Link></Empty>{placePicks.length>0&&<div className="saved-recommendations"><div className="saved-recommendations-heading"><div><span className="eyebrow"><Compass size={13}/> {t("common.keepCurious")}</span><h3>{t("common.explorePlaces")}</h3></div><Link href="/explore" className="text-link">{t("common.allPlaces")} <ArrowUpRight size={14}/></Link></div><div className="place-grid">{placePicks.map(place=><PlaceCard place={place} key={place.id}/>)}</div></div>}</>}</section><section className="saved-section"><div className="section-heading"><div><span className="eyebrow">{t("common.savedRoutes")}</span><h2>{t("common.storyReturn")}</h2></div><span>{t("common.savedCount",{count:savedRoutes.length})}</span></div>{savedRoutes.length?<div className="route-grid">{catalog.routes.filter(route=>savedRoutes.includes(route.id)).map(route=><RouteCard route={route} key={route.id}/>)}</div>:<><Empty title={t("common.noSavedRoutes")}><p>{t("common.saveRouteDetail")}</p><Link href="/routes" className="text-link">{t("common.browseWalking")} <ArrowUpRight size={16}/></Link></Empty>{routePicks.length>0&&<div className="saved-recommendations"><div className="saved-recommendations-heading"><div><span className="eyebrow"><RouteIcon size={13}/> {t("common.walkingRoutes")}</span><h3>{t("common.followThread")}</h3></div><Link href="/routes" className="text-link">{t("common.allRoutes")} <ArrowUpRight size={14}/></Link></div><div className="route-grid">{routePicks.map(route=><RouteCard route={route} key={route.id}/>)}</div></div>}</>}</section></>}</main>;
}







