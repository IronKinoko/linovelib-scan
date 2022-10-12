import { downLoadEpub } from '../src/index.js'
import fs from 'fs-extra'
import path from 'path'

it('should gen epub and use cache', async () => {
  // await fs.remove(path.resolve(process.cwd(), '.cache'))

  {
    const catalog = await downLoadEpub('2923', ['第三卷'])

    const epubsExists = await Promise.all(
      catalog.sections.map((section) => {
        const epubFilePath = path.resolve(process.cwd(), 'epubs', section.title + '.epub')
        return fs.pathExists(epubFilePath)
      })
    )
    expect(epubsExists.every((b) => b)).toBeTruthy()
  }

  await fs.remove(path.resolve(process.cwd(), 'epubs'))

  {
    const startTime = Date.now()

    const catalog = await downLoadEpub('2923', ['第三卷'])

    const epubsExists = await Promise.all(
      catalog.sections.map((section) => {
        const epubFilePath = path.resolve(process.cwd(), 'epubs', section.title + '.epub')
        return fs.pathExists(epubFilePath)
      })
    )
    expect(epubsExists.every((b) => b)).toBeTruthy()
    expect(Date.now() - startTime < 3000).toBeTruthy()
  }
})
