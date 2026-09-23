import { z } from "zod";
export const interests = ["History","Heritage","Religious sites","Culture","Markets","Food","Restaurants","Architecture","Art","Museums","Local experiences","Walking","Photography","Events","Shopping"] as const;
export const languages = ["English","العربية","עברית"] as const;
export const travelStyles = ["Slow & thoughtful","Curious & cultural","Packed with discoveries","Food-first","History-first","Hidden gems"] as const;
export const pacePreferences = ["Relaxed","Balanced","Full days"] as const;
export type PacePreference=(typeof pacePreferences)[number];
/** Personal comfort preferences are intentionally small, non-sensitive signals
 * used only to tune local recommendations and itinerary pacing. */
export const transportPreferences = ["Walking","Public transport","Taxi / rideshare","Mixed"] as const;
export type TransportPreference=(typeof transportPreferences)[number];
export const accessibilityPreferences = ["step-free","shorter-visits","rest-breaks","quiet-spaces"] as const;
export type AccessibilityPreference=(typeof accessibilityPreferences)[number];
/** Canonical place taxonomy shared by the local release, Supabase schema and a
 * future mobile client. Importers may add records only when their source
 * provenance is retained. */
export const placeCategories = ["History","Heritage","Religious sites","Culture","Markets","Food","Restaurants","Architecture","Art","Museums","Local experiences","Walking","Photography","Events","Shopping","Viewpoints","Parks & public spaces","Transport"] as const;
export type PlaceCategory=(typeof placeCategories)[number];
export const placeKinds = ["historical-landmark","museum","market","cultural-location","heritage-location","restaurant-cafe","viewpoint","park-public-space","transport-hub"] as const;
export type PlaceKind=(typeof placeKinds)[number];
export const costTypes = ["free","paid","unknown"] as const;
export type CostType=(typeof costTypes)[number];
export const activityKinds = ["place-visit","route"] as const;
export type ActivityKind=(typeof activityKinds)[number];
export const preferencesSchema = z.object({
 tripType:z.enum(["Solo","Family","Friends"]), people:z.number().int().min(1).max(20),
 ages:z.array(z.number().int().min(0).max(120)).min(1).max(20), days:z.number().int().min(1).max(14),
 budget:z.number().min(0).max(10000), language:z.enum(languages), interests:z.array(z.enum(interests)).min(1).max(15), travelStyle:z.enum(travelStyles),
 transportPreference:z.enum(transportPreferences).default("Walking"), pacePreference:z.enum(pacePreferences).default("Balanced"), accessibility:z.array(z.enum(accessibilityPreferences)).max(4).default([])
}).strict().superRefine((v,c)=>{if(v.ages.length!==v.people)c.addIssue({code:z.ZodIssueCode.custom,message:"Enter an age for every traveler.",path:["ages"]});if(v.tripType==="Solo"&&v.people!==1)c.addIssue({code:z.ZodIssueCode.custom,message:"A solo trip has one traveler.",path:["people"]});});
export type Preferences=z.infer<typeof preferencesSchema>;
export const defaultPreferences:Preferences={tripType:"Solo",people:1,ages:[28],days:2,budget:200,language:"English",interests:["History","Food","Culture"],travelStyle:"Curious & cultural",transportPreference:"Walking",pacePreference:"Balanced",accessibility:[]};
/** A source is attached to a claim, location record, image or planning note.
 * Keeping this as a first-class object means the UI can always link a visitor
 * back to the original publisher instead of showing an untraceable citation.
 */
export type SourceKind="institution"|"tourism"|"heritage"|"coordinate"|"image"|"open-data";
export type Source={id:string;title:string;publisher:string;url:string;accessedAt:string;kind?:SourceKind;lastVerifiedAt?:string;reliabilityNote?:string};
export const updateCategories=["Events","Culture","Heritage","Museums","Tourism","Travel information"] as const;
export type UpdateCategory=(typeof updateCategories)[number];
/** A source-aware update item. `publicationDate` is nullable because many
 * institution pages do not publish a date; `freshness` keeps a future live
 * feed distinct from this curated, verified release snapshot. */
