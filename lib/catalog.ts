import raw from "@/data/catalog.json";
import { costTypes, placeCategories, placeKinds, type Catalog, type Claim, type Coordinates, type CulturalRoute, type Photo, type Place, type PlaceCategory, type PlaceKind, type RouteStop, type Source, type TripActivity } from "./contracts";
import { localizeCatalogText, localizedClaimText, localizedPlaceDescription, localizedPlaceSummary, localizedRouteDescription, localizedRouteTitle } from "./localization";

/**
 * The JSON file is a human-reviewable release snapshot assembled from curated
 * records and an idempotent OpenStreetMap import. This adapter is the boundary
 * between that snapshot and the rest of the app:
 * it fills the canonical API-shaped fields without inventing facts. Missing
 * values stay null, and every source id is carried forward for inspection.
 */
type RawPlace = Omit<Partial<Place>, "id"|"name"|"category"|"area"|"interests"|"tagline"|"latitude"|"longitude"|"address"|"visitMinutes"|"costType"|"estimatedCost"|"costSourceId"|"openingHours"|"openingHoursSourceId"|"locationSourceId"|"imageId"|"claims"> & {
  id:string;name:string;category:string;area:string;interests:string[];tagline:string;latitude:number;longitude:number;address:string|null;visitMinutes:number;costType:string;estimatedCost:number|null;costSourceId:string|null;openingHours:string|null;openingHoursSourceId:string|null;locationSourceId:string;imageId:string|null;claims:Claim[];
};
type RawRoute=Omit<CulturalRoute,"lastVerifiedAt"> & {lastVerifiedAt?:string};
type RawCatalog={version:string;sources:Source[];images:Record<string,{path:string;author:string;license:string;sourceUrl:string;licenseUrl:string;changes:string}>;places:RawPlace[];routes:RawRoute[];activities?:TripActivity[]};

const rawCatalog=raw as unknown as RawCatalog;

function normalizeSource(source:Source):Source{
  const publisher=source.publisher.toLowerCase();
  const kind=source.kind ?? (source.id.endsWith("-location")?"coordinate":source.id==="unesco"?"heritage":publisher.includes("museum")||publisher.includes("israel museum")?"institution":"tourism");
  return {...source,kind,lastVerifiedAt:source.lastVerifiedAt??source.accessedAt};
}

function normalizeCategory(value:string):PlaceCategory{
  if((placeCategories as readonly string[]).includes(value))return value as PlaceCategory;
  throw new Error(`Catalog place category is not in the shared taxonomy: ${value}`);
}

function placeKindForCategory(category:PlaceCategory):PlaceKind{
  if(category==="Museums")return "museum";
  if(category==="Markets")return "market";
  if(category==="History")return "historical-landmark";
  if(category==="Heritage"||category==="Religious sites")return "heritage-location";
  if(category==="Restaurants"||category==="Food")return "restaurant-cafe";
  if(category==="Viewpoints")return "viewpoint";
  if(category==="Parks & public spaces")return "park-public-space";
  if(category==="Transport")return "transport-hub";
  return "cultural-location";
}

function normalizeCostType(value:string):Place["costType"]{
  if(costTypes.includes(value as (typeof costTypes)[number]))return value as Place["costType"];
  throw new Error(`Catalog place cost type is not in the shared taxonomy: ${value}`);
}

export function uniqueIds(ids:Array<string|null|undefined>):string[]{
  return [...new Set(ids.filter((id):id is string=>Boolean(id)))];
}

function placeSourceIds(place:RawPlace):string[]{
  return uniqueIds([
    ...(place.sourceIds ?? []),
    ...place.claims.flatMap(claim=>claim.sourceIds),
    place.locationSourceId,
    place.costSourceId,
    place.openingHoursSourceId,
    place.accessibility?.sourceId,
  ]);
}

