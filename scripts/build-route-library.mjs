#!/usr/bin/env node
/**
 * Builds the curated route layer from the verified local place catalog. Route
 * copy describes the editorial connection between source-backed places; it
 * does not add historical claims. Distances are geodesic map estimates and
 * are explicitly labelled as such in route metadata/UI.
 */
import fs from "node:fs";

const catalogPath = "data/catalog.json";
const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
const places = new Map(catalog.places.map((place) => [place.id, place]));
const placeSourceIds = (place) => [...new Set([
  ...(place.sourceIds ?? []),
  place.locationSourceId,
  place.costSourceId,
  place.openingHoursSourceId,
  place.accessibility?.sourceId,
  ...(place.claims ?? []).flatMap((claim) => claim.sourceIds ?? [])
].filter(Boolean))];
const earthRadiusKm = 6371;
const straightLineKm = (a, b) => {
  const p1 = a.latitude * Math.PI / 180;
  const p2 = b.latitude * Math.PI / 180;
  const dp = (b.latitude - a.latitude) * Math.PI / 180;
  const dl = (b.longitude - a.longitude) * Math.PI / 180;
  const h = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return earthRadiusKm * 2 * Math.asin(Math.sqrt(h));
};

const routeSpecs = [
  { id: "gates-and-quarters", title: "Gates and quarters", theme: "History & heritage", difficulty: "Moderate", durationMinutes: 190, imageId: "commons-place-file-pikiwiki-israel-928-", familySuitability: "possible", description: "A north-to-west sequence through Jerusalem’s historic gates and the Old City streets between them.", stops: ["damascus-gate", "osm-node-561085431", "jaffa-gate", "the-cardo", "osm-node-29944308"] },
  { id: "christian-heritage-walk", title: "Christian heritage walk", theme: "Christian heritage", difficulty: "Moderate", durationMinutes: 240, imageId: "hero", familySuitability: "possible", description: "A source-backed sequence connecting the Holy Sepulchre with Christian institutions north of the Old City.", stops: ["holy-sepulchre", "osm-node-648666161", "osm-node-679212724", "osm-node-679219193"] },
  { id: "mosques-and-city-gates", title: "Mosques and city gates", theme: "Islamic heritage", difficulty: "Moderate", durationMinutes: 185, imageId: "commons-place-file-pikiwiki-israel-928-", familySuitability: "possible", description: "An Old City walk linking source-listed gates and neighborhood mosques. Open each stop to check its original record before visiting.", stops: ["damascus-gate", "osm-node-893970934", "osm-node-291872774", "osm-node-685482623", "osm-node-29944308"] },
  { id: "jewish-quarter-archaeology", title: "Jewish Quarter archaeology", theme: "Archaeology & history", difficulty: "Moderate", durationMinutes: 225, imageId: "tower", familySuitability: "possible", description: "A compact Old City sequence pairing the citadel, the Cardo, the Burnt House and a view toward the Western Wall.", stops: ["jaffa-gate", "tower-of-david", "the-cardo", "osm-node-561134517", "osm-node-321745309"] },
  { id: "old-city-museums-and-streets", title: "Old City museums and streets", theme: "Museums & culture", difficulty: "Moderate", durationMinutes: 300, imageId: "tower", familySuitability: "possible", description: "A museum-led walk from the Old City entrance through source-listed historic streets and city-center collections.", stops: ["tower-of-david", "the-cardo", "osm-node-561134517", "osm-node-1704024840", "osm-node-1708075358"] },
  { id: "museums-and-modern-history", title: "Museums and modern history", theme: "Museums & culture", difficulty: "Moderate", durationMinutes: 315, imageId: "shrine", familySuitability: "possible", description: "A west-to-center sequence connecting national memory sites and museums with source records for each stop.", stops: ["osm-node-278473196", "shrine-of-book", "osm-node-712772918", "osm-node-560652053"] },
  { id: "city-center-culture", title: "City-center culture", theme: "Art & music", difficulty: "Easy", durationMinutes: 250, imageId: "hero", familySuitability: "good-fit", description: "A central Jerusalem arts sequence linking galleries, music and cultural institutions within the city center.", stops: ["osm-node-561370169", "osm-node-1704024840", "osm-node-560652056", "osm-node-559897725"] },
  { id: "market-and-music", title: "Market and music", theme: "Food & culture", difficulty: "Easy", durationMinutes: 220, imageId: "market", familySuitability: "good-fit", description: "Start at Mahane Yehuda, then continue to source-listed music and cultural venues in the city center.", stops: ["mahane-yehuda", "osm-node-1704024840", "osm-node-1708075358", "osm-node-560652056"] },
  { id: "yemin-moshe-and-sultan-pool", title: "Yemin Moshe and Sultan’s Pool", theme: "Architecture & photography", difficulty: "Moderate", durationMinutes: 190, imageId: "commons-place-file-jpg", familySuitability: "possible", description: "A south-western walk through the windmill, a music center, Sultan’s Pool and the Old City’s western entrance.", stops: ["montefiore-windmill", "osm-node-560527367", "osm-node-685560981", "jaffa-gate"] },
  { id: "jerusalem-ridge-views", title: "Jerusalem ridge views", theme: "Views & photography", difficulty: "Challenging", durationMinutes: 320, imageId: "commons-place-file-jpg", familySuitability: "possible", description: "A longer south-to-center route connecting source-listed viewpoints and public spaces with a western Old City finish.", stops: ["osm-node-562633299", "osm-node-1556348956", "montefiore-windmill", "osm-node-1390118219", "osm-node-321745309"] },
  { id: "family-day-of-discovery", title: "Family day of discovery", theme: "Family discovery", difficulty: "Moderate", durationMinutes: 420, imageId: "shrine", familySuitability: "good-fit", description: "A full-day option combining a hands-on museum, a manuscript collection, a public garden and a market setting.", stops: ["osm-node-561323050", "shrine-of-book", "osm-node-798116783", "mahane-yehuda"] },
  { id: "modern-jerusalem-ideas", title: "Modern Jerusalem ideas", theme: "Modern Jerusalem", difficulty: "Moderate", durationMinutes: 300, imageId: "commons-place-file-pikiwiki-israel-427-", familySuitability: "possible", description: "A west-of-center sequence connecting source-listed national, civic and cultural institutions.", stops: ["osm-node-278473196", "osm-node-712772918", "osm-node-560652053", "osm-node-560652056"] },
  { id: "markets-and-food-stops", title: "Markets and food stops", theme: "Food & culture", difficulty: "Easy", durationMinutes: 225, imageId: "market", familySuitability: "good-fit", description: "A source-listed market and city-center food sequence. Individual venues can change, so check their own source records before visiting.", stops: ["mahane-yehuda", "osm-node-561070672", "osm-node-560652028", "osm-node-560715129"] }
];

