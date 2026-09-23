"use client";

import {useEffect,useMemo,useRef,useState,type FormEvent} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {ArrowRight,ArrowUpRight,BookOpen,ChevronRight,Clock3,Compass,ExternalLink,MapPin,Mic,RefreshCw,Route as RouteIcon,Send,ShieldCheck,Sparkles,UsersRound} from "lucide-react";
import {useApp} from "./provider";
import {localeConfig,useI18n} from "./i18n";
import {Fact,SourceDisclosure} from "./shared";
import {PlaceMap} from "./map";
import {defaultPreferences} from "@/lib/contracts";
import {scheduleItems} from "@/lib/planner";
import {buildAIClientContext} from "@/lib/ai/context";
import {AIServiceError,getAIAvailability,requestAI} from "@/lib/ai/client";
import type {AIAction,AIAvailability,AIMessage,AIResponse} from "@/lib/ai/types";
import type {Place} from "@/lib/contracts";
import {displayPlaceName,displayRouteTitle,formatDistanceKm,formatMinutes,placeFacts,placeSummary,routeDescription} from "@/lib/catalog";

type GuideTurn={id:string;question:string;response:AIResponse};
type ConnectionState="checking"|"ready"|"not-configured"|"error";

const promptDefinitions=[
 {id:"short",questionKey:"common.twoHours",hintKey:"common.promptShortHint",icon:Clock3},
 {id:"story",questionKey:"common.storyBehind",hintKey:"common.promptStoryHint",icon:BookOpen},
 {id:"nearby",questionKey:"common.whatsNearby",hintKey:"common.promptNearbyHint",icon:MapPin},
 {id:"family",questionKey:"common.family",hintKey:"common.promptFamilyHint",icon:UsersRound},
 {id:"hidden",questionKey:"common.hidden",hintKey:"common.promptHiddenHint",icon:Sparkles}
] as const;

function formatDuration(minutes:number|null|undefined,locale:string|null|undefined){return minutes?formatMinutes(minutes,locale):null;}
function formatDistance(distance:number,locale:string|null|undefined){return formatDistanceKm(distance,locale);}

function connectionLabel(state:ConnectionState,t:(key:string)=>string){
 if(state==="checking")return t("common.aiChecking");
 if(state==="ready")return t("common.aiConnected");
 if(state==="error")return t("common.aiUnavailable");
 return t("common.aiNotConnected");
}

function actionLabel(action:AIAction,t:(key:string)=>string){
 if(action.type==="add-place")return t("common.addPlaceToTrip");
 if(action.type==="add-route")return t("common.addRouteToTrip");
 if(action.type==="save-place"||action.type==="save-route")return t("common.saveToCollection");
 return t("common.startRoute");
}

function ReferencePlace({placeId,reason,onAdd,onSave}:{placeId:string;reason?:string;onAdd?:((id:string)=>void);onSave?:((id:string)=>void)}){
 const {catalog}=useApp(); const {t,locale}=useI18n(); const place=catalog.places.find(item=>item.id===placeId); if(!place)return null; const displayName=displayPlaceName(place,locale);
 const photo=place.imageId?catalog.images[place.imageId]:null;
 return <article className="ai-reference-card"><div className="ai-reference-image">{photo?<img src={photo.path} alt={displayName} loading="lazy"/>:<MapPin size={22}/>}</div><div className="ai-reference-copy"><div className="card-location">{t("common.selectedPlace")} · {t(`area.${place.area}`)}</div><Link href={"/places/"+place.id}><h4>{displayName}<ArrowUpRight size={14}/></h4></Link><p>{reason??placeSummary(place,locale)}</p><small>{formatDuration(place.visitMinutes,locale)??t("common.notVerified")} · {t("common.sourceBacked")}</small><SourceDisclosure ids={place.sourceIds}/>{(onAdd||onSave)&&<div className="ai-reference-actions">{onAdd&&<button type="button" className="text-button" onClick={()=>onAdd(place.id)}><ArrowRight size={14}/>{t("common.addPlaceToTrip")}</button>}{onSave&&<button type="button" className="text-button subtle" onClick={()=>onSave(place.id)}><ShieldCheck size={14}/>{t("common.saveToCollection")}</button>}</div>}</div></article>;
}

