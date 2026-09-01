import assert from "node:assert/strict";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadModule(file) {
  const source = fs.readFileSync(path.join(repo, file), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const compiledExports = {};
  new Function("exports", "require", compiled)(compiledExports, () => {
    throw new Error("Unexpected import");
  });
  return compiledExports;
}

const speakersData = loadModule(path.join("src", "data", "speakers.ts"));
const constants = loadModule(path.join("src", "lib", "constants.ts"));

const expectedAppearances = [
  ["speaker-001", "day1", "day1-opening", "개회식", "기조연설", "백롱민", "국가통합바이오빅데이터사업단", "단장", "/images/speakers/speaker-001.png", "백롱민 연사 사진"],
  ["speaker-002", "day1", "day1-track1-a1", "국가통합바이오빅데이터, 국민건강을 위한 데이터 기반을 만들다", "좌장", "양성일", "분당서울대병원", "교수", "/images/speakers/speaker-002.png", "양성일 연사 사진"],
  ["speaker-003", "day1", "day1-track1-a1", "국가통합바이오빅데이터, 국민건강을 위한 데이터 기반을 만들다", "발표자", "박정환", "보건복지부", "과장", "", ""],
  ["speaker-004", "day1", "day1-track1-a1", "국가통합바이오빅데이터, 국민건강을 위한 데이터 기반을 만들다", "발표자", "김종덕", "한국보건의료정보원", "센터장", "", ""],
  ["speaker-005", "day1", "day1-track1-a1", "국가통합바이오빅데이터, 국민건강을 위한 데이터 기반을 만들다", "발표자", "정해영", "국가생명연구자원정보센터", "센터장", "/images/speakers/speaker-005.png", "정해영 연사 사진"],
  ["speaker-006", "day1", "day1-track1-a1", "국가통합바이오빅데이터, 국민건강을 위한 데이터 기반을 만들다", "토론자", "정윤빈", "세브란스병원", "교수", "/images/speakers/speaker-006.jpg", "정윤빈 연사 사진"],
  ["speaker-007", "day1", "day1-track1-a1", "국가통합바이오빅데이터, 국민건강을 위한 데이터 기반을 만들다", "토론자", "정재균", "서울대학교병원", "교수", "/images/speakers/speaker-007.png", "정재균 연사 사진"],
  ["speaker-008", "day1", "day1-track1-a2", "국가통합바이오빅데이터, 데이터 활용으로 국민건강의 미래를 열다", "좌장", "이영성", "대한민국의학한림원", "교수", "", ""],
  ["speaker-009", "day1", "day1-track1-a2", "국가통합바이오빅데이터, 데이터 활용으로 국민건강의 미래를 열다", "발표자", "이상아", "강원대학교", "교수", "/images/speakers/speaker-009.png", "이상아 연사 사진"],
  ["speaker-010", "day1", "day1-track1-a2", "국가통합바이오빅데이터, 데이터 활용으로 국민건강의 미래를 열다", "발표자", "김치경", "고려대학교 구로병원", "교수", "", ""],
  ["speaker-011", "day1", "day1-track1-a2", "국가통합바이오빅데이터, 데이터 활용으로 국민건강의 미래를 열다", "발표자", "이승복", "서울대학교병원", "교수", "/images/speakers/speaker-011.jpg", "이승복 연사 사진"],
  ["speaker-012", "day1", "day1-track1-a2", "국가통합바이오빅데이터, 데이터 활용으로 국민건강의 미래를 열다", "발표자", "Ben Lacey", "UKbioBank", "-", "", ""],
  ["speaker-013", "day1", "day1-track1-a2", "국가통합바이오빅데이터, 데이터 활용으로 국민건강의 미래를 열다", "토론자", "김미영", "한국1혈당뇨병환우회", "대표", "/images/speakers/speaker-013.png", "김미영 연사 사진"],
  ["speaker-014", "day1", "day1-track1-a2", "국가통합바이오빅데이터, 데이터 활용으로 국민건강의 미래를 열다", "토론자", "김태형", "바이오넥서스", "대표", "", ""],
  ["speaker-015", "day1", "day1-track1-a3", "의료 AI 생태계 구축", "좌장", "조경희", "국민건강보험 일산병원", "교수", "/images/speakers/speaker-015.png", "조경희 연사 사진"],
  ["speaker-016", "day1", "day1-track1-a3", "의료 AI 생태계 구축", "발표자/토론자", "김태훈", "인프메딕스", "메디컬AI연구소장", "", ""],
  ["speaker-017", "day1", "day1-track1-a3", "의료 AI 생태계 구축", "발표자/토론자", "신현웅", "한국보건사회연구원", "실장", "", ""],
  ["speaker-018", "day1", "day1-track1-a3", "의료 AI 생태계 구축", "발표자/토론자", "차원철", "삼성서울병원/국가AI전략위원회", "교수", "/images/speakers/speaker-018.png", "차원철 연사 사진"],
  ["speaker-019", "day2", "day2-track1-a4", "의료데이터 표준의 현장 활용과 확산 (대한의료정보학회 합동세션)", "발표자", "이영희", "대한의료정보학회/서울대학교", "부교수", "/images/speakers/speaker-019.jpg", "이영희 연사 사진"],
  ["speaker-020", "day2", "day2-track1-a4", "의료데이터 표준의 현장 활용과 확산 (대한의료정보학회 합동세션)", "발표자", "윤덕용", "연세대학교", "부교수", "/images/speakers/speaker-020.jpg", "윤덕용 연사 사진"],
  ["speaker-021", "day2", "day2-track1-a4", "의료데이터 표준의 현장 활용과 확산 (대한의료정보학회 합동세션)", "발표자", "이수현", "가천대학교", "부교수", "/images/speakers/speaker-021.png", "이수현 연사 사진"],
  ["speaker-022", "day2", "day2-track1-a5", "표준 기반 의료데이터 상호운용성 구현체계", "발표자", "권애경", "한국보건의료정보원", "단장", "", ""],
  ["speaker-023", "day2", "day2-track1-a5", "표준 기반 의료데이터 상호운용성 구현체계", "발표자", "정세영", "분당서울대학교병원", "정보화실장", "/images/speakers/speaker-023.png", "정세영 연사 사진"],
  ["speaker-024", "day2", "day2-track1-a5", "표준 기반 의료데이터 상호운용성 구현체계", "발표자", "박현애", "헬스오앤티", "대표", "/images/speakers/speaker-024.png", "박현애 연사 사진"],
  ["speaker-025", "day2", "day2-track1-a5", "표준 기반 의료데이터 상호운용성 구현체계", "발표자", "김영학", "서울아산병원 디지털정보혁신본부", "교수", "/images/speakers/speaker-025.png", "김영학 연사 사진"],
  ["speaker-026", "day2", "day2-track1-a6", "AI시대 글로벌 보건의료 표준과 상호운용성 전략", "좌장", "양광모", "삼성서울병원", "교수", "/images/speakers/speaker-026.jpg", "양광모 연사 사진"],
  ["speaker-027", "day2", "day2-track1-a6", "AI시대 글로벌 보건의료 표준과 상호운용성 전략", "발표자", "Eric Sutherland", "OECD", "Senior Health Economist and Digital Health Lead", "/images/speakers/speaker-027.png", "Eric Sutherland 연사 사진"],
  ["speaker-028", "day2", "day2-track1-a6", "AI시대 글로벌 보건의료 표준과 상호운용성 전략", "발표자", "Robert Jakob", "WHO-FIC", "Head of Unit", "/images/speakers/speaker-028.png", "Robert Jakob 연사 사진"],
  ["speaker-029", "day2", "day2-track1-a6", "AI시대 글로벌 보건의료 표준과 상호운용성 전략", "발표자", "Rory Davidson", "SNOMED International", "Chief Digital Information Officer", "/images/speakers/speaker-029.png", "Rory Davidson 연사 사진"],
  ["speaker-030", "day2", "day2-track1-a6", "AI시대 글로벌 보건의료 표준과 상호운용성 전략", "토론자", "권용진", "보건복지부 의료인공지능데이터정책과", "사무관", "", ""],
  ["speaker-031", "day2", "day2-track1-a6", "AI시대 글로벌 보건의료 표준과 상호운용성 전략", "토론자", "김종엽", "대한의료정보학회", "이사장", "/images/speakers/speaker-031.jpg", "김종엽 연사 사진"],
  ["speaker-032", "day2", "day2-track1-a6", "AI시대 글로벌 보건의료 표준과 상호운용성 전략", "토론자", "차동철", "네이버헬스케어", "센터장", "/images/speakers/speaker-032.jpg", "차동철 연사 사진"],
  ["speaker-033", "day2", "day2-track1-a6", "AI시대 글로벌 보건의료 표준과 상호운용성 전략", "토론자", "박현선", "건강보험심사평가원", "상근위원", "/images/speakers/speaker-033.png", "박현선 연사 사진"],
  ["speaker-034", "day2", "day2-track1-a6", "AI시대 글로벌 보건의료 표준과 상호운용성 전략", "토론자", "최지현", "한겨례신문", "기자", "/images/speakers/speaker-034.jpg", "최지현 연사 사진"],
  ["speaker-035", "day1", "day1-track2-b1", "디지털 보건의료정보 플랫폼 국민 중심 의료의 새로운 시작", "좌장", "김일곤", "대한의료정보학회", "회장", "/images/speakers/speaker-035.png", "김일곤 연사 사진"],
  ["speaker-036", "day1", "day1-track2-b1", "디지털 보건의료정보 플랫폼 국민 중심 의료의 새로운 시작", "발표자/토론자", "박나영", "한국보건사회연구원", "부연구위원", "/images/speakers/speaker-036.png", "박나영 연사 사진"],
  ["speaker-037", "day1", "day1-track2-b1", "디지털 보건의료정보 플랫폼 국민 중심 의료의 새로운 시작", "발표자/토론자", "강준원", "대한영상의학회(서울아산병원)", "교수", "/images/speakers/speaker-037.png", "강준원 연사 사진"],
  ["speaker-038", "day1", "day1-track2-b1", "디지털 보건의료정보 플랫폼 국민 중심 의료의 새로운 시작", "발표자/토론자", "방민호", "한국보건의료정보원", "단장", "/images/speakers/speaker-038.png", "방민호 연사 사진"],
  ["speaker-039", "day1", "day1-track2-b1", "디지털 보건의료정보 플랫폼 국민 중심 의료의 새로운 시작", "토론자", "최병관", "부산대학교병원", "교수", "", ""],
  ["speaker-040", "day1", "day1-track2-b1", "디지털 보건의료정보 플랫폼 국민 중심 의료의 새로운 시작", "토론자", "김준현", "레몬헬스케어", "부사장", "/images/speakers/speaker-040.jpg", "김준현 연사 사진"],
  ["speaker-041", "day1", "day1-track2-b1", "디지털 보건의료정보 플랫폼 국민 중심 의료의 새로운 시작", "토론자", "서영희", "평화이즈", "부장", "/images/speakers/speaker-041.png", "서영희 연사 사진"],
  ["speaker-042", "day1", "day1-track2-b2", "보건의료데이터 인프라 혁신", "좌장", "이호영", "서울대학교병원", "교수", "/images/speakers/speaker-042.jpg", "이호영 연사 사진"],
  ["speaker-043", "day1", "day1-track2-b2", "보건의료데이터 인프라 혁신", "발표자/토론자", "황희", "카카오헬스케어", "대표이사", "/images/speakers/speaker-043.jpg", "황희 연사 사진"],
  ["speaker-044", "day1", "day1-track2-b2", "보건의료데이터 인프라 혁신", "발표자/토론자", "최인영", "가톨릭중앙의료원", "교수", "", ""],
  ["speaker-045", "day1", "day1-track2-b2", "보건의료데이터 인프라 혁신", "발표자/토론자", "강미라", "삼성서울병원", "교수", "/images/speakers/speaker-045.jpg", "강미라 연사 사진"],
  ["speaker-047", "day1", "day1-track2-b3", "빅데이터 기반의 미래 질병 대응 전략", "좌장", "이상원", "국제백신연구소", "근거기반보건전략관", "/images/speakers/speaker-047.png", "이상원 연사 사진"],
  ["speaker-048", "day1", "day1-track2-b3", "빅데이터 기반의 미래 질병 대응 전략", "발표자/토론자", "박종현", "질병관리청", "사무관", "/images/speakers/speaker-048.png", "박종현 연사 사진"],
  ["speaker-049", "day1", "day1-track2-b3", "빅데이터 기반의 미래 질병 대응 전략", "발표자/토론자", "김진명", "질병관리청", "사무관", "/images/speakers/speaker-049.png", "김진명 연사 사진"],
  ["speaker-050", "day1", "day1-track2-b3", "빅데이터 기반의 미래 질병 대응 전략", "발표자/토론자", "박도현", "질병관리청", "사무관", "/images/speakers/speaker-050.png", "박도현 연사 사진"],
  ["speaker-051", "day1", "day1-track2-b3", "빅데이터 기반의 미래 질병 대응 전략", "토론자", "여나금", "한국보건사회연구원", "연구위원", "", ""],
  ["speaker-052", "day1", "day1-track2-b3", "빅데이터 기반의 미래 질병 대응 전략", "토론자", "김주원", "원주세브란스병원", "교수", "", ""],
  ["speaker-053", "day2", "day2-track2-b4", "의료 데이터 품질과 상호운용성 확대를 통한 진료 품질 향상", "발표자", "이유라", "서울아산병원", "교수", "/images/speakers/speaker-053.png", "이유라 연사 사진"],
  ["speaker-054", "day2", "day2-track2-b4", "의료 데이터 품질과 상호운용성 확대를 통한 진료 품질 향상", "발표자", "이의선", "환자안전학회", "이사장", "", ""],
  ["speaker-055", "day2", "day2-track2-b4", "의료 데이터 품질과 상호운용성 확대를 통한 진료 품질 향상", "발표자", "고태훈", "가톨릭대학교", "교수", "/images/speakers/speaker-055.png", "고태훈 연사 사진"],
  ["speaker-056", "day2", "day2-track2-b5", "AI 시대 신뢰받는 보건의료데이터 활용 방향", "좌장", "이영호", "가천대학교", "교수", "/images/speakers/speaker-056.png", "이영호 연사 사진"],
  ["speaker-057", "day2", "day2-track2-b5", "AI 시대 신뢰받는 보건의료데이터 활용 방향", "발표자", "김유진", "한국보건의료정보원", "선임", "/images/speakers/speaker-057.png", "김유진 연사 사진"],
  ["speaker-058", "day2", "day2-track2-b5", "AI 시대 신뢰받는 보건의료데이터 활용 방향", "발표자/토론자", "전나경", "부산대학교", "조교수", "/images/speakers/speaker-058.jpg", "전나경 연사 사진"],
  ["speaker-059", "day2", "day2-track2-b5", "AI 시대 신뢰받는 보건의료데이터 활용 방향", "발표자/토론자", "정재균", "서울대학교병원 헬스케어 AI연구소", "교수", "/images/speakers/speaker-059.png", "정재균 연사 사진"],
  ["speaker-060", "day2", "day2-track2-b5", "AI 시대 신뢰받는 보건의료데이터 활용 방향", "발표자", "최민성", "LG AI Research", "책임", "/images/speakers/speaker-060.jpg", "최민성 연사 사진"],
  ["speaker-061", "day2", "day2-track2-b5", "AI 시대 신뢰받는 보건의료데이터 활용 방향", "토론자", "윤재성", "보건복지부 의료인공지능데이터정책과", "사무관", "", ""],
  ["speaker-062", "day2", "day2-track2-b5", "AI 시대 신뢰받는 보건의료데이터 활용 방향", "토론자", "정집민", "한국보건의료정보원", "단장", "", ""],
  ["speaker-063", "day2", "day2-track2-b6", "디지털헬스, 미래를 위한 정책을 말하다 (미디어‧정책 세션)", "좌장", "이은정", "KBS", "회장", "/images/speakers/speaker-063.jpg", "이은정 연사 사진"],
  ["speaker-064", "day2", "day2-track2-b6", "디지털헬스, 미래를 위한 정책을 말하다 (미디어‧정책 세션)", "발표자", "김재선", "동국대학교", "교수", "/images/speakers/speaker-064.png", "김재선 연사 사진"],
  ["speaker-065", "day2", "day2-track2-b6", "디지털헬스, 미래를 위한 정책을 말하다 (미디어‧정책 세션)", "발표자", "정형선", "연세대학교", "교수", "", ""],
  ["speaker-066", "day2", "day2-track2-b6", "디지털헬스, 미래를 위한 정책을 말하다 (미디어‧정책 세션)", "발표자", "박유랑", "연세대학교", "부교수", "/images/speakers/speaker-066.png", "박유랑 연사 사진"],
  ["speaker-067", "day2", "day2-track2-b6", "디지털헬스, 미래를 위한 정책을 말하다 (미디어‧정책 세션)", "토론자", "조민규", "지디넷코리아", "팀장", "/images/speakers/speaker-067.jpg", "조민규 연사 사진"],
  ["speaker-068", "day2", "day2-track2-b6", "디지털헬스, 미래를 위한 정책을 말하다 (미디어‧정책 세션)", "토론자", "조동찬", "한양대학교", "교수", "/images/speakers/speaker-068.png", "조동찬 연사 사진"],
].map(
  ([id, dayId, sessionId, sessionTitle, role, name, affiliation, title, imageSrc, imageAlt]) => ({
    id,
    dayId,
    sessionId,
    sessionTitle,
    role,
    name,
    affiliation,
    title,
    imageSrc,
    imageAlt,
  })
);

const expectedImages = [
  ["speaker-001.png", "image/png", 800, 1200, 1284781, "e0d93e4feb0e16ad54936abc752cc89a321413c7e29601731c1d04d3c1f9fdc7"],
  ["speaker-002.png", "image/png", 167, 215, 88856, "207f173cbd009231e6a9e9ad4682484d0856c71bfd6af98811bc839e7c7ad572"],
  ["speaker-005.png", "image/png", 860, 1146, 1892373, "2942ab8ab2a07f801c538a76d3029f9d8993e248618fd0ee748983045078472b"],
  ["speaker-006.jpg", "image/jpeg", 413, 531, 58567, "838154aeaa3ae0c4fe44d7670f6f20c57fdd435799ebc9b429d435982ac0397f"],
  ["speaker-007.png", "image/png", 238, 272, 86132, "5c58141e1d2caaea6e6a56b090a7ca0190899c00e8bf89b3468307bd9875c02d"],
  ["speaker-009.png", "image/png", 247, 275, 152213, "307e9fac0ff0e315a8da0f6dbe18fd9eb71b6d992778a48456529e7a3ae302a3"],
  ["speaker-011.jpg", "image/jpeg", 856, 1200, 159167, "41757f1d931ef5111ae25dd26593947c8e7297e2a4b483092bdd41003a919fb4"],
  ["speaker-013.png", "image/png", 947, 1200, 1813182, "eb6b4746e8146d567aaef0e7042f4eb6d665d6a9afafab3d5bb651c23fb40da3"],
  ["speaker-015.png", "image/png", 191, 261, 104803, "5bd45002d71ad5e054a2ed6c829a48567e94aeed8f5897c9f64515cc47f0a821"],
  ["speaker-018.png", "image/png", 251, 284, 112672, "d19b8fe02d4b65918b8abd91b52b12e1ae394e03620525da9a1a347e3cff92ee"],
  ["speaker-019.jpg", "image/jpeg", 960, 1200, 211504, "aae4cdd2694b9082835c46a7807cbc1fd979b2da2d6d8693df42614e69845aed"],
  ["speaker-020.jpg", "image/jpeg", 858, 1200, 136091, "58d8de4a86ad48eca748afb81537d44486e97a453f59cc1341bb3e17385afe27"],
  ["speaker-021.png", "image/png", 232, 276, 84596, "1f4a61a2d24a91412e67f2b3f3b2928bec65d2d6db63ca6e8f695a68f0aa0ce0"],
  ["speaker-023.png", "image/png", 722, 827, 828224, "4f17226e3255be8e07762098941fa27b30a1ceb9d8d22796ad61faf220a5adf2"],
  ["speaker-024.png", "image/png", 793, 879, 899536, "520330954874d3c52f344e2fc80a6c6686ef3cc858f9298c12522c249890c2e1"],
  ["speaker-025.png", "image/png", 1163, 1200, 2267119, "a8618b22604ea88a73245bdcad14772e5199001050aa928bf11e34aef7c56e8e"],
  ["speaker-026.jpg", "image/jpeg", 413, 531, 50667, "35036d10d1137636f4fa338e5446d25497f18c7455359159eb35e274721407f8"],
  ["speaker-027.png", "image/png", 470, 428, 226179, "9cbcf6d6ae6b7ed0a93bf9369648dc6aeb9f35429c6f664820482095b0b8e26b"],
  ["speaker-028.png", "image/png", 496, 461, 474066, "4647fb6e7d090a8620263e3f2a971330b85f88584bfb338ec8d0b9a25c4e1fad"],
  ["speaker-029.png", "image/png", 460, 591, 546552, "fb77cd2318357623f078705bb1bac5c4ed7265c793f174b84270fdc9c06b8257"],
  ["speaker-031.jpg", "image/jpeg", 900, 1200, 210522, "eb2c2c64617a02e5fba3cebcea1ff61e5683141e8f5960d8ec131dc3e7443ae5"],
  ["speaker-032.jpg", "image/jpeg", 585, 731, 95981, "920f085e52cb0e367f3c07b65f9a6e98cc558d6e49ac6f26d2b2cbf3decbe00d"],
  ["speaker-033.png", "image/png", 591, 683, 501302, "d684c961eab73def137e75bc61f75058170dd2b29f8862cb997fece643dcdac1"],
  ["speaker-034.jpg", "image/jpeg", 354, 472, 48127, "70e531fecfa3a7e59a7165f3056d689cc6e5c1b53e8161373dbf86c04caa3816"],
  ["speaker-035.png", "image/png", 279, 271, 120128, "9c81d60dfb1efcf4a628fe96efe8e8cc008bd82b132d2294701c197a8018ae86"],
  ["speaker-036.png", "image/png", 213, 275, 108870, "45ae7a3b69f99591ebc7452149a387a785d1c0f94b32398d56fb0d214ea30208"],
  ["speaker-037.png", "image/png", 511, 658, 634936, "f56c12363dc5327bff462ea48f6b6ec862b4d2c12490d2b13009187387194f10"],
  ["speaker-038.png", "image/png", 173, 228, 66976, "dc59c9ba0099dfbbbad716238e634505e263f4233e17ee05e4a2661ba1670a48"],
  ["speaker-040.jpg", "image/jpeg", 496, 638, 61213, "d16897dd2f9039874507315eb188c2a5a178e087d3ea923d8ee383a4923a79c4"],
  ["speaker-041.png", "image/png", 486, 517, 269115, "2582dd4eb4d6d3990e97150ef242fac88f8dc4c54cbab2e1ec82107764da4a5f"],
  ["speaker-042.jpg", "image/jpeg", 900, 1200, 131652, "d95c86c1253eba4c18c23f22c323c05cfcd87b1d8f14971109cfb3c157579749"],
  ["speaker-043.jpg", "image/jpeg", 800, 1200, 132007, "d8ce4b645864c70364c3cdd558125d2780e2facd99ef2e7f5e70a7f519be49bf"],
  ["speaker-045.jpg", "image/jpeg", 1043, 1200, 190730, "1134ff1a077df5b3d7efb7e50c376f861f69d95aba681e82e6e0b406d087473e"],
  ["speaker-047.png", "image/png", 202, 280, 112884, "e5feeb31a2101c98df22bef0c33ee2ff8dbedfa6ae85ac017a25852f098a312c"],
  ["speaker-048.png", "image/png", 252, 322, 134657, "f84330b40561cbe2fcd4691d76b0e4a5245a2fe2daca2da8d9dd42b3c956131f"],
  ["speaker-049.png", "image/png", 264, 350, 218632, "8538502ac75fd71abd49059578468eba76cb187f665e1ac8c42f50569840cb56"],
  ["speaker-050.png", "image/png", 258, 361, 98035, "20f3ee6ad3e54ec464dc8b88bacce2c608a7af6eb5038371bddfe45e34ca44f3"],
  ["speaker-053.png", "image/png", 957, 1125, 2056274, "30ea98db74811e891aa6276fe8913254f9e13f2a17c7247bcdd26b067c031e4d"],
  ["speaker-055.png", "image/png", 1036, 1200, 1641355, "aa1cfe27b22f29d37d680d557c6ca024cb9ffc29d3d1f4558ca4d2736f9e9bf5"],
  ["speaker-056.png", "image/png", 354, 472, 277556, "6086cdba23e326f65f8f7a46652d25ebf620850c54a59cf0667fdbcea33fc853"],
  ["speaker-057.png", "image/png", 1000, 1200, 2051835, "48f35fadd287cf814721ecfc3eead9c6e524e479261d177fbd2d477d4c86d7b5"],
  ["speaker-058.jpg", "image/jpeg", 934, 1200, 185513, "953441be04ffab1cd325f9519249b9c0a0396ba57b95c66c0bb6f54553ef81bc"],
  ["speaker-059.png", "image/png", 457, 517, 288506, "c71f99fe056b6af8cc6ecb3858b8d57414d0a4d224b6969d5059ef815cb05b58"],
  ["speaker-060.jpg", "image/jpeg", 933, 1200, 151053, "2da71a25044ef94f341e7d02dea9a442e2ee8832c0648d76869173f4a8bdf9d2"],
  ["speaker-063.jpg", "image/jpeg", 800, 1200, 173060, "4096f41985f12c39162f8c42ec7399b56e0703859eb595c5ef64f94c278b16f0"],
  ["speaker-064.png", "image/png", 163, 211, 66721, "0e1f270607e8873876dbefdc7340c5a57a2c3dcac02efb5e6b8e6f3bd2f51533"],
  ["speaker-066.png", "image/png", 180, 232, 69652, "90076b28f0b63333b3731dbfefc229195932a40cfe31705e0294e4f2747287b6"],
  ["speaker-067.jpg", "image/jpeg", 480, 548, 65970, "fa42d29a9e30318f4dc366272c621e609a2badae6096a12906d60b679ecc1a24"],
  ["speaker-068.png", "image/png", 415, 499, 385844, "b12e6f1c7357f90b35d9b7533e8eae15181fde1749fd32a9c93085773c78e756"],
].map(([file, mime, width, height, size, sha256]) => ({
  file,
  mime,
  width,
  height,
  size,
  sha256,
}));

function imageDimensions(buffer, mime) {
  if (mime === "image/png") {
    assert.deepEqual([...buffer.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    assert.equal(buffer.subarray(12, 16).toString("ascii"), "IHDR");
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }

  assert.equal(mime, "image/jpeg");
  assert.deepEqual([...buffer.subarray(0, 3)], [0xff, 0xd8, 0xff]);

  for (let offset = 2; offset + 9 < buffer.length; ) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    while (buffer[offset] === 0xff) offset += 1;
    const marker = buffer[offset];
    offset += 1;

    if (marker === 0xd8 || marker === 0xd9) continue;
    if (marker === 0xda) break;

    const segmentLength = buffer.readUInt16BE(offset);
    const isStartOfFrame =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      ![0xc4, 0xc8, 0xcc].includes(marker);

    if (isStartOfFrame) {
      return {
        height: buffer.readUInt16BE(offset + 3),
        width: buffer.readUInt16BE(offset + 5),
      };
    }

    offset += segmentLength;
  }

  throw new Error("JPEG dimensions not found");
}

test("verified speaker data remains intact while publication is disabled", () => {
  assert.equal(speakersData.SPEAKERS_PUBLISHED, false);
  assert.equal(speakersData.SPEAKERS_VISIBLE, false);
  assert.deepEqual(speakersData.SPEAKERS, expectedAppearances);
  assert.equal(new Set(speakersData.SPEAKERS.map(({ id }) => id)).size, 67);
  assert.equal(new Set(speakersData.SPEAKERS.map(({ name }) => name)).size, 66);
});

test("published speaker grouping keeps source order within serial DAY 1 and DAY 2 sections", () => {
  assert.deepEqual(
    speakersData.getPublishedSpeakerDays(false, speakersData.SPEAKERS),
    []
  );
  const groupedDays = speakersData.getPublishedSpeakerDays(
    true,
    speakersData.SPEAKERS
  );
  assert.deepEqual(groupedDays.map(({ id }) => id), ["day1", "day2"]);

  for (const day of groupedDays) {
    const actualIds = day.sessions.flatMap(({ speakers }) => speakers.map(({ id }) => id));
    const expectedIds = expectedAppearances
      .filter(({ dayId }) => dayId === day.id)
      .map(({ id }) => id);
    assert.deepEqual(actualIds, expectedIds);
  }

  assert.deepEqual(
    groupedDays.map(({ id, sessions }) => ({
      id,
      sessionIds: sessions.map(({ id: sessionId }) => sessionId),
    })),
    [
      {
        id: "day1",
        sessionIds: [
          "day1-opening",
          "day1-track1-a1",
          "day1-track1-a2",
          "day1-track1-a3",
          "day1-track2-b1",
          "day1-track2-b2",
          "day1-track2-b3",
        ],
      },
      {
        id: "day2",
        sessionIds: [
          "day2-track1-a4",
          "day2-track1-a5",
          "day2-track1-a6",
          "day2-track2-b4",
          "day2-track2-b5",
          "day2-track2-b6",
        ],
      },
    ]
  );
});

test("speaker session IDs, days, rooms, and titles resolve to the current PROGRAM source", () => {
  for (const session of speakersData.SPEAKER_SESSIONS) {
    const programDay = constants.PROGRAM.find(({ id }) => id === session.dayId);
    assert.ok(programDay, session.id);

    const matched = programDay.slots.some((slot) => {
      if (session.trackLabel === "공통") return slot.shared?.title === session.title;
      if (session.trackLabel === "Track 1 · 401호") return slot.track1?.title === session.title;
      if (session.trackLabel === "Track 2 · 402호") return slot.track2?.title === session.title;
      return false;
    });
    assert.equal(matched, true, session.id);
  }
});

test("all 49 mapped speaker assets have exact signatures, dimensions, bytes, and hashes", () => {
  const targetDir = path.join(repo, "public", "images", "speakers");
  const actualFiles = fs.readdirSync(targetDir).sort();
  assert.deepEqual(actualFiles, expectedImages.map(({ file }) => file).sort());

  for (const expected of expectedImages) {
    const absolutePath = path.join(targetDir, expected.file);
    const buffer = fs.readFileSync(absolutePath);
    const extension = path.extname(expected.file);
    assert.equal(extension, expected.mime === "image/png" ? ".png" : ".jpg");
    assert.deepEqual(imageDimensions(buffer, expected.mime), {
      width: expected.width,
      height: expected.height,
    });
    assert.equal(buffer.length, expected.size);
    assert.equal(
      crypto.createHash("sha256").update(buffer).digest("hex"),
      expected.sha256
    );
  }
});

test("photo mapping, alt text, fallback count, roles, and day counts remain explicit", () => {
  const withPhotos = speakersData.SPEAKERS.filter(({ imageSrc }) => imageSrc);
  const fallbacks = speakersData.SPEAKERS.filter(({ imageSrc }) => !imageSrc);
  assert.equal(withPhotos.length, 49);
  assert.equal(fallbacks.length, 18);
  assert.ok(withPhotos.every(({ name, imageAlt }) => imageAlt === `${name} 연사 사진`));
  assert.ok(fallbacks.every(({ imageAlt }) => imageAlt === ""));

  assert.deepEqual(
    Object.fromEntries(
      ["day1", "day2"].map((dayId) => [
        dayId,
        speakersData.SPEAKERS.filter((speaker) => speaker.dayId === dayId).length,
      ])
    ),
    { day1: 35, day2: 32 }
  );

  assert.deepEqual(
    Object.fromEntries(
      [...new Set(speakersData.SPEAKERS.map(({ role }) => role))].map((role) => [
        role,
        speakersData.SPEAKERS.filter((speaker) => speaker.role === role).length,
      ])
    ),
    {
      "기조연설": 1,
      "좌장": 9,
      "발표자": 25,
      "토론자": 18,
      "발표자/토론자": 14,
    }
  );
});

test("registration contracts remain unchanged while speakers are published", () => {
  assert.equal(constants.REGISTRATION_SESSIONS.length, 13);
  assert.ok(constants.AFFILIATION_TYPES.includes("정부부처"));

  const finalTrack1 = constants.REGISTRATION_SESSIONS.find(
    ({ id }) => id === "day2-15:00 – 16:40-t1"
  );
  const finalTrack2 = constants.REGISTRATION_SESSIONS.find(
    ({ id }) => id === "day2-15:00 – 16:40-t2"
  );
  assert.deepEqual(
    { id: finalTrack1?.id, time: finalTrack1?.time, slotKey: finalTrack1?.slotKey },
    {
      id: "day2-15:00 – 16:40-t1",
      time: "14:40 ~ 16:40",
      slotKey: "day2::15:00 – 16:40",
    }
  );
  assert.deepEqual(
    { id: finalTrack2?.id, time: finalTrack2?.time, slotKey: finalTrack2?.slotKey },
    {
      id: "day2-15:00 – 16:40-t2",
      time: "15:00 – 16:40",
      slotKey: "day2::15:00 – 16:40",
    }
  );
});

test("HWPX and original photo inputs are not tracked by Git", () => {
  const tracked = execFileSync(
    "git",
    [
      "ls-files",
      "--",
      "public/연사리스트(홈페이지용)_260831_v1.hwpx",
      "public/images/연사사진_260831_v1",
      "public/images/연사사진_260831_v1.zip",
    ],
    { cwd: repo, encoding: "utf8" }
  ).trim();
  assert.equal(tracked, "");
});
