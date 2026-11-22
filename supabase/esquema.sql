-- =====================================================================
-- aniima · esquema de Supabase
-- Pégalo completo en Supabase > SQL Editor y dale "Run". Se puede volver a correr sin romper nada.
--
-- Quién puede ver qué:
--   · Terapeuta (lado clínico): solo las cuentas que agregues a la tabla `terapeutas` (paso 7, abajo).
--     Ve y guarda sus expedientes, Mi lista y pagos, y lee las entrevistas de sus consultantes.
--   · Consultante: crea su propia cuenta con su correo (o Google) y el código de invitación
--     que le das. Solo ve y edita su propia entrevista.
-- =====================================================================

-- 1. Terapeutas autorizados. La app no puede leer ni cambiar esta tabla: se llena desde el SQL Editor.
--    Se guarda el ID de la cuenta (no solo el correo) para que nadie pueda hacerse pasar por ti
--    registrándose con tu correo.
create table if not exists public.terapeutas (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text
);
alter table public.terapeutas enable row level security;

-- 2. Ajustes privados (por ahora, el código de invitación para consultantes).
create table if not exists public.ajustes_privados (
  clave text primary key,
  valor text not null
);
alter table public.ajustes_privados enable row level security;

-- ¿La cuenta que hace la consulta es de un terapeuta autorizado?
create or replace function public.es_terapeuta()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.terapeutas where user_id = auth.uid()
  );
$$;

-- ¿El código de invitación es el correcto? (sin revelar cuál es)
create or replace function public.codigo_valido(c text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.ajustes_privados
    where clave = 'codigo_invitacion' and valor = c and length(valor) >= 4
  );
$$;

drop policy if exists "terapeuta lee ajustes" on public.ajustes_privados;
drop policy if exists "terapeuta crea ajustes" on public.ajustes_privados;
drop policy if exists "terapeuta cambia ajustes" on public.ajustes_privados;
create policy "terapeuta lee ajustes" on public.ajustes_privados for select using (public.es_terapeuta());
create policy "terapeuta crea ajustes" on public.ajustes_privados for insert with check (public.es_terapeuta());
create policy "terapeuta cambia ajustes" on public.ajustes_privados for update using (public.es_terapeuta()) with check (public.es_terapeuta());

-- 3. Datos del terapeuta: expedientes, Mi lista, pagos, notas… guardados como pares clave/valor.
create table if not exists public.datos_terapeuta (
  dueno uuid not null default auth.uid() references auth.users (id) on delete cascade,
  clave text not null,
  valor jsonb not null,
  actualizado timestamptz not null default now(),
  primary key (dueno, clave)
);
alter table public.datos_terapeuta enable row level security;

drop policy if exists "terapeuta lee sus datos" on public.datos_terapeuta;
drop policy if exists "terapeuta guarda sus datos" on public.datos_terapeuta;
drop policy if exists "terapeuta actualiza sus datos" on public.datos_terapeuta;
drop policy if exists "terapeuta borra sus datos" on public.datos_terapeuta;
create policy "terapeuta lee sus datos" on public.datos_terapeuta for select
  using (dueno = auth.uid() and public.es_terapeuta());
create policy "terapeuta guarda sus datos" on public.datos_terapeuta for insert
  with check (dueno = auth.uid() and public.es_terapeuta());
create policy "terapeuta actualiza sus datos" on public.datos_terapeuta for update
  using (dueno = auth.uid() and public.es_terapeuta())
  with check (dueno = auth.uid() and public.es_terapeuta());
create policy "terapeuta borra sus datos" on public.datos_terapeuta for delete
  using (dueno = auth.uid() and public.es_terapeuta());

-- 4. Consultantes: cada quien crea su registro con un alias y el código de invitación.
create table if not exists public.consultantes (
  id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  usuario text not null unique,
  alias text not null check (char_length(alias) between 2 and 40),
  codigo text not null,
  creado timestamptz not null default now()
);
alter table public.consultantes enable row level security;

drop policy if exists "consultante crea su registro" on public.consultantes;
drop policy if exists "consultante y terapeuta leen" on public.consultantes;
drop policy if exists "consultante cambia su alias" on public.consultantes;
create policy "consultante crea su registro" on public.consultantes for insert
  with check (id = auth.uid() and public.codigo_valido(codigo));
create policy "consultante y terapeuta leen" on public.consultantes for select
  using (id = auth.uid() or public.es_terapeuta());
