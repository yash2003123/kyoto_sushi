import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/motion";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/dictionary";

/**
 * The €12 student band.
 *
 * A large share of the customer base studies in Leuven and this deal used to
 * be buried inside a category page, so it gets a full-width band of its own.
 * The price is the only element on the site allowed to be this large.
 */
export function StudentBand({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <section id="student" className="bg-kaki py-16 text-white sm:py-22">
      <div className="wrap grid items-center gap-8 md:grid-cols-[1.4fr_1fr] md:gap-12">
        <Reveal>
          <h2 className="font-display m-0 mb-3.5 text-[clamp(28px,4vw,44px)] font-bold">
            {dict.student.title}
          </h2>
          <p className="m-0 mb-6 max-w-[46ch] text-base opacity-92">{dict.student.body}</p>
          <ButtonLink href={`/${locale}/menu#student`} variant="ink">
            {dict.student.cta}
          </ButtonLink>
        </Reveal>

        <Reveal preset="rise" delay={0.1} distance={24}>
          <p className="font-display tabular m-0 text-left text-[clamp(72px,12vw,128px)] leading-[0.85] font-black tracking-[-0.02em] md:text-right">
            €12
            <span className="font-body mt-3.5 block text-[12px] font-medium tracking-[0.28em] uppercase opacity-85">
              {dict.student.per}
            </span>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
