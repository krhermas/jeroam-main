import type {AIProvider,AIRequest,AIResponse,AIMessage,AIAction,PlaceReference,RouteReference,SourceReference} from "./types";

type ProviderConfig={provider:string;apiKey:string;model:string;baseUrl:string};

function env(name:string){return typeof process!=="undefined"?process.env[name]?.trim()||"":"";}

export function getServerAIAvailability(){
 const provider=env("JEROAM_AI_PROVIDER")||"openai-compatible";
 const model=env("JEROAM_AI_MODEL")||null;
 const configured=Boolean(env("JEROAM_AI_API_KEY"));
 const supported=["openai","openai-compatible"].includes(provider.toLowerCase());
 return {
  configured:configured&&supported,
  provider:configured&&supported?provider:null,
  model:configured&&supported?model:null,
  // Streaming remains opt-in for a future adapter. The public status shape
  // intentionally exposes no server configuration details.
  streaming:false
 };
}

function config():ProviderConfig|null{
 const availability=getServerAIAvailability();
 if(!availability.configured)return null;
 const provider=env("JEROAM_AI_PROVIDER")||"openai-compatible";
 return {provider,apiKey:env("JEROAM_AI_API_KEY"),model:env("JEROAM_AI_MODEL")||"gpt-4o-mini",baseUrl:(env("JEROAM_AI_BASE_URL")||"https://api.openai.com/v1").replace(/\/$/,"")};
}

function systemPrompt(request:AIRequest){
 const serialized=JSON.stringify(request.context);
 return [
  "You are Jeroam, a careful cultural guide for Jerusalem.",
  "Answer in the requested language: " + request.context.language + ".",
  "Use only the places, routes, claims and sources in the supplied Jeroam context.",
  "Never invent hours, prices, events, history, addresses, reviews, distances or availability. If the context is insufficient, put the gap in missing and say so plainly.",
  "Route stop prompts and other editorial copy are reading prompts, not evidence; never present them as historical facts.",
  "Return valid JSON only with keys: message, recommendations, places, routes, sources, actions, missing.",
  "Each place must use an existing placeId; each route an existing routeId; each source an existing sourceId. Factual claims must be traceable through claimIds and sourceIds.",
  "Actions may only target existing placeId or routeId values and should be useful, safe local actions.",
  "JEROAM_CONTEXT=" + serialized
 ].join("\n");
}

function makeId(){return crypto.randomUUID();}

function parseJSON(value:string):Record<string,unknown>{
 const fence=String.fromCharCode(96).repeat(3);
 const trimmed=value.trim().replace(fence,"").replace(fence,"").replace(/^json\s*/i,"").trim();
 try{return JSON.parse(trimmed) as Record<string,unknown>;}catch{throw new Error("The configured provider did not return the required structured JSON response.");}
}

