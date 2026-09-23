#!/usr/bin/env node
/**
 * Reproducible, provenance-preserving Jerusalem catalog import.
 *
 * Default mode is a dry run. Use `node scripts/ingest-jerusalem.mjs --write`
 * to merge records into data/catalog.json. Existing hand-reviewed records and
 * routes are retained; imported records are identified by their OSM source.
 * The importer intentionally leaves prices, claims and opening hours empty
 * unless the upstream record explicitly supplies them.
 */
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

// The package script runs from the repository root. Keeping paths relative to
// cwd also works in CI and in a Supabase seed/import job on Linux or Windows.
const root = process.cwd();
const catalogPath = path.join(root, "data", "catalog.json");
const reportPath = path.join(root, "data", "ingestion-report.json");
const today = new Date().toISOString().slice(0, 10);
const bbox = process.env.JEROAM_INGEST_BBOX ?? "31.73,35.16,31.83,35.27";
const maxRecords = Number(process.env.JEROAM_INGEST_MAX ?? "300");
const overpassUrl = process.env.JEROAM_OVERPASS_URL ?? "https://overpass-api.de/api/interpreter";
const wikimediaUrl = process.env.JEROAM_WIKIMEDIA_API_URL ?? "https://commons.wikimedia.org/w/api.php";
const write = process.argv.includes("--write");
const pushSupabase = process.argv.includes("--supabase");
const withImages = !process.argv.includes("--no-images") && process.env.JEROAM_INGEST_IMAGES !== "0";
let dataProvider = "OpenStreetMap Overpass";
let dataEndpoint = overpassUrl;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const clean = (value) => typeof value === "string" ? value.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim() : "";
const slug = (value) => clean(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70) || "place";
const normalizedName = (value) => clean(value).toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9א-ת\u0600-\u06ff]+/g, " ").trim();
const number = (value) => Number.isFinite(Number(value)) ? Number(value) : null;
const pointDistanceMeters = (a, b) => {
  const r = 6371000;
  const p1 = a.latitude * Math.PI / 180;
  const p2 = b.latitude * Math.PI / 180;
  const dp = (b.latitude - a.latitude) * Math.PI / 180;
  const dl = (b.longitude - a.longitude) * Math.PI / 180;
  const h = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(h));
};

function sourceFor(element, name, category) {
  const type = element.type;
  const id = String(element.id);
  return {
    id: `osm-${type}-${id}`,
    title: `OpenStreetMap record: ${name}`,
    publisher: "OpenStreetMap contributors",
    url: `https://www.openstreetmap.org/${type}/${id}`,
    accessedAt: today,
    kind: "coordinate",
    lastVerifiedAt: today,
    reliabilityNote: `Coordinate and tagged place classification imported from the OpenStreetMap ${category.toLowerCase()} record; visitor details may change and should be checked at the linked source.`
  };
}

function categoryFor(tags) {
  if (tags.public_transport || tags.railway === "station" || tags.railway === "halt" || tags.railway === "tram_stop" || tags.highway === "bus_stop") return { category: "Transport", label: "transport hub" };
  if (tags.tourism === "museum") return { category: "Museums", label: "museum" };
  if (tags.tourism === "gallery") return { category: "Art", label: "gallery" };
  if (tags.tourism === "viewpoint") return { category: "Viewpoints", label: "viewpoint" };
  if (tags.historic) return { category: "History", label: "historic place" };
  if (tags.amenity === "place_of_worship") return { category: "Religious sites", label: "place of worship" };
  if (tags.amenity === "restaurant" || tags.amenity === "cafe") return { category: "Restaurants", label: tags.amenity };
  if (tags.amenity === "arts_centre" || tags.amenity === "theatre") return { category: "Culture", label: tags.amenity === "theatre" ? "theatre" : "arts centre" };
  if (tags.shop === "market" || tags.shop === "mall" || tags.shop === "supermarket" || tags.amenity === "marketplace") return { category: "Markets", label: "market" };
  if (tags.leisure === "park" || tags.leisure === "garden") return { category: "Parks & public spaces", label: tags.leisure };
  if (tags.tourism === "attraction") return { category: "Culture", label: "attraction" };
  return null;
}

