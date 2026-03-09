# Claude Code Context Memory

## Project Status
- Current Phase: 3 (in progress)
- Last Updated: 2026-03-09
- App name: "Similarity"

## What We've Built So Far

### Phase 1 - Foundation (Complete)
- Vite + React 18 + TypeScript frontend in `frontend/`
- Tailwind CSS configured (`tailwind.config.cjs`, `postcss.config.cjs`)
- React Router v6 with two routes: `/` (Home) and `/results/:trackId` (Results)
- Debounced search bar (`SearchBar.tsx`) with autocomplete dropdown (`SearchSuggestions.tsx`)
- Recent searches component (`RecentSearches.tsx`)
- Node.js + Express backend in `backend/` proxying the Spotify Web API
- Client Credentials auth flow (token cached in memory, auto-refreshed)
- Git repo initialized, `.gitignore` and `backend/.env.example` created

### Phase 3 - Enhanced UX (In Progress)
- Last.fm integration working — real similarity via `track.getSimilar`
- Global audio context (`AudioContext.tsx`) — single audio element, only one track plays at a time
- Audio preview players: hover over any card to reveal play button; plays 30s clip
- Vibe tags on seed song: Last.fm genre tags + decade + popularity (fetched from `/api/lastfm/tags`)
- Filter panel: decade (Pre-2000 / 2000s / 2010s / 2020s) + popularity (Popular / Underground)
- Sort: Best match / Most popular / Newest first / A–Z
- Recently searched songs: stored in localStorage, shown on home page when search is focused
- App rebranded to "Similarity"

### Phase 2 - Results & Similarity Engine (Complete)
- `Results.tsx` page fetches seed track, drives similar-songs flow
- `SongHeader.tsx` — album art, title, artist, release year, 30s preview
- `AudioPlayer.tsx` — shared audio preview player component
- `useSimilarSongs` hook — fetches recommendations + audio features, computes similarity scores
- `similarityCalculator.ts` — weighted similarity across tempo, key, mode, energy, danceability, valence, acousticness (0–100%)
- `SimilarSongsList.tsx` + `SimilarSongCard.tsx` — responsive grid with "Play Preview" and "View Similar" buttons
- `SortControls.tsx` — sort by Best Match / Newest / Most Popular
- `FilterPanel.tsx` — placeholder, ready for advanced filters
- `LoadingSpinner.tsx` + `ErrorBoundary.tsx` shared components

## Current File Structure

```
music-similarity/
├── backend/
│   ├── src/server.js          # Express server, Spotify proxy, token cache
│   ├── .env.example           # Template for env vars
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── search/
│   │   │   │   ├── SearchBar.tsx
│   │   │   │   ├── SearchSuggestions.tsx
│   │   │   │   └── RecentSearches.tsx
│   │   │   ├── results/
│   │   │   │   ├── SongHeader.tsx
│   │   │   │   ├── SimilarSongCard.tsx
│   │   │   │   ├── SimilarSongsList.tsx
│   │   │   │   ├── FilterPanel.tsx
│   │   │   │   └── SortControls.tsx
│   │   │   └── shared/
│   │   │       ├── AudioPlayer.tsx
│   │   │       ├── LoadingSpinner.tsx
│   │   │       └── ErrorBoundary.tsx
│   │   ├── hooks/
│   │   │   ├── useSpotifySearch.ts
│   │   │   └── useSimilarSongs.ts
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   └── Results.tsx
│   │   ├── services/
│   │   │   ├── spotifyApi.ts          # axios wrapper, calls /api/spotify/*
│   │   │   └── similarityCalculator.ts
│   │   ├── types/
│   │   │   └── song.types.ts          # Song, Album, Artist, AudioFeatures
│   │   ├── styles/globals.css
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── vite.config.ts                 # proxies /api → localhost:4000
│   ├── tailwind.config.cjs
│   └── package.json
├── .gitignore
├── CLAUDE_CONTEXT.md
└── README.md
```

## Active Dependencies

### Frontend
- react 18, react-dom, react-router-dom v6 — UI framework + routing
- typescript, vite, @vitejs/plugin-react-swc — build tooling
- tailwindcss, postcss, autoprefixer — styling
- axios — HTTP client for API calls
- lucide-react — icon library
- framer-motion — animations (installed, minimal usage so far)
- zustand — state (installed, not yet needed for core flow)

