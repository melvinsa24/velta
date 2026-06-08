'use client'

import { useState, useTransition } from 'react'
import { Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import { Button, Card, Modal } from '@/components/ui'
import { cn } from '@/lib/cn'
import {
  PARENT_ORDER,
  PARENT_LABELS,
  CATEGORY_TYPE_LABELS,
  SHARE_MODE_LABELS,
} from '@/lib/categoryMeta'
import { deleteCategory } from '@/lib/actions/categories'
import { CategoryForm } from '@/components/category/CategoryForm'
import type { Category } from '@/types/database'

type Props = {
  categories: Category[]
  /** Nombre de transactions par category_id (pour avertir avant suppression). */
  txCounts: Record<string, number>
}

export function CategoriesSection({ categories, txCounts }: Props) {
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState<Category | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(category: Category) {
    setEditing(category)
    setFormOpen(true)
  }

  function askDelete(category: Category) {
    setDeleteError(null)
    setDeleting(category)
  }

  function confirmDelete() {
    if (!deleting) return
    startTransition(async () => {
      const result = await deleteCategory(deleting.id)
      if (result.error) {
        setDeleteError('Suppression impossible.')
        return
      }
      setDeleting(null)
    })
  }

  const groups = PARENT_ORDER.map((parent) => ({
    parent,
    items: categories.filter((c) => c.parent_type === parent),
  })).filter((g) => g.items.length > 0)

  const deletingCount = deleting ? (txCounts[deleting.id] ?? 0) : 0

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold tracking-tight text-ink">
          Catégories
        </h2>
        <Button onClick={openCreate} className="px-3">
          <Plus size={18} aria-hidden="true" />
          Ajouter
        </Button>
      </div>

      {groups.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-2">
            Aucune catégorie pour l&apos;instant. Crée ta première catégorie
            avec le bouton « Ajouter ».
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <div key={group.parent}>
              <p className="mb-2 text-[11px] font-semibold tracking-[0.14em] text-ink-3 uppercase">
                {PARENT_LABELS[group.parent]}
              </p>
              <Card className="flex flex-col p-0">
                {group.items.map((category, index) => (
                  <CategoryRow
                    key={category.id}
                    category={category}
                    isLast={index === group.items.length - 1}
                    onEdit={() => openEdit(category)}
                    onDelete={() => askDelete(category)}
                  />
                ))}
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Modale création / édition */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
      >
        {/* key force le remontage du formulaire à chaque ouverture/cible */}
        <CategoryForm
          key={editing?.id ?? 'new'}
          initial={editing}
          onDone={() => setFormOpen(false)}
        />
      </Modal>

      {/* Modale de confirmation de suppression */}
      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Supprimer la catégorie"
      >
        {deleting && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-ink-2">
              Supprimer «&nbsp;
              <span className="font-medium text-ink">{deleting.name}</span>
              &nbsp;» ? Cette action est définitive.
            </p>

            {deletingCount > 0 && (
              <div className="flex gap-2.5 rounded-card border border-down/30 bg-down/5 p-3">
                <AlertTriangle
                  size={18}
                  className="mt-0.5 shrink-0 text-down"
                  aria-hidden="true"
                />
                <p className="text-sm text-ink-2">
                  Cette catégorie est rattachée à{' '}
                  <span className="font-medium text-ink">
                    {deletingCount} transaction{deletingCount > 1 ? 's' : ''}
                  </span>
                  . La suppression est impossible tant qu&apos;elles existent
                  (l&apos;historique est préservé).
                </p>
              </div>
            )}

            {deleteError && (
              <p className="text-sm text-down" role="alert">
                {deleteError}
              </p>
            )}

            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setDeleting(null)}>
                Annuler
              </Button>
              <Button
                onClick={confirmDelete}
                disabled={pending || deletingCount > 0}
                className="flex-1 bg-down text-white hover:shadow-card-hover active:bg-down disabled:opacity-50"
              >
                {pending ? 'Suppression…' : 'Supprimer'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  )
}

function CategoryRow({
  category,
  isLast,
  onEdit,
  onDelete,
}: {
  category: Category
  isLast: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-[18px] py-3',
        !isLast && 'border-b border-border',
      )}
    >
      {/* Pastille couleur de la catégorie (carré, rayon 10px) */}
      <span
        className="h-9 w-9 shrink-0 rounded-card"
        style={{ backgroundColor: category.color }}
        aria-hidden="true"
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{category.name}</p>
        <p className="truncate text-xs text-ink-3">
          {CATEGORY_TYPE_LABELS[category.type]} ·{' '}
          {SHARE_MODE_LABELS[category.share_mode]}
          {category.is_credit && ' · Crédit'}
        </p>
      </div>

      <button
        type="button"
        onClick={onEdit}
        aria-label={`Modifier ${category.name}`}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-card text-ink-2 hover:bg-surface-2"
      >
        <Pencil size={18} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Supprimer ${category.name}`}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-card text-ink-2 hover:bg-surface-2 hover:text-down"
      >
        <Trash2 size={18} aria-hidden="true" />
      </button>
    </div>
  )
}
