const express = require("express");
const cors = require("cors");
const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

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

// Discovery endpoints (recommendations, related-artists, audio-features, top-tracks)
// were deprecated by Spotify in Nov 2024 for new apps.
// This endpoint uses only catalog APIs that are still available:
//   /artists/{id}          → genres
//   /artists/{id}/albums   → artist's catalog
//   /albums/{id}/tracks    → simplified track list
//   /tracks?ids=...        → batch full track objects
//   /search                → genre-based cross-artist discovery
app.get("/api/spotify/similar-tracks/:trackId", async (req, res) => {
  const { trackId } = req.params;
  const limit = Math.min(Number(req.query.limit) || 30, 50);

  try {
    const track = await spotifyGet(`/tracks/${trackId}`);
    const primaryArtist = track.artists?.[0];
    if (!primaryArtist) {
      return res.status(404).json({ error: "No artist found for track" });
    }

    // Fetch artist details (genres) + artist albums in parallel
    const [artistData, albumsData] = await Promise.all([
      spotifyGet(`/artists/${primaryArtist.id}`),
      spotifyGet(`/artists/${primaryArtist.id}/albums`, {
        include_groups: "album,single",
        limit: 6,
        market: "US",
      }).catch(() => ({ items: [] })),
    ]);

    const genres = artistData.genres || [];

    // Fetch tracks for each album (simplified objects, no popularity/album image)
    const albumTrackPages = await Promise.all(
      albumsData.items.slice(0, 5).map((album) =>
        spotifyGet(`/albums/${album.id}/tracks`, { limit: 8, market: "US" })
          .then((d) => d.items || [])
          .catch(() => [])
      )
    );

    // Collect unique track IDs from the artist's catalog (excluding seed)
    const seen = new Set([trackId]);
    const catalogIds = [];
    for (const tracks of albumTrackPages) {
      for (const t of tracks) {
        if (t.id && !seen.has(t.id)) {
          seen.add(t.id);
          catalogIds.push(t.id);
        }
      }
    }

    // Batch-fetch full track objects (popularity, preview_url, album art)
    let catalogTracks = [];
    if (catalogIds.length > 0) {
      const { tracks: full } = await spotifyGet("/tracks", {
        ids: catalogIds.slice(0, 50).join(","),
        market: "US",
      });
      catalogTracks = (full || [])
        .filter(Boolean)
        .map((t) => ({ ...t, similarity: 85 }));
    }

    // Genre-based search: other artists in the same genre
    let genreTracks = [];
    if (genres.length > 0) {
      const genreQuery = genres[0].replace(/\s+/g, "+");
      const searchData = await spotifyGet("/search", {
        q: `genre:${genreQuery}`,
        type: "track",
        limit: 20,
        market: "US",
      }).catch(() => ({ tracks: { items: [] } }));

      genreTracks = (searchData.tracks?.items || [])
        .filter(
          (t) =>
            !seen.has(t.id) &&
            !t.artists.some((a) => a.id === primaryArtist.id)
        )
        .map((t) => {
          seen.add(t.id);
          return { ...t, similarity: 70 };
        });
    }

    const results = [...catalogTracks, ...genreTracks].slice(0, limit);
    res.json({ tracks: results });
  } catch (err) {
    const status = err?.response?.status || 500;
    console.error(
      "[similar-tracks] error:",
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

