/**
 * Types TypeScript du schéma de base de données Velta.
 *
 * Reflètent fidèlement les migrations `supabase/migrations/*.sql` (SPECS.md §6).
 * Modèle « Dépenses » depuis la migration 003 : Type > Catégorie (enum fixe) >
 * Dépense (table `expenses`). La table `categories` a disparu.
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

/**
 * Catégorie : niveau 2 de la hiérarchie (enum `category_enum`). 5 valeurs fixes.
 * Le `ParentType` (niveau 1) s'en déduit côté applicatif (cf. categoryMeta).
 */
export type CategoryType =
  | 'besoins_fixes'
  | 'besoins_variables'
  | 'envies_velo'
  | 'envies_autres'
  | 'epargne'

/** Type : niveau 1 de la hiérarchie. Déduit de la catégorie, jamais stocké. */
export type ParentType = 'besoin' | 'envie' | 'epargne'

export type ShareMode = 'perso_100' | 'split_50_50' | 'split_prorata'

export type BudgetStatus = 'in_progress' | 'closed'

// --- expenses ---------------------------------------------------------------
// Définition durable d'une dépense (Loyer, Courses, PEA…). Existe indépendamment
// des mois ; le montant prévisionnel mensuel vit dans `monthly_budgets`.

export interface Expense {
  id: string
  label: string
  description: string | null
  category: CategoryType
  color: string
  share_mode: ShareMode
  /** Total de la charge partagée (renseigné uniquement si share_mode = 'split_prorata'). */
  prorata_total_amount: number | null
  is_credit: boolean
  credit_remaining_months: number | null
  credit_end_date: string | null // date ISO (YYYY-MM-DD)
  credit_total_remaining: number | null
  /** Suppression = archivage : préserve l'historique des transactions liées. */
  archived: boolean
  created_at: string // timestamptz ISO
  updated_at: string
}

export interface ExpenseInsert {
  id?: string
  label: string
  description?: string | null
  category: CategoryType
  color: string
  share_mode?: ShareMode
  prorata_total_amount?: number | null
  is_credit?: boolean
  credit_remaining_months?: number | null
  credit_end_date?: string | null
  credit_total_remaining?: number | null
  archived?: boolean
  created_at?: string
  updated_at?: string
}

export type ExpenseUpdate = Partial<ExpenseInsert>

// --- monthly_budgets --------------------------------------------------------

export interface MonthlyBudget {
  id: string
  month: string // date ISO, premier jour du mois
  /** Dépense prévue ce mois-ci. Contrainte unique (month, expense_id). */
  expense_id: string
  planned_amount: number
  status: BudgetStatus
  note: string | null
  created_at: string
  updated_at: string
}

export interface MonthlyBudgetInsert {
  id?: string
  month: string
  expense_id: string
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
  /** Rattachement optionnel à une dépense (expenses). null si saisie libre. */
  expense_id: string | null
  /** Catégorie toujours remplie : snapshot figé à la création (SPECS §6, §9.6). */
  category: CategoryType
  description: string | null
  month: string // date ISO, premier jour du mois
  created_at: string
  updated_at: string
}

export interface TransactionInsert {
  id?: string
  date: string
  amount: number
  expense_id?: string | null
  category: CategoryType
  description?: string | null
  month: string
  created_at?: string
  updated_at?: string
}

export type TransactionUpdate = Partial<TransactionInsert>

// --- monthly_settings -------------------------------------------------------

export interface MonthlySettings {
  month: string // date ISO (clé primaire), premier jour du mois
  /**
   * Statut du mois (migration 005, SPECS §7.2). Propriété du MOIS portée par
   * `monthly_settings` (la colonne `monthly_budgets.status` est devenue vestigiale).
   */
  status: BudgetStatus
  /** Revenu prévisionnel du mois (saisi dans Budget), base des % du récap. */
  revenue_planned: number
  /** Revenu réel — salaire net perçu (saisi dans Historique > Revenus). */
  revenue_salaire: number
  /** Revenu réel — autres entrées : primes, ventes Vinted, etc. */
  revenue_autres: number
  revenue_flore: number
  apl: number | null
  target_needs_pct: number
  target_wants_pct: number
  target_savings_pct: number
  note: string | null
}

export interface MonthlySettingsInsert {
  month: string
  status?: BudgetStatus
  revenue_planned?: number
  revenue_salaire?: number
  revenue_autres?: number
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
  expenses: {
    Row: Expense
    Insert: ExpenseInsert
    Update: ExpenseUpdate
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
