import NodeCache from 'node-cache'
import { cleanBookCache } from 'pages/api/catalog/[bookId]'
export const cache = new NodeCache({ stdTTL: 60 * 60 * 2 })

cache.on('expired', (key: string, value) => {
  if (key.startsWith('bookId:')) {
    cleanBookCache(value)
  }
})
