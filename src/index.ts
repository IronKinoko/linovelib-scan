import pLimit from 'p-limit'
import { queryBook, queryCatalog } from './apis/api.js'
import { genBook } from './epub/builder.js'
const limit = pLimit(3)

export { queryBook, queryCatalog, queryChapter } from './apis/api.js'

export async function downLoadEpub(bookId: string, sectionNames?: string[]) {
  const catalog = await queryCatalog(bookId)

  if (sectionNames && sectionNames.length > 0) {
    catalog.sections = catalog.sections.filter((section) =>
      sectionNames.includes(section.sectionName)
    )
  }

  const books = await Promise.all(
    catalog.sections.map((section) => limit(() => queryBook(section)))
  )

  await Promise.all(books.map((book) => genBook(book)))

  return catalog
}
