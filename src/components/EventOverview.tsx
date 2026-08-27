import Image from "next/image";
import { Container } from "./ui/Container";

const OVERVIEW_ALT =
  "2026 한국보건의료정보원 연례 심포지엄. 연결에서 혁신으로, 보건의료 AI 디지털 전환의 미래. 2026년 9월 10일 목요일부터 11일 금요일까지 서울 강남 코엑스 컨퍼런스룸 401·402에서 개최.";

export function EventOverview() {
  return (
    <section
      id="overview"
      aria-labelledby="overview-heading"
      className="relative overflow-hidden section-pad"
    >
      <div
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "linear-gradient(135deg, #04081c 0%, #0a1f4a 55%, #123a70 100%)",
        }}
        aria-hidden
      />
      <div className="grain-overlay absolute inset-0 -z-10" aria-hidden />

      <Container>
        <h2 id="overview-heading" className="sr-only">
          행사 개요
        </h2>
        <Image
          src="/images/overview/event-overview.jpg"
          alt={OVERVIEW_ALT}
          width={3531}
          height={1878}
          sizes="(max-width: 767px) calc(100vw - 48px), (max-width: 1199px) calc(100vw - 80px), 1120px"
          className="block h-auto w-full object-contain"
        />
      </Container>
    </section>
  );
}
