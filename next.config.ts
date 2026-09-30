import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.gobox.my.id",
        pathname: "/file/**",
      },
    ],
  },
  poweredByHeader: false,
};

export default nextConfig;
