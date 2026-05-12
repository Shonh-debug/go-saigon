# Maps Pulse Saigon

A neon analytics dashboard for recent Ho Chi Minh City Google Maps places.

## Features

- 43-place Ho Chi Minh City recents seed dataset.
- Category, area, rating, and popularity filters.
- KPI cards, insight cards, category charts, area chart, scatter plot, leaderboard, and place table.
- Manual Places API enrichment through `POST /api/places/sync`.
- Server-only Google Places API key usage via `GOOGLE_MAPS_API_KEY`.

## Local Development

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:3000`.

## Environment

Create `.env.local`:

```env
GOOGLE_MAPS_API_KEY=
```

Never expose this key in browser code or commit it to GitHub.
