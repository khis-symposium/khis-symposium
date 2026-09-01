import { Reveal } from "./Reveal";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  titleId,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  titleId?: string;
}) {
  const alignClass = align === "center" ? "items-center text-center mx-auto" : "items-start text-left";

  return (
    <Reveal className={`flex flex-col gap-4 ${alignClass}`}>
      <span className="eyebrow">{eyebrow}</span>
      <h2
        id={titleId}
        className="text-[clamp(1.75rem,3.2vw,2.75rem)] font-extrabold leading-[1.2] tracking-tight text-[var(--color-ink)]"
      >
        {title}
      </h2>
      <div className="rule-accent" />
      {description ? (
        <p className="max-w-2xl text-[16px] leading-[1.8] text-[var(--color-muted)]">{description}</p>
      ) : null}
    </Reveal>
  );
}
