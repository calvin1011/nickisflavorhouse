import { useState, useRef, useCallback, useEffect } from 'react'
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { X } from 'lucide-react'
import { cropToBlob } from '@/lib/cropToBlob'
import { cn } from '@/lib/utils'

function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  return centerCrop(
    makeAspectCrop(
      { unit: '%', width: 90 },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  )
}

const buttonClass =
  'rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50'

/**
 * Modal that shows an image for cropping. On confirm, calls onConfirm(croppedBlob).
 * @param {{ open: boolean, file: File | null, onConfirm: (blob: Blob) => void, onCancel: () => void }} props
 */
export function ImageCropModal({ open, file, onConfirm, onCancel }) {
  const [imgSrc, setImgSrc] = useState('')
  const [crop, setCrop] = useState(null)
  const [completedCrop, setCompletedCrop] = useState(null)
  const [busy, setBusy] = useState(false)
  const imgRef = useRef(null)

  useEffect(() => {
    if (!open) {
      setImgSrc('')
      setCrop(null)
      setCompletedCrop(null)
      return
    }
    if (file) {
      const reader = new FileReader()
      reader.addEventListener('load', () => {
        setImgSrc(reader.result?.toString() ?? '')
        setCrop(undefined)
        setCompletedCrop(undefined)
      })
      reader.readAsDataURL(file)
    }
  }, [open, file])

  const handleImageLoad = useCallback((e) => {
    const { width, height } = e.currentTarget
    setCrop(centerAspectCrop(width, height, 4 / 3))
  }, [])

  const handleUseCrop = useCallback(async () => {
    if (!imgRef.current || !completedCrop?.width || !completedCrop?.height) return
    setBusy(true)
    try {
      const mime = file?.type?.startsWith('image/') ? file.type : 'image/jpeg'
      const blob = await cropToBlob(imgRef.current, completedCrop, mime, 0.92)
      onConfirm(blob)
      onCancel()
    } catch (err) {
      console.error(err)
    } finally {
      setBusy(false)
    }
  }, [completedCrop, file?.type, onConfirm, onCancel])

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
        <div className="max-h-[70vh] overflow-auto p-4">
          {imgSrc ? (
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(_, pixelCrop) => setCompletedCrop(pixelCrop)}
              aspect={4 / 3}
              minWidth={100}
              minHeight={75}
              className="max-h-[60vh]"
            >
              <img
                ref={imgRef}
                src={imgSrc}
                alt="Crop"
                style={{ maxHeight: '60vh', width: 'auto', display: 'block' }}
                onLoad={handleImageLoad}
              />
            </ReactCrop>
          ) : (
            <p className="py-8 text-center text-brand-foreground/70">Loading…</p>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-brand-muted/30 px-4 py-3">
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
            disabled={!completedCrop?.width || !completedCrop?.height || busy}
            className={cn(buttonClass, 'bg-brand-primary text-white hover:bg-brand-primary-dark')}
          >
            {busy ? 'Applying…' : 'Use crop'}
          </button>
        </div>
      </div>
    </>
  )
}
