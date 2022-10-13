import { paths, queryCatalog } from '@ironkinoko/linovelib-scan'
import type { NextApiRequest, NextApiResponse } from 'next'
import path from 'path'
import fs from 'fs-extra'

export async function downloadLocalEpubFile(res: NextApiResponse, sectionTitle: string) {
  const epubPath = path.resolve(paths.epubs, sectionTitle + '.epub')
  if (await fs.pathExists(epubPath)) {
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=' + encodeURIComponent(sectionTitle + '.epub')
    )
    fs.createReadStream(epubPath).pipe(res)
  } else {
    res.redirect(`${process.env.basePath}/404`)
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { bookId, id } = req.query as Record<string, string>
    const catalog = await queryCatalog(bookId)

    const section = catalog.sections.find((section) => section.id === id)

    if (!section) throw new Error('Invalid section id')

    await downloadLocalEpubFile(res, section.title)
  } catch (error) {
    console.error(error)
    res.redirect(`${process.env.basePath}/404`)
  }
}
