import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kyoto — Beheer",
  // Belt-and-braces alongside robots.ts: even if this URL is ever linked to
  // by accident, it should never show up in a search result.
  robots: { index: false, follow: false },
};

export default function BeheerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#F0EBE0] text-[#141412]">
      <div className="mx-auto max-w-[960px] px-5 py-8 sm:px-8">{children}</div>
    </div>
  );
}
