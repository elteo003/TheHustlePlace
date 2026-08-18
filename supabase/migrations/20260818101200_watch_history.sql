-- Continua a guardare: storico per dispositivo (niente auth ancora).
-- RLS attiva senza policy per anon/authenticated: accesso solo via service role (API Next.js).

create table public.watch_history (
    id bigint generated always as identity primary key,
    device_id uuid not null,
    tmdb_id integer not null,
    content_type text not null check (content_type in ('movie', 'tv')),
    title text not null,
    poster_path text,
    backdrop_path text,
    season integer,
    episode integer,
    progress smallint not null default 0 check (progress >= 0 and progress <= 100),
    position_seconds integer not null default 0 check (position_seconds >= 0),
    watched_at timestamptz not null default now(),
    constraint watch_history_device_title_uid unique (device_id, content_type, tmdb_id)
);

create index watch_history_device_watched_at_idx
    on public.watch_history (device_id, watched_at desc);

alter table public.watch_history enable row level security;

grant select, insert, update, delete on table public.watch_history to service_role;
