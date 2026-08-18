-- Profilo anonimo condiviso tra dispositivi accoppiati tramite codice.

create table public.watch_profiles (
    id uuid primary key default gen_random_uuid(),
    pair_code text not null unique,
    created_at timestamptz not null default now(),
    constraint watch_profiles_pair_code_format
        check (pair_code ~ '^[A-HJ-NP-Z2-9]{8}$')
);

create table public.watch_devices (
    device_id uuid primary key,
    profile_id uuid not null references public.watch_profiles (id) on delete cascade,
    paired_at timestamptz not null default now()
);

create index watch_devices_profile_id_idx on public.watch_devices (profile_id);

create or replace function public.generate_pair_code()
returns text
language plpgsql
as $$
declare
    alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    result text;
    i int;
begin
    loop
        result := '';
        for i in 1..8 loop
            result := result || substr(alphabet, 1 + (floor(random() * 32)::int % 32), 1);
        end loop;
        exit when not exists (select 1 from public.watch_profiles where pair_code = result);
    end loop;
    return result;
end;
$$;

alter table public.watch_history
    add column profile_id uuid references public.watch_profiles (id);

do $$
declare
    r record;
    pid uuid;
begin
    for r in select distinct device_id from public.watch_history
    loop
        pid := gen_random_uuid();
        insert into public.watch_profiles (id, pair_code)
        values (pid, public.generate_pair_code());
        insert into public.watch_devices (device_id, profile_id)
        values (r.device_id, pid)
        on conflict (device_id) do nothing;
        update public.watch_history
        set profile_id = pid
        where device_id = r.device_id;
    end loop;
end;
$$;

delete from public.watch_history where profile_id is null;

alter table public.watch_history
    alter column profile_id set not null;

alter table public.watch_history
    drop constraint watch_history_device_title_uid;

alter table public.watch_history
    add constraint watch_history_profile_title_uid unique (profile_id, content_type, tmdb_id);

create index watch_history_profile_watched_at_idx
    on public.watch_history (profile_id, watched_at desc);

alter table public.watch_profiles enable row level security;
alter table public.watch_devices enable row level security;

grant select, insert, update, delete on table public.watch_profiles to service_role;
grant select, insert, update, delete on table public.watch_devices to service_role;
grant select, insert, update, delete on table public.watch_history to service_role;
