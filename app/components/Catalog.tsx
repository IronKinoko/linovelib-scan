import React, { FC } from 'react'
import useSWR from 'swr'
import type { queryCatalog } from '@ironkinoko/linovelib-scan'
import Section from './Section'
type CatalogRes = {
  code: number
  message?: string
  catalog: Awaited<ReturnType<typeof queryCatalog>>
}

const Catalog: FC<{ bookId: string }> = ({ bookId }) => {
  const { data, isValidating } = useSWR<CatalogRes>(bookId ? `/api/catalog/${bookId}` : null)

  if (!data || !bookId || data.code !== 0) {
    return (
      <div className="border border-x-0 p-4">
        {isValidating ? '加载中...' : data?.message || '输入bookId，回车搜索'}
      </div>
    )
  }

  const catalog = data.catalog
  return (
    <div>
      <div className="p-4 pt-0">
        <a
          href={`https://www.linovelib.com/novel/${catalog.id}.html`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {catalog.title}
        </a>

        <span className="hidden sm:inline-block sm:mx-2">|</span>

        <a
          className="block mt-1 sm:mt-0 sm:inline-block text-sm sm:text-base"
          href={`https://www.linovelib.com/authorarticle/${catalog.author}.html`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {catalog.author}
        </a>
      </div>
      {catalog.sections.map((section) => (
        <Section key={section.id} bookId={bookId} section={section} />
      ))}
    </div>
  )
}

export default Catalog