function normalizePlace(place:RawPlace, verifiedAt:string):Place{
  const claims=place.claims ?? [];
  const category=normalizeCategory(place.category);
  const shortDescription=place.shortDescription?.trim() || place.tagline;
  const description=place.description?.trim() || claims.map(claim=>claim.text).join(" ");
  const coordinates:Coordinates=place.coordinates ?? {latitude:place.latitude,longitude:place.longitude};
  const amount=place.priceInfo?.amount ?? place.estimatedCost;
  const priceInfo=place.priceInfo ?? {
    amount,
    currency:"ILS" as const,
    display:amount===0?"Free entry listed":amount===null?null:`₪${amount}`,
    sourceId:place.costSourceId,
    lastVerifiedAt:amount===null?null:verifiedAt,
  };
  const declaredCostType=normalizeCostType(place.costType);
  const costType=amount===null?"unknown":declaredCostType;
  return {
    ...place,
    localizedNames:{en:place.name,...(place.localizedNames ?? {})},
    aliases:place.aliases ?? [],
    kind:place.kind ?? placeKindForCategory(category),
    category,
    subcategory:place.subcategory ?? null,
    costType,
    tags:place.tags ?? place.interests,
    shortDescription,
    description,
    practicalInformation:place.practicalInformation ?? null,
    coordinates,
    latitude:coordinates.latitude,
    longitude:coordinates.longitude,
    address:place.address ?? null,
    website:place.website ?? null,
    phone:place.phone ?? null,
    imageIds:uniqueIds([...(place.imageIds ?? []),place.imageId]),
    transportRelevance:place.transportRelevance ?? [],
    relatedPlaceIds:place.relatedPlaceIds ?? [],
    relatedRouteIds:place.relatedRouteIds ?? [],
    claims,
    factualInformation:place.factualInformation ?? claims,
    sourceIds:uniqueIds(placeSourceIds(place)),
    lastVerifiedAt:place.lastVerifiedAt ?? verifiedAt,
    accessibility:place.accessibility ?? null,
    priceInfo,
    aiStory:place.aiStory ?? null,
  };
}

function normalizeRoute(route:RawRoute, places:Place[], verifiedAt:string):CulturalRoute{
  const stopSources=route.stopIds.flatMap(stopId=>places.find(place=>place.id===stopId)?.sourceIds ?? []);
  const stopPlaces=route.stopIds.map(stopId=>places.find(place=>place.id===stopId)).filter((place):place is Place=>Boolean(place));
  const categories=[...new Set(stopPlaces.map(place=>place.category))];
  const interests=uniqueIds(stopPlaces.flatMap(place=>place.interests));
  const areas=uniqueIds(stopPlaces.map(place=>place.area));
  return {
    ...route,
    localizedTitles:{en:route.title,...(route.localizedTitles ?? {})},
    localizedDescriptions:{en:route.description,...(route.localizedDescriptions ?? {})},
    categories:route.categories?.length ? route.categories : categories,
    interests:route.interests?.length ? route.interests : interests,
    areas:route.areas?.length ? route.areas : areas,
    coordinates:route.coordinates?.length ? route.coordinates : stopPlaces.map(place=>place.coordinates),
    startPlaceId:route.startPlaceId ?? route.stopIds[0] ?? null,
    endPlaceId:route.endPlaceId ?? route.stopIds[route.stopIds.length-1] ?? null,
    distanceKind:route.distanceKind ?? (route.distanceKm===null ? "unavailable" : "straight-line-estimate"),
    sourceIds:uniqueIds([...route.sourceIds,...stopSources]),
    lastVerifiedAt:route.lastVerifiedAt ?? verifiedAt,
  };
}

function buildRouteStops(routes:CulturalRoute[],places:Place[]):RouteStop[]{
  return routes.flatMap(route=>route.stopIds.map((placeId,index)=>({
    routeId:route.id,
    placeId,
    order:index+1,
    prompt:route.prompts[index],
    durationMinutes:places.find(place=>place.id===placeId)?.visitMinutes,
    sourceIds:places.find(place=>place.id===placeId)?.sourceIds ?? [],
  })));
}

function buildActivities(places:Place[], routes:CulturalRoute[]):TripActivity[]{
  const placeActivities=places.map(place=>({
    id:`visit:${place.id}`,
    kind:"place-visit" as const,
    title:place.name,
    description:place.shortDescription,
    placeId:place.id,
    durationMinutes:place.visitMinutes,
    sourceIds:place.sourceIds,
  }));
  const routeActivities=routes.map(route=>({
    id:`route:${route.id}`,
    kind:"route" as const,
    title:route.title,
    description:route.description,
    routeId:route.id,
    durationMinutes:route.durationMinutes,
    sourceIds:route.sourceIds,
  }));
  return [...placeActivities,...routeActivities];
}

