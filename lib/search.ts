import {
  displayPlaceName,
  getRouteStops,
  placeSummary,
  routeDescription,
  displayRouteTitle,
  routeCategories,
  routeInterests,
} from "@/lib/catalog";
import { interests as interestTaxonomy } from "@/lib/contracts";
import type { Catalog, CostType, PlaceCategory } from "@/lib/contracts";

/** The records a visitor can discover from the unified search surface. */
export type SearchKind = "place" | "route" | "category" | "interest" | "activity";

export type SearchFilterKind = SearchKind | "all";

export type SearchResult = {
  id: string;
  kind: SearchKind;
  title: string;
  canonicalTitle: string;
  description: string;
  category: PlaceCategory | null;
  area: string | null;
  tags: string[];
  durationMinutes: number | null;
  costType: CostType | null;
  costDisplay: string | null;
  imageId: string | null;
  sourceIds: string[];
  href: string;
  placeId?: string;
  routeId?: string;
  /** Stable searchable corpus. It includes canonical and localized labels. */
  searchText: string;
  score?: number;
};

export type SearchOptions = {
  query?: string;
  kind?: SearchFilterKind;
  category?: string;
  interest?: string;
  area?: string;
  cost?: CostType | "";
  maxMinutes?: number | "";
};

type Translate = (key: string, vars?: Record<string, string | number>) => string;

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .trim();
}

function scoreText(text: string, query: string, kind: SearchKind) {
  if (!query) return kind === "place" ? 4 : kind === "route" ? 3 : 1;
  const value = normalize(text);
  const needle = normalize(query);
  if (!needle || !value.includes(needle)) return -1;
  const words = value.split(/\s+/);
  const kindWeight = kind === "place" ? 8 : kind === "route" ? 5 : kind === "activity" ? 2 : 0;
  if (value === needle) return 100 + kindWeight;
  if (words.some(word => word.startsWith(needle))) return 80 + kindWeight;
  if (value.startsWith(needle)) return 70 + kindWeight;
  // Taxonomy labels are useful suggestions, but real places/routes should lead.
  return kind === "place" ? 50 : kind === "route" ? 44 : kind === "activity" ? 22 : 16;
}

function categoryLabel(category: string, translate?: Translate) {
  return translate?.(`category.${category}`) ?? category;
}

function interestLabel(interest: string, translate?: Translate) {
  return translate?.(`interest.${interest}`) ?? interest;
}

/**
 * Build a search index from the normalized Jeroam catalog. This is intentionally
 * pure and client-safe: a future API adapter can provide the same SearchResult
 * records without changing the UI.
 */
