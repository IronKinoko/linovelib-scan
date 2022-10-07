
export interface Section {
  title: string;
  chapters: Chapter[];
}
export interface Chapter {
  title: string;
  id: string;
}
export interface ChapterWithCotnent extends Chapter {
  content: string;
  prevChapter: string;
  nextChapter: string;
}

export interface SectionWithContent {
  title: string;
  chapters: ChapterWithCotnent[];
}