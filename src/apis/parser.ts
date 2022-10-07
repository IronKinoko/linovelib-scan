import { load } from 'cheerio'
import { Section } from './types'

export function parseCatalog(html: string) {
  const $ = load(html)

  const title = $('.book-meta h1').text()

  const sections: Section[] = []

  let currentSection: Section

  $('.chapter-list')
    .children()
    .each((i, dom) => {
      const $dom = $(dom)

      if ($dom.hasClass('volume')) {
        currentSection = {
          title: $dom.text(),
          chapters: [],
        }
        sections.push(currentSection)
      } else {
        const href = $dom.find('a').attr('href') || ''

        let id = ''
        const matchRet = href.match(/\/(?<id>\d+)\.html/)
        if (matchRet) {
          id = href
        }
        currentSection.chapters.push({
          id,
          title: $dom.text(),
        })
      }
    })

  return {
    title,
    sections,
  }
}

export function parseChapter(html: string) {
  const $ = load(html)

  const $content = $('#TextContent')
  $content.remove('.tp').remove('.bd')

  const content = ($content.html() || '')
    .replace(new RegExp('“', 'gi'), '「')
    .replace(new RegExp('”', 'gi'), '」')
    .replace(new RegExp('‘', 'gi'), '『')
    .replace(new RegExp('’', 'gi'), '』')

  const $page = $('.mlfy_page')

  let nextChapter = '',
    prevChapter = '',
    nextPage = '',
    prevPage = ''

  $page.find('a').each((i, e) => {
    const $a = $(e)
    const url = $a.attr('href')!
    switch ($a.text()) {
      case '上一页':
        prevPage = url
        break
      case '上一章':
        prevChapter = url
        break
      case '下一页':
        nextPage = url
        break
      case '下一章':
        nextChapter = url
        break
    }
  })

  return {
    nextChapter,
    prevChapter,
    nextPage,
    prevPage,
    content,
  }
}
