import type {AIContext,AIContextInput} from "./types";
import {getRouteStops,placeFacts} from "../catalog";

function selected<T extends {id:string}>(records:T[],ids:string[]|undefined){
 if(ids===undefined)return records;
 const allowed=new Set(ids);
 return records.filter(record=>allowed.has(record.id));
}

function itineraryContext(trip:AIContextInput["trip"]){
 if(!trip)return null;
 // Free-form notes and titles can contain personal details. The model only
 // needs the schedule structure to suggest the next place or reorganize a
 // day, so keep that minimum context at the provider boundary.
 return {...trip,title:"Current Jeroam trip",days:trip.days.map(day=>({...day,items:day.items.map(item=>{
  const safeItem={...item};
  delete safeItem.notes;
  return safeItem;
 })}))};
}

/**
 * Build the source-aware context passed between the application layers.
 *
 * The browser normally uses `buildAIClientContext`, which contains user
 * state but no catalog text. The server then resolves the catalog from its
 * trusted snapshot and scopes it through `retrieveAIContext` before a model
 * ever sees it. Keeping this builder usable with a full catalog is helpful
 * for local tooling and future mobile clients.
 */

export function buildAIContext(input:AIContextInput):AIContext{
 const {catalog,preferences,trip,locale,currentPlaceId,currentRouteId,selectedDay,availableMinutes,savedPlaceIds=[],savedRouteIds=[]}=input;
 const places=selected(catalog.places,input.placeIds);
 const routes=selected(catalog.routes,input.routeIds);
 // Source IDs are constrained to records in the selected context. This keeps
 // citations inspectable while avoiding unrelated source text in a prompt.
 const inferredSourceIds=new Set<string>([
  ...places.flatMap(place=>[...place.sourceIds,...place.claims.flatMap(claim=>claim.sourceIds)]),
  ...routes.flatMap(route=>route.sourceIds),
 ]);
 const sourceIds=input.sourceIds===undefined?[...inferredSourceIds]:input.sourceIds.filter(id=>inferredSourceIds.has(id));
 return {
  locale,
  language:preferences?.language??(locale==="ar"?"العربية":locale==="he"?"עברית":"English"),
  user:{preferences,savedPlaceIds:savedPlaceIds.filter(id=>catalog.places.some(place=>place.id===id)),savedRouteIds:savedRouteIds.filter(id=>catalog.routes.some(route=>route.id===id))},
  current:{placeId:currentPlaceId,routeId:currentRouteId,selectedDay,availableMinutes},
  itinerary:itineraryContext(trip),
  jeroam:{
   places:places.map(place=>({
    id:place.id,name:place.name,localizedNames:place.localizedNames,shortDescription:place.shortDescription,description:place.description,kind:place.kind,category:place.category,area:place.area,interests:place.interests,tags:place.tags,imageIds:place.imageIds,practicalInformation:place.practicalInformation,
    visitMinutes:place.visitMinutes,costType:place.costType,estimatedCost:place.estimatedCost,coordinates:place.coordinates,
    address:place.address,openingHours:place.openingHours,sourceIds:place.sourceIds,
    claims:placeFacts(place).map(claim=>({id:claim.id,text:claim.text,sourceIds:claim.sourceIds}))
   })),
   routes:routes.map(route=>({id:route.id,title:route.title,localizedTitles:route.localizedTitles,localizedDescriptions:route.localizedDescriptions,description:route.description,theme:route.theme,difficulty:route.difficulty,durationMinutes:route.durationMinutes,distanceKm:route.distanceKm,distanceKind:route.distanceKind,stopIds:route.stopIds,stops:getRouteStops(route,catalog),coordinates:route.coordinates,categories:route.categories,interests:route.interests,startPlaceId:route.startPlaceId,endPlaceId:route.endPlaceId,sourceIds:route.sourceIds})),
   sources:catalog.sources.filter(source=>sourceIds.includes(source.id)).map(source=>({id:source.id,title:source.title,publisher:source.publisher,url:source.url}))
  }
 };
}

/** Context shape used by browser requests. The server reconstructs catalog
 * records from `releaseCatalog`, so source-backed content is never accepted
 * from an untrusted client payload. */
export function buildAIClientContext(input:AIContextInput):AIContext{
 return buildAIContext({...input,placeIds:[],routeIds:[],sourceIds:[]});
}