function ReferenceRoute({routeId,reason,onAdd,onStart}:{routeId:string;reason?:string;onAdd?:((id:string)=>void);onStart?:((id:string)=>void)}){
 const {catalog}=useApp(); const {t,locale}=useI18n(); const route=catalog.routes.find(item=>item.id===routeId); if(!route)return null;
 return <article className="ai-reference-card ai-route-reference"><div className="ai-reference-route-mark"><RouteIcon size={23}/></div><div className="ai-reference-copy"><div className="card-location">{t("common.routes")} · {route.stopIds.length} {t("common.stops")}</div><Link href={"/routes/"+route.id}><h4>{displayRouteTitle(route,locale)}<ArrowUpRight size={14}/></h4></Link><p>{reason??routeDescription(route,locale)}</p><small>{formatDuration(route.durationMinutes,locale)} · {route.distanceKm===null?t("common.distanceUnavailable"):formatDistance(route.distanceKm,locale)}</small><SourceDisclosure ids={route.sourceIds}/>{(onAdd||onStart)&&<div className="ai-reference-actions">{onAdd&&<button type="button" className="text-button" onClick={()=>onAdd(route.id)}><ArrowRight size={14}/>{t("common.addRouteToTrip")}</button>}{onStart&&<button type="button" className="text-button subtle" onClick={()=>onStart(route.id)}><RouteIcon size={14}/>{t("common.startRoute")}</button>}</div>}</div></article>;
}

export function AiAnswer({response,onAction,onAddPlace,onSavePlace,onAddRoute,onStartRoute}:{response:AIResponse;onAction?:(action:AIAction)=>void;onAddPlace?:(id:string)=>void;onSavePlace?:(id:string)=>void;onAddRoute?:(id:string)=>void;onStartRoute?:(id:string)=>void}){
 const {catalog}=useApp(); const {t,locale}=useI18n();
 const [selectedPlaceId,setSelectedPlaceId]=useState<string|undefined>();
 const referencedPlaces=useMemo(()=>response.places.map(reference=>catalog.places.find(place=>place.id===reference.placeId)).filter((place):place is Place=>Boolean(place)),[catalog.places,response.places]);
 const claims=catalog.places.flatMap(place=>placeFacts(place)).filter(claim=>response.places.some(reference=>reference.claimIds.includes(claim.id)));
 return <div className="ai-answer">
  <div className="ai-answer-heading"><span className="badge ai"><Sparkles size={13}/>{t("common.aiGenerated")}</span><small>{t("common.aiResponseGrounded")}</small></div>
  <p className="answer-text" dir="auto">{response.message.content}</p>
  {response.recommendations.length>0&&<div className="answer-recommendations"><span className="answer-reference-label"><Sparkles size={14}/>{t("common.recommendations")}</span>{response.recommendations.map(item=><div className="answer-recommendation" key={item.id}><strong>{item.title}</strong><p>{item.description}</p><span className="badge neutral">{item.confidence==="verified-match"?t("common.verifiedMatch"):t("common.planningSuggestion")}</span></div>)}</div>}
  {response.places.length>0&&<div className="answer-reference-block"><span className="answer-reference-label"><MapPin size={14}/>{t("common.places")}</span><div className="answer-place-cards">{response.places.map(reference=><ReferencePlace key={reference.placeId} placeId={reference.placeId} reason={reference.reason} onAdd={onAddPlace} onSave={onSavePlace}/>)}</div></div>}
  {referencedPlaces.length>0&&<div className="answer-map"><span className="answer-reference-label"><MapPin size={14}/>{t("common.recommendationMap")}</span><PlaceMap places={referencedPlaces} mode="recommendations" activeId={selectedPlaceId} onSelect={setSelectedPlaceId}/></div>}
  {response.routes.length>0&&<div className="answer-reference-block"><span className="answer-reference-label"><RouteIcon size={14}/>{t("common.routes")}</span><div className="answer-place-cards">{response.routes.map(reference=><ReferenceRoute key={reference.routeId} routeId={reference.routeId} reason={reference.reason} onAdd={onAddRoute} onStart={onStartRoute}/>)}</div></div>}
  {claims.length>0&&<details className="answer-facts" open><summary><ShieldCheck size={14}/>{t("common.verifiedInformation")} · {claims.length}<ChevronRight size={15}/></summary><div>{claims.map(claim=><Fact claim={claim} key={claim.id}/>)}</div></details>}
  {response.sources.length>0&&<div className="answer-sources"><span className="answer-reference-label"><BookOpen size={14}/>{t("common.sourcesUsed")}</span><div>{response.sources.map(source=>{const record=catalog.sources.find(item=>item.id===source.sourceId);const raw=record?.lastVerifiedAt??record?.accessedAt;const date=raw?(()=>{const parsed=new Date(raw);return Number.isNaN(parsed.getTime())?raw:new Intl.DateTimeFormat(localeConfig[locale??"en"].htmlLang,{year:"numeric",month:"short",day:"numeric"}).format(parsed);})():null;return <a href={source.url} target="_blank" rel="noreferrer" key={source.sourceId} aria-label={`${source.publisher}${date?` · ${t("common.lastVerified")} ${date}`:""}`}><span>{source.publisher}</span>{date&&<small>{t("common.lastVerified")} {date}</small>}<ExternalLink size={12}/></a>;})}</div></div>}
  {response.actions.length>0&&onAction&&<div className="answer-actions">{response.actions.map(action=><button type="button" className="button secondary small" key={action.id} onClick={()=>onAction(action)}>{actionLabel(action,t)}<ArrowUpRight size={14}/></button>)}</div>}
  {response.missing.length>0&&<div className="unavailable"><strong>{t("common.notAvailable")}</strong><ul>{response.missing.map((item,index)=><li dir="auto" key={index}>{item}</li>)}</ul></div>}
  <small className="answer-footnote">{t("common.aiTrustNote")}</small>
 </div>;
}

