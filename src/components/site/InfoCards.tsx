import { Section, SectionHead } from "@/components/ui/Section";
import { Stagger, StaggerItem } from "@/components/motion";
import { SERVICES, WEEK_ORDER, CLOSED_WEEKDAY, formatMinutes } from "@/lib/hours";
import type { Dictionary } from "@/lib/dictionary";
import { TodayHighlight } from "./TodayHighlight";

export function InfoCards({ dict }: { dict: Dictionary }) {
  const serviceLine = `${formatMinutes(SERVICES.lunch.open)}–${formatMinutes(
    SERVICES.lunch.close,
  )} · ${formatMinutes(SERVICES.dinner.open)}–${formatMinutes(SERVICES.dinner.close)}`;

  return (
    <Section id="info">
      <SectionHead title={dict.info.title} />

      <Stagger
        step={0.08}
        className="border-rule bg-rule grid gap-px border sm:grid-cols-2 lg:grid-cols-3"
      >
        <StaggerItem className="bg-ai px-7 py-8">
          <h3 className="text-moss m-0 mb-4.5 text-[11px] font-bold tracking-[0.28em] uppercase">
            {dict.info.hours}
          </h3>
          <ul className="m-0 list-none p-0 text-sm">
            {WEEK_ORDER.map((day) => (
              <li
                key={day}
                data-weekday={day}
                className="border-rule-soft flex justify-between gap-3 border-b py-1.5 last:border-b-0"
              >
                <span className="text-washi-dim">{dict.days[day]}</span>
                <span className={day === CLOSED_WEEKDAY ? "text-kaki" : "tabular"}>
                  {day === CLOSED_WEEKDAY ? dict.info.closed : serviceLine}
                </span>
              </li>
            ))}
          </ul>
          <TodayHighlight />
        </StaggerItem>

        <StaggerItem className="bg-ai px-7 py-8">
          <h3 className="text-moss m-0 mb-4.5 text-[11px] font-bold tracking-[0.28em] uppercase">
            {dict.info.find}
          </h3>
          <p className="m-0 mb-1.5 text-[15px]">Tiensestraat 239</p>
          <p className="m-0 mb-1.5 text-[15px]">3000 Leuven</p>
          <p className="mt-4 mb-1.5 text-[15px]">
            <a
              href="tel:+3216418548"
              className="border-rule hover:border-b-kaki border-b no-underline transition-colors duration-200"
            >
              016 41 85 48
            </a>
          </p>
          <p className="m-0 text-[15px]">
            <a
              href="https://maps.google.com/?q=Tiensestraat+239+3000+Leuven"
              target="_blank"
              rel="noreferrer"
              className="border-rule hover:border-b-kaki border-b no-underline transition-colors duration-200"
            >
              {dict.info.route}
            </a>
          </p>
          <Note>{dict.info.parking}</Note>
        </StaggerItem>

        <StaggerItem className="bg-ai px-7 py-8">
          <h3 className="text-moss m-0 mb-4.5 text-[11px] font-bold tracking-[0.28em] uppercase">
            {dict.info.before}
          </h3>
          <p className="m-0 text-[15px]">{dict.info.preptime}</p>
          <Note>{dict.info.sixty}</Note>
          <Note>{dict.info.allergens}</Note>
        </StaggerItem>
      </Stagger>
    </Section>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-washi-dim border-l-kaki mt-5 border-l-2 pl-3.5 text-[13px] leading-[1.55]">
      {children}
    </div>
  );
}
