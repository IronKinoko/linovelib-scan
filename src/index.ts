import { queryCatalog, querySection } from './apis/api'
import pLimit from 'p-limit'
const limit = pLimit(3)

process.on('unhandledRejection', (e: any) => {
  console.error(e)
})

main('3318') // 有谁规定了现实中不能有恋爱喜剧的？
async function main(bookId: string) {
  const catalog = await queryCatalog(bookId)

  const book = await Promise.all(
    catalog.sections.map((section) => limit(() => querySection(section)))
  )

  console.log(
    JSON.stringify(
      {
        title: catalog.title,
        book: book.map((section) => {
          return {
            title: section.title,
            chapters: section.chapters.map((chapter) => {
              return {
                ...chapter,
                content: chapter.content.length,
              }
            }),
          }
        }),
      },
      null,
      2
    )
  )
}
