/**
 * ============================================================================
 * KHIS Symposium — Site Content
 * ----------------------------------------------------------------------------
 * SITE.name / tagline / venueLabel are now taken directly from the official
 * key visual (의정원 키비.png). Speaker names, sessions and the greeting text
 * are still placeholder copy — swap those once confirmed.
 * ============================================================================
 */

export const SITE = {
  orgName: "한국보건의료정보원",
  orgNameEn: "Korea Health Information Service",
  shortName: "심포지엄",
  year: "2026",
  name: "2026 한국보건의료정보원 연례 심포지엄",
  // 히어로 타이틀 줄바꿈 (둘 다 흰색)
  heroTitleLine1: "2026 한국보건의료정보원",
  heroTitleLine2: "연례 심포지엄",
  tagline: "빅데이터 기반의 AI 플랫폼, 보건의료 미래를 열다",
  dateLabel: "2026. 9. 10.(목) - 9. 11.(금)",
  venueLabel: "서울 강남 코엑스 컨퍼런스룸 401, 402",
  description:
    "한국보건의료정보원이 주최하는 연례 심포지엄으로, 빅데이터 기반의 AI 플랫폼을 통해 보건의료의 미래를 여는 자리입니다.",
} as const;

export const NAV_LINKS = [
  // { label: "인사말", href: "#greeting" }, // 섹션 임시 숨김과 함께 비활성화
  { label: "행사 개요", href: "#overview" },
  { label: "프로그램", href: "#program" },
  { label: "오시는 길", href: "#location" },
] as const;

export const DIRECTOR_GREETING = {
  // 지정 시 인물 사진으로 전환됨. 비워두면 이니셜 플레이스홀더가 표시됨.
  portraitImage: "",
  name: "홍 길 동",
  title: "한국보건의료정보원 원장",
  paragraphs: [
    "존경하는 보건의료 관계자 여러분, 그리고 이 자리를 함께해 주신 모든 분들께 깊은 감사의 말씀을 드립니다.",
    "한국보건의료정보원은 국민의 건강 정보가 안전하게 연계되고, 그 가치가 의료 현장과 정책에 온전히 전달될 수 있도록 지난 한 해 여러 기관과 함께 걸어왔습니다. 이번 심포지엄은 그 여정에서 나눈 고민과 성과를 공유하고, 앞으로 나아갈 방향을 함께 그려보는 자리입니다.",
    "빠르게 변화하는 디지털 헬스케어 환경 속에서 데이터의 신뢰성과 상호운용성은 그 어느 때보다 중요한 화두가 되었습니다. 이번 자리에서 이루어질 여러 발표와 논의가 참석하신 모든 분들께 실질적인 통찰과 영감이 되기를 바랍니다.",
    "바쁘신 가운데 귀한 걸음 해주신 모든 분들께 다시 한번 감사드리며, 이번 심포지엄이 서로의 지혜를 나누고 신뢰를 더하는 뜻깊은 시간이 되기를 진심으로 기원합니다.",
  ],
} as const;

export const EVENT_OVERVIEW = [
  { label: "주최", value: "한국보건의료정보원" },
  { label: "주관", value: "한국보건의료정보원 심포지엄 조직위원회" },
  { label: "후원", value: "보건복지부" },
  { label: "일시", value: "2026. 9. 10(목) – 9. 11(금), 09:30 – 17:30" },
  { label: "장소", value: "코엑스 컨퍼런스룸 401, 402, 403호 및 로비" },
  { label: "참가대상", value: "보건의료기관, 공공기관, 학계 및 산업계 관계자" },
  { label: "참가비", value: "무료 (사전등록제)" },
  { label: "참가언어", value: "한국어 · 영어 동시통역 제공" },
] as const;

export const LOCATION = {
  venueName: "코엑스 컨퍼런스룸 401, 402, 403호 및 로비",
  address: "서울특별시 강남구 영동대로 513",
  addressDetail: "(우) 06164 · 컨퍼런스룸 401·402·403호 및 로비",
  // 지정 시 지도 임베드(카카오/네이버 지도 등)로 전환. 비워두면 플레이스홀더가 표시됨.
  mapEmbedUrl: "",
  subway: {
    line: "수도권 지하철 2호선 · 9호선",
    detail: "삼성역 5·6번 출구 → 도보 5분",
  },
  bus: ["146", "301", "342", "401", "740", "3411"],
  parking: "aT센터 및 코엑스 지하주차장 이용 (2시간 무료, 이후 유료)",
} as const;

export type ProgramSession = {
  time: string;
  title: string;
  speaker?: string;
  affiliation?: string;
  track?: string;
  /** Optional expanded blurb, shown under the session (see reference layout) */
  description?: string;
};

export type ProgramDay = {
  id: string;
  dayLabel: string;
  dateLabel: string;
  sessions: ProgramSession[];
};

