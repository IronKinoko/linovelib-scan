import { load } from 'cheerio'

export interface Section {
  title: string
  chapters: Chapter[]
}
export interface Chapter {
  title: string
  id: string
}
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
        const title = $dom.text()

        const href = $dom.find('a').attr('href')
        if (!href) throw new Error(`${title} href 错误`)

        let id = ''
        const matchRet = href.match(/\/(?<id>\d+)\.html/)
        if (matchRet) {
          id = matchRet.groups!.id
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
