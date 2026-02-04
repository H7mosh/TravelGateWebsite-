<!-- Copilot instructions for AI coding agents working on Travelgate frontend -->
# Travelgate — Copilot Instructions

Purpose
- Help AI contributors become productive quickly when editing the static frontend in this repo.

Big picture
- This is a plain static frontend (no build system). The site is served from `index.html` and uses vanilla JS files in `js/` to render content and UI.
- Main responsibilities:
  - `js/i18n.js` — loads language JSON files (`assets/data-en.json`, `assets/data-ar.json`, `assets/data-ku.json`) and updates DOM using `data-i18n` and `data-i18n-placeholder` attributes.
  - `js/hotel-reservation.js` — loads hotel data from `assets/data/hotels.json`, renders hotel cards, manages reservation modals, and integrates with backend payment endpoints via `API_BASE_URL`.
  - `js/main.js` — UI glue: smooth scrolling, header effects, contact form handling, and scroll animations.

Key entry points and examples
- Page entry: [index.html](index.html) — includes scripts in this order: `i18n.js`, `hotel-reservation.js`, `main.js`.
- Language files: `assets/data-<lang>.json` (example: [assets/data-en.json](assets/data-en.json)). Use `window.i18nData` and `window.i18n` functions when inspecting or modifying i18n behavior.
- Hotels data: [assets/data/hotels.json](assets/data/hotels.json) is loaded by `loadHotels()` in `js/hotel-reservation.js`. When modifying rendering, update `buildHotelCard()` and `renderHotels()`.
- Payment flow: `js/hotel-reservation.js` posts to `${API_BASE_URL}/payment/*` endpoints and expects a redirect URL (`formUrl`). For local testing, either mock these endpoints or change `API_BASE_URL` to a test backend.

Developer workflows (how to run & debug)
- There is no npm or build step — serve the folder with any static server. Examples:
  - `npx http-server . -p 8080`
  - `python -m http.server 8080`
  - Use VS Code Live Server extension for quick reloads.
- Open browser DevTools to inspect `window.i18nData`, `hotelsData`, and network requests. Important globals:
  - `window.i18n` — exposes `initI18n()` and `loadLanguage()`.
  - `hotelsData` — array loaded from `assets/data/hotels.json`.
- Local testing notes:
  - The payment/reservation integration requires a backend; without it the payment redirect will fail. To test UI flows without backend, stub fetch responses or set `API_BASE_URL` to a local mock server.
  - Hotels will render from `assets/data/hotels.json` when the static server serves `/assets/data/hotels.json` correctly. If hotels don't show, check console for fetch path variants used in `loadHotels()`.

Project-specific patterns & conventions
- Vanilla JS, DOM-first: changes should be implemented by updating the DOM directly (no framework). Follow existing function patterns (`render*`, `build*`, `setup*`).
- i18n pattern: use `data-i18n` or `data-i18n-placeholder` attributes in HTML and nested keys in `assets/data-<lang>.json` (dot notation e.g. `hero.title`). Use `getNestedValue()` in `js/i18n.js` if needed.
- Defensive rendering: many render functions check for missing DOM nodes and log errors; follow this style and keep console logs for troubleshooting.
- Asset paths: language JSON files live in repo root as `assets/data-<lang>.json`, while hotel list is at `assets/data/hotels.json`. When editing paths, preserve existing fallbacks in `loadHotels()`.

Integration points & external dependencies
- External CDN libs used in HTML: Bootstrap CSS & JS and Bootstrap Icons. No package.json.
- Backend API: `API_BASE_URL` in `js/hotel-reservation.js` points to `https://api.travelgate.co/api` by default; used for reservation creation and payment. Treat this as a critical integration and document any contract changes when modifying request/response fields.

What to watch for when editing
- Script order matters: `i18n.js` should load before other scripts that read `window.i18nData`.
- Keep i18n keys stable: changing keys requires updating all `assets/data-*.json` files and any `data-i18n` attributes.
- When changing hotel rendering or the reservation payload, update both `assets/data/hotels.json` (sample content) and the API contract (invoice/payment fields).

If you need to add tests or a build system
- This repo is intentionally simple. If adding tooling, keep it optional and document new workflows in README.

Questions / Feedback
- After changes, ask maintainers whether `API_BASE_URL` should be configurable via env or UI for safer local testing.

— End of instructions —
