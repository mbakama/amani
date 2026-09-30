const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  fallbacks: {
    document: '/offline',
  },
  workboxOptions: {
    disableDevLogs: true,
    importScripts: ['/sw-push.js'],
  },
  extendDefaultRuntimeCaching: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = withPWA(nextConfig);
