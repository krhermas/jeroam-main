import {buildAIContext} from "./context";
import type {AIContext,AIContextInput} from "./types";
import {distanceKm} from "../planner";
import type {Place,CulturalRoute,Preferences} from "../contracts";

const STOP_WORDS=new Set([
 "a","about","after","and","around","can","for","from","have","how","i","in","is","me","my","near","of","on","only","should","something","tell","the","this","to","today","visit","want","what","where","with","you",
 "في","من","إلى","عن","حول","ما","ماذا","أين","هل","هذا","هذه","مع","أريد","لدي","ساعات",
 "ב","על","עם","מה","איפה","איך","רוצה","רוצים","יש","לי","ליד","היום","את","אתם",
]);

function tokens(value:string){
 return value.toLocaleLowerCase().split(/[\s,.;:!?/\\|()[\]{}]+/u).map(item=>item.trim()).filter(item=>item.length>1&&!STOP_WORDS.has(item));
}

function placeText(place:Place){return [place.name,place.area,place.category,place.subcategory??"",place.shortDescription,place.description,place.practicalInformation??"",...place.aliases,...place.tags,...place.interests,...Object.values(place.localizedNames??{})].join(" ");}
function routeText(route:CulturalRoute){return [route.title,route.description,route.theme,route.difficulty,route.difficultyNote,...(route.categories??[]),...(route.interests??[]),...(route.areas??[])].join(" ");}

function overlapScore(text:string,query:string[]){
 if(!query.length)return 0;
 const haystack=tokens(text);
 return query.reduce((score,token)=>score+(haystack.some(value=>value===token)?3:haystack.some(value=>value.includes(token)||token.includes(value))?1:0),0);
}

function scorePlace(place:Place,query:string[],input:AIContextInput){
 const preferences=input.preferences;
 let score=overlapScore(placeText(place),query);
 score+=place.interests.filter(interest=>preferences?.interests.includes(interest as Preferences["interests"][number])).length*4;
 if(input.savedPlaceIds?.includes(place.id))score+=5;
 if(input.currentPlaceId===place.id)score+=20;
 if(input.availableMinutes!==undefined){
  if(place.visitMinutes<=input.availableMinutes)score+=2;
  else score-=Math.min(4,(place.visitMinutes-input.availableMinutes)/30);
 }
 if(preferences?.accessibility.includes("shorter-visits")&&place.visitMinutes<=60)score+=2;
 return score;
}

function scoreRoute(route:CulturalRoute,query:string[],input:AIContextInput){
 const preferences=input.preferences;
 let score=overlapScore(routeText(route),query);
 score+=(route.interests??[]).filter(interest=>preferences?.interests.includes(interest as Preferences["interests"][number])).length*4;
 if(input.savedRouteIds?.includes(route.id))score+=5;
 if(input.currentRouteId===route.id)score+=20;
 if(input.availableMinutes!==undefined&&route.durationMinutes<=input.availableMinutes)score+=2;
 return score;
}

/**
 * Resolve a small, relevant context window from the trusted local catalog.
 * This is intentionally deterministic: the model may explain or rank these
 * records later, but it cannot introduce records that retrieval did not select.
 */
export function retrieveAIContext(input:AIContextInput&{prompt:string}):AIContext{
 const query=tokens(input.prompt);
 const currentPlace=input.currentPlaceId?input.catalog.places.find(place=>place.id===input.currentPlaceId):undefined;
 const placeRanked=input.catalog.places.map(place=>({place,score:scorePlace(place,query,input)}));
 if(currentPlace){
  for(const item of placeRanked){
   if(item.place.id===currentPlace.id)continue;
   const distance=distanceKm(currentPlace,item.place);
   if(distance<=2)item.score+=Math.max(0,4-distance);
  }
 }
 const rankedPlaces=placeRanked.sort((a,b)=>b.score-a.score||a.place.name.localeCompare(b.place.name)).map(item=>item.place);
 const forcedPlaceIds=new Set([input.currentPlaceId,...(input.savedPlaceIds??[]),...(input.trip?.days.flatMap(day=>day.items.map(item=>item.placeId))??[])]);
 const chosenPlaces=[...rankedPlaces.slice(0,24),...rankedPlaces.filter(place=>forcedPlaceIds.has(place.id))].filter((place,index,array)=>array.findIndex(item=>item.id===place.id)===index);
 const routeRanked=input.catalog.routes.map(route=>({route,score:scoreRoute(route,query,input)}));
 const rankedRoutes=routeRanked.sort((a,b)=>b.score-a.score||a.route.title.localeCompare(b.route.title)).map(item=>item.route);
 const forcedRouteIds=new Set([input.currentRouteId,...(input.savedRouteIds??[])]);
 const chosenRoutes=[...rankedRoutes.slice(0,8),...rankedRoutes.filter(route=>forcedRouteIds.has(route.id))].filter((route,index,array)=>array.findIndex(item=>item.id===route.id)===index);

 // Preserve the active itinerary day and the stops of selected routes so an
 // answer can refer to the user's actual plan without sending the whole catalog.
 const itineraryIds=input.trip?.days.filter(day=>input.selectedDay===undefined||day.day===input.selectedDay).flatMap(day=>day.items.map(item=>item.placeId))??[];
 const routeStopIds=chosenRoutes.flatMap(route=>route.stopIds);
 const placeIds=[...new Set([...chosenPlaces.map(place=>place.id),...itineraryIds,...routeStopIds,currentPlace?.id].filter((id):id is string=>Boolean(id)))];
 const routeIds=chosenRoutes.map(route=>route.id);
 const sourceIds=[...new Set([
  ...input.catalog.places.filter(place=>placeIds.includes(place.id)).flatMap(place=>[...place.sourceIds,...place.claims.flatMap(claim=>claim.sourceIds)]),
  ...chosenRoutes.flatMap(route=>route.sourceIds),
 ])];
 return buildAIContext({...input,placeIds,routeIds,sourceIds});
}