export type JerusalemUpdate={
 id:string;headline:string;summary:string;publicationDate:string|null;source:{id:string;title:string;publisher:string;url:string};sourceUrl:string;
 imageId:string|null;category:UpdateCategory;lastUpdatedAt:string;freshness:"verified-snapshot"|"live";placeId?:string;
};
export type Claim={id:string;text:string;sourceIds:string[];kind:"fact"|"interpretation"|string};
export type Photo={path:string;author:string;license:string;sourceUrl:string;licenseUrl:string;changes:string};
export type LocalizedNames=Partial<Record<"en"|"he"|"ar"|"fr"|"es"|"de"|"ru",string>>;
export type Coordinates={latitude:number;longitude:number};
export type PriceInfo={amount:number|null;currency:"ILS";display:string|null;sourceId:string|null;lastVerifiedAt:string|null};
export type AccessibilityInfo={summary:string|null;sourceId:string|null};
export type AiStory={kind:"ai-generated";text:string;sourceClaimIds:string[]};
export type PlaceImage={id:string;url:string;author:string|null;license:string|null;sourceUrl:string;licenseUrl:string|null;altText:string|null;lastVerifiedAt:string};
/** Canonical place contract shared by the web UI and a future mobile client.
 * Legacy flat fields remain available during the frontend-only migration.
 */
export type Place={
 id:string;name:string;localizedNames:LocalizedNames;localizedShortDescriptions?:LocalizedNames;localizedDescriptions?:LocalizedNames;aliases:string[];kind:PlaceKind;category:PlaceCategory;subcategory:string|null;area:string;interests:string[];tags:string[];
 tagline:string;shortDescription:string;description:string;practicalInformation:string|null;coordinates:Coordinates;latitude:number;longitude:number;address:string|null;website:string|null;phone:string|null;
 visitMinutes:number;costType:CostType;estimatedCost:number|null;priceInfo:PriceInfo;costSourceId:string|null;
 openingHours:string|null;openingHoursSourceId:string|null;locationSourceId:string;imageId:string|null;imageIds:string[];
 transportRelevance:string[];relatedPlaceIds:string[];relatedRouteIds:string[];claims:Claim[];factualInformation:Claim[];sourceIds:string[];lastVerifiedAt:string;accessibility:AccessibilityInfo|null;aiStory:AiStory|null;
};
/** A source-backed walking sequence. Derived fields are filled by the catalog
 * adapter so raw JSON can stay compact while every consumer receives the same
 * API-friendly shape. Localized titles only contain names that have been
 * explicitly verified; the English title and description are always present. */
export type CulturalRoute={
 id:string;title:string;localizedTitles?:LocalizedNames;localizedDescriptions?:LocalizedNames;description:string;theme:string;
 difficulty:string;difficultyNote:string;durationMinutes:number;distanceKm:number|null;
 imageId:string;stopIds:string[];sourceIds:string[];intro:string|null;prompts:string[];
  categories?:PlaceCategory[];interests?:string[];coordinates?:Coordinates[];startPlaceId?:string|null;endPlaceId?:string|null;distanceKind?:"straight-line-estimate"|"measured-walk"|"unavailable";
  areas?:string[];familySuitability?:"good-fit"|"possible"|"not-assessed";sourceBackedReason?:string;
  lastVerifiedAt?:string;
};
/** Stable API-facing aliases for the future backend/mobile client. */
export type Route=CulturalRoute;
export type RouteStop={routeId:string;placeId:string;order:number;prompt?:string;story?:string;durationMinutes?:number;sourceIds:string[]};
export type TripActivity={id:string;kind:ActivityKind;title:string;description:string;placeId?:string;routeId?:string;durationMinutes:number|null;sourceIds:string[]};
export type Catalog={version:string;sources:Source[];images:Record<string,Photo>;places:Place[];routes:CulturalRoute[];routeStops:RouteStop[];activities:TripActivity[]};
export const itineraryItemSchema=z.object({placeId:z.string().min(1).max(80),minutes:z.number().int().min(10).max(300),reason:z.string().max(1500),reasonKind:z.enum(["rules","ai","manual"]).default("rules"),start:z.number().int().min(0).max(1439),notes:z.string().max(500).optional()});
export const itinerarySchema=z.object({id:z.string().uuid(),title:z.string().min(1).max(120),mode:z.enum(["suggested","ai","manual"]),startDate:z.string().date().optional(),transport:z.enum(["Walking","Public transport","Taxi / rideshare","Mixed"] as const).optional(),days:z.array(z.object({day:z.number().int().min(1).max(14),items:z.array(itineraryItemSchema).max(10)})).min(1).max(14),createdAt:z.string().datetime({offset:true})}).strict();
export type Itinerary=z.infer<typeof itinerarySchema>;
export type ItineraryItem=z.infer<typeof itineraryItemSchema>;
export type TravelerPreferences=Preferences;
export type AiReply={answer:string;placeIds:string[];claimIds:string[];missing:string[]};
export type Status={database:boolean;ai:boolean;supabaseUrl:string|null;supabaseKey:string|null;model:string|null};
export class AppError extends Error{constructor(message:string,public status=400){super(message);}}



