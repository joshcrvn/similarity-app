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

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

console.log("[env] SPOTIFY_CLIENT_ID loaded:", SPOTIFY_CLIENT_ID ? `${SPOTIFY_CLIENT_ID.slice(0, 6)}...` : "MISSING");
console.log("[env] SPOTIFY_CLIENT_SECRET loaded:", SPOTIFY_CLIENT_SECRET ? "yes (hidden)" : "MISSING");

if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
  console.warn(
    "[WARN] SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET not set. Spotify API calls will fail until configured.",
  );
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

/**
 * Weighted audio feature similarity, returns 0–100.
 * Uses the same weights as the original similarityCalculator.ts.
 */
function computeAudioSimilarity(seed, candidate) {
  const tempoDiff = Math.abs(seed.tempo - candidate.tempo);
  const parts = [
    [1 - Math.min(tempoDiff, 120) / 120,                       1.0], // tempo
    [1 - Math.abs(seed.energy        - candidate.energy),       1.5], // energy
    [1 - Math.abs(seed.danceability  - candidate.danceability), 1.0], // danceability
    [1 - Math.abs(seed.valence       - candidate.valence),      1.2], // mood
    [1 - Math.abs(seed.acousticness  - candidate.acousticness), 0.8], // acousticness
    [seed.key  === candidate.key  ? 1 : 0.5,                    0.5], // key
    [seed.mode === candidate.mode ? 1 : 0.5,                    0.3], // mode
  ];
  const totalWeight = parts.reduce((s, [, w]) => s + w, 0);
  const score      = parts.reduce((s, [v, w]) => s + v * w, 0);
  return Math.round((score / totalWeight) * 100);
}

// Similar tracks endpoint.
// 1. Builds a candidate pool via search (confirmed working).
// 2. Attempts to score candidates with real audio features.
//    If /v1/audio-features returns 403/error, falls back to
//    search-rank scores so the page still loads.
app.get("/api/spotify/similar-tracks/:trackId", async (req, res) => {
  const { trackId } = req.params;

  try {
    const track = await spotifyGet(`/tracks/${trackId}`);
    const artistName = track.artists?.[0]?.name;
    const trackName  = track.name;
    if (!artistName) {
      return res.status(404).json({ error: "No artist found for track" });
    }

    // Build candidate pool with two searches in parallel
    const [artistSearch, nameSearch] = await Promise.all([
      spotifyGet("/search", { q: artistName, type: "track" }),
      spotifyGet("/search", { q: trackName,  type: "track" }),
    ]);

    const seen = new Set([trackId]);
    const candidates = [];
    for (const t of [
      ...(artistSearch.tracks?.items || []),
      ...(nameSearch.tracks?.items  || []),
    ]) {
      if (!seen.has(t.id)) {
        seen.add(t.id);
        candidates.push(t);
      }
    }

    // Attempt real audio-feature scoring
    const allIds = [trackId, ...candidates.map((t) => t.id)];
    let featuresMap = new Map();
    let usingAudioFeatures = false;

    try {
      const featData = await spotifyGet("/audio-features", {
        ids: allIds.slice(0, 100).join(","),
      });
      for (const f of featData.audio_features || []) {
        if (f) featuresMap.set(f.id, f);
      }
      usingAudioFeatures = featuresMap.size > 1;
    } catch {
      console.warn("[similar-tracks] /audio-features unavailable — using search-rank scores");
    }

    const seedFeatures = featuresMap.get(trackId);

    const results = candidates.map((t, idx) => {
      const cf = featuresMap.get(t.id);
      const similarity =
        usingAudioFeatures && seedFeatures && cf
          ? computeAudioSimilarity(seedFeatures, cf)
          : idx < (artistSearch.tracks?.items?.length || 0) ? 85 : 70;
      return { ...t, similarity };
    });

    results.sort((a, b) => b.similarity - a.similarity);

    console.log(
      `[similar-tracks] ${results.length} tracks for "${trackName}" | ` +
      `audio-features: ${usingAudioFeatures}`
    );
    res.json({ tracks: results.slice(0, 30) });
  } catch (err) {
    const status = err?.response?.status || 500;
    console.error("[similar-tracks] error:", err?.response?.status, JSON.stringify(err?.response?.data));
    res.status(status).json({ error: "Failed to fetch similar tracks", details: err?.response?.data });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Music similarity backend listening on http://localhost:${PORT}`);
});

