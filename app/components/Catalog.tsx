import React, { FC } from 'react'
import useSWR from 'swr'
import type { Catalog as ICatalog } from '@ironkinoko/linovelib-scan'
import Section from './Section'
import axios from 'axios'
type CatalogRes = {
  code: number
  message?: string
  catalog: ICatalog
}

const Catalog: FC<{ bookId: string }> = ({ bookId }) => {
  const { data, isValidating, mutate } = useSWR<CatalogRes>(
    bookId ? `/api/catalog/${bookId}` : null
  )

  if (!data || !bookId || data.code !== 0) {
    return (
      <div className="border border-x-0 p-4">
        {isValidating ? '加载中...' : data?.message || '输入bookId，回车搜索'}
      </div>
    )
  }

  const sync = async () => {
    await axios.delete(`/api/catalog/${bookId}`)
    mutate()
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

        <span className="block sm:inline-block mt-1 sm:mt-0">
          <span className="hidden sm:inline-block sm:mx-2">|</span>
        </span>

        <a
          className="text-sm sm:text-base"
          href={`https://www.linovelib.com/authorarticle/${catalog.author}.html`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {catalog.author}
        </a>

        <button className="btn float-right" onClick={sync}>
          同步
        </button>
      </div>
      {catalog.sections.map((section) => (
        <Section key={section.id} bookId={bookId} section={section} />
      ))}
    </div>
  )
}

export default Catalog
