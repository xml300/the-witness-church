export const PAGES = [
  { id: "home", label: "Homepage", path: "/" },
  { id: "about", label: "About Us", path: "/about" },
  { id: "connect", label: "Connect", path: "/connect" },
  { id: "events", label: "Events", path: "/events" },
  { id: "sermons", label: "Sermons", path: "/sermons" },
  { id: "games", label: "Games", path: "/games" },
] as const;

export type PageId = (typeof PAGES)[number]["id"];

export const isPageId = (v: unknown): v is PageId =>
  PAGES.some((p) => p.id === v);
