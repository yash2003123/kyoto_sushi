import Link from "next/link";
import { Section, SectionHead } from "@/components/ui/Section";
import { Stagger, StaggerItem, Reveal } from "@/components/motion";
import { loadMenu, t, type CourseId } from "@/lib/menu";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/dictionary";

/**
 * The menu as a board.
 *
 * Five courses, each category rendered as a paper slip, the way an izakaya
 * pins its handwritten strips to the wall. The slips shift slightly on hover
 * like paper — a CSS transition, not Motion, because it is a plain hover state
 * on a large grid and there is no reason to mount a component per slip.
 *
 * Entry is staggered per course rather than across all fourteen slips at once,
 * so scrolling never waits on a long queue of delays.
 */
export function MenuBoard({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const menu = loadMenu();

  return (
    <Section id="board" className="bg-ai-deep">
      <SectionHead title={dict.board.title} sub={dict.board.sub} />

      {menu.courses.map((course) => (
        <div key={course.id} className="mb-11 last:mb-0">
          <Reveal className="text-kaki mb-4 flex items-baseline gap-3.5 text-[12px] tracking-[0.3em] uppercase">
            <span>{dict.courses[course.id as CourseId]}</span>
            <i className="font-display text-washi-dim text-[15px] tracking-[0.1em] not-italic">
              {course.kanji}
            </i>
          </Reveal>

          <Stagger
            step={0.05}
            className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-2"
          >
            {course.categories.map((category) => (
              <StaggerItem key={category.id} preset="rise">
                <Link
                  href={`/${locale}/menu#${category.id}`}
                  className="bg-washi text-sumi border-washi-dim hover:border-l-kaki block h-full border-l-[3px] px-3.5 pt-4 pb-5 text-[13.5px] leading-[1.35] font-medium no-underline transition-[transform,border-color,box-shadow] duration-200 ease-out hover:-translate-y-[3px] hover:-rotate-[0.7deg] hover:shadow-[0_10px_22px_rgba(0,0,0,.35)]"
                >
                  {t(category.name, locale)}
                  {category.note ? (
                    <span className="mt-2 block text-[10px] tracking-[0.2em] text-[#8C8878] uppercase">
                      {t(category.note, locale)}
                    </span>
                  ) : null}
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      ))}
    </Section>
  );
}
