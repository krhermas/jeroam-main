import type { Catalog, CulturalRoute, Place, Preferences } from "./contracts";

/** Transparent, deterministic recommendation signals used by every surface. */
export type PreferenceMatch = "interest" | "budget" | "traveler" | "style" | "transport" | "accessibility";

export function placePreferenceMatches(place: Place, preferences: Preferences): PreferenceMatch[] {
  const matches: PreferenceMatch[] = [];
  if (place.interests.some(item => preferences.interests.includes(item as Preferences["interests"][number]))) matches.push("interest");
  if (preferences.budget < 100 && place.costType === "free") matches.push("budget");
  if (preferences.tripType === "Family" && place.visitMinutes <= 60) matches.push("traveler");
  if (preferences.tripType === "Friends" && place.interests.includes("Food")) matches.push("traveler");
  if ((preferences.travelStyle === "Food-first" && place.interests.includes("Food")) || (preferences.travelStyle === "History-first" && place.interests.includes("History")) || (preferences.travelStyle === "Hidden gems" && place.category === "Architecture")) matches.push("style");
  if (preferences.transportPreference === "Walking" && place.interests.includes("Walking")) matches.push("transport");
  if (preferences.accessibility.length > 0 && place.accessibility?.summary) matches.push("accessibility");
  return matches;
}

export function placePreferenceScore(place: Place, preferences: Preferences): number {
  const interestScore = place.interests.filter(item => preferences.interests.includes(item as Preferences["interests"][number])).length * 10;
  return interestScore
    + (preferences.budget < 100 && place.costType === "free" ? 8 : 0)
    + (preferences.tripType === "Family" && place.visitMinutes <= 60 ? 2 : 0)
    + (preferences.tripType === "Friends" && place.interests.includes("Food") ? 2 : 0)
    + (preferences.travelStyle === "Food-first" && place.interests.includes("Food") ? 5 : 0)
    + (preferences.travelStyle === "History-first" && place.interests.includes("History") ? 5 : 0)
    + (preferences.travelStyle === "Hidden gems" && place.category === "Architecture" ? 3 : 0)
    + (preferences.transportPreference === "Walking" && place.interests.includes("Walking") ? 2 : 0)
    + (preferences.accessibility.length > 0 && place.accessibility?.summary ? 2 : 0);
}

export function rankPlacesByPreferences(catalog: Catalog, preferences: Preferences): Place[] {
  return catalog.places.map((place, index) => ({ place, index, score: placePreferenceScore(place, preferences) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(item => item.place);
}

export function routePreferenceScore(route: CulturalRoute, catalog: Catalog, preferences: Preferences): number {
  const routeInterests = route.interests ?? route.categories ?? [];
  const matchingInterests = routeInterests.filter(item => preferences.interests.includes(item as Preferences["interests"][number])).length;
  const stops = route.stopIds.map(id => catalog.places.find(place => place.id === id)).filter((place): place is Place => Boolean(place));
  const accessibleStops = stops.filter(place => place.accessibility?.summary).length;
  return matchingInterests * 12
    + (preferences.travelStyle === "History-first" && route.theme.toLowerCase().includes("history") ? 6 : 0)
    + (preferences.travelStyle === "Food-first" && route.theme.toLowerCase().includes("market") ? 6 : 0)
    + (preferences.transportPreference === "Walking" ? 2 : 0)
    + (preferences.accessibility.length > 0 ? accessibleStops : 0)
    + (preferences.days <= 2 && route.durationMinutes <= 180 ? 2 : 0);
}

export function preferenceReason(place: Place, preferences: Preferences, translate?: (key: string, vars?: Record<string, string | number>) => string): string {
  const matches = place.interests.filter(item => preferences.interests.includes(item as Preferences["interests"][number]));
  if (translate) {
    if (matches.length) return translate("common.recommendedBecause", { interest: matches.slice(0, 2).map(item => translate(`interest.${item}`)).join(" + ") });
    if (preferences.transportPreference === "Walking") return translate("preferences.walkingFit");
    return translate("preferences.catalogMatch");
  }
  if (matches.length) return `Matches your interest in ${matches.slice(0, 3).join(", ")}.`;
  return "A source-backed place from the Jeroam catalog.";
}
