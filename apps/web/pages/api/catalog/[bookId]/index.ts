import type { NextApiRequest, NextApiResponse } from 'next'
import { Catalog, paths, queryCatalog } from '@ironkinoko/linovelib-scan'
import path from 'path'
import fs from 'fs-extra'
import { cache } from 'utils/cache'

export async function cleanBookCache(catalog: Catalog) {
  const novelRoot = path.resolve(paths.cache, 'novel', catalog.id)
  await fs.remove(novelRoot)

  for (const section of catalog.sections) {
    const epubPath = path.resolve(paths.epubs, section.title + '.epub')
    await fs.remove(epubPath)

    const assetsPath = path.resolve(paths.assets, section.hash)
    await fs.remove(assetsPath)

    cache.del(section.hash)
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { bookId } = req.query as Record<string, string>

    const catalog = await queryCatalog(bookId)

    const cacheKey = `bookId:${bookId}`
    cache.set(cacheKey, catalog)

    switch (req.method) {
      case 'DELETE':
        cache.del(cacheKey)

        await cleanBookCache(catalog)
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