const normalizedPlaces=rawCatalog.places.map(place=>normalizePlace(place,rawCatalog.version));
const normalizedRoutes=rawCatalog.routes.map(route=>normalizeRoute(route,normalizedPlaces,rawCatalog.version));
const routeLinkedPlaces=normalizedPlaces.map(place=>({...place,relatedRouteIds:uniqueIds([...place.relatedRouteIds,...normalizedRoutes.filter(route=>route.stopIds.includes(place.id)).map(route=>route.id)])}));
const normalizedRouteStops=buildRouteStops(normalizedRoutes,routeLinkedPlaces);

/** Canonical local release catalog. Replace this adapter with a repository/API
 * implementation later; consumers do not need to change shape. */
const unvalidatedCatalog:Catalog={
  ...rawCatalog,
  sources:rawCatalog.sources.map(normalizeSource),
  places:routeLinkedPlaces,
  routes:normalizedRoutes,
  routeStops:normalizedRouteStops,
  activities:rawCatalog.activities ?? buildActivities(routeLinkedPlaces,normalizedRoutes),
};

/** Validate the normalized release at the data boundary. A page or future
 * mobile client can trust that every factual claim points to a source and
 * every map coordinate belongs to a real catalog record. */
export function validateCatalog(catalog:Catalog):Catalog{
  const issues:string[]=[];
  const validDate=(value:string|null|undefined)=>Boolean(value&&/^\d{4}-\d{2}-\d{2}/.test(value)&&!Number.isNaN(Date.parse(value)));
  const sourceIds=new Set<string>();
  for(const [imageId,image] of Object.entries(catalog.images)){
    if(!image.path||!image.author||!image.license)issues.push(`image ${imageId} is missing credit metadata`);
    for(const url of [image.sourceUrl,image.licenseUrl]){try{const parsed=new URL(url);if(parsed.protocol!=="https:")issues.push(`image ${imageId} must use https credits`);}catch{issues.push(`image ${imageId} has an invalid credit URL`);}}
  }
  for(const source of catalog.sources){
    if(sourceIds.has(source.id))issues.push(`duplicate source id ${source.id}`);
    sourceIds.add(source.id);
    if(!validDate(source.accessedAt)|| (source.lastVerifiedAt&&!validDate(source.lastVerifiedAt)))issues.push(`source ${source.id} has an invalid verification date`);
    try{const url=new URL(source.url);if(url.protocol!=="https:")issues.push(`source ${source.id} must use https`);}catch{issues.push(`source ${source.id} has an invalid URL`);}
  }
  const sourceUrls=new Set(catalog.sources.map(source=>source.url));
  for(const [imageId,image] of Object.entries(catalog.images))if(!sourceUrls.has(image.sourceUrl))issues.push(`image ${imageId} has no matching source record`);
  const placeIds=new Set<string>();
  for(const place of catalog.places){
    if(placeIds.has(place.id))issues.push(`duplicate place id ${place.id}`);
    placeIds.add(place.id);
    if(!Number.isFinite(place.coordinates.latitude)||place.coordinates.latitude<-90||place.coordinates.latitude>90)issues.push(`place ${place.id} has invalid latitude`);
    if(!Number.isFinite(place.coordinates.longitude)||place.coordinates.longitude<-180||place.coordinates.longitude>180)issues.push(`place ${place.id} has invalid longitude`);
    if(!(placeKinds as readonly string[]).includes(place.kind))issues.push(`place ${place.id} has an invalid kind`);
    if(!(costTypes as readonly string[]).includes(place.costType))issues.push(`place ${place.id} has an invalid cost type`);
    if(!validDate(place.lastVerifiedAt))issues.push(`place ${place.id} has an invalid verification date`);
    if(place.imageId&&!catalog.images[place.imageId])issues.push(`place ${place.id} references missing image ${place.imageId}`);
    for(const imageId of place.imageIds)if(!catalog.images[imageId])issues.push(`place ${place.id} references missing image ${imageId}`);
    if(!sourceIds.has(place.locationSourceId))issues.push(`place ${place.id} is missing its location source`);
    for(const id of place.sourceIds)if(!sourceIds.has(id))issues.push(`place ${place.id} references missing source ${id}`);
    for(const claim of [...place.claims,...place.factualInformation]){
      if(!claim.sourceIds.length)issues.push(`claim ${claim.id} has no source`);
      for(const id of claim.sourceIds)if(!sourceIds.has(id))issues.push(`claim ${claim.id} references missing source ${id}`);
    }
    if(place.priceInfo.amount===null){
      if(place.priceInfo.display!==null||place.priceInfo.sourceId!==null)issues.push(`place ${place.id} has an untraceable price`);
    }else if(!place.priceInfo.sourceId||!sourceIds.has(place.priceInfo.sourceId))issues.push(`place ${place.id} has a price without a source`);
    if(place.priceInfo.currency!=="ILS")issues.push(`place ${place.id} has an unsupported price currency`);
    if(place.priceInfo.lastVerifiedAt&&!validDate(place.priceInfo.lastVerifiedAt))issues.push(`place ${place.id} has an invalid price verification date`);
    if(place.openingHours!==null&&(!place.openingHoursSourceId||!sourceIds.has(place.openingHoursSourceId)))issues.push(`place ${place.id} has opening hours without a source`);
    if(place.accessibility?.summary!==null&&place.accessibility&&(!place.accessibility.sourceId||!sourceIds.has(place.accessibility.sourceId)))issues.push(`place ${place.id} has accessibility information without a source`);
  }
  const routeIds=new Set<string>();
  for(const route of catalog.routes){
    if(routeIds.has(route.id))issues.push(`duplicate route id ${route.id}`);
    routeIds.add(route.id);
    for(const id of route.stopIds){if(!placeIds.has(id))issues.push(`route ${route.id} references missing stop ${id}`);}
    for(const id of route.sourceIds)if(!sourceIds.has(id))issues.push(`route ${route.id} references missing source ${id}`);
    if(!catalog.images[route.imageId])issues.push(`route ${route.id} references missing image ${route.imageId}`);
    if(!route.localizedTitles?.en)issues.push(`route ${route.id} is missing its canonical English title`);
    if(!route.categories?.length)issues.push(`route ${route.id} is missing derived categories`);
    if(!route.coordinates||route.coordinates.length!==route.stopIds.length)issues.push(`route ${route.id} is missing ordered coordinates`);
    for(const coordinate of route.coordinates ?? [])if(!Number.isFinite(coordinate.latitude)||!Number.isFinite(coordinate.longitude))issues.push(`route ${route.id} has invalid ordered coordinates`);
    for(const category of route.categories ?? [])if(!(placeCategories as readonly string[]).includes(category))issues.push(`route ${route.id} has an invalid category ${category}`);
    if(route.startPlaceId!==route.stopIds[0]||route.endPlaceId!==route.stopIds[route.stopIds.length-1])issues.push(`route ${route.id} has invalid start/end places`);
    const routeStops=catalog.routeStops.filter(stop=>stop.routeId===route.id).sort((a,b)=>a.order-b.order);
    if(routeStops.length!==route.stopIds.length)issues.push(`route ${route.id} has an incomplete normalized stop relation`);
    routeStops.forEach((stop,index)=>{if(stop.placeId!==route.stopIds[index]||stop.order!==index+1)issues.push(`route ${route.id} has an out-of-order stop relation`);});
    for(const id of new Set(routeStops.flatMap(stop=>stop.sourceIds)))if(!route.sourceIds.includes(id))issues.push(`route ${route.id} omits stop source ${id}`);
  }
  const routeStopKeys=new Set<string>();
  for(const stop of catalog.routeStops){
    const key=`${stop.routeId}:${stop.order}`;
    if(routeStopKeys.has(key))issues.push(`duplicate route stop ${key}`);
    routeStopKeys.add(key);
    if(!routeIds.has(stop.routeId)||!placeIds.has(stop.placeId))issues.push(`route stop ${key} references an unknown record`);
    for(const id of stop.sourceIds)if(!sourceIds.has(id))issues.push(`route stop ${key} references missing source ${id}`);
  }
  const activityIds=new Set<string>();
  for(const activity of catalog.activities){
    if(activityIds.has(activity.id))issues.push(`duplicate activity id ${activity.id}`);
    activityIds.add(activity.id);
    if(activity.kind==="place-visit"&&(!activity.placeId||!placeIds.has(activity.placeId)))issues.push(`activity ${activity.id} references an unknown place`);
    if(activity.kind==="route"&&(!activity.routeId||!routeIds.has(activity.routeId)))issues.push(`activity ${activity.id} references an unknown route`);
    for(const id of activity.sourceIds)if(!sourceIds.has(id))issues.push(`activity ${activity.id} references missing source ${id}`);
  }
  if(issues.length)throw new Error(`Invalid Jeroam catalog:\n${issues.join("\n")}`);
  return catalog;
}

