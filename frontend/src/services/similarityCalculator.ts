import type { AudioFeatures } from "../types/song.types";

export type SimilarityWeights = {
  tempo: number;
  key: number;
  mode: number;
  energy: number;
  danceability: number;
  valence: number;
  acousticness: number;
};

export const DEFAULT_WEIGHTS: SimilarityWeights = {
  tempo: 1.0,
  key: 0.5,
  mode: 0.3,
  energy: 1.0,
  danceability: 1.0,
  valence: 0.8,
  acousticness: 0.7
};

function normalizeTempoDiff(a: number, b: number): number {
  const diff = Math.abs(a - b);
  const maxDiff = 180;
  return 1 - Math.min(diff, maxDiff) / maxDiff;
}

function numericSimilarity(a: number, b: number, maxDiff = 1): number {
  const diff = Math.abs(a - b);
  return 1 - Math.min(diff, maxDiff) / maxDiff;
}

export function computeSimilarityScore(
  seed: AudioFeatures,
  candidate: AudioFeatures,
  weights: SimilarityWeights = DEFAULT_WEIGHTS
): number {
  let score = 0;
  let weightSum = 0;

  const parts: [number, number][] = [
    [normalizeTempoDiff(seed.tempo, candidate.tempo), weights.tempo],
    [seed.key === candidate.key ? 1 : 0.5, weights.key],
    [seed.mode === candidate.mode ? 1 : 0.5, weights.mode],
    [numericSimilarity(seed.energy, candidate.energy), weights.energy],
    [numericSimilarity(seed.danceability, candidate.danceability), weights.danceability],
    [numericSimilarity(seed.valence, candidate.valence), weights.valence],
    [numericSimilarity(seed.acousticness, candidate.acousticness), weights.acousticness]
  ];

  for (const [sim, w] of parts) {
    score += sim * w;
    weightSum += w;
  }

  return (score / weightSum) * 100;
}

