import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/FSD/shared/lib/i18n/request.ts");

const REMOTE_IMAGE_PATHNAME = "/**";

const DEV_HOST_MIKE_PC = "mike-pc.local";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3001",
        pathname: REMOTE_IMAGE_PATHNAME
      },
      {
        protocol: "http",
        hostname: DEV_HOST_MIKE_PC,
        port: "3001",
        pathname: REMOTE_IMAGE_PATHNAME
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "",
        pathname: REMOTE_IMAGE_PATHNAME
      },
      {
        protocol: "http",
        hostname: DEV_HOST_MIKE_PC,
        port: "",
        pathname: REMOTE_IMAGE_PATHNAME
      },
      {
        hostname: "recipes-rho-ten.vercel.app",
        port: "",
        pathname: REMOTE_IMAGE_PATHNAME
      },
      {
        protocol: "https",
        hostname: "gallery-backend-teal.vercel.app",
        pathname: REMOTE_IMAGE_PATHNAME
      }
    ],
    qualities: [50, 100],
    dangerouslyAllowLocalIP: true
  },
  allowedDevOrigins: [DEV_HOST_MIKE_PC, "mike-laptop.local"],
  staticPageGenerationTimeout: 120,
  rewrites() {
    const apiOrigin = process.env.DOTS_API_ORIGIN ?? "http://127.0.0.1:3030";
    return [
      {
        source: "/dots/:path*",
        destination: `${apiOrigin}/dots/:path*`
      }
    ];
  }
};

export default withNextIntl(nextConfig);
