import React, { FC } from 'react'
import { SyncProgress } from '@ironkinoko/linovelib-scan'

const Progress: FC<{ progress?: SyncProgress }> = ({ progress }) => {
  if (!progress || progress.status === 'done') return null

  return (
    <div className="absolute inset-0">
      {progress.status === 'chapter' && (
        <div className="absolute inset-0 progress-chapter from-sky-400 to-sky-100 opacity-10 dark:from-slate-800 dark:to-slate-600"></div>
      )}
      {progress.status === 'asset' && (
        <div
          className="absolute inset-0 bg-sky-400/10 w-3/5 transition-all"
          style={{ width: (progress.assets / progress.totalAssets) * 100 + '%' }}
        />
      )}
    </div>
  )
}

export default Progress