### Backend
- express — HTTP server
- cors — allow frontend origin
- axios — Spotify HTTP calls
- dotenv — environment variable loading

## Environment Variables Needed

### Backend (`backend/.env`)
```
SPOTIFY_CLIENT_ID=<from Spotify Developer Dashboard>
SPOTIFY_CLIENT_SECRET=<from Spotify Developer Dashboard>
PORT=4000
LASTFM_API_KEY=<from https://www.last.fm/api/account/create>
```
Copy `backend/.env.example` → `backend/.env` and fill in real credentials.

## Known Issues / TODOs

- `FilterPanel` is a placeholder — no actual filter logic wired yet
- No shadcn/ui components installed (was in the spec but not implemented; Tailwind used directly instead)
- Audio preview: not all tracks have `preview_url` (Spotify limitation)
- No virtual scrolling yet (needed if > 50 results)
- Spotify credentials were accidentally exposed in chat — **new credentials generated and in .env**

## Last.fm Integration (Primary Similarity Source)
- `track.getSimilar` returns up to 20 similar tracks with a `match` score (0–1)
- Similarity is collaborative filtering (listener behaviour) — much better than text matching
- Free API key, no approval: https://www.last.fm/api/account/create
- Add `LASTFM_API_KEY` to `backend/.env`
- Backend cross-references each Last.fm result with Spotify (search) to get album art + preview URL
- Falls back to search-based matching if key not set or Last.fm returns no results

## CRITICAL: Spotify API Deprecations (Nov 2024)
Spotify restricted the following endpoints to apps with special "extended access" approval.
New apps get **403 Forbidden** — this is NOT a credentials issue.

**Deprecated (do not use):**
- ❌ `/v1/recommendations`
- ❌ `/v1/audio-features`
- ❌ `/v1/artists/{id}/related-artists`
- ❌ `/v1/artists/{id}/top-tracks`

**Still working (catalog APIs):**
- ✅ `/v1/search`
- ✅ `/v1/tracks/{id}` and `/v1/tracks?ids=...` (batch)
- ✅ `/v1/artists/{id}` (genres, metadata)
- ✅ `/v1/artists/{id}/albums`
- ✅ `/v1/albums/{id}/tracks`

**Our solution (`/api/spotify/similar-tracks/:trackId`):**
1. Get seed track → primary artist ID
2. Parallel fetch: artist genres + artist albums
3. Fetch simplified tracks from each album
4. Batch-fetch full track objects (`/v1/tracks?ids=...`) for popularity/art
5. Genre search (`/search?q=genre:X`) for cross-artist discovery
6. Similarity score: catalog tracks = 85%, genre-search tracks = 70%

## API Integration Status
- Spotify Auth (Client Credentials): ✅ working
- Search (`/api/spotify/search`): ✅ working
- Track Details (`/api/spotify/tracks/:id`): ✅ working
- Similar Tracks (`/api/spotify/similar-tracks/:trackId`): ✅ working (catalog-based)
- Audio Features: ❌ deprecated — removed
- Recommendations: ❌ deprecated — removed

## Important Decisions Made
- **Backend proxy** instead of direct Spotify calls from frontend — keeps credentials secure
- **Client Credentials flow** for now (no user OAuth required for search/recommendations)
- **Vite proxy** (`/api` → `localhost:4000`) avoids CORS issues in dev
- Similarity score is a **weighted average** of normalized audio feature distances, output as 0–100%
- No shadcn/ui added yet — raw Tailwind is clean enough and avoids extra setup complexity

## Next Steps (Phase 3)
1. Wire up `FilterPanel` — tempo range slider, energy slider, decade picker
2. Implement Framer Motion page transitions (Home ↔ Results)
3. Loading skeletons instead of spinner (better UX)
4. `RecentSearches` — persist to localStorage, display on Home page
5. Favorites / saved songs with localStorage
6. Radar chart for audio feature visualization (recharts or chart.js)

## Code Snippets to Remember

### Running locally
```bash
# Terminal 1 — backend
cd backend && npm run dev   # → http://localhost:4000

# Terminal 2 — frontend
cd frontend && npm run dev  # → http://localhost:5173
```

### Spotify similarity weights (similarityCalculator.ts)
```
tempo: 1.0, energy: 1.0, danceability: 1.0,
valence: 0.8, acousticness: 0.7, key: 0.5, mode: 0.3
```
