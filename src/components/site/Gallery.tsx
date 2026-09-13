import Link from "next/link";
import { Reveal, RevealFrame, RevealImage, Stagger, StaggerItem } from "@/components/motion";
import { loadMenu, t, type CourseId } from "@/lib/menu";
import { getGalleryImage } from "@/lib/gallery-settings";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/dictionary";

/**
 * A warm, light band between the hero and the menu board.
 *
 * Each panel shows a large course kanji on a soft gradient by default — the
 * stand-in for real food photography, which the project brief flagged as not
 * shot yet. Once the admin panel has a real photo for a course, that panel
 * swaps to it automatically; courses without one keep the kanji treatment.
 * `RevealFrame`/`RevealImage` exist specifically for this — the doc comment
 * on RevealFrame calls it out as built for "food-photo slots that are
 * waiting on the shoot".
 */
const FEATURED: { course: CourseId; wash: string; glyph: string }[] = [
  { course: "sushi", wash: "from-kaki/22 via-kaki/8", glyph: "寿" },
  { course: "bowls", wash: "from-moss/25 via-moss/8", glyph: "丼" },
  { course: "drinks", wash: "from-ai/20 via-ai/6", glyph: "飲" },
];

export async function Gallery({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const menu = await loadMenu();
  const courseById = new Map(menu.courses.map((c) => [c.id, c]));
  const images = new Map(
    await Promise.all(
      FEATURED.map(async ({ course }) => [course, await getGalleryImage(course)] as const),
    ),
  );

  return (
    <section className="bg-washi text-sumi py-16 sm:py-22">
      <div className="wrap">
        <Reveal className="mb-10 flex flex-wrap items-baseline gap-x-5 gap-y-3">
          <h2 className="font-display m-0 text-[clamp(26px,3.2vw,36px)] font-bold">
            {dict.gallery.title}
          </h2>
          <span className="bg-moss/30 h-px min-w-10 flex-1 self-center" aria-hidden />
          <p className="text-sumi/60 m-0 max-w-[42ch] text-sm">{dict.gallery.sub}</p>
        </Reveal>

        <Stagger className="grid gap-4 sm:grid-cols-3" step={0.09}>
          {FEATURED.map(({ course, wash, glyph }, index) => {
            const data = courseById.get(course);
            if (!data) return null;
            const image = images.get(course);

            return (
              <StaggerItem key={course}>
                <Link
                  href={`/${locale}/#board`}
                  className="group border-rule/40 block h-full overflow-hidden border no-underline"
                >
                  {image ? (
                    <RevealImage
                      src={image.dataUrl}
                      alt={dict.courses[course]}
                      fill
                      unoptimized
                      sizes="(max-width: 640px) 100vw, 33vw"
                      frameClassName="relative aspect-[4/3]"
                      className="object-cover"
                      delay={index * 0.06}
                    />
                  ) : (
                    <RevealFrame
                      className={`relative flex aspect-[4/3] items-center justify-center bg-gradient-to-br ${wash} to-washi`}
                      delay={index * 0.06}
                    >
                      <span
                        aria-hidden
                        className="font-display text-sumi/12 group-hover:text-sumi/18 pointer-events-none text-[clamp(90px,13vw,150px)] leading-none font-black transition-colors duration-300"
                      >
                        {glyph}
                      </span>
                    </RevealFrame>
                  )}
                  <div className="px-4 py-3.5">
                    <span className="block text-[15px] font-medium">{dict.courses[course]}</span>
                    {data.categories[0] ? (
                      <span className="text-sumi/55 block text-[12.5px]">
                        {t(data.categories[0].name, locale)}
                      </span>
                    ) : null}
                  </div>
                </Link>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