export const releaseCatalog=validateCatalog(unvalidatedCatalog);

export function getPlace(id:string,catalog:Catalog=releaseCatalog):Place|undefined{return catalog.places.find(place=>place.id===id);}
export function getRoute(id:string,catalog:Catalog=releaseCatalog):CulturalRoute|undefined{return catalog.routes.find(route=>route.id===id);}
export function getSource(id:string,catalog:Catalog=releaseCatalog):Source|undefined{return catalog.sources.find(source=>source.id===id);}
export function getPlacesByCategory(category:PlaceCategory,catalog:Catalog=releaseCatalog):Place[]{return catalog.places.filter(place=>place.category===category);}
export function getPlacesByKind(kind:PlaceKind,catalog:Catalog=releaseCatalog):Place[]{return catalog.places.filter(place=>place.kind===kind);}
export function getSourcesForPlace(place:Place,catalog:Catalog=releaseCatalog):Source[]{return place.sourceIds.map(id=>getSource(id,catalog)).filter((source):source is Source=>Boolean(source));}
export function getImagesForPlace(place:Place,catalog:Catalog=releaseCatalog):Photo[]{return place.imageIds.map(id=>catalog.images[id]).filter((image):image is Photo=>Boolean(image));}
/** Pick imagery that belongs to the route itself or one of its verified stops.
 * A generic Jerusalem panorama is deliberately never substituted for a
 * missing entity image; the UI can render an honest placeholder instead. */
