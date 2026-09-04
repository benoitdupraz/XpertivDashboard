-- ============================================================
-- Xpertiv — mise en place de l'authentification et de la
-- validation manuelle des comptes.
-- À exécuter UNE FOIS dans Supabase : Dashboard → SQL Editor → New query
-- ============================================================

-- 1. Table des profils (en plus de auth.users, qui est gérée par Supabase)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  nom text,
  role text not null default 'user',        -- 'user' ou 'admin'
  approved boolean not null default false,  -- validation manuelle requise
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- 2. Table de stockage des données de l'app (postes, salariés, véhicules)
-- Même logique clé/valeur que le stockage utilisé jusqu'ici, pour ne
-- rien changer au code de l'application elle-même.
create table if not exists public.kv_store (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.kv_store enable row level security;

-- 3. Fonctions utilitaires (contournent la récursion des policies RLS)
create or replace function public.is_approved()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and approved = true
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- 4. Création automatique du profil à l'inscription (non approuvé par défaut)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. Policies : chacun voit son propre profil ; les admins voient et
-- approuvent tout le monde.
create policy "Un utilisateur voit son propre profil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Un admin voit tous les profils"
  on public.profiles for select
  using (public.is_admin());

create policy "Un admin peut approuver / modifier un profil"
  on public.profiles for update
  using (public.is_admin());

-- 6. Policies : seuls les comptes approuvés peuvent lire/écrire les
-- données de l'application (salariés, postes, véhicules).
create policy "Lecture réservée aux comptes approuvés"
  on public.kv_store for select
  using (public.is_approved());

create policy "Écriture réservée aux comptes approuvés"
  on public.kv_store for insert
  with check (public.is_approved());

create policy "Modification réservée aux comptes approuvés"
  on public.kv_store for update
  using (public.is_approved());

create policy "Suppression réservée aux comptes approuvés"
  on public.kv_store for delete
  using (public.is_approved());

-- ============================================================
-- 7. ÉTAPE MANUELLE OBLIGATOIRE APRÈS TA PREMIÈRE INSCRIPTION :
-- Le tout premier compte doit être promu admin à la main, sinon
-- personne ne peut approuver personne (y compris soi-même).
--
-- 1. Crée ton compte normalement depuis l'app (bouton "Créer un compte").
-- 2. Reviens ici et exécute (en remplaçant l'email) :
--
--    update public.profiles
--    set role = 'admin', approved = true
--    where email = 'ton.email@xpertiv.fr';
--
-- Tous les comptes suivants pourront alors être approuvés depuis
-- l'app elle-même, dans l'onglet "Utilisateurs en attente".
-- ============================================================
