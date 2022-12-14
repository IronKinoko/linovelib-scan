import { queryCatalog } from './apis/api.js'
import { paths } from './constants/paths.js'
import { genEpub } from './epub/builder.js'
import { BuilderOptions } from './types.js'

export { genEpub, queryCatalog, paths }
export * from './types.js'
export async function downLoadEpub(
  bookId: string,
  options: {
    sectionNames?: string[]
  } & BuilderOptions = {}
) {
  const catalog = await queryCatalog(bookId)

  if (options.sectionNames && options.sectionNames.length > 0) {
    catalog.sections = catalog.sections.filter((section) =>
      options.sectionNames!.includes(section.sectionName)
    )
  }

  await Promise.all(catalog.sections.map((section) => genEpub(section, options)))

  return catalog
}
