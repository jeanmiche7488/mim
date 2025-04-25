/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  basePath: '',
  allowedDevOrigins: ['mim.localhost:3000'],
  async rewrites() {
    return [
      {
        source: '/api/auth/:path*',
        destination: '/api/auth/:path*',
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Forwarded-Proto',
            value: 'https'
          },
          {
            key: 'X-Forwarded-Host',
            value: 'mim.localhost:3000'
          }
        ]
      }
    ]
  },
  env: {
    AUTH0_BASE_URL: 'https://mim.localhost:3000',
    AUTH0_ISSUER_BASE_URL: 'https://dev-zslagj0xnxsibjy8.us.auth0.com',
    AUTH0_CLIENT_ID: 'Fg1H07Td1O3HHum2nCsYvh1DR01ai9b3',
    AUTH0_CLIENT_SECRET: 'EIaWSPAZaVcxSp5ihidV4zb6C9t6F-SegL5emRwhE2SblqAPmnjvF0UdIeeNWxGg',
    AUTH0_REDIRECT_URI: 'https://mim.localhost:3000/api/auth/callback'
  }
}

// Configuration pour HTTPS en développement
if (process.env.NODE_ENV === 'development') {
  nextConfig.webpack = (config, { isServer }) => {
    if (isServer) {
      config.devServer = {
        https: {
          key: './certificates/localhost-key.pem',
          cert: './certificates/localhost.pem'
        }
      }
    }
    return config
  }
}

module.exports = nextConfig 