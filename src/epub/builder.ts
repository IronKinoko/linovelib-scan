import { Book } from '../types.js'
import fs from 'fs-extra'
import path from 'path'
import mustache from 'mustache'
import dayjs from 'dayjs'
import archiver from 'archiver'
import { load } from 'cheerio'
import pLimit from 'p-limit'
import crypto from 'crypto'
import { default as axios } from 'axios'
import mime from 'mime-types'
import url from 'url'

const limit = pLimit(5)
async function downloadAssets(OEBPSRoot: string, book: Book) {
  const imageRoot = path.resolve(OEBPSRoot, 'Images')
  const cacheRoot = path.resolve(process.cwd(), '.cache', 'assets')

  await fs.ensureDir(cacheRoot)

  const imageAssets = await Promise.all(
    book.section.chapters.map(async (chapter) => {
      const $ = load(chapter.content, null, false)

      const imageAssets = await Promise.all(
        $('img')
          .toArray()
          .map((dom) =>
            limit(async () => {
              const src = $(dom).attr('src')!
              const ext = src.split('?')[0].split('.').pop()
              const id = crypto.createHash('md5').update(src).digest('hex')
              const fileName = `${id}.${ext}`
              const localCachePath = path.resolve(cacheRoot, fileName)
              const filePath = path.resolve(imageRoot, fileName)

              console.log(src, fileName)

              $(dom).attr('src', `../Images/${fileName}`)
              if (!(await fs.pathExists(localCachePath))) {
                const res = await axios.get(src, { responseType: 'arraybuffer' })
                await fs.writeFile(localCachePath, res.data)
              }

              await fs.copy(localCachePath, filePath)

              return fileName
            })
          )
      )
      chapter.content = $.html()
        .replace(/<img(.*?)>/gi, '<img$1/>')
        .replace(new RegExp('<br>', 'gi'), '')
        .replace(new RegExp('“', 'gi'), '「')
        .replace(new RegExp('”', 'gi'), '」')
        .replace(new RegExp('‘', 'gi'), '『')
        .replace(new RegExp('’', 'gi'), '』')

      return imageAssets
    })
  )

  return imageAssets.flat().map((url) => {
    return { url, type: mime.lookup(url) }
  })
}

async function genNCX(OEBPSRoot: string, book: Book) {
  const filePath = path.resolve(OEBPSRoot, 'toc.ncx')
  let content = await fs.readFile(filePath, 'utf-8')

  const xml = mustache.render(content, book)

  await fs.writeFile(filePath, xml)
}

async function genOPF(OEBPSRoot: string, book: Book) {
  const filePath = path.resolve(OEBPSRoot, 'content.opf')
  let content = await fs.readFile(filePath, 'utf-8')

  const imageAssets = await downloadAssets(OEBPSRoot, book)
  const cover = await genCover(OEBPSRoot, book)
  const xml = mustache.render(content, {
    ...book,
    now: dayjs().format('YYYY-MM-DD'),
    cover,
    imageAssets,
  })

  await fs.writeFile(filePath, xml)
}

async function genCover(OEBPSRoot: string, book: Book) {
  const filePath = path.resolve(OEBPSRoot, 'Text', 'cover.xhtml')
  let content = await fs.readFile(filePath, 'utf-8')

  let cover: string | undefined
  for (const chapter of book.section.chapters) {
    const $ = load(chapter.content)
    cover = $('img').attr('src')
    if (cover) break
  }

  const xml = mustache.render(content, { cover })

  await fs.writeFile(filePath, xml)
  return cover?.replace('../Images/', '')
}

async function genChapters(OEBPSRoot: string, book: Book) {
  const templatePath = path.resolve(OEBPSRoot, 'Text', 'chapter.xhtml')
  let tempalte = await fs.readFile(templatePath, 'utf-8')
  await fs.remove(templatePath)

  await Promise.all(
    book.section.chapters.map(async (chapter) => {
      const chapterPath = path.resolve(OEBPSRoot, 'Text', chapter.fileName)

      const xml = mustache.render(tempalte, chapter)

      await fs.writeFile(chapterPath, xml)
    })
  )
}

async function epub(bookRoot: string) {
  const output = fs.createWriteStream(bookRoot + '.epub')
  const archive = archiver('zip')
  archive.pipe(output)
  archive.directory(bookRoot, false)
  await archive.finalize()

  await fs.remove(bookRoot)
}

export async function genBook(book: Book) {
  const bookRoot = path.resolve(process.cwd(), 'epubs', book.title)
  const templateRoot = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), 'templates')

  await fs.ensureDir(bookRoot)
  await fs.emptyDir(bookRoot)
  await fs.copy(templateRoot, bookRoot)

  const OEBPSRoot = path.resolve(bookRoot, 'OEBPS')

  await genNCX(OEBPSRoot, book)
  await genOPF(OEBPSRoot, book)
  await genChapters(OEBPSRoot, book)

  await epub(bookRoot)
}
