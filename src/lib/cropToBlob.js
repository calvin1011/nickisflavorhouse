/**
 * Draw cropped region of image to canvas and return as blob.
 * crop is in display pixels (from ReactCrop onComplete); we scale to natural size.
 * @param {HTMLImageElement} image
 * @param {import('react-image-crop').PixelCrop} crop
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
