import type { NextApiRequest, NextApiResponse } from 'next'
import { queryCatalog } from '@ironkinoko/linovelib-scan'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { bookId } = req.query

    const catalog = await queryCatalog(bookId as string)
    res.json({ code: 0, catalog })
  } catch (error) {
    console.error(error)
    res.send({ code: 1, message: error.message })
  }
}
