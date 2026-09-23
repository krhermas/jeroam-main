"use client";

import {Moon,Sun,Monitor} from "lucide-react";
import {createContext,useContext,useEffect,useMemo,useRef,useState,type ReactNode} from "react";
import {useI18n} from "./i18n";
import {Switcher} from "./switcher";

export type ThemePreference="light"|"dark"|"system";
export type ResolvedTheme="light"|"dark";

type ThemeContextValue={preference:ThemePreference;theme:ResolvedTheme;ready:boolean;setPreference:(preference:ThemePreference)=>void};
const ThemeContext=createContext<ThemeContextValue|null>(null);
const themeKey="jeroam-theme";

function validPreference(value:string|null):ThemePreference|null{return value==="light"||value==="dark"||value==="system"?value:null;}
function systemTheme():ResolvedTheme{return typeof window!=="undefined"&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}

export function ThemeProvider({children}:{children:ReactNode}){
 const [preference,setPreferenceState]=useState<ThemePreference>("system");
 const [theme,setTheme]=useState<ResolvedTheme>("light");
 const [ready,setReady]=useState(false);
 const themeTransitionTimer=useRef<number|undefined>(undefined);

 /* eslint-disable react-hooks/set-state-in-effect -- hydrate the persisted preference once on the client. */
 useEffect(()=>{
  let stored:ThemePreference|null=null;
  try{stored=validPreference(window.localStorage.getItem(themeKey));}catch{/* storage can be disabled; system preference remains available */}
 const next=stored??"system";
  setPreferenceState(next);
  setTheme(next==="system"?systemTheme():next);
  setReady(true);
 },[]);
 /* eslint-enable react-hooks/set-state-in-effect */

 useEffect(()=>{
  if(!ready||preference!=="system")return;
  const media=window.matchMedia("(prefers-color-scheme: dark)");
  const onChange=()=>setTheme(media.matches?"dark":"light");
  onChange();
  media.addEventListener?.("change",onChange);
  return()=>media.removeEventListener?.("change",onChange);
 },[preference]);

 useEffect(()=>{
  document.documentElement.dataset.theme=theme;
  document.documentElement.style.colorScheme=theme;
 },[theme]);

 const setPreference=(next:ThemePreference)=>{
  if(next!==preference&&typeof window!=="undefined"&&!window.matchMedia("(prefers-reduced-motion: reduce)").matches){document.documentElement.classList.add("theme-transition");window.clearTimeout(themeTransitionTimer.current);themeTransitionTimer.current=window.setTimeout(()=>document.documentElement.classList.remove("theme-transition"),260);}
  setPreferenceState(next);
  setTheme(next==="system"?systemTheme():next);
  try{if(next==="system")window.localStorage.removeItem(themeKey);else window.localStorage.setItem(themeKey,next);}catch{/* persistence is best effort */}
 };
 const value=useMemo(()=>({preference,theme,ready,setPreference}),[preference,theme,ready]);
 return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(){const value=useContext(ThemeContext);if(!value)throw Error("Theme provider missing");return value;}

export function ThemeSwitcher(){
 const {preference,setPreference}=useTheme();
 const {t}=useI18n();
 return <Switcher className="theme-switcher" value={preference} ariaLabel={t("theme.label")} onChange={setPreference} icon={preference==="dark"?<Moon size={14}/>:preference==="light"?<Sun size={14}/>:<Monitor size={14}/>} options={[{value:"system",label:t("theme.system"),short:"SYS",icon:<Monitor size={14}/>},{value:"light",label:t("theme.light"),short:"LGT",icon:<Sun size={14}/>},{value:"dark",label:t("theme.dark"),short:"DRK",icon:<Moon size={14}/>}]} />;
}
