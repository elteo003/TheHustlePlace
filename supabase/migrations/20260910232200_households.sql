-- Case e profili familiari per l'app TV. I device esistenti vengono agganciati in backfill.

create table if not exists public.households (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz not null default now()
);

alter table public.watch_profiles
    add column if not exists household_id uuid references public.households (id),
    add column if not exists name text not null default 'Profilo 1',
    add column if not exists avatar smallint not null default 0;

alter table public.watch_devices
    add column if not exists household_id uuid references public.households (id),
    add column if not exists active_profile_id uuid references public.watch_profiles (id),
    add column if not exists kind text not null default 'web';

do $$
declare
    r record;
    hid uuid;
begin
    for r in
        select p.id as profile_id, d.device_id
        from public.watch_profiles p
        left join public.watch_devices d on d.profile_id = p.id
        where p.household_id is null
    loop
        hid := gen_random_uuid();
        insert into public.households (id) values (hid);
        update public.watch_profiles
        set household_id = hid
        where id = r.profile_id;
        if r.device_id is not null then
            update public.watch_devices
            set household_id = hid,
                active_profile_id = r.profile_id
            where device_id = r.device_id;
        end if;
    end loop;
end;
$$;

create index if not exists watch_profiles_household_id_idx
    on public.watch_profiles (household_id);

alter table public.households enable row level security;

grant select, insert, update, delete on table public.households to service_role;
grant select, insert, update, delete on table public.watch_profiles to service_role;
grant select, insert, update, delete on table public.watch_devices to service_role;
