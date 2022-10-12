const path = require('path')

const isDev = process.env.NODE_ENV === 'development'
const basePath = isDev ? undefined : process.env.basePath

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  basePath: basePath,
  env: { basePath: basePath || '' },
  assetPrefix: basePath,
  webpack(config, ctx) {
    if (ctx.isServer) {
      const rule = config.module.rules.find((rule) => !!rule.oneOf)
      const apiRule = rule.oneOf.find((rule) => rule.issuerLayer === 'api')
      apiRule.include.push(path.resolve(__dirname, '..', 'src'))
      config.resolve.extensionAlias ||= {}
      Object.assign(config.resolve.extensionAlias, {
        '.js': ['.js', '.ts'],
      })
    }

    return config
  },
}

module.exports = nextConfig
