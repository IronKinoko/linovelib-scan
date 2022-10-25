import React, { FC, useState } from 'react'
import type { Section as ISection, SyncProgress } from '@ironkinoko/linovelib-scan'
import axios from 'axios'
import Progress from './Progress'

type SyncResult = {
  code: number
  progress: SyncProgress
  message: string
  done: boolean
  downloadURL: string
}

const Section: FC<{ bookId: string; section: ISection }> = ({ bookId, section }) => {
  const [open, setOpen] = useState(false)

  const handleSwitch = () => setOpen(!open)

  const key = `${bookId}/${section.id}`
  const [errorMessage, setErrorMessage] = useState('')

  const [progress, setProgress] = useState<SyncProgress>()

  const handleSync = (e: React.MouseEvent) => {
    e.stopPropagation()
    setErrorMessage('')
    ;(async function fn() {
      const res: SyncResult = await axios.get(`/api/catalog/${key}/sync`).then((res) => res.data)
      setProgress(res.progress)

      if (res.code !== 0) {
        setErrorMessage(res.message)
      } else {
        if (res.done) {
          window.location.href = res.downloadURL
          setTimeout(() => setProgress(undefined), 100)
        } else {
          setTimeout(fn, 300)
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
            <button className="btn disabled:opacity-50" disabled={!!progress} onClick={handleSync}>
              {!!progress ? '下载中...' : '下载'}
            </button>
          </div>
        </div>
        {errorMessage && <div className="mt-2 text-sm text-red-500">{errorMessage}</div>}
        <Progress progress={progress} />
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
