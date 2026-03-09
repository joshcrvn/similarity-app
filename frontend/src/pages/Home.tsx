import SearchBar from "../components/search/SearchBar";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-black via-neutral-950 to-black px-4">
      <div className="max-w-3xl w-full text-center space-y-6">
        <h1 className="text-3xl md:text-4xl font-semibold">
          Discover songs that sound like your favorites.
        </h1>
        <p className="text-sm md:text-base text-neutral-400">
          Search a track and explore songs with a similar vibe using audio features from Spotify.
        </p>
        <div className="flex justify-center">
          <SearchBar />
        </div>
      </div>
    </main>
  );
}

