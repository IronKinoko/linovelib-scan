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

        try {
          const id = href.match(/\/(?<id>\d+)\.html/)!.groups!.id
          currentSection.chapters.push({
            id,
            title: $dom.text(),
          })
        } catch (error) {
          console.log(href, title)
        }
      }
    })

  return {
    title,
    sections,
  }
}
