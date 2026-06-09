/**
 * Types TypeScript du schéma de base de données Velta.
 *
 * Reflètent fidèlement `supabase/migrations/001_initial_schema.sql` (SPECS.md §5).
 * Convention :
 *   - `Row`    = forme d'une ligne telle que lue depuis la base.
 *   - `Insert` = champs acceptés à l'insertion (les colonnes à défaut / générées
 *                / auto sont optionnelles).
 *   - `Update` = tous les champs modifiables, optionnels.
 *
 * Rappel métier : toutes les sommes d'argent sont des `numeric` côté base. Le
 * driver supabase-js les renvoie en `number` JS. Précision décimale critique :
 * à manipuler avec soin à la présentation (jamais de float arithmétique douteuse).
 */

// --- Énumérations (miroir des types Postgres) -------------------------------

export type CategoryType =
  | 'besoins_fixes'
  | 'besoins_variables'
  | 'envies_velo'
  | 'envies_autres'
  | 'epargne'

export type ParentType = 'besoin' | 'envie' | 'epargne'

export type ShareMode = 'perso_100' | 'split_50_50' | 'split_prorata'

export type BudgetStatus = 'in_progress' | 'closed'

// --- categories -------------------------------------------------------------

export interface Category {
  id: string
  name: string
  type: CategoryType
  /** Calculé en base à partir de `type` (colonne générée) — jamais saisi. */
  parent_type: ParentType
  color: string
  share_mode: ShareMode
  is_credit: boolean
  credit_remaining_months: number | null
  credit_end_date: string | null // date ISO (YYYY-MM-DD)
  credit_total_remaining: number | null
  created_at: string // timestamptz ISO
  updated_at: string
}

export interface CategoryInsert {
  id?: string
  name: string
  type: CategoryType
  // parent_type : généré en base, jamais fourni à l'insertion.
  color: string
  share_mode?: ShareMode
  is_credit?: boolean
  credit_remaining_months?: number | null
  credit_end_date?: string | null
  credit_total_remaining?: number | null
  created_at?: string
  updated_at?: string
}

export type CategoryUpdate = Partial<Omit<CategoryInsert, never>>

// --- monthly_budgets --------------------------------------------------------

export interface MonthlyBudget {
  id: string
  month: string // date ISO, premier jour du mois
  category_id: string
  /** Nom libre de la dépense prévue (ex: "Courses", "Loyer"). Une ligne = une dépense. */
  label: string | null
  planned_amount: number
  status: BudgetStatus
  note: string | null
  created_at: string
  updated_at: string
}

export interface MonthlyBudgetInsert {
  id?: string
  month: string
  category_id: string
  label?: string | null
  planned_amount?: number
  status?: BudgetStatus
  note?: string | null
  created_at?: string
  updated_at?: string
}

export type MonthlyBudgetUpdate = Partial<MonthlyBudgetInsert>

// --- transactions -----------------------------------------------------------

export interface Transaction {
  id: string
  date: string // date ISO
  amount: number
  category_id: string
  /** Rattachement optionnel à une dépense prévue (monthly_budgets). null si saisie libre. */
  monthly_budget_id: string | null
  description: string | null
  month: string // date ISO, premier jour du mois
  created_at: string
  updated_at: string
}

export interface TransactionInsert {
  id?: string
  date: string
  amount: number
  category_id: string
  monthly_budget_id?: string | null
  description?: string | null
  month: string
  created_at?: string
  updated_at?: string
}

export type TransactionUpdate = Partial<TransactionInsert>

// --- monthly_settings -------------------------------------------------------

export interface MonthlySettings {
  month: string // date ISO (clé primaire), premier jour du mois
  revenue_melvin: number
  revenue_flore: number
  apl: number | null
  target_needs_pct: number
  target_wants_pct: number
  target_savings_pct: number
  note: string | null
}

export interface MonthlySettingsInsert {
  month: string
  revenue_melvin?: number
  revenue_flore?: number
  apl?: number | null
  target_needs_pct?: number
  target_wants_pct?: number
  target_savings_pct?: number
  note?: string | null
}

export type MonthlySettingsUpdate = Partial<MonthlySettingsInsert>

// --- flore_payments ---------------------------------------------------------

export interface FlorePayment {
  id: string
  date: string // date ISO
  amount: number
  month: string // date ISO, mois concerné
  note: string | null
}

export interface FlorePaymentInsert {
  id?: string
  date: string
  amount: number
  month: string
  note?: string | null
}

export type FlorePaymentUpdate = Partial<FlorePaymentInsert>

// --- Carte des tables (pratique pour typer le client Supabase) --------------

export interface Database {
  categories: {
    Row: Category
    Insert: CategoryInsert
    Update: CategoryUpdate
  }
  monthly_budgets: {
    Row: MonthlyBudget
    Insert: MonthlyBudgetInsert
    Update: MonthlyBudgetUpdate
  }
  transactions: {
    Row: Transaction
    Insert: TransactionInsert
    Update: TransactionUpdate
  }
  monthly_settings: {
    Row: MonthlySettings
    Insert: MonthlySettingsInsert
    Update: MonthlySettingsUpdate
  }
  flore_payments: {
    Row: FlorePayment
    Insert: FlorePaymentInsert
    Update: FlorePaymentUpdate
  }
}