function routeDistance(stopIds) {
  let total = 0;
  for (let i = 1; i < stopIds.length; i++) {
    const a = places.get(stopIds[i - 1]);
    const b = places.get(stopIds[i]);
    if (a && b) total += straightLineKm({ latitude: a.latitude, longitude: a.longitude }, { latitude: b.latitude, longitude: b.longitude });
  }
  return Number(total.toFixed(1));
}

function enrichRoute(route) {
  const stopPlaces = (route.stopIds ?? []).map((id) => places.get(id)).filter(Boolean);
  const unique = (values) => [...new Set(values.filter(Boolean))];
  const distanceKm = route.distanceKm ?? (route.stopIds?.length > 1 ? routeDistance(route.stopIds) : null);
  return {
    ...route,
    localizedTitles: { en: route.title, ...(route.localizedTitles ?? {}) },
    localizedDescriptions: { en: route.description, ...(route.localizedDescriptions ?? {}) },
    categories: route.categories?.length ? route.categories : unique(stopPlaces.map((place) => place.category)),
    interests: route.interests?.length ? route.interests : unique(stopPlaces.flatMap((place) => place.interests ?? [])),
    areas: route.areas?.length ? route.areas : unique(stopPlaces.map((place) => place.area)),
    coordinates: route.coordinates?.length ? route.coordinates : stopPlaces.map((place) => ({ latitude: place.latitude, longitude: place.longitude })),
    startPlaceId: route.startPlaceId ?? route.stopIds?.[0] ?? null,
    endPlaceId: route.endPlaceId ?? route.stopIds?.at(-1) ?? null,
    distanceKm,
    distanceKind: route.distanceKind && route.distanceKind !== "unavailable" ? route.distanceKind : (distanceKm == null ? "unavailable" : "straight-line-estimate"),
    familySuitability: route.familySuitability ?? "not-assessed",
    sourceIds: unique([...(route.sourceIds ?? []), ...stopPlaces.flatMap(placeSourceIds)]),
    sourceBackedReason: route.sourceBackedReason ?? "Stops are linked to the Jeroam catalog; the sequence is an editorial planning suggestion, not an operator-run tour."
  };
}

const validSpecs = routeSpecs.filter((spec) => {
  const missing = spec.stops.filter((id) => !places.has(id));
  if (missing.length) { console.warn(`Skipping ${spec.id}; missing place ids: ${missing.join(", ")}`); return false; }
  if (!catalog.images?.[spec.imageId]) { console.warn(`Skipping ${spec.id}; missing image ${spec.imageId}`); return false; }
  return true;
});
const newRoutes = validSpecs.map((spec) => ({
  id: spec.id,
  title: spec.title,
  localizedTitles: { en: spec.title },
  description: spec.description,
  theme: spec.theme,
  difficulty: spec.difficulty,
  difficultyNote: `Planning assessment: allow for uneven paving, slopes and steps where relevant. Step-free access has not been verified. Distance is a straight-line map estimate from verified stop coordinates; actual walking distance may be longer.`,
  durationMinutes: spec.durationMinutes,
  distanceKm: routeDistance(spec.stops),
  distanceKind: "straight-line-estimate",
  imageId: spec.imageId,
  stopIds: spec.stops,
  sourceIds: [],
  intro: null,
  prompts: spec.stops.map((id) => `Pause here and open the source-backed place record for ${places.get(id).name}.`),
  familySuitability: spec.familySuitability,
  sourceBackedReason: "Stops are linked to the Jeroam catalog; the sequence is an editorial planning suggestion, not an operator-run tour.",
  lastVerifiedAt: catalog.version
}));

const existingIds = new Set(newRoutes.map((route) => route.id));
const existingRoutes = catalog.routes.filter((route) => !existingIds.has(route.id)).map(enrichRoute);
catalog.routes = [...existingRoutes, ...newRoutes.map(enrichRoute)];
fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(JSON.stringify({ addedRoutes: newRoutes.length, totalRoutes: catalog.routes.length, routes: newRoutes.map((route) => ({ id: route.id, stops: route.stopIds.length, distanceKm: route.distanceKm, imageId: route.imageId })) }, null, 2));
