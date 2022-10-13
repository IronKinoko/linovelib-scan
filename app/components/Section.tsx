import React, { FC, useState } from 'react'
import type { Section as ISection } from '@ironkinoko/linovelib-scan'
import axios from 'axios'
import { saveAs } from 'file-saver'

type SyncResult = { code: number; message: string; done: boolean }

const Section: FC<{ bookId: string; section: ISection }> = ({ bookId, section }) => {
  const [open, setOpen] = useState(false)

  const handleSwitch = () => setOpen(!open)

  const key = `${bookId}/${section.id}`
  const [loading, setLoading] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSync = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (loading) return
    ;(async function fn() {
      setLoading(true)
      const res: SyncResult = await axios.get(`/api/catalog/${key}/sync`).then((res) => res.data)
      if (res.code !== 0) {
        setErrorMessage(res.message)
        setLoading(false)
      } else {
        if (res.done) {
          setLoading(false)
          const res = await axios.get(`/api/catalog/${key}/download`, { responseType: 'blob' })
          const fileName = decodeURIComponent(res.headers['content-disposition']?.split('=').pop()!)
          const blob = new Blob([res.data], { type: 'application/epub+zip' })
          saveAs(blob, fileName)
        } else {
          setTimeout(fn, 500)
        }
      }
    })()
  }

  return (
    <section className="relative">
      <div
        className="border-b px-4 py-4 sticky -top-1 bg-gray-100 dark:bg-slate-900 cursor-pointer "
        onClick={handleSwitch}
      >
        <div className="flex justify-between items-center">
          <div className="text-slate-900 dark:text-slate-200">{section.sectionName}</div>
          <div className="shrink-0 ml-4 flex items-center space-x-2">
            <button className="btn disabled:opacity-50" disabled={loading} onClick={handleSync}>
              {loading ? '下载中...' : '下载'}
            </button>
          </div>
        </div>
        {errorMessage && <div className="mt-2 text-sm text-red-500">{errorMessage}</div>}
      </div>
      <div className="text-sm bg-slate-50 dark:bg-slate-800" hidden={!open}>
        {section.chapters.map((chapter, idx) => (
          <div key={idx} className="border-b px-4 py-3 ">
            {chapter.title}
          </div>
        ))}
      </div>
    </section>
  )
}

export default Section