export function Narrative({placeId,label}:{placeId:string;label?:string}){
 const {catalog,preferences,trip,savedPlaces,savedRoutes}=useApp(); const {locale,t}=useI18n(); const [availability,setAvailability]=useState<ConnectionState>("checking"); const [response,setResponse]=useState<AIResponse|null>(null); const [busy,setBusy]=useState(false); const [error,setError]=useState("");
 const place=catalog.places.find(item=>item.id===placeId);
 useEffect(()=>{const controller=new AbortController();getAIAvailability(controller.signal).then(value=>setAvailability(value.configured?"ready":"not-configured")).catch(()=>setAvailability("error"));return()=>controller.abort();},[]);
 async function generate(){if(!place)return;if(availability!=="ready"){setError(t("common.aiNotConfigured"));return;}setBusy(true);setError("");try{const next=await requestAI({conversationId:"narrative-"+place.id,messages:[],prompt:t("common.tellStoryOf",{place:displayPlaceName(place,locale)}),context:buildAIClientContext({catalog,preferences,trip,locale:locale??"en",currentPlaceId:place.id,savedPlaceIds:savedPlaces,savedRouteIds:savedRoutes})});setResponse(next);}catch(error){if((error as Error).name!=="AbortError")setError(error instanceof AIServiceError?error.message:t("common.aiConnectionError"));}finally{setBusy(false);}}
 return <section className="narrative"><div className="section-heading compact"><h3>{t("common.story")}</h3><Sparkles size={22}/></div><p className="muted">{t("common.interpretation")}</p><button className="button secondary" disabled={busy} onClick={()=>void generate()}><Sparkles size={16}/>{busy?t("common.thinking"):response?t("common.generateAnother"):(label??t("common.generateNarrative"))}</button>{availability==="not-configured"&&<div className="narrative-provider-note"><span className="badge neutral">{t("common.aiNotConnected")}</span><p>{t("common.aiNotConfigured")}</p><Link href="/setup">{t("common.setupAI")} <ArrowUpRight size={13}/></Link></div>}{error&&<div className="narrative-error" role="alert">{error}</div>}{response&&<AiAnswer response={response}/>}</section>;
}

