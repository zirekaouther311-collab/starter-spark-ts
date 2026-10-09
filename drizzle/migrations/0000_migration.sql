create type public.app_role as enum ('customer', 'seller', 'admin');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  wilaya text,
  commune text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create table public.seller_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  shop_name text not null,
  description text,
  specialties text[] not null default '{}',
  wilaya text,
  commune text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.seller_profiles to anon, authenticated;
grant insert, update, delete on public.seller_profiles to authenticated;
grant all on public.seller_profiles to service_role;
alter table public.seller_profiles enable row level security;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_ar text not null,
  name_fr text,
  sort_order int not null default 0
);
grant select on public.categories to anon, authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _role public.app_role;
begin
  begin
    _role := coalesce(new.raw_user_meta_data ->> 'role', 'customer')::public.app_role;
  exception when others then
    _role := 'customer';
  end;
  if _role = 'admin' then
    _role := 'customer';
  end if;
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  insert into public.user_roles (user_id, role) values (new.id, _role);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create policy "profiles_select_own" on public.profiles
  for select to authenticated using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy "user_roles_select_own" on public.user_roles
  for select to authenticated using (auth.uid() = user_id);

create policy "seller_profiles_public_read" on public.seller_profiles
  for select to anon, authenticated using (is_active = true);
create policy "seller_profiles_owner_insert" on public.seller_profiles
  for insert to authenticated
  with check (user_id = auth.uid() and public.has_role(auth.uid(), 'seller'));
create policy "seller_profiles_owner_update" on public.seller_profiles
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "seller_profiles_owner_delete" on public.seller_profiles
  for delete to authenticated using (user_id = auth.uid());

create policy "categories_public_read" on public.categories
  for select to anon, authenticated using (true);
create policy "categories_admin_write" on public.categories
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

insert into public.categories (slug, name_ar, name_fr, sort_order) values
  ('couscous', 'كسكس وأطباق السميد', 'Couscous', 1),
  ('soups', 'شوربة وحريرة', 'Soupes', 2),
  ('bourek', 'بوراك ومعجنات مقلية', 'Bourek', 3),
  ('tajine', 'طواجن وأطباق الطين', 'Tajines', 4),
  ('sweets', 'حلويات تقليدية', 'Pâtisseries', 5),
  ('bread', 'خبز ومخبوزات منزلية', 'Pains', 6),
  ('saharan', 'أكلات صحراوية', 'Plats sahariens', 7),
  ('preserves', 'مربى ومخللات', 'Confitures', 8);