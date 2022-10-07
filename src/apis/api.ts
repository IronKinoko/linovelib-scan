import Axios from 'axios'
import { parseCatalog } from './parser'
import fs from 'fs-extra'
import path from 'path'

const axios = Axios.create({
  baseURL: 'https://www.linovelib.com',
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36',
  },
  adapter: async (config) => {
    const filePath = path.join(process.cwd(), '.cache', config.url!)
    const fileDir = path.dirname(filePath)

    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8')
      return {
        config,
        data,
        headers: {},
        status: 200,
        statusText: '',
      }
    }

    delete config.adapter
    const res = await Axios(config)

    if (res.status === 200) {
      fs.ensureDirSync(fileDir)
      fs.writeFileSync(filePath, res.data, 'utf-8')
    }

    return res
  },
})

export async function queryCatalog(bookId: string) {
  const res = await axios.get(`/novel/${bookId}/catalog`)

  return parseCatalog(res.data)
}

export async function queryChapter(bookId: string, chapterId: string) {
  const res = await axios.get(`/novel/${bookId}/${chapterId}.html`)

  
}
