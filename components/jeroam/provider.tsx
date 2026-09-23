"use client";
import {createContext,useCallback,useContext,useEffect,useState,type ReactNode} from "react";
import {releaseCatalog} from "@/lib/catalog";
import {preferencesSchema,type Catalog,Itinerary,Preferences,Status} from "@/lib/contracts";
type LocalUser={id:string;email:string};
type AppContext={catalog:Catalog;status:Status|null;user:LocalUser|null;ready:boolean;preferences:Preferences|null;trip:Itinerary|null;savedPlaces:string[];savedRoutes:string[];recentPlaces:string[];recentRoutes:string[];notice:string;error:string;dirty:boolean;notify:(s:string)=>void;report:(s:string)=>void;savePreferences:(p:Preferences)=>Promise<void>;updateTrip:(t:Itinerary)=>void;persistTrip:(t?:Itinerary)=>Promise<void>;saveItem:(kind:"place"|"route",id:string)=>Promise<void>;rememberViewed:(kind:"place"|"route",id:string)=>void;logout:()=>Promise<void>;retry:()=>void};
const Context=createContext<AppContext|null>(null);
const read=<T,>(key:string,fallback:T):T=>{try{const raw=localStorage.getItem("jeroam-"+key);return raw?JSON.parse(raw) as T:fallback;}catch{return fallback;}};
const write=(key:string,value:unknown)=>{try{localStorage.setItem("jeroam-"+key,JSON.stringify(value));}catch{}};
export function AppProvider({children}:{children:ReactNode}){
 const [status]=useState<Status>({database:false,ai:false,supabaseUrl:null,supabaseKey:null,model:null});
 const [user,setUser]=useState<LocalUser|null>(null);const [preferences,setPreferences]=useState<Preferences|null>(null);const [trip,setTrip]=useState<Itinerary|null>(null);const [savedPlaces,setSavedPlaces]=useState<string[]>([]);const [savedRoutes,setSavedRoutes]=useState<string[]>([]);const [recentPlaces,setRecentPlaces]=useState<string[]>([]);const [recentRoutes,setRecentRoutes]=useState<string[]>([]);const [ready,setReady]=useState(false);const [notice,setNotice]=useState("");const [error,setError]=useState("");const [dirty,setDirty]=useState(false);
 useEffect(()=>{const timer=window.setTimeout(()=>{setUser(read("user",null));const stored=read<Preferences|null>("preferences",null);if(stored){try{setPreferences(preferencesSchema.parse(stored));}catch{setPreferences(null);}}setTrip(read("trip",null));setSavedPlaces(read("saved-places",[]));setSavedRoutes(read("saved-routes",[]));setRecentPlaces(read("recent-places",[]));setRecentRoutes(read("recent-routes",[]));setReady(true);},0);return()=>window.clearTimeout(timer);},[]);
 const notify=(s:string)=>{setNotice(s);setError("");};const report=(s:string)=>{setError(s);setNotice("");};
 async function savePreferences(p:Preferences){const v=preferencesSchema.parse(p);setPreferences(v);write("preferences",v);notify("notice.preferencesSaved");}
 // The demo has no remote persistence yet, so every edit is written locally.
 // `dirty` still lets a future authenticated adapter show an explicit sync action.
 function updateTrip(t:Itinerary){setTrip(t);setDirty(!!user);write("trip",t);}
 async function persistTrip(value?:Itinerary){const current=value??trip;if(!current)return;updateTrip(current);write("trip",current);setDirty(false);notify(user?"notice.tripSaved":"notice.browserTripReady");}
 async function saveItem(kind:"place"|"route",id:string){const [list,setList,key]=kind==="place"?[savedPlaces,setSavedPlaces,"saved-places"] as const:[savedRoutes,setSavedRoutes,"saved-routes"] as const;const next=list.includes(id)?list.filter(x=>x!==id):[...list,id];setList(next);write(key,next);notify(next.includes(id)?"notice.saved":"notice.removed");}
 const rememberViewed=useCallback((kind:"place"|"route",id:string)=>{const [setList,key]=kind==="place"?[setRecentPlaces,"recent-places"] as const:[setRecentRoutes,"recent-routes"] as const;setList(current=>{const next=[id,...current.filter(item=>item!==id)].slice(0,6);write(key,next);return next;});},[]);
 async function logout(){setUser(null);localStorage.removeItem("jeroam-user");notify("notice.signedOut");}
 const retry=()=>{setError("");setNotice("notice.readyToTry");};
 return <Context.Provider value={{catalog:releaseCatalog,status,user,ready,preferences,trip,savedPlaces,savedRoutes,recentPlaces,recentRoutes,notice,error,dirty,notify,report,savePreferences,updateTrip,persistTrip,saveItem,rememberViewed,logout,retry}}>{children}</Context.Provider>;
}
export function useApp(){const context=useContext(Context);if(!context)throw Error("Jeroam provider missing");return context;}

