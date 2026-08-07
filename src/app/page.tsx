import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
// import { DirectorGreeting } from "@/components/DirectorGreeting"; // 임시 숨김 처리 — 콘텐츠 준비되면 복원
import { EventOverview } from "@/components/EventOverview";
import { Program } from "@/components/Program";
import { Location } from "@/components/Location";
import { Registration } from "@/components/Registration";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main id="main">
        <Hero />
        {/* <DirectorGreeting /> 임시 숨김 처리 — 콘텐츠 준비되면 복원 */}
        <EventOverview />
        <Program />
        <Location />
        <Registration />
      </main>
      <Footer />
    </>
  );
}
