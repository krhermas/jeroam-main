# Jeroam — Roam Jerusalem Differently

> **«تخيّل إنك بتزور القدس لأول مرة. عندك 3 أيام، ميزانيتك محدودة، وعندك اهتمامات معينة. بس أول ما تيجي ترتب رحلتك، بتلاقي حالك ضايع بين Google Maps، الأماكن السياحية، المطاعم، المواصلات، ومصادر معلومات كثيرة ومختلفة... ومن هون طلعت فكرة Jeroam.»**
>
> **«Jeroam هي منصة بتجمع الأشياء الأساسية اللي بحتاجها السائح في القدس بمكان واحد. من قبل ما تبدأ رحلتك، بتقدر تحدد ميزانيتك واهتماماتك والوقت المتاح إلك، تعرف الأماكن اللي بتناسبك، ترتب جدول زيارتك، تفهم كيف تتنقل بينها، وتشوف معلومات موثوقة عنها.»**
>
> **«والأهم إن Jeroam ما بعطي نفس الخطة لكل شخص. المنصة بتبني تجربة مناسبة إلك حسب اهتماماتك، وقتك، ميزانيتك ونوع رحلتك، وبتستخدم الذكاء الاصطناعي حتى تخلي التخطيط أبسط وأسرع وأكثر تخصيصًا.»**
>
> **«ببساطة، بدل ما ترتب رحلتك من عشر أماكن مختلفة، Jeroam بخلي رحلتك للقدس تبدأ من مكان واحد.»**

---

### Key Pillars / المحاور الأساسية:
1. **كل احتياجاتك بمكان واحد (All in One Place)**:
   - استكشاف الأماكن التاريخية والتراثية المقدسية الحقيقية (Dome of the Rock, Damascus Gate, Old City Souks, Holy Sepulchre).
   - حجز الفنادق وأماكن الإقامة القريبة عبر خرائط جوجل وBooking.com مباشرة.
   - خط طوارئ ومساعدة فوري SOS واتصال مباشر + واتساب إلى **`+972 595422340`**.
2. **تخطيط مخصص بالذكاء الاصطناعي (AI Personalization)**:
   - المنصة لا تقدم نفس الخطة للجميع؛ بل تفصل خطة رحلتك حسب ميزانيتك، وقتك، واهتماماتك، مع حكواتي الذكاء الاصطناعي وتدريب ثقافي موثوق.
3. **بساطة فائقة في الاستخدام (Ultra-Clean Navigation)**:
   - تصميم أصفر وأبيض أنيق يعكس هوية القدس وشعار Jeroam.
   - تنقل سلس وبسيط جداً بدون تعقيد (بحد أقصى زران في كل صفحة وبطاقة).
   - مبدل لغات دائم وفوري بضغطة واحدة (العربية، English، עברית).

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173.

## Frontend scope

- No Supabase, authentication backend, database, or AI credentials are required for the default frontend experience.
- Preferences, trips, saved places/routes, and the demo profile are stored in `localStorage` with a `jeroam-` prefix.
- The Guide sends structured requests to /api/ai. With no server provider configured it shows an explicit not-connected state and never invents a response. The UI, context builder, grounding rules, response references and My Trip actions are provider-agnostic.
- Leaflet + OpenStreetMap provide the map surface. `PlaceMap` consumes the shared model in `lib/map.ts`, supports place/route/itinerary/recommendation modes, selected previews and fit controls, and links out to Google Maps for directions. If Leaflet or its tiles are unavailable, it falls back to the same source-backed ordered place list; a future provider can implement `MapProviderAdapter` without changing page data contracts.

## Project structure

- `app/` — App Router pages for every product surface.
- `components/jeroam/` — reusable product UI and client interactions.
- `lib/contracts.ts` — shared TypeScript contracts and validation schemas.
- `lib/map.ts` — provider-neutral map model, marker/line modes, coordinate validation and adapter interface shared by every map surface.
- `lib/catalog.ts` + `data/catalog.json` — replaceable demo catalog and source records. `lib/catalog.ts` is the normalization boundary: the compact JSON snapshot is enriched into the canonical `Catalog` contract consumed by the UI.
- `lib/planner.ts` — backend-ready rules-based planning logic.
- `lib/preferences.ts` — shared, transparent preference scoring and explanation signals used by Explore, Routes, the homepage and itinerary generation.
- `lib/ai/` — provider-agnostic AI types, context builder, safe client service and server adapter.
- `app/api/ai/route.ts` — server-only AI boundary. It reports availability without exposing secrets and validates provider responses before they reach the UI.
- `public/images/` — Jerusalem imagery with credits shown in the UI.

## Checks

```bash
node node_modules/typescript/bin/tsc --noEmit
node node_modules/eslint/bin/eslint.js app components lib
npm run build
```

Production integrations can replace the local provider without changing page-level components: map the catalog and planner contracts to Supabase/PostgreSQL, add authenticated persistence, and replace the local guide adapter with a server-side retrieval-augmented AI endpoint.

## Local catalog and provenance

Every place exposes the same backend-ready shape through `lib/contracts.ts`:

