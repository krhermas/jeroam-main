#!/usr/bin/env node
/** Fast integrity checks for the local release snapshot. This intentionally
 * validates provenance and coordinate sanity without claiming completeness. */
import fs from "node:fs/promises";
import process from "node:process";

const catalog = JSON.parse(await fs.readFile("data/catalog.json", "utf8"));
const errors = [];
const sources = new Map((catalog.sources ?? []).map((source) => [source.id, source]));
const places = new Map();
const inJerusalem = (latitude, longitude) => latitude >= 31.70 && latitude <= 31.90 && longitude >= 35.10 && longitude <= 35.35;
const validDate = (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value) && !Number.isNaN(Date.parse(value));

for (const source of catalog.sources ?? []) {
  if (sources.get(source.id) !== source) errors.push(`duplicate source id ${source.id}`);
  if (!/^https:\/\//.test(source.url ?? "")) errors.push(`source ${source.id} must use https`);
  if (!validDate(source.accessedAt)) errors.push(`source ${source.id} has no valid accessedAt`);
}
for (const [id, image] of Object.entries(catalog.images ?? {})) {
  if (!image.path || !image.author || !image.license || !/^https:\/\//.test(image.sourceUrl ?? "") || !/^https:\/\//.test(image.licenseUrl ?? "")) errors.push(`image ${id} is missing credit/license metadata`);
}
for (const place of catalog.places ?? []) {
  if (places.has(place.id)) errors.push(`duplicate place id ${place.id}`);
  places.set(place.id, place);
  if (!inJerusalem(Number(place.latitude), Number(place.longitude))) errors.push(`place ${place.id} is outside the Jerusalem validation bbox`);
  if (!place.locationSourceId || !sources.has(place.locationSourceId)) errors.push(`place ${place.id} has no location source`);
  if (!validDate(place.lastVerifiedAt ?? catalog.version)) errors.push(`place ${place.id} has no valid lastVerifiedAt`);
  for (const sourceId of place.sourceIds ?? []) if (!sources.has(sourceId)) errors.push(`place ${place.id} references missing source ${sourceId}`);
  for (const imageId of [place.imageId, ...(place.imageIds ?? [])].filter(Boolean)) if (!catalog.images?.[imageId]) errors.push(`place ${place.id} references missing image ${imageId}`);
  for (const claim of [...(place.claims ?? []), ...(place.factualInformation ?? [])]) {
    if (!claim.sourceIds?.length) errors.push(`claim ${claim.id} has no source`);
    for (const sourceId of claim.sourceIds ?? []) if (!sources.has(sourceId)) errors.push(`claim ${claim.id} references missing source ${sourceId}`);
  }
  if (place.openingHours && (!place.openingHoursSourceId || !sources.has(place.openingHoursSourceId))) errors.push(`place ${place.id} has unsourced opening hours`);
  if (place.priceInfo?.amount !== null && place.priceInfo?.amount !== undefined && (!place.priceInfo.sourceId || !sources.has(place.priceInfo.sourceId))) errors.push(`place ${place.id} has unsourced price`);
}
const routeSignatures = new Set();
for (const route of catalog.routes ?? []) {
  const signature = (route.stopIds ?? []).join("|");
  if (!route.title || !route.description) errors.push(`route ${route.id} is missing title or description`);
  if (!route.localizedTitles?.en) errors.push(`route ${route.id} is missing an English title`);
  if (!route.localizedDescriptions?.en) errors.push(`route ${route.id} is missing an English description`);
  if (!Array.isArray(route.stopIds) || route.stopIds.length < 2) errors.push(`route ${route.id} needs at least two ordered stops`);
  if (route.startPlaceId !== route.stopIds?.[0]) errors.push(`route ${route.id} has an invalid start place`);
  if (route.endPlaceId !== route.stopIds?.at(-1)) errors.push(`route ${route.id} has an invalid end place`);
  if (!Array.isArray(route.coordinates) || route.coordinates.length !== route.stopIds.length) errors.push(`route ${route.id} has incomplete map geometry`);
  if (!Array.isArray(route.prompts) || route.prompts.length !== route.stopIds.length) errors.push(`route ${route.id} needs one stop prompt per ordered stop`);
  if (routeSignatures.has(signature)) errors.push(`duplicate route sequence ${route.id}`);
  routeSignatures.add(signature);
  for (const placeId of route.stopIds ?? []) if (!places.has(placeId)) errors.push(`route ${route.id} references missing place ${placeId}`);
  if (!catalog.images?.[route.imageId]) errors.push(`route ${route.id} references missing image ${route.imageId}`);
  const routeImage = catalog.images?.[route.imageId];
  if (routeImage && ![...sources.values()].some((source) => source.url === routeImage.sourceUrl)) errors.push(`route ${route.id} image has no matching source record`);
  if (!route.sourceBackedReason) errors.push(`route ${route.id} is missing a source-backed route note`);
  if (route.distanceKm !== null && route.distanceKm !== undefined && !["straight-line-estimate", "measured-walk"].includes(route.distanceKind)) errors.push(`route ${route.id} needs an explicit distance kind`);
  for (const placeId of route.stopIds ?? []) { const place = places.get(placeId); if (place && (!Number.isFinite(Number(place.latitude)) || !Number.isFinite(Number(place.longitude)))) errors.push(`route ${route.id} has an invalid map marker for ${placeId}`); }
  for (const coordinate of route.coordinates ?? []) if (!inJerusalem(Number(coordinate.latitude), Number(coordinate.longitude))) errors.push(`route ${route.id} has a map point outside the Jerusalem validation bbox`);
  for (const sourceId of route.sourceIds ?? []) if (!sources.has(sourceId)) errors.push(`route ${route.id} references missing source ${sourceId}`);
}

const categories = Object.fromEntries([...new Set((catalog.places ?? []).map((place) => place.category))].sort().map((category) => [category, (catalog.places ?? []).filter((place) => place.category === category).length]));
const sample = Object.fromEntries(Object.keys(categories).map((category) => [category, (catalog.places ?? []).find((place) => place.category === category)?.id ?? null]));
const result = { version: catalog.version, places: catalog.places?.length ?? 0, routes: catalog.routes?.length ?? 0, sources: catalog.sources?.length ?? 0, images: Object.keys(catalog.images ?? {}).length, categories, representativeSample: sample, errors };
console.log(JSON.stringify(result, null, 2));
if (errors.length) process.exitCode = 1;
