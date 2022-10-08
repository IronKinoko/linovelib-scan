export interface Section {
  id: string
  title: string
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

export interface SectionWithContent extends Section {
  chapters: ChapterWithCotnent[]
}

export interface Book {
  id: string
  title: string
  author: string
  section: SectionWithContent
}
