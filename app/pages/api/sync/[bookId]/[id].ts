import type { NextApiRequest, NextApiResponse } from 'next'
import { queryBook, queryCatalog, genEpub } from '@ironkinoko/linovelib-scan'
import { cache } from '../../../../utils/cache'
import path from 'path'
import fs from 'fs-extra'

type SyncResult = { code: number; message?: string }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { bookId, id } = req.query as Record<string, string>
    const catalog = await queryCatalog(bookId)

    const section = catalog.sections.find((section) => section.id === id)

    if (!section) throw new Error('Invalid section id')

    const epubPath = path.resolve(process.cwd(), 'epubs', section.title + '.epub')
    if (await fs.pathExists(epubPath)) {
      return res.json({ code: 0, section, done: true })
    }

    if (cache.has(id)) {
      const result = cache.get<SyncResult>(id)!
      if (result.code !== 0) {
        cache.del(id)
        return res.json(result)
      } else return res.json({ code: 0, section, done: false })
    } else {
      cache.set(id, { code: 0 })
      queryBook(section)
        .then((book) => {
          genEpub(book)
            .then(() => {
              cache.del(id)
            })
            .catch((error) => {
              cache.set(id, { code: 1, message: error.message })
            })
        })
        .catch((error) => {
          cache.set(id, { code: 1, message: error.message })
        })
    }

    res.json({ code: 0, done: false })
  } catch (error) {
    res.send({ code: 1, message: error.message })
  }
}
