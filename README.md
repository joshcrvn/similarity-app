# Music Similarity Discovery App

A modern web application to discover **songs that sound similar** to a track you love, powered by the **Spotify Web API** and audio feature–based similarity.

## Tech Stack

- **Frontend**
  - React + TypeScript (Vite)
  - React Router
  - Tailwind CSS
  - Zustand-ready structure (not yet needed for core flow)
  - Lucide React icons
- **Backend**
  - Node.js + Express
  - Axios for Spotify HTTP calls
  - Environment-based configuration with `dotenv`

The frontend talks only to the backend; the backend securely holds your Spotify credentials and proxies Spotify Web API requests.

---

## Project Structure

```text
music-similarity/
  backend/        # Express server that proxies Spotify Web API
  frontend/       # React + Vite app
  README.md
```

### Frontend structure (simplified)

```text
frontend/src
  components/
    search/
      SearchBar.tsx
      SearchSuggestions.tsx
      RecentSearches.tsx
    results/
      SongHeader.tsx
      SimilarSongCard.tsx
      SimilarSongsList.tsx
      FilterPanel.tsx
      SortControls.tsx
    shared/
      AudioPlayer.tsx
      LoadingSpinner.tsx
      ErrorBoundary.tsx
  pages/
    Home.tsx
    Results.tsx
  hooks/
    useSpotifySearch.ts
    useSimilarSongs.ts
  services/
    spotifyApi.ts
    similarityCalculator.ts
  types/
    song.types.ts
  styles/
    globals.css
  App.tsx
  main.tsx
```

---

## 1. Spotify API Setup

### 1.1 Create a Spotify Developer account and app

1. Go to the Spotify Developer Dashboard (search for it in your browser).
2. Log in with your Spotify account.
3. Create a new **app**.
4. On the app page, copy:
   - **Client ID**
   - **Client Secret**

For the current implementation (no user login yet), you **do not** need redirect URIs or OAuth flows; the backend uses the **Client Credentials** flow to access public data and audio features.

### 1.2 Configure environment variables (backend)

In `music-similarity/backend`, copy the example env file:

```bash
cd music-similarity/backend
cp .env.example .env
```

Edit `.env` and set:

```bash
SPOTIFY_CLIENT_ID=your_real_client_id
SPOTIFY_CLIENT_SECRET=your_real_client_secret
PORT=4000
```

> **Important:** Never commit your real `.env` file to version control.

---

## 2. Running the App Locally

Open two terminals: one for the backend, one for the frontend.

### 2.1 Backend

```bash
cd music-similarity/backend
npm install
npm run dev
```

The backend will start on `http://localhost:4000`.

### 2.2 Frontend

```bash
cd music-similarity/frontend
npm install
npm run dev
```

The frontend will start on `http://localhost:5173` and is configured (via `vite.config.ts`) to proxy `/api` requests to the backend.

Open `http://localhost:5173` in your browser.

---

## 3. Core Features Implemented

### 3.1 Search Interface

- **Intelligent search bar** (`SearchBar.tsx`):
  - Debounced search as you type using `useSpotifySearch`.
  - Autocomplete dropdown (`SearchSuggestions.tsx`) with **song title, artist, and album art thumbnail**.
  - Supports:
    - Clicking a suggestion
    - Pressing **Enter** to jump to the first suggestion
  - Clear/reset button when text is present.
  - Styled for dark theme with smooth hover transitions (ready for Framer Motion if you want extra animation).

### 3.2 Results Page

- **Route**: `/results/:trackId` (`Results.tsx`)
- **Header Section**:
  - `SongHeader.tsx` shows:
    - Selected song’s **title, artist(s), album art, release year**
    - **30-second preview** (if available) via `AudioPlayer.tsx`
    - Placeholder tags area for future musical attributes (tempo, energy, mood).
- **Similar Songs List**:
  - `useSimilarSongs` hook:
    - Calls backend recommendations + audio-features endpoints.
    - Computes **similarity scores** using `similarityCalculator.ts` (tempo, key, mode, energy, danceability, valence, acousticness, weighted).
  - `SimilarSongsList` + `SimilarSongCard`:
    - Grid layout of similar songs (album art, title, artist, similarity %).
    - Each card has:
      - “Play Preview” button (hooked to audio element; can be wired globally later).
      - “View Similar” button to navigate to similarity results **for that song**.
  - `SortControls`:
    - Sort by **Best match (similarity)**, **Newest first**, or **Most popular**.
  - `FilterPanel`:
    - Placeholder component ready to host advanced filters (tempo, energy, decade, etc.).

