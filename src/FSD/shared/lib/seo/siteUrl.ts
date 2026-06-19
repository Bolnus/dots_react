const LOCAL_DEV_SITE_URL = "http://localhost";

/** Resolves the canonical site origin from SITE_URL, with a localhost fallback for local builds. */
export function getSiteUrl(): string {
  const configured = process.env.SITE_URL?.replace(/\/$/, "");
  return configured ?? LOCAL_DEV_SITE_URL;
}

/** True when SITE_URL is unset and the localhost fallback is in use. */
export function isLocalSiteUrl(): boolean {
  return !process.env.SITE_URL;
}
