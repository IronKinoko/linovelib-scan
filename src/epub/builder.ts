import archiver from 'archiver'
import { default as Axios } from 'axios'
import { load } from 'cheerio'
import fs from 'fs-extra'
import mime from 'mime-types'
import mustache from 'mustache'
import path from 'path'
import { queryAsset, queryChapter } from '../apis/api.js'
import { paths } from '../constants/paths.js'
import { Book, BuilderOptions, Section, SyncProgress } from '../types.js'
import { isURL } from '../utils.js'
import { tryFixImg } from './tryFixImg.js'

class EpubBuilder {
  private bookRoot: string
  private OEBPSRoot: string
  epubPath: string
  private book!: Book

  private progress: SyncProgress = {
    status: 'chapter',
    chapters: 0,
    assets: 0,
    totalAssets: 0,
  }

  constructor(private section: Section, private options: BuilderOptions = {}) {
    this.bookRoot = path.resolve(paths.epubs, this.section.title)
    this.epubPath = this.bookRoot + '.epub'
    this.OEBPSRoot = path.resolve(this.bookRoot, 'OEBPS')
  }

  async build() {
    await fs.ensureDir(this.bookRoot)
    await fs.emptyDir(this.bookRoot)
    await fs.copy(paths.templates, this.bookRoot)

    this.book = await this.queryBook()

    await this.genNCX()
    await this.genOPF()
    await this.genChapters()
    await this.output()

    return this.epubPath
  }

  private async queryBook(): Promise<Book> {
    const chapters = this.section.chapters.map((chapter, idx) => {
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

    do {
      await Promise.all(
        chapters.map(async (chapter, i) => {
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
            this.updateProgress('chapter', nextPageId)

            chapter.content += chapterInfo.content
            nextPageId = chapterInfo.nextPage

            chapter.prevChapter ||= chapterInfo.prevChapter
            chapter.nextChapter ||= chapterInfo.nextChapter
          } while (nextPageId)

          chapter.content = tryFixImg(chapter.content)

          chapter.done = true
        })
      )
    } while (chapters.some((chapter) => !chapter.done))

    return {
      ...this.section,
      chapters,
    }
  }

  private async downloadAssets() {
    const imageRoot = path.resolve(this.OEBPSRoot, 'Images')

    const imageAssets = await Promise.all(
      this.book.chapters.map(async (chapter) => {
        const $ = load(chapter.content, null, false)

        this.progress.totalAssets += $('img').length

        const imageAssets = await Promise.all(
          $('img')
            .toArray()
            .map(async (dom) => {
              const src = $(dom).attr('src')!
              if (!isURL(src)) {
                $(dom).remove()
                return ''
              }

              try {
                const file = await queryAsset(this.section.id, src)
                this.updateProgress('asset', src)

                const filePath = path.resolve(imageRoot, file.name)
                $(dom).attr('src', `../Images/${file.name}`)

                await fs.copy(file.path, filePath)

                return file.name
              } catch (error) {
                Axios.isAxiosError(error)
                  ? console.error({ code: error.code, message: error.message })
                  : console.error(error)
                console.error(src, 'download error')
                $(dom).remove()
                this.progress.totalAssets--
              }

              return ''
            })
        )
        chapter.content = $.html()
          .replace(/<img(.*?)>/gi, '<img$1/>')
          .replace(new RegExp('<br>', 'gi'), '')
          .replace(new RegExp('“', 'gi'), '「')
          .replace(new RegExp('”', 'gi'), '」')
          .replace(new RegExp('‘', 'gi'), '『')
          .replace(new RegExp('’', 'gi'), '』')

        return imageAssets.filter(Boolean)
      })
    )

    return imageAssets.flat().map((url) => {
      return { url, type: mime.lookup(url) }
    })
  }

  private async genNCX() {
    const filePath = path.resolve(this.OEBPSRoot, 'toc.ncx')
    let content = await fs.readFile(filePath, 'utf-8')

    const xml = mustache.render(content, this.book)

    await fs.writeFile(filePath, xml)
  }

  private async genOPF() {
    const filePath = path.resolve(this.OEBPSRoot, 'content.opf')
    let content = await fs.readFile(filePath, 'utf-8')

    const imageAssets = await this.downloadAssets()
    const cover = await this.genCover()
    const xml = mustache.render(content, {
      ...this.book,
      cover,
      imageAssets,
    })

    await fs.writeFile(filePath, xml)
  }

  private async genCover() {
    const filePath = path.resolve(this.OEBPSRoot, 'Text', 'cover.xhtml')
    let content = await fs.readFile(filePath, 'utf-8')

    let cover: string | undefined
    for (const chapter of this.book.chapters) {
      const $ = load(chapter.content)
      cover = $('img').attr('src')
      if (cover) break
    }

    const xml = mustache.render(content, { cover })

    await fs.writeFile(filePath, xml)
    return cover?.replace('../Images/', '')
  }

  private async genChapters() {
    const templatePath = path.resolve(this.OEBPSRoot, 'Text', 'chapter.xhtml')
    let tempalte = await fs.readFile(templatePath, 'utf-8')
    await fs.remove(templatePath)

    await Promise.all(
      this.book.chapters.map(async (chapter) => {
        const chapterPath = path.resolve(this.OEBPSRoot, 'Text', chapter.fileName)

        const xml = mustache.render(tempalte, chapter)

        await fs.writeFile(chapterPath, xml)
      })
    )
  }

  private async output() {
    const stream = fs.createWriteStream(this.epubPath)
    const archive = archiver('zip')
    archive.pipe(stream)
    archive.directory(this.bookRoot, false)
    await archive.finalize()

    await fs.remove(this.bookRoot)

    this.updateProgress('done')
  }

  private updateProgress(status: SyncProgress['status'], id?: string) {
    this.progress.status = status
    this.progress.id = id
    switch (status) {
      case 'chapter':
        this.progress.chapters++

        break
      case 'asset':
        this.progress.assets++
        break
    }

    this.options.onSync?.(this.progress)
  }
}

export async function genEpub(section: Section, options?: BuilderOptions) {
  const builder = new EpubBuilder(section, options)
  return await builder.build()
}
