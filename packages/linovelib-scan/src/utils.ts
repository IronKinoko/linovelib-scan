import crypto from 'crypto'

export function md5(data: string) {
  return crypto.createHash('md5').update(data).digest('hex')
}

export function isURL(input: string) {
  return /^(((ht|f)tps?):\/\/)?([^!@#$%^&*?.\s-]([^!@#$%^&*?.\s]{0,63}[^!@#$%^&*?.\s])?\.)+[a-z]{2,6}\/?/.test(
    input
  )
}
