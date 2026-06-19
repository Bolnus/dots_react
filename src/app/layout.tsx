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
        <Script id="theme-init" src="/theme-init.js" strategy="beforeInteractive" />
      </head>
      <body>{children}</body>
    </html>
  );
}
