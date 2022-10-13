import React, { FC } from 'react'
import { SyncProgress } from '@ironkinoko/linovelib-scan'

export interface FetchProgress extends SyncProgress {
  downloadProgress?: number
}

const Progress: FC<{ progress?: FetchProgress }> = ({ progress }) => {
  if (!progress) return null

  const { status, assets, totalAssets, downloadProgress = 0 } = progress
  return (
    <div className="absolute inset-0">
      {status === 'chapter' && (
        <div className="absolute inset-0 progress-chapter from-sky-400 to-sky-100 opacity-10 dark:from-slate-800 dark:to-slate-600"></div>
      )}
      {(status === 'asset' || status === 'done') && (
        <div
          className="absolute inset-0 bg-sky-400/10 w-0 transition-all ease-linear"
          style={{
            width: (assets / totalAssets + downloadProgress) * 50 + '%',
          }}
        />
      )}
    </div>
  )
}

export default Progress
