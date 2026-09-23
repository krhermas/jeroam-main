"use client";

import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {ArrowLeft,ArrowRight,ArrowUpRight,CalendarDays,MapPin,Newspaper,ShieldCheck} from "lucide-react";
import {useApp} from "./provider";
import {curatedUpdatesProvider,formatUpdateDate,getUpdatesProvider,getVerifiedUpdate,getVerifiedUpdates,latestUpdateDate,loadUpdates,type UpdatesProvider} from "@/lib/updates";
import {updateCategories,type JerusalemUpdate} from "@/lib/contracts";
import {localeConfig,useI18n} from "./i18n";
import {displayPlaceName,displayRouteTitle,formatMinutes,placeSummary} from "@/lib/catalog";
import {localizeCatalogText} from "@/lib/localization";
import {SourceLinks} from "./shared";

const categories=["All",...updateCategories] as const;
type UpdateFilter=(typeof categories)[number];

function UpdateCard({update}:{update:JerusalemUpdate}){
 const {catalog}=useApp();
 const {t,locale}=useI18n();
 const place=update.placeId?catalog.places.find(item=>item.id===update.placeId):undefined;
 const imageId=update.imageId??place?.imageId??place?.imageIds?.[0]??null;
 const photo=imageId?catalog.images[imageId]:null;
 const headline=place?displayPlaceName(place,locale):localizeCatalogText(update.headline,locale);
 const language=localeConfig[locale??"en"].htmlLang;
 const published=update.publicationDate?formatUpdateDate(update.publicationDate,language):null;
 const updated=formatUpdateDate(update.lastUpdatedAt,language);
 const detailHref=`/updates/${update.id}`;

 return <article className="update-card" aria-labelledby={`update-${update.id}`}>
  <Link href={detailHref} className={`update-card-image update-card-image-link${!photo?" no-image":""}`} aria-label={`${t("updates.readMore")}: ${headline}`}>
   {photo?<img src={photo.path} alt={headline} loading="lazy"/>:<><Newspaper size={27} aria-hidden="true"/><span>{t("updates.sourceRecord")}</span></>}
  </Link>
  <div className="update-card-body">
   <div className="update-card-meta"><span>{t(`updates.category.${update.category}`)}</span><span>{t("updates.verifiedRecord")}</span></div>
   <Link href={detailHref} className="update-card-title"><h3 id={`update-${update.id}`}>{headline}</h3></Link>
   <p>{localizeCatalogText(update.summary,locale)}</p>
   <div className="update-card-dates" aria-label={t("updates.dateLabel")}>
    <span><CalendarDays size={13} aria-hidden="true"/>{published?`${t("common.publicationDate")} ${published}`:t("common.publicationUnavailable")}</span>
    <span><CalendarDays size={13} aria-hidden="true"/>{t("common.lastVerified")} {updated}</span>
   </div>
   <div className="update-card-source">
    <ShieldCheck size={13} aria-hidden="true"/>
    <span>{t("common.source")}: <strong>{update.source.title}</strong> · {update.source.publisher}</span>
   </div>
   <div className="update-card-actions">
    <Link href={detailHref} className="update-card-read-more">{t("updates.readMore")} <ArrowRight size={14} aria-hidden="true"/></Link>
    {update.placeId&&<Link href={`/places/${update.placeId}`}>{t("common.openPlace")} <ArrowRight size={14} aria-hidden="true"/></Link>}
    <a href={update.sourceUrl} target="_blank" rel="noreferrer" aria-label={`${t("common.openSource")}: ${update.source.title}`}>{t("common.openSource")} <ArrowUpRight size={14} aria-hidden="true"/></a>
   </div>
  </div>
 </article>;
}

