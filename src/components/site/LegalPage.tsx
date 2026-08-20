import { Reveal, Stagger, StaggerItem } from "@/components/motion";

export type LegalSection = { heading: string; body: string[] };

export function LegalPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <div className="wrap max-w-[68ch] py-14 sm:py-20">
      <Reveal onMount>
        <h1 className="font-display m-0 text-[clamp(28px,4vw,42px)] font-normal">{title}</h1>
        <p className="text-washi-dim mt-3">{intro}</p>
      </Reveal>

      <Stagger step={0.06} className="mt-10 flex flex-col gap-8">
        {sections.map((section) => (
          <StaggerItem key={section.heading}>
            <h2 className="text-moss m-0 mb-2 text-[11px] font-bold tracking-[0.28em] uppercase">
              {section.heading}
            </h2>
            {section.body.map((paragraph, index) => (
              <p key={index} className="m-0 mb-2 text-[15px] leading-relaxed">
                {paragraph}
              </p>
            ))}
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}
