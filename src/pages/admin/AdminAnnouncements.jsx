import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useAdminAnnouncements } from '@/hooks/useAdminAnnouncements'
import { AnnouncementForm } from '@/components/admin/AnnouncementForm'

export function AdminAnnouncements() {
  const {
    announcements,
    loading,
    error,
    updateActive,
    deleteAnnouncement,
    refetch,
  } = useAdminAnnouncements()
  const [editingAnnouncement, setEditingAnnouncement] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [togglingId, setTogglingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const handleToggleActive = async (id, current) => {
    setTogglingId(id)
    try {
      await updateActive(id, !current)
    } catch (err) {
      console.error(err)
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement? This cannot be undone.'))
      return
    setDeletingId(id)
    try {
      await deleteAnnouncement(id)
    } catch (err) {
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  const handleEdit = (announcement) => {
    setEditingAnnouncement(announcement)
    setFormOpen(true)
  }

  const handleAdd = () => {
    setEditingAnnouncement(null)
    setFormOpen(true)
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setEditingAnnouncement(null)
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
            Announcements
          </h1>
          <p className="mt-1 text-sm text-brand-foreground/70">
            Manage banners shown on the homepage. Toggle active to show or hide.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary-dark transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add announcement
        </button>
      </div>

      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          <p>Failed to load announcements: {error.message}</p>
        </div>
      )}

      {!error && loading && (
        <p className="mt-8 text-brand-foreground/70">Loading announcements…</p>
      )}

      {!error && !loading && announcements.length === 0 && (
        <p className="mt-8 text-brand-foreground/70">
          No announcements yet. Click “Add announcement” to create one.
        </p>
      )}

      {!error && !loading && announcements.length > 0 && (
        <div className="mt-8 overflow-x-auto rounded-lg border border-brand-muted/30 bg-white">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b border-brand-muted/30 bg-brand-muted/10">
                <th className="px-4 py-3 font-medium text-brand-foreground">
                  Title
                </th>
                <th className="px-4 py-3 font-medium text-brand-foreground">
                  Preview
                </th>
                <th className="px-4 py-3 font-medium text-brand-foreground">
                  Active
                </th>
                <th className="px-4 py-3 font-medium text-brand-foreground text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {announcements.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-brand-muted/20 last:border-0 hover:bg-brand-muted/5"
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-brand-foreground">
                      {a.title}
                    </span>
                  </td>
                  <td className="max-w-[200px] px-4 py-3 text-brand-foreground/80 truncate">
                    {a.body || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() =>
                        handleToggleActive(a.id, a.is_active !== false)
                      }
                      disabled={togglingId === a.id}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        a.is_active !== false
                          ? 'bg-green-100 text-green-800'
                          : 'bg-brand-muted/30 text-brand-foreground/70'
                      }`}
                    >
                      {togglingId === a.id
                        ? '…'
                        : a.is_active !== false
                          ? 'Yes'
                          : 'No'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(a)}
                        className="rounded p-2 text-brand-foreground/70 hover:bg-brand-muted/20 hover:text-brand-foreground transition-colors"
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(a.id)}
                        disabled={deletingId === a.id}
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

      <AnnouncementForm
        open={formOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        announcement={editingAnnouncement}
      />
    </div>
  )
}
