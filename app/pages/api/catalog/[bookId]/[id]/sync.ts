import type { NextApiRequest, NextApiResponse } from 'next'
import { queryCatalog, genEpub, paths, SyncProgress } from '@ironkinoko/linovelib-scan'
import { cache } from 'utils/cache'

type SyncResult = {
  code: number
  progress?: SyncProgress
  message?: string
  done?: boolean
}

const defaultProgress: SyncProgress = { assets: 0, chapters: 0, status: 'chapter', totalAssets: 0 }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { bookId, id } = req.query as Record<string, string>
    const catalog = await queryCatalog(bookId)

    const section = catalog.sections.find((section) => section.id === id)

    if (!section) throw new Error('Invalid section id')

    if (cache.has(id)) {
      const result = cache.get<SyncResult>(id)!
      if (result.code !== 0 || result.done) cache.del(id)
      return res.json(result)
    } else {
      cache.set<SyncResult>(id, { code: 0, progress: defaultProgress, done: false })
      genEpub(section, {
        onSync: (progress) =>
          cache.set(id, { code: 0, progress, done: progress.status === 'done' }),
      }).catch((error) => {
        console.error(error)
        cache.set(id, { code: 1, message: error.message })
      })
    }

    res.json({ code: 0, progress: defaultProgress, done: false })
  } catch (error) {
    console.error(error)
    res.send({ code: 1, message: error.message })
  }
}
