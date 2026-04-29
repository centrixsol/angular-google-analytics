# Car Tracker

> A real-time GPS car tracking web app built with Angular 21 — find your parked car in seconds.

![Angular](https://img.shields.io/badge/Angular-21-dd0031?style=flat-square&logo=angular)
![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?style=flat-square&logo=leaflet)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

---

## Overview

Car Tracker is a progressive, mobile-first web application that uses your device's GPS to track your real-time location and remember exactly where you parked your car. Built for iPhone and any modern browser, it combines live map rendering with persistent local storage so your parking spot is never lost — even if you close the app.

---

## Features

- **Live GPS Tracking** — Continuously watches your device location using the browser's high-accuracy Geolocation API, displaying a live blue dot with an accuracy radius ring on the map.
- **Save Parking Spot** — Tap "Park Here" to drop a red pin at your current location. The spot is saved to `localStorage` and survives page reloads and browser restarts.
- **Distance & Compass** — A floating card shows the real-time straight-line distance to your parked car (in meters or km) alongside a live-rotating compass arrow pointing directly at it.
- **Interactive Map** — Powered by [Leaflet](https://leafletjs.com/) and OpenStreetMap tiles. Pan, zoom, and tap markers freely.
- **Smart Map Controls** — One-tap buttons to re-center on your current position, on the parked car, or zoom to fit both at once.
- **Dashed Route Line** — A visual line connects your current position to the parking pin so you always know the direction at a glance.
- **iPhone Ready** — Designed with `viewport-fit=cover`, safe-area insets, and `apple-mobile-web-app-capable` for a native feel when added to the home screen.

---

## Screenshots

| Live Tracking | Parked — Distance View |
|:---:|:---:|
| *(blue dot + accuracy ring)* | *(compass card + dashed route)* |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Angular 21 (standalone components, signals) |
| Map | Leaflet 1.9 + OpenStreetMap |
| Location | Browser Geolocation API (`watchPosition`) |
| State | Angular Signals + RxJS BehaviorSubject |
| Persistence | `localStorage` |
| Styling | SCSS, mobile-first |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Install

```bash
git clone https://github.com/centrixsol/angular-google-analytics.git
cd angular-google-analytics
npm install
```

### Run locally

```bash
npm start
```

Open `http://localhost:4200` in your browser.

> **Note:** The Geolocation API requires a **secure context (HTTPS)**. `localhost` works fine in desktop browsers, but testing on an iPhone requires an HTTPS tunnel (see below).

---

## Testing on iPhone

Safari on iOS requires HTTPS for the Geolocation API. Use [ngrok](https://ngrok.com) to create a secure tunnel to your local dev server:

```bash
# 1. Start the dev server
npm start

# 2. In another terminal, open an HTTPS tunnel
npx ngrok http 4200
```

ngrok will print a URL like `https://xxxx.ngrok-free.app`. Open that URL in Safari on your iPhone, tap **Allow** when prompted for location access, and the app is ready to use.

> **Tip:** Add the page to your iPhone Home Screen (Share → Add to Home Screen) for a full-screen, app-like experience.

---

## Project Structure

```
src/
└── app/
    ├── services/
    │   ├── location.service.ts   # Geolocation watchPosition + RxJS stream
    │   └── storage.service.ts    # localStorage read/write for parking spot
    ├── tracker/
    │   ├── tracker.ts            # Main component — signals, Leaflet, business logic
    │   ├── tracker.html          # Mobile-first template
    │   └── tracker.scss          # Full-screen map + bottom panel layout
    ├── app.routes.ts             # Lazy-loads TrackerComponent
    ├── app.config.ts             # Angular app config
    └── app.ts                    # Root component (router shell)
```

---

## Build for Production

```bash
npm run build
```

Output is placed in `dist/car-tracker/`. Deploy the contents of that folder to any static hosting provider (Netlify, Vercel, GitHub Pages, etc.).

---

## How It Works

1. On load, the app restores any previously saved parking spot from `localStorage` and places the red pin on the map.
2. GPS tracking starts automatically via `navigator.geolocation.watchPosition` with `enableHighAccuracy: true`.
3. Each location update moves the blue dot, updates the accuracy ring, redraws the dashed route line, and recalculates distance and bearing using the [Haversine formula](https://en.wikipedia.org/wiki/Haversine_formula).
4. Tapping **Park Here** snapshots the current `GeoPosition` into `localStorage` and drops the parking pin.
5. Tapping **Clear** removes the pin and wipes the stored position.

---

## License

MIT © 2025