function coordinatesFor(element) {
  const latitude = number(element.lat ?? element.center?.lat);
  const longitude = number(element.lon ?? element.center?.lon);
  if (latitude === null || longitude === null) return null;
  return { latitude, longitude };
}

function addressFor(tags) {
  const parts = [tags["addr:housenumber"], tags["addr:street"], tags["addr:suburb"]].filter(Boolean);
  return parts.length ? parts.join(" ") : null;
}

function importedPlace(element) {
  const tags = element.tags ?? {};
  const name = clean(tags.name || tags["name:en"] || tags["name:he"] || tags["name:ar"]);
  const coordinates = coordinatesFor(element);
  const classified = categoryFor(tags);
  if (!name || !coordinates || !classified) return null;
  const source = sourceFor(element, name, classified.category);
  const aliases = [tags.alt_name, tags.loc_name, tags.official_name].map(clean).filter(Boolean);
  const localizedNames = { en: clean(tags["name:en"]), he: clean(tags["name:he"]), ar: clean(tags["name:ar"]) };
  for (const key of Object.keys(localizedNames)) if (!localizedNames[key]) delete localizedNames[key];
  const tagsForInterests = [classified.category, tags.tourism, tags.historic, tags.amenity, tags.shop, tags.leisure].map(clean).filter(Boolean);
  const address = addressFor(tags);
  const openingHours = clean(tags.opening_hours) || null;
  const wheelchair = clean(tags.wheelchair);
  const accessibility = wheelchair ? { summary: wheelchair === "yes" ? "Wheelchair access is tagged as available in OpenStreetMap." : `Wheelchair access is tagged as ${wheelchair} in OpenStreetMap.`, sourceId: source.id } : null;
  const id = `osm-${element.type}-${element.id}`;
  const factualText = `OpenStreetMap lists “${name}” as a ${classified.label} in Jerusalem.`;
  return {
    id,
    name,
    localizedNames,
    aliases,
    category: classified.category,
    subcategory: clean(tags.tourism || tags.amenity || tags.historic || tags.shop || tags.leisure) || null,
    area: clean(tags["addr:suburb"] || tags["addr:quarter"] || tags["addr:city_district"] || "Jerusalem"),
    interests: [classified.category, ...tagsForInterests].filter((value, index, array) => array.indexOf(value) === index),
    tags: tagsForInterests,
    tagline: `A source-listed ${classified.label} in Jerusalem.`,
    shortDescription: `A source-listed ${classified.label} in Jerusalem. Visitor details should be checked with the linked source.`,
    description: `A source-listed ${classified.label} in Jerusalem. Visitor details should be checked with the linked source.`,
    practicalInformation: [address ? `Address listed by OpenStreetMap: ${address}.` : "Address not listed in the source record.", openingHours ? `Opening hours listed by OpenStreetMap: ${openingHours}.` : "Opening hours are not listed in the source record."].join(" "),
    coordinates,
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    address,
    website: clean(tags.website || tags["contact:website"]) || null,
    phone: clean(tags.phone || tags["contact:phone"]) || null,
    visitMinutes: classified.category === "Transport" ? 10 : classified.category === "Restaurants" ? 60 : 45,
    costType: "unknown",
    estimatedCost: null,
    costSourceId: null,
    openingHours,
    openingHoursSourceId: openingHours ? source.id : null,
    locationSourceId: source.id,
    imageId: null,
    imageIds: [],
    transportRelevance: [],
    relatedPlaceIds: [],
    relatedRouteIds: [],
    claims: [{ id: `${id}-classification`, text: factualText, sourceIds: [source.id], kind: "fact" }],
    sourceIds: [source.id],
    lastVerifiedAt: today,
    accessibility,
    aiStory: null,
    _source: source,
    _element: element
  };
}

