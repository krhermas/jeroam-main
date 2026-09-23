"use client";

import { useEffect, useMemo, useState, type FormEvent, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Activity, ArrowRight, ArrowUpRight, BookmarkPlus, Clock3, Compass, Filter, MapPin, Search as SearchIcon, Sparkles, X } from "lucide-react";
import { defaultPreferences, interests as interestTaxonomy, type Catalog, type Itinerary } from "@/lib/contracts";
import { buildSearchIndex, clearRecentSearches, readRecentSearches, rememberSearch, searchCatalog, searchSuggestions, type SearchFilterKind, type SearchKind, type SearchResult } from "@/lib/search";
import { scheduleItems, validateTripPlaces } from "@/lib/planner";
import { displayPlaceName, displayRouteTitle, formatMinutes, routeImage } from "@/lib/catalog";
import { useApp } from "./provider";
import { localeConfig, useI18n } from "./i18n";
import { Empty, SaveButton } from "./shared";

type SearchFilters = {
  kind: SearchFilterKind;
  category: string;
  interest: string;
  area: string;
  cost: "" | "free" | "paid" | "unknown";
  maxMinutes: "" | "30" | "60" | "120" | "240";
};

const emptyFilters: SearchFilters = { kind: "all", category: "", interest: "", area: "", cost: "", maxMinutes: "" };

function localizedCost(result: SearchResult, t: (key: string, vars?: Record<string, string | number>) => string) {
  if (result.costType === "free") return t("common.freeEntry");
  if (result.costType === "unknown") return t("common.priceNotVerified");
  if (result.costType === "paid") return result.costDisplay ?? t("common.knownCost");
  return null;
}

function resultKindLabel(kind: SearchKind, t: (key: string, vars?: Record<string, string | number>) => string) {
  return t(`search.kind.${kind}`);
}

function imageFor(result: SearchResult, catalog: Catalog) {
  if (result.imageId && catalog.images[result.imageId]) return catalog.images[result.imageId];
  if (result.kind === "route" && result.routeId) {
    const route = catalog.routes.find(item => item.id === result.routeId);
    return route ? routeImage(route,catalog) ?? null : null;
  }
  return null;
}

function useTripSearchActions() {
  const { catalog, preferences, trip, updateTrip, notify, report } = useApp();
  const { t } = useI18n();
  const planningPreferences = preferences ?? defaultPreferences;

  function emptyTrip(): Itinerary {
    return {
      id: crypto.randomUUID(),
      title: t("common.myJourneyTitle"),
      mode: "manual",
      transport: "Walking",
      days: Array.from({ length: Math.max(1, planningPreferences.days) }, (_, index) => ({ day: index + 1, items: [] })),
      createdAt: new Date().toISOString(),
    };
  }

  function appendIds(ids: string[], noticeKey: string, partialNoticeKey?: string) {
    const sourceTrip = trip ?? emptyTrip();
    const existing = new Set(sourceTrip.days.flatMap(day => day.items.map(item => item.placeId)));
    const newIds = ids.filter(id => !existing.has(id));
    if (!newIds.length) {
      notify(noticeKey === "notice.routeAddedToTrip" ? "notice.routeAlreadyInTrip" : "notice.alreadyInTrip");
      return;
    }

    const generated = scheduleItems(newIds, catalog, planningPreferences);
    const candidates = [...sourceTrip.days].sort((a, b) => a.items.length - b.items.length || a.day - b.day);
    const target = candidates.find(day => {
      const lastEnd = day.items.reduce((latest, item) => Math.max(latest, item.start + item.minutes), 0);
      const firstStart = generated[0]?.start ?? 540;
      const shift = Math.max(0, lastEnd ? lastEnd + 20 - firstStart : 540 - firstStart);
      return generated.every(item => item.start + shift + item.minutes <= 1440);
    });

    if (!target) {
      report(t("search.scheduleFull"));
      return;
    }
    const lastEnd = target.items.reduce((latest, item) => Math.max(latest, item.start + item.minutes), 0);
    const firstStart = generated[0]?.start ?? 540;
    const shift = Math.max(0, lastEnd ? lastEnd + 20 - firstStart : 540 - firstStart);
    const items = generated.map(item => ({ ...item, start: item.start + shift }));
    const next: Itinerary = {
      ...sourceTrip,
      mode: "manual",
      days: sourceTrip.days.map(day => day.day === target.day ? { ...day, items: [...day.items, ...items] } : day),
    };
    try {
      validateTripPlaces(next, catalog);
      updateTrip(next);
      notify(newIds.length < ids.length && partialNoticeKey ? partialNoticeKey : noticeKey);
    } catch {
      report(t("search.scheduleFull"));
    }
  }

  return {
    addPlace: (placeId: string) => appendIds([placeId], "notice.placeAddedToTrip"),
    addRoute: (routeId: string) => {
      const route = catalog.routes.find(item => item.id === routeId);
      if (!route) return;
      appendIds(route.stopIds, "notice.routeAddedToTrip", "notice.routePartiallyAdded");
    },
  };
}

