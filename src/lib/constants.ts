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
  venueName: "서울 강남 코엑스 컨퍼런스룸 401, 402",
  address: "서울특별시 강남구 영동대로 513 4층",
  // 안내 약도 이미지
  mapImage: "/images/location-map.png",
  // color: 실제 노선/버스 유형 색상 (2호선=초록, 9호선=골드, 버스 유형별 서울시 색상 계열)
  subwayRoutes: [
    {
      line: "2호선 삼성역 방면",
      color: "#22C55E",
      detail: ["삼성역 5·6번 출구와 직접 연결된 통로로 진입,", "밀레니엄 광장을 통해 스타필드 코엑스몰로 진입"],
    },
    {
      line: "9호선 봉은사역 방면",
      color: "#D4AF37",
      detail: ["봉은사역 7번 출구 직접 연결된 통로로 진입,", "아셈플라자를 통해 스타필드 코엑스몰로 진입"],
    },
  ],
  busRoutes: [
    { type: "간선버스", numbers: "143, 343" },
    { type: "지선버스", numbers: "2413" },
    { type: "마을버스", numbers: "강남01, 강남06, 강남08" },
    { type: "직행버스", numbers: "500-2, 9407, 9507, 9607, G3202" },
  ],
} as const;

/** A single track's content within a time slot (title + optional speaker/org) */
export type ProgramTrackItem = {
  title: string;
  speaker?: string;
  affiliation?: string;
};

export type ProgramSlot = {
  time: string;
  duration?: string;
  /** Use for rows common to both tracks (registration, lunch, break) */
  shared?: ProgramTrackItem;
  /** Use together for rows where the two tracks run in parallel */
  track1?: ProgramTrackItem;
  track2?: ProgramTrackItem;
};

export type ProgramDay = {
  id: string;
  dayLabel: string;
  dateLabel: string;
  slots: ProgramSlot[];
};

export const TRACK_LABELS = {
  track1: "Track 1 · 401호",
  track2: "Track 2 · 402호",
} as const;

export const PROGRAM_INTRO = {
  eyebrow: "SCHEDULE",
  title: "프로그램",
  description:
    "1일차와 2일차에 걸쳐 진행되는 세부 일정을 안내드립니다. 국가통합바이오빅데이터 플랫폼 데이터 개방, 디지털 보건의료정보시스템 등 의정원 주요사업 추진 현황 등으로 구성되며 일정은 사정에 따라 변경될 수 있습니다.",
  linkLabel: "리플렛 다운로드",
  leafletUrl: "/files/khis-symposium-leaflet.pdf",
  // 지정 시 실제 현장 사진으로 전환됨. 비워두면 GlowingShadow 플레이스홀더가 표시됨.
  image1: "",
  image2: "",
} as const;

export const PROGRAM: ProgramDay[] = [
  {
    id: "day1",
    dayLabel: "DAY 1",
    dateLabel: "2026. 09. 10.(목)",
    slots: [
      {
        time: "09:30 – 10:50",
        duration: "(80분)",
        track1: { title: "개회식", speaker: "백롱민 단장 · 기조연설" },
      },
      {
        time: "10:50 – 12:30",
        duration: "(100분)",
        track1: { title: "국가통합바이오빅데이터 개방을 통한 국민건강 증진 (사업추진)" },
        track2: { title: "디지털 보건의료정보 플랫폼" },
      },
      { time: "12:30 – 13:50", duration: "(80분)", shared: { title: "점심 시간" } },
      {
        time: "13:50 – 15:30",
        duration: "(100분)",
        track1: { title: "국가통합바이오빅데이터 개방을 통한 국민건강 증진 (활용)" },
        track2: { title: "보건의료데이터 인프라 혁신" },
      },
      { time: "15:30 – 15:50", duration: "(20분)", shared: { title: "휴식" } },
      {
        time: "15:50 – 17:30",
        duration: "(100분)",
        track1: { title: "의료 AI 생태계 구축 (AI고속도로, 의료전달체계 확립, AI전략 등)" },
        track2: { title: "빅데이터 기반 질병 대응 전략" },
      },
    ],
  },
  {
    id: "day2",
    dayLabel: "DAY 2",
    dateLabel: "2026. 09. 11.(금)",
    slots: [
      {
        time: "10:00 – 11:40",
        duration: "(100분)",
        track1: { title: "한국형 의료데이터 표준화의 현장 적용과 확산" },
        track2: { title: "(가제) 의료 서비스의 새로운 연결" },
      },
      { time: "11:40 – 13:00", duration: "(80분)", shared: { title: "점심 시간" } },
      {
        time: "13:00 – 14:40",
        duration: "(100분)",
        track1: { title: "표준 기반 의료시스템 실행체계", affiliation: "대한의료정보학회" },
        track2: { title: "AI 시대 신뢰받는 보건의료데이터 활용 방향" },
      },
      { time: "14:40 – 15:00", duration: "(20분)", shared: { title: "휴식" } },
      {
        time: "15:00 – 16:40",
        duration: "(100분)",
        track1: {
          title: "AI 시대 글로벌 디지털헬스와 상호운용성 전략",
          affiliation: "대한의료정보학회",
        },
        track2: { title: "데이터 안전한 활용", affiliation: "과학기자협회" },
      },
      {
        time: "16:40 – 17:00",
        duration: "(20분)",
        track1: { title: "폐회식" },
      },
    ],
  },
];

// 등록 폼 "참여세션" 체크박스 — PROGRAM에서 두 트랙이 동시 진행되는 슬롯만 뽑아
// 자동 생성 (개회식/폐회식/점심/휴식 등 단일 항목은 제외). 총 12개.
export type RegistrationSessionOption = {
  id: string;
  dayId: string;
  dayLabel: string;
  time: string;
  trackLabel: string;
  title: string;
};

export const REGISTRATION_SESSIONS: RegistrationSessionOption[] = PROGRAM.flatMap((day) =>
  day.slots.flatMap((slot): RegistrationSessionOption[] => {
    if (!slot.track1 || !slot.track2) return [];
    return [
      {
        id: `${day.id}-${slot.time}-t1`,
        dayId: day.id,
        dayLabel: day.dayLabel,
        time: slot.time,
        trackLabel: TRACK_LABELS.track1,
        title: slot.track1.title,
      },
      {
        id: `${day.id}-${slot.time}-t2`,
        dayId: day.id,
        dayLabel: day.dayLabel,
        time: slot.time,
        trackLabel: TRACK_LABELS.track2,
        title: slot.track2.title,
      },
    ];
  })
);

export const AFFILIATION_TYPES = [
  "정보부처",
  "공공기관",
  "의료기관",
  "협회·학계",
  "산업계",
  "언론",
  "기타",
] as const;

export const PRIVACY_NOTICE = {
  items: "성명, 소속분류, 소속명, 직위, 연락처, 이메일, 참여세션",
  purpose: "심포지엄 등록·운영 서비스 제공, 만족도 조사 포함",
  retention: "행사 종료 후 관련 법령에 따라 파기",
} as const;

export const FOOTER = {
  orgName: "한국보건의료정보원",
  logoImage: "/images/khis-logo.png",
  websiteUrl: "https://www.khis.kr/",
  links: [
    { label: "이용약관", href: "#" },
    { label: "개인정보처리방침", href: "#" },
  ],
} as const;
