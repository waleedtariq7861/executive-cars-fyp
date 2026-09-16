import api from '../api/api.js'

export async function openProtectedDocument(accessPath) {
  if (!accessPath) throw new Error('Document is not available')
  const { data } = await api.get(accessPath)
  if (!data?.url) throw new Error('Document access link was not returned')
  window.open(data.url, '_blank', 'noopener,noreferrer')
  return data
}
