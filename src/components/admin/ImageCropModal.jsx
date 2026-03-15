import { useState, useCallback, useEffect } from 'react'
import Cropper from 'react-easy-crop'
import { X } from 'lucide-react'
import { getCroppedImgBlob } from '@/lib/cropToBlob'
import { cn } from '@/lib/utils'

const ASPECT = 4 / 3
const buttonClass =
  'rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50'

/**
 * Modal that shows an image for cropping. On confirm, calls onConfirm(croppedBlob).
 * @param {{ open: boolean, file: File | null, onConfirm: (blob: Blob) => void, onCancel: () => void }} props
 */
export function ImageCropModal({ open, file, onConfirm, onCancel }) {
  const [imgSrc, setImgSrc] = useState('')
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [busy, setBusy] = useState(false)

  const onCropComplete = useCallback((_croppedArea, pixels) => {
    setCroppedAreaPixels(pixels)
  }, [])

  useEffect(() => {
    if (!open) {
      setImgSrc('')
      setCroppedAreaPixels(null)
      return
    }
    if (!file) return
    const reader = new FileReader()
    reader.addEventListener('load', () => {
      setImgSrc(reader.result?.toString() ?? '')
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setCroppedAreaPixels(null)
    })
    reader.readAsDataURL(file)
  }, [open, file])

  const handleUseCrop = useCallback(async () => {
    if (!imgSrc || !croppedAreaPixels?.width || !croppedAreaPixels?.height) return
    setBusy(true)
    try {
      const mime = file?.type?.startsWith('image/') ? file.type : 'image/jpeg'
      const blob = await getCroppedImgBlob(imgSrc, croppedAreaPixels, mime, 0.92)
      onConfirm(blob)
      onCancel()
    } catch (err) {
      console.error(err)
    } finally {
      setBusy(false)
    }
  }, [imgSrc, croppedAreaPixels, file?.type, onConfirm, onCancel])

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-black/60"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div
        className="fixed left-1/2 top-1/2 z-[61] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg border border-brand-muted/30 bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="image-crop-title"
      >
        <div className="flex items-center justify-between border-b border-brand-muted/30 px-4 py-3">
          <h2 id="image-crop-title" className="font-display text-lg font-semibold text-brand-foreground">
            Crop image
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className={cn(buttonClass, 'text-brand-foreground/70 hover:bg-brand-muted/20 hover:text-brand-foreground')}
            aria-label="Cancel"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="relative h-[60vh] w-full bg-brand-muted/20">
          {imgSrc ? (
            <Cropper
              image={imgSrc}
              crop={crop}
              zoom={zoom}
              aspect={ASPECT}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
              cropShape="rect"
              showGrid={false}
              objectFit="contain"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-brand-foreground/70">
              Loading…
            </div>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-brand-muted/30 px-4 py-3">
          <label className="flex items-center gap-2 text-sm text-brand-foreground">
            <span>Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-24"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className={cn(buttonClass, 'border border-brand-muted/40 text-brand-foreground hover:bg-brand-muted/20')}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUseCrop}
              disabled={!croppedAreaPixels?.width || !croppedAreaPixels?.height || busy}
              className={cn(buttonClass, 'bg-brand-primary text-white hover:bg-brand-primary-dark')}
            >
              {busy ? 'Applying…' : 'Use crop'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
