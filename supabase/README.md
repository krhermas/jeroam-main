# Jeroam content foundation

`migrations/20260917_content_foundation.sql` is the backend-ready PostgreSQL
schema for the catalog. It is intentionally separate from the current local
frontend snapshot, so the web app can continue to run without Supabase
credentials while the same records are imported later.

## Apply

1. Create a Supabase project.
2. Install the Supabase CLI and run `supabase link --project-ref <ref>`.
3. Apply the migration with `supabase db push` (or paste the migration into
   the SQL editor).

The migration creates normalized tables for places, localized names and
aliases, categories and tags, sources and claim provenance, licensed images,
routes, route stops and route image credits, trip relationships, saves, first-party reviews and reports,
plus import run/external-record bookkeeping. Public catalog rows are read-only
through RLS. User trips, saves and reviews are scoped to `auth.uid()`.

## Import/update workflow

The reproducible importer is `scripts/ingest-jerusalem.mjs`:

```bash
npm run data:ingest                 # dry run; writes data/ingestion-report.json
npm run data:ingest -- --write     # merge into data/catalog.json
npm run data:ingest -- --no-images # skip Wikimedia Commons lookups
npm run data:ingest -- --write --supabase # merge, then upsert normalized rows
npm run data:verify                # provenance, coordinate and relationship checks
```

It reads tagged records from OpenStreetMap Overpass and optionally finds an
exact-name Wikimedia Commons image candidate. Existing hand-reviewed places
and routes are retained. Imported records carry an OpenStreetMap source URL;
the importer does not infer historical claims, prices, ratings, reviews or
opening hours. All image records retain creator, license and source metadata.

Environment variables:

- `JEROAM_OVERPASS_URL` (default `https://overpass-api.de/api/interpreter`)
- `JEROAM_WIKIMEDIA_API_URL` (default `https://commons.wikimedia.org/w/api.php`)
- `JEROAM_INGEST_BBOX` (default `31.73,35.16,31.83,35.27`)
- `JEROAM_INGEST_MAX` (default `300`)
- `JEROAM_INGEST_IMAGES=0` to disable image lookups
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are required only for the
  `--supabase` publication step and must stay in the server/CI environment.

Run the importer from the repository root. Review `data/ingestion-report.json`
and a representative sample before promoting a release to Supabase.

## Curated route library

`npm run data:routes` rebuilds the 13-route curated layer from existing
source-backed place IDs, preserving the seven original routes (20 total). It
calculates straight-line map estimates from verified coordinates and marks
them as estimates; it does not claim measured walking distances or add
historical facts.

