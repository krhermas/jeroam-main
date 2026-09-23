"use client";

import {useEffect,useMemo,useRef,useState} from "react";
import Link from "next/link";
import {ExternalLink,LocateFixed,MapPin,Route as RouteIcon} from "lucide-react";
import type {Place} from "@/lib/contracts";
import {createMapModel,type MapMode,type MapProviderName} from "@/lib/map";
import {useApp} from "./provider";
import {useI18n} from "./i18n";
import {directionsLink,displayPlaceName,formatMinutes,placeSummary} from "@/lib/catalog";
import "leaflet/dist/leaflet.css";

export type PlaceMapProps={
 places:Place[];
 activeId?:string;
 onSelect?:(id:string)=>void;
 /** Kept for existing callers. Prefer `mode="route"` or `mode="itinerary"`. */
 route?:boolean;
 mode?:MapMode;
 /** Set to fallback while wiring a hosted provider; no page code changes. */
 provider?:MapProviderName;
 /** Changing this lets a host ask the provider to refit without knowing Leaflet. */
 fitKey?:string|number;
};

function escapeHtml(value:string){return value.replace(/[&<>'"]/g,character=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[character]??character));}

/**
 * Shared map surface for Explore, Places, Routes, My Trip and AI references.
 * The page passes catalog records into a provider-neutral MapModel. Leaflet is
 * the currently bundled adapter; if it or its tiles fail, the same model is
 * rendered as a source-backed ordered list so the experience remains useful.
 */
export function PlaceMap({places,activeId,onSelect,route=false,mode,provider="leaflet",fitKey}:PlaceMapProps){
 const {t,locale}=useI18n();
 const {catalog}=useApp();
 const host=useRef<HTMLDivElement>(null);
 const mapRef=useRef<import("leaflet").Map|null>(null);
 const fitRef=useRef<()=>void>(()=>{});
 const callback=useRef(onSelect);
 const [localSelected,setLocalSelected]=useState<string|undefined>();
 const [error,setError]=useState(false);
 const [mapReady,setMapReady]=useState(false);
 const mapMode=mode??(route?"route":"places");
 const model=useMemo(()=>createMapModel(places,mapMode),[places,mapMode]);
 const visiblePlaces=useMemo(()=>model.markers.map(marker=>places.find(place=>place.id===marker.id)).filter((place):place is Place=>Boolean(place)),[model.markers,places]);
 const selection=onSelect?activeId:(activeId??localSelected);
 const selectedPlace=visiblePlaces.find(place=>place.id===selection);
 const selectedIndex=selectedPlace?visiblePlaces.findIndex(place=>place.id===selectedPlace.id):-1;
 const pointKey=useMemo(()=>model.markers.map(marker=>`${marker.id}:${marker.position.latitude.toFixed(6)}:${marker.position.longitude.toFixed(6)}`).join("|"),[model.markers]);

 useEffect(()=>{callback.current=onSelect;},[onSelect]);
 useEffect(()=>{
 let disposed=false;
  let map:import("leaflet").Map|undefined;
  fitRef.current=()=>{};
  // Defer the reset until the effect yields so switching datasets does not
  // trigger a synchronous cascading render while the provider is rebuilding.
  queueMicrotask(()=>{if(!disposed){setMapReady(false);setError(provider==="fallback");}});
  if(provider==="fallback")return()=>{disposed=true;fitRef.current=()=>{};mapRef.current=null;};
  void import("leaflet").then(L=>{
   if(disposed||!host.current||!model.markers.length)return;
   map=L.map(host.current,{scrollWheelZoom:false,attributionControl:true,zoomControl:true});
   mapRef.current=map;
   const bounds:import("leaflet").LatLngExpression[]=model.bounds.map(point=>[point.latitude,point.longitude]);
   const fit=()=>{if(!map||!bounds.length)return;map.fitBounds(L.latLngBounds(bounds),{padding:[42,42],maxZoom:model.markers.length===1?16:15});};
   fitRef.current=fit;
   L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).on("tileerror",()=>{if(!disposed)setError(true);}).addTo(map!);
   model.markers.forEach(markerModel=>{
    const place=places.find(item=>item.id===markerModel.id);
    if(!place)return;
    const isSelected=place.id===selection;
    const source=place.sourceIds.map(id=>catalog.sources.find(item=>item.id===id)).find(Boolean);
    const sourceDate=source?.lastVerifiedAt??source?.accessedAt;
    const sourceDateLabel=sourceDate?(()=>{const parsed=new Date(sourceDate);return Number.isNaN(parsed.getTime())?sourceDate:new Intl.DateTimeFormat(locale==="he"?"he-IL":locale==="ar"?"ar":"en-US",{year:"numeric",month:"short",day:"numeric"}).format(parsed);})():null;
    const sourceMarkup=source?`<a class="map-popup-source" href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">${escapeHtml(t("common.source"))}: ${escapeHtml(source.publisher)}${sourceDateLabel?` · ${escapeHtml(t("common.lastVerified"))} ${escapeHtml(sourceDateLabel)}`:""} <span>↗</span></a>`:"";
    const markerIcon=L.divIcon({className:`map-pin${model.mode==="route"||model.mode==="itinerary"?" route-pin":""}${isSelected?" selected":""}`,html:`<span>${markerModel.label}</span>`,iconSize:[34,34],iconAnchor:[17,34],popupAnchor:[0,-30]});
    const marker=L.marker([markerModel.position.latitude,markerModel.position.longitude],{icon:markerIcon,title:displayPlaceName(place,locale),alt:displayPlaceName(place,locale)}).addTo(map!);
    const kicker=model.mode==="route"||model.mode==="itinerary"?`${t("common.stops")} ${String(markerModel.index+1).padStart(2,"0")}`:t(`category.${place.category}`);
    marker.bindPopup(`<div class="map-popup"><span>${escapeHtml(kicker)}</span><strong>${escapeHtml(displayPlaceName(place,locale))}</strong><p>${escapeHtml(placeSummary(place,locale))}</p><small>${escapeHtml(t(`area.${place.area}`))} · ${formatMinutes(place.visitMinutes,locale)}</small>${sourceMarkup}<a href="/places/${encodeURIComponent(place.id)}">${escapeHtml(t("common.openPlace"))} <span>↗</span></a></div>`,{closeButton:true});
    marker.on("click",()=>{if(!onSelect)setLocalSelected(place.id);callback.current?.(place.id);});
    marker.on("mouseover",()=>marker.openPopup());
    if(isSelected)marker.openPopup();
   });
   if(model.line.length>1)L.polyline(model.line.map(point=>[point.latitude,point.longitude] as [number,number]),{color:"#496a50",weight:4,opacity:.84,lineCap:"round",lineJoin:"round"}).addTo(map!);
   fit();
   setMapReady(true);
   window.setTimeout(()=>{if(!disposed)map?.invalidateSize();},120);
  }).catch(()=>{if(!disposed)setError(true);});
  return()=>{disposed=true;fitRef.current=()=>{};mapRef.current=null;map?.remove();};
 // Rebuild markers when the visible records, mode, selected stop or fit key changes.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[pointKey,selection,mapMode,fitKey,locale,provider]);

 const mapLabel=mapMode==="route"?t("common.routeMap"):mapMode==="itinerary"?t("common.journeyMap"):mapMode==="recommendations"?t("common.recommendationMap"):t("common.placeMap");
 const isRouteLike=mapMode==="route"||mapMode==="itinerary";
 const fallbackVisible=Boolean(places.length&&(!model.markers.length||error));
 return <div className="map-shell">
  <div className="map-canvas" ref={host} role="region" aria-label={mapLabel}/>
  {model.markers.length>0&&!mapReady&&!error&&<div className="map-loading" role="status"><span className="spinner"/><span>{t("common.loadingMap")}</span></div>}
  <button type="button" className="map-fit-button" onClick={()=>fitRef.current()} disabled={!mapReady||!model.markers.length} aria-label={`${t("common.fitMap")} · ${mapLabel}`} title={`${t("common.fitMap")} · ${mapLabel}`}><LocateFixed size={16}/></button>
  {fallbackVisible&&<div className="map-fallback" role="status"><div><strong>{t("common.mapUnavailable")}</strong><span>{provider==="fallback"?t("common.mapProviderFallback"):t("common.routeDataReady")}</span></div><ol>{visiblePlaces.map((place,index)=><li key={place.id}><Link href={`/places/${place.id}`} onClick={()=>{if(!onSelect)setLocalSelected(place.id);callback.current?.(place.id);}}><b>{isRouteLike?index+1:"•"}</b><span>{displayPlaceName(place,locale)}<small>{t(`area.${place.area}`)} · {formatMinutes(place.visitMinutes,locale)}</small></span><ExternalLink size={13}/></Link></li>)}</ol></div>}
  {selectedPlace&&<div className="map-preview-card" role="status"><div className="map-preview-index">{isRouteLike?String(selectedIndex+1).padStart(2,"0"):"•"}</div><div><span className="eyebrow">{isRouteLike?t("common.selectedStop"):t("common.selectedPlace")}</span><strong>{displayPlaceName(selectedPlace,locale)}</strong><small>{t(`area.${selectedPlace.area}`)} · {t(`category.${selectedPlace.category}`)} · {formatMinutes(selectedPlace.visitMinutes,locale)}</small></div><Link href={`/places/${selectedPlace.id}`} aria-label={`${t("common.openPlace")} ${displayPlaceName(selectedPlace,locale)}`}>{t("common.open")} <ExternalLink size={13}/></Link></div>}
  <div className="map-caption"><span><MapPin size={14}/>{isRouteLike?<><RouteIcon size={14}/>{t("common.numberedStops")}</>:t("common.sourcedPins")}</span><a target="_blank" rel="noreferrer" href={directionsLink(visiblePlaces)}>{t("common.open")} {isRouteLike?t("common.walkingDirections"):t("common.openInMaps")} <ExternalLink size={13}/></a></div>
 </div>;
}