function SearchResultCard({ result, catalog, onAddPlace, onAddRoute, onStart }: { result: SearchResult; catalog: Catalog; onAddPlace: (id: string) => void; onAddRoute: (id: string) => void; onStart: (result: SearchResult) => void }) {
  const { t, locale } = useI18n();
  const image = imageFor(result, catalog);
  const source = result.sourceIds.map(id => catalog.sources.find(item => item.id === id)).find(Boolean);
  const sourceDate = source ? (() => { const raw = source.lastVerifiedAt ?? source.accessedAt; const parsed = new Date(raw); return Number.isNaN(parsed.getTime()) ? raw : new Intl.DateTimeFormat(localeConfig[locale ?? "en"].htmlLang, { year: "numeric", month: "short", day: "numeric" }).format(parsed); })() : null;
  const place = result.placeId ? catalog.places.find(item => item.id === result.placeId) : undefined;
  const route = result.routeId ? catalog.routes.find(item => item.id === result.routeId) : undefined;
  const title = result.kind === "place" && place ? displayPlaceName(place, locale) : result.kind === "route" && route ? displayRouteTitle(route, locale) : result.title;
  const href = result.href;
  const category = result.category ? t(`category.${result.category}`) : result.kind === "activity" ? t("search.kind.activity") : null;
  const cost = localizedCost(result, t);
  const isActionable = result.kind === "place" || result.kind === "route" || result.kind === "activity";
  const actionPlaceId = result.placeId ?? (result.kind === "place" ? result.id : undefined);
  const actionRouteId = result.routeId ?? (result.kind === "route" ? result.id : undefined);
  return <article className={`search-result-card search-result-${result.kind}`}>
    <Link href={href} className="search-result-image" aria-label={`${t("search.view")} ${title}`}>
      {image ? <img src={image.path} alt={title} loading="lazy" /> : <div className="search-result-placeholder"><Compass size={27} /></div>}
      <span className="search-result-kind">{resultKindLabel(result.kind, t)}</span>
      <span className="search-result-arrow"><ArrowUpRight size={17} /></span>
    </Link>
    <div className="search-result-body">
      <div className="search-result-kicker"><span>{category ?? resultKindLabel(result.kind, t)}</span>{result.area && <span><MapPin size={12} />{t(`area.${result.area}`)}</span>}</div>
      <Link href={href}><h2>{title}</h2></Link>
      <p>{result.description}</p>
      <div className="search-result-meta">
        {result.durationMinutes !== null && <span><Clock3 size={13} />{formatMinutes(result.durationMinutes, locale)}</span>}
        {cost && <span>{cost}</span>}
        {result.tags.length > 0 && <span className="search-result-tag">{t("search.matches", { count: result.tags.length })}</span>}
      </div>
      {source ? <div className="search-result-source"><span>{t("search.sourceAttribution")}</span><a href={source.url} target="_blank" rel="noreferrer">{source.publisher} <ArrowUpRight size={11} /><small>{t("common.lastVerified")} {sourceDate}</small></a></div> : result.kind === "category" || result.kind === "interest" ? <div className="search-result-source"><span>{t("search.exploreFromCatalog")}</span></div> : null}
      <div className="search-result-actions">
        <Link href={href} className="text-link">{result.kind === "route" ? t("common.viewRoute") : result.kind === "place" ? t("common.viewPlace") : t("search.open")} <ArrowRight size={14} /></Link>
        {actionPlaceId && <><SaveButton id={actionPlaceId} compact /><button type="button" className="search-action-button" onClick={() => onAddPlace(actionPlaceId)}><BookmarkPlus size={14} />{t("search.addToTrip")}</button></>}
        {actionRouteId && <><SaveButton id={actionRouteId} kind="route" compact /><button type="button" className="search-action-button" onClick={() => onAddRoute(actionRouteId)}><BookmarkPlus size={14} />{t("search.addRouteToTrip")}</button><button type="button" className="search-action-button search-start-action" onClick={() => onStart(result)}><Activity size={14} />{t("search.startRoute")}</button></>}
        {!isActionable && <Link href={href} className="search-action-button">{t("search.browse")}</Link>}
      </div>
    </div>
  </article>;
}

