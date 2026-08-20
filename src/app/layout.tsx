import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { siteUrl } from "@/lib/site";
import "@/styles/globals.css";

/**
 * Both faces are Japanese type designs rather than a Western pastiche of
 * Japanese lettering, which is the whole point.
 *
 * They are self-hosted subsets, not next/font/google, and that is a
 * performance decision rather than a preference. These families ship with
 * several hundred CJK subsets each; pulling them from Google meant 731
 * @font-face rules (174kB of render-blocking CSS, gzipped) and 8.2MB of font
 * downloads on first paint. The site needs Latin plus the twelve Japanese
 * characters in the noren and the course labels — 88kB across all six faces.
 *
 * Regenerate with `python3 scripts/subset-fonts.py <source-ttf-dir>` after
 * adding Japanese copy, or those glyphs will fall back to a system face.
 *
 * `display: swap` keeps text readable while the faces arrive, and
 * `adjustFontFallback` matches the fallback's metrics to the real face, so the
 * swap costs no layout shift.
 */
const display = localFont({
  src: [
    { path: "../fonts/ZenOldMincho-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/ZenOldMincho-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/ZenOldMincho-900.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-zen-old-mincho",
  display: "swap",
  adjustFontFallback: "Times New Roman",
  fallback: ["Georgia", "Times New Roman", "serif"],
});

const body = localFont({
  src: [
    { path: "../fonts/ZenKakuGothicNew-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/ZenKakuGothicNew-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/ZenKakuGothicNew-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-zen-kaku",
  display: "swap",
  adjustFontFallback: "Arial",
  fallback: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
});

// `siteUrl()` treats an empty string the same as unset — Vercel lets a
// variable exist with nothing typed into its value, which is "", not
// undefined, so `process.env.X ?? fallback` does NOT catch it and
// `new URL("")` throws. That is what broke this build.
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
};

export const viewport: Viewport = {
  themeColor: "#16233D",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // The font variables go on <html>, not <body>. The `--font-display` and
  // `--font-body` tokens are declared in @theme at :root, and a var() inside a
  // custom property is resolved where that property is declared — so with the
  // classes on <body> the lookup happens at :root, finds nothing, and every
  // heading silently falls back to system sans.
  return (
    <html className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        {/*
          Motion server-renders each reveal in its `hidden` state, which means
          opacity 0 sitting in the HTML. With scripting unavailable nothing
          would ever animate it back — a blank page for anyone whose bundle is
          blocked. This forces every animated element visible when JS never
          runs, so the menu and the phone number survive without it.
        */}
        <noscript>
          <style
            dangerouslySetInnerHTML={{
              __html:
                '[style*="opacity:0"],[style*="opacity: 0"]{opacity:1!important;transform:none!important}',
            }}
          />
        </noscript>
      </head>
      <body>{children}</body>
    </html>
  );
}
