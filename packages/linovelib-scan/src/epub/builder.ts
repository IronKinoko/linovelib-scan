import archiver from 'archiver'
import { default as Axios } from 'axios'
import { load } from 'cheerio'
import fs from 'fs-extra'
import mime from 'mime-types'
import mustache from 'mustache'
import path from 'path'
import { queryAsset, queryChapter } from '../apis/api.js'
import { paths } from '../constants/paths.js'
import { Book, BuilderOptions, ChapterWithCotnent, Section, SyncProgress } from '../types.js'
import { isURL } from '../utils.js'
import { tryFixImg } from './tryFixImg.js'

class EpubBuilder {
  private bookRoot: string
  private OEBPSRoot: string
  epubPath: string
  private book!: Book

  private progress: SyncProgress = {
    status: 'chapter',
    chapter: {
      loaded: 0,
      progress: 0,
      total: 0,
    },
    asset: {
      loaded: 0,
      progress: 0,
      total: 0,
    },
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
    await this.genCover()
    await this.output()

    return this.epubPath
  }

  private async queryBook(): Promise<Book> {
    let chapters = await this.downloadChapters()
    const imageAssets = await this.downloadAssets(chapters)
    const cover = imageAssets[0]?.name

    chapters = this.convertToXHTML(chapters)

    return {
      ...this.section,
      chapters,
      imageAssets,
      cover,
    }
  }

  private async downloadChapters(): Promise<ChapterWithCotnent[]> {
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
    this.progress.chapter.total = this.section.chapters.length

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

            chapter.content += chapterInfo.content
            nextPageId = chapterInfo.nextPage

            chapter.prevChapter ||= chapterInfo.prevChapter
            chapter.nextChapter ||= chapterInfo.nextChapter
          } while (nextPageId)

          chapter.content = tryFixImg(chapter.content)

          chapter.done = true
          this.updateProgress('chapter', chapter.id)
        })
      )
    } while (chapters.some((chapter) => !chapter.done))

    return chapters
  }

  private async downloadAssets(chapters: ChapterWithCotnent[]) {
    const res = await Promise.all(
      chapters.map(async (chapter) => {
        const $ = load(chapter.content, null, false)

        this.progress.asset.total += $('img').length

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
                const file = await this.storeAsset(src)
                this.updateProgress('asset', src)

                $(dom).attr('src', `../Images/${file.name}`)

                return file.name
              } catch (error) {
                $(dom).remove()
                this.progress.asset.total--
              }

              return ''
            })
        )
        chapter.content = $.html()

        return imageAssets.filter(Boolean)
      })
    )

    const imageAssets = res.flat()

    if (imageAssets.length === 0 && this.section.defaultCover) {
      try {
        const file = await this.storeAsset(this.section.defaultCover)
        imageAssets.push(file.name)
      } catch (error) {}
    }
    return imageAssets.map((name) => {
      return { name, type: mime.lookup(name) }
    })
  }

  private async storeAsset(src: string) {
    const imageRoot = path.resolve(this.OEBPSRoot, 'Images')
    try {
      const file = await queryAsset(this.section.hash, src)
      const filePath = path.resolve(imageRoot, file.name)
      await fs.copy(file.path, filePath)
      return file
    } catch (error) {
      Axios.isAxiosError(error)
        ? console.error({ code: error.code, message: error.message })
        : console.error(error)
      console.error(src, 'download error')

      throw error
    }
  }

  private convertToXHTML(chapters: ChapterWithCotnent[]) {
    const attrWhiteList = ['src']

    return chapters.map((chapter) => {
      const $ = load(chapter.content)

      ;(function removeUnsafeTag($content) {
        $content.children().each((i, dom) => {
          const $dom = $(dom)

          const attr = $dom.attr()
          if (attr) {
            const nextAttr: Record<string, string | null> = attr
            for (const key in nextAttr) {
              if (Object.prototype.hasOwnProperty.call(nextAttr, key)) {
                if (!attrWhiteList.includes(key)) nextAttr[key] = null
              }
            }
            $dom.attr(nextAttr)
          }

          if (dom.tagName.match(/^[a-z]+$/i) === null || dom.tagName.match(/br|hr|script/i)) {
            $dom.remove()
          } else removeUnsafeTag($dom)
        })
      })($('body'))

      chapter.content = $('body')
        .html()!
        .replace(/<img(.*?)>/gi, '<img$1/>')
        .replace(new RegExp('<br>', 'gi'), '')
        .replace(new RegExp('“', 'gi'), '「')
        .replace(new RegExp('”', 'gi'), '」')
        .replace(new RegExp('‘', 'gi'), '『')
        .replace(new RegExp('’', 'gi'), '』')
        .replace(/(<\/.*?>)/g, '$1\n')

      return chapter
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

    const xml = mustache.render(content, this.book)

    await fs.writeFile(filePath, xml)
  }

  private async genCover() {
    const filePath = path.resolve(this.OEBPSRoot, 'Text', 'cover.xhtml')
    let content = await fs.readFile(filePath, 'utf-8')

    const xml = mustache.render(content, { cover: this.book.cover })

    if (this.book.cover) await fs.writeFile(filePath, xml)
    else await fs.remove(filePath)
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

    if (process.env.NODE_ENV !== 'development') await fs.remove(this.bookRoot)

    this.updateProgress('done')
  }

  private updateProgress(status: SyncProgress['status'], id?: string) {
    this.progress.status = status
    this.progress.id = id
    switch (status) {
      case 'chapter':
        this.progress.chapter.loaded++
        this.progress.chapter.progress =
          this.progress.chapter.loaded / this.progress.chapter.total || 0
        break
      case 'asset':
        this.progress.asset.loaded++
        this.progress.asset.progress = this.progress.asset.loaded / this.progress.asset.total || 0
        break
    }

    this.options.onSync?.(this.progress)
  }
}

export async function genEpub(section: Section, options?: BuilderOptions) {
  const builder = new EpubBuilder(section, options)
  return await builder.build()
}
