"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, Search as SearchIcon, X } from "lucide-react";
import { searchSuggestions, readRecentSearches, rememberSearch, type SearchResult } from "@/lib/search";
import { useApp } from "./provider";
import { useI18n } from "./i18n";
import type { Catalog } from "@/lib/contracts";
import {routeImage} from "@/lib/catalog";

function GlobalResultPreview({ result, catalog, onSelect, onNavigate, t, locale }: { result: SearchResult; catalog: Catalog; onSelect?: () => void; onNavigate: (href: string) => void; t: (key: string, vars?: Record<string, string | number>) => string; locale: "en" | "ar" | "he" | null }) {
  const route = result.routeId ? catalog.routes.find(item => item.id === result.routeId) : undefined;
  const image = route ? routeImage(route,catalog) : result.imageId && catalog.images[result.imageId] ? catalog.images[result.imageId] : null;
  const source = result.sourceIds.map(id => catalog.sources.find(item => item.id === id)).find(Boolean);
  const rawDate = source?.lastVerifiedAt ?? source?.accessedAt;
  const date = rawDate ? (() => { const parsed = new Date(rawDate); return Number.isNaN(parsed.getTime()) ? rawDate : new Intl.DateTimeFormat(locale === "he" ? "he-IL" : locale === "ar" ? "ar" : "en-US", { year: "numeric", month: "short", day: "numeric" }).format(parsed); })() : null;
  return <a href={result.href} className="global-search-result" onClick={event => { event.preventDefault(); onSelect?.(); onNavigate(result.href); }}><>{image ? <img src={image.path} alt="" /> : <span className="global-search-result-icon"><SearchIcon size={16} /></span>}</><span><small>{t(`search.kind.${result.kind}`)}</small><strong>{result.title}</strong>{source&&<em>{source.publisher}{date?` · ${t("common.lastVerified")} ${date}`:""}</em>}</span><ArrowRight size={14} /></a>;
}

/** Compact global entry point shared by desktop and mobile navigation. */
export function GlobalSearch() {
  const { catalog } = useApp();
  const { t, locale } = useI18n();
  const router = useRouter();
  const path = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recent, setRecent] = useState<string[]>([]);
  const suggestions = query.trim() ? searchSuggestions(catalog, query, t, 6, locale) : [];

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => { if (!cancelled) setRecent(readRecentSearches()); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        event.preventDefault();
        setOpen(true);
        window.setTimeout(() => inputRef.current?.focus(), 0);
      }
      if (event.key === "Escape") { setOpen(false); setActiveIndex(-1); inputRef.current?.blur(); }
    }
    function onPointerDown(event: PointerEvent) {
      if (open && rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => { document.removeEventListener("keydown", onKeyDown); document.removeEventListener("pointerdown", onPointerDown); };
  }, [open]);

  function submit(event?: FormEvent) {
    event?.preventDefault();
    const value = query.trim();
    if (!value) { router.push("/search"); setOpen(false); return; }
    setRecent(rememberSearch(value));
    setOpen(false);
    setActiveIndex(-1);
    router.push(`/search?q=${encodeURIComponent(value)}`);
  }

  function onInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!suggestions.length) { if (event.key === "Enter") submit(); return; }
    if (event.key === "ArrowDown") { setActiveIndex(index => Math.min(suggestions.length - 1, index + 1)); event.preventDefault(); }
    if (event.key === "ArrowUp") { setActiveIndex(index => Math.max(0, index - 1)); event.preventDefault(); }
    if (event.key === "Enter" && activeIndex >= 0) {
      const result = suggestions[activeIndex];
      setRecent(rememberSearch(query));
      setOpen(false);
      router.push(result.href);
      event.preventDefault();
    }
  }

  return <div ref={rootRef} className={`global-search ${open ? "open" : ""}`}>
    <form className="global-search-form" role="search" onSubmit={submit} onClick={() => { if (!open) { setOpen(true); window.setTimeout(() => inputRef.current?.focus(), 0); } }}>
      <SearchIcon size={16} aria-hidden="true" />
      <label className="sr-only" htmlFor="global-search-input">{t("search.label")}</label>
      <input ref={inputRef} id="global-search-input" value={query} onFocus={() => setOpen(true)} onChange={event => { setQuery(event.target.value); setOpen(true); setActiveIndex(-1); }} onKeyDown={onInputKeyDown} placeholder={t("search.headerPlaceholder")} autoComplete="off" role="combobox" aria-expanded={open} aria-controls="global-search-results" aria-activedescendant={activeIndex >= 0 ? `global-result-${suggestions[activeIndex]?.id}` : undefined} />
      {query && <button type="button" className="global-search-clear" aria-label={t("common.clear")} onClick={() => { setQuery(""); setActiveIndex(-1); inputRef.current?.focus(); }}><X size={14} /></button>}
      <kbd aria-hidden="true">/</kbd>
    </form>
    {open && <div id="global-search-results" className="global-search-popover" role="listbox" aria-label={t("search.suggestions")}>
      {suggestions.length ? <>
        <div className="global-search-label">{t("search.suggestions")}</div>
        {suggestions.map((result: SearchResult, index: number) => <div id={`global-result-${result.id}`} className={activeIndex === index ? "active" : ""} role="option" aria-selected={activeIndex === index} key={`${result.kind}:${result.id}`}><GlobalResultPreview result={result} catalog={catalog} locale={locale} t={t} onSelect={() => { setRecent(rememberSearch(query)); setOpen(false); }} onNavigate={router.push} /></div>)}
        <button type="button" className="global-search-see-all" onClick={() => submit()}>{t("search.seeAll")} <ArrowRight size={14} /></button>
      </> : recent.length ? <>
        <div className="global-search-label">{t("search.recent")}</div>
        {recent.slice(0, 4).map(item => <button type="button" className="global-search-recent" key={item} onClick={() => { setQuery(item); router.push(`/search?q=${encodeURIComponent(item)}`); setOpen(false); }}><SearchIcon size={14} /><span>{item}</span><ArrowRight size={13} /></button>)}
        <button type="button" className="global-search-see-all" onClick={() => submit()}>{t("search.openFullSearch")} <ArrowRight size={14} /></button>
      </> : <div className="global-search-empty"><SearchIcon size={17} /><span>{t("search.searchHint")}</span></div>}
    </div>}
    {path === "/search" && <span className="sr-only">{t("search.searchEverywhere")}</span>}
  </div>;
}

