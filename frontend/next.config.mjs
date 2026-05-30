/** @type {import('next').NextConfig} */
const nextConfig = {
  // Strict mode for catching bugs early
  reactStrictMode: true,

  // Skip ESLint during CI builds (we already pass locally)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // TypeScript errors will still fail the build
  typescript: {
    ignoreBuildErrors: false,
  },

  // Allow plain <img> tags (we use them intentionally for the globe)
  images: {
    unoptimized: true,
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