create policy "consultante cambia su alias" on public.consultantes for update
  using (id = auth.uid()) with check (id = auth.uid());

-- 5. Entrevista inicial: la llena el consultante desde su cuenta; el terapeuta la lee.
create table if not exists public.entrevistas (
  consultante uuid primary key default auth.uid() references public.consultantes (id) on delete cascade,
  respuestas jsonb not null default '{}'::jsonb,
  completada boolean not null default false,
  actualizada timestamptz not null default now()
);
alter table public.entrevistas enable row level security;

drop policy if exists "consultante crea su entrevista" on public.entrevistas;
drop policy if exists "consultante edita su entrevista" on public.entrevistas;
drop policy if exists "consultante y terapeuta leen entrevista" on public.entrevistas;
create policy "consultante crea su entrevista" on public.entrevistas for insert
  with check (consultante = auth.uid());
create policy "consultante edita su entrevista" on public.entrevistas for update
  using (consultante = auth.uid()) with check (consultante = auth.uid());
create policy "consultante y terapeuta leen entrevista" on public.entrevistas for select
  using (consultante = auth.uid() or public.es_terapeuta());

-- 6. Consentimiento informado: lo firma el consultante antes de su entrevista; el terapeuta lo lee.
--    Para retirarlo, el consultante puede borrarlo (y se avisa en sesión).
create table if not exists public.consentimientos (
  consultante uuid primary key default auth.uid() references public.consultantes (id) on delete cascade,
  version text not null,
  nombre_firma text not null check (char_length(nombre_firma) between 3 and 120),
  puntos jsonb not null default '[]'::jsonb,
  aceptado_en timestamptz not null default now()
);
alter table public.consentimientos enable row level security;

drop policy if exists "consultante firma su consentimiento" on public.consentimientos;
drop policy if exists "consultante y terapeuta leen consentimiento" on public.consentimientos;
drop policy if exists "consultante retira su consentimiento" on public.consentimientos;
create policy "consultante firma su consentimiento" on public.consentimientos for insert
  with check (consultante = auth.uid());
create policy "consultante y terapeuta leen consentimiento" on public.consentimientos for select
  using (consultante = auth.uid() or public.es_terapeuta());
create policy "consultante retira su consentimiento" on public.consentimientos for delete
  using (consultante = auth.uid());

-- 6b. Consentimiento por audio: el consultante puede confirmar con su voz en lugar de solo escribir su nombre.
--     El audio se guarda en un espacio privado de Storage; solo lo escuchan el consultante y su terapeuta.
alter table public.consentimientos add column if not exists metodo text not null default 'escrito' check (metodo in ('escrito', 'audio'));
alter table public.consentimientos add column if not exists audio text;

insert into storage.buckets (id, name, public) values ('consentimientos', 'consentimientos', false) on conflict (id) do nothing;
drop policy if exists "consultante sube su audio de consentimiento" on storage.objects;
drop policy if exists "consultante y terapeuta escuchan el consentimiento" on storage.objects;
create policy "consultante sube su audio de consentimiento" on storage.objects for insert to authenticated
  with check (bucket_id = 'consentimientos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "consultante y terapeuta escuchan el consentimiento" on storage.objects for select to authenticated
  using (bucket_id = 'consentimientos' and ((storage.foldername(name))[1] = auth.uid()::text or public.es_terapeuta()));

-- Permisos: solo cuentas con sesión iniciada; nada para visitantes anónimos.
revoke all on public.terapeutas, public.ajustes_privados, public.datos_terapeuta, public.consultantes, public.entrevistas, public.consentimientos from anon;
revoke all on public.terapeutas from authenticated;
grant select, insert, update on public.ajustes_privados to authenticated;
grant select, insert, update, delete on public.datos_terapeuta to authenticated;
grant select, insert, update on public.consultantes, public.entrevistas to authenticated;
grant select, insert, delete on public.consentimientos to authenticated;
grant execute on function public.es_terapeuta(), public.codigo_valido(text) to authenticated;
revoke execute on function public.es_terapeuta(), public.codigo_valido(text) from anon, public;

-- =====================================================================
-- 7. TU ACCESO AL LADO CLÍNICO. Primero crea tu usuario en Supabase: Authentication → Users → Add user.
--    Después cambia el correo de abajo por el tuyo, quita los dos guiones del inicio y corre solo esa línea.
-- insert into public.terapeutas (user_id, email) select id, email from auth.users where lower(email) = lower('tu-correo@ejemplo.com') on conflict do nothing;
-- =====================================================================
