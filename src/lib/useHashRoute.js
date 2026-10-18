import { useEffect, useState } from "react";

export const PAGES = ["events", "groups", "messages", "notifications"];

// "#/groups/abc" -> { page: "groups", id: "abc" }
export function parseHash(hash) {
  const [page, id] = hash.replace(/^#\/?/, "").split("/");
  if (!PAGES.includes(page)) return { page: "events", id: null };
  return { page, id: id ? decodeURIComponent(id) : null };
}

export function useHashRoute() {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));

  useEffect(() => {
    const onChange = () => {
      setRoute(parseHash(window.location.hash));
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  return route;
}
