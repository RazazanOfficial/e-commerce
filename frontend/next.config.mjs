/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'c321151.parspack.net',
        pathname: '/c321151/**',
      },
    ],
  },
};

export default nextConfig;
