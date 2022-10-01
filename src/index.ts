import { queryCatalog } from './apis/api'

main('2923') // 有谁规定了现实中不能有恋爱喜剧的？
async function main(id: string) {
  const catalog = await queryCatalog(id)
}
