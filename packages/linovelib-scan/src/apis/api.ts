import { default as Axios } from 'axios'
import fs from 'fs-extra'
import path from 'path'
import { paths } from '../constants/paths.js'
import { Catalog } from '../types.js'
import { md5 } from '../utils.js'
import { parseCatalog, parseChapter } from './parser.js'
import http from 'http'
import https from 'https'
export const axios = Axios.create({
  httpAgent: new http.Agent({ keepAlive: true, maxSockets: 10 }),
  httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 10 }),
  baseURL: 'https://w.linovelib.com',
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36',
  },
})

async function fetchHTML(url: string) {
  let filePath = path.join(paths.cache, url)
  const fileDir = path.dirname(filePath)
  let filename = path.basename(filePath)
  filePath = filePath.replace(filename, encodeURIComponent(filename))

  if (await fs.pathExists(filePath)) {
    return await fs.readFile(filePath, 'utf-8')
  }

  const res = await axios.get(url)

  if (res.status === 200) {
    await fs.ensureDir(fileDir)
    await fs.writeFile(filePath, res.data, 'utf-8')
  }

  return res.data
}

export async function queryCatalog(bookId: string): Promise<Catalog> {
  if (!/\d+/.test(bookId)) throw new Error('Invalid bookId')
  const res = await fetchHTML(`/novel/${bookId}/catalog`)

  return { id: bookId, ...parseCatalog(res) }
}

export async function queryChapter(chapterId: string) {
  const res = await fetchHTML(chapterId)

  return parseChapter(res)
}

export async function queryAsset(dir: string, src: string) {
  const root = path.resolve(paths.assets, dir)
  const ext = src.split('?')[0].split('.').pop()
  const id = md5(src)
  const name = `${id}.${ext}`
  const localCachePath = path.resolve(root, name)

  if (!(await fs.pathExists(localCachePath))) {
    const res = await axios.get(src, { responseType: 'arraybuffer' })
    await fs.ensureDir(root)
    await fs.writeFile(localCachePath, res.data)
  }

  return { path: localCachePath, name }
}
