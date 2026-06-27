-- ============================================================================
-- Velta — Migration 006 : montant total des dépenses au prorata (Phase 10c)
-- ----------------------------------------------------------------------------
-- Contexte (brief Phase 10c). Les dépenses `split_prorata` sont désormais créées
-- et gérées depuis l'onglet Flore. On stocke le montant TOTAL de la charge
-- partagée (ex : 600€ pour le loyer) sur la dépense elle-même ; la part nette de
-- Melvin (= total × ratio) reste calculée à la volée et n'est snapshotée que dans
-- `monthly_budgets.planned_amount` (comme une besoins_fixes normale).
--
-- Colonne renseignée uniquement quand share_mode = 'split_prorata' (null sinon).
--
-- ⚠️ À exécuter manuellement dans Supabase SQL Editor avant de tester l'app.
-- `if not exists` → migration rejouable.
-- ============================================================================

alter table expenses
  add column if not exists prorata_total_amount numeric null;
