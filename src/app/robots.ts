import type { MetadataRoute } from "next";

/**
 * `/beheer` is unlinked from anywhere on the site already, which keeps it out
 * of a casual visitor's path — but "unlinked" and "invisible to a crawler"
 * are different things, and a crawler that finds it and indexes it is a
 * search result away from a stranger finding the login page too. This is
 * belt-and-braces on top of that, not the actual security boundary — the
 * password is.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/beheer" },
  };
}
