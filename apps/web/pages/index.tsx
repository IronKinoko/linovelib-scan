import Search from 'components/Search'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import Catalog from 'components/Catalog'
const Home: NextPage = () => {
  const router = useRouter()

  const bookId = router.query.bookId as string
  return (
    <div>
      <Search />

      <Catalog bookId={bookId} />
    </div>
  )
}

export default Home
