import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Anciennes routes du template MVP — navigation supprimée (mono-praticienne)
      {
        source: "/consultants",
        destination: "/",
        permanent: true, // 301
      },
      {
        source: "/consultants/:id",
        destination: "/",
        permanent: true, // 301
      },
    ];
  },
};

export default nextConfig;
