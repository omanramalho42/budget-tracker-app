/** @type {import('next').NextConfig} */
const nextConfig = {
   experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
    // 🔥 ISSO AQUI resolve o erro de 10MB
    api: {
      bodyParser: {
        sizeLimit: "20mb",
      },
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
}, typescript: {
    ignoreBuildErrors: true
  }
};

export default nextConfig;
