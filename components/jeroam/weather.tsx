"use client";

import {useCallback,useEffect,useState} from "react";
import {Cloud,CloudRain,CloudSun,LoaderCircle,RefreshCw,Sun,Wind} from "lucide-react";
import {localeConfig,useI18n} from "./i18n";
import {TrustBadge} from "./shared";

type ForecastDay={date:string;high:number;low:number;code:number};
type WeatherState={temperature:number;wind:number;code:number;updatedAt:string;forecast:ForecastDay[]};
const weatherUrl="https://api.open-meteo.com/v1/forecast?latitude=31.7683&longitude=35.2137&current=temperature_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=Asia%2FJerusalem&forecast_days=3";

function descriptionKey(code:number){if(code===0)return "weather.clear";if(code<=3)return "weather.partly";if(code<=48)return "weather.misty";if(code<=67)return "weather.rainNearby";if(code<=77)return "weather.snowNearby";if(code<=82)return "weather.showers";return "weather.storm";}
function WeatherGlyph({code,size}:{code:number;size:number}){if(code===0)return <Sun size={size}/>;if(code<=3)return <CloudSun size={size}/>;if(code<=48)return <Cloud size={size}/>;if(code<=82)return <CloudRain size={size}/>;return <Wind size={size}/>;}
function dayLabel(date:string,index:number,language:string){if(index===0)return "weather.today";return new Intl.DateTimeFormat(language,{weekday:"short"}).format(new Date(`${date}T12:00:00`));}

export function WeatherSnapshot(){
 const {t,locale}=useI18n();
 const [state,setState]=useState<"loading"|"ready"|"error">("loading");
 const [weather,setWeather]=useState<WeatherState|null>(null);
 const load=useCallback(async()=>{setState("loading");try{const response=await fetch(weatherUrl,{headers:{Accept:"application/json"}});if(!response.ok)throw new Error("Weather request failed");const data=await response.json() as {current?:{temperature_2m?:number;weather_code?:number;wind_speed_10m?:number};daily?:{time?:string[];temperature_2m_max?:number[];temperature_2m_min?:number[];weather_code?:number[]}};if(!data.current||!data.daily?.time?.length||typeof data.current.temperature_2m!=="number"||typeof data.current.weather_code!=="number")throw new Error("Weather data incomplete");const forecast=data.daily.time.map((date,index)=>({date,high:Math.round(data.daily?.temperature_2m_max?.[index]??0),low:Math.round(data.daily?.temperature_2m_min?.[index]??0),code:data.daily?.weather_code?.[index]??0}));setWeather({temperature:Math.round(data.current.temperature_2m),wind:Math.round(data.current.wind_speed_10m??0),code:data.current.weather_code,updatedAt:new Date().toISOString(),forecast});setState("ready");}catch{setWeather(null);setState("error");}},[]);
 useEffect(()=>{const timer=window.setTimeout(()=>{void load();},0);return()=>window.clearTimeout(timer);},[load]);
 if(state==="loading")return <div className="weather-snapshot weather-loading" aria-live="polite"><LoaderCircle className="spin" size={20}/><div><strong>{t("weather.reading")}</strong><span>{t("weather.connecting")}</span></div></div>;
 if(state==="error")return <div className="weather-snapshot weather-error" role="status"><Cloud size={22}/><div><strong>{t("weather.unavailable")}</strong><span>{t("weather.retryCopy")}</span></div><button type="button" onClick={()=>void load()} aria-label={t("common.retry")}><RefreshCw size={16}/></button></div>;
 if(!weather)return null;
 const language=localeConfig[locale??"en"].htmlLang;const numberFormat=new Intl.NumberFormat(language);return <div className="weather-snapshot"><div className="weather-current"><div className="weather-icon"><WeatherGlyph code={weather.code} size={28}/></div><div><span className="eyebrow">{t("weather.jerusalemNow")}</span><strong>{numberFormat.format(weather.temperature)}°</strong><p>{t(descriptionKey(weather.code))} · {numberFormat.format(weather.wind)} {t("weather.windUnit")} {t("weather.wind")}</p></div></div><div className="weather-forecast" aria-label={t("weather.forecastLabel")}>{weather.forecast.map((day,index)=><div key={day.date}><span>{t(dayLabel(day.date,index,language))}</span><WeatherGlyph code={day.code} size={16}/><strong>{numberFormat.format(day.high)}° <small>{numberFormat.format(day.low)}°</small></strong></div>)}</div><div className="weather-source"><TrustBadge/><span>{t("weather.liveForecast",{time:new Intl.DateTimeFormat(language,{hour:"numeric",minute:"2-digit"}).format(new Date(weather.updatedAt))})}</span><a href={weatherUrl} target="_blank" rel="noreferrer">{t("weather.source")} <span>↗</span></a></div></div>;
}

