const withTM = require('next-transpile-modules')(['@ironkinoko/linovelib-scan'])

const isDev = process.env.NODE_ENV === 'development'
const basePath = isDev ? undefined : process.env.basePath

const nextConfig = withTM({
  reactStrictMode: true,
  swcMinify: true,
  basePath: basePath,
  env: { basePath: basePath || '' },
  assetPrefix: basePath,
  webpack(config, ctx) {
    if (ctx.isServer) {
      config.resolve.extensionAlias ||= {}
      Object.assign(config.resolve.extensionAlias, {
        '.js': ['.js', '.ts'],
      })
    }

    return config
  },
})

module.exports = nextConfig
