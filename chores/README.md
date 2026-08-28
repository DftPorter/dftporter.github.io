# Chore Quest

Static site. No build step. Upload the contents of this folder to your repo (root, or a
subfolder like `/chores/`) and enable GitHub Pages.

## Files

| File | What it is |
| --- | --- |
| `index.html` | The whole app — markup, styles, and logic in one file |
| `manifest.json` | Home-screen install metadata |
| `sw.js` | Service worker; caches the app shell so it opens offline |
| `icon.svg`, `icon-180.png`, `icon-192.png`, `icon-512.png` | App icons |
| `money-*.png` | Six cut-out money illustrations for the balance card |

## Setup

1. Copy these files into your repo and push.
2. Settings → Pages → deploy from branch, `main`, `/ (root)`.
3. Open the URL on the kids' phones → Share → Add to Home Screen.

Everything is relative-path, so a subfolder (`yoursite.github.io/chores/`) works with no changes.

## The Google Sheet

The app reads your sheet as CSV. The sheet must be shared as **Anyone with the link → Viewer**
or the fetch is blocked by the browser.

The sheet id lives at the top of `index.html`:

```js
var SHEET_ID = '1dAmlZqyuLw1SSuRTHwXO0fXBnTWLvB-Hb79ImoAtXLg';
```

Column layout expected (unchanged from the original app):

- A — week start date, `MM/DD/YY`, on the first row of each week block
- C — player name (`Simon` / `Desmond`)
- D–J — Sun through Sat; any positive amount counts as done, `N/A` means excused
- K — trash and recycling; same rules
- L — that week's pay
- N — Simon's owed snapshot · O–Q — Simon's extra: amount, note, date
- S — Desmond's owed snapshot · T–V — Desmond's extra: amount, note, date

Rates for the last-week report are also at the top of `index.html`:

```js
var BED_RATE = 1, TRASH_RATE = 2;
```

## The picture on the balance card

Pick one of the six `money-*.png` files at the top of `index.html`:

```js
var MONEY_ART = 'money-cash-pile.png';
```

Options: `money-cash-pile`, `money-cash-fan`, `money-coins-cash`, `money-coins`,
`money-cash-stack`, `money-coins-pile`. Set it to `''` to go back to the emoji. The image
is anchored to the bottom-right of the card and cropped by it, so the text stays clear.
When someone owes money the card turns pink and shows the emoji instead.

## How the balance is calculated

It isn't. The owed cell in the sheet (column N for Simon, S for Desmond) is the source of
truth — the app shows the last one filled in, verbatim. Weekly pay and extras are already
folded into that cell, so adding them again would double-count. To change a balance, change
the sheet.

## Offline

The last good sheet fetch is saved to the device (`localStorage`), so the app opens instantly
with the previous numbers and the header says how old they are. It re-fetches on open and
whenever the app is brought back to the foreground after two minutes.

## After you edit index.html

Bump the cache name in `sw.js` so phones pick up the new version:

```js
var CACHE_V = 'chore-quest-v2';
```