function SearchFilters({ filters, setFilters, catalog }: { filters: SearchFilters; setFilters: (next: SearchFilters) => void; catalog: Catalog }) {
  const { t, locale } = useI18n();
  const categories = [...new Set(catalog.places.map(place => place.category))];
  const interests = [...new Set(catalog.places.flatMap(place => place.interests))].filter(value => (interestTaxonomy as readonly string[]).includes(value));
  const areas = [...new Set(catalog.places.map(place => place.area))];
  const set = (key: keyof SearchFilters, value: string) => setFilters({ ...filters, [key]: value });
  return <div className="search-filter-panel" aria-label={t("search.filters")}>
    <div className="search-kind-tabs" role="tablist" aria-label={t("search.scope")}>
      {(["all", "place", "route", "category", "interest", "activity"] as SearchFilterKind[]).map(kind => <button key={kind} type="button" role="tab" aria-selected={filters.kind === kind} className={filters.kind === kind ? "selected" : ""} onClick={() => set("kind", kind)}>{t(kind === "all" ? "search.kindAll" : `search.kind.${kind}`)}</button>)}
    </div>
    <div className="search-selects">
      <label><span>{t("search.filterCategory")}</span><select value={filters.category} onChange={event => set("category", event.target.value)}><option value="">{t("search.anyCategory")}</option>{categories.map(category => <option value={category} key={category}>{t(`category.${category}`)}</option>)}</select></label>
      <label><span>{t("search.filterInterest")}</span><select value={filters.interest} onChange={event => set("interest", event.target.value)}><option value="">{t("search.anyInterest")}</option>{interests.map(interest => <option value={interest} key={interest}>{t(`interest.${interest}`)}</option>)}</select></label>
      <label><span>{t("search.filterArea")}</span><select value={filters.area} onChange={event => set("area", event.target.value)}><option value="">{t("search.anyArea")}</option>{areas.map(area => <option value={area} key={area}>{t(`area.${area}`)}</option>)}</select></label>
      <label><span>{t("search.filterCost")}</span><select value={filters.cost} onChange={event => set("cost", event.target.value as SearchFilters["cost"])}><option value="">{t("search.anyCost")}</option><option value="free">{t("common.freeEntry")}</option><option value="paid">{t("common.knownCost")}</option><option value="unknown">{t("common.priceNotVerified")}</option></select></label>
      <label><span>{t("search.filterDuration")}</span><select value={filters.maxMinutes} onChange={event => set("maxMinutes", event.target.value as SearchFilters["maxMinutes"])}><option value="">{t("search.anyDuration")}</option><option value="30">{t("common.filterUpTo", { value: formatMinutes(30, locale) })}</option><option value="60">{t("common.filterUpTo", { value: formatMinutes(60, locale) })}</option><option value="120">{t("common.filterUpTo", { value: formatMinutes(120, locale) })}</option><option value="240">{t("common.filterUpTo", { value: formatMinutes(240, locale) })}</option></select></label>
    </div>
  </div>;
}

