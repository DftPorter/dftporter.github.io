# Spa Care — notes for Claude Code

Single-file PWA for tracking hot tub maintenance. No build step, no dependencies. Primary use: iPhone, added to Home Screen, used outdoors.

## Files
- `index.html` — all markup, CSS, and JS
- `manifest.json` — PWA manifest (theme/background `#dceef1`)
- `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`

## Run locally
`python3 -m http.server 8000` then open http://localhost:8000. Deployed via GitHub Pages (static, repo root).

## Data
- `localStorage['spa-care:last-done:v1']` = `{ [taskKey]: "YYYY-MM-DD" }`
- Never rename the key or task `key`s without a migration — that wipes the user's history.
- Missing entries are seeded from `defaultDaysAgo`.

## Tasks (edit the `TASKS` array)
| key | name | interval (days) |
|---|---|---|
| chemCheck | Check chemical balance | 3 |
| filterClean | Clean filter | 7 |
| shock | Shock treatment | 7 |
| testKit | Test Kit Analysis | 14 |
| soakFilters | Soak filters | 30 |
| waterChange | Change water | 120 |
| filterReplace | Replace filter cartridge | 120 |

Adding a task: add an entry to `TASKS` and a matching 24×24 stroke SVG path in `ICONS` (stroke-width 1.7, round caps/joins).

## Logic
- `daysAgo` = whole days between last-done and today (local midnight).
- `left = interval - daysAgo`. Status: `left < 0` overdue (red), `left === 0` "Due today" (amber), `daysAgo/interval >= 0.7` due soon (amber), else ok (teal).
- Hero = task with the highest `daysAgo/interval`. Grid = the rest, sorted by `daysLeft` ascending.
- Every date change (Done, date picker) shows a 6s toast with Undo (one level).

## Layout
- Column max-width 430px, 16px side padding, safe-area insets respected.
- Header (wordmark + date) → gradient hero card (title, last-done meta, big day counter, "Mark done today" + calendar button) → "Everything else" 2-column tile grid → storage note.
- Tile: status-tinted icon + calendar button, name, status line, full-width Done button.
- Font: Plus Jakarta Sans (Google Fonts) 400/500/600/800. Colors defined in `:root` as oklch.
- Minimum tap target 44px (hero buttons 56px).

## iOS gotchas (already fixed — don't regress)
- Date inputs must be **≥16px font-size** or iOS zooms on focus and the page scrolls sideways. `html, body` also have `overflow-x: hidden`.
- iOS fires `change` on a date input when the picker opens and on every wheel spin. Re-rendering then destroys the input and the picker vanishes. Dates are committed on `blur` only (or `change` when the input isn't focused, for desktop), and the input is pre-filled with the current value.

## Not done yet
- No service worker / offline caching.
- No data export/backup.
