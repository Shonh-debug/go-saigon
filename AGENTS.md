# Maps Pulse Saigon Tourist Destination Explorer

## Project Goal

Build a public, Vercel-ready web application for tourists discovering popular places to visit in Ho Chi Minh City. The product is no longer a private Google Maps Recents dashboard and must not display or persist a user's private search history.

The homepage is the working discovery surface: visitors select a familiar city district and a destination category, see live Google Places results on an interactive Google Map, and explore analytics derived from the displayed destinations.

## Visitor Experience

- Default discovery: District 1 and Landmarks.
- Visitor areas: Districts 1, 2 / Thao Dien - An Phu, 3, 4, 5, 6, 7, 9, 10, 11, Binh Thanh, Phu Nhuan, Tan Binh, Tan Phu, and Go Vap.
- Use the visitor-facing district labels above while disclosing that they represent a familiar 2020 district model, not current administrative definitions.
- Categories: Food, Nightlife & Recreation, Shopping, Landmarks, Campus & Education, Sport & Fitness, and Services.
- Services means visitor services such as tour agencies, travel agencies, tourist information centers, and spas.
- Rank displayed destinations by Google Maps review count descending, then rating descending, then name ascending.
- Describe rankings as the top destinations found from the live candidate search, not an exhaustive citywide ranking.

## Data And Policy Rules

- Use Google Places API (New) server-side for live destination discovery, current rating/review metrics, Maps links, and photo metadata.
- Use Google Maps JavaScript API client-side to display Google place results on a real Google Map with clickable pins.
- Store only Google place IDs and application-owned taxonomy or request metadata in Postgres. Do not persist Google place names, ratings, review counts, addresses, photos, photo references, Maps URLs, or raw API responses.
- Serve live discovery and photo proxy responses with `Cache-Control: no-store`.
- Keep API keys and database tokens in local or Vercel environment variables only; never commit them or expose server keys to the browser.
- Display Google attribution and photo author attribution when Google content is displayed.

## Geography And Attribution

- The visitor-area overlay is generated from the geoBoundaries Vietnam ADM2 2020 dataset produced by OCHA ROAP / Government of Viet Nam and licensed under CC BY 3.0 IGO.
- The generated GeoJSON map asset is stored at `public/data/visitor-areas.json`.
- The import script at `scripts/import-visitor-areas.mjs` must preserve attribution metadata if the boundary asset is regenerated.

## Implementation Notes

- Keep the first viewport focused on useful discovery controls, map results, ranked cards, and analytics rather than a marketing landing page.
- Maintain the neon city-atlas brand while ensuring data readability and responsive map/card behavior.
- Use the API routes under `/api/discovery/*`; do not restore the retired private Recents endpoints.
- Database tables may hold visitor areas, area/category/place-ID associations, and anonymous discovery request metrics only.
- If the browser-restricted Maps JavaScript key is unavailable, do not display live Places content without its Google Map context.
