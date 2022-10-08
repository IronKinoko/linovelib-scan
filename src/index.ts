import { queryCatalog, querySection } from './apis/api'
import pLimit from 'p-limit'
import { genBook } from './epub/builder'
const limit = pLimit(3)

process.on('unhandledRejection', (e: any) => {
  console.error(e)
})

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
