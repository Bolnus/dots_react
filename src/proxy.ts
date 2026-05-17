import createMiddleware from "next-intl/middleware";

import { routing } from "@/FSD/shared/lib/i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Keep `/dots/*` out of locale routing so `next.config` rewrites can reach the game API.
  matcher: ["/((?!api|_next|_vercel|dots|.*\\..*).*)"]
};
