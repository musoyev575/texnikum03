-- 1-SON TEXNIKUMI — XAVFSIZ ADMIN AUTH / RLS
-- Supabase SQL Editor'da ushbu faylni bir marta ishga tushiring.
--
-- Muhim:
-- 1) Avval Supabase Authentication > Users orqali admin akkauntlarini yarating.
-- 2) Pastdagi INSERT qismiga o'sha user UUID'larini qo'ying.
-- 3) Frontend endi admin/moderator parollarini saqlamaydi.

create table if not exists public.admin_roles (
    user_id uuid primary key references auth.users(id) on delete cascade,
    role text not null check (role in ('super_admin', 'moderator')),
    created_at timestamptz not null default now()
);

alter table public.admin_roles enable row level security;

drop policy if exists "admin_roles_self_read" on public.admin_roles;
create policy "admin_roles_self_read"
on public.admin_roles
for select
to authenticated
using (user_id = auth.uid());

create or replace function public.has_admin_role(required_role text default null)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
    select exists (
        select 1
        from public.admin_roles ar
        where ar.user_id = auth.uid()
          and (
              required_role is null
              or ar.role = required_role
          )
    );
$$;

revoke all on function public.has_admin_role(text) from public;
grant execute on function public.has_admin_role(text) to authenticated;

-- =========================================================
-- ADMIN AKKAUNTLARINI ROLGA BOG'LASH
-- =========================================================
-- Quyidagi foydalanuvchilar Supabase Authentication > Users
-- bo'limida avval yaratilgan bo'lishi kerak.
-- Bu usul UUID'ni qo'lda qidirishni talab qilmaydi.
insert into public.admin_roles (user_id, role)
select id, 'super_admin'
from auth.users
where lower(email) = lower('musoev@gmail.com')
on conflict (user_id) do update
set role = excluded.role;

insert into public.admin_roles (user_id, role)
select id, 'moderator'
from auth.users
where lower(email) = lower('texnikum@gamil.com')
on conflict (user_id) do update
set role = excluded.role;

-- =========================================================
-- NEWS
-- =========================================================

alter table public.news enable row level security;

drop policy if exists "news_public_read" on public.news;
create policy "news_public_read"
on public.news
for select
to anon, authenticated
using (true);

drop policy if exists "news_super_admin_insert" on public.news;
create policy "news_super_admin_insert"
on public.news
for insert
to authenticated
with check (public.has_admin_role('super_admin'));

drop policy if exists "news_super_admin_update" on public.news;
create policy "news_super_admin_update"
on public.news
for update
to authenticated
using (public.has_admin_role('super_admin'))
with check (public.has_admin_role('super_admin'));

drop policy if exists "news_super_admin_delete" on public.news;
create policy "news_super_admin_delete"
on public.news
for delete
to authenticated
using (public.has_admin_role('super_admin'));

-- =========================================================
-- COURSES
-- =========================================================

alter table public.courses enable row level security;

drop policy if exists "courses_public_read" on public.courses;
create policy "courses_public_read"
on public.courses
for select
to anon, authenticated
using (true);

drop policy if exists "courses_admin_insert" on public.courses;
create policy "courses_admin_insert"
on public.courses
for insert
to authenticated
with check (public.has_admin_role(null));

drop policy if exists "courses_admin_update" on public.courses;
create policy "courses_admin_update"
on public.courses
for update
to authenticated
using (public.has_admin_role(null))
with check (public.has_admin_role(null));

drop policy if exists "courses_admin_delete" on public.courses;
create policy "courses_admin_delete"
on public.courses
for delete
to authenticated
using (public.has_admin_role(null));

-- =========================================================
-- STORAGE: site-images
-- =========================================================
-- Bucket nomi loyiha kodida "site-images".
-- Agar bucket mavjud bo'lmasa, Storage bo'limida uni yarating.

drop policy if exists "site_images_public_read" on storage.objects;
create policy "site_images_public_read"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'site-images');

drop policy if exists "site_images_admin_insert" on storage.objects;
create policy "site_images_admin_insert"
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'site-images'
    and public.has_admin_role(null)
);

drop policy if exists "site_images_admin_update" on storage.objects;
create policy "site_images_admin_update"
on storage.objects
for update
to authenticated
using (
    bucket_id = 'site-images'
    and public.has_admin_role(null)
)
with check (
    bucket_id = 'site-images'
    and public.has_admin_role(null)
);

drop policy if exists "site_images_admin_delete" on storage.objects;
create policy "site_images_admin_delete"
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'site-images'
    and public.has_admin_role(null)
);

-- =========================================================
-- TEKSHIRUV
-- =========================================================
-- Quyidagi so'rovni admin sifatida login qilgandan keyin
-- SQL Editor emas, ilovadagi sessiya orqali tekshirish mumkin.
--
-- select public.has_admin_role(null);
-- select public.has_admin_role('super_admin');
