export type NavItem = {
  href: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
};

export function isActivePath(pathname: string, href: string) {
  // href is like "/c/:companyId/dashboard" or "dashboard" depending on usage.
  // We treat it as active when pathname equals it or is nested under it.
  if (!pathname) return false;
  if (pathname === href) return true;
  if (pathname.startsWith(href.endsWith("/") ? href : href + "/")) return true;
  return false;
}
