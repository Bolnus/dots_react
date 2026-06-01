import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/FSD/shared/lib/i18n/request.ts");

const DEV_HOSTNAMES = process.env.DEV_HOSTNAMES?.split(",") || [];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: DEV_HOSTNAMES.map((devHost) => ({
      protocol: "http",
      hostname: "localhost",
      port: "*",
      pathname: devHost
    })),
    qualities: [50, 100],
    dangerouslyAllowLocalIP: true
  },
  allowedDevOrigins: DEV_HOSTNAMES,
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
