-- Migration 004 — Découpage des revenus dans monthly_settings (Phase 8a)
--
-- Contexte (SPECS §6, §7.3, §7.5) : on distingue désormais
--   - le revenu PRÉVISIONNEL du mois (`revenue_planned`, ex-`revenue_melvin`),
--     saisi depuis l'écran Budget et servant de base aux % besoins/envies/épargne ;
--   - le revenu RÉEL, éclaté en `revenue_salaire` + `revenue_autres` (+ part d'APL
--     calculée à la volée), saisi depuis Historique > Revenus.
--
-- ⚠️ À exécuter manuellement dans Supabase SQL Editor avant de tester l'app.

ALTER TABLE monthly_settings
  RENAME COLUMN revenue_melvin TO revenue_planned;

ALTER TABLE monthly_settings
  ADD COLUMN revenue_salaire numeric NOT NULL DEFAULT 0,
  ADD COLUMN revenue_autres numeric NOT NULL DEFAULT 0;
