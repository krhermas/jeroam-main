import {NextResponse} from "next/server";
import {createServerAIProvider,getServerAIAvailability} from "@/lib/ai/server";
import type {AIRequest} from "@/lib/ai/types";
import {retrieveAIContext} from "@/lib/ai/retrieval";
import {allowAIRequest} from "@/lib/ai/rate-limit";
import {releaseCatalog} from "@/lib/catalog";
import {itinerarySchema,preferencesSchema} from "@/lib/contracts";

function isRequest(value:unknown):value is AIRequest{
 if(!value||typeof value!=="object")return false;
 const request=value as Partial<AIRequest>;
 return (request.conversationId===undefined||(typeof request.conversationId==="string"&&request.conversationId.length<=120))&&typeof request.prompt==="string"&&request.prompt.trim().length>0&&request.prompt.length<=2000&&Array.isArray(request.messages)&&request.messages.length<=30&&request.messages.every(message=>Boolean(message&&typeof message==="object"&&((message as AIRequest["messages"][number]).role==="user"||(message as AIRequest["messages"][number]).role==="assistant")&&typeof (message as AIRequest["messages"][number]).content==="string"&&(message as AIRequest["messages"][number]).content.length<=2000))&&Boolean(request.context&&typeof request.context==="object");
}

const MAX_REQUEST_BYTES=320_000;

function requestKey(request:Request){
 return request.headers.get("cf-connecting-ip")??request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()??"anonymous";
}

function trustedRequest(request:AIRequest):AIRequest{
 const incoming=request.context;
 const parsedPreferences=incoming.user?.preferences?preferencesSchema.safeParse(incoming.user.preferences):null;
 const parsedTrip=incoming.itinerary?itinerarySchema.safeParse(incoming.itinerary):null;
 const locale=incoming.locale==="ar"||incoming.locale==="he"?incoming.locale:"en";
 const current=incoming.current??{};
 const currentPlaceId=typeof current.placeId==="string"&&releaseCatalog.places.some(place=>place.id===current.placeId)?current.placeId:undefined;
 const currentRouteId=typeof current.routeId==="string"&&releaseCatalog.routes.some(route=>route.id===current.routeId)?current.routeId:undefined;
 const savedPlaceIds=Array.isArray(incoming.user?.savedPlaceIds)?incoming.user.savedPlaceIds.filter((id):id is string=>typeof id==="string"&&releaseCatalog.places.some(place=>place.id===id)):[];
 const savedRouteIds=Array.isArray(incoming.user?.savedRouteIds)?incoming.user.savedRouteIds.filter((id):id is string=>typeof id==="string"&&releaseCatalog.routes.some(route=>route.id===id)):[];
 return {...request,context:retrieveAIContext({
  catalog:releaseCatalog,
  preferences:parsedPreferences?.success?parsedPreferences.data:null,
  trip:parsedTrip?.success?parsedTrip.data:null,
  locale,
  currentPlaceId,
  currentRouteId,
  selectedDay:typeof current.selectedDay==="number"&&Number.isInteger(current.selectedDay)?current.selectedDay:undefined,
  availableMinutes:typeof current.availableMinutes==="number"&&Number.isFinite(current.availableMinutes)?current.availableMinutes:undefined,
  savedPlaceIds,
  savedRouteIds,
  prompt:request.prompt
 })};
}

export async function GET(){
 return NextResponse.json(getServerAIAvailability(),{headers:{"Cache-Control":"no-store"}});
}

export async function POST(request:Request){
 const availability=getServerAIAvailability();
 if(!availability.configured){
  return NextResponse.json({code:"AI_NOT_CONFIGURED",error:"The guide is being prepared.",...availability},{status:503});
 }
 const limit=allowAIRequest(requestKey(request));
 if(!limit.allowed)return NextResponse.json({code:"AI_RATE_LIMITED",error:"The guide is taking a short pause. Try again soon."},{status:429,headers:{"Retry-After":String(limit.retryAfter)}});
 let body:unknown;
 const declaredLength=Number(request.headers.get("content-length")??"");
 if(Number.isFinite(declaredLength)&&declaredLength>MAX_REQUEST_BYTES)return NextResponse.json({code:"REQUEST_TOO_LARGE",error:"Please keep the question and conversation smaller."},{status:413});
 try{
  const raw=await request.text();
  if(new TextEncoder().encode(raw).byteLength>MAX_REQUEST_BYTES)return NextResponse.json({code:"REQUEST_TOO_LARGE",error:"Please keep the question and conversation smaller."},{status:413});
  body=JSON.parse(raw) as unknown;
 }catch{return NextResponse.json({code:"INVALID_JSON",error:"The AI request was not valid JSON."},{status:400});}
 if(!isRequest(body))return NextResponse.json({code:"INVALID_REQUEST",error:"Please ask a question of up to 2,000 characters."},{status:400});
 const provider=createServerAIProvider();
 if(!provider)return NextResponse.json({code:"AI_PROVIDER_UNAVAILABLE",error:"The guide is temporarily unavailable."},{status:503});
 try{
  const response=await provider.complete(trustedRequest(body));
  return NextResponse.json(response,{headers:{"Cache-Control":"no-store"}});
 }catch{
  // Keep provider details server-side. The browser only needs a retryable,
  // visitor-friendly error and must never receive provider or credential
  // diagnostics.
  return NextResponse.json({code:"AI_PROVIDER_ERROR",error:"The guide could not answer right now."},{status:502});
 }
}
