import type { NextApiRequest, NextApiResponse } from 'next'
import { downLoadEpub } from '@ironkinoko/linovelib-scan'
import path from 'path'
import fs from 'fs-extra'

export async function downloadLocalEpubFile(res: NextApiResponse, sectionTitle: string) {
  const epubPath = path.resolve(process.cwd(), 'epubs', sectionTitle + '.epub')
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
    const { bookId, sectionName } = req.query as Record<string, string>

    if (!bookId || !sectionName) {
      return res.status(404).send(`Invalide bookId or sectionName`)
    }

    const catalog = await downLoadEpub(bookId, [sectionName])

    const section = catalog.sections.find((section) => section.sectionName === sectionName)

    if (!section) {
      return res.status(404).send(`Invalide bookId or sectionName`)
    }

    await downloadLocalEpubFile(res, section.title)
  } catch (error) {
    console.error(error)
    res.redirect(`${process.env.basePath}/404`)
  }
}
