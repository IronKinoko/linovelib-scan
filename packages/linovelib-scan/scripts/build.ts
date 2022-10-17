import fs from 'fs-extra'
import path from 'path'
import cp from 'child_process'

function exec(cmd: string) {
  console.log(`> ${cmd}`)
  return cp.execSync(cmd, { stdio: 'inherit', encoding: 'utf-8' })
}

fs.removeSync('dist')
exec('tsc')
fs.copySync(
  path.resolve(process.cwd(), 'src', 'epub', 'templates'),
  path.resolve(process.cwd(), 'dist', 'epub', 'templates')
)
