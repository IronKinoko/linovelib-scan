import { useLocalBooks } from 'hooks/useLocalBooks'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'

const Search = () => {
  const router = useRouter()

  const [books] = useLocalBooks()

  const [isFocus, setIsFocus] = useState(false)

  useEffect(() => {
    if (document.body.clientWidth > 768) return
    
    if (isFocus) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isFocus])

  return (
    <div className="p-4">
      <form
        className="md:w-64 relative flex items-center"
        action="#"
        onSubmit={(e) => e.preventDefault()}
      >
        <input
          className="block w-full text-sm px-3 py-2 bg-gray-800 bg-opacity-5 leading-tight rounded-lg appearance-none focus:outline-none focus:ring-1 focus:ring-gray-200 focus:dark:ring-slate-600 focus:bg-white focus:dark:bg-black hover:bg-opacity-10 transition-colors dark:bg-slate-800 dark:hover:bg-slate-700"
          placeholder="输入 bookId 搜索"
          type="search"
          key={router.query.bookId as string}
          defaultValue={router.query.bookId}
          enterKeyHint="search"
          onFocus={() => setIsFocus(true)}
          onBlur={() => setTimeout(() => setIsFocus(false), 100)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const bookId = e.currentTarget.value
              if (/^\d+$/.test(bookId)) router.replace({ query: { bookId } })
              else {
                e.currentTarget.value = ''
                router.replace({ query: null })
              }
              e.currentTarget.blur()
            }
          }}
        />
        <div className="hidden sm:flex absolute inset-y-0 right-0 py-1.5 pr-1.5 select-none pointer-events-none">
          <kbd className="inline-flex items-center px-1.5 font-mono text-sm font-medium bg-white dark:bg-slate-800 dark:bg-opacity-50 text-gray-400 dark:text-gray-500 dark:border-gray-100/20 border rounded">
            Enter
          </kbd>
        </div>
      </form>

      {isFocus && (
        <div className="overflow-auto z-10 fixed inset-0 top-14 bottom-0 md:absolute md:shadow-2xl md:dark:shadow-black md:inset-auto md:top-14 md:rounded-xl md:overflow-hidden md:w-64 bg-gray-100 dark:bg-slate-900 md:dark:bg-black text-slate-900 dark:text-slate-200">
          {books.map((book) => (
            <div
              key={book.id}
              className="border-b relative -bottom-[1px] px-4 py-4 cursor-pointer hover:text-sky-500"
              onClick={() => {
                router.replace({ query: { bookId: book.id } })
              }}
            >
              {book.name}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Search