export function routeImage(route:CulturalRoute,catalog:Catalog=releaseCatalog):Photo|undefined{
 const configured=catalog.images[route.imageId];
 if(configured&&route.imageId!=="hero")return configured;
 const stopImage=routePlaces(route,catalog).map(place=>place.imageId?catalog.images[place.imageId]:undefined).find((image):image is Photo=>Boolean(image));
 return stopImage;
}
export function getSourcesForRoute(route:CulturalRoute,catalog:Catalog=releaseCatalog):Source[]{return route.sourceIds.map(id=>getSource(id,catalog)).filter((source):source is Source=>Boolean(source));}
export function getPrimarySourceForPlace(place:Place,catalog:Catalog=releaseCatalog):Source|undefined{return getSource(place.locationSourceId,catalog)??getSourcesForPlace(place,catalog)[0];}
export function getRouteStops(route:CulturalRoute,catalog:Catalog=releaseCatalog):RouteStop[]{return catalog.routeStops.filter(stop=>stop.routeId===route.id).sort((a,b)=>a.order-b.order);}
export function routePlaces(route:CulturalRoute,catalog:Catalog=releaseCatalog):Place[]{return getRouteStops(route,catalog).map(stop=>getPlace(stop.placeId,catalog)).filter((place):place is Place=>Boolean(place));}
export function routeStartPlace(route:CulturalRoute,catalog:Catalog=releaseCatalog):Place|undefined{return getPlace(route.startPlaceId ?? route.stopIds[0] ?? "",catalog) ?? routePlaces(route,catalog)[0];}
export function routeEndPlace(route:CulturalRoute,catalog:Catalog=releaseCatalog):Place|undefined{return getPlace(route.endPlaceId ?? route.stopIds[route.stopIds.length-1] ?? "",catalog) ?? routePlaces(route,catalog).at(-1);}
export function routeCategories(route:CulturalRoute,catalog:Catalog=releaseCatalog):PlaceCategory[]{return route.categories?.length ? route.categories : [...new Set(routePlaces(route,catalog).map(place=>place.category))];}
export function routeInterests(route:CulturalRoute,catalog:Catalog=releaseCatalog):string[]{return route.interests?.length ? route.interests : uniqueIds(routePlaces(route,catalog).flatMap(place=>place.interests));}
export function routeCoordinates(route:CulturalRoute,catalog:Catalog=releaseCatalog):Coordinates[]{return routePlaces(route,catalog).map(place=>place.coordinates);}
export function getActivitiesForPlace(placeId:string,catalog:Catalog=releaseCatalog):TripActivity[]{return catalog.activities.filter(activity=>activity.placeId===placeId);}
export function getActivitiesForRoute(routeId:string,catalog:Catalog=releaseCatalog):TripActivity[]{return catalog.activities.filter(activity=>activity.routeId===routeId);}
export function displayPlaceName(place:Place,locale:string|null|undefined):string{return (locale&&place.localizedNames[locale as keyof typeof place.localizedNames])??place.name;}
export function displayRouteTitle(route:CulturalRoute,locale:string|null|undefined):string{return localizedRouteTitle(route,locale);}
export function routeDescription(route:CulturalRoute,locale:string|null|undefined):string{return localizedRouteDescription(route,locale);}
export function placeSummary(place:Place,locale?:string|null):string{return localizedPlaceSummary(place,locale);}
export function placeDescription(place:Place,locale?:string|null):string{return localizedPlaceDescription(place,locale);}
export function placeFacts(place:Place):Claim[]{return place.factualInformation.length?place.factualInformation:place.claims;}
export function claimText(claim:Claim,locale?:string|null):string{return localizedClaimText(claim,locale);}
export function catalogText(text:string|null|undefined,locale?:string|null):string{return localizeCatalogText(text,locale);}
export function priceLabel(place:Place):string{return place.priceInfo.display ?? "Price not verified";}

