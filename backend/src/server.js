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

// Uses only /search and /tracks — the two endpoints confirmed working.
// Spotify deprecated recommendations, audio-features, related-artists,
// top-tracks, and artist/album browsing for new apps in Nov 2024.
app.get("/api/spotify/similar-tracks/:trackId", async (req, res) => {
  const { trackId } = req.params;
  const limit = Math.min(Number(req.query.limit) || 30, 50);

  try {
    // Step 1: get seed track (confirmed working)
    const track = await spotifyGet(`/tracks/${trackId}`);
    const artistName = track.artists?.[0]?.name;
    const trackName = track.name;

    if (!artistName) {
      return res.status(404).json({ error: "No artist found for track" });
    }

    // Step 2: search for more tracks by the same artist (similarity ~85%)
    console.log(`[similar-tracks] searching for artist: "${artistName}"`);
    const artistSearch = await spotifyGet("/search", {
      q: artistName,
      type: "track",
    });
    const artistTracks = (artistSearch.tracks?.items || [])
      .filter((t) => t.id !== trackId)
      .map((t) => ({ ...t, similarity: 85 }));

    // Step 3: search by track name to surface versions/similar songs (~70%)
    console.log(`[similar-tracks] searching for track: "${trackName}"`);
    const nameSearch = await spotifyGet("/search", {
      q: trackName,
      type: "track",
    });

    const seen = new Set([trackId, ...artistTracks.map((t) => t.id)]);
    const nameTracks = (nameSearch.tracks?.items || [])
      .filter((t) => !seen.has(t.id))
      .map((t) => ({ ...t, similarity: 70 }));

    const results = [...artistTracks, ...nameTracks].slice(0, limit);
    console.log(`[similar-tracks] returning ${results.length} tracks for "${trackName}" by ${artistName}`);
    res.json({ tracks: results });
  } catch (err) {
    const status = err?.response?.status || 500;
    console.error(
      "[similar-tracks] Spotify error:",
      err?.response?.status,
      JSON.stringify(err?.response?.data)
    );
    res.status(status).json({
      error: "Failed to fetch similar tracks",
      details: err?.response?.data,
    });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Music similarity backend listening on http://localhost:${PORT}`);
});

