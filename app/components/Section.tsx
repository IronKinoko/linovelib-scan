import React, { FC, useState } from 'react'
import type { Section as ISection } from '@ironkinoko/linovelib-scan/dist/types'
import axios from 'axios';

type SyncResult = { code: number; message: string; done: boolean }

const Section: FC<{ bookId: string; section: ISection }> = ({ bookId, section }) => {
  const [open, setOpen] = useState(false)

  const handleSwitch = () => setOpen(!open)

  const key = `${bookId}/${section.id}`
  const [loading, setLoading] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSync = () => {
    if (loading) return
    ;(async function fn() {
      setLoading(true)
      const res: SyncResult = await axios.get(`/api/sync/${key}`).then((res) => res.data)
      if (res.code !== 0) {
        setErrorMessage(res.message)
        setLoading(false)
      } else {
        if (res.done) {
          setLoading(false)
          window.open(`/api/download/${key}`)
        } else {
          setTimeout(fn, 500)
        }
      }
    })()
  }

  return (
    <section className="mb-4">
      <div className="boder-b px-4 py-2">
        <div className="flex justify-between items-center">
          <div>{section.sectionName}</div>
          <div className="flex items-center space-x-2">
            <button className="btn" onClick={handleSwitch}>
              展开
            </button>
            <button className="btn disabled:opacity-50" disabled={loading} onClick={handleSync}>
              {loading ? '下载中...' : '下载'}
            </button>
          </div>
        </div>
        {errorMessage && <div className="mt-2 text-sm text-red-500">{errorMessage}</div>}
      </div>
      <div className="bg-white text-sm" hidden={!open}>
        {section.chapters.map((chapter) => (
          <div key={chapter.id} className="border-b px-4 py-2">
            {chapter.title}
          </div>
        ))}
      </div>
    </section>
  )
}

export default Section
