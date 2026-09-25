import { useCallback, useEffect, useState } from "react";
import type { HomesteadState, Weather } from "../lib/homestead";
import {
  EMPTY_PROGRESS,
  EMPTY_REFLECTIONS,
  loadProgress,
  resetStoredProgress,
  saveProgress,
  type Progress,
  type Reflections,
} from "../lib/progress";
import type { RailroadState } from "../lib/railroad";

export function useProgress() {
  const [progress, setProgress] = useState<Progress>(() => loadProgress());

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const setHomestead = useCallback((homestead: HomesteadState | null, weather?: Weather[], weatherSeed?: number) => {
    setProgress((prev) => ({
      ...prev,
      homestead,
      weather: weather ?? prev.weather,
      weatherSeed: weatherSeed ?? prev.weatherSeed,
    }));
  }, []);

  const setRailroad = useCallback((railroad: RailroadState | null) => {
    setProgress((prev) => {
      const completedLines = { ...prev.completedLines };
      if (railroad?.done) completedLines[railroad.path] = railroad;
      return { ...prev, railroad, completedLines };
    });
  }, []);

  const setReflections = useCallback((reflections: Reflections) => {
    setProgress((prev) => ({ ...prev, reflections }));
  }, []);

  const reset = useCallback(() => {
    resetStoredProgress();
    setProgress({ ...EMPTY_PROGRESS, reflections: { ...EMPTY_REFLECTIONS } });
  }, []);

  return { progress, setHomestead, setRailroad, setReflections, reset };
}
