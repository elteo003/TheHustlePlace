alter table public.watch_history
    add column if not exists continue_hidden boolean not null default false;
