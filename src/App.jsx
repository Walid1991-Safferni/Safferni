import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import AppInner from "./AppInner.jsx";

export default function App() {
  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  );
}
