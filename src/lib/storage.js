/**
 * Derive Storage object path from a Supabase public URL.
 * URL format: .../storage/v1/object/public/<bucket>/<path>
 * @param {string} publicUrl
 * @param {string} bucket
 * @returns {string | null} path or null if URL does not match the bucket
 */
export function getStoragePathFromPublicUrl(publicUrl, bucket) {
  if (!publicUrl || typeof publicUrl !== 'string' || !bucket) return null
  const prefix = `/object/public/${bucket}/`
  const i = publicUrl.indexOf(prefix)
  if (i === -1) return null
  return publicUrl.slice(i + prefix.length).split('?')[0].trim() || null
}
