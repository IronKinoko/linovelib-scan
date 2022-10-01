import axios from 'axios'
import { parseCatalog } from './parser'

axios.defaults.headers.common = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36',
}

export async function queryCatalog(id: string) {
  const res = await axios.get(`https://www.linovelib.com/novel/${id}/catalog`)

  return parseCatalog(res.data)
}
