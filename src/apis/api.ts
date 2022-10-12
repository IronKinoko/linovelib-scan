import { default as Axios } from 'axios'
import fs from 'fs-extra'
import pLimit from 'p-limit'
import path from 'path'
import { Book, Catalog, Section } from '../types.js'
import { parseCatalog, parseChapter } from './parser.js'
import { tryFixImg } from './tryFixImg.js'

export const axios = Axios.create({
  baseURL: 'https://w.linovelib.com',
  headers: {
    common: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36',
    },
  },
})

async function fetchHTML(url: string) {
  let filePath = path.join(process.cwd(), '.cache', url)
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
  const res = await fetchHTML(`/novel/${bookId}/catalog`)

  return {
    id: bookId,
    ...parseCatalog(res),
  }
}

export async function queryChapter(chapterId: string) {
  const res = await fetchHTML(chapterId)

  return parseChapter(res)
}

export async function queryBook(section: Section): Promise<Book> {
  const chapters = section.chapters.map((chapter, idx) => {
    return {
      ...chapter,
      order: idx + 1,
      fileName: `chapter${`${idx + 1}`.padStart(4, '0')}.xhtml`,
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

          chapter.content = tryFixImg(chapter.content)

          chapter.done = true
        })
      )
    )
  } while (chapters.some((chapter) => !chapter.done))

  return {
    ...section,
    chapters,
  }
}
