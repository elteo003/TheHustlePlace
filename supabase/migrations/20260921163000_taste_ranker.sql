-- Giudizi espliciti, snapshot gusto e pesi del ranker v1.
-- Una riga per domanda (si aggiorna), uno snapshot per profilo, un JSON di pesi.

create table if not exists public.title_feedback (
    id bigint generated always as identity primary key,
    profile_id uuid not null references public.watch_profiles (id) on delete cascade,
    tmdb_id integer not null,
    content_type text not null check (content_type in ('movie', 'tv')),
    season integer not null default 0,
    moment text not null check (moment in ('mid_season', 'end_season', 'end_movie')),
    liking text not null check (liking in ('yes', 'a_lot', 'thrilled', 'skipped')),
    would_continue text check (would_continue in ('yes', 'no')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint title_feedback_profile_title_moment_uid
        unique (profile_id, content_type, tmdb_id, season, moment)
);

create index if not exists title_feedback_profile_idx
    on public.title_feedback (profile_id);

alter table public.title_feedback enable row level security;
grant select, insert, update, delete on table public.title_feedback to service_role;

create table if not exists public.taste_snapshot (
    profile_id uuid primary key references public.watch_profiles (id) on delete cascade,
    payload jsonb not null,
    updated_at timestamptz not null default now()
);

alter table public.taste_snapshot enable row level security;
grant select, insert, update, delete on table public.taste_snapshot to service_role;

create table if not exists public.ranker_weights (
    version text primary key,
    weights jsonb not null,
    updated_at timestamptz not null default now()
);

alter table public.ranker_weights enable row level security;
grant select, insert, update, delete on table public.ranker_weights to service_role;

insert into public.ranker_weights (version, weights)
values (
    'v1',
    '{"version":"v1","simTaste":0.26,"newness":0.1,"popularity":0.08,"explicit":0.28,"neighbor":0.12,"abandon":0.08,"continueNo":0.05,"alreadySeen":0.03}'::jsonb
)
on conflict (version) do nothing;
