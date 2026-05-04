import type { ReactNode } from "react";

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

/** Pass-through root layout; document shell is under `[locale]`. */
export default function RootLayout({ children }: RootLayoutProps): ReactNode {
  return children;
}
