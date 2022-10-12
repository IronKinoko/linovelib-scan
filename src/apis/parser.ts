import { load } from 'cheerio'
import { Section } from '../types.js'
import { md5 } from '../utils.js'
export function parseCatalog(html: string) {
  const $ = load(html)

  if ($('#volumes').length === 0) {
    throw new Error($('.aui-ver-form').text())
  }

  const title = $('[property=og:novel:book_name]').attr('content') || ''
  const author = $('[property=og:novel:author]').attr('content') || ''
  const sections: Section[] = []

  let currentSection: Section

  $('#volumes li').each((i, dom) => {
    const $dom = $(dom)

    if ($dom.hasClass('chapter-bar')) {
      const sectionTitle = `${title} ${$dom.text()}`
      currentSection = {
        id: md5(sectionTitle + i),
        title: sectionTitle,
        sectionName: $dom.text(),
        author,
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
    author,
    sections,
  }
}

export function parseChapter(html: string) {
  const $ = load(html)

  const $content = $('#acontent')
  $content.find('.cgo').remove()

  let content = ($content.html() || '')
    .trim()
    .replace(/[\r\n]/gim, '')

  const $page = $('#footlink')

  let nextChapter = '',
    prevChapter = '',
    nextPage = '',
    prevPage = ''

  const pre = html.match(/url_previous:'(.*?)'/)?.[1] || ''
  const next = html.match(/url_next:'(.*?)'/)?.[1] || ''

  $page.find('a').each((i, e) => {
    const $a = $(e)
    switch ($a.text()) {
      case '上一页':
        prevPage = pre
        break
      case '上一章':
        prevChapter = pre
        break
      case '下一页':
        nextPage = next
        break
      case '下一章':
        nextChapter = next
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
