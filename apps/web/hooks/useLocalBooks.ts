import { useCallback, useEffect, useState } from 'react'
import useSWR from 'swr'

export type LocalBook = { name: string; id: string }

const LOCALKEY = 'search-book'

export function useLocalBooks() {
  const { data: books = [], mutate } = useSWR<LocalBook[]>(LOCALKEY, () =>
    JSON.parse(window.localStorage.getItem(LOCALKEY) || '[]')
  )

  useEffect(() => {
    const listen = (e: StorageEvent) => {
      if (e.key === LOCALKEY) mutate()
    }
    window.addEventListener('storage', listen)
    return () => {
      window.removeEventListener('storage', listen)
    }
  }, [])

  const putBook = useCallback(
    (book: LocalBook) => {
      const nextBooks = books.filter((o) => o.id !== book.id)
      nextBooks.unshift(book)
      window.localStorage.setItem(LOCALKEY, JSON.stringify(nextBooks.slice(0, 10)))
      mutate()
    },
    [books]
  )

  return [books, putBook] as const
}
