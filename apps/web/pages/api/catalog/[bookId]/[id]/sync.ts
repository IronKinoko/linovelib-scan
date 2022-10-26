import type { NextApiRequest, NextApiResponse } from 'next'
import { queryCatalog, genEpub, SyncProgress } from '@ironkinoko/linovelib-scan'
import { cache } from 'utils/cache'

type SyncResult = {
  code: number
  progress?: SyncProgress
  message?: string
  done?: boolean
  downloadURL?: string
}

const defaultProgress: SyncProgress = {
  status: 'chapter',
  chapter: {
    loaded: 0,
    progress: 0,
    total: 0,
  },
  asset: {
    loaded: 0,
    progress: 0,
    total: 0,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { bookId, id } = req.query as Record<string, string>
    const catalog = await queryCatalog(bookId)

    const section = catalog.sections.find((section) => section.id === id)

    if (!section) throw new Error('Invalid section id')

    const hash = section.hash

    const filename = `${encodeURIComponent(section.title)}.epub`
    const downloadURL = `${process.env.basePath}/api/catalog/${bookId}/${id}/${filename}`

    if (cache.has(hash)) {
      const result = cache.get<SyncResult>(hash)!
      if (result.code !== 0 || result.done) cache.del(hash)
      return res.json(result)
    } else {
      cache.set<SyncResult>(hash, { code: 0, progress: defaultProgress, done: false })
      genEpub(section, {
        onSync: (progress) =>
          cache.set(hash, { code: 0, progress, done: progress.status === 'done', downloadURL }),
      }).catch((error) => {
        console.error(error)
        cache.set(hash, { code: 1, message: error.message })
      })
    }

    res.json({ code: 0, progress: defaultProgress, done: false })
  } catch (error) {
    console.error(error)
    res.send({ code: 1, message: error.message })
  }
}
