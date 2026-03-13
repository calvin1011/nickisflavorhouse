import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useAdminMenu } from '@/hooks/useAdminMenu'
import { formatCurrency } from '@/utils/formatCurrency'
import { MenuItemForm } from '@/components/admin/MenuItemForm'

export function AdminMenu() {
  const {
    categories,
    items,
    loading,
    error,
    updateAvailable,
    updateFeatured,
    deleteItem,
    getCategoryName,
    refetch,
  } = useAdminMenu()
  const [editingItem, setEditingItem] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [togglingId, setTogglingId] = useState(null)
  const [togglingFeaturedId, setTogglingFeaturedId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const handleToggleAvailable = async (id, current) => {
    setTogglingId(id)
    try {
      await updateAvailable(id, !current)
    } catch (err) {
      console.error(err)
    } finally {
      setTogglingId(null)
    }
  }

  const handleToggleFeatured = async (id, current) => {
    setTogglingFeaturedId(id)
    try {
      await updateFeatured(id, !current)
    } catch (err) {
      console.error(err)
    } finally {
      setTogglingFeaturedId(null)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this menu item? This cannot be undone.')) return
    setDeletingId(id)
    try {
      await deleteItem(id)
    } catch (err) {
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setFormOpen(true)
  }

  const handleAdd = () => {
    setEditingItem(null)
    setFormOpen(true)
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setEditingItem(null)
  }

  const handleFormSuccess = () => {
    refetch()
    handleFormClose()
  }

  return (
    <div className="p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-brand-foreground">
            Menu manager
          </h1>
          <p className="mt-1 text-sm text-brand-foreground/70">
            Add, edit, or remove menu items. Toggle availability for the public menu.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary-dark transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add menu item
        </button>
      </div>

      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          <p>Failed to load menu: {error.message}</p>
        </div>
      )}

      {!error && loading && (
        <p className="mt-8 text-brand-foreground/70">Loading menu…</p>
      )}

      {!error && !loading && items.length === 0 && (
        <p className="mt-8 text-brand-foreground/70">
          No menu items yet. Click “Add menu item” to create one.
        </p>
      )}

      {!error && !loading && items.length > 0 && (
        <div className="mt-8 overflow-x-auto rounded-lg border border-brand-muted/30 bg-white">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b border-brand-muted/30 bg-brand-muted/10">
                <th className="px-4 py-3 font-medium text-brand-foreground">Category</th>
                <th className="px-4 py-3 font-medium text-brand-foreground">Name</th>
                <th className="px-4 py-3 font-medium text-brand-foreground">Price</th>
                <th className="px-4 py-3 font-medium text-brand-foreground">Available</th>
                <th className="px-4 py-3 font-medium text-brand-foreground">Featured</th>
                <th className="px-4 py-3 font-medium text-brand-foreground text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-brand-muted/20 last:border-0 hover:bg-brand-muted/5"
                >
                  <td className="px-4 py-3 text-brand-foreground/80">
                    {getCategoryName(item.category_id)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-brand-foreground">{item.name}</span>
                    {item.is_catering && (
                      <span className="ml-2 rounded bg-brand-primary/20 px-1.5 py-0.5 text-xs text-brand-primary">
                        Catering
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-brand-foreground/80">
                    {formatCurrency(item.price)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleToggleAvailable(item.id, item.available !== false)}
                      disabled={togglingId === item.id}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        item.available !== false
                          ? 'bg-green-100 text-green-800'
                          : 'bg-brand-muted/30 text-brand-foreground/70'
                      }`}
                    >
                      {togglingId === item.id ? '…' : item.available !== false ? 'Yes' : 'No'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleToggleFeatured(item.id, item.featured === true)}
                      disabled={togglingFeaturedId === item.id}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        item.featured === true
                          ? 'bg-brand-primary/20 text-brand-primary'
                          : 'bg-brand-muted/30 text-brand-foreground/70'
                      }`}
                    >
                      {togglingFeaturedId === item.id ? '…' : item.featured === true ? 'Yes' : 'No'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(item)}
                        className="rounded p-2 text-brand-foreground/70 hover:bg-brand-muted/20 hover:text-brand-foreground transition-colors"
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="rounded p-2 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <MenuItemForm
        open={formOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        item={editingItem}
        categories={categories}
      />
    </div>
  )
}
