const path = require("path");
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const dotenv = require("dotenv");

// Explicit path so .env is always loaded from backend/.env
// regardless of which directory the process is started from
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const SPOTIFY_CLIENT_ID     = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const LASTFM_API_KEY        = process.env.LASTFM_API_KEY;

console.log("[env] SPOTIFY_CLIENT_ID:    ", SPOTIFY_CLIENT_ID     ? `${SPOTIFY_CLIENT_ID.slice(0, 6)}...` : "MISSING");
console.log("[env] SPOTIFY_CLIENT_SECRET:", SPOTIFY_CLIENT_SECRET ? "yes (hidden)"                        : "MISSING");
console.log("[env] LASTFM_API_KEY:       ", LASTFM_API_KEY        ? `${LASTFM_API_KEY.slice(0, 6)}...`   : "not set — will use search fallback");

if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
  console.warn("[WARN] Spotify credentials missing. API calls will fail.");
}

let cachedToken = null;
let cachedTokenExpiresAt = 0;

async function getAccessToken() {
  const now = Date.now();
  if (cachedToken && now < cachedTokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const auth = Buffer.from(
    `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`,
  ).toString("base64");

  const res = await axios.post(
    "https://accounts.spotify.com/api/token",
    new URLSearchParams({ grant_type: "client_credentials" }).toString(),
    {
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );

  cachedToken = res.data.access_token;
  cachedTokenExpiresAt = now + res.data.expires_in * 1000;
  return cachedToken;
}

async function lastfmGet(params) {
  const res = await axios.get("https://ws.audioscrobbler.com/2.0/", {
    params: { ...params, api_key: LASTFM_API_KEY, format: "json" },
  });
  if (res.data.error) {
    throw new Error(`Last.fm error ${res.data.error}: ${res.data.message}`);
  }
  return res.data;
}

async function spotifyGet(path, params = {}) {
  const token = await getAccessToken();
  try {
    const res = await axios.get(`https://api.spotify.com/v1${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return res.data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      console.error("Spotify API error:", err.response.status, err.response.data);
    } else {
      console.error("Spotify API error:", err);
    }
    throw err;
  }
}

app.get("/api/spotify/search", async (req, res) => {
  const { q, type = "track", limit = 10 } = req.query;
  if (!q) {
    return res.status(400).json({ error: "Missing q query parameter" });
  }
  try {
    const data = await spotifyGet("/search", {
      q,
      type,
      limit,
    });
    res.json({
      tracks: data.tracks?.items ?? [],
    });
  } catch (err) {
    const status = err.response?.status || 500;
    res
      .status(status)
      .json({ error: "Failed to search tracks", details: err.response?.data });
  }
});

app.get("/api/spotify/tracks/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const data = await spotifyGet(`/tracks/${id}`);
    res.json(data);
  } catch (err) {
    const status = err.response?.status || 500;
    res
      .status(status)
      .json({ error: "Failed to fetch track", details: err.response?.data });
  }
});

app.get("/api/spotify/audio-features", async (req, res) => {
  const { ids } = req.query;
  if (!ids) {
    return res.status(400).json({ error: "Missing ids query parameter" });
  }
  try {
    const data = await spotifyGet("/audio-features", { ids });
    res.json(data);
  } catch (err) {
    const status = err.response?.status || 500;
    res.status(status).json({
      error: "Failed to fetch audio features",
      details: err.response?.data,
    });
  }
});

app.get("/api/spotify/recommendations", async (req, res) => {
  const { seed_tracks, limit = 30 } = req.query;
  if (!seed_tracks) {
    return res.status(400).json({ error: "Missing seed_tracks query parameter" });
  }
  try {
    const data = await spotifyGet("/recommendations", {
      seed_tracks,
      limit,
    });
    res.json({
      tracks: data.tracks ?? [],
    });
  } catch (err) {
    const status = err.response?.status || 500;
    res.status(status).json({
      error: "Failed to fetch recommendations",
      details: err.response?.data,
    });
  }
});

// Similar tracks endpoint.
//
// Path A (preferred): Last.fm track.getSimilar → similarity scores based on
//   real listener behaviour → cross-reference each result with Spotify for
//   album art, preview URL, and track ID.
//
// Path B (fallback): two Spotify searches (artist name + track name) with
//   static similarity scores. Used when LASTFM_API_KEY is not set or Last.fm
//   returns no results for the track.
app.get("/api/spotify/similar-tracks/:trackId", async (req, res) => {
  const { trackId } = req.params;

  try {
    const track      = await spotifyGet(`/tracks/${trackId}`);
    const artistName = track.artists?.[0]?.name;
    const trackName  = track.name;
    if (!artistName) {
      return res.status(404).json({ error: "No artist found for track" });
    }

    // ── Path A: Last.fm ──────────────────────────────────────────────────
    if (LASTFM_API_KEY) {
      try {
        const lfmData = await lastfmGet({
          method:      "track.getSimilar",
          artist:      artistName,
          track:       trackName,
          limit:       "20",
          autocorrect: "1",
        });

        const similar = lfmData.similartracks?.track || [];

        if (similar.length > 0) {
          // Cross-reference each Last.fm track with Spotify in parallel
          const enriched = await Promise.all(
            similar.map(async (lfm) => {
              const similarity = Math.round(Number(lfm.match) * 100);
              try {
                const q    = `${lfm.artist?.name || ""} ${lfm.name}`;
                const data = await spotifyGet("/search", { q, type: "track" });
                const hit  = data.tracks?.items?.[0];
                if (hit && hit.id !== trackId) {
                  return { ...hit, similarity };
                }
              } catch {
                // skip tracks that can't be resolved on Spotify
              }
              return null;
            })
          );

          const results = enriched.filter(Boolean);
          console.log(`[similar-tracks] "${trackName}" | source: Last.fm | ${results.length} tracks`);
          return res.json({ tracks: results });
        }

        console.warn(`[similar-tracks] Last.fm returned no results for "${trackName}" — using search fallback`);
      } catch (lfmErr) {
        console.warn("[similar-tracks] Last.fm error:", lfmErr.message, "— using search fallback");
      }
    }

    // ── Path B: search-based fallback ────────────────────────────────────
    const [artistSearch, nameSearch] = await Promise.all([
      spotifyGet("/search", { q: artistName, type: "track" }),
      spotifyGet("/search", { q: trackName,  type: "track" }),
    ]);

    const seen = new Set([trackId]);
    const results = [];
    for (const [items, score] of [
      [artistSearch.tracks?.items || [], 85],
      [nameSearch.tracks?.items   || [], 70],
    ]) {
      for (const t of items) {
        if (!seen.has(t.id)) {
          seen.add(t.id);
          results.push({ ...t, similarity: score });
        }
      }
    }

    console.log(`[similar-tracks] "${trackName}" | source: search fallback | ${results.length} tracks`);
    res.json({ tracks: results.slice(0, 30) });
  } catch (err) {
    const status = err?.response?.status || 500;
    console.error("[similar-tracks] error:", err?.response?.status, JSON.stringify(err?.response?.data));
    res.status(status).json({ error: "Failed to fetch similar tracks", details: err?.response?.data });
  }
});

app.get("/api/lastfm/tags", async (req, res) => {
  const { artist, track } = req.query;
  if (!artist || !track) {
    return res.status(400).json({ error: "Missing artist or track" });
  }
  if (!LASTFM_API_KEY) {
    return res.json({ tags: [] });
  }
  try {
    const data = await lastfmGet({
      method: "track.getTopTags",
      artist,
      track,
      autocorrect: "1",
    });
    const tags = (data.toptags?.tag || []).slice(0, 5).map((t) => t.name);
    res.json({ tags });
  } catch {
    res.json({ tags: [] });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Music similarity backend listening on http://localhost:${PORT}`);
});

