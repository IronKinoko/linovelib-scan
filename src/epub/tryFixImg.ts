export const imgRE = /src="https:\/\/img\.linovelib\.com\/\d+\/\d+\/\d+\/\d+\.[a-z]+?"/

function fixByStepChar(content: string, imgHTML: string) {
  const correctCharArr = [
    '<img src="https://img.linovelib.com/'.split(''),
    /\d/,
    '/',
    /\d/,
    '/',
    /\d/,
    '/',
    /\d/,
    '.',
    /[a-z]/,
    '">'.split(''),
  ].flat()

  let start = content.indexOf(imgHTML)
  let result = '',
    end = start,
    correctIdx = 0
  for (let stack = ''; end < content.length && correctIdx < correctCharArr.length; end++) {
    const char = content.charAt(end)
    const target = correctCharArr[correctIdx]
    if (typeof target === 'string') {
      if (target === char) {
        result += char
        correctIdx++
      }
    } else {
      if (target.test(char)) {
        stack += char
      } else if (content.charAt(end) === correctCharArr[correctIdx + 1]) {
        result += stack
        stack = ''
        correctIdx++
        end--
      }
    }
  }

  return {
    success: correctIdx === correctCharArr.length && imgRE.test(result),
    content: content.replace(content.slice(start, end), result),
  }
}

function fixByMatchId(content: string, imgHTML: string) {
  const endRe = /\d+.jpg/

  let startIdx = content.indexOf(imgHTML)
  let endMatch = content.slice(startIdx).match(endRe)

  if (!endMatch) return { success: false, content: '' }

  let endWrod = endMatch[0]
  let endIdx = startIdx + endMatch.index! + endWrod.length + 1

  const ret = content.slice(startIdx, endIdx).match(/\d+(.jpg)?/g)

  let success = false
  let result = ''

  if (ret && ret.length === 4) {
    success = true
    result = `<img src="https://img.linovelib.com/${ret.join('/')}">`
    content = content.replace(imgHTML, result)
  }

  return { success, content }
}

export function tryFixImg(content: string) {
  const res = content.match(/<img(.*?)>/g)
  if (res) {
    for (const imgHTML of res) {
      if (imgRE.test(imgHTML)) continue

      for (const fixer of [fixByStepChar, fixByMatchId]) {
        const ret = fixer(content, imgHTML)
        if (ret.success) {
          content = ret.content
          break
        }
      }
    }
  }

  return content
}
