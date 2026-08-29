import Image from "next/image";

const PROGRAM_ALT =
  "2026 한국보건의료정보원 연례 심포지엄 전체 프로그램 일정표. 9월 10일과 11일, 코엑스 401호·402호의 세션별 시간, 발표와 토론 일정.";

export function Program() {
  return (
    <section
      id="program"
      aria-labelledby="program-heading"
      className="m-0 scroll-mt-24 p-0"
    >
      <h2 id="program-heading" className="sr-only">
        프로그램
      </h2>
      <Image
        src="/images/program/program-schedule-new-new.jpg"
        alt={PROGRAM_ALT}
        width={1191}
        height={5329}
        sizes="100vw"
        className="block h-auto w-full object-contain"
      />
    </section>
  );
}
