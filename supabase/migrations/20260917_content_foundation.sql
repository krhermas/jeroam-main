-- Jeroam content foundation
-- Apply with `supabase db push` (or run in the Supabase SQL editor).
-- Catalog records are relational and source-backed. JSON is reserved for
-- provider payloads/import diagnostics, never the public content model.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  preferred_locale text not null default 'en' check (preferred_locale in ('en','ar','he')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id text primary key,
  label text not null,
  kind text not null default 'place',
  parent_id text references public.categories(id),
  created_at timestamptz not null default now()
);

create table if not exists public.sources (
  id text primary key,
  title text not null,
  publisher text not null,
  url text not null check (url ~ '^https://'),
  kind text not null default 'institution' check (kind in ('institution','tourism','heritage','coordinate','image','open-data')),
  reliability_note text,
  accessed_at date not null,
  last_verified_at date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.places (
  id text primary key,
  canonical_name text not null,
  category_id text not null references public.categories(id),
  subcategory text,
  area text not null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  address text,
  description text not null,
  short_description text not null,
  practical_information text,
  suggested_visit_minutes integer check (suggested_visit_minutes is null or suggested_visit_minutes > 0),
  website text check (website is null or website ~ '^https://'),
  phone text,
  opening_hours text,
  opening_hours_source_id text references public.sources(id),
  price_amount numeric check (price_amount is null or price_amount >= 0),
  price_currency text check (price_currency is null or price_currency = 'ILS'),
  price_display text,
  price_source_id text references public.sources(id),
  accessibility_summary text,
  accessibility_source_id text references public.sources(id),
  location_source_id text not null references public.sources(id),
  last_verified_at date not null,
  osm_type text,
  osm_id bigint,
  wikidata_id text,
  status text not null default 'published' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (osm_type, osm_id)
);

create table if not exists public.place_localizations (
  place_id text not null references public.places(id) on delete cascade,
  locale text not null check (locale in ('en','ar','he')),
  name text not null,
  short_description text,
  description text,
  practical_information text,
  primary key (place_id, locale)
);

create table if not exists public.place_aliases (
  place_id text not null references public.places(id) on delete cascade,
  alias text not null,
  locale text check (locale is null or locale in ('en','ar','he')),
  primary key (place_id, alias)
);

create table if not exists public.place_tags (
  place_id text not null references public.places(id) on delete cascade,
  tag text not null,
  primary key (place_id, tag)
);

create table if not exists public.place_sources (
  place_id text not null references public.places(id) on delete cascade,
  source_id text not null references public.sources(id) on delete restrict,
  supports text not null,
  is_primary boolean not null default false,
  primary key (place_id, source_id)
);

create table if not exists public.factual_claims (
  id text primary key,
  place_id text not null references public.places(id) on delete cascade,
  claim text not null,
  claim_kind text not null default 'fact' check (claim_kind in ('fact','interpretation')),
  created_at timestamptz not null default now()
);

create table if not exists public.claim_sources (
  claim_id text not null references public.factual_claims(id) on delete cascade,
  source_id text not null references public.sources(id) on delete restrict,
  supports text,
  primary key (claim_id, source_id)
);

create table if not exists public.place_images (
  id text primary key,
  place_id text not null references public.places(id) on delete cascade,
  url text not null,
  alt_text text,
  creator text,
  license text,
  license_url text check (license_url is null or license_url ~ '^https://'),
  source_url text not null check (source_url ~ '^https://'),
  source_id text not null references public.sources(id),
  sort_order integer not null default 0,
  last_verified_at date not null,
  created_at timestamptz not null default now()
);

create table if not exists public.place_relations (
  place_id text not null references public.places(id) on delete cascade,
  related_place_id text not null references public.places(id) on delete cascade,
  relation text not null check (relation in ('nearby','related','same-route','alternative')),
  primary key (place_id, related_place_id, relation),
  check (place_id <> related_place_id)
);

create table if not exists public.place_transport_relevance (
  place_id text not null references public.places(id) on delete cascade,
  mode text not null check (mode in ('walk','bus','light-rail','taxi','bike','car')),
  note text,
  source_id text references public.sources(id),
  primary key (place_id, mode)
);

create table if not exists public.routes (
  id text primary key,
  title text not null,
  description text not null,
  theme text not null,
  difficulty text not null,
  difficulty_note text,
  duration_minutes integer not null check (duration_minutes > 0),
  distance_km numeric check (distance_km is null or distance_km >= 0),
  distance_kind text not null default 'unavailable' check (distance_kind in ('straight-line-estimate','measured-walk','unavailable')),
  family_suitability text not null default 'not-assessed' check (family_suitability in ('good-fit','possible','not-assessed')),
  areas text[] not null default '{}',
  source_backed_reason text,
  image_id text,
  start_place_id text references public.places(id),
  end_place_id text references public.places(id),
  last_verified_at date not null,
  status text not null default 'published' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep the migration safe to re-run against an earlier draft of the content
-- foundation where routes already existed without the route discovery fields.
alter table if exists public.routes
  add column if not exists distance_kind text not null default 'unavailable',
  add column if not exists family_suitability text not null default 'not-assessed',
  add column if not exists areas text[] not null default '{}',
  add column if not exists source_backed_reason text;

create table if not exists public.route_localizations (
  route_id text not null references public.routes(id) on delete cascade,
  locale text not null check (locale in ('en','ar','he')),
  title text not null,
  description text,
  primary key (route_id, locale)
);

create table if not exists public.route_images (
  route_id text not null references public.routes(id) on delete cascade,
  image_id text not null,
  url text not null,
  alt_text text,
  creator text not null,
  license text not null,
  license_url text not null,
  source_url text not null,
  source_id text references public.sources(id) on delete restrict,
  sort_order integer not null default 0 check (sort_order >= 0),
  last_verified_at date not null,
  primary key (route_id, image_id)
);

create table if not exists public.route_stops (
  route_id text not null references public.routes(id) on delete cascade,
  place_id text not null references public.places(id) on delete restrict,
  stop_order integer not null check (stop_order > 0),
  stop_duration_minutes integer check (stop_duration_minutes is null or stop_duration_minutes > 0),
  prompt text,
  primary key (route_id, stop_order),
  unique (route_id, place_id)
);

create table if not exists public.route_sources (
  route_id text not null references public.routes(id) on delete cascade,
  source_id text not null references public.sources(id) on delete restrict,
  supports text not null,
  primary key (route_id, source_id)
);

create table if not exists public.activities (
  id text primary key,
  kind text not null check (kind in ('place-visit','route','activity')),
  title text not null,
  description text not null,
  place_id text references public.places(id) on delete cascade,
  route_id text references public.routes(id) on delete cascade,
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  last_verified_at date,
  status text not null default 'published' check (status in ('draft','published','archived')),
  check ((place_id is not null) <> (route_id is not null))
);

create table if not exists public.activity_sources (
  activity_id text not null references public.activities(id) on delete cascade,
  source_id text not null references public.sources(id),
  primary key (activity_id, source_id)
);

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  start_date date,
  end_date date,
  traveler_count integer not null default 1 check (traveler_count > 0),
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trip_days (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  day_number integer not null check (day_number > 0),
  date date,
  unique (trip_id, day_number)
);

create table if not exists public.trip_items (
  id uuid primary key default gen_random_uuid(),
  trip_day_id uuid not null references public.trip_days(id) on delete cascade,
  place_id text references public.places(id),
  route_id text references public.routes(id),
  starts_at time,
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  sort_order integer not null default 0,
  notes text,
  check ((place_id is not null) <> (route_id is not null))
);

create table if not exists public.saved_places (
  user_id uuid not null references auth.users(id) on delete cascade,
  place_id text not null references public.places(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, place_id)
);

create table if not exists public.saved_routes (
  user_id uuid not null references auth.users(id) on delete cascade,
  route_id text not null references public.routes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, route_id)
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  place_id text not null references public.places(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  body text check (body is null or char_length(body) <= 2000),
  status text not null default 'pending' check (status in ('pending','published','hidden','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, place_id)
);

create table if not exists public.review_reports (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now(),
  unique (review_id, reporter_id)
);

create table if not exists public.import_runs (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running' check (status in ('running','completed','failed')),
  records_seen integer not null default 0,
  records_imported integer not null default 0,
  records_updated integer not null default 0,
  error text
);

create table if not exists public.external_records (
  provider text not null,
  external_id text not null,
  external_type text,
  place_id text references public.places(id) on delete set null,
  source_id text references public.sources(id) on delete set null,
  source_url text not null check (source_url ~ '^https://'),
  raw_payload jsonb,
  imported_at timestamptz not null default now(),
  primary key (provider, external_id)
);

insert into public.categories (id,label,kind) values
 ('history','History','place'),('heritage','Heritage','place'),('religious-sites','Religious sites','place'),
 ('culture','Culture','place'),('markets','Markets','place'),('food','Food','place'),('restaurants','Restaurants','place'),
 ('architecture','Architecture','place'),('art','Art','place'),('museums','Museums','place'),('local-experiences','Local experiences','place'),
 ('walking','Walking','place'),('photography','Photography','place'),('events','Events','place'),('shopping','Shopping','place'),
 ('viewpoints','Viewpoints','place'),('parks-public-spaces','Parks & public spaces','place'),('transport','Transport','place')
on conflict (id) do update set label=excluded.label;

create index if not exists places_category_idx on public.places(category_id);
create index if not exists places_area_idx on public.places(area);
create index if not exists places_coordinates_idx on public.places(latitude, longitude);
create index if not exists claims_place_idx on public.factual_claims(place_id);
create index if not exists route_stops_place_idx on public.route_stops(place_id);
create index if not exists route_images_route_idx on public.route_images(route_id);
create index if not exists routes_theme_idx on public.routes(theme);
create index if not exists routes_difficulty_idx on public.routes(difficulty);
create index if not exists routes_distance_idx on public.routes(distance_km);
create index if not exists activities_place_idx on public.activities(place_id);
create index if not exists activities_route_idx on public.activities(route_id);
create index if not exists reviews_place_published_idx on public.reviews(place_id) where status = 'published';

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists sources_updated_at on public.sources;
create trigger sources_updated_at before update on public.sources for each row execute function public.set_updated_at();
drop trigger if exists places_updated_at on public.places;
create trigger places_updated_at before update on public.places for each row execute function public.set_updated_at();
drop trigger if exists routes_updated_at on public.routes;
create trigger routes_updated_at before update on public.routes for each row execute function public.set_updated_at();
drop trigger if exists trips_updated_at on public.trips;
create trigger trips_updated_at before update on public.trips for each row execute function public.set_updated_at();
drop trigger if exists reviews_updated_at on public.reviews;
create trigger reviews_updated_at before update on public.reviews for each row execute function public.set_updated_at();

-- New auth users get a profile; private rows are always scoped to auth.uid().
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin insert into public.profiles (id) values (new.id) on conflict do nothing; return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.sources enable row level security;
alter table public.categories enable row level security;
alter table public.places enable row level security;
alter table public.place_localizations enable row level security;
alter table public.place_aliases enable row level security;
alter table public.place_tags enable row level security;
alter table public.place_sources enable row level security;
alter table public.factual_claims enable row level security;
alter table public.claim_sources enable row level security;
alter table public.place_images enable row level security;
alter table public.place_relations enable row level security;
alter table public.place_transport_relevance enable row level security;
alter table public.routes enable row level security;
alter table public.route_localizations enable row level security;
alter table public.route_images enable row level security;
alter table public.route_stops enable row level security;
alter table public.route_sources enable row level security;
alter table public.activities enable row level security;
alter table public.activity_sources enable row level security;
alter table public.trips enable row level security;
alter table public.trip_days enable row level security;
alter table public.trip_items enable row level security;
alter table public.saved_places enable row level security;
alter table public.saved_routes enable row level security;
alter table public.reviews enable row level security;
alter table public.review_reports enable row level security;
alter table public.import_runs enable row level security;
alter table public.external_records enable row level security;

drop policy if exists "public read catalog sources" on public.sources;
create policy "public read catalog sources" on public.sources for select using (true);
drop policy if exists "public read categories" on public.categories;
create policy "public read categories" on public.categories for select using (true);
drop policy if exists "public read published places" on public.places;
create policy "public read published places" on public.places for select using (status='published');
drop policy if exists "public read place localizations" on public.place_localizations;
create policy "public read place localizations" on public.place_localizations for select using (exists (select 1 from public.places p where p.id=place_id and p.status='published'));
drop policy if exists "public read place aliases" on public.place_aliases;
create policy "public read place aliases" on public.place_aliases for select using (true);
drop policy if exists "public read place tags" on public.place_tags;
create policy "public read place tags" on public.place_tags for select using (true);
drop policy if exists "public read place sources" on public.place_sources;
create policy "public read place sources" on public.place_sources for select using (true);
drop policy if exists "public read claims" on public.factual_claims;
create policy "public read claims" on public.factual_claims for select using (true);
drop policy if exists "public read claim sources" on public.claim_sources;
create policy "public read claim sources" on public.claim_sources for select using (true);
drop policy if exists "public read images" on public.place_images;
create policy "public read images" on public.place_images for select using (true);
drop policy if exists "public read relations" on public.place_relations;
create policy "public read relations" on public.place_relations for select using (true);
drop policy if exists "public read transport relevance" on public.place_transport_relevance;
create policy "public read transport relevance" on public.place_transport_relevance for select using (true);
drop policy if exists "public read published routes" on public.routes;
create policy "public read published routes" on public.routes for select using (status='published');
drop policy if exists "public read route localizations" on public.route_localizations;
create policy "public read route localizations" on public.route_localizations for select using (true);
drop policy if exists "public read route images" on public.route_images;
create policy "public read route images" on public.route_images for select using (true);
drop policy if exists "public read route stops" on public.route_stops;
create policy "public read route stops" on public.route_stops for select using (true);
drop policy if exists "public read route sources" on public.route_sources;
create policy "public read route sources" on public.route_sources for select using (true);
drop policy if exists "public read activities" on public.activities;
create policy "public read activities" on public.activities for select using (status='published');
drop policy if exists "public read activity sources" on public.activity_sources;
create policy "public read activity sources" on public.activity_sources for select using (true);
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles for all using (auth.uid()=id) with check (auth.uid()=id);
drop policy if exists "own trips" on public.trips;
create policy "own trips" on public.trips for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
drop policy if exists "own trip days" on public.trip_days;
create policy "own trip days" on public.trip_days for all using (exists (select 1 from public.trips t where t.id=trip_id and t.user_id=auth.uid())) with check (exists (select 1 from public.trips t where t.id=trip_id and t.user_id=auth.uid()));
drop policy if exists "own trip items" on public.trip_items;
create policy "own trip items" on public.trip_items for all using (exists (select 1 from public.trip_days d join public.trips t on t.id=d.trip_id where d.id=trip_day_id and t.user_id=auth.uid())) with check (exists (select 1 from public.trip_days d join public.trips t on t.id=d.trip_id where d.id=trip_day_id and t.user_id=auth.uid()));
drop policy if exists "own saved places" on public.saved_places;
create policy "own saved places" on public.saved_places for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
drop policy if exists "own saved routes" on public.saved_routes;
create policy "own saved routes" on public.saved_routes for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
drop policy if exists "read published reviews" on public.reviews;
create policy "read published reviews" on public.reviews for select using (status='published' or auth.uid()=user_id);
drop policy if exists "write own reviews" on public.reviews;
create policy "write own reviews" on public.reviews for insert with check (auth.uid()=user_id);
drop policy if exists "update own reviews" on public.reviews;
create policy "update own reviews" on public.reviews for update using (auth.uid()=user_id) with check (auth.uid()=user_id);
drop policy if exists "delete own reviews" on public.reviews;
create policy "delete own reviews" on public.reviews for delete using (auth.uid()=user_id);
drop policy if exists "report reviews" on public.review_reports;
create policy "report reviews" on public.review_reports for insert with check (auth.uid()=reporter_id);


