import { useCallback, useEffect, useState } from "react";
import { parseSearch, writeSearch, type RouteState } from "../lib/routing";

export function useRouteState() {
  const [route, setRoute] = useState<RouteState>(() =>
    parseSearch(typeof window === "undefined" ? "" : window.location.search),
  );

  useEffect(() => {
    writeSearch(route);
  }, [route]);

  useEffect(() => {
    const onPop = () => setRoute(parseSearch(window.location.search));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const setMode = useCallback((mode: RouteState["mode"]) => {
    setRoute({ mode });
  }, []);

  return { route, setMode };
}
