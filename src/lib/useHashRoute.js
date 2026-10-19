import { useEffect, useState } from "react";

// Routes:
//   #/                               -> home (your classes)
//   #/join/ABC234                    -> join a class by code
//   #/classes/<id>                   -> a class
//   #/classes/<id>/groups/<groupId>  -> a group's chat
export function parseHash(hash) {
  const parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);

  if (parts[0] === "join" && parts[1]) return { name: "join", code: parts[1] };
  if (parts[0] === "classes" && parts[1]) {
    if (parts[2] === "groups" && parts[3]) {
      return { name: "group", classId: parts[1], groupId: parts[3] };
    }
    return { name: "class", classId: parts[1] };
  }
  return { name: "home" };
}

export function classPath(classId) {
  return `#/classes/${classId}`;
}

export function groupPath(classId, groupId) {
  return `#/classes/${classId}/groups/${groupId}`;
}

export function inviteLink(code, origin = window.location.origin) {
  return `${origin}/#/join/${code}`;
}

export function navigate(path) {
  window.location.hash = path;
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
