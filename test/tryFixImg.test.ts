import { tryFixImg } from '../src/apis/tryFixImg.js'
import { load } from 'cheerio'
export const imgRE = /src="https:\/\/img\.linovelib\.com\/\d+\/\d+\/\d+\/\d+\.[a-z]+?"/

it('should fix all case', () => {
  const htmls = [
    `<p><img src="https://</p><!-- <p style=" font-weight: 400;color:#721f27;">（本章未完）</p> --><div class="cgo"><script>zation();</script></div><p>img.linovelib.co m / 2 / 2 9 2 3/ 16 0156/189 530.jpg" class="imagecontent"></p>`,
    `<p><img src="<img src=" https: img.linovelib.com 2 2044 116151 189497.jpg" class="imagecontent"> </p>`,
  ]

  expect(
    htmls.map((html) => {
      const result = tryFixImg(load(html, null, false).html())
      expect(result).toMatch(imgRE)
      return result.match(imgRE)?.[0]
    })
  ).toMatchInlineSnapshot(`
[
  "src="https://img.linovelib.com/2/2923/160156/189530.jpg"",
  "src="https://img.linovelib.com/2/2044/116151/189497.jpg"",
]
`)
})
