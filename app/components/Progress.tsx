import React, { FC } from 'react'
import { SyncProgress, SyncProgressEvent } from '@ironkinoko/linovelib-scan'

export interface FetchProgress extends SyncProgress {
  download?: SyncProgressEvent
}

const Progress: FC<{ progress?: FetchProgress }> = ({ progress }) => {
  if (!progress) return null

  const { asset, chapter, download } = progress

  const width = ((chapter.progress + asset.progress + (download?.progress || 0)) * 100) / 3 + '%'

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
