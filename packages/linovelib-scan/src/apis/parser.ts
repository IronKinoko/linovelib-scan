import { load } from 'cheerio'
import { Section } from '../types.js'
import { md5, sectionNameToNumber } from '../utils.js'

export function parseCatalog(html: string) {
  const $ = load(html)

  if ($('#volumes').length === 0) {
    throw new Error($('.aui-ver-form').text())
  }

  const cover = $('[property=og:image]').attr('content') || ''
  const title = $('[property=og:novel:book_name]').attr('content') || ''
  const author = $('[property=og:novel:author]').attr('content') || ''
  const sections: Section[] = []

  let currentSection: Section
  let id = 0
  $('#volumes li').each((_, dom) => {
    const $dom = $(dom)

    if ($dom.hasClass('chapter-bar')) {
      const sectionName = $dom.text()
      const sectionTitle = `${title} ${sectionNameToNumber(sectionName)}`
      currentSection = {
        id: id.toString(),
        hash: md5(sectionTitle + id),
        title: sectionTitle,
        sectionName,
        author,
        defaultCover: cover,
        chapters: [],
      }
      id++
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
    cover,
    title,
    author,
    sections,
  }
}

export function parseChapter(html: string) {
  const $ = load(html)

  const $content = $('#acontent')

  $content.find('.cgo').remove()

  let content = ($content.html() || '').trim().replace(/[\r\n]/gim, '')

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