function normalize(raw:Record<string,unknown>,request:AIRequest,provider:string,model:string):AIResponse{
 const placeMap=new Map(request.context.jeroam.places.map(place=>[place.id,place]));
 const routeMap=new Map(request.context.jeroam.routes.map(route=>[route.id,route]));
 const sourceMap=new Map(request.context.jeroam.sources.map(source=>[source.id,source]));
 const ids=(value:unknown)=>Array.isArray(value)?value.filter((item):item is string=>typeof item==="string"):[];
 const toRecord=(item:unknown)=>typeof item==="object"&&item!==null?item as Record<string,unknown>:{};
 const rawPlaces:unknown[]=Array.isArray(raw.places)?raw.places:ids(raw.placeIds).map(placeId=>({placeId}));
 const places=rawPlaces.map(item=>{const record=toRecord(item);
  const placeId=typeof record.placeId==="string"?record.placeId:""; const place=placeMap.get(placeId); if(!place)return null;
  return {placeId,name:place.name,area:place.area,category:place.category,reason:typeof record.reason==="string"?record.reason:undefined,claimIds:ids(record.claimIds).filter(claimId=>place.claims.some(claim=>claim.id===claimId))};
 }).filter(Boolean) as PlaceReference[];
 const rawRoutes:unknown[]=Array.isArray(raw.routes)?raw.routes:ids(raw.routeIds).map(routeId=>({routeId}));
 const routes=rawRoutes.map(item=>{const record=toRecord(item);
  const routeId=typeof record.routeId==="string"?record.routeId:""; const route=routeMap.get(routeId); if(!route)return null;
  return {routeId,title:route.title,description:route.description,durationMinutes:route.durationMinutes,distanceKm:route.distanceKm,stopIds:route.stopIds,reason:typeof record.reason==="string"?record.reason:undefined};
 }).filter(Boolean) as RouteReference[];
 const allClaims=request.context.jeroam.places.flatMap(place=>place.claims);
 const sources=(Array.isArray(raw.sources)?raw.sources:ids(raw.sourceIds).map(sourceId=>({sourceId}))).map(item=>{const record=toRecord(item);const sourceId=typeof record.sourceId==="string"?record.sourceId:"";const source=sourceMap.get(sourceId);if(!source)return null;const claimIds=ids(record.claimIds).filter(claimId=>allClaims.some(claim=>claim.id===claimId&&claim.sourceIds.includes(sourceId)));return {sourceId,title:source.title,publisher:source.publisher,url:source.url,claimIds};}).filter(Boolean) as SourceReference[];
 const actions=(Array.isArray(raw.actions)?raw.actions:[]).map(item=>{const record=toRecord(item);
  const type=record.type; const placeId=typeof record.placeId==="string"&&placeMap.has(record.placeId)?record.placeId:undefined; const routeId=typeof record.routeId==="string"&&routeMap.has(record.routeId)?record.routeId:undefined;
  if(typeof type!=="string"||!["add-place","add-route","save-place","save-route","start-route"].includes(type)||(type.includes("place")&&!placeId)||(type.includes("route")&&!routeId))return null;
  return {id:typeof record.id==="string"?record.id:makeId(),type:type as AIAction["type"],label:typeof record.label==="string"?record.label:type,placeId,routeId};
 }).filter(Boolean) as AIAction[];
 const recommendations=(Array.isArray(raw.recommendations)?raw.recommendations:[]).map(item=>{const record=toRecord(item);
  const placeId=typeof record.placeId==="string"&&placeMap.has(record.placeId)?record.placeId:undefined; const routeId=typeof record.routeId==="string"&&routeMap.has(record.routeId)?record.routeId:undefined;
  if(!placeId&&!routeId&&record.kind!=="itinerary")return null;
  return {id:typeof record.id==="string"?record.id:makeId(),kind:record.kind==="route"?"route":record.kind==="itinerary"?"itinerary":"place",title:typeof record.title==="string"?record.title:"",description:typeof record.description==="string"?record.description:"",placeId,routeId,durationMinutes:typeof record.durationMinutes==="number"?record.durationMinutes:undefined,confidence:record.confidence==="verified-match"?"verified-match":"planning-suggestion"};
 }).filter(Boolean) as AIResponse["recommendations"];
 const missing=ids(raw.missing);
 const content=typeof raw.message==="string"?raw.message:"";
 if(!content)throw new Error("The configured provider returned no message.");
 const message:AIMessage={id:makeId(),role:"assistant",content,createdAt:new Date().toISOString(),status:"complete"};
 return {id:makeId(),message,recommendations,places,routes,sources,actions,missing,provider,model};
}

class OpenAICompatibleProvider implements AIProvider{
 readonly id="openai-compatible";
 readonly model:string;
 constructor(private settings:ProviderConfig){this.model=settings.model;}
 async complete(request:AIRequest):Promise<AIResponse>{
  const history=request.messages.filter(message=>message.role!=="system").map(message=>({role:message.role,content:message.content}));
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),30_000);
  let response:Response;
  try{
   response=await fetch(this.settings.baseUrl + "/chat/completions",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer " + this.settings.apiKey},body:JSON.stringify({model:this.settings.model,messages:[{role:"system",content:systemPrompt(request)},...history,{role:"user",content:request.prompt}],temperature:.2,response_format:{type:"json_object"}}),signal:controller.signal});
  }finally{clearTimeout(timer);}
  if(!response.ok)throw new Error("AI provider returned HTTP " + response.status + ".");
  const body=await response.json() as {choices?:Array<{message?:{content?:string}}>};
  const raw=body.choices?.[0]?.message?.content;
  if(!raw)throw new Error("The configured provider returned an empty response.");
  return normalize(parseJSON(raw),request,this.id,this.settings.model);
 }
}

export function createServerAIProvider():AIProvider|null{
 const settings=config();
 return settings?new OpenAICompatibleProvider(settings):null;
}
