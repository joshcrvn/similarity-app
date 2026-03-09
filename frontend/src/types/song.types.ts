export interface Artist {
  id: string;
  name: string;
}

export interface AlbumImage {
  url: string;
  height: number;
  width: number;
}

export interface Album {
  id: string;
  name: string;
  images: AlbumImage[];
  release_date?: string;
}

export interface AudioFeatures {
  id: string;
  tempo: number;
  key: number;
  mode: number;
  energy: number;
  danceability: number;
  valence: number;
  acousticness: number;
  popularity?: number;
}

export interface Song {
  id: string;
  name: string;
  artists: Artist[];
  album: Album;
  preview_url?: string;
  popularity?: number;
  audioFeatures?: AudioFeatures;
}

