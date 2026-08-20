"use client";

import { AnimatePresence, m } from "motion/react";
import { useDeferredValue, useMemo, useState } from "react";
import { MenuItemCard } from "./MenuItemCard";
import { t, type CourseId, type Menu } from "@/lib/menu";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/dictionary";
import { Stagger, StaggerItem, duration, ease, spring } from "@/components/motion";

/**
 * The full menu, filterable by course and searchable.
 *
 * The order path is the product, so this page is built for speed of decision:
 * course filter, live search, add without leaving the list. Filtering swaps
 * content with a short crossfade rather than a layout animation across
 * hundreds of cards, which would be the expensive way to do it.
 */
export function MenuBrowser({
  menu,
  locale,
  dict,
}: {
  menu: Menu;
  locale: Locale;
  dict: Dictionary;
}) {
  const [course, setCourse] = useState<string>("all");
  const [query, setQuery] = useState("");
  // Keeps typing responsive: the list re-filters at React's leisure.
  const deferredQuery = useDeferredValue(query);

  const courses = useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase();

    return menu.courses
      .filter((c) => course === "all" || c.id === course)
      .map((c) => ({
        ...c,
        categories: c.categories
          .map((category) => ({
            ...category,
            items: needle
              ? category.items.filter((item) =>
                  `${t(item.name, locale)} ${t(item.desc, locale)}`
                    .toLowerCase()
                    .includes(needle),
                )
              : category.items,
          }))
          .filter((category) => category.items.length > 0),
      }))
      .filter((c) => c.categories.length > 0);
  }, [menu, course, deferredQuery, locale]);

  const filters: { id: string; label: string }[] = [
    { id: "all", label: dict.menu.filterAll },
    ...menu.courses.map((c) => ({ id: c.id, label: dict.courses[c.id as CourseId] })),
  ];

  return (
    <>
      <div className="border-rule bg-ai/90 sticky top-[60px] z-30 -mx-6 mb-8 border-b px-6 py-3 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-2">
          {filters.map((filter) => {
            const active = filter.id === course;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setCourse(filter.id)}
                aria-pressed={active}
                className={`relative border px-3.5 py-1.5 text-[11.5px] tracking-[0.12em] uppercase transition-colors duration-200 ${
                  active ? "border-kaki text-white" : "border-rule text-washi-dim hover:text-washi"
                }`}
              >
                {active ? (
                  <m.span
                    layoutId="course-filter"
                    className="bg-kaki absolute inset-0 -z-10"
                    transition={spring.panel}
                  />
                ) : null}
                {filter.label}
              </button>
            );
          })}

          <label className="ml-auto flex min-w-[180px] flex-1 items-center sm:flex-none">
            <span className="sr-only">{dict.menu.search}</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={dict.menu.search}
              className="border-rule placeholder:text-washi-dim/60 focus:border-kaki w-full border bg-transparent px-3 py-1.5 text-sm transition-colors duration-200 outline-none"
            />
          </label>
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <m.div
          key={`${course}|${deferredQuery}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: duration.fast, ease: ease.out }}
        >
          {courses.length === 0 ? (
            <p className="text-washi-dim py-20 text-center">{dict.menu.searchEmpty}</p>
          ) : (
            courses.map((c) => (
              <section key={c.id} className="mb-14 last:mb-0">
                <h2 className="text-kaki mb-6 flex items-baseline gap-3.5 text-[12px] tracking-[0.3em] uppercase">
                  {dict.courses[c.id as CourseId]}
                  <i className="font-display text-washi-dim text-[15px] tracking-[0.1em] not-italic">
                    {c.kanji}
                  </i>
                  <span className="bg-rule h-px flex-1" aria-hidden />
                </h2>

                {c.categories.map((category) => (
                  <div key={category.id} id={category.id} className="mb-10 scroll-mt-32">
                    <h3 className="font-display m-0 mb-1 text-[19px] font-bold">
                      {t(category.name, locale)}
                    </h3>
                    {category.note ? (
                      <p className="text-washi-dim m-0 mb-4 text-[12.5px] tracking-[0.14em] uppercase">
                        {t(category.note, locale)}
                      </p>
                    ) : (
                      <div className="mb-4" />
                    )}

                    <Stagger
                      step={0.05}
                      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
                    >
                      {category.items.map((item) => (
                        <StaggerItem key={item.id} preset="rise" className="h-full">
                          <MenuItemCard item={item} locale={locale} dict={dict} />
                        </StaggerItem>
                      ))}
                    </Stagger>
                  </div>
                ))}
              </section>
            ))
          )}
        </m.div>
      </AnimatePresence>
    </>
  );
}
