import React, { FC } from 'react'
import { SyncProgress } from '@ironkinoko/linovelib-scan'

const Progress: FC<{ progress?: SyncProgress }> = ({ progress }) => {
  if (!progress) return null

  const { asset, chapter } = progress

  const width = ((chapter.progress + asset.progress) * 100) / 2 + '%'

  return (
    <div className="absolute inset-0 opacity-10">
      <div
        className="absolute inset-0 bg-sky-400 w-0 transition-all ease-linear"
        style={{ width }}
      />
    </div>
  )
}

export default Progress
