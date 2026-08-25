import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
// import { DirectorGreeting } from "@/components/DirectorGreeting"; // 임시 숨김 처리 — 콘텐츠 준비되면 복원
import { EventOverview } from "@/components/EventOverview";
import { Program } from "@/components/Program";
import { Speakers } from "@/components/Speakers";
import { Location } from "@/components/Location";
import { Registration } from "@/components/Registration";
import { Footer } from "@/components/Footer";
import {
  SPEAKERS,
  SPEAKERS_PUBLISHED,
  SPEAKERS_VISIBLE,
} from "@/data/speakers";

export default function Home() {
  return (
    <>
      <Header showSpeakers={SPEAKERS_VISIBLE} />
      <main id="main">
        <Hero />
        {/* <DirectorGreeting /> 임시 숨김 처리 — 콘텐츠 준비되면 복원 */}
        <EventOverview />
        <Program />
        <Speakers published={SPEAKERS_PUBLISHED} speakers={SPEAKERS} />
        <Location />
        <Registration />
      </main>
      <Footer />
    </>
  );
}
