-- ============================================================================
-- Velta — Migration 001 : schéma initial
-- ----------------------------------------------------------------------------
-- Phase 3 (Base de données). Cf. SPECS.md section 5 « Modèle de données ».
--
-- Règles métier critiques (SPECS.md §8) respectées ici :
--   - Toutes les sommes d'argent en `numeric`, jamais `float` (précision décimale).
--   - Dates en `date` (ISO), premier jour du mois pour les agrégats mensuels.
--   - Aucune valeur calculée stockée, à une exception structurelle près :
--     `categories.parent_type` est une colonne GÉNÉRÉE (déduite de `type`), donc
--     toujours synchronisée automatiquement — pas de risque de désynchronisation.
--
-- À exécuter dans Supabase via le SQL Editor (ou `supabase db push`).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Nettoyage préalable — rend la migration rejouable.
-- Schéma initial sur base vide : aucun risque de perte de données. (Notamment
-- nécessaire après un run partiel ayant déjà créé certains types/fonctions.)
-- ----------------------------------------------------------------------------
drop table if exists flore_payments   cascade;
drop table if exists transactions     cascade;
drop table if exists monthly_settings cascade;
drop table if exists monthly_budgets  cascade;
drop table if exists categories       cascade;

drop function if exists set_updated_at() cascade;

drop type if exists category_type cascade;
drop type if exists parent_type   cascade;  -- ancien enum d'un 1er essai éventuel
drop type if exists share_mode    cascade;
drop type if exists budget_status cascade;

-- ----------------------------------------------------------------------------
-- 0. Types énumérés
-- ----------------------------------------------------------------------------

-- Sous-niveau imposé sous chaque parent_type (libellés libres = champ `name`).
create type category_type as enum (
  'besoins_fixes',
  'besoins_variables',
  'envies_velo',
  'envies_autres',
  'epargne'
);

-- Mode de répartition d'une charge avec Flore.
create type share_mode as enum (
  'perso_100',     -- 100 % à ma charge (défaut)
  'split_50_50',   -- moitié / moitié
  'split_prorata'  -- au prorata des revenus
);

-- Statut d'un mois budgétaire.
create type budget_status as enum (
  'in_progress',
  'closed'
);

-- ----------------------------------------------------------------------------
-- Fonction utilitaire : tient `updated_at` à jour à chaque UPDATE.
-- ----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- 1. Table `categories`
-- ----------------------------------------------------------------------------
create table categories (
  id                      uuid primary key default gen_random_uuid(),
  name                    text not null,                       -- libellé libre, ex: "Vélo", "PEA"
  type                    category_type not null,              -- sous-niveau imposé
  -- parent_type est CALCULÉ depuis `type` (besoins -> besoin, envies -> envie, ...).
  -- Colonne générée STORED de type `text` : reste automatiquement cohérente,
  -- jamais saisie à la main. (text, et non enum, pour éviter un cast sur le CASE.)
  parent_type             text generated always as (
    case
      when type in ('besoins_fixes', 'besoins_variables') then 'besoin'
      when type in ('envies_velo', 'envies_autres')       then 'envie'
      else 'epargne'
    end
  ) stored,
  color                   text not null,                       -- code hex de la charte (#XXXXXX)
  share_mode              share_mode not null default 'perso_100',
  is_credit               boolean not null default false,      -- si true, les champs crédit ci-dessous sont pertinents
  credit_remaining_months integer,                             -- mensualités restantes (nullable)
  credit_end_date         date,                                -- date de fin de crédit (nullable)
  credit_total_remaining  numeric,                             -- capital restant dû (nullable)
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create trigger categories_set_updated_at
  before update on categories
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- 2. Table `monthly_budgets`
-- ----------------------------------------------------------------------------
-- Une ligne par catégorie par mois (montant prévisionnel).
create table monthly_budgets (
  id             uuid primary key default gen_random_uuid(),
  month          date not null,                                -- premier jour du mois
  category_id    uuid not null references categories(id) on delete cascade,
  planned_amount numeric not null default 0,
  status         budget_status not null default 'in_progress',
  note           text,                                         -- note libre du mois (attachée au mois)
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  -- Garantit l'unicité « une ligne par catégorie par mois ».
  unique (month, category_id)
);

create index monthly_budgets_month_idx on monthly_budgets (month);

create trigger monthly_budgets_set_updated_at
  before update on monthly_budgets
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- 3. Table `transactions`
-- ----------------------------------------------------------------------------
create table transactions (
  id          uuid primary key default gen_random_uuid(),
  date        date not null,
  amount      numeric not null,
  -- on delete restrict : on n'efface jamais silencieusement l'historique des
  -- dépenses si une catégorie est supprimée. La suppression sera bloquée côté UI.
  category_id uuid not null references categories(id) on delete restrict,
  description text,                                            -- libellé libre, ex: "coiffeur"
  month       date not null,                                  -- premier jour du mois (facilite les agrégats)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index transactions_month_idx on transactions (month);
create index transactions_category_id_idx on transactions (category_id);

create trigger transactions_set_updated_at
  before update on transactions
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- 4. Table `monthly_settings`
-- ----------------------------------------------------------------------------
-- Clé primaire = month (un réglage par mois). Pas d'`id` uuid ici (cf. SPECS §5).
create table monthly_settings (
  month               date primary key,                       -- premier jour du mois
  revenue_melvin      numeric not null default 0,             -- mes revenus du mois
  revenue_flore       numeric not null default 0,             -- revenus de Flore (si 0 -> tout 100% perso)
  apl                 numeric,                                -- APL touchée par moi (nullable)
  target_needs_pct    numeric not null default 50,            -- objectif besoins (%)
  target_wants_pct    numeric not null default 30,            -- objectif envies (%)
  target_savings_pct  numeric not null default 20,            -- objectif épargne (%)
  note                text
);

-- ----------------------------------------------------------------------------
-- 5. Table `flore_payments`
-- ----------------------------------------------------------------------------
-- Remboursements de Flore. Module ISOLÉ : n'apparaît jamais dans les revenus
-- ni dans les charges, ne touche jamais aux ratios (SPECS §8.2).
create table flore_payments (
  id     uuid primary key default gen_random_uuid(),
  date   date not null,
  amount numeric not null,
  month  date not null,                                       -- mois auquel le remboursement se rapporte
  note   text
);

create index flore_payments_month_idx on flore_payments (month);

-- ============================================================================
-- 6. Row Level Security
-- ----------------------------------------------------------------------------
-- Mono-utilisateur, mais RLS activée par bonne pratique. Politique unique
-- « auth users only » : tout utilisateur authentifié a accès complet
-- (SELECT / INSERT / UPDATE / DELETE), personne d'autre.
-- ============================================================================

alter table categories       enable row level security;
alter table monthly_budgets  enable row level security;
alter table transactions     enable row level security;
alter table monthly_settings enable row level security;
alter table flore_payments   enable row level security;

create policy "auth users only" on categories
  for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

create policy "auth users only" on monthly_budgets
  for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

create policy "auth users only" on transactions
  for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

create policy "auth users only" on monthly_settings
  for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

create policy "auth users only" on flore_payments
  for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);
