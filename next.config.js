/** @type {import('next').NextConfig} */
const dotenvExpand = require("dotenv-expand");
const { withLogtail } = require('@logtail/next');

dotenvExpand.expand({ parsed: { ...process.env } });

const nextConfig = {
  experimental: { 
    instrumentationHook: true 
  },
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'lookaside.fbsbx.com',
          port: '',
          pathname: '/ig_messaging_cdn/**',
        },
      ],
    },
  }

module.exports = withLogtail(nextConfig);