create table if not exists vixsrc_home_relay (
    id integer primary key,
    url text not null,
    token text not null,
    updated_at timestamptz not null default now()
);