export function mapsLink(place:Place){return "https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(place.coordinates.latitude+","+place.coordinates.longitude);}
export function directionsLink(places:Place[]){
  if(!places.length)return "https://www.openstreetmap.org";
  if(places.length===1)return mapsLink(places[0]);
  const point=(place:Place)=>place.coordinates.latitude+","+place.coordinates.longitude;
  const query=new URLSearchParams({api:"1",origin:point(places[0]),destination:point(places[places.length-1]),travelmode:"walking"});
  if(places.length>2)query.set("waypoints",places.slice(1,-1).map(point).join("|"));
  return "https://www.google.com/maps/dir/?"+query;
}
/** Format planning durations with locale-aware numerals and units. The catalog
 * stores minutes as a stable number; presentation belongs at the UI boundary. */
export function formatMinutes(n:number,locale?:string|null){
  const language=locale?.startsWith("ar")?"ar":locale?.startsWith("he")?"he":"en";
  const number=new Intl.NumberFormat(language);
  const units=language==="ar"?{hour:"س",minute:"د"}:language==="he"?{hour:"ש׳",minute:"דק׳"}:{hour:"h",minute:"min"};
  const hours=Math.floor(n/60); const minutes=n%60;
  if(hours)return `${number.format(hours)} ${units.hour}${minutes?` ${number.format(minutes)} ${units.minute}`:""}`;
  return `${number.format(minutes)} ${units.minute}`;
}
/** Format distances at the UI boundary so numerals and units follow the active language. */
export function formatDistanceKm(n:number,locale?:string|null){
 const language=locale?.startsWith("ar")?"ar":locale?.startsWith("he")?"he":"en";
 const value=new Intl.NumberFormat(language,{minimumFractionDigits:1,maximumFractionDigits:1}).format(n);
 return `${value} ${language==="ar"?"كم":language==="he"?"ק״מ":"km"}`;
}
export function clockTime(n:number){return String(Math.floor(n/60)).padStart(2,"0")+":"+String(n%60).padStart(2,"0");}
