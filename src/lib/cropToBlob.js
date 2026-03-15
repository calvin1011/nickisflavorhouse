/* global Image */
/**
 * Draw cropped region of image to canvas and return as blob.
 * crop is in display pixels (from ReactCrop onComplete); we scale to natural size.
 * @param {HTMLImageElement} image
 * @param {{ x: number, y: number, width: number, height: number }} crop - display pixels
 * @param {string} mimeType
 * @param {number} quality 0-1 for jpeg/webp
 * @returns {Promise<Blob>}
 */
export function cropToBlob(image, crop, mimeType = 'image/jpeg', quality = 0.92) {
  const scaleX = image.naturalWidth / image.width
  const scaleY = image.naturalHeight / image.height
  const canvas = document.createElement('canvas')
  canvas.width = Math.floor(crop.width * scaleX)
  canvas.height = Math.floor(crop.height * scaleY)
  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.reject(new Error('No 2d context'))
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height
  )
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))),
      mimeType,
      quality
    )
  })
}

/**
 * Crop image from URL using pixel area (e.g. from react-easy-crop croppedAreaPixels).
 * @param {string} imageSrc - data URL or object URL
 * @param {{ x: number, y: number, width: number, height: number }} pixelCrop - natural image coordinates
 * @param {string} mimeType
 * @param {number} quality 0-1
 * @returns {Promise<Blob>}
 */
export function getCroppedImgBlob(imageSrc, pixelCrop, mimeType = 'image/jpeg', quality = 0.92) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      const { x, y, width, height } = pixelCrop
      const canvas = document.createElement('canvas')
      canvas.width = Math.floor(width)
      canvas.height = Math.floor(height)
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('No 2d context'))
        return
      }
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(image, x, y, width, height, 0, 0, width, height)
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))),
        mimeType,
        quality
      )
    }
    image.onerror = () => reject(new Error('Image load failed'))
    image.src = imageSrc
  })
}
