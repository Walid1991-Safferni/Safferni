export const PAGE_TO_PATH = {
  home: "/",
  login: "/login",
  profile: "/profile",
  apply: "/apply",
  admin: "/admin",
  driver: "/driver",
  manager: "/manager",
  drivers: "/drivers",
  pricing: "/pricing",
  contact: "/contact",
};

export const PATH_TO_PAGE = Object.fromEntries(
  Object.entries(PAGE_TO_PATH).map(([k, v]) => [v, k])
);

export const getPageFromPath = () => PATH_TO_PAGE[window.location.pathname] || "home";
