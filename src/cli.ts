#!/usr/bin/env node

import { downLoadEpub } from './index.js'

const bookId = process.argv[2]
const sectionNames = process.argv[3] ? process.argv[3].split(',') : []

if (!bookId) throw new Error('请输入 bookId')

downLoadEpub(bookId, { sectionNames }).then(() => {
  console.log('下载完成')
})
