import type { NextApiRequest, NextApiResponse } from 'next'
import { queryCatalog } from '@ironkinoko/linovelib-scan'
import path from 'path'
import fs from 'fs-extra'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { bookId, id } = req.query as Record<string, string>
    const catalog = await queryCatalog(bookId)

    const section = catalog.sections.find((section) => section.id === id)

    if (!section) throw new Error('Invalid section id')

    const epubPath = path.resolve(process.cwd(), 'epubs', section.title + '.epub')
    if (await fs.pathExists(epubPath)) {
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=' + encodeURIComponent(section.title + '.epub')
      )
      fs.createReadStream(epubPath).pipe(res)
    } else {
      res.redirect(`${process.env.basePath}/404`)
    }
  } catch (error) {
    console.error(error)
    res.redirect(`${process.env.basePath}/404`)
  }
}