export function Guide(){
 const {catalog,preferences,trip,updateTrip,saveItem,notify,savedPlaces,savedRoutes}=useApp(); const {locale,t}=useI18n(); const router=useRouter();
 const [question,setQuestion]=useState(""); const [placeId,setPlaceId]=useState(""); const [busy,setBusy]=useState(false); const [messages,setMessages]=useState<GuideTurn[]>([]); const [availability,setAvailability]=useState<AIAvailability|null>(null); const [connectionError,setConnectionError]=useState(""); const [requestError,setRequestError]=useState(""); const [lastQuestion,setLastQuestion]=useState(""); const controllerRef=useRef<AbortController|null>(null);
 const contextPlace=useMemo(()=>catalog.places.find(place=>place.id===placeId),[catalog.places,placeId]);
 const state:ConnectionState=availability===null?"checking":availability.configured?"ready":connectionError?"error":"not-configured";

 useEffect(()=>{const controller=new AbortController();getAIAvailability(controller.signal).then(setAvailability).catch(()=>setConnectionError(t("common.aiStatusError")));return()=>controller.abort();},[t]);
 // eslint-disable-next-line react-hooks/set-state-in-effect
 useEffect(()=>{try{const saved=window.localStorage.getItem("jeroam-guide-conversation");if(saved){const parsed=JSON.parse(saved) as GuideTurn[];if(Array.isArray(parsed))setMessages(parsed.filter(turn=>turn?.response?.message?.content));}}catch{/* local history is optional */}},[]);
 useEffect(()=>{try{if(messages.length)window.localStorage.setItem("jeroam-guide-conversation",JSON.stringify(messages));else window.localStorage.removeItem("jeroam-guide-conversation");}catch{/* local history is optional */}},[messages]);
  useEffect(()=>{const timer=window.setTimeout(()=>{const params=new URLSearchParams(window.location.search);const requested=params.get("place");const place=catalog.places.find(item=>item.id===requested);if(place){setPlaceId(place.id);setQuestion(current=>current||t("common.tellStoryOf",{place:displayPlaceName(place,locale)}));}},0);return()=>window.clearTimeout(timer);},[catalog.places,t,locale]);

 function context(){return buildAIClientContext({catalog,preferences,trip,locale:locale??"en",currentPlaceId:placeId||undefined,savedPlaceIds:savedPlaces,savedRouteIds:savedRoutes});}
 function conversationHistory():AIMessage[]{return messages.flatMap(turn=>[{id:turn.id+"-question",role:"user",content:turn.question,createdAt:turn.response.message.createdAt,status:"complete"},turn.response.message]);}
 async function ask(value:string){const submitted=value.trim();if(!submitted||busy)return;setRequestError("");setLastQuestion(submitted);if(state!=="ready"){setRequestError(t("common.aiNotConfigured"));return;}setBusy(true);const controller=new AbortController();controllerRef.current=controller;try{const response=await requestAI({conversationId:"guide-"+(locale??"en"),messages:conversationHistory(),prompt:submitted,context:context(),stream:availability?.streaming??false},controller.signal);setMessages(current=>[...current,{id:response.id,question:submitted,response}]);setQuestion("");}catch(error){if((error as Error).name!=="AbortError")setRequestError(error instanceof AIServiceError?error.message:t("common.aiConnectionError"));}finally{controllerRef.current=null;setBusy(false);}}
 function submit(event:FormEvent){event.preventDefault();void ask(question);}
 function stop(){controllerRef.current?.abort();controllerRef.current=null;setBusy(false);}
 function clearConversation(){stop();setMessages([]);setQuestion("");setRequestError("");setLastQuestion("");}
 function addPlaceToTrip(id:string){if(!trip){router.push("/onboarding?next=/my-trip");setRequestError(t("common.setupTripFirst"));return;}const first=trip.days[0];if(!first)return;if(first.items.some(item=>item.placeId===id)){notify("notice.alreadyInTrip");return;}const ids=first.items.map(item=>item.placeId).concat(id);const items=scheduleItems(ids,catalog,preferences??defaultPreferences,{}, "ai");updateTrip({...trip,mode:"ai",days:trip.days.map(day=>day.day===first.day?{...day,items}:day)});notify("notice.aiPlaceAdded");}
 function addRouteToTrip(id:string){const route=catalog.routes.find(item=>item.id===id);if(!route)return;if(!trip){router.push("/onboarding?next=/my-trip");setRequestError(t("common.setupTripFirst"));return;}const first=trip.days[0];if(!first)return;const existing=new Set(trip.days.flatMap(day=>day.items.map(item=>item.placeId)));const newStops=route.stopIds.filter(stopId=>!existing.has(stopId));if(!newStops.length){notify("notice.routeAlreadyInTrip");return;}const items=scheduleItems(first.items.map(item=>item.placeId).concat(newStops),catalog,preferences??defaultPreferences,{},"ai");updateTrip({...trip,mode:"ai",days:trip.days.map(day=>day.day===first.day?{...day,items}:day)});notify("notice.aiRouteAdded");}
 function runAction(action:AIAction){if(action.type==="add-place"&&action.placeId)addPlaceToTrip(action.placeId);else if(action.type==="add-route"&&action.routeId)addRouteToTrip(action.routeId);else if(action.type==="save-place"&&action.placeId)void saveItem("place",action.placeId);else if(action.type==="save-route"&&action.routeId)void saveItem("route",action.routeId);else if(action.type==="start-route"&&action.routeId)router.push("/routes/"+action.routeId);}

 const previewImage=contextPlace?.imageId?catalog.images[contextPlace.imageId]:catalog.images.hero;
 return <main className="page-wrap guide-page guide-v2">
  <section className="guide-hero-v2"><div className="guide-hero-v2-copy"><span className="eyebrow">JEROAM / {t("common.guide")}</span><h1>{t("common.whereWander")}</h1><p>{t("common.guideIntro")}</p><div className="guide-availability"><span className={"status-dot "+(state==="ready"?"online":"")}/><strong>{connectionLabel(state,t)}</strong><span>{state==="ready"?t("common.aiReadyCopy"):t("common.aiNotConfiguredShort")}</span></div>{state==="not-configured"&&<div className="guide-provider-banner"><ShieldCheck size={17}/><div><strong>{t("common.aiNotConfiguredTitle")}</strong><p>{t("common.aiNotConfigured")}</p><Link href="/setup">{t("common.setupAI")} <ArrowUpRight size={13}/></Link></div></div>}</div><div className="guide-hero-v2-art"><img src={catalog.images.hero.path} alt={t("common.altMountOfOlives")}/><div className="guide-hero-v2-art-caption"><MapPin size={14}/> {t("common.jerusalemIsrael")} <span>·</span> {t("common.context")}</div><div className="guide-hero-v2-art-mark"><Compass size={26}/><span>{t("common.guide")}<br/>{t("common.context")}</span></div></div></section>
  <section className="guide-shell-v2">
   <div className="guide-conversation-v2">
    <header className="guide-conversation-header"><div className="guide-identity"><span className="guide-avatar-v2"><Compass size={21}/></span><span><strong>{t("common.guide")}</strong><small>{t("common.sourceBacked")}</small></span></div><span className={"guide-local-pill "+(state==="ready"?"connected":"")}><span className="status-dot"/>{connectionLabel(state,t)}</span><button type="button" className="icon-button" onClick={clearConversation} aria-label={t("common.clear")} title={t("common.clear")}><RefreshCw size={17}/></button></header>
     {contextPlace&&<div className="guide-context-v2"><div className="guide-context-image"><img src={previewImage.path} alt=""/></div><div><span className="eyebrow">{t("common.context")}</span><strong>{displayPlaceName(contextPlace,locale)}</strong><small>{t(`area.${contextPlace.area}`)} · {t(`category.${contextPlace.category}`)}</small></div><button type="button" onClick={()=>{setPlaceId("");setQuestion("");}} aria-label={t("common.clear")}>{t("common.clear")}</button></div>}
    <div className="guide-feed-v2" aria-live="polite">
     {!messages.length&&<div className="guide-welcome-v2"><div className="guide-welcome-mark"><BookOpen size={22}/></div><span className="eyebrow">{t("common.suggestedQuestions")}</span><h2>{t("common.whereWander")}</h2><p>{t("common.guideIntro")}</p>{state==="checking"&&<div className="guide-provider-state"><span className="spinner"/><span>{t("common.aiChecking")}</span></div>}{state==="not-configured"&&<div className="guide-provider-state"><span className="badge neutral">{t("common.aiNotConnected")}</span><p>{t("common.aiNotConfigured")}</p><Link className="text-link" href="/setup">{t("common.setupAI")} <ArrowUpRight size={14}/></Link></div>}{state==="error"&&<div className="guide-provider-state error" role="alert"><span>{connectionError||t("common.aiStatusError")}</span><button type="button" className="text-button" onClick={()=>{setConnectionError("");setAvailability(null);}}>{t("common.retry")}</button></div>}<div className="guide-prompts-v2">{promptDefinitions.map(prompt=>{const Icon=prompt.icon;return <button type="button" key={prompt.id} onClick={()=>void ask(t(prompt.questionKey))} disabled={busy||state!=="ready"} title={state==="ready"?undefined:t("common.aiNotConfigured")}><span className="guide-prompt-icon"><Icon size={17}/></span><span><strong>{t(prompt.questionKey)}</strong><small>{t(prompt.hintKey)}</small></span><ArrowRight size={15}/></button>;})}</div></div>}
     {messages.map(turn=><div className="guide-turn-v2" key={turn.id}><div className="guide-user-line"><span>{t("common.you")}</span><p dir="auto">{turn.question}</p></div><div className="guide-response-line"><div className="guide-response-label"><span className="guide-avatar-v2"><Compass size={16}/></span><span>{t("common.guide")}</span><small>{t("common.aiGenerated")}</small></div><AiAnswer response={turn.response} onAction={runAction} onAddPlace={addPlaceToTrip} onSavePlace={id=>void saveItem("place",id)} onAddRoute={addRouteToTrip} onStartRoute={id=>router.push("/routes/"+id)}/></div></div>)}
     {busy&&<div className="guide-thinking-v2"><span className="spinner"/><span>{t("common.thinking")}</span><button type="button" className="text-button" onClick={stop}>{t("common.stop")}</button></div>}
     {requestError&&<div className="guide-request-error" role="alert"><span>{requestError}</span>{lastQuestion&&state==="ready"&&<button type="button" className="text-button" onClick={()=>void ask(lastQuestion)}>{t("common.retry")}</button>}</div>}
    </div>
     <div className="guide-composer-v2"><form onSubmit={submit}><div className="guide-context-picker"><label htmlFor="guide-place">{t("common.context")}</label><select id="guide-place" value={placeId} onChange={event=>setPlaceId(event.target.value)}><option value="">{t("common.notSelected")}</option>{catalog.places.map(place=><option value={place.id} key={place.id}>{displayPlaceName(place,locale)}</option>)}</select></div><div className="guide-input-row"><textarea aria-label={t("common.askQuestion")} placeholder={contextPlace?t("common.askAboutPlace")+" · "+displayPlaceName(contextPlace,locale)+"…":t("common.askPlaceholder")} value={question} maxLength={2000} onChange={event=>setQuestion(event.target.value)} rows={2}/><button type="button" className="guide-mic-button" disabled aria-label={t("common.micUnavailable")} title={t("common.micUnavailable")}><Mic size={18}/></button><button className="guide-send-button" type="submit" disabled={busy||!question.trim()||state!=="ready"} aria-label={t("common.askSend")}>{busy?<span className="spinner"/>:<Send size={18}/>}</button></div><div className="guide-composer-meta"><span>{t("common.askSend")} · {new Intl.NumberFormat(localeConfig[locale as "en"|"ar"|"he"]?.htmlLang??"en").format(2000)}</span><span><ShieldCheck size={13}/> {t("common.sourceRegister")}</span></div></form></div>
   </div>
   <aside className="guide-notebook-v2"><div className="guide-notebook-card"><span className="eyebrow light">{t("common.context")}</span><h3>{t("common.whereWander")}</h3><p>{t("common.guideIntro")}</p><div className="guide-notebook-rule"/><dl><div><dt><ShieldCheck size={15}/>{t("common.verifiedInformation")}</dt><dd>{t("common.sourceExplanation")}</dd></div><div><dt><Sparkles size={15}/>{t("common.aiGenerated")}</dt><dd>{t("common.aiTrustNote")}</dd></div><div><dt><RouteIcon size={15}/>{t("common.routes")}</dt><dd>{t("common.followThread")}</dd></div></dl></div>{preferences?<div className="guide-preferences-v2"><span className="eyebrow">{t("common.pace")}</span><strong>{t("tripType."+preferences.tripType)} · {preferences.days} {preferences.days===1?t("common.day"):t("common.days")}</strong><p>{preferences.interests.slice(0,3).map(item=>t("interest."+item)).join(" · ")}</p><Link href="/profile" className="text-link">{t("common.editPreferences")} <ArrowUpRight size={14}/></Link></div>:<div className="guide-preferences-v2"><span className="eyebrow">{t("common.makeYours")}</span><strong>{t("common.guideIntro")}</strong><p>{t("common.addGroup")}</p><Link href="/onboarding" className="text-link">{t("common.editPreferences")} <ArrowUpRight size={14}/></Link></div>}<div className="guide-notebook-links"><Link href="/routes"><span><RouteIcon size={16}/>{t("common.walkingRoutes")}</span><ArrowUpRight size={14}/></Link><Link href="/sources"><span><BookOpen size={16}/>{t("common.sources")}</span><ArrowUpRight size={14}/></Link></div></aside>
  </section>
 </main>;
}