- `coordinates` is kept alongside the legacy `latitude`/`longitude` aliases so maps and future mobile clients can share one contract.
- `shortDescription`, `description`, `tags`, `localizedNames`, `factualInformation`, `sourceIds`, `lastVerifiedAt`, `priceInfo`, `accessibility`, and `aiStory` are explicit fields. Unknown values remain `null` or an empty object/array; the normalizer never fills them with guesses.
- `factualInformation` is made of `Claim` records. Each claim carries one or more source ids, and the source register links those ids to the original publisher URL.
- `placeCategories` and `placeKinds` in `lib/contracts.ts` provide a shared taxonomy for historical landmarks, museums, markets, cultural/heritage locations, restaurants/cafes, viewpoints, parks and transport hubs. The snapshot combines hand-reviewed records with conservatively classified OpenStreetMap records; unsupported facts remain unavailable rather than being guessed.
- `Catalog.routeStops` is a normalized, ordered relation between routes and places. Each stop carries the source ids inherited from its place, so a route UI or future mobile client can inspect provenance without parsing a JSON blob. Routes also expose ordered coordinates, categories, interests, areas, start/end place ids, localized title slots, family suitability and an explicit distance kind. Distances in the curated layer are straight-line map estimates unless a future measured-walk provider supplies otherwise.
- `TripActivity` records are derived deterministically from the same places and routes. They are a reusable API-friendly activity feed for a future mobile client, not a second copy of tourism facts.
- `validateCatalog()` runs when the release is loaded. It rejects duplicate ids, missing relations, invalid coordinates, non-HTTPS source URLs, unsourced claims, and prices/opening hours/accessibility values that cannot be traced to a source. This keeps bad data out of every page and the AI context.
- `displayPlaceName()` reads an official localized name when one is present and falls back to the canonical English name. The snapshot does not invent Hebrew or Arabic names; they can be added to `localizedNames` when verified by an institution/source.

The current release snapshot was checked on `2026-09-17`. Opening hours, prices, accessibility details, live events, reviews and restaurant availability are deliberately left unavailable where the source register does not provide a reliable record. Image credits and licenses are stored in the catalog and shown next to imagery.

## Personalization state

The Profile page is the single editor for the local travel profile. It keeps the existing onboarding fields and adds pace (`Relaxed`, `Balanced`, `Full days`), movement (`Walking`, `Public transport`, `Taxi / rideshare`, `Mixed`) and optional comfort/access signals. These are non-sensitive choices used by deterministic catalog scoring; the UI labels recommendations as catalog matches rather than AI claims. Saved places, saved routes, the current itinerary and up to six recently viewed places/routes use separate `jeroam-*` localStorage keys so language or theme changes never reset them.

The current release contains 288 source-backed place records across 11 categories, 20 curated route sequences and derived `TripActivity` records. Imported records are tagged as OpenStreetMap classifications and keep their source URLs; they do not claim historical detail, prices, ratings or reviews unless separately verified.

The route library is reproducible with `npm run data:routes`. It adds distinct
Old City, faith/heritage, museum, arts, market/food, family, modern and
viewpoint sequences from existing place IDs. New distances are geodesic map
estimates marked `straight-line-estimate`; no measured walking times are
invented.

## Jerusalem updates

`lib/updates.ts` owns the updates boundary. The default `curatedUpdatesProvider` derives visitor-facing records from verified catalog claims, attaches the original source URL, and marks each item as a `verified-snapshot`. Publication dates remain `null` when the source does not publish one; the UI renders that state instead of guessing. The exported `UpdatesProvider` contract accepts synchronous or asynchronous loaders, so a future server-side news/RSS adapter can be plugged in without changing `UpdatesCards` or the `/updates` page. A remote adapter should return the normalized `JerusalemUpdate` shape and set `freshness: "live"` only after a real, traceable feed is connected.


## Enable the AI provider later

The current Guide stays explicitly disconnected until a server-side provider is configured. When ready, set these variables in the server environment (never use `NEXT_PUBLIC_*` for secrets):

See [`docs/AI_SETUP.md`](docs/AI_SETUP.md) for the provider contract, retrieval boundary, validation behavior and activation checklist.

```bash
JEROAM_AI_PROVIDER=openai-compatible
JEROAM_AI_API_KEY=your-server-side-key
JEROAM_AI_MODEL=gpt-4o-mini
# Optional: JEROAM_AI_BASE_URL=https://api.openai.com/v1
```

The provider receives the structured Jeroam context and must return JSON with `message`, `recommendations`, `places`, `routes`, `sources`, `actions`, and `missing`. Add another `AIProvider` implementation in `lib/ai/server.ts` for Gemini, Anthropic, or another compatible service without changing the Guide UI.

## Production content foundation

The backend-ready relational model is in
`supabase/migrations/20260917_content_foundation.sql`. It covers localized
places, category/tag relationships, source-backed claims, licensed place/route images,
routes/stops, activities, trip relationships, saved records, first-party reviews/reports,
and import bookkeeping with Row Level Security. Apply it with the Supabase CLI
when a project is available; the frontend continues to run from the local
snapshot without credentials.

Refresh the local snapshot reproducibly with `npm run data:ingest` (dry run) or
`npm run data:ingest -- --write`. The importer uses tagged OpenStreetMap
Overpass records and optional exact-name Wikimedia Commons image metadata,
preserves current hand-reviewed records/routes, and writes a reviewable
`data/ingestion-report.json`. It never infers prices, ratings, reviews,
historical claims, or opening hours. Run `npm run data:verify` before promoting
an imported snapshot. With a server-side Supabase project configured, add
`--supabase` to the write command to upsert the normalized records; the service
role key is read only from the server environment.




