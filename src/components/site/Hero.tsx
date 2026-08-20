import { Noren } from "./Noren";
import { LiveStatus } from "./LiveStatus";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/dictionary";

export function Hero({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <section className="relative overflow-hidden pb-16 sm:pb-20">
      <Noren />

      {/* onMount, not on scroll: this is above the fold and a viewport
          trigger here just adds a flash before the animation starts. */}
      <Stagger onMount step={0.08} delay={0.35} className="wrap mt-12 text-center sm:mt-14">
        <StaggerItem as="p" className="text-moss m-0 mb-5 text-[11px] tracking-[0.4em] uppercase">
          {dict.hero.eyebrow}
        </StaggerItem>

        <StaggerItem
          as="h1"
          className="font-display mx-auto mb-5 max-w-[17ch] text-[clamp(34px,5.4vw,62px)] leading-[1.14] font-normal [&_em]:text-kaki [&_em]:not-italic"
        >
          {/* Copy is authored with a single <em> for the accent phrase. */}
          <span dangerouslySetInnerHTML={{ __html: dict.hero.title }} />
        </StaggerItem>

        <StaggerItem as="p" className="text-washi-dim mx-auto mb-8 max-w-[54ch] text-[17px]">
          {dict.hero.lede}
        </StaggerItem>

        <StaggerItem className="flex flex-wrap justify-center gap-3">
          <ButtonLink href={`/${locale}/menu`}>{dict.hero.cta1}</ButtonLink>
          <ButtonLink href={`/${locale}#board`} variant="ghost">
            {dict.hero.cta2}
          </ButtonLink>
        </StaggerItem>
      </Stagger>

      <div className="wrap text-center">
        <LiveStatus dict={dict} />
        <Reveal
          as="p"
          delay={0.15}
          className="text-moss mt-4 text-[11.5px] tracking-[0.22em] uppercase"
        >
          {dict.hero.direct}
        </Reveal>
      </div>
    </section>
  );
}
