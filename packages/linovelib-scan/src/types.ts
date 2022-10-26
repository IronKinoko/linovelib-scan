export interface Catalog {
  id: string
  cover: string
  title: string
  author: string
  sections: Section[]
}

export interface Section {
  id: string
  hash: string
  title: string
  sectionName: string
  author: string
  chapters: Chapter[]
  defaultCover: string
}
export interface Chapter {
  title: string
  id: string
}
export interface ChapterWithCotnent extends Chapter {
  fileName: string
  order: number
  content: string
  prevChapter: string
  nextChapter: string
}

export interface Book {
  id: string
  title: string
  author: string
  chapters: ChapterWithCotnent[]
  imageAssets: {
    name: string
    type: string | false
  }[]
  cover?: string
}

export interface SyncProgressEvent {
  total: number
  loaded: number
  progress: number
}
export interface SyncProgress {
  status: 'chapter' | 'asset' | 'done'
  id?: string
  chapter: SyncProgressEvent
  asset: SyncProgressEvent
}
export interface BuilderOptions {
  onSync?: (progress: SyncProgress) => void
}
