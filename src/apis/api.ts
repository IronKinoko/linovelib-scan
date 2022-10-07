import Axios from 'axios'
import { parseCatalog, parseChapter } from './parser'
import { Section, SectionWithContent } from './types'
import fs from 'fs-extra'
import path from 'path'
import pLimit from 'p-limit'

const axios = Axios.create({
  baseURL: 'https://www.linovelib.com',
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36',
  },
  adapter: async (config) => {
    let filePath = path.join(process.cwd(), '.cache', config.url!)
    const fileDir = path.dirname(filePath)
    let filename = path.basename(filePath)
    filePath = filePath.replace(filename, encodeURIComponent(filename))

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

export async function queryChapter(chapterId: string) {
  const res = await axios.get(chapterId)

  return parseChapter(res.data)
}

export async function querySection(section: Section): Promise<SectionWithContent> {
  const chapters = section.chapters.map((chapter) => {
    return {
      ...chapter,
      done: false,
      content: '',
      prevChapter: '',
      nextChapter: '',
    }
  })

  const limit = pLimit(3)
  do {
    await Promise.all(
      chapters.map((chapter, i) =>
        limit(async () => {
          if (!chapter.id) {
            const nextChapter = chapters[i + 1]
            const prevChapter = chapters[i - 1]
            chapter.id = prevChapter?.nextChapter || nextChapter?.prevChapter
          }

          if (!chapter.id || chapter.done) return
          let nextPageId = chapter.id
          let chapterInfo

          do {
            chapterInfo = await queryChapter(nextPageId)
            chapter.content += chapterInfo.content
            nextPageId = chapterInfo.nextPage

            chapter.prevChapter ||= chapterInfo.prevChapter
            chapter.nextChapter ||= chapterInfo.nextChapter
          } while (nextPageId)

          chapter.done = true
          console.log(chapter.id, chapter.title)
        })
      )
    )
  } while (chapters.some((chapter) => !chapter.done))

  return {
    title: section.title,
    chapters,
  }
}