### 3.3 Error Handling & Loading States

- `LoadingSpinner` component for busy states (search & results).
- `ErrorBoundary` to catch unexpected UI errors.
- Friendly, minimal error messages for failed API calls (e.g. “Failed to load seed track”, “Failed to load similar songs”).

---

## 4. Backend API Endpoints

All backend routes live under `music-similarity/backend/src/server.js`.

- `GET /api/spotify/search`
  - Query params: `q` (required), `type=track`, `limit` (optional).
  - Proxies Spotify `/v1/search`.
  - Returns `{ tracks: [...] }`.

- `GET /api/spotify/tracks/:id`
  - Proxies Spotify `/v1/tracks/{id}`.

- `GET /api/spotify/audio-features`
  - Query param: `ids` (comma-separated list of track IDs).
  - Proxies Spotify `/v1/audio-features`.

- `GET /api/spotify/recommendations`
  - Query param: `seed_tracks` (required), `limit` (optional).
  - Proxies Spotify `/v1/recommendations`.
  - Returns `{ tracks: [...] }`.

The backend caches the Spotify **access token** (Client Credentials) in memory and refreshes it automatically when expired.

> **Rate limiting:** If Spotify returns a `429` status, those details are passed back in the error response; you can later enhance this with backoff/retry logic and user-facing warnings.

---

## 5. Similarity Algorithm

Defined in `frontend/src/services/similarityCalculator.ts`:

- Uses Spotify **audio features**:
  - `tempo`, `key`, `mode`, `energy`, `danceability`, `valence`, `acousticness`
- Each feature gets a weight (see `DEFAULT_WEIGHTS`).
- Score is computed as a weighted combination, normalized to **0–100%** for display.

You can tweak the weights to emphasize tempo vs. mood vs. acousticness and adjust how “similar” should feel.

---

## 6. Accessibility & UX Notes

The current implementation includes:

- Dark theme with good contrast.
- Keyboard-friendly form controls (native inputs/selects).
- Clear focus outlines on interactive elements (via Tailwind’s `focus` utilities).
- Semantic HTML structure for pages and sections.

You can further enhance:

- ARIA labels for the audio player and search suggestions listbox.
- “Skip to content” links.
- Reduced motion support using the `prefers-reduced-motion` media query with Tailwind.

---

## 7. Extending the App (Next Phases)

The project is structured so you can easily add:

- **Advanced Filters** in `FilterPanel`:
  - Tempo slider, energy slider, release date range, explicit toggle, popularity threshold.
- **Visualizations**:
  - Radar chart for audio features (e.g. via `recharts` or `react-chartjs-2`).
  - Timeline of similar songs by release date.
- **User Features** (requires Spotify OAuth Authorization Code flow):
  - Log in with Spotify.
  - Save favorites / create playlists.
  - Export similar songs list to a Spotify playlist.

For OAuth, you would:

1. Register redirect URI in Spotify dashboard.
2. Implement `/login`, `/callback` routes on the backend.
3. Exchange authorization code for access + refresh tokens.
4. Call user-scoped Spotify endpoints (e.g. “Create Playlist”, “Add Tracks to Playlist”).

---

## 8. Deployment Guide (High Level)

- **Backend**:
  - Deploy to a Node-friendly platform (Render, Railway, Fly.io, etc.).
  - Set environment variables:
    - `SPOTIFY_CLIENT_ID`
    - `SPOTIFY_CLIENT_SECRET`
    - `PORT` (or use provider’s default).
- **Frontend**:
  - `cd frontend && npm run build`.
  - Deploy `dist` folder to Netlify, Vercel, or any static host.
  - Configure the frontend to call the backend URL (update `baseURL` in `spotifyApi.ts` for production).

For a more advanced setup, you can host the frontend and backend under the same domain and route `/api` to the backend using reverse proxy rules.

