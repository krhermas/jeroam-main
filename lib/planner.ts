import type { Catalog, Itinerary, Place, Preferences } from "./contracts";
import {preferenceReason as transparentPreferenceReason, rankPlacesByPreferences} from "./preferences";
export function distanceKm(a:Pick<Place,"latitude"|"longitude">,b:Pick<Place,"latitude"|"longitude">){
 const r=Math.PI/180;const x=Math.sin((b.latitude-a.latitude)*r/2)**2+Math.cos(a.latitude*r)*Math.cos(b.latitude*r)*Math.sin((b.longitude-a.longitude)*r/2)**2;
 return 6371*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
}
export function pace(p:Preferences){return p.pacePreference==="Relaxed"||p.ages.some(a=>a<8||a>=70)||p.people>5?"relaxed":"standard";}
export function recommendationReason(place:Place,p:Preferences){
 return transparentPreferenceReason(place,p);
}
export function rankPlaces(c:Catalog,p:Preferences){
 return rankPlacesByPreferences(c,p);
}
export function scheduleItems(ids:string[],c:Catalog,p:Preferences,reasons:Record<string,string>={},reasonKind:"rules"|"ai"|"manual"="rules"){
 let start=540; let previous:Place|undefined;
 return ids.map(id=>{const place=c.places.find(x=>x.id===id);if(!place)throw Error("Unknown place in itinerary");
 if(previous){const lowerBound=distanceKm(previous,place);start+=Math.max(15,Math.ceil(lowerBound*20/5)*5)+(pace(p)==="relaxed"?15:0);}
 if(start>=720&&start<780)start=780;
 const minutes=place.visitMinutes;const item={placeId:id,start,minutes,reasonKind,reason:reasons[id]??recommendationReason(place,p)};start+=minutes;previous=place;return item;});
}
export function generateTripTitle(p: Preferences, locale = "ar"): string {
  const isArabic = locale === "ar";
  const isHebrew = locale === "he";
  const daysText = isArabic
    ? (p.days === 1 ? "يوم واحد" : p.days === 2 ? "يومان" : `${p.days} أيام`)
    : isHebrew
    ? (p.days === 1 ? "יום אחד" : p.days === 2 ? "יומיים" : `${p.days} ימים`)
    : (p.days === 1 ? "1 Day" : `${p.days} Days`);

  if (p.interests.includes("Food") || p.interests.includes("Markets")) {
    if (isArabic) return `جولة نكهات وأسواق القدس العتيقة · ${daysText}`;
    if (isHebrew) return `סיור טעמים ושווקים בעיר העתיקה · ${daysText}`;
    return `Jerusalem Souks & Flavors Journey · ${daysText}`;
  }
  if (p.interests.includes("Religious sites")) {
    if (isArabic) return `مسار رحاب القدس ومقدساتها الخالدة · ${daysText}`;
    if (isHebrew) return `מסלול קדושת ירושלים ואתריה · ${daysText}`;
    return `Jerusalem Sacred Heritage Trail · ${daysText}`;
  }
  if (p.interests.includes("History") || p.interests.includes("Heritage")) {
    if (isArabic) return `استكشاف عبق تاريخ القدس وأسوارها · ${daysText}`;
    if (isHebrew) return `מסע בהיסטוריה ובחומות ירושלים · ${daysText}`;
    return `Jerusalem Historic Walls & Heritage · ${daysText}`;
  }
  if (p.tripType === "Family") {
    if (isArabic) return `رحلة القدس العائلية الممتعة · ${daysText}`;
    if (isHebrew) return `חוויה משפחתית מיוחדת בירושלים · ${daysText}`;
    return `Jerusalem Family Adventure · ${daysText}`;
  }
  if (isArabic) return `برنامجك الذكي لاكتشاف القدس · ${daysText}`;
  if (isHebrew) return `המסלול החכם שלך בירושלים · ${daysText}`;
  return `Your Personalized Jerusalem Journey · ${daysText}`;
}

