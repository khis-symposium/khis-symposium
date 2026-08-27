import Image from "next/image";
import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr";
import {
  DETAILED_PROGRAM_ASSET,
  DETAILED_PROGRAM_PUBLISHED,
  getPublishedDetailedProgramAsset,
  type DetailedProgramAsset,
} from "@/data/detailed-program";
import { Reveal } from "./ui/Reveal";

type DetailedProgramProps = {
  published?: boolean;
  asset?: DetailedProgramAsset | null;
};

export function DetailedProgram({
  published = DETAILED_PROGRAM_PUBLISHED,
  asset = DETAILED_PROGRAM_ASSET,
}: DetailedProgramProps) {
  const publishedAsset = getPublishedDetailedProgramAsset(published, asset);
  if (!publishedAsset) return null;

  return (
    <section className="mt-16 border-t border-[var(--color-line)] pt-12" aria-labelledby="detailed-program-heading">
      <Reveal>
        <h3
          id="detailed-program-heading"
          className="text-[clamp(1.35rem,2.4vw,1.8rem)] font-extrabold leading-tight text-[var(--color-ink)]"
        >
          상세 프로그램
        </h3>
        <div className="rule-accent mt-3" />
      </Reveal>

      <Reveal delay={80} className="mt-8">
        <figure className="min-w-0 overflow-hidden rounded-[16px] border border-[var(--color-line)] bg-[var(--color-surface-2)] p-2 shadow-[var(--shadow-card)] sm:p-4">
          <Image
            src={publishedAsset.src}
            alt={publishedAsset.alt}
            width={publishedAsset.width}
            height={publishedAsset.height}
            sizes="(min-width: 1200px) 1120px, calc(100vw - 48px)"
            className="h-auto max-w-full object-contain"
            style={{ width: "100%", height: "auto" }}
          />
        </figure>
        <a
          href={publishedAsset.src}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex min-h-11 items-center gap-2 text-[15px] font-semibold text-[var(--color-cyan)] transition-colors hover:text-[var(--color-purple)]"
        >
          원본 이미지 크게 보기
          <ArrowSquareOut size={17} aria-hidden="true" />
        </a>
      </Reveal>
    </section>
  );
}
