import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { sanitizeString } from '@/lib/sanitize'
import { cn } from '@/lib/utils'
import { getStoragePathFromPublicUrl } from '@/lib/storage'
import { ImageCropModal } from '@/components/admin/ImageCropModal'

const BUCKET = 'announcement-images'
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_SIZE_BYTES = 5 * 1024 * 1024

const announcementFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  body: z.string().max(5000).optional().default(''),
  is_active: z.boolean().optional().default(true),
})

const inputClass =
  'mt-1 block w-full rounded-md border border-brand-muted/40 bg-white px-3 py-2 text-brand-foreground shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary'
const labelClass = 'block text-sm font-medium text-brand-foreground'

function validateImageFile(file) {
  if (!file) return null
  if (!ALLOWED_TYPES.includes(file.type))
    return 'Image must be JPEG, PNG, or WebP'
  if (file.size > MAX_SIZE_BYTES) return 'Image must be under 5MB'
  return null
}

async function uploadImage(file) {
  if (!supabase) throw new Error('Supabase not configured')
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg'
  const path = `${crypto.randomUUID()}.${safeExt}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

async function removeStorageObject(bucket, publicUrl) {
  if (!supabase || !publicUrl) return
  const path = getStoragePathFromPublicUrl(publicUrl, bucket)
  if (!path) return
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error && error.message?.toLowerCase() !== 'object not found') {
    console.warn('Storage remove failed:', error)
  }
}

/**
 * @param {{
 *   open: boolean
 *   onClose: () => void
 *   onSuccess: () => void
 *   announcement: { id: string, title: string, body?: string | null, image_url?: string | null, is_active?: boolean } | null
 * }}
 */
export function AnnouncementForm({
  open,
  onClose,
  onSuccess,
  announcement,
}) {
  const isEdit = !!announcement
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(announcementFormSchema),
    defaultValues: {
      title: '',
      body: '',
      is_active: true,
    },
  })

  const [imageError, setImageError] = useState(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [fileToCrop, setFileToCrop] = useState(null)
  const [pendingImageUrl, setPendingImageUrl] = useState(null)
  const imageInputRef = useRef(null)

  useEffect(() => {
    if (!open) return
    setRemoveImage(false)
    setPendingImageUrl(null)
    setCropModalOpen(false)
    setFileToCrop(null)
    if (announcement) {
      reset({
        title: announcement.title ?? '',
        body: announcement.body ?? '',
        is_active: announcement.is_active !== false,
      })
    } else {
      reset({
        title: '',
        body: '',
        is_active: true,
      })
    }
  }, [open, announcement, reset])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  const onSubmit = async (data, e) => {
    const fileInput = e?.target?.querySelector('input[type="file"]')
    const file = fileInput?.files?.[0]
    const err = validateImageFile(file)
    setImageError(err || null)
    if (file && err) return
    let imageUrl = pendingImageUrl ?? announcement?.image_url ?? null
    if (removeImage) {
      imageUrl = null
      if (announcement?.image_url) {
        await removeStorageObject(BUCKET, announcement.image_url)
      }
    } else if (!pendingImageUrl && file) {
      try {
        imageUrl = await uploadImage(file)
      } catch (err) {
        console.error(err)
        return
      }
    }
    const payload = {
      title: sanitizeString(data.title),
      body: sanitizeString(data.body || ''),
      image_url: imageUrl,
      is_active: !!data.is_active,
    }
    if (!supabase) return
    try {
      if (isEdit) {
        const { error } = await supabase
          .from('announcements')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', announcement.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('announcements').insert([payload])
        if (error) throw error
      }
      onSuccess()
    } catch (err) {
      console.error(err)
    }
  }

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-brand-muted/30 bg-white p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="announcement-form-title"
      >
        <div className="flex items-center justify-between border-b border-brand-muted/30 pb-4">
          <h2
            id="announcement-form-title"
            className="font-display text-xl font-semibold text-brand-foreground"
          >
            {isEdit ? 'Edit announcement' : 'Add announcement'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-2 text-brand-foreground/70 hover:bg-brand-muted/20 hover:text-brand-foreground transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label htmlFor="announcement-title" className={labelClass}>
              Title
            </label>
            <input
              id="announcement-title"
              type="text"
              className={cn(inputClass, errors.title && 'border-red-500')}
              {...register('title')}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="announcement-body" className={labelClass}>
              Body
            </label>
            <textarea
              id="announcement-body"
              rows={4}
              className={cn(inputClass, errors.body && 'border-red-500')}
              {...register('body')}
            />
            {errors.body && (
              <p className="mt-1 text-sm text-red-600">{errors.body.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="announcement-image" className={labelClass}>
              Image
            </label>
            {announcement?.image_url && !removeImage && (
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <img
                  src={announcement.image_url}
                  alt=""
                  className="h-20 w-20 rounded border border-brand-muted/30 object-cover"
                />
                <div className="flex flex-col gap-1">
                  <a
                    href={announcement.image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-brand-primary underline"
                  >
                    View
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setRemoveImage(true)
                      setImageError(null)
                      if (imageInputRef.current) imageInputRef.current.value = ''
                    }}
                    className="text-left text-sm font-medium text-red-600 hover:text-red-700"
                  >
                    Remove image
                  </button>
                </div>
              </div>
            )}
            {pendingImageUrl && (
              <p className="mt-1 text-sm text-brand-foreground/70">New image ready (cropped). Save to use it.</p>
            )}
            {announcement?.image_url && removeImage && (
              <p className="mt-1 text-sm text-brand-foreground/70">Image will be removed when you save.</p>
            )}
            <input
              ref={imageInputRef}
              id="announcement-image"
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              className="mt-1 block w-full text-sm text-brand-foreground file:mr-4 file:rounded file:border-0 file:bg-brand-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-white file:hover:bg-brand-primary-dark"
              onChange={(e) => {
                const file = e.target.files?.[0]
                const err = validateImageFile(file)
                setImageError(err || null)
                if (file && !err) {
                  setRemoveImage(false)
                  setFileToCrop(file)
                  setCropModalOpen(true)
                  e.target.value = ''
                }
              }}
            />
            <ImageCropModal
              open={cropModalOpen}
              file={fileToCrop}
              onConfirm={async (blob) => {
                const name = fileToCrop?.name || 'image.jpg'
                const file = new File([blob], name, { type: blob.type })
                try {
                  const url = await uploadImage(file)
                  setPendingImageUrl(url)
                } catch (err) {
                  console.error(err)
                  setImageError('Upload failed')
                }
                setCropModalOpen(false)
                setFileToCrop(null)
              }}
              onCancel={() => {
                setCropModalOpen(false)
                setFileToCrop(null)
              }}
            />
            {imageError && (
              <p className="mt-1 text-sm text-red-600">{imageError}</p>
            )}
            <p className="mt-1 text-xs text-brand-foreground/60">
              WebP, JPG, or PNG, max 5MB. Optional.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="announcement-is_active"
              type="checkbox"
              className="h-4 w-4 rounded border-brand-muted/40 text-brand-primary focus:ring-brand-primary"
              {...register('is_active')}
            />
            <label
              htmlFor="announcement-is_active"
              className="text-sm font-medium text-brand-foreground"
            >
              Active (show on homepage)
            </label>
          </div>

          <div className="flex justify-end gap-3 border-t border-brand-muted/30 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-brand-muted/40 px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand-muted/20 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary-dark transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add announcement'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
