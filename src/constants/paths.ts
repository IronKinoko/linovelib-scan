import path from 'path'
import { fileURLToPath } from 'url'

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