async function getJson(url, init) {
  const response = await fetch(url, { ...init, headers: { accept: "application/json", ...(init?.headers ?? {}) } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} from ${url}`);
  return response.json();
}

async function fetchOverpass() {
  const query = `[out:json][timeout:90];(nwr["tourism"~"museum|gallery|attraction|viewpoint"](${bbox});nwr["historic"](${bbox});nwr["amenity"~"place_of_worship|restaurant|cafe|arts_centre|theatre|marketplace"](${bbox});nwr["shop"~"market|mall|supermarket"](${bbox});nwr["leisure"~"park|garden"](${bbox});nwr["public_transport"](${bbox});nwr["railway"~"station|halt|tram_stop"](${bbox});nwr["highway"="bus_stop"](${bbox}););out center tags;`;
  try {
    const data = await getJson(overpassUrl, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", "user-agent": "Jeroam-catalog-import/1.0" }, body: new URLSearchParams({ data: query }), signal: AbortSignal.timeout(90000) });
    return Array.isArray(data.elements) ? data.elements : [];
  } catch (overpassError) {
    // Some networks and public Overpass mirrors reject POST requests. The
    // Nominatim fallback still returns real OSM entities and keeps their
    // object URLs, so the import remains useful and reviewable.
    dataProvider = "OpenStreetMap Nominatim fallback";
    dataEndpoint = "https://nominatim.openstreetmap.org/search";
    const queries = [
      ["museum Jerusalem", { tourism: "museum" }], ["gallery Jerusalem", { tourism: "gallery" }], ["historic place Jerusalem", { historic: "yes" }],
      ["place of worship Jerusalem", { amenity: "place_of_worship" }], ["market Jerusalem", { shop: "market" }], ["restaurant Jerusalem", { amenity: "restaurant" }],
      ["cafe Jerusalem", { amenity: "cafe" }], ["park Jerusalem", { leisure: "park" }], ["garden Jerusalem", { leisure: "garden" }],
      ["viewpoint Jerusalem", { tourism: "viewpoint" }], ["theatre Jerusalem", { amenity: "theatre" }], ["arts centre Jerusalem", { amenity: "arts_centre" }],
      ["railway station Jerusalem", { railway: "station" }], ["light rail stop Jerusalem", { railway: "tram_stop" }], ["bus stop Jerusalem", { highway: "bus_stop" }]
    ];
    const elements = [];
    for (const [search, tags] of queries) {
      const params = new URLSearchParams({ format: "jsonv2", q: search, limit: "50", addressdetails: "1", namedetails: "1", extratags: "1", bounded: "1", viewbox: "35.16,31.83,35.27,31.73" });
      try {
        const rows = await getJson(`https://nominatim.openstreetmap.org/search?${params}`, { headers: { "user-agent": "Jeroam-catalog-import/1.0 (hackathon catalog maintenance)" }, signal: AbortSignal.timeout(20000) });
        for (const row of rows) {
          elements.push({ type: row.osm_type, id: row.osm_id, lat: row.lat, lon: row.lon, tags: {
            ...tags, name: row.name, "name:en": row.namedetails?.["name:en"], "name:he": row.namedetails?.["name:he"], "name:ar": row.namedetails?.["name:ar"],
            "addr:street": row.address?.road || row.address?.pedestrian, "addr:housenumber": row.address?.house_number, "addr:suburb": row.address?.suburb || row.address?.neighbourhood,
            website: row.extratags?.website, phone: row.extratags?.phone, opening_hours: row.extratags?.opening_hours, wheelchair: row.extratags?.wheelchair
          } });
        }
      } catch (error) { console.warn(`Nominatim query skipped (${search}): ${error?.message ?? error}`); }
      await sleep(1100);
    }
    if (!elements.length) throw overpassError;
    return elements;
  }
}

