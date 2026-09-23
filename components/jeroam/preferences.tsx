"use client";

import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {ArrowRight,ArrowUpRight,Check,Compass,Footprints,Heart,Settings2,ShieldCheck,TrainFront,Users} from "lucide-react";
import {useApp} from "./provider";
import {LanguageSwitcher,localizedLanguageName,localizedTripTitle,useI18n} from "./i18n";
import {ThemeSwitcher,useTheme} from "./theme";
import {defaultPreferences,pacePreferences,type AccessibilityPreference,type PacePreference,type Preferences,type TransportPreference,accessibilityPreferences,transportPreferences} from "@/lib/contracts";
import {displayPlaceName,displayRouteTitle,formatMinutes} from "@/lib/catalog";

const transportLabels:Record<TransportPreference,string>={Walking:"preferences.walking", "Public transport":"preferences.transit", "Taxi / rideshare":"preferences.taxi", Mixed:"preferences.mixed"};
const accessibilityLabels:Record<AccessibilityPreference,string>={"step-free":"preferences.stepFree","shorter-visits":"preferences.shorterVisits","rest-breaks":"preferences.restBreaks","quiet-spaces":"preferences.quietSpaces"};
const paceLabels:Record<PacePreference,string>={Relaxed:"preferences.relaxed",Balanced:"preferences.balanced","Full days":"preferences.fullDays"};

