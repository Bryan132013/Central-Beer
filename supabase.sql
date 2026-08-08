-- CENTRAL BEER: banco de dados e segurança
-- Cole tudo no SQL Editor do Supabase e execute.

create extension if not exists pgcrypto;

create table if not exists public.promocoes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  preco numeric(10,2),
  descricao text,
  created_at timestamptz not null default now()
);

create table if not exists public.eventos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  data_hora text,
  descricao text,
  created_at timestamptz not null default now()
);

create table if not exists public.dividas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  valor numeric(10,2) not null,
  pago boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.promocoes enable row level security;
alter table public.eventos enable row level security;
alter table public.dividas enable row level security;

-- Público pode VER promoções e eventos.
drop policy if exists "public read promocoes" on public.promocoes;
create policy "public read promocoes"
on public.promocoes for select
to anon, authenticated
using (true);

drop policy if exists "public read eventos" on public.eventos;
create policy "public read eventos"
on public.eventos for select
to anon, authenticated
using (true);

-- SOMENTE o e-mail do dono pode alterar promoções, eventos e dívidas.
-- O Supabase Auth precisa ter esse e-mail cadastrado.
drop policy if exists "admin insert promocoes" on public.promocoes;
create policy "admin insert promocoes"
on public.promocoes for insert to authenticated
with check ((auth.jwt() ->> 'email') = 'bryanyttcontato@gmail.com');

drop policy if exists "admin update promocoes" on public.promocoes;
create policy "admin update promocoes"
on public.promocoes for update to authenticated
using ((auth.jwt() ->> 'email') = 'bryanyttcontato@gmail.com')
with check ((auth.jwt() ->> 'email') = 'bryanyttcontato@gmail.com');

drop policy if exists "admin delete promocoes" on public.promocoes;
create policy "admin delete promocoes"
on public.promocoes for delete to authenticated
using ((auth.jwt() ->> 'email') = 'bryanyttcontato@gmail.com');

drop policy if exists "admin insert eventos" on public.eventos;
create policy "admin insert eventos"
on public.eventos for insert to authenticated
with check ((auth.jwt() ->> 'email') = 'bryanyttcontato@gmail.com');

drop policy if exists "admin update eventos" on public.eventos;
create policy "admin update eventos"
on public.eventos for update to authenticated
using ((auth.jwt() ->> 'email') = 'bryanyttcontato@gmail.com')
with check ((auth.jwt() ->> 'email') = 'bryanyttcontato@gmail.com');

drop policy if exists "admin delete eventos" on public.eventos;
create policy "admin delete eventos"
on public.eventos for delete to authenticated
using ((auth.jwt() ->> 'email') = 'bryanyttcontato@gmail.com');

-- Dívidas: NINGUÉM público pode ler. Somente o dono pode ver/criar/alterar/apagar.
drop policy if exists "admin read dividas" on public.dividas;
create policy "admin read dividas"
on public.dividas for select to authenticated
using ((auth.jwt() ->> 'email') = 'bryanyttcontato@gmail.com');

drop policy if exists "admin insert dividas" on public.dividas;
create policy "admin insert dividas"
on public.dividas for insert to authenticated
with check ((auth.jwt() ->> 'email') = 'bryanyttcontato@gmail.com');

drop policy if exists "admin update dividas" on public.dividas;
create policy "admin update dividas"
on public.dividas for update to authenticated
using ((auth.jwt() ->> 'email') = 'bryanyttcontato@gmail.com')
with check ((auth.jwt() ->> 'email') = 'bryanyttcontato@gmail.com');

drop policy if exists "admin delete dividas" on public.dividas;
create policy "admin delete dividas"
on public.dividas for delete to authenticated
using ((auth.jwt() ->> 'email') = 'bryanyttcontato@gmail.com');