export function SearchPage() {
  const { catalog } = useApp();
  const { t, locale } = useI18n();
  const params = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [filters, setFilters] = useState<SearchFilters>({ ...emptyFilters, kind: (params.get("kind") as SearchFilterKind) || "all" });
  const [recent, setRecent] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const { addPlace, addRoute } = useTripSearchActions();
  const index = useMemo(() => buildSearchIndex(catalog, t, locale), [catalog, t, locale]);
  const results = useMemo(() => searchCatalog(catalog, { query, kind: filters.kind, category: filters.category, interest: filters.interest, area: filters.area, cost: filters.cost, maxMinutes: filters.maxMinutes ? Number(filters.maxMinutes) : "" }, t, locale), [catalog, query, filters, t, locale]);
  const suggestions = useMemo(() => query.trim() ? searchSuggestions(catalog, query, t, 6, locale) : [], [catalog, query, t, locale]);
  const taxonomy = useMemo(() => index.filter(result => result.kind === "category" || result.kind === "interest").slice(0, 12), [index]);
  const quickResults = useMemo(() => index.filter(result => result.kind === "place" || result.kind === "route").sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 6), [index]);
  const hasFilters = Boolean(filters.kind !== "all" || filters.category || filters.interest || filters.area || filters.cost || filters.maxMinutes);
  const showingResults = Boolean(query.trim()) || Boolean(hasFilters);
  const clearFilters = () => setFilters(emptyFilters);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => { if (!cancelled) setRecent(readRecentSearches()); });
    return () => { cancelled = true; };
  }, []);

  function submit(event?: FormEvent) {
    event?.preventDefault();
    const value = query.trim();
    if (!value) { router.push("/search"); return; }
    setRecent(rememberSearch(value));
    router.replace(`/search?q=${encodeURIComponent(value)}`);
  }

  function onInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!showingResults && event.key === "ArrowDown") { setActiveIndex(0); event.preventDefault(); return; }
    if (!results.length) return;
    if (event.key === "ArrowDown") { setActiveIndex(current => Math.min(results.length - 1, current + 1)); event.preventDefault(); }
    if (event.key === "ArrowUp") { setActiveIndex(current => Math.max(0, current - 1)); event.preventDefault(); }
    if (event.key === "Enter" && activeIndex >= 0) { const result = results[activeIndex]; rememberSearch(query); router.push(result.href); event.preventDefault(); }
  }

  function start(result: SearchResult) {
    rememberSearch(query);
    router.push(result.routeId ? `/routes/${result.routeId}#route-experience` : result.href);
  }

  function clearRecent() { clearRecentSearches(); setRecent([]); }

  return <main className="page-wrap search-page">
    <section className="search-hero"><div><span className="eyebrow">JEROAM / {t("search.everywhere").toUpperCase()}</span><h1>{t("search.title")}</h1><p>{t("search.subtitle")}</p></div><div className="search-hero-mark"><SearchIcon size={38} /><span>{t("search.searchEverywhere")}</span></div></section>
    <section className="search-workspace">
      <form className="search-page-form" onSubmit={submit} role="search"><SearchIcon size={20} /><label className="sr-only" htmlFor="jeroam-search">{t("search.label")}</label><input id="jeroam-search" value={query} onChange={event => { setQuery(event.target.value); setActiveIndex(-1); }} onKeyDown={onInputKeyDown} placeholder={t("search.placeholder")} autoComplete="off" role="combobox" aria-expanded={Boolean(query && suggestions.length)} aria-controls="search-suggestions" aria-activedescendant={activeIndex >= 0 ? `search-result-${results[activeIndex]?.id}` : undefined} /><button className="search-submit" type="submit" aria-label={t("search.submit")}><ArrowRight size={18} /></button>{query && <button type="button" className="search-clear" aria-label={t("common.clear")} onClick={() => { setQuery(""); setActiveIndex(-1); router.replace("/search"); }}><X size={16} /></button>}</form>
      {suggestions.length > 0 && <div id="search-suggestions" className="search-suggestions" role="listbox" aria-label={t("search.suggestions")}>{suggestions.map((result, index) => <Link key={`${result.kind}:${result.id}`} id={`search-result-${result.id}`} role="option" aria-selected={activeIndex === index} href={result.href} onClick={() => rememberSearch(query)}><span className="search-suggestion-kind">{resultKindLabel(result.kind, t)}</span><strong>{result.title}</strong><small>{result.description}</small><ArrowUpRight size={14} /></Link>)}</div>}
      <SearchFilters filters={filters} setFilters={setFilters} catalog={catalog} />
    </section>

    {!showingResults && <section className="search-start-grid"><div className="search-recent-panel"><div className="search-panel-heading"><div><span className="eyebrow">{t("search.recent")}</span><h2>{t("search.pickUp")}</h2></div>{recent.length > 0 && <button type="button" className="text-button" onClick={clearRecent}>{t("search.clearRecent")}</button>}</div>{recent.length ? <div className="recent-search-list">{recent.map(item => <button type="button" key={item} onClick={() => { setQuery(item); router.replace(`/search?q=${encodeURIComponent(item)}`); }}><SearchIcon size={15} /><span>{item}</span><ArrowRight size={14} /></button>)}</div> : <p className="search-muted-state"><Sparkles size={17} />{t("search.noRecent")}</p>}</div><div className="search-taxonomy-panel"><div className="search-panel-heading"><div><span className="eyebrow">{t("search.browseBy")}</span><h2>{t("search.threads")}</h2></div></div><div className="search-taxonomy-list">{taxonomy.map(result => <Link href={result.href} key={result.id}><span>{result.kind === "category" ? <Filter size={15} /> : <Sparkles size={15} />}</span><strong>{result.title}</strong><ArrowUpRight size={14} /></Link>)}</div></div></section>}

    {showingResults ? <section className="search-results-section"><div className="search-results-heading"><div><span className="eyebrow">{query ? t("search.resultsFor", { query }) : t("search.filteredResults")}</span><h2>{t("search.resultsTitle")}</h2></div><span aria-live="polite">{t("search.resultsCount", { count: results.length })}</span></div>{results.length ? <div className="search-result-list">{results.map(result => <SearchResultCard key={`${result.kind}:${result.id}`} result={result} catalog={catalog} onAddPlace={addPlace} onAddRoute={addRoute} onStart={start} />)}</div> : <Empty title={t("search.noResultsTitle")}><p>{t("search.noResultsCopy")}</p><button type="button" className="button secondary" onClick={() => { setQuery(""); clearFilters(); router.replace("/search"); }}>{t("search.clearFilters")}</button></Empty>}<p className="search-disclaimer">{t("search.catalogOnly")}</p></section> : <section className="search-quick-section"><div className="search-results-heading"><div><span className="eyebrow">{t("search.quickStart")}</span><h2>{t("search.quickStartTitle")}</h2></div><Link href="/explore" className="text-link">{t("search.openExplore")} <ArrowUpRight size={15} /></Link></div><div className="search-quick-list">{quickResults.map(result => <SearchResultCard key={`${result.kind}:${result.id}`} result={result} catalog={catalog} onAddPlace={addPlace} onAddRoute={addRoute} onStart={start} />)}</div></section>}
  </main>;
}

export function SearchResultPreview({ result, catalog, onSelect }: { result: SearchResult; catalog: Catalog; onSelect?: () => void }) {
  const { t, locale } = useI18n();
  const image = imageFor(result, catalog);
  const source = result.sourceIds.map(id => catalog.sources.find(item => item.id === id)).find(Boolean);
  const sourceDate = source?.lastVerifiedAt ?? source?.accessedAt;
  const formatted = sourceDate ? (() => { const parsed = new Date(sourceDate); return Number.isNaN(parsed.getTime()) ? sourceDate : new Intl.DateTimeFormat(localeConfig[locale ?? "en"].htmlLang, { year: "numeric", month: "short", day: "numeric" }).format(parsed); })() : null;
  return <Link href={result.href} className="global-search-result" onClick={onSelect}>{image ? <img src={image.path} alt="" /> : <span className="global-search-result-icon"><Compass size={16} /></span>}<span><small>{resultKindLabel(result.kind, t)}</small><strong>{result.title}</strong>{source&&<em>{source.publisher}{formatted?` · ${t("common.lastVerified")} ${formatted}`:""}</em>}</span><ArrowUpRight size={14} /></Link>;
}


