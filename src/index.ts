import { queryCatalog, querySection } from './apis/api.js'
import pLimit from 'p-limit'
import { genBook } from './epub/builder.js'
const limit = pLimit(3)

export * from './apis/api.js'
export async function downLoadEpub(bookId: string) {
  const catalog = await queryCatalog(bookId)

  const sections = await Promise.all(
    catalog.sections.map((section) => limit(() => querySection(section)))
  )

  await Promise.all(
    sections.map((section) => {
      return genBook({
        id: section.id,
        title: `${catalog.title} ${section.title}`,
        author: catalog.author,
        section,
      })
    })
  )
}
