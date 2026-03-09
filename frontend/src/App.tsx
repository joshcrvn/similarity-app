import { Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/shared/ErrorBoundary";
import Home from "./pages/Home";
import Results from "./pages/Results";

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/results/:trackId" element={<Results />} />
      </Routes>
    </ErrorBoundary>
  );
}

