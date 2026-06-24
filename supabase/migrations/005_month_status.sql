-- ============================================================================
-- Velta — Migration 005 : statut de mois + workflow « Nouveau mois » (Phase 9)
-- ----------------------------------------------------------------------------
-- Contexte (SPECS §7.2, ROADMAP Phase 9). Jusqu'ici l'app était figée sur le
-- mois calendaire. Cette phase introduit la mécanique de bascule de mois :
-- clôture, reprise, réouverture.
--
-- Décision d'architecture : le STATUT d'un mois (in_progress / closed) devient
-- une propriété de `monthly_settings` (une ligne = un mois), et non plus de
-- `monthly_budgets` (une ligne par dépense). La colonne `monthly_budgets.status`
-- existante devient vestigiale (laissée en place, ignorée par l'app).
--
-- ⚠️ À exécuter manuellement dans Supabase SQL Editor avant de tester l'app.
-- `if not exists` + `create or replace` → migration rejouable.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Statut du mois sur monthly_settings (type budget_status créé en 001).
-- ----------------------------------------------------------------------------
alter table monthly_settings
  add column if not exists status budget_status not null default 'in_progress';

-- ----------------------------------------------------------------------------
-- 2. Fonction roll_to_next_month — « Nouveau mois » ATOMIQUE.
-- ----------------------------------------------------------------------------
-- Tout se joue dans une seule transaction (la fonction) : aucun état partiel
-- possible si une étape échoue. Avance d'un seul mois (M → M+1) : on ne saute
-- jamais un mois, sinon on raterait un décrément de crédit.
--
-- Étapes (SPECS §7.2) :
--   1. Clôture du mois M.
--   2. Création du mois M+1, revenu prévisionnel + objectifs % reconduits de M
--      (autres revenus à 0, apl/note à null), statut in_progress.
--   3. Pour chaque dépense NON archivée : ligne monthly_budgets de M+1 —
--      besoins fixes/variables → montant de M (0 si absent) ; envies/épargne → 0.
--   4. Pour chaque crédit : credit_remaining_months -1, credit_total_remaining
--      diminué de la mensualité du mois ; archivage quand il ne reste plus rien.
-- ----------------------------------------------------------------------------
create or replace function roll_to_next_month(p_month date)
returns date
language plpgsql
as $$
declare
  v_next         date := (p_month + interval '1 month')::date;
  v_planned      numeric;
  v_needs        numeric;
  v_wants        numeric;
  v_savings      numeric;
  r_exp          record;
  v_amount       numeric;
begin
  -- Idempotence : si le mois suivant est déjà ouvert, ne rien faire.
  if exists (
    select 1 from monthly_settings where month = v_next and status = 'in_progress'
  ) then
    return v_next;
  end if;

  -- 1. Clôture du mois courant.
  update monthly_settings set status = 'closed' where month = p_month;

  -- 2. Reconduction depuis le mois clôturé (valeurs par défaut si pas de ligne).
  select revenue_planned, target_needs_pct, target_wants_pct, target_savings_pct
    into v_planned, v_needs, v_wants, v_savings
    from monthly_settings
   where month = p_month;

  insert into monthly_settings (
    month, revenue_planned, revenue_salaire, revenue_autres, revenue_flore,
    apl, target_needs_pct, target_wants_pct, target_savings_pct, note, status
  ) values (
    v_next, coalesce(v_planned, 0), 0, 0, 0,
    null,
    coalesce(v_needs, 50), coalesce(v_wants, 30), coalesce(v_savings, 20),
    null, 'in_progress'
  )
  on conflict (month) do update set status = 'in_progress';

  -- 3 + 4. Budgets du nouveau mois + décréments crédit.
  for r_exp in select * from expenses where archived = false loop
    if r_exp.category in ('besoins_fixes', 'besoins_variables') then
      select coalesce(planned_amount, 0) into v_amount
        from monthly_budgets
       where month = p_month and expense_id = r_exp.id;
      v_amount := coalesce(v_amount, 0);
    else
      v_amount := 0;
    end if;

    insert into monthly_budgets (month, expense_id, planned_amount)
    values (v_next, r_exp.id, v_amount)
    on conflict (month, expense_id) do nothing;

    if r_exp.is_credit then
      update expenses
         set credit_remaining_months = greatest(coalesce(credit_remaining_months, 0) - 1, 0),
             credit_total_remaining   = greatest(coalesce(credit_total_remaining, 0) - v_amount, 0),
             archived = case
               when coalesce(credit_remaining_months, 0) - 1 <= 0 then true
               else archived
             end
       where id = r_exp.id;
    end if;
  end loop;

  return v_next;
end;
$$;

grant execute on function roll_to_next_month(date) to authenticated;
