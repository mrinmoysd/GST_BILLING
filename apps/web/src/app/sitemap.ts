import type { MetadataRoute } from "next";

const publicRoutes = [
  "",
  "/features",
  "/pricing",
  "/about",
  "/contact",
  "/help",
  "/security",
  "/demo",
  "/privacy",
  "/terms",
  "/login",
  "/onboarding",
  "/forgot-password",
  "/reset-password",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://example.com";

  return publicRoutes.map((route) => ({
    url: `${base}${route || "/"}`,
    lastModified: new Date("2026-03-22"),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
