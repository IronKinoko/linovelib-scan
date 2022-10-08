#!/usr/bin/env esno

import { downLoadEpub } from '.'

const bookId = process.argv[2]
if (!bookId) throw new Error('请输入 bookId')

downLoadEpub(bookId).then(() => {
  console.log('下载完成')
})
