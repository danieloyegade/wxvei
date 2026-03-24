const protocolPattern = /^[a-z][a-z\d+\-.]*:/i;
const protocolRelativePattern = /^\/\//;
const normalizedBase = import.meta.env.BASE_URL === "/"
  ? ""
  : import.meta.env.BASE_URL.replace(/\/$/, "");

export const withBase = (path: string) => {
  if (!path || protocolPattern.test(path) || protocolRelativePattern.test(path) || path.startsWith("#")) {
    return path;
  }

  if (path === "/") {
    return normalizedBase ? `${normalizedBase}/` : "/";
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return normalizedBase ? `${normalizedBase}${normalizedPath}` : normalizedPath;
};

export const withoutBase = (pathname: string) => {
  if (!normalizedBase) {
    return pathname || "/";
  }

  if (pathname === normalizedBase) {
    return "/";
  }

  if (pathname.startsWith(`${normalizedBase}/`)) {
    return pathname.slice(normalizedBase.length) || "/";
  }

  return pathname || "/";
};
