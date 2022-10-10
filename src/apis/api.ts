import { default as Axios } from 'axios'
import fs from 'fs-extra'
import pLimit from 'p-limit'
import path from 'path'
import { Book, Section } from '../types.js'
import { parseCatalog, parseChapter } from './parser.js'

export const axios = Axios.create({
  baseURL: 'https://www.linovelib.com',
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

export async function queryCatalog(bookId: string) {
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

function tryFixImg(content: string) {
  const urlRe =
    /src="(((ht|f)tps?):\/\/)?([^!@#$%^&*?.\s-]([^!@#$%^&*?.\s]{0,63}[^!@#$%^&*?.\s])?\.)+[a-z]{2,6}\/?"/

  // /<img src="https:\/\/img\.linovelib\.com\/\d+\/\d+\/\d+\/\d+\.[a-z]+?">/
  const correctCharArr = [
    '<img src="https://img.linovelib.com/'.split(''),
    /\d/,
    '/',
    /\d/,
    '/',
    /\d/,
    '/',
    /\d/,
    '.',
    /[a-z]/,
    '">'.split(''),
  ].flat()

  const res = content.match(/<img(.*?)>/g)
  if (res) {
    for (const imgHTML of res) {
      if (urlRe.test(imgHTML)) continue

      let start = content.indexOf(imgHTML)

      let result = '',
        end = start,
        correctIdx = 0
      for (let stack = ''; end < content.length && correctIdx < correctCharArr.length; end++) {
        const char = content.charAt(end)
        const target = correctCharArr[correctIdx]
        if (typeof target === 'string') {
          if (target === char) {
            result += char
            correctIdx++
          }
        } else {
          if (target.test(char)) {
            stack += char
          } else {
            result += stack
            stack = ''
            correctIdx++
            end--
          }
        }
      }
      if (correctIdx === correctCharArr.length) {
        content = content.replace(content.slice(start, end), result)
      }
    }
  }

  return content
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
