export interface Section {
  id: string
  title: string
  sectionName: string
  author: string
  chapters: Chapter[]
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
}