export function UpdatesCards({limit,showFilters=true,provider=getUpdatesProvider()}:{limit?:number;showFilters?:boolean;provider?:UpdatesProvider}){
 const {catalog}=useApp();
 const {t}=useI18n();
 const [category,setCategory]=useState<UpdateFilter>("All");
 const [updates,setUpdates]=useState<JerusalemUpdate[]>(()=>provider===curatedUpdatesProvider?getVerifiedUpdates(catalog):[]);
 const [loading,setLoading]=useState(false);
 const [loadError,setLoadError]=useState(false);
 const [retryToken,setRetryToken]=useState(0);
 useEffect(()=>{
  let cancelled=false;
  queueMicrotask(()=>{if(!cancelled){setLoadError(false);setLoading(true);}});
  void loadUpdates(catalog,provider).then(items=>{if(!cancelled){setUpdates(items);setLoading(false);}}).catch(()=>{if(!cancelled){setLoading(false);setLoadError(true);}});
  return()=>{cancelled=true;};
 },[catalog,provider,retryToken]);
 const filtered=useMemo(()=>updates.filter(update=>category==="All"||update.category===category),[updates,category]);
 const visible=limit?filtered.slice(0,limit):filtered;

 return <div className="updates-module">
  {showFilters&&<div className="updates-filters" role="tablist" aria-label={t("updates.categories")}>
   {categories.map(item=><button type="button" role="tab" aria-selected={category===item} aria-controls="updates-results" className={category===item?"active":""} onClick={()=>setCategory(item)} key={item}>{t(item==="All"?"updates.all":`updates.category.${item}`)}</button>)}
  </div>}
  {showFilters&&<div className="updates-result-meta" aria-live="polite"><span>{t("updates.recordCount",{count:filtered.length})}</span>{category!=="All"&&<button type="button" className="text-button" onClick={()=>setCategory("All")}>{t("common.clear")}</button>}</div>}
  {loadError&&!updates.length?<div className="updates-empty updates-error" role="alert"><Newspaper size={25} aria-hidden="true"/><strong>{t("updates.loadError")}</strong><span>{t("updates.emptyCopy")}</span><button type="button" className="text-button" onClick={()=>setRetryToken(value=>value+1)}>{t("common.retry")}</button></div>:loading&&!updates.length?<div className="updates-loading" role="status" aria-live="polite"><span className="updates-skeleton"/><span className="updates-skeleton"/><span className="updates-skeleton"/><span>{t("updates.loading")}</span></div>:visible.length?<div className="updates-grid" id="updates-results" role="tabpanel">{visible.map(update=><UpdateCard key={update.id} update={update}/>)}</div>:<div className="updates-empty" role="status"><Newspaper size={25} aria-hidden="true"/><strong>{t("updates.noCategory")}</strong><span>{t("updates.emptyCopy")}</span>{category!=="All"&&<button type="button" className="text-button" onClick={()=>setCategory("All")}>{t("common.clear")}</button>}</div>}
  {limit&&filtered.length>limit&&<Link className="updates-more" href="/updates">{t("updates.viewAll")} <ArrowUpRight size={15} aria-hidden="true"/></Link>}
 </div>;
}

export function UpdatesPage(){
 const {catalog}=useApp();
 const {t,locale}=useI18n();
 const provider=getUpdatesProvider();
 const updates=useMemo(()=>getVerifiedUpdates(catalog),[catalog]);
 const latest=latestUpdateDate(updates,catalog.version);
 const language=localeConfig[locale??"en"].htmlLang;
 return <main className="page-wrap updates-page">
  <div className="page-heading">
   <div><div className="eyebrow">{t("updates.eyebrow")}</div><h1>{t("updates.title").split("\n").map((line,index)=><span key={`${line}-${index}`}>{index>0&&<br/>}{line}</span>)}</h1><p>{t("updates.description")}</p></div>
   <div className="updates-heading-mark"><Newspaper size={22} aria-hidden="true"/><span>{t("updates.snapshot").split("\n").map((line,index)=><span key={`${line}-${index}`}>{index>0&&<br/>}{line}</span>)}<small>{t("updates.snapshotDate",{date:formatUpdateDate(latest,language)})}</small></span></div>
  </div>
  <section className="updates-trust-note">
   <ShieldCheck size={21} aria-hidden="true"/>
   <div><strong>{provider.mode==="live"?t("updates.liveLabel"):t("updates.notLive")}</strong><p>{provider.mode==="live"?t("updates.liveTrust"):t("updates.trust")}</p><Link className="text-link" href="/setup">{t("updates.providerSetup")} <ArrowUpRight size={13} aria-hidden="true"/></Link></div>
  </section>
  <UpdatesCards/>
 </main>;
}

