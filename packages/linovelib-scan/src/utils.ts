import crypto from 'crypto'

export function md5(data: string) {
  return crypto.createHash('md5').update(data).digest('hex')
}

export function isURL(input: string) {
  return /^(((ht|f)tps?):\/\/)?([^!@#$%^&*?.\s-]([^!@#$%^&*?.\s]{0,63}[^!@#$%^&*?.\s])?\.)+[a-z]{2,6}\/?/.test(
    input
  )
}

const CHNumberArr = (() => {
  const arr = ['', ...'一二三四五六七八九'.split('')]

  let ret = []
  for (let i = 0; i < arr.length; i++) {
    let x = arr[i]
    if (i === 1) x = '十'
    else if (i > 1) x += '十'

    for (let j = 0; j < arr.length; j++) {
      const y = arr[j]

      ret.push(x + y)
    }
  }

  return ret
})()

export function sectionNameToNumber(sectionName: string) {
  return sectionName.replace(/第(.*?)卷/, (str, no) => {
    const parsedNo = parseFloat(no)
    if (!isNaN(parsedNo)) return no

    const idx = CHNumberArr.indexOf(no)

    if (idx === -1) return str

    return idx
  })
}
