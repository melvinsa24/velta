-- ============================================================================
-- Velta — Migration 002 : dépenses nommées dans le budget prévisionnel
-- ----------------------------------------------------------------------------
-- Décision produit (pré-Phase 7) :
--   - `monthly_budgets` ne stocke plus une ligne par catégorie, mais une ligne
--     par DÉPENSE NOMMÉE (ex: « Courses 300 € » rattachée à la catégorie
--     Besoins variables). Plusieurs lignes peuvent partager la même category_id.
--   - Une transaction réelle peut optionnellement être reliée à une dépense
--     prévue via `monthly_budget_id` ; sinon elle reste rattachée à sa catégorie.
--
-- À exécuter dans Supabase via le SQL Editor (ou `supabase db push`).
-- `if (not) exists` partout → migration rejouable.
-- ============================================================================

-- Ajout du label sur monthly_budgets (nom libre de la dépense prévue).
alter table monthly_budgets add column if not exists label text;

-- Retrait de la contrainte « une ligne par catégorie par mois » : le nouveau
-- modèle autorise plusieurs dépenses nommées sous la même catégorie le même
-- mois. Les lignes sont désormais identifiées et éditées par leur `id`.
alter table monthly_budgets drop constraint if exists monthly_budgets_month_category_id_key;

-- Ajout de la relation optionnelle sur transactions. on delete set null :
-- supprimer une dépense prévue ne supprime pas la transaction réelle, elle perd
-- simplement son rattachement à la prévision.
alter table transactions add column if not exists monthly_budget_id uuid
  references monthly_budgets(id) on delete set null;

create index if not exists transactions_monthly_budget_id_idx
  on transactions (monthly_budget_id);
