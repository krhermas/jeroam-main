import type {Coordinates,Place} from "./contracts";

/**
 * Shared map vocabulary. Page components only describe what they want to
 * show; the rendering adapter (Leaflet today, another provider later) owns
 * provider-specific details.
 */
export type MapMode="places"|"route"|"itinerary"|"recommendations";
export type MapProviderName="leaflet"|"fallback";

export type MapMarker={
 id:string;
 position:Coordinates;
 index:number;
 label:string;
 title:string;
};

export type MapModel={
 mode:MapMode;
 markers:MapMarker[];
 line:Coordinates[];
 bounds:Coordinates[];
};

export type MapProviderCallbacks={onSelect:(id:string)=>void};
export type MapAdapterHandle={fit:()=>void;destroy:()=>void};

/** Provider boundary for a future Mapbox/Google/MapLibre adapter. */
export interface MapProviderAdapter{
 readonly name:MapProviderName;
 mount(container:HTMLElement,model:MapModel,callbacks:MapProviderCallbacks):MapAdapterHandle;
}

export function isValidMapCoordinate(position:Coordinates|undefined|null):position is Coordinates{
 return Boolean(position&&Number.isFinite(position.latitude)&&Number.isFinite(position.longitude)&&position.latitude>=-90&&position.latitude<=90&&position.longitude>=-180&&position.longitude<=180);
}

/** Build a stable, source-backed model from catalog records. */
export function createMapModel(places:Place[],mode:MapMode="places"):MapModel{
 const markers=places.filter(place=>isValidMapCoordinate(place.coordinates)).map((place,index)=>({
  id:place.id,
  position:place.coordinates,
  index,
  label:mode==="route"||mode==="itinerary"?String(index+1):"•",
  title:place.name,
 }));
 const bounds=markers.map(marker=>marker.position);
 const line=mode==="route"||mode==="itinerary"?bounds:[];
 return {mode,markers,line,bounds};
}
