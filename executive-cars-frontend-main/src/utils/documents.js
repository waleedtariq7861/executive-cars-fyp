import api from '../api/api.js'

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

// Document links come from our own API (Cloudinary over HTTPS, or this server in development). Anything else, such as
// a javascript: or data: address, is never navigated to.
export const isSafeDocumentUrl = (value) => {
  if (typeof value !== 'string' || !value.trim()) return false
  try {
    const target = new URL(value, window.location.origin)
    if (target.protocol === 'https:') return true
    return target.protocol === 'http:' && (LOCAL_HOSTS.has(target.hostname) || target.origin === window.location.origin)
  } catch {
    return false
  }
}

export async function openProtectedDocument(accessPath) {
  if (!accessPath) throw new Error('Document is not available')
  const documentWindow = window.open('', '_blank')
  if (!documentWindow) throw new Error('Your browser blocked the document window. Allow pop-ups and try again.')

  documentWindow.opener = null
  try {
    const { data } = await api.get(accessPath)
    if (!data?.url) throw new Error('Document access link was not returned')
    if (!isSafeDocumentUrl(data.url)) throw new Error('Document access link was not valid')
    documentWindow.location.replace(data.url)
    return data
  } catch (error) {
    documentWindow.close()
    throw error
  }
}
