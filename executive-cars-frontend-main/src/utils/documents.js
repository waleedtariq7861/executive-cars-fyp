import api from '../api/api.js'

export async function openProtectedDocument(accessPath) {
  if (!accessPath) throw new Error('Document is not available')
  const documentWindow = window.open('', '_blank')
  if (!documentWindow) throw new Error('Your browser blocked the document window. Allow pop-ups and try again.')

  documentWindow.opener = null
  try {
    const { data } = await api.get(accessPath)
    if (!data?.url) throw new Error('Document access link was not returned')
    documentWindow.location.replace(data.url)
    return data
  } catch (error) {
    documentWindow.close()
    throw error
  }
}
