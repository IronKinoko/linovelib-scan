import { queryCatalog } from '@ironkinoko/linovelib-scan'
import type { NextApiRequest, NextApiResponse } from 'next'
import { downloadLocalEpubFile } from 'pages/api/downloadBySectionName'

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