export function buildSearchIndex(catalog: Catalog, translate?: Translate, locale?: string | null): SearchResult[] {
  const places: SearchResult[] = catalog.places.map(place => {
    const title = displayPlaceName(place, "en");
    const localized = Object.values(place.localizedNames ?? {}).filter(Boolean).join(" ");
    const category = place.category;
    return {
      id: place.id,
      kind: "place",
      title,
      canonicalTitle: place.name,
      description: placeSummary(place, locale),
      category,
      area: place.area,
      tags: [...place.tags, ...place.interests],
      durationMinutes: place.visitMinutes,
      costType: place.costType,
      costDisplay: place.priceInfo.display,
      imageId: place.imageId,
      sourceIds: place.sourceIds,
      href: `/places/${place.id}`,
      placeId: place.id,
      searchText: [place.name, localized, place.shortDescription, place.description, place.area, category, ...place.tags, ...place.interests].join(" "),
    };
  });

  const routes: SearchResult[] = catalog.routes.map(route => {
    const title = displayRouteTitle(route, locale);
    const stops = getRouteStops(route, catalog);
    const placesInRoute = stops.map(stop => catalog.places.find(place => place.id === stop.placeId)).filter((place): place is Catalog["places"][number] => Boolean(place));
    const routePlaceNames = placesInRoute.flatMap(place => [place.name, ...Object.values(place.localizedNames ?? {})]);
    const categories = routeCategories(route, catalog);
    const interests = routeInterests(route, catalog);
    const localized = Object.values(route.localizedTitles ?? {}).filter(Boolean).join(" ");
    return {
      id: route.id,
      kind: "route",
      title,
      canonicalTitle: route.title,
      description: routeDescription(route, locale),
      category: categories[0] ?? null,
      area: null,
      tags: [...categories, ...interests],
      durationMinutes: route.durationMinutes,
      costType: null,
      costDisplay: null,
      imageId: route.imageId,
      sourceIds: route.sourceIds,
      href: `/routes/${route.id}`,
      routeId: route.id,
      searchText: [route.title, localized, route.description, route.theme, ...categories, ...interests, ...routePlaceNames].join(" "),
    };
  });

  const usedCategories = [...new Set([...catalog.places.map(place => place.category), ...catalog.routes.flatMap(route => routeCategories(route, catalog))])];
  const categories: SearchResult[] = usedCategories.map(category => {
    const label = categoryLabel(category, translate);
    return {
      id: `category:${category}`,
      kind: "category",
      title: label,
      canonicalTitle: category,
      description: translate?.("search.browseCategory", { category: label }) ?? `Browse ${label}`,
      category,
      area: null,
      tags: [category],
      durationMinutes: null,
      costType: null,
      costDisplay: null,
      imageId: null,
      sourceIds: [],
      href: `/explore?category=${encodeURIComponent(category)}`,
      searchText: [category, label].join(" "),
    };
  });

  const usedInterests = [...new Set([...catalog.places.flatMap(place => place.interests), ...catalog.routes.flatMap(route => routeInterests(route, catalog))])].filter(interest => (interestTaxonomy as readonly string[]).includes(interest));
  const interests: SearchResult[] = usedInterests.map(interest => {
    const label = interestLabel(interest, translate);
    return {
      id: `interest:${interest}`,
      kind: "interest",
      title: label,
      canonicalTitle: interest,
      description: translate?.("search.browseInterest", { interest: label }) ?? `Places and routes for ${label}`,
      category: null,
      area: null,
      tags: [interest],
      durationMinutes: null,
      costType: null,
      costDisplay: null,
      imageId: null,
      sourceIds: [],
      href: `/explore?interest=${encodeURIComponent(interest)}`,
      searchText: [interest, label].join(" "),
    };
  });

  const activities: SearchResult[] = catalog.activities.map(activity => {
    const place = activity.placeId ? catalog.places.find(item => item.id === activity.placeId) : undefined;
    const route = activity.routeId ? catalog.routes.find(item => item.id === activity.routeId) : undefined;
    const target = place ?? route;
    const title = place ? displayPlaceName(place, locale) : route ? displayRouteTitle(route, locale) : activity.title;
    const localized = place ? Object.values(place.localizedNames ?? {}).filter(Boolean).join(" ") : route ? Object.values(route.localizedTitles ?? {}).filter(Boolean).join(" ") : "";
    return {
      id: activity.id,
      kind: "activity",
      title,
      canonicalTitle: activity.title,
      description: place ? placeSummary(place, locale) : route ? routeDescription(route, locale) : activity.description,
      category: place?.category ?? (route ? routeCategories(route, catalog)[0] ?? null : null),
      area: place?.area ?? null,
      tags: target ? place ? [...place.tags, ...place.interests] : [...routeCategories(route!, catalog), ...routeInterests(route!, catalog)] : [],
      durationMinutes: activity.durationMinutes,
      costType: place?.costType ?? null,
      costDisplay: place?.priceInfo.display ?? null,
      imageId: place?.imageId ?? route?.imageId ?? null,
      sourceIds: activity.sourceIds,
      href: place ? `/places/${place.id}` : route ? `/routes/${route.id}` : "/explore",
      placeId: place?.id,
      routeId: route?.id,
      searchText: [activity.title, title, localized, activity.description, place?.area, place?.category, route?.theme].filter(Boolean).join(" "),
    };
  });

  return [...places, ...routes, ...categories, ...interests, ...activities];
}

export function searchCatalog(catalog: Catalog, options: SearchOptions = {}, translate?: Translate, locale?: string | null) {
  const query = options.query?.trim() ?? "";
  return buildSearchIndex(catalog, translate, locale)
    .filter(result => options.kind && options.kind !== "all" ? result.kind === options.kind : true)
    .filter(result => options.category ? result.category === options.category || result.tags.includes(options.category) : true)
    .filter(result => options.interest ? result.tags.includes(options.interest) : true)
    .filter(result => options.area ? result.area === options.area : true)
    .filter(result => options.cost ? result.costType === options.cost : true)
    .filter(result => options.maxMinutes ? result.durationMinutes !== null && result.durationMinutes <= options.maxMinutes : true)
    .map(result => ({ ...result, score: scoreText(result.searchText, query, result.kind) }))
    .filter(result => result.score !== -1)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || a.title.localeCompare(b.title));
}

export function searchSuggestions(catalog: Catalog, query: string, translate?: Translate, limit = 6, locale?: string | null) {
  return searchCatalog(catalog, { query }, translate, locale).slice(0, limit);
}

export function readRecentSearches(limit = 6) {
  try {
    const raw = window.localStorage.getItem("jeroam-searches");
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string" && Boolean(value.trim())).slice(0, limit) : [];
  } catch {
    return [];
  }
}

export function rememberSearch(query: string, limit = 6) {
  const value = query.trim();
  if (!value) return readRecentSearches(limit);
  const next = [value, ...readRecentSearches(limit).filter(item => normalize(item) !== normalize(value))].slice(0, limit);
  try { window.localStorage.setItem("jeroam-searches", JSON.stringify(next)); } catch { /* optional browser storage */ }
  return next;
}

export function clearRecentSearches() {
  try { window.localStorage.removeItem("jeroam-searches"); } catch { /* optional browser storage */ }
}


