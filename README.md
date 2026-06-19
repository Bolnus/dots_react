# dots_react

Next.js frontend for Dots Arcade.

## Environment

| Variable | Description |
|----------|-------------|
| `SITE_URL` | Canonical production origin (no trailing slash). Used for sitemap, canonical links, and Open Graph URLs. Falls back to `http://localhost` when unset. |
| `DEV_HOSTNAMES` | Comma-separated hostnames for local dev image/config allowlists. |

Copy `.env.example` to `.env` and adjust values for your environment.

## Build

```bash
npm run build
```

The `postbuild` step runs `next-sitemap` and writes `public/sitemap.xml` and `public/robots.txt`. Only the home page and the Dots game page (both locales) are included in the sitemap.
