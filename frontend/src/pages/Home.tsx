import SearchBar from "../components/search/SearchBar";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-black via-neutral-950 to-black px-4">
      <div className="max-w-3xl w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
            Similarity
          </h1>
          <p className="text-sm md:text-base text-neutral-400">
            Find songs that actually sound like the ones you love.
          </p>
        </div>
        <div className="flex justify-center">
          <SearchBar />
        </div>
      </div>
    </main>
  );
}
