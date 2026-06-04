# 📍 Go Saigon — Ho Chi Minh City Destination Explorer

A live destination discovery web application that helps tourists find highly reviewed places across Ho Chi Minh City's familiar visitor districts, explore them on an interactive map, and compare popularity insights at a glance.

**Live Site:** [go-saigon.vercel.app](https://go-saigon.vercel.app/)

---

## 📋 Overview

Go Saigon is a full-stack web application that integrates the **Google Places API (New)** and **Google Maps JavaScript API** to retrieve and display popular tourist destinations in Ho Chi Minh City. Users can select a familiar visitor district and experience category, view live ranked destinations on a map, open exact Google Maps listings, and compare ratings, review volume, and category insights through an analytics dashboard.

### Key Features

- 🔍 **District & Category Discovery** — Choose from 15 familiar visitor areas and categories including Food, Landmarks, Shopping, Nightlife & Recreation, Sport & Fitness, Education, and Services
- 📊 **Live Insights Dashboard** — KPI cards and visualizations for destination count, average rating, review volume, popularity rankings, and experience mix
- 🗺️ **Interactive Google Map** — View numbered destination pins over a visitor-friendly district overlay and open exact listings in Google Maps
- ⭐ **Popularity Ranking** — Results are ordered by Google review count first, then rating, then destination name for deterministic ties
- 📷 **Destination Photos** — Live Google Places photos shown alongside attribution on ranked destination cards
- 🏙️ **Visitor-Area Boundaries** — Licensed 2020 district overlay provides familiar trip-planning geography for tourists
- 🔐 **Policy-Aware Data Handling** — Google place display content is requested live, while durable storage is limited to place IDs and application-owned metadata
- 📱 **Responsive Design** — Fully responsive across desktop and mobile

---

## Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| **Next.js 15 (App Router)** | React framework — routing, client experience, server routes, and Vercel deployment |
| **TypeScript** | Type-safe development across discovery data, API handlers, and UI components |
| **Tailwind CSS** | Utility-first CSS framework for the neon atlas interface and responsive layout |
| **Recharts** | Analytics charts for popularity, ratings, and experience mix |
| **lucide-react** | Interface icons for discovery controls, status, and analytics |
| **`@vis.gl/react-google-maps`** | Google Map rendering, destination markers, and interactive map behavior |

### Backend

| Technology | Purpose |
|---|---|
| **Next.js API Routes** | Serverless endpoints (`/api/discovery/*`) that securely handle destination requests |
| **Google Places API (New)** | Live place search, rating/review metrics, Google Maps links, and photo metadata |
| **Google Maps JavaScript API** | 	Browser-side visual map: basemap, markers, interactions, and map rendering |
| **Turf** | Filters result coordinates inside the selected visitor-area boundary polygon |
| **Neon Postgres + Drizzle ORM** | Optional place-ID-only persistence and anonymous request metrics |
| **Upstash Redis** | Optional public API rate limiting for Google API cost and abuse protection |

### Infrastructure & Hosting

| Technology | Purpose |
|---|---|
| **Vercel** | Production hosting target — deploys the Next.js app and API routes |
| **GitHub** | Source control and deployment trigger (`Shonh-debug/maps-pulse-saigon`) |
| **Vercel Environment Variables** | Stores server Places credentials, browser map configuration, and optional database/rate-limit settings |
| **geoBoundaries** | Licensed visitor-area polygon dataset (VNM ADM2 2020, CC BY 3.0 IGO) |

---

## Project Structure

```text
src/
├── app/
│   ├── api/
│   │   └── discovery/
│   │       ├── options/route.ts    # Public visitor-area and category options
│   │       ├── search/route.ts     # Live ranked Google Places discovery
│   │       └── photo/route.ts      # Signed no-store Places photo proxy
│   ├── privacy/page.tsx            # Privacy and Google data handling disclosure
│   ├── terms/page.tsx              # Ranking, boundary, and Google terms disclosure
│   ├── layout.tsx                  # Root layout and product metadata
│   ├── page.tsx                    # Tourist discovery dashboard homepage
│   └── globals.css                 # Global styles and neon atlas design system
├── components/
│   └── DestinationMap.tsx          # Google Map, district overlay, and ranked pins
└── lib/
    ├── discovery/
    │   ├── config.ts               # Areas, categories, polygon checks, and ranking
    │   ├── database.ts             # Optional ID-only persistence adapter
    │   ├── rateLimit.ts            # Upstash endpoint protection; required in production
    │   ├── schema.ts               # Drizzle Postgres schema
    │   └── types.ts                # Discovery API types
    └── googlePlaces.ts             # Places search, live details, and photo handling
```

---

## API Integration

The app uses the **Google Places API (New)** Nearby Search endpoint:

```text
https://places.googleapis.com/v1/places:searchNearby
```

The Next.js API route (`/api/discovery/search`) acts as a **secure server layer** between the browser and Google Places — the server-side `GOOGLE_MAPS_API_KEY` is never sent to the client.

**Discovery and ranking flow:** The API route receives a visitor area and category, searches for relevant Google place types, filters returned candidates inside the selected boundary, removes duplicates, excludes permanently closed places, and returns up to 20 destinations ranked by `userRatingCount` descending, then `rating` descending, then name.

**Public application endpoints:**

| Endpoint | Purpose |
|---|---|
| `GET /api/discovery/options` | Returns the 15 visitor areas, seven categories, and the default District 1 / Landmarks selection |
| `POST /api/discovery/search` | Runs a live ranked search and returns current destination information and photo references |
| `GET /api/discovery/photo` | Securely proxies an immediately displayed Google Places photo through a signed short-lived URL |

**Data returned per destination:**
- Google place ID, destination name, formatted address, and place types
- Current Google rating and user review count
- Latitude and longitude for numbered map pins
- Business status and direct Google Maps listing URL
- Optional displayed photo and required photo author attribution

---

## Running Locally

1. **Clone the repository**
   ```bash
   git clone https://github.com/Shonh-debug/maps-pulse-saigon.git
   cd maps-pulse-saigon
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up your environment variables**

   Copy the example file and add your Google Maps configuration:
   ```bash
   cp .env.example .env.local
   ```
   Then edit `.env.local`:
   ```env
   GOOGLE_MAPS_API_KEY=your_server_places_key
   NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY=your_browser_maps_key
   NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=your_map_id
   DATABASE_URL=
   UPSTASH_REDIS_REST_URL=
   UPSTASH_REDIS_REST_TOKEN=
   ```
   > Create keys in the [Google Maps Platform Console](https://console.cloud.google.com/google/maps-apis/credentials). Restrict the server key to Places API (New), and restrict the browser key by HTTP referrer and Maps JavaScript API.

   > Upstash Redis can be left blank for local development, but it is required in production. Without Upstash configured on Vercel, discovery searches and signed photo requests fail closed with `503` instead of allowing unlimited public Google API traffic. Discovery searches are limited to 20 requests per 5 minutes per IP. Signed photo requests are limited to 100 requests per day per IP plus a global 940-request monthly photo budget.

4. **Run database migrations (optional persistence)**
   ```bash
   npm run db:migrate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Deployment (Vercel)

The app is designed for deployment through **Vercel** linked to the GitHub repository. Every push to the `main` branch can trigger an automatic redeploy after the repository is connected in Vercel.

**Environment variables required on Vercel:**

| Variable | Description |
|---|---|
| `GOOGLE_MAPS_API_KEY` | Server-only Google Places API (New) key used by discovery and photo routes |
| `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY` | HTTP-referrer-restricted browser key used to render the Google Map |
| `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` | Google Maps map ID used by the interactive destination map |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL used to rate-limit public discovery searches, signed photo requests, and the monthly photo budget |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token used to rate-limit public discovery searches, signed photo requests, and the monthly photo budget |

The discovery and photo routes use `Cache-Control: no-store` so Google place display content is retrieved live rather than persisted as a cached destination catalog.

---

## 📄 License

This project is for personal/educational use. Place data, photos, map imagery, and destination links are provided by [Google Maps Platform](https://developers.google.com/maps). Visitor-area boundaries are based on [geoBoundaries VNM ADM2 (2020)](https://www.geoboundaries.org/) data produced by OCHA ROAP / Government of Viet Nam and licensed under **CC BY 3.0 IGO**.
