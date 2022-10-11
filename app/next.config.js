const isDev = process.env.NODE_ENV === 'development'

const basePath = isDev ? undefined : process.env.basePath

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  basePath: basePath,
  env: { basePath },
}

module.exports = nextConfig
