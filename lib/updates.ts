import {getPlace,getSource,releaseCatalog} from "./catalog";
import type {Catalog,JerusalemUpdate,UpdateCategory} from "./contracts";

export type CuratedUpdateSpec={id:string;category:UpdateCategory;placeId:string;sourceId:string;claimId?:string};

/**
 * Adapter contract for the updates surface. The current provider is local and
 * source-backed; a future RSS/news API adapter can implement the same method
 * without changing the page or card components. A provider must return the
 * normalized JerusalemUpdate shape, including a source URL and freshness mode.
 */
export type UpdatesProvider={
 id:string;
 mode:JerusalemUpdate["freshness"];
 load:(catalog:Catalog)=>JerusalemUpdate[]|Promise<JerusalemUpdate[]>;
};

/**
 * Curated visitor updates are deliberately built from the same local release
 * catalog as places and routes. They are not a news feed: no publication date
 * is inferred, and an item is omitted if its source or factual claim is absent.
 * Replace this adapter with a backend/news provider later without changing the
 * card or page contract.
 */
const curatedUpdateSpecs:CuratedUpdateSpec[]=[
 {id:"jaffa-gate-visitor-context",category:"Heritage",placeId:"jaffa-gate",sourceId:"jaffa",claimId:"jaffa-gate-1"},
 {id:"tower-of-david-museum-overview",category:"Museums",placeId:"tower-of-david",sourceId:"tower",claimId:"tower-of-david-1"},
 {id:"mahane-yehuda-market-context",category:"Culture",placeId:"mahane-yehuda",sourceId:"market",claimId:"mahane-yehuda-1"},
 {id:"shrine-of-book-visitor-context",category:"Museums",placeId:"shrine-of-book",sourceId:"shrine",claimId:"shrine-of-book-1"},
 {id:"the-cardo-heritage-context",category:"Heritage",placeId:"the-cardo",sourceId:"cardo",claimId:"the-cardo-1"},
 {id:"holy-sepulchre-heritage-context",category:"Heritage",placeId:"holy-sepulchre",sourceId:"church",claimId:"holy-sepulchre-1"},
 {id:"montefiore-windmill-cultural-context",category:"Culture",placeId:"montefiore-windmill",sourceId:"windmill",claimId:"montefiore-windmill-1"},
 {id:"damascus-gate-heritage-context",category:"Heritage",placeId:"damascus-gate",sourceId:"damascus",claimId:"damascus-gate-1"},
 {id:"dung-gate-catalog-record",category:"Heritage",placeId:"osm-node-29944308",sourceId:"osm-node-29944308",claimId:"osm-node-29944308-classification"},
 {id:"western-wall-viewpoint-record",category:"Travel information",placeId:"osm-node-321745309",sourceId:"osm-node-321745309",claimId:"osm-node-321745309-classification"},
 {id:"haas-promenade-viewpoint-record",category:"Travel information",placeId:"osm-node-562633299",sourceId:"osm-node-562633299",claimId:"osm-node-562633299-classification"},
 {id:"burnt-house-museum-record",category:"Museums",placeId:"osm-node-561134517",sourceId:"osm-node-561134517",claimId:"osm-node-561134517-classification"},
];

export function getVerifiedUpdates(catalog:Catalog=releaseCatalog):JerusalemUpdate[]{
 return curatedUpdateSpecs.flatMap(spec=>{
  const place=getPlace(spec.placeId,catalog);const source=getSource(spec.sourceId,catalog);
  if(!place||!source)return [];
  const claim=(place.factualInformation??place.claims).find(item=>item.id===spec.claimId&&item.sourceIds.includes(source.id))
    ??(place.factualInformation??place.claims).find(item=>item.sourceIds.includes(source.id));
  if(!claim)return [];
  return [{
   id:spec.id,headline:source.title,summary:claim.text,publicationDate:null,
   source:{id:source.id,title:source.title,publisher:source.publisher,url:source.url},sourceUrl:source.url,
   imageId:place.imageId,category:spec.category,lastUpdatedAt:source.lastVerifiedAt??source.accessedAt??catalog.version,
   freshness:"verified-snapshot" as const,placeId:place.id,
  }];
 }).sort((a,b)=>b.lastUpdatedAt.localeCompare(a.lastUpdatedAt));
}

export function getVerifiedUpdate(id:string,catalog:Catalog=releaseCatalog):JerusalemUpdate|undefined{
 return getVerifiedUpdates(catalog).find(update=>update.id===id);
}

/** The honest default for the frontend-only build: a dated catalog snapshot. */
export const curatedUpdatesProvider:UpdatesProvider={
 id:"jeroam-catalog-snapshot",
 mode:"verified-snapshot",
 load:(catalog)=>getVerifiedUpdates(catalog),
};

/**
 * Resolve the configured provider in one place. Keep this function as the
 * seam for a future server-backed provider; never put a news API key in the
 * browser bundle or silently label a remote response as live.
 */
export function getUpdatesProvider():UpdatesProvider{return curatedUpdatesProvider;}

export async function loadUpdates(catalog:Catalog=releaseCatalog,provider:UpdatesProvider=getUpdatesProvider()):Promise<JerusalemUpdate[]>{
 const updates=await provider.load(catalog);
 return updates.filter(update=>Boolean(update.id&&update.headline&&update.summary&&update.sourceUrl&&update.source?.url&&update.lastUpdatedAt));
}

export function latestUpdateDate(updates:JerusalemUpdate[],fallback:string):string{
 return updates.reduce((latest,update)=>update.lastUpdatedAt>latest?update.lastUpdatedAt:latest,fallback);
}

export function formatUpdateDate(value:string|null,locale="en-US"){
 if(!value)return "Publication date not provided by source";
 return new Intl.DateTimeFormat(locale,{month:"short",day:"numeric",year:"numeric"}).format(new Date(`${value}T12:00:00`));
}
