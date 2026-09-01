# The Score

A single-page Philadelphia sports dashboard: live scores, last results, next games, and a news wire for the Phillies, Eagles, Union, 76ers, and Flyers.

## Running it

Static files — no build step, no dependencies. Serve the folder over HTTP:

    cd the-score
    python3 -m http.server 8000

Then open http://localhost:8000. Opening `index.html` via `file://` will fail because the API requests are cross-origin.

## Data

- Scores, schedules, and records come from ESPN's public `site.api.espn.com` endpoints. They are undocumented and unversioned; they can change or rate-limit without notice.
- Headlines come from team RSS feeds routed through a public RSS-to-JSON proxy.
- Schedules are cached in `sessionStorage`; opponent logos and the last rendered payload in `localStorage`, so a cold open paints immediately while fresh data loads.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Markup and all styles |
| `scores.js` | Fetching, parsing, rendering, refresh loop |
| `manifest.json` | PWA manifest (installable, standalone, dark) |
| `icon.png`, `icon-192.png`, `icon-512.png` | App icons |

## Refresh

The page auto-refreshes on an interval that tightens when a game is live and relaxes when nothing is on. If a refresh fails, the header shows the time of the last good update marked stale rather than pretending the data is current.
