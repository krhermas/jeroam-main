import type {Catalog,Itinerary,Preferences,Place,RouteStop} from "../contracts";

export type AIMessageRole="system"|"user"|"assistant";
export type AIMessageStatus="complete"|"streaming"|"error";

export type AIMessage={
 id:string;
 role:AIMessageRole;
 content:string;
 createdAt:string;
 status?:AIMessageStatus;
};

/** A provider-neutral conversation envelope. The Guide UI can persist this
 * shape today and a server provider can consume it later without changing
 * the conversation model. */
export type AIConversation={
 id:string;
 messages:AIMessage[];
 createdAt:string;
 updatedAt:string;
 context?:Pick<AIContext,"locale"|"language">;
};

export type PlaceReference={
 placeId:string;
 name:string;
 area:string;
 category:string;
 reason?:string;
 claimIds:string[];
};

export type RouteReference={
 routeId:string;
 title:string;
 localizedTitle?:string;
 localizedDescription?:string;
 description:string;
 durationMinutes:number;
 distanceKm:number|null;
 distanceKind?:"straight-line-estimate"|"measured-walk"|"unavailable";
 coordinates?:Array<{latitude:number;longitude:number}>;
 stopIds:string[];
 categories?:string[];
 interests?:string[];
 startPlaceId?:string|null;
 endPlaceId?:string|null;
 reason?:string;
};

export type SourceReference={
 sourceId:string;
 title:string;
 publisher:string;
 url:string;
 claimIds:string[];
};

export type Recommendation={
 id:string;
 kind:"place"|"route"|"itinerary";
 title:string;
 description:string;
 placeId?:string;
 routeId?:string;
 durationMinutes?:number;
 confidence:"verified-match"|"planning-suggestion";
};

export type AIActionType="add-place"|"add-route"|"save-place"|"save-route"|"start-route";
export type AIAction={
 id:string;
 type:AIActionType;
 label:string;
 placeId?:string;
 routeId?:string;
};

export type AIPlaceContext={
 id:string;
 name:string;
 localizedNames:Place["localizedNames"];
 shortDescription:string;
 description:string;
 kind:Place["kind"];
 category:string;
 area:string;
 interests:string[];
 tags:string[];
 imageIds:string[];
 practicalInformation:string|null;
 visitMinutes:number;
 costType:string;
 estimatedCost:number|null;
 coordinates:Place["coordinates"];
 address:string|null;
 openingHours:string|null;
 sourceIds:string[];
 claims:Array<{id:string;text:string;sourceIds:string[]}>;
};

export type AIRouteContext={
 id:string;
 title:string;
 localizedTitles?:Record<string,string>;
 localizedDescriptions?:Record<string,string>;
 description:string;
 theme:string;
 difficulty:string;
 durationMinutes:number;
 distanceKm:number|null;
 stopIds:string[];
 stops:RouteStop[];
 coordinates?:Array<{latitude:number;longitude:number}>;
 categories?:string[];
 interests?:string[];
 startPlaceId?:string|null;
 endPlaceId?:string|null;
 sourceIds:string[];
};

export type AISourceContext={
 id:string;
 title:string;
 publisher:string;
 url:string;
};

export type AIContext={
 locale:"en"|"ar"|"he";
 language:Preferences["language"];
 user:{
  preferences:Preferences|null;
  /** IDs are retained so the server can resolve saved content without
   * trusting client-supplied place text. */
  savedPlaceIds:string[];
  savedRouteIds:string[];
 };
 current:{
  placeId?:string;
  routeId?:string;
  selectedDay?:number;
  availableMinutes?:number;
 };
 itinerary:Itinerary|null;
 jeroam:{
  places:AIPlaceContext[];
  routes:AIRouteContext[];
  sources:AISourceContext[];
 };
};

export type AIRequest={
 conversationId?:string;
 messages:AIMessage[];
 prompt:string;
 context:AIContext;
 stream?:boolean;
};

export type AIResponse={
 id:string;
 message:AIMessage;
 recommendations:Recommendation[];
 places:PlaceReference[];
 routes:RouteReference[];
 sources:SourceReference[];
 actions:AIAction[];
 missing:string[];
 provider:string;
 model:string|null;
};

export type AIStreamEvent={type:"delta";text:string}|{type:"complete";response:AIResponse}|{type:"error";message:string};

export type AIAvailability={
 configured:boolean;
 provider:string|null;
 model:string|null;
 streaming:boolean;
};

export interface AIProvider{
 readonly id:string;
 readonly model:string;
 complete(request:AIRequest):Promise<AIResponse>;
 /** Optional streaming contract. The current adapter returns complete JSON; a streaming adapter can be added without changing the Guide UI. */
 stream?(request:AIRequest,onEvent:(event:AIStreamEvent)=>void):Promise<void>;
}

export type AIProviderFactory=(config:Record<string,string|undefined>)=>AIProvider|null;

export type AIContextInput={
 catalog:Catalog;
 preferences:Preferences|null;
 trip:Itinerary|null;
 locale:"en"|"ar"|"he";
 currentPlaceId?:string;
 currentRouteId?:string;
 selectedDay?:number;
 availableMinutes?:number;
 savedPlaceIds?:string[];
 savedRouteIds?:string[];
 /** Optional server-side retrieval scope. Omitted means the complete local
  * catalog, while an empty array intentionally sends no catalog records from
  * the browser. */
 placeIds?:string[];
 routeIds?:string[];
 sourceIds?:string[];
};