export function PreferencesPanel(){
 const {catalog,preferences,trip,ready,recentPlaces,recentRoutes,savePreferences,report}=useApp();
 const {t,locale}=useI18n(); const {theme}=useTheme();
 const [draft,setDraft]=useState<Preferences>(preferences??defaultPreferences); const [busy,setBusy]=useState(false);
 useEffect(()=>{if(!ready)return;const timer=window.setTimeout(()=>setDraft(preferences??defaultPreferences),0);return()=>window.clearTimeout(timer);},[ready,preferences]);
 const recentPlaceItems=useMemo(()=>recentPlaces.map(id=>catalog.places.find(place=>place.id===id)).filter((place):place is typeof catalog.places[number]=>Boolean(place)),[catalog,recentPlaces]);
 const recentRouteItems=useMemo(()=>recentRoutes.map(id=>catalog.routes.find(route=>route.id===id)).filter((route):route is typeof catalog.routes[number]=>Boolean(route)),[catalog,recentRoutes]);
 function setTransport(value:TransportPreference){setDraft(current=>({...current,transportPreference:value}));}
 function setPace(value:PacePreference){setDraft(current=>({...current,pacePreference:value}));}
 function toggleAccessibility(value:AccessibilityPreference){setDraft(current=>({...current,accessibility:current.accessibility.includes(value)?current.accessibility.filter(item=>item!==value):[...current.accessibility,value]}));}
 async function submit(){setBusy(true);try{await savePreferences(draft);}catch(error){report((error as Error).message);}finally{setBusy(false);}}
 if(!ready)return <div className="loading-row"><span className="spinner"/>{t("common.loading")}</div>;
 return <section className="preferences-page" aria-label={t("preferences.travelProfile")}>
  <div className="preferences-intro"><div><span className="eyebrow">{t("preferences.eyebrow")}</span><h2>{t("preferences.title")}</h2><p>{t("preferences.subtitle")}</p></div><div className="preferences-local-note"><ShieldCheck size={16}/><div><strong>{t("preferences.localOnly")}</strong><span>{t("preferences.localOnlyCopy")}</span></div></div></div>
  <div className="preferences-layout">
   <div className="preferences-main">
    <section className="preferences-card"><div className="preferences-card-heading"><span className="preferences-icon"><Footprints size={18}/></span><div><h3>{t("preferences.transport")}</h3><p>{t("preferences.transportCopy")}</p></div></div><div className="preferences-choice-grid" role="radiogroup" aria-label={t("preferences.transport")}>{transportPreferences.map(value=><button type="button" key={value} role="radio" aria-checked={draft.transportPreference===value} className={draft.transportPreference===value?"selected":""} onClick={()=>setTransport(value)}><span className="preferences-choice-symbol">{value==="Walking"?<Footprints size={17}/>:value==="Public transport"?<TrainFront size={17}/>:value==="Mixed"?<Compass size={17}/>:<Users size={17}/>}</span><span>{t(transportLabels[value])}</span>{draft.transportPreference===value&&<Check size={15}/>}</button>)}</div></section>
    <section className="preferences-card"><div className="preferences-card-heading"><span className="preferences-icon"><Heart size={18}/></span><div><h3>{t("preferences.accessibility")}</h3><p>{t("preferences.accessibilityCopy")}</p></div></div><div className="preferences-chip-grid">{accessibilityPreferences.map(value=><button type="button" key={value} className={draft.accessibility.includes(value)?"selected":""} aria-pressed={draft.accessibility.includes(value)} onClick={()=>toggleAccessibility(value)}>{draft.accessibility.includes(value)&&<Check size={14}/>} {t(accessibilityLabels[value])}</button>)}</div></section>
    <section className="preferences-card preferences-summary-card"><div className="preferences-card-heading"><span className="preferences-icon"><Settings2 size={18}/></span><div><h3>{t("preferences.travelProfile")}</h3><p>{t("preferences.transparent")}</p></div></div>{preferences?<><div className="preferences-pace-control"><span className="preferences-control-label">{t("preferences.pace")}</span><div className="preferences-pace-grid" role="radiogroup" aria-label={t("preferences.pace")}>{pacePreferences.map(value=><button type="button" role="radio" aria-checked={draft.pacePreference===value} className={draft.pacePreference===value?"selected":""} onClick={()=>setPace(value)} key={value}>{t(paceLabels[value])}</button>)}</div></div><dl className="preferences-summary-list"><div><dt>{t("preferences.interests")}</dt><dd>{draft.interests.map(item=>t(`interest.${item}`)).join(" · ")}</dd></div><div><dt>{t("preferences.tripStyle")}</dt><dd>{t(`style.${draft.travelStyle}`)}</dd></div><div><dt>{t("preferences.budget")}</dt><dd>₪{new Intl.NumberFormat(locale?locale:"en").format(draft.budget)} {t("common.perPerson")}</dd></div><div><dt>{t("preferences.language")}</dt><dd>{localizedLanguageName(draft.language,locale)}</dd></div></dl><Link href="/onboarding?edit=1" className="text-link">{t("preferences.editCore")} <ArrowUpRight size={14}/></Link></>:<div className="preferences-empty"><p>{t("preferences.editCoreCopy")}</p><Link href="/onboarding" className="button secondary">{t("preferences.startPlanning")} <ArrowRight size={15}/></Link></div>}</section>
    <button type="button" className="button preferences-save" disabled={busy||!preferences} onClick={()=>void submit()}>{busy?t("common.saving"):t("preferences.save")} <Check size={16}/></button>
    <p className="preferences-privacy"><ShieldCheck size={14}/>{t("preferences.noPersonalData")}</p>
   </div>
   <aside className="preferences-side">
    <section className="preferences-side-card"><span className="eyebrow">{t("preferences.language")}</span><div className="preferences-side-control"><LanguageSwitcher/></div><span className="eyebrow">{t("preferences.theme")}</span><div className="preferences-side-control"><ThemeSwitcher/></div><small>{theme==="dark"?t("theme.dark"):t("theme.light")}</small></section>
    <section className="preferences-side-card"><div className="preferences-side-heading"><span className="eyebrow">{t("preferences.currentTrip")}</span><Compass size={16}/></div>{trip?<><strong>{localizedTripTitle(trip.title,locale)}</strong><p>{trip.days.length} {trip.days.length===1?t("common.day"):t("common.days")} · {trip.days.reduce((sum,day)=>sum+day.items.length,0)} {t("common.places")}</p><Link href="/my-trip" className="text-link">{t("preferences.openTrip")} <ArrowUpRight size={14}/></Link></>:<><p>{t("preferences.noTrip")}</p><Link href="/onboarding" className="text-link">{t("preferences.startPlanning")} <ArrowUpRight size={14}/></Link></>}</section>
    <section className="preferences-side-card"><div className="preferences-side-heading"><span className="eyebrow">{t("preferences.recentlyViewed")}</span><Compass size={16}/></div>{recentPlaceItems.length||recentRouteItems.length?<div className="preferences-recent-list">{recentPlaceItems.slice(0,3).map(place=><Link key={place.id} href={`/places/${place.id}`}><span>{displayPlaceName(place,locale)}</span><small>{formatMinutes(place.visitMinutes,locale)}</small><ArrowUpRight size={13}/></Link>)}{recentRouteItems.slice(0,3).map(route=><Link key={route.id} href={`/routes/${route.id}`}><span>{displayRouteTitle(route,locale)}</span><small>{formatMinutes(route.durationMinutes,locale)}</small><ArrowUpRight size={13}/></Link>)}</div>:<p>{t("preferences.noRecent")}</p>}</section>
   </aside>
  </div>
 </section>;
}
