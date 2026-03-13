import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { sanitizeString } from '@/lib/sanitize'
import { cn } from '@/lib/utils'

const BUCKET = 'menu-images'
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_SIZE_BYTES = 5 * 1024 * 1024

const menuItemFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(500),
  description: z.string().max(2000).optional().default(''),
  category_id: z.string().uuid('Select a category'),
  price: z.coerce.number().min(0, 'Price must be 0 or more'),
  is_catering: z.boolean().optional().default(false),
  featured: z.boolean().optional().default(false),
  sort_order: z.coerce.number().int().min(0).optional().default(0),
  min_price: z.coerce.number().min(0).optional().nullable(),
  max_price: z.coerce.number().min(0).optional().nullable(),
})

const inputClass =
  'mt-1 block w-full rounded-md border border-brand-muted/40 bg-white px-3 py-2 text-brand-foreground shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary'
const labelClass = 'block text-sm font-medium text-brand-foreground'

function validateImageFile(file) {
  if (!file) return null
  if (!ALLOWED_TYPES.includes(file.type))
    return 'Image must be JPEG, PNG, or WebP'
  if (file.size > MAX_SIZE_BYTES)
    return 'Image must be under 5MB'
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

/**
 * @param {{
 *   open: boolean
 *   onClose: () => void
 *   onSuccess: () => void
 *   item: { id: string, name: string, description?: string, category_id: string, price: number, image_url?: string | null, is_catering?: boolean, sort_order?: number, catering_min_price?: number | null, catering_max_price?: number | null } | null
 *   categories: Array<{ id: string, name: string }>
 * }}
 */
export function MenuItemForm({ open, onClose, onSuccess, item, categories }) {
  const isEdit = !!item
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(menuItemFormSchema),
    defaultValues: {
      name: '',
      description: '',
      category_id: '',
      price: 0,
      is_catering: false,
      featured: false,
      sort_order: 0,
      min_price: null,
      max_price: null,
    },
  })

  const isCatering = watch('is_catering')
  const [imageError, setImageError] = useState(null)

  useEffect(() => {
    if (!open) return
    if (item) {
      reset({
        name: item.name ?? '',
        description: item.description ?? '',
        category_id: item.category_id ?? '',
        price: item.price ?? 0,
        is_catering: item.is_catering ?? false,
        featured: item.featured ?? false,
        sort_order: item.sort_order ?? 0,
        min_price: item.catering_min_price ?? null,
        max_price: item.catering_max_price ?? null,
      })
    } else {
      reset({
        name: '',
        description: '',
        category_id: categories[0]?.id ?? '',
        price: 0,
        is_catering: false,
        featured: false,
        sort_order: 0,
        min_price: null,
        max_price: null,
      })
    }
  }, [open, item, categories, reset])

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
    let imageUrl = item?.image_url ?? null
    if (file) {
      try {
        imageUrl = await uploadImage(file)
      } catch (err) {
        console.error(err)
        return
      }
    }
    const priceDollars = Number(data.price)
    const minPriceDollars = data.min_price != null && data.min_price !== '' ? Number(data.min_price) : null
    const maxPriceDollars = data.max_price != null && data.max_price !== '' ? Number(data.max_price) : null
    const payload = {
      name: sanitizeString(data.name),
      description: sanitizeString(data.description || ''),
      category_id: data.category_id,
      price: priceDollars,
      image_url: imageUrl,
      is_catering: !!data.is_catering,
      featured: !!data.featured,
      sort_order: Number(data.sort_order) || 0,
      catering_min_price: minPriceDollars,
      catering_max_price: maxPriceDollars,
    }
    if (!supabase) return
    try {
      if (isEdit) {
        const { error } = await supabase.from('menu_items').update(payload).eq('id', item.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('menu_items').insert([{ ...payload, available: true }])
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
        aria-labelledby="menu-item-form-title"
      >
        <div className="flex items-center justify-between border-b border-brand-muted/30 pb-4">
          <h2 id="menu-item-form-title" className="font-display text-xl font-semibold text-brand-foreground">
            {isEdit ? 'Edit menu item' : 'Add menu item'}
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
            <label htmlFor="name" className={labelClass}>Name</label>
            <input
              id="name"
              type="text"
              className={cn(inputClass, errors.name && 'border-red-500')}
              {...register('name')}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className={labelClass}>Description</label>
            <textarea
              id="description"
              rows={3}
              className={cn(inputClass, errors.description && 'border-red-500')}
              {...register('description')}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="category_id" className={labelClass}>Category</label>
            <select
              id="category_id"
              className={cn(inputClass, errors.category_id && 'border-red-500')}
              {...register('category_id')}
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.category_id && (
              <p className="mt-1 text-sm text-red-600">{errors.category_id.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className={labelClass}>Price ($)</label>
              <input
                id="price"
                type="number"
                step="0.01"
                min="0"
                className={cn(inputClass, errors.price && 'border-red-500')}
                {...register('price')}
              />
              {errors.price && (
                <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="sort_order" className={labelClass}>Sort order</label>
              <input
                id="sort_order"
                type="number"
                min="0"
                className={cn(inputClass, errors.sort_order && 'border-red-500')}
                {...register('sort_order')}
              />
              {errors.sort_order && (
                <p className="mt-1 text-sm text-red-600">{errors.sort_order.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="is_catering"
              type="checkbox"
              className="h-4 w-4 rounded border-brand-muted/40 text-brand-primary focus:ring-brand-primary"
              {...register('is_catering')}
            />
            <label htmlFor="is_catering" className="text-sm font-medium text-brand-foreground">
              Catering item
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="featured"
              type="checkbox"
              className="h-4 w-4 rounded border-brand-muted/40 text-brand-primary focus:ring-brand-primary"
              {...register('featured')}
            />
            <label htmlFor="featured" className="text-sm font-medium text-brand-foreground">
              Show on home (featured)
            </label>
          </div>

          {isCatering && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="min_price" className={labelClass}>Min price ($, optional)</label>
                <input
                  id="min_price"
                  type="number"
                  step="0.01"
                  min="0"
                  className={cn(inputClass, errors.min_price && 'border-red-500')}
                  {...register('min_price')}
                />
                {errors.min_price && (
                  <p className="mt-1 text-sm text-red-600">{errors.min_price.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="max_price" className={labelClass}>Max price ($, optional)</label>
                <input
                  id="max_price"
                  type="number"
                  step="0.01"
                  min="0"
                  className={cn(inputClass, errors.max_price && 'border-red-500')}
                  {...register('max_price')}
                />
                {errors.max_price && (
                  <p className="mt-1 text-sm text-red-600">{errors.max_price.message}</p>
                )}
              </div>
            </div>
          )}

          <div>
            <label className={labelClass}>Image</label>
            {item?.image_url && (
              <p className="mt-1 text-sm text-brand-foreground/70">
                Current: <a href={item.image_url} target="_blank" rel="noopener noreferrer" className="text-brand-primary underline">View</a>. Upload a new file to replace.
              </p>
            )}
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              className="mt-1 block w-full text-sm text-brand-foreground file:mr-4 file:rounded file:border-0 file:bg-brand-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-white file:hover:bg-brand-primary-dark"
              onChange={(e) => {
                const err = validateImageFile(e.target.files?.[0])
                setImageError(err || null)
              }}
            />
            {imageError && (
              <p className="mt-1 text-sm text-red-600">{imageError}</p>
            )}
            <p className="mt-1 text-xs text-brand-foreground/60">WebP, JPG, or PNG, max 5MB</p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-brand-muted/30">
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
              {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add item'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
