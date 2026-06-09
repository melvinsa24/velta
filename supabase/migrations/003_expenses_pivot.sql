-- ============================================================================
-- Velta — Migration 003 : pivot modèle « Dépenses »
-- ----------------------------------------------------------------------------
-- Phase 5bis (cf. SPECS.md §4, §6, §7.3). Clarification produit du 2026-06-09 :
--
--   Hiérarchie à 3 niveaux désormais figée :
--     Type (Besoins/Envies/Épargne)  >  Catégorie (5 valeurs fixes)  >  Dépense
--   La DÉPENSE (Loyer, Courses, PEA…) devient une entité durable à part entière,
--   stockée dans la nouvelle table `expenses`. La table `categories` disparaît :
--   les catégories ne sont plus créées par l'utilisateur mais figées en enum.
--
--   Les propriétés color / share_mode / is_credit (+ champs crédit) migrent de
--   `categories` vers `expenses`. `monthly_budgets` et `transactions` pointent
--   désormais vers `expenses`, et `transactions` porte un snapshot `category`.
--
-- ⚠ Aucune donnée à préserver (environnement de dev) : les tables liées sont
--   vidées avant d'ajouter les colonnes NOT NULL.
--
-- À exécuter dans Supabase via le SQL Editor. `if (not) exists` + gardes →
-- migration rejouable.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Suppression de l'ancien modèle « catégories »
-- ----------------------------------------------------------------------------
-- DROP CASCADE retire la table ET les contraintes FK qui la référencent
-- (monthly_budgets.category_id, transactions.category_id), mais laisse les
-- colonnes elles-mêmes : on les retire explicitement plus bas.
drop table if exists categories cascade;

-- Anciens enums devenus inutiles (category_type) ou renommés (share_mode →
-- share_mode_enum). `budget_status` reste utilisé par monthly_budgets.status.
drop type if exists category_type cascade;
drop type if exists share_mode    cascade;

-- Aucune donnée à préserver : on vide les tables dépendantes avant d'ajouter
-- des colonnes NOT NULL (sinon Postgres refuse sur des lignes existantes).
truncate table transactions, monthly_budgets cascade;

-- Retrait des colonnes de l'ancien modèle (filet de sécurité — certaines ont
-- déjà disparu via le CASCADE ci-dessus selon l'historique des migrations).
alter table monthly_budgets drop column if exists category_id;
alter table monthly_budgets drop column if exists label;
alter table transactions    drop column if exists category_id;
alter table transactions    drop column if exists monthly_budget_id;

-- ----------------------------------------------------------------------------
-- 2. Nouveaux types énumérés
-- ----------------------------------------------------------------------------

-- Catégorie : 5 valeurs fixes (le `parent_type` Besoins/Envies/Épargne s'en
-- déduit côté applicatif, jamais stocké — cf. SPECS §4).
do $$ begin
  create type category_enum as enum (
    'besoins_fixes',
    'besoins_variables',
    'envies_velo',
    'envies_autres',
    'epargne'
  );
exception when duplicate_object then null;
end $$;

-- Mode de répartition d'une dépense avec Flore.
do $$ begin
  create type share_mode_enum as enum (
    'perso_100',     -- 100 % à ma charge (défaut)
    'split_50_50',   -- moitié / moitié
    'split_prorata'  -- au prorata des revenus
  );
exception when duplicate_object then null;
end $$;

-- ----------------------------------------------------------------------------
-- Fonction utilitaire updated_at (rejouable). Déjà créée en 001 ; on la
-- redéfinit par sécurité au cas où cette migration serait rejouée seule.
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
-- 3. Table `expenses` — définitions durables de dépenses (SPECS §6)
-- ----------------------------------------------------------------------------
create table expenses (
  id                      uuid primary key default gen_random_uuid(),
  label                   text not null,                   -- ex: "Loyer", "Courses", "PEA"
  description             text,                            -- description longue optionnelle
  category                category_enum not null,          -- 5 valeurs fixes ; parent_type déduit
  color                   text not null,                   -- code hex de la charte (#XXXXXX)
  share_mode              share_mode_enum not null default 'perso_100',
  is_credit               boolean not null default false,  -- si true, les champs crédit ci-dessous sont pertinents
  credit_remaining_months integer,                         -- mensualités restantes (nullable)
  credit_end_date         date,                            -- date de fin de crédit (nullable)
  credit_total_remaining  numeric,                         -- capital restant dû (nullable)
  archived                boolean not null default false,  -- suppression = archivage (préserve l'historique des transactions)
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index expenses_archived_idx on expenses (archived);

create trigger expenses_set_updated_at
  before update on expenses
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- 4. `monthly_budgets` — montant prévisionnel par dépense et par mois
-- ----------------------------------------------------------------------------
-- on delete cascade : archiver/supprimer une dépense retire ses prévisions.
alter table monthly_budgets
  add column expense_id uuid not null
  references expenses(id) on delete cascade;

-- Une seule ligne de prévision par dépense par mois (SPECS §6).
alter table monthly_budgets
  add constraint monthly_budgets_month_expense_id_key unique (month, expense_id);

create index monthly_budgets_expense_id_idx on monthly_budgets (expense_id);

-- ----------------------------------------------------------------------------
-- 5. `transactions` — rattachement optionnel + snapshot catégorie
-- ----------------------------------------------------------------------------
-- expense_id nullable + on delete set null : supprimer une dépense ne supprime
-- pas la transaction réelle, elle perd juste son rattachement à la prévision.
alter table transactions
  add column expense_id uuid
  references expenses(id) on delete set null;

-- `category` toujours rempli : copié depuis expenses.category à la création si
-- expense_id fourni, sinon choisi directement par l'utilisateur (saisie libre).
-- Snapshot historique stable : figé à la création (SPECS §6, §9.6).
alter table transactions
  add column category category_enum not null;

create index transactions_expense_id_idx on transactions (expense_id);
create index transactions_category_idx   on transactions (category);

-- ----------------------------------------------------------------------------
-- 6. Row Level Security sur `expenses` (même politique que les autres tables)
-- ----------------------------------------------------------------------------
alter table expenses enable row level security;

create policy "auth users only" on expenses
  for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);