function commonsCandidate(name, data) {
  const pages = Object.values(data?.query?.pages ?? {});
  const page = pages[0];
  const title = clean(page?.title);
  const info = page?.imageinfo?.[0];
  if (!title || !info?.thumburl || !info?.extmetadata) return null;
  const tokens = normalizedName(name).split(" ").filter((token) => token.length > 3);
  const titleText = normalizedName(title);
  if (tokens.length && !tokens.some((token) => titleText.includes(token))) return null;
  const meta = info.extmetadata;
  const author = clean(meta.Artist?.value || meta.Credit?.value) || null;
  const license = clean(meta.LicenseShortName?.value || meta.License?.value) || null;
  const licenseUrl = (clean(meta.LicenseUrl?.value) || "").replace(/^http:\/\//i, "https://") || null;
  return { title, url: info.thumburl, author, license, licenseUrl, sourceUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(title.replaceAll(" ", "_"))}`, altText: clean(meta.ImageDescription?.value) || name };
}

async function findCommonsImage(name) {
  const params = new URLSearchParams({ action: "query", generator: "search", gsrsearch: `${name} Jerusalem`, gsrnamespace: "6", gsrlimit: "1", prop: "imageinfo", iiprop: "url|extmetadata", iiurlwidth: "1200", format: "json", origin: "*" });
  try { return commonsCandidate(name, await getJson(`${wikimediaUrl}?${params}`)); } catch { return null; }
}

async function enrichImages(places, images) {
  let found = 0;
  // Transport nodes and individual food venues often share a landmark name;
  // attaching a landmark photograph to those records would be misleading.
  const sample = places.filter((place) => place.imageId === null && !["Transport", "Restaurants"].includes(place.category)).slice(0, 60);
  for (const place of sample) {
    const candidate = await findCommonsImage(place.name);
    if (candidate && candidate.author && candidate.license && candidate.licenseUrl) {
      const imageId = `commons-${slug(place.name)}-${slug(candidate.title).slice(0, 25)}`;
      images[imageId] = { path: candidate.url, author: candidate.author, license: candidate.license, sourceUrl: candidate.sourceUrl, licenseUrl: candidate.licenseUrl, changes: "Wikimedia Commons thumbnail URL; displayed crops vary." };
      place.imageId = imageId;
      place.imageIds = [imageId];
      place._imageSource = { id: `image-${imageId}`, title: candidate.title, publisher: "Wikimedia Commons", url: candidate.sourceUrl, accessedAt: today, kind: "image", lastVerifiedAt: today, reliabilityNote: "Image metadata and license are read from the Wikimedia Commons file record." };
      place._imageAlt = candidate.altText;
      found++;
    }
    await sleep(125);
  }
  return found;
}

function mergePlace(existing, incoming) {
  const sourceIds = [...new Set([...(existing.sourceIds ?? []), ...(incoming.sourceIds ?? [])])];
  return {
    ...existing,
    localizedNames: { ...(existing.localizedNames ?? {}), ...(incoming.localizedNames ?? {}) },
    aliases: [...new Set([...(existing.aliases ?? []), ...(incoming.aliases ?? [])])],
    coordinates: incoming.coordinates,
    latitude: incoming.latitude,
    longitude: incoming.longitude,
    address: existing.address ?? incoming.address,
    website: existing.website ?? incoming.website,
    phone: existing.phone ?? incoming.phone,
    openingHours: existing.openingHours ?? incoming.openingHours,
    openingHoursSourceId: existing.openingHoursSourceId ?? incoming.openingHoursSourceId,
    accessibility: existing.accessibility ?? incoming.accessibility,
    imageId: existing.imageId ?? incoming.imageId,
    imageIds: [...new Set([...(existing.imageIds ?? []), ...(incoming.imageIds ?? [])])],
    sourceIds,
    claims: existing.claims ?? incoming.claims,
    lastVerifiedAt: today
  };
}

const categoryIds = { "History": "history", "Heritage": "heritage", "Religious sites": "religious-sites", "Culture": "culture", "Markets": "markets", "Food": "food", "Restaurants": "restaurants", "Architecture": "architecture", "Art": "art", "Museums": "museums", "Local experiences": "local-experiences", "Walking": "walking", "Photography": "photography", "Events": "events", "Shopping": "shopping", "Viewpoints": "viewpoints", "Parks & public spaces": "parks-public-spaces", "Transport": "transport" };

async function upsertSupabase(table, rows, key = "id") {
  if (!rows.length) return;
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) throw new Error("--supabase requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the server environment.");
  const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/${table}?on_conflict=${encodeURIComponent(key)}`, { method: "POST", headers: { apikey: serviceKey, authorization: `Bearer ${serviceKey}`, "content-type": "application/json", prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(rows) });
  if (!response.ok) throw new Error(`Supabase ${table} upsert failed: ${response.status} ${await response.text()}`);
}

async function publishSnapshot(catalog) {
  const sources = catalog.sources ?? [];
  const placeById = new Map((catalog.places ?? []).map((place) => [place.id, place]));
  const routeSourceIds = (route) => [...new Set([
    ...(route.sourceIds ?? []),
    ...(route.stopIds ?? []).flatMap((placeId) => placeById.get(placeId)?.sourceIds ?? [])
  ])];
  const activities = catalog.activities ?? [
    ...(catalog.places ?? []).map((place) => ({ id: `visit:${place.id}`, kind: "place-visit", title: place.name, description: place.shortDescription ?? place.tagline, placeId: place.id, durationMinutes: place.visitMinutes, sourceIds: place.sourceIds ?? [] })),
    ...(catalog.routes ?? []).map((route) => ({ id: `route:${route.id}`, kind: "route", title: route.title, description: route.description, routeId: route.id, durationMinutes: route.durationMinutes, sourceIds: route.sourceIds ?? [] }))
  ];
  await upsertSupabase("sources", sources.map((source) => ({ id: source.id, title: source.title, publisher: source.publisher, url: source.url, kind: source.kind ?? "institution", reliability_note: source.reliabilityNote ?? null, accessed_at: source.accessedAt, last_verified_at: source.lastVerifiedAt ?? source.accessedAt, updated_at: new Date().toISOString() })));
  await upsertSupabase("places", catalog.places.map((place) => ({ id: place.id, canonical_name: place.name, category_id: categoryIds[place.category] ?? "culture", subcategory: place.subcategory ?? null, area: place.area, latitude: place.coordinates?.latitude ?? place.latitude, longitude: place.coordinates?.longitude ?? place.longitude, address: place.address ?? null, description: place.description, short_description: place.shortDescription, practical_information: place.practicalInformation ?? null, suggested_visit_minutes: place.visitMinutes, website: place.website ?? null, phone: place.phone ?? null, opening_hours: place.openingHours ?? null, opening_hours_source_id: place.openingHoursSourceId ?? null, price_amount: place.priceInfo?.amount ?? null, price_currency: place.priceInfo?.amount === null ? null : "ILS", price_display: place.priceInfo?.display ?? null, price_source_id: place.priceInfo?.sourceId ?? null, accessibility_summary: place.accessibility?.summary ?? null, accessibility_source_id: place.accessibility?.sourceId ?? null, location_source_id: place.locationSourceId, last_verified_at: place.lastVerifiedAt, status: "published", osm_type: place.id.startsWith("osm-") ? place.id.split("-")[1] : null, osm_id: place.id.startsWith("osm-") ? Number(place.id.split("-").at(-1)) : null })));
  await upsertSupabase("place_localizations", catalog.places.flatMap((place) => Object.entries(place.localizedNames ?? {}).filter(([locale, name]) => ["en", "ar", "he"].includes(locale) && name).map(([locale, name]) => ({ place_id: place.id, locale, name, short_description: place.shortDescription, description: place.description }))), "place_id,locale");
  await upsertSupabase("place_aliases", catalog.places.flatMap((place) => (place.aliases ?? []).map((alias) => ({ place_id: place.id, alias, locale: null }))), "place_id,alias");
  await upsertSupabase("place_tags", catalog.places.flatMap((place) => (place.tags ?? []).map((tag) => ({ place_id: place.id, tag }))), "place_id,tag");
  await upsertSupabase("place_sources", catalog.places.flatMap((place) => (place.sourceIds ?? []).map((sourceId) => ({ place_id: place.id, source_id: sourceId, supports: "Catalog record or source-backed claim", is_primary: sourceId === place.locationSourceId }))), "place_id,source_id");
  await upsertSupabase("factual_claims", catalog.places.flatMap((place) => (place.claims ?? []).map((claim) => ({ id: claim.id, place_id: place.id, claim: claim.text, claim_kind: claim.kind === "interpretation" ? "interpretation" : "fact" }))));
  await upsertSupabase("claim_sources", catalog.places.flatMap((place) => (place.claims ?? []).flatMap((claim) => (claim.sourceIds ?? []).map((sourceId) => ({ claim_id: claim.id, source_id: sourceId })))), "claim_id,source_id");
  const sourceByUrl = new Map(sources.map((source) => [source.url, source]));
  await upsertSupabase("place_images", catalog.places.flatMap((place) => (place.imageIds ?? []).map((imageId, sortOrder) => { const image = catalog.images?.[imageId]; const source = image && sourceByUrl.get(image.sourceUrl); return image && source ? { id: imageId, place_id: place.id, url: image.path, alt_text: place.name, creator: image.author, license: image.license, license_url: image.licenseUrl, source_url: image.sourceUrl, source_id: source.id, sort_order: sortOrder, last_verified_at: place.lastVerifiedAt } : null; }).filter(Boolean)));
  await upsertSupabase("routes", catalog.routes.map((route) => ({ id: route.id, title: route.title, description: route.description, theme: route.theme, difficulty: route.difficulty, difficulty_note: route.difficultyNote, duration_minutes: route.durationMinutes, distance_km: route.distanceKm, distance_kind: route.distanceKind ?? (route.distanceKm == null ? "unavailable" : "straight-line-estimate"), family_suitability: route.familySuitability ?? "not-assessed", areas: route.areas ?? [], source_backed_reason: route.sourceBackedReason ?? null, image_id: route.imageId, start_place_id: route.startPlaceId ?? route.stopIds?.[0] ?? null, end_place_id: route.endPlaceId ?? route.stopIds?.at(-1) ?? null, last_verified_at: route.lastVerifiedAt ?? catalog.version, status: "published" })));
  await upsertSupabase("route_images", catalog.routes.flatMap((route) => {
    const image = catalog.images?.[route.imageId];
    const source = image && sourceByUrl.get(image.sourceUrl);
    return image && source ? [{ route_id: route.id, image_id: route.imageId, url: image.path, alt_text: route.title, creator: image.author, license: image.license, license_url: image.licenseUrl, source_url: image.sourceUrl, source_id: source.id, sort_order: 0, last_verified_at: route.lastVerifiedAt ?? catalog.version }] : [];
  }), "route_id,image_id");
  await upsertSupabase("route_localizations", catalog.routes.flatMap((route) => Object.entries(route.localizedTitles ?? {}).filter(([locale, title]) => ["en", "ar", "he"].includes(locale) && title).map(([locale, title]) => ({ route_id: route.id, locale, title, description: route.localizedDescriptions?.[locale] ?? route.description }))), "route_id,locale");
  await upsertSupabase("route_stops", catalog.routes.flatMap((route) => route.stopIds.map((placeId, index) => ({ route_id: route.id, place_id: placeId, stop_order: index + 1, stop_duration_minutes: catalog.places.find((place) => place.id === placeId)?.visitMinutes ?? null, prompt: route.prompts?.[index] ?? null }))));
  await upsertSupabase("route_sources", catalog.routes.flatMap((route) => routeSourceIds(route).map((sourceId) => ({ route_id: route.id, source_id: sourceId, supports: "Route stop sequence and source-backed place records" }))), "route_id,source_id");
  await upsertSupabase("activities", activities.map((activity) => ({ id: activity.id, kind: activity.kind, title: activity.title, description: activity.description, place_id: activity.placeId ?? null, route_id: activity.routeId ?? null, duration_minutes: activity.durationMinutes, last_verified_at: catalog.version, status: "published" })));
  await upsertSupabase("activity_sources", activities.flatMap((activity) => (activity.sourceIds ?? []).map((sourceId) => ({ activity_id: activity.id, source_id: sourceId }))), "activity_id,source_id");
}

async function main() {
  const rawCatalog = JSON.parse(await fs.readFile(catalogPath, "utf8"));
  const existingPlaces = Array.isArray(rawCatalog.places) ? rawCatalog.places : [];
  const images = rawCatalog.images ?? {};
  let elements;
  try { elements = await fetchOverpass(); } catch (error) {
    const report = { runAt: new Date().toISOString(), status: "failed", provider: dataProvider, endpoint: dataEndpoint, error: String(error?.message ?? error), existingPlaceCount: existingPlaces.length };
    await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
    console.error(`Overpass import failed: ${report.error}`);
    process.exitCode = 1;
    return;
  }
  const candidates = elements.map(importedPlace).filter(Boolean);
  const unique = [];
  const seen = new Set();
  for (const place of candidates) {
    const key = normalizedName(place.name);
    if (!key || seen.has(key)) continue;
    seen.add(key); unique.push(place);
    if (unique.length >= maxRecords) break;
  }
  const imageCount = withImages ? await enrichImages(unique, images) : 0;
  const merged = [...existingPlaces];
  let imported = 0;
  let updated = 0;
  const sourceMap = new Map((rawCatalog.sources ?? []).map((source) => [source.id, source]));
  for (const incoming of unique) {
    const existingIndex = merged.findIndex((place) => place.id === incoming.id || normalizedName(place.name) === normalizedName(incoming.name) || (place.latitude && pointDistanceMeters({ latitude: place.latitude, longitude: place.longitude }, incoming.coordinates) < 35));
    sourceMap.set(incoming._source.id, incoming._source);
    if (incoming._imageSource) sourceMap.set(incoming._imageSource.id, incoming._imageSource);
    const serializable = { ...incoming }; delete serializable._source; delete serializable._element; delete serializable._imageSource; delete serializable._imageAlt;
    if (incoming._imageSource) serializable.sourceIds = [...new Set([...serializable.sourceIds, incoming._imageSource.id])];
    if (existingIndex >= 0) { merged[existingIndex] = mergePlace(merged[existingIndex], serializable); updated++; }
    else { merged.push(serializable); imported++; }
  }
  // Existing hand-reviewed images predate the importer and may not yet have
  // a first-class source row. Ensure every retained asset can be traced to its
  // original file page when the snapshot is rebuilt.
  const sourceUrls = new Set([...sourceMap.values()].map((source) => source.url));
  for (const [imageId, image] of Object.entries(images)) {
    if (!image?.sourceUrl || sourceUrls.has(image.sourceUrl)) continue;
    sourceMap.set(`image-${imageId}`, { id: `image-${imageId}`, title: `Image asset: ${imageId}`, publisher: "Wikimedia Commons", url: image.sourceUrl, accessedAt: today, kind: "image", lastVerifiedAt: today, reliabilityNote: "Image metadata and license are recorded on the original Wikimedia Commons file page." });
    sourceUrls.add(image.sourceUrl);
  }
  const report = {
    runAt: new Date().toISOString(), status: "completed", mode: write ? "write" : "dry-run", provider: dataProvider, endpoint: dataEndpoint,
    bbox, recordsSeen: elements.length, candidates: unique.length, imported, updated, existingPlaceCount: existingPlaces.length, resultingPlaceCount: write ? merged.length : existingPlaces.length + imported,
    imageLookup: withImages ? "Wikimedia Commons exact-name candidates" : "disabled", imagesFound: imageCount,
    categories: Object.fromEntries([...new Set(unique.map((place) => place.category))].map((category) => [category, unique.filter((place) => place.category === category).length])),
    note: "Imported descriptions are conservative classifications from tagged OpenStreetMap records. No prices, ratings, reviews or historical claims are inferred."
  };
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  if (write) {
    rawCatalog.version = today;
    rawCatalog.sources = [...sourceMap.values()];
    rawCatalog.images = images;
    rawCatalog.places = merged;
    await fs.writeFile(catalogPath, `${JSON.stringify(rawCatalog, null, 2)}\n`);
    if (pushSupabase) await publishSnapshot(rawCatalog);
  } else if (pushSupabase) {
    throw new Error("--supabase can only publish a snapshot together with --write.");
  }
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
