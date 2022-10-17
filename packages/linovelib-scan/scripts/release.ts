import fs from 'fs-extra'
import path from 'path'
import cp from 'child_process'

function exec(cmd: string, opts?: cp.ExecSyncOptions) {
  console.log(`> ${cmd}`)
  return cp.execSync(cmd, { stdio: 'inherit', ...opts, encoding: 'utf-8' })
}

const resolve = (...paths: string[]) => path.resolve(process.cwd(), ...paths)
const paths = {
  dist: resolve('dist'),
  package: resolve('package.json'),
  readme: resolve('README.md'),
  tmpDir: resolve('tmp'),
  tmp: {
    dist: resolve('tmp', 'dist'),
    package: resolve('tmp', 'package.json'),
    readme: resolve('tmp', 'README.md'),
  },
}

fs.removeSync(paths.dist)
fs.removeSync(paths.tmpDir)

exec('pnpm build')

fs.moveSync(paths.dist, paths.tmp.dist)
fs.copySync(paths.readme, paths.tmp.readme)

const pkg = fs.readJsonSync(paths.package)

const releasePkg = Object.assign({}, pkg, {
  main: './dist/index.js',
  module: './dist/index.js',
  types: './dist/index.js',
  bin: {
    'linovelib-scan': './dist/cli.js',
  },
})

fs.writeJsonSync(paths.tmp.package, releasePkg, { spaces: 2 })
exec('npm publish', { cwd: paths.tmpDir })

fs.removeSync(paths.dist)
fs.removeSync(paths.tmpDir)