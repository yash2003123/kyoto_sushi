import Link from "next/link";
import { Reveal } from "@/components/motion";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/dictionary";

export function Footer({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <footer className="border-rule text-washi-dim border-t py-10 text-[12.5px]">
      <Reveal className="wrap flex flex-wrap items-center justify-between gap-5">
        <span>Kyoto · Tiensestraat 239, 3000 Leuven · BTW BE 0847.251.943</span>
        <span className="flex flex-wrap items-center gap-2">
          <a
            href="https://www.facebook.com/"
            target="_blank"
            rel="noreferrer"
            className="border-rule hover:border-b-kaki border-b no-underline transition-colors duration-200"
          >
            Facebook
          </a>
          <span aria-hidden>·</span>
          <Link
            href={`/${locale}/terms`}
            className="border-rule hover:border-b-kaki border-b no-underline transition-colors duration-200"
          >
            {dict.foot.terms}
          </Link>
          <span aria-hidden>·</span>
          <Link
            href={`/${locale}/privacy`}
            className="border-rule hover:border-b-kaki border-b no-underline transition-colors duration-200"
          >
            {dict.foot.privacy}
          </Link>
        </span>
      </Reveal>
      <p className="wrap text-moss mt-4 text-[11.5px] tracking-[0.14em] uppercase">
        {dict.foot.tagline}
      </p>
    </footer>
  );
}