export function buildSuggestedTrip(c: Catalog, p: Preferences, rotation = 0): Itinerary {
  // Use a pseudo-random seed incorporating rotation or random invocation
  const seed = rotation !== 0 ? Math.abs(rotation) : Math.floor(Math.random() * 10000) + 1;

  // Score places with a dynamic variety perturbation so each run selects different combinations
  const scored = c.places.map((place, index) => {
    const baseScore = rankPlacesByPreferences(c, p).findIndex(x => x.id === place.id);
    const scoreVal = baseScore >= 0 ? Math.max(0, 100 - baseScore) : 0;

    // Variety hash based on place id + seed
    let hash = 0;
    for (let i = 0; i < place.id.length; i++) {
      hash = (hash * 31 + place.id.charCodeAt(i) * (seed + 13)) % 1000;
    }
    const varietyBonus = (hash / 1000) * 35; // Jitter up to 35 points for variety

    // Boost if place matches specific interests
    const matchesInterests = place.interests.filter(item => p.interests.includes(item as Preferences["interests"][number])).length;
    const finalScore = scoreVal + (matchesInterests * 15) + varietyBonus;

    return { place, finalScore, matchesInterests };
  });

  // Sort by finalScore descending
  scored.sort((a, b) => b.finalScore - a.finalScore);

  // Group into high-match pool and local gem pool
  const matchingPool = scored.filter(item => item.matchesInterests > 0).map(x => x.place);
  const fallbackPool = scored.map(x => x.place);
  const ranked = matchingPool.length >= p.days * 3 ? matchingPool : fallbackPool;

  const desiredCount = p.days * (pace(p) === "relaxed" ? 2 : p.pacePreference === "Full days" ? 4 : 3);
  const count = Math.min(ranked.length, Math.max(p.days * 2, desiredCount));
  const remaining = ranked.slice(0, count);

  const days: Itinerary["days"] = [];
  const reasons: Record<string, string> = {};

  for (let day = 1; day <= p.days; day++) {
    const capacity = Math.ceil(remaining.length / (p.days - day + 1));
    const chosen: Place[] = [];

    // Choose anchor place for this day
    if (remaining.length) {
      chosen.push(remaining.shift()!);
    }

    // Cluster subsequent places geographically for smooth walking
    while (chosen.length < capacity && remaining.length) {
      const prev = chosen[chosen.length - 1];
      const nextIndex = remaining.reduce((best, x, i) =>
        distanceKm(prev, x) < distanceKm(prev, remaining[best]) ? i : best, 0
      );
      chosen.push(remaining.splice(nextIndex, 1)[0]);
    }

    // Build personalized AI recommendation reasons for chosen places
    chosen.forEach(place => {
      const matched = place.interests.filter(i => p.interests.includes(i as Preferences["interests"][number]));
      const interestNames = matched.slice(0, 2).join(" و ");
      if (p.tripType === "Family") {
        reasons[place.id] = matched.length
          ? `اختيار ذكي مناسب للعائلة والأطفال يجمع بين المتعة والتعرف على ${interestNames}.`
          : "محطة مريحة وممتعة لجميع أفراد العائلة أثناء التجول.";
      } else if (p.tripType === "Friends") {
        reasons[place.id] = matched.length
          ? `محطة حيوية مثالية للأصدقاء لاستكشاف ${interestNames} وتوثيق اللحظات.`
          : "وجهة جماعية مميزة لإثراء اليوم بتجربة لا تُنسى.";
      } else {
        reasons[place.id] = matched.length
          ? `اقتراح مخصص لشغفك بـ ${interestNames} لتعيش أصالة القدس بتأمل.`
          : "تجربة أصيلة تم اختيارها بعناية لتناسب إيقاع يومك.";
      }
    });

    days.push({
      day,
      items: scheduleItems(chosen.map(x => x.id), c, p, reasons, "ai")
    });
  }

  const title = generateTripTitle(p, p.language === "العربية" ? "ar" : p.language === "עברית" ? "he" : "en");
  return {
    id: crypto.randomUUID(),
    title,
    mode: "suggested",
    days,
    createdAt: new Date().toISOString()
  };
}

export function validateTripPlaces(trip:Itinerary,c:Catalog){
 const ids=new Set(c.places.map(p=>p.id));const used=new Set<string>();const days=new Set<number>();
 for(const day of trip.days){if(days.has(day.day))throw Error("Duplicate day");days.add(day.day);let previousEnd=0;
 for(const item of day.items){if(!ids.has(item.placeId))throw Error("Unknown place");if(used.has(item.placeId))throw Error("A place may only appear once");used.add(item.placeId);if(item.start<previousEnd||item.start+item.minutes>1440)throw Error("Invalid schedule");previousEnd=item.start+item.minutes;}}
 return trip;
}


