import type { ReactNode } from "react";
import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import Script from "next/script";

import "@/FSD/app/styles/globals.css";
import { getSiteUrl } from "@/FSD/shared/lib/seo";

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl())
};

/** Document shell required by Next.js; locale-specific UI lives under `[locale]`. */
export default async function RootLayout({ children }: RootLayoutProps): Promise<ReactNode> {
  const locale = await getLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta name="yandex-verification" content="5eb3f89f1f47f98d" />
        <meta name="google-site-verification" content="4NwmTDdTYLuwiPV81bYu44vFv6GjMzgT3ASLwyQ7Sf4" />
        <Script id="theme-init" src="/theme-init.js" strategy="beforeInteractive" />
      </head>
      <body>{children}</body>
    </html>
  );
}
