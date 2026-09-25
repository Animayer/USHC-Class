import { useCallback, useEffect } from "react";
import { BuildLineView } from "./components/BuildLineView";
import { HubView } from "./components/HubView";
import { ProveUpView } from "./components/ProveUpView";
import { ResultsView } from "./components/ResultsView";
import { useProgress } from "./hooks/useProgress";
import { useRouteState } from "./hooks/useRouteState";
import { CLASS_LINE } from "./lib/content";
import type { Mode } from "./lib/routing";

const MODES: { id: Mode; key: string; label: string }[] = [
  { id: "hub", key: "H", label: "Hub" },
  { id: "prove", key: "P", label: "Prove Up" },
  { id: "line", key: "B", label: "Build the Line" },
  { id: "results", key: "R", label: "Results" },
];

export default function App() {
  const { route, setMode } = useRouteState();
  const { progress, setHomestead, setRailroad, setReflections, reset } = useProgress();

  const open = useCallback(
    (mode: Mode) => {
      setMode(mode);
    },
    [setMode],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      const letter = event.key.toLowerCase();
      const next = MODES.find((item) => item.key.toLowerCase() === letter);
      if (!next) return;
      event.preventDefault();
      open(next.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="shell">
      <a className="skip" href="#main">
        Skip to lesson
      </a>
      <header className="masthead">
        <div>
          <p className="eyebrow">{CLASS_LINE}</p>
          <h1>Build the Line / Prove Up</h1>
        </div>
        <nav className="modes" aria-label="Lesson sections">
          {MODES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`mode-btn${route.mode === item.id ? " is-on" : ""}`}
              aria-pressed={route.mode === item.id}
              onClick={() => open(item.id)}
            >
              <kbd>{item.key}</kbd>
              {item.label}
            </button>
          ))}
        </nav>
      </header>
      <main id="main">
        {route.mode === "hub" ? <HubView progress={progress} onOpen={open} /> : null}
        {route.mode === "prove" ? (
          <ProveUpView
            homestead={progress.homestead}
            weather={progress.weather}
            onChange={(homestead, weather, seed) => {
              if (homestead === null) {
                setHomestead(null, [], seed);
                return;
              }
              setHomestead(homestead, weather, seed || progress.weatherSeed || undefined);
            }}
            onResults={() => open(progress.railroad?.done ? "results" : "line")}
          />
        ) : null}
        {route.mode === "line" ? (
          <BuildLineView
            railroad={progress.railroad}
            onChange={setRailroad}
            onResults={() => open("results")}
          />
        ) : null}
        {route.mode === "results" ? (
          <ResultsView
            progress={progress}
            onReflections={setReflections}
            onReset={() => {
              reset();
              open("hub");
            }}
          />
        ) : null}
      </main>
    </div>
  );
}