export const PROGRAM_INTRO = {
  eyebrow: "SCHEDULE",
  title: "일정 및 프로그램",
  description:
    "1일차와 2일차에 걸쳐 진행되는 세부 일정을 안내드립니다. 기조연설, 세션 발표, 패널 토론으로 구성되며 일정은 사정에 따라 변경될 수 있습니다.",
  linkLabel: "전체 일정 다운로드",
  // 지정 시 실제 현장 사진으로 전환됨. 비워두면 테크 톤 그라디언트 플레이스홀더가 표시됨.
  image1: "",
  image2: "",
} as const;

export const PROGRAM: ProgramDay[] = [
  {
    id: "day1",
    dayLabel: "DAY 1",
    dateLabel: "2026. 9. 10(목)",
    sessions: [
      {
        time: "09:30 – 10:00",
        title: "참가자 등록 및 환영 리셉션",
        description:
          "현장 등록 데스크에서 참가 확인 후 명찰을 수령하실 수 있습니다. 담당 스태프가 상시 대기하며 문의사항을 안내해 드립니다.",
      },
      {
        time: "10:00 – 10:20",
        title: "개회사",
        speaker: "홍 길 동",
        affiliation: "한국보건의료정보원 원장",
      },
      {
        time: "10:20 – 11:10",
        title: "기조연설 · 보건의료 데이터 생태계의 미래",
        speaker: "김 O O",
        affiliation: "보건복지부",
        track: "기조연설",
      },
      {
        time: "11:10 – 12:00",
        title: "보건의료데이터 표준화와 상호운용성",
        speaker: "이 O O",
        affiliation: "한국보건의료정보원",
        track: "세션 1",
      },
      { time: "12:00 – 13:30", title: "오찬" },
      {
        time: "13:30 – 14:20",
        title: "의료 마이데이터 정책 동향과 과제",
        speaker: "박 O O",
        affiliation: "정책연구실",
        track: "세션 2",
      },
      {
        time: "14:20 – 15:10",
        title: "디지털 헬스케어 산업 협력 사례",
        speaker: "최 O O",
        affiliation: "산업계",
        track: "세션 3",
      },
      { time: "15:10 – 15:30", title: "휴식" },
      {
        time: "15:30 – 16:40",
        title: "패널 토론 · 데이터 신뢰 기반의 협력 모델",
        speaker: "지정 토론자 5인",
        track: "패널 토론",
      },
      { time: "16:40 – 17:30", title: "네트워킹 리셉션" },
    ],
  },
  {
    id: "day2",
    dayLabel: "DAY 2",
    dateLabel: "2026. 9. 11(금)",
    sessions: [
      { time: "09:30 – 10:00", title: "참가자 등록" },
      {
        time: "10:00 – 10:50",
        title: "특별강연 · 인공지능과 보건의료 데이터 윤리",
        speaker: "정 O O",
        affiliation: "학계",
        track: "특별강연",
      },
      {
        time: "10:50 – 11:40",
        title: "지역 의료데이터 연계 플랫폼 구축 사례",
        speaker: "한 O O",
        affiliation: "한국보건의료정보원",
        track: "세션 4",
      },
      {
        time: "11:40 – 12:30",
        title: "공공보건 통계 데이터 활용 방안",
        speaker: "윤 O O",
        affiliation: "공공기관",
        track: "세션 5",
      },
      { time: "12:30 – 14:00", title: "오찬" },
      {
        time: "14:00 – 15:30",
        title: "분과 세션 · 표준/보안/정책 트랙 병행 진행",
        speaker: "분과별 발표자",
        track: "분과 세션",
      },
      { time: "15:30 – 15:50", title: "휴식" },
      {
        time: "15:50 – 16:30",
        title: "우수사례 시상 및 성과 공유",
        track: "시상식",
      },
      {
        time: "16:30 – 17:00",
        title: "폐회사 및 차년도 안내",
        speaker: "한국보건의료정보원",
      },
    ],
  },
];

export const REGISTRATION_NOTE =
  "* 등록 항목은 추후 확정될 예정이며, 아래 양식은 임시 구성입니다.";

export const ATTENDANCE_DAY_OPTIONS = [
  { id: "day1", label: "1일차 (9. 10 목)" },
  { id: "day2", label: "2일차 (9. 11 금)" },
  { id: "both", label: "전체 참석" },
] as const;

export const REFERRAL_OPTIONS = [
  "한국보건의료정보원 홈페이지",
  "이메일 안내",
  "유관기관 공문",
  "지인 소개",
  "기타",
] as const;

export const FOOTER = {
  orgName: "한국보건의료정보원",
  address: "서울특별시 마포구 마포대로 155 프론트원 (placeholder 주소)",
  tel: "1577-0000",
  email: "symposium@k-his.or.kr",
  links: [
    { label: "이용약관", href: "#" },
    { label: "개인정보처리방침", href: "#" },
  ],
} as const;