export function UpdateDetail({id}:{id:string}){
 const {catalog}=useApp();const {t,locale}=useI18n();const update=getVerifiedUpdate(id,catalog);
 if(!update)return <main className="page-wrap update-detail-page"><Link className="back-link" href="/updates"><ArrowLeft size={16}/>{t("updates.backToUpdates")}</Link><div className="empty-state"><Newspaper size={28}/><h1>{t("common.notFound")}</h1><p>{t("common.notFoundCopy")}</p><Link href="/updates" className="button">{t("updates.backToUpdates")}</Link></div></main>;
 const place=update.placeId?catalog.places.find(item=>item.id===update.placeId):undefined;const routes=place?catalog.routes.filter(route=>route.stopIds.includes(place.id)).slice(0,4):[];const photo=update.imageId?catalog.images[update.imageId]:place?.imageId?catalog.images[place.imageId]:undefined;const headline=place?displayPlaceName(place,locale):localizeCatalogText(update.headline,locale);const language=localeConfig[locale??"en"].htmlLang;const published=update.publicationDate?formatUpdateDate(update.publicationDate,language):null;const checked=formatUpdateDate(update.lastUpdatedAt,language);
 return <main className="page-wrap update-detail-page"><Link className="back-link" href="/updates"><ArrowLeft size={16}/>{t("updates.backToUpdates")}</Link><header className="update-detail-heading"><div><span className="eyebrow">{t("updates.detailEyebrow")} · {t(`updates.category.${update.category}`)}</span><h1>{headline}</h1><p>{localizeCatalogText(update.summary,locale)}</p><div className="update-detail-meta"><span>{published?`${t("common.publicationDate")} ${published}`:t("common.publicationUnavailable")}</span><span>{t("common.lastVerified")} {checked}</span></div></div><span className="badge verified"><ShieldCheck size={14}/>{t("updates.verifiedRecord")}</span></header><div className="update-detail-grid"><article className="update-detail-body"><h2>{t("updates.summaryLabel")}</h2><p className="update-detail-summary">{localizeCatalogText(update.summary,locale)}</p><section className="update-detail-source"><div className="eyebrow">{t("updates.sourceContext")}</div><strong>{update.source.title}</strong><span>{update.source.publisher}</span><SourceLinks ids={[update.source.id]}/><a className="button secondary" href={update.sourceUrl} target="_blank" rel="noreferrer">{t("updates.openSource")} <ArrowUpRight size={15}/></a></section>{place&&<section className="update-related-place"><div><div className="eyebrow">{t("updates.relatedPlace")}</div><h2>{displayPlaceName(place,locale)}</h2><p>{placeSummary(place,locale)}</p></div><Link className="text-link" href={`/places/${place.id}`}>{t("common.openPlace")} <ArrowRight size={14}/></Link></section>}</article><aside className="update-detail-aside">{photo?<img src={photo.path} alt={headline}/>:<div className="update-detail-image-placeholder"><MapPin size={28}/><span>{t("updates.sourceRecord")}</span></div>}{routes.length>0&&<section className="update-related-routes"><div className="eyebrow">{t("updates.relatedRoutes")}</div>{routes.map(route=><Link href={`/routes/${route.id}`} key={route.id}><span><strong>{displayRouteTitle(route,locale)}</strong><small>{formatMinutes(route.durationMinutes,locale)} · {route.stopIds.length} {t("common.stops")}</small></span><ArrowUpRight size={14}/></Link>)}</section>}</aside></div></main>;
}
