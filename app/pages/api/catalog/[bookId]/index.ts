import type { NextApiRequest, NextApiResponse } from 'next'
import { queryCatalog } from '@ironkinoko/linovelib-scan'
import path from 'path'
import fs from 'fs-extra'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { bookId } = req.query as Record<string, string>

    const catalog = await queryCatalog(bookId)

    switch (req.method) {
      case 'DELETE':
        const novelRoot = path.resolve(process.cwd(), '.cache', 'novel', bookId)
        await fs.remove(novelRoot)

        for (const section of catalog.sections) {
          const epubPath = path.resolve(process.cwd(), 'epubs', section.title + '.epub')
          await fs.remove(epubPath)
        }

        res.json({ code: 0 })
        break

      default:
        res.json({ code: 0, catalog })

        break
    }
  } catch (error) {
    console.error(error)
    res.send({ code: 1, message: error.message })
  }
}
