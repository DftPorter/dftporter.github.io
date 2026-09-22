# halfway — deploy

Static site. No build step.

## GitHub Pages

1. Push the contents of this folder to a repo (root, or a `docs/` folder).
2. Settings → Pages → Source: *Deploy from a branch*, pick the branch and folder.
3. Open the https URL. On iPhone: Share → Add to Home Screen. On Android: Chrome menu → Install app.

## Files

- `index.html` — the whole app, self-contained (fonts and Leaflet are fetched from CDNs on first load)
- `manifest.webmanifest` — install metadata, standalone display
- `sw.js` — caches the shell; never caches map tiles or routing responses
- `icons/` — 192 / 512 / 180px app icons
- `.nojekyll` — stops GitHub Pages rewriting paths

## Notes

- Install and geolocation both require https. GitHub Pages serves https, so both work.
- Live data comes from free public services: Nominatim (geocoding and places) and OSRM (drive times). Both rate-limit at about one request a second and ask for a contact in the User-Agent for heavy use. Fine for personal traffic; swap in keyed providers if it gets popular.
- Drive times are free-flow, with no traffic.
- The page is fetched network-first, so a new deploy lands on the next visit; icons and assets are cache-first.
- `index.html` carries a `hw-deployed` meta stamp — that is what switches the service worker on. Re-bundling from the project re-adds it.
