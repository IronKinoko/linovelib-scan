import path from 'path'
import { fileURLToPath } from 'url'
import { Section } from '../types.js'

function resolve(...args: string[]) {
  return path.resolve(process.cwd(), ...args)
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const paths = {
  cache: resolve('.cache'),
  assets: resolve('.cache', 'assets'),
  epubs: resolve('.cache', 'epubs'),
  templates: path.resolve(__dirname, '..', 'epub', 'templates'),
}
