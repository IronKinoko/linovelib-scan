import { queryCatalog, queryBook } from './apis/api.js'
import pLimit from 'p-limit'
import { genBook } from './epub/builder.js'
const limit = pLimit(3)

export { queryBook, queryCatalog, queryChapter } from './apis/api.js'

export async function downLoadEpub(bookId: string) {
  const catalog = await queryCatalog(bookId)

  const books = await Promise.all(
    catalog.sections.map((section) => limit(() => queryBook(section)))
  )

  await Promise.all(books.map((book) => genBook(book)))
}
