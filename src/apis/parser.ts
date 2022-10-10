import { load } from 'cheerio'
import { Section } from '../types.js'
import { md5 } from '../utils.js'
import { decrypt } from './decrypt.js'
export function parseCatalog(html: string) {
  const $ = load(html)

  const title = $('.book-meta h1').text()
  const author = $('.book-meta p a').text()
  const sections: Section[] = []

  let currentSection: Section

  $('.chapter-list')
    .children()
    .each((i, dom) => {
      const $dom = $(dom)

      if ($dom.hasClass('volume')) {
        const sectionTitle = `${title} ${$dom.text()}`
        currentSection = {
          id: md5(sectionTitle),
          title: sectionTitle,
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

  const $content = $('#TextContent')
  $content.find('.tp').remove()
  $content.find('.bd').remove()

  let content = decrypt($content.html() || '')

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
