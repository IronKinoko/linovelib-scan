import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import Catalog from '../components/Catalog'
const Home: NextPage = () => {
  const router = useRouter()

  const bookId = router.query.bookId as string
  return (
    <div>
      <div className="p-4">
        <div className="md:w-64 relative flex items-center">
          <input
            className="block w-full text-sm px-3 py-2 bg-gray-800 bg-opacity-5 leading-tight rounded-lg appearance-none focus:outline-none focus:ring-1 focus:ring-gray-200 focus:bg-white hover:bg-opacity-10 transition-colors"
            spellCheck="false"
            placeholder="输入 bookId 搜索"
            type="search"
            defaultValue={bookId}
            enterKeyHint="search"
            onKeyDown={(e) => {
              if (e.key === 'Enter') router.replace({ query: { bookId: e.currentTarget.value } })
            }}
          />
          <div className="hidden sm:flex absolute inset-y-0 right-0 py-1.5 pr-1.5 select-none pointer-events-none">
            <kbd className="inline-flex items-center px-1.5 font-mono text-sm font-medium bg-white dark:bg-dark dark:bg-opacity-50 text-gray-400 dark:text-gray-500 dark:border-gray-100 dark:border-opacity-20 border rounded">
              Enter
            </kbd>
          </div>
        </div>
      </div>

      <Catalog bookId={bookId} />
    </div>
  )
}

export default Home
