import { useState, useEffect, useRef, useCallback } from 'react';

const QUIZ_MODES = {
  MULTIPLICATION: 'multiplication',
  DIVISION: 'division',
};

// 구구단 및 나눗셈 퀴즈 생성기 (knol-defence 스타일)
const generateMathQuiz = (mode = QUIZ_MODES.MULTIPLICATION) => {
  const isDivision = mode === QUIZ_MODES.DIVISION;
  let q, a;

  if (isDivision) {
    const divisor = Math.floor(Math.random() * 8) + 2; // 2 ~ 9
    const ans = Math.floor(Math.random() * 9) + 1; // 1 ~ 9
    const dividend = divisor * ans;
    q = `${dividend} ÷ ${divisor} = ?`;
    a = ans;
  } else {
    const num1 = Math.floor(Math.random() * 8) + 2; // 2 ~ 9
    const num2 = Math.floor(Math.random() * 9) + 1; // 1 ~ 9
    q = `${num1} × ${num2} = ?`;
    a = num1 * num2;
  }

  // Generate 3 unique wrong options
  const options = new Set([a.toString()]);
  while(options.size < 4) {
    let wrongAns = a + (Math.floor(Math.random() * 5) - 2) * (Math.floor(Math.random() * 3) + 1);
    if (wrongAns <= 0 || wrongAns === a) wrongAns = Math.floor(Math.random() * 81) + 1;
    options.add(wrongAns.toString());
  }

  return {
    q,
    a: a.toString(),
    options: Array.from(options).sort(() => Math.random() - 0.5)
  };
};

const getTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};


const WEAPON_TREE = {
  common: {
    1: {
      name: "낡은 몽둥이",
      maxTier: false,
      desc: "그냥 마당에서 주운 낡은 나무 몽둥이. 한국인의 전통 무기(?)인 '몽둥이 찜질'을 가하기에 아주 적합하다."
    },
  },
  "1H": {
    2: {
      name: "환두대도",
      maxTier: false,
      desc: "삼국시대부터 쓰인 둥근고리칼. 고리 내부에 용이나 봉황 문양이 새겨져 소지자의 높은 신분을 과시할 수 있다."
    },
    3: {
      name: "한석봉의 벼루와 붓",
      maxTier: false,
      desc: "어머니가 불을 끄고 떡을 썰 때 석봉이 어둠 속에서 글을 쓰던 명품 도구. 벼루에 맞으면 붓글씨보다 아프고 서럽다."
    },
    4: {
      name: "조선 환도",
      maxTier: false,
      desc: "조선시대 군사들의 기본 칼. 띠돈을 사용해 360도 회전하여 찰 수 있어 활을 쏠 때 거슬리지 않는 선조들의 지혜가 돋보인다."
    },
    5: {
      name: "나전칠기 할머니 효자손",
      maxTier: false,
      desc: "영롱한 조개껍데기를 갈아 박은 명품 나전칠기 효자손. 효심 가득한 할머니의 손길로 적의 등을 매우 시원하게(?) 긁어준다."
    },
    6: {
      name: "주술의 성검 사인검",
      maxTier: false,
      desc: "호랑이의 해, 호랑이의 달, 호랑이의 날, 호랑이의 시에 벼려진 호국검. 사악한 영혼과 요괴를 물리치는 강력한 기운이 깃들어 있다."
    },
    7: {
      name: "전설의 칠지도",
      maxTier: true,
      desc: "백제 철기 기술의 극치를 보여주는 일곱 개의 가지가 달린 칼. 왜왕에게 하사되었던 주술적이고 상징적인 최고의 역사적 성검."
    },
  },
  "2H": {
    2: {
      name: "조선의 협도",
      maxTier: false,
      desc: "무예도보통지에 실린 조선 보병의 긴 칼창. 적의 기병을 끌어내리거나 말다리를 베어 버리기에 최고의 위력을 낸다."
    },
    3: {
      name: "무쇠 가마솥 뚜껑",
      maxTier: false,
      desc: "가마솥 밥맛을 책임지는 묵직한 무쇠 뚜껑. 매우 단단하여 적의 타격을 전부 튕겨내고 던지면 치명적인 밥맛(?)을 낸다."
    },
    4: {
      name: "임진왜란 쌍수도",
      maxTier: false,
      desc: "임진왜란 당시 왜검에 대적하기 위해 조선의 전술에 정식 채택된 긴 양손검. 크고 묵직하여 베는 순간 바람 소리가 대장간을 울린다."
    },
    5: {
      name: "뽑아온 천하대장군 장승",
      maxTier: false,
      desc: "마을 입구에서 악귀를 막아주던 천하대장군 장승. 강력한 대장장이가 그냥 힘으로 땅에서 통째로 뽑아와서 그대로 후려친다."
    },
    6: {
      name: "장군의 월도",
      maxTier: false,
      desc: "조선의 용맹한 장수들이 기마전에서 휘두르던 초승달을 닮은 대도. 회전력을 이용하여 적진을 단숨에 쓸어버릴 수 있다."
    },
    7: {
      name: "이충무공 장검",
      maxTier: true,
      desc: "충무공 이순신 장군이 사용했던 거대한 상징검. 칼날에 '삼척서천 산하동색' 명문이 새겨져 존재 자체로 적을 전율하게 한다."
    },
  }
};

const UPGRADE_RATES = {
  1: { cost: 50, rate: 85 },
  2: { cost: 100, rate: 70 },
  3: { cost: 200, rate: 50 },
  4: { cost: 400, rate: 35 },
  5: { cost: 800, rate: 20 },
  6: { cost: 1500, rate: 8 },
};

const MAX_WEAPON_TIER = 7;
const GREAT_SUCCESS_DOUBLE_RATE = 3;
const GREAT_SUCCESS_TRIPLE_RATE = 1;
const GREAT_SUCCESS_FALSE_ALARM_RATE = 4;
const DEPLOY_COOLDOWN_MS = 5 * 60 * 1000;
const DEPLOY_QUIZ_REQUIRED = 5;
const RECOVERY_BASE_RATE = 10;
const RECOVERY_CORRECT_BONUS = 8;

const getAssetUrl = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
const getImageUrl = (fileName) => getAssetUrl(`images/${fileName}`);

const formatCooldown = (ms) => {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

const getViewportMode = () => {
  if (typeof window === 'undefined') return '웹/전자칠판';

  const width = window.innerWidth;
  if (width <= 640) return '모바일';
  if (width <= 1024) return '태블릿';
  return '웹/전자칠판';
};

const VIEW_MODES = ['모바일', '태블릿', '웹/전자칠판'];
const VIEW_MODE_CLASS = {
  모바일: 'mobile',
  태블릿: 'tablet',
  '웹/전자칠판': 'board',
};

const getWeaponNameByState = (targetTier, targetPath) => {
  if (targetTier > 1 && targetPath && WEAPON_TREE[targetPath]?.[targetTier]) {
    return WEAPON_TREE[targetPath][targetTier].name;
  }
  return WEAPON_TREE.common[1].name;
};

const getGreatSuccessStepCount = (currentTier) => {
  const maxSteps = Math.min(3, MAX_WEAPON_TIER - currentTier);
  if (maxSteps <= 1) return 1;

  const roll = Math.random() * 100;
  if (maxSteps >= 3) {
    if (roll < GREAT_SUCCESS_TRIPLE_RATE) return 3;
    if (roll < GREAT_SUCCESS_TRIPLE_RATE + GREAT_SUCCESS_DOUBLE_RATE) return 2;
    return 1;
  }
  if (roll < GREAT_SUCCESS_DOUBLE_RATE) return 2;
  return 1;
};

const getRandomDelay = (base, variance) => base + Math.floor(Math.random() * variance);

// 조선 팔도 출진 스테이지 (7단계, 보상은 매우 적게)
const STAGES = [
  {
    level: 1,
    name: '뒷골목 깡패 소탕',
    desc: '저잣거리 뒤편을 어지럽히는 불량배를 쫓아내고 빼앗긴 엽전을 되찾는다.',
    context: '장시와 저잣거리는 물건과 소문이 모이는 곳이다. 길목을 장악한 무리는 마을 살림을 바로 흔든다.',
    clue: '장터 뒷문에 부러진 곤봉과 흩어진 엽전 자국이 남아 있다.',
    baseChance: 80,
    reward: 5,
    winMsg: '뒷골목 불량배들을 쫓아냈다!',
    loseMsg: '깡패 두목에게 발목을 잡혀 철수했다...',
  },
  {
    level: 2,
    name: '지리산 멧돼지 사냥',
    desc: '산비탈 밭을 파헤친 멧돼지 떼를 몰아내고 마을의 사례를 받는다.',
    context: '깊은 산과 밭이 맞닿은 고을에서는 산짐승 피해가 곧 끼니 문제로 이어진다.',
    clue: '파헤쳐진 밭고랑과 짚신 자국이 지리산 샛길로 이어진다.',
    baseChance: 65,
    reward: 8,
    winMsg: '멧돼지 떼를 산속 깊이 몰아냈다!',
    loseMsg: '멧돼지 돌진에 밀려 산에서 굴러 내려왔다...',
  },
  {
    level: 3,
    name: '백두산 호랑이 격퇴',
    desc: '산군이라 불릴 만큼 두려움의 대상인 호랑이의 흔적을 쫓는다.',
    context: '한국 민속에서 호랑이는 산의 주인 같은 존재로 여겨졌다. 맞서면 큰 명성을 얻지만 위험도 크다.',
    clue: '눈 위에 큰 발자국이 찍히고, 나무껍질에는 깊은 발톱 자국이 남았다.',
    baseChance: 50,
    reward: 12,
    winMsg: '호랑이를 굴복시키고 백두산에서 돌아왔다!',
    loseMsg: '호랑이의 앞발 후려치기에 도망쳤다...',
  },
  {
    level: 4,
    name: '홍길동과의 비무',
    desc: '활빈당 소문을 따라가 홍길동과 무예를 겨룬다.',
    context: '홍길동은 한국 고전소설 속 의적 이미지가 강하다. 이 조우는 토벌보다 시험에 가깝다.',
    clue: '나뭇가지에 걸린 붉은 천 조각과 "가난한 집은 건드리지 말라"는 쪽지가 보인다.',
    baseChance: 38,
    reward: 18,
    winMsg: '홍길동도 인정한 무예! 명장으로 칭송받았다!',
    loseMsg: '홍길동의 묘한 분신술에 허를 찔려 쫓겨났다...',
  },
  {
    level: 5,
    name: '남해 왜구 소탕',
    desc: '남해 포구에 들어온 약탈 무리를 막고 빼앗긴 곡식과 물자를 되찾는다.',
    context: '왜구는 한반도와 중국 연안에서 활동한 해적 집단으로, 조선의 해안 방어에서 중요한 위협이었다.',
    clue: '젖은 볏섬, 잘린 밧줄, 낡은 왜선의 노 조각이 포구에 떠밀려 왔다.',
    baseChance: 27,
    reward: 25,
    winMsg: '왜구 선단을 격침시키고 바다를 되찾았다!',
    loseMsg: '왜구의 조총 사격에 바다로 풍덩 빠졌다...',
  },
  {
    level: 6,
    name: '북방 여진족 철기 격퇴',
    desc: '북방 초소를 흔드는 기마 척후를 막는다. 빠른 말과 긴 무기가 위협적이다.',
    context: '조선 북방 변경에서는 여진 세력과 교역도 있었지만, 생활 물자와 국경 문제로 충돌도 벌어졌다.',
    clue: '초소 밖 말발굽 자국이 얼어붙은 풀밭을 길게 가르고 있다.',
    baseChance: 18,
    reward: 35,
    winMsg: '여진족 기병을 몰아내고 북방 초소를 지켜냈다!',
    loseMsg: '말발굽 먼지를 잔뜩 마시고 후퇴했다...',
  },
  {
    level: 7,
    name: '백색 이무기 격퇴',
    desc: '강가에 떠도는 이무기 전설의 근원을 확인한다. 가장 큰 보상과 손실이 함께 온다.',
    context: '이무기는 용이 되지 못한 존재로 전해지는 한국 설화의 상상 동물이다. 물길과 재앙의 이미지가 강하다.',
    clue: '강가 물안개 속에서 흰 비늘 같은 조각과 뒤틀린 물살이 번쩍인다.',
    baseChance: 10,
    reward: 50,
    winMsg: '이무기를 베어냈다! 조선의 영웅으로 역사에 이름을 새겼다!',
    loseMsg: '이무기의 번개벼락에 쓸려 강물에 떠내려갔다...',
  },
];

const DEPLOY_TIER_BONUS = 5;
const DEPLOY_MIN_CHANCE = 5;
const DEPLOY_MAX_CHANCE = 82;
const DEPLOY_BREAK_CHANCE = 12;

const getDeployPassChance = (baseChance, weaponTier) => {
  const chance = baseChance + (weaponTier - 1) * DEPLOY_TIER_BONUS;
  return Math.max(DEPLOY_MIN_CHANCE, Math.min(DEPLOY_MAX_CHANCE, chance));
};

const getDeployBreakChance = (weaponTier) => {
  return weaponTier > 1 ? DEPLOY_BREAK_CHANCE : 0;
};

const getDowngradedWeaponState = (currentTier, currentPath, dropAmount) => {
  const nextTier = Math.max(1, currentTier - dropAmount);
  return {
    tier: nextTier,
    path: nextTier === 1 ? null : currentPath,
  };
};

const DEPLOY_SCENES = [
  {
    terrain: '한양 뒷골목',
    enemyName: '골목 두목',
    enemyIcon: '🥷',
    enemySrc: getImageUrl('enemy_stage_1.png'),
    sky: '#334155',
    ground: '#4a2f25',
    accent: '#f97316',
  },
  {
    terrain: '지리산 산길',
    enemyName: '산짐승 무리',
    enemyIcon: '🐗',
    enemySrc: getImageUrl('enemy_stage_2.png'),
    sky: '#1e3a2f',
    ground: '#365314',
    accent: '#84cc16',
  },
  {
    terrain: '백두산 설원',
    enemyName: '산군 호랑이',
    enemyIcon: '🐅',
    enemySrc: getImageUrl('enemy_stage_3.png'),
    sky: '#1d4ed8',
    ground: '#e0f2fe',
    accent: '#60a5fa',
  },
  {
    terrain: '활빈당 비무장',
    enemyName: '홍길동',
    enemyIcon: '🎭',
    enemySrc: getImageUrl('enemy_stage_4.png'),
    sky: '#4c1d95',
    ground: '#3f2d20',
    accent: '#c084fc',
  },
  {
    terrain: '남해 왜선 갑판',
    enemyName: '왜구 약탈꾼',
    enemyIcon: '🏴‍☠️',
    enemySrc: getImageUrl('enemy_stage_5.png'),
    sky: '#0f766e',
    ground: '#78350f',
    accent: '#22d3ee',
  },
  {
    terrain: '북방 변경 초원',
    enemyName: '변경 침입 척후',
    enemyIcon: '🏇',
    enemySrc: getImageUrl('enemy_stage_6.png'),
    sky: '#713f12',
    ground: '#57534e',
    accent: '#facc15',
  },
  {
    terrain: '한강 상류',
    enemyName: '백색 이무기',
    enemyIcon: '🐉',
    enemySrc: getImageUrl('enemy_stage_7.png'),
    sky: '#172554',
    ground: '#1e40af',
    accent: '#38bdf8',
  },
];

const DEPLOY_ENCOUNTERS = STAGES.map((stage, index) => ({
  id: `enemy-${index + 1}`,
  kind: 'enemy',
  ...stage,
  storyLevel: index + 1,
  scene: DEPLOY_SCENES[index],
}));

const DEPLOY_EVENTS = [
  {
    id: 'bond-neighbor-lunch',
    kind: 'bond',
    storyLevel: 1,
    name: '동네 주민의 주먹밥',
    desc: '마을 주민이 길손에게 주먹밥과 작은 엽전을 건넨다.',
    context: '팔도 길 위의 출진은 전투만이 아니다. 마을 공동체의 도움도 여정을 이어가게 한다.',
    clue: '짚으로 묶은 주먹밥 꾸러미에 "무사히 돌아오시오"라는 말이 붙어 있다.',
    reward: 6,
    scene: {
      terrain: '마을 어귀',
      enemyName: '동네 주민',
      enemyIcon: '🙋',
      enemySrc: getImageUrl('bond_neighborhood_resident.png'),
      sky: '#36514f',
      ground: '#4b3a28',
      accent: '#86efac',
    },
    logs: [
      '동네 주민이 주먹밥을 건넸다.',
      '마을 어귀에서 작은 도움을 받았다.',
      '주민들이 무사 귀환을 빌어주었다.'
    ],
    nextEncounterIds: ['enemy-1', 'treasure-old-chest'],
    nextHint: '주민이 뒷골목 소문을 알려주었다.',
  },
  {
    id: 'bond-village-teacher',
    kind: 'bond',
    storyLevel: 2,
    name: '훈장님의 한마디',
    desc: '서당 훈장님이 고갯길의 소문을 짚어주고 여비를 보태준다.',
    context: '서당은 훈장과 학동이 글을 익히던 사립 교육 공간이다. 마을 소문과 길 정보도 이곳에 모인다.',
    clue: '천자문 책장 사이에 고갯길 이름이 적힌 종이가 끼워져 있다.',
    reward: 7,
    scene: {
      terrain: '서당 앞길',
      enemyName: '훈장님',
      enemyIcon: '📜',
      enemySrc: getImageUrl('bond_village_teacher.png'),
      sky: '#334155',
      ground: '#5b4630',
      accent: '#facc15',
    },
    logs: [
      '훈장님이 안전한 길을 알려주었다.',
      '훈장님이 여비 몇 닢을 보태주었다.',
      '서당 아이들이 응원해 주었다.'
    ],
    nextEncounterIds: ['hazard-bandit-tax', 'treasure-old-chest'],
    nextHint: '훈장님이 수상한 고갯길을 조심하라고 일러주었다.',
  },
  {
    id: 'bond-traveling-doctor',
    kind: 'bond',
    storyLevel: 4,
    name: '떠돌이 의원의 치료',
    desc: '떠돌이 의원이 상처를 살피고 산길에서 쓸 약초 꾸러미를 나눠준다.',
    context: '장거리 길에서는 병과 상처가 곧 손실이다. 의원과 약초 지식은 전투 못지않은 힘이 된다.',
    clue: '마른 쑥 냄새가 나는 약초 꾸러미에 진흙 협곡을 피하라는 표시가 있다.',
    reward: 9,
    scene: {
      terrain: '약초 냄새 나는 산길',
      enemyName: '떠돌이 의원',
      enemyIcon: '🧪',
      enemySrc: getImageUrl('bond_traveling_doctor.png'),
      sky: '#1e3a2f',
      ground: '#365314',
      accent: '#34d399',
    },
    logs: [
      '의원이 상처를 봐주었다.',
      '약초 꾸러미를 받았다.',
      '의원이 길에서 쓸 물자를 나눠주었다.'
    ],
    nextEncounterIds: ['hazard-muddy-ravine', 'enemy-3'],
    nextHint: '의원이 진흙 협곡과 산짐승 흔적을 알려주었다.',
  },
  {
    id: 'treasure-old-chest',
    kind: 'treasure',
    storyLevel: 2,
    name: '낡은 보물상자 발견',
    desc: '버려진 산길의 낡은 궤짝을 발견한다. 보상 뒤에 다음 흔적이 숨어 있다.',
    context: '길목의 상자는 우연한 횡재이기도 하지만, 누군가 숨기거나 버린 물건이라는 단서가 되기도 한다.',
    clue: '상자 주변 발자국이 수상한 길목으로 이어진다.',
    reward: 12,
    scene: {
      terrain: '버려진 산길',
      enemyName: '낡은 보물상자',
      enemyIcon: '🧰',
      enemySrc: getImageUrl('event_old_chest.png'),
      sky: '#315061',
      ground: '#4d3a22',
      accent: '#fbbf24',
    },
    logs: [
      '보물상자를 열었다.',
      '숨겨진 전리품을 찾았다.',
      '덫 없이 보상만 챙겼다.'
    ],
    nextEncounterIds: ['hazard-bandit-tax'],
    nextHint: '상자 주변 발자국이 수상한 길목으로 이어진다.',
  },
  {
    id: 'event-merchant-escort',
    kind: 'event',
    storyLevel: 3,
    name: '길 잃은 상단 호위',
    desc: '길을 잃은 보부상 무리를 장터까지 호위하고 사례를 받는다.',
    context: '보부상은 봇짐과 등짐으로 물화를 옮기던 행상이다. 장시와 길목의 소문을 가장 빨리 듣는다.',
    clue: '등짐장수의 지게에 남해 포구 약탈 소문이 적힌 장부가 묶여 있다.',
    reward: 10,
    scene: {
      terrain: '장터로 가는 고갯길',
      enemyName: '길 잃은 상단',
      enemyIcon: '🧳',
      enemySrc: getImageUrl('event_merchant_escort.png'),
      sky: '#36514f',
      ground: '#5b4630',
      accent: '#34d399',
    },
    logs: [
      '상단을 안전하게 안내했다.',
      '상단을 마을까지 데려다주었다.',
      '사례금을 받았다.'
    ],
    nextEncounterIds: ['enemy-5', 'event-abandoned-supplies'],
    nextHint: '상단이 남해 쪽 약탈 소문을 전해주었다.',
  },
  {
    id: 'event-forge-shrine',
    kind: 'event',
    storyLevel: 4,
    name: '산신 제단의 불씨',
    desc: '산신 제단에 남은 불씨와 공물을 살핀다. 작은 보상과 이상한 전조가 함께 있다.',
    context: '산과 마을을 잇는 제단은 민속 신앙의 흔적이다. 도움처럼 보여도 다음 위험을 부를 수 있다.',
    clue: '꺼지지 않은 불씨가 강가 쪽으로만 푸른 연기를 흘린다.',
    reward: 8,
    scene: {
      terrain: '산신 제단',
      enemyName: '꺼지지 않은 불씨',
      enemyIcon: '🔥',
      enemySrc: getImageUrl('event_forge_shrine.png'),
      sky: '#3f2b1b',
      ground: '#432818',
      accent: '#fb923c',
    },
    logs: [
      '제단의 불씨를 챙겼다.',
      '불씨 옆에서 전리품을 찾았다.',
      '작은 엽전 꾸러미를 발견했다.'
    ],
    nextEncounterIds: ['enemy-7', 'hazard-muddy-ravine'],
    nextHint: '불씨가 강가 쪽 위험한 기운을 가리켰다.',
  },
  {
    id: 'event-abandoned-supplies',
    kind: 'treasure',
    storyLevel: 5,
    name: '버려진 군량 꾸러미',
    desc: '폐초소에 버려진 군량과 잡물을 챙긴다. 북방 길목의 흔적이 뚜렷하다.',
    context: '초소와 군량은 변경 방어의 생활감 있는 흔적이다. 남은 물자는 보상이지만 추격의 단서가 된다.',
    clue: '찢어진 군량 자루 옆으로 말발굽이 찍힌 진흙이 말라붙어 있다.',
    reward: 15,
    scene: {
      terrain: '폐허가 된 초소',
      enemyName: '군량 꾸러미',
      enemyIcon: '🎁',
      enemySrc: getImageUrl('event_abandoned_supplies.png'),
      sky: '#4b5563',
      ground: '#3f3f46',
      accent: '#a3e635',
    },
    logs: [
      '군량 꾸러미를 챙겼다.',
      '낡은 항아리에서 엽전을 찾았다.',
      '팔 수 있는 물건을 챙겼다.'
    ],
    nextEncounterIds: ['enemy-6'],
    nextHint: '군량 흔적이 북방 기병의 길목으로 이어진다.',
  },
  {
    id: 'hazard-bandit-tax',
    kind: 'hazard',
    storyLevel: 3,
    name: '수상한 길목 통행세',
    desc: '고갯길에서 통행세를 내라며 버티는 수상한 무리를 만난다.',
    context: '장터와 고갯길은 사람과 물자가 오가는 곳이다. 길목을 잡은 무리는 작은 손실을 큰 위험으로 만든다.',
    clue: '나무 푯말에는 관청 표식이 없고, 새로 판 흙더미만 길가에 남아 있다.',
    reward: -10,
    scene: {
      terrain: '안개 낀 고갯길',
      enemyName: '수상한 통행세',
      enemyIcon: '⚠️',
      enemySrc: getImageUrl('hazard_bandit_tax.png'),
      sky: '#374151',
      ground: '#27272a',
      accent: '#f87171',
    },
    logs: [
      '통행세를 빼앗겼다.',
      '엽전 주머니가 가벼워졌다.',
      '전리품 일부를 잃었다.'
    ],
  },
  {
    id: 'hazard-muddy-ravine',
    kind: 'hazard',
    storyLevel: 5,
    name: '진흙 협곡 낙상',
    desc: '비에 무너진 협곡 길을 건넌다. 전리품 손실과 무기 손상이 모두 가능하다.',
    context: '팔도 길의 위험은 적만이 아니다. 산길과 물길, 날씨도 출진의 비용을 만든다.',
    clue: '흙탕물에 수레바퀴 자국이 끊기고, 아래쪽에서 금속 긁히는 소리가 난다.',
    reward: -16,
    weaponDamageChance: 25,
    scene: {
      terrain: '진흙 협곡',
      enemyName: '무너지는 진흙길',
      enemyIcon: '🕳️',
      enemySrc: getImageUrl('hazard_muddy_ravine.png'),
      sky: '#3b2f2f',
      ground: '#292524',
      accent: '#f59e0b',
    },
    logs: [
      '진흙길에서 미끄러졌다.',
      '짐 일부를 잃고 빠져나왔다.',
      '전리품 일부가 협곡 아래로 떨어졌다.'
    ],
  },
];

const DEPLOY_ALL_ENCOUNTERS = [...DEPLOY_ENCOUNTERS, ...DEPLOY_EVENTS];

const getDeployEncounterById = (id) => {
  if (typeof id === 'number') {
    return DEPLOY_ENCOUNTERS[id - 1] || DEPLOY_ENCOUNTERS[0];
  }
  return DEPLOY_ALL_ENCOUNTERS.find(encounter => encounter.id === id) || DEPLOY_ENCOUNTERS[0];
};

const pickDeployEncounter = (runIndex) => {
  const targetLevel = runIndex + 1;
  const enemyWeighted = DEPLOY_ENCOUNTERS.map((encounter) => {
    const distance = Math.abs(encounter.storyLevel - targetLevel);
    let weight = Math.max(0.8, 24 / (distance + 1));

    if (encounter.storyLevel > targetLevel) {
      weight *= Math.max(0.22, 0.72 - distance * 0.08);
    }

    if (encounter.storyLevel < targetLevel) {
      weight *= Math.max(0.5, 1 - (targetLevel - encounter.storyLevel) * 0.06);
    }

    return { encounter, weight };
  });
  const eventWeighted = DEPLOY_EVENTS.map((encounter) => {
    const distance = Math.abs(encounter.storyLevel - targetLevel);
    return { encounter, weight: Math.max(1.4, 5 - distance * 0.8) };
  });
  const weighted = [...enemyWeighted, ...eventWeighted];

  const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const item of weighted) {
    roll -= item.weight;
    if (roll <= 0) return item.encounter;
  }

  return weighted[weighted.length - 1].encounter;
};

const getMidnightNews = (maxTier, maxPath) => {
  const dateStr = `조선 16XX년 O월 O일 (대장간 일보)`;
  let title;
  let body;

  if (maxTier === 7) {
    if (maxPath === '1H') {
      title = "독보적인 철제 주술의 완성, 백제 칠지도 복원 성공!";
      body = "오늘 한양의 대장간에서 전설적인 칠지도가 탄생하였다. 백제 장인의 불꽃이 다시 피어난 듯한 기세에 조종 대신들은 물론 온 백성이 몰려들어 칼날의 영롱한 일곱 가지 빛깔을 감탄하며 바라보았다. 대장간의 품격이 국보급으로 승격되었다는 후문이다.";
    } else {
      title = "삼척서천 산하동색! 이충무공 장검의 장엄한 귀환!";
      body = "오늘 조선의 바다를 호령했던 이충무공 장검이 복원 완료되었다. 칼집을 빼는 순간 푸른빛 검기가 한양 하늘을 갈랐으며, 동해의 왜구들이 검의 마력에 눌려 뱃머리를 돌렸다는 급보가 전달되었다. 대장장이는 한양 최고의 애국 장인으로 임명되었다.";
    }
  } else if (maxTier === 6) {
    if (maxPath === '1H') {
      title = "벽사의 기운 사인검 완성, 한양의 요괴 소탕 개시!";
      body = "호랑이의 영력이 깃든 사인검이 대장간에서 출현했다. 검이 완성되자마자 서대문 밖 도깨비들이 비명을 지르며 도망쳤으며, 마수들이 모두 정화되는 기적이 일어났다. 국왕께서는 대장장이에게 정3품 명장 벼슬을 내리셨다.";
    } else {
      title = "장군의 월도 휘두르니, 천리를 질주하는 용맹함!";
      body = "오늘 위엄 있는 장군의 월도가 불꽃 속에서 벼려졌다. 기마 무관들이 칼을 보고 무릎을 꿇었으며, 월도의 강력한 파괴력 덕분에 대장간 인근의 들짐승 침입이 완벽히 차단되었다는 소식이다.";
    }
  } else if (maxTier === 5) {
    if (maxPath === '1H') {
      title = "명품 나전칠기 효자손 등장, 팔도 노인들의 격찬!";
      body = "자개 장식이 수놓아진 최고급 효자손이 대장간에서 출하되었다. 긁는 부위의 정밀함과 아름다움에 온 나라 어르신들이 줄을 서서 대장장이를 찬양하고 있다. 효도 문화의 새로운 지평을 열었다는 극찬을 받았다.";
    } else {
      title = "천하대장군 장승이 무기로? 대장장이 괴력에 관아 발칵!";
      body = "오늘 아침, 대장간 입구에 마을 수호신 장승이 통째로 널브러져 있는 것을 순라군이 발견했다. 대장장이가 강화용 소재 혹은 무기로 쓰기 위해 괴력으로 장승을 뽑아온 것으로 밝혀졌다. 관아에서는 공공기물 훼손죄 대신 대장장이의 엄청난 힘에 훈장을 수여하기로 했다.";
    }
  } else if (maxTier === 4) {
    if (maxPath === '1H') {
      title = "조선 군인의 혼, 환도 보급으로 국방력 강화!";
      body = "띠돈을 장착해 허리에 패용하기 간편한 조선 환도가 완성되었다. 훈련도감 군사들이 새 검을 보고 크게 기뻐하며 군사 훈련에 박차를 가하고 있다. 대장간은 병조 참판의 격려를 받았다.";
    } else {
      title = "왜검을 가르는 양손 대검, 임진왜란 쌍수도 위용!";
      body = "길고 묵직한 쌍수도의 칼날이 왜검을 반으로 가르며 완성되었다. 임진왜란 당시 왜적을 몰아낸 명검의 위용이 재현되었다.";
    }
  } else if (maxTier === 3) {
    if (maxPath === '1H') {
      title = "대장간에 문방사우 등장? 한석봉의 붓과 벼루 복원!";
      body = "학문을 닦던 서생들 사이에서 한성 대장간의 기묘한 소문이 돌고 있다. 어머니의 떡 썰기 불빛 속에서 탄생했다는 한석봉의 벼루와 붓이 복원되었기 때문이다. 글 공부를 하던 선비들이 벼루를 만져보려 줄을 섰으며, 학업 성취의 명물로 등극했다는 소식이다.";
    } else {
      title = "무쇠 가마솥 뚜껑 복원, 한성 최고 밥맛의 비결?";
      body = "오늘 대장간에서 단단하기 이를 데 없는 무쇠 가마솥 뚜껑이 복원되었다. 밥맛을 살려주는 묵직한 가마솥 뚜껑의 위용에 이웃 주민들이 찾아와 신기해하며 만져보았다. 웬만한 칼날은 다 튕겨낼 듯한 견고함이 돋보인다는 평이다.";
    }
  } else if (maxTier === 2) {
    if (maxPath === '1H') {
      title = "삼국시대 명검, 환두대도의 눈부신 재현!";
      body = "삼국시대 무장들이 사용하던 둥근고리칼 환두대도가 오늘 복원되었다. 고리 내부의 장식이 섬세하며, 예리한 칼날은 고대 철기 기술의 영광을 보여준다. 대장간의 명성이 서서히 퍼지기 시작했다.";
    } else {
      title = "조선 보병의 든든한 동반자, 협도 벼리기 성공!";
      body = "기병에 맞서 싸우기 용이한 조선의 전통 긴 칼창 협도가 대장간에서 완성되었다. 묵직하고 기다란 협도의 크기에 지나가던 포졸들도 발걸음을 멈추고 구경했다는 소문이다.";
    }
  } else {
    title = "초라한 시작: 낡은 몽둥이 한 자루";
    body = "오늘 대장간에서는 겨우 마당 구석에서 주운 듯한 낡은 몽둥이 한 자루만 덩그러니 놓여 있었다. 지나가던 백성들은 실망 섞인 한숨을 내쉬었으며, 대장장이는 아직 진정한 실력을 발휘하지 못한 채 풀무질만 열심히 하고 있다.";
  }

  return { dateStr, title, body };
};

const COMBAT_STORIES = {
  1: {
    winLogs: [
      "뒷골목 불량배들을 쫓아냈다!",
      "불량배들의 무기를 빼앗고 혼쭐을 내주었다!",
      "골목 대장이 주인공의 카리스마에 눌려 사죄하며 도망쳤다!"
    ],
    loseLogs: [
      "깡패 두목에게 발목을 잡혀 철수했다...",
      "뒤에서 날아온 흙돌맹이에 눈이 멀어 급히 도망쳤다...",
      "불량배들의 비겁한 협공에 무기를 놓치고 후퇴했다..."
    ],
    news: {
      lose: [
        {
          headline: "🚨 대망신! {weapon}을(를) 든 주인공, 골목길 도둑고양이에게 참패!",
          body: "한양 도성 안에서 믿을 수 없는 참사가 보고되었다. 늠름하게 {weapon}을(를) 치켜들고 출전했던 주인공이 골목길 한구석에서 노랑 들고양이 한 마리에게 잽싼 발톱 어택을 얻어맞고 눈물을 흘리며 퇴각했다는 소식이다. 목격자에 따르면 고양이는 주인공의 얼굴을 할퀴고 엽전 주머니를 유유히 물고 사라졌으며, 대장간 지붕 위 고양이들조차 이 소식을 듣고 한심하다는 듯 꼬리를 흔들었다고 전해진다."
        },
        {
          headline: "🥊 불량배들의 집단 몽둥이질! {weapon}의 주인공, 흙먼지만 잔뜩 마시다",
          body: "한양의 악명 높은 뒷골목 세력을 소탕하러 기세등등하게 떠났던 주인공이 불량배들의 비열한 모래 뿌리기 공격과 집단 몽둥이 찜질에 고전하다 후퇴하였다. 주인공이 자랑스럽게 쥐고 있던 {weapon}은(는) 허공만 갈랐고, 결국 엽전 주머니마저 빼앗긴 채 피멍이 든 무릎을 감싸 쥐고 대장간으로 기어들어왔다는 충격적인 제보가 접수되었다."
        },
        {
          headline: "🏃 뒷골목에서 들려온 비명! 주인공, 도망치는 깡패들에게 되려 쫓겨나",
          body: "정의감에 불타 뒷골목 깡패 소탕에 나섰던 주인공이 오히려 깡패들의 매서운 눈빛과 기세에 눌려 제대로 싸워보지도 못하고 줄행랑을 쳤다. 목격자에 따르면, 주인공은 {weapon}을(를) 거꾸로 쥔 채 '사람 살려!'를 외치며 좁은 한양 골목길을 전력 질주했고, 깡패들은 배를 잡고 비웃었다고 전한다."
        }
      ]
    }
  },
  2: {
    winLogs: [
      "멧돼지 떼를 산속 깊이 몰아냈다!",
      "거대한 돌진을 받아쳐 멧돼지 대장을 쓰러뜨렸다!",
      "날카로운 일격으로 멧돼지 가죽을 뚫고 사냥에 성공했다!"
    ],
    loseLogs: [
      "멧돼지 돌진에 밀려 산에서 굴러 내려왔다...",
      "멧돼지의 묵직한 몸통 박치기에 날아가 엉덩이를 찧었다...",
      "기세등등하게 나타난 거대 멧돼지의 기포(氣泡)에 눌려 퇴각했다..."
    ],
    news: {
      lose: [
        {
          headline: "🐗 멧돼지의 엉덩이 충격! 주인공, 지리산 비탈길에서 데구르르...",
          body: "지리산 인근 농가를 공포에 몰아넣던 거대 멧돼지를 소탕하러 갔던 주인공이 멧돼지의 저돌적인 엉덩이 밀치기 전술에 밀려 퇴각하였다. 주인공은 강력한 {weapon}으로 적을 위협하려 했으나, 멧돼지의 묵직한 돌격 앞에선 속수무책이다. 다행히 무기는 흠집 하나 없이 멀쩡하나, 산비탈을 굴러 내려온 주인공의 엉덩이와 자존심에는 지울 수 없는 큰 스크래치가 남았다는 서글픈 소문이다."
        },
        {
          headline: "🌲 지리산 날벼락! 멧돼지 돌격에 날아간 주인공, 나무 위에 대롱대롱",
          body: "지리산의 골칫거리 멧돼지 사냥에 나섰던 주인공이 멧돼지의 무자비한 뿔 들이받기 공격에 공중으로 3미터 이상 붕 떠올라 참나무 가지에 걸리는 수모를 겪었다. 주인공은 참나무에 걸린 채 {weapon}을(를) 휘두르며 살려달라고 애원했고, 멧돼지들은 유유히 도토리만 까먹으며 조롱했다는 소식이다."
        },
        {
          headline: "🐗 멧돼지의 대반격! 주인공, 사냥꾼에서 도망자로 신세 전락",
          body: "사냥을 위해 지리산 깊은 곳에 잠입한 주인공이 성난 멧돼지 무리의 역습에 휘말렸다. 멧돼지들의 매서운 콧김과 눈빛에 겁을 먹은 주인공은 {weapon}을(를) 던져두고 나무 위로 기어 올라갔고, 멧돼지 무리가 대장간 방향으로 주인공을 집요하게 추격하여 결국 전리품 하나 없이 빈손으로 철수했다."
        }
      ]
    }
  },
  3: {
    winLogs: [
      "호랑이를 굴복시키고 백두산에서 돌아왔다!",
      "맹렬한 포효를 가르고 호랑이의 이마를 강타해 격퇴했다!",
      "백두산 산군의 꼬리를 잡고 휘둘러 항복을 받아냈다!"
    ],
    loseLogs: [
      "호랑이의 앞발 후려치기에 도망쳤다...",
      "백두산 호랑이의 날카로운 포효에 다리가 풀려 주저앉았다...",
      "눈보라 속에서 습격해온 굶주린 백두산 산군의 기세에 밀려 도망쳤다..."
    ],
    news: {
      lose: [
        {
          headline: "🐯 숲의 제왕 백두산 호랑이의 위엄, 주인공 앞발치기 한 대에 떡실신!",
          body: "백두산의 영험한 호랑이를 제압하기 위해 대담하게 북으로 향했던 주인공이 빈손으로 돌아왔다. 호랑이와 마주한 주인공이 {weapon}을(를) 휘두르며 기세를 잡으려 했으나, 호랑이가 뿜어내는 호효(咆哮)에 온몸이 얼어붙고 말았다. 호랑이는 귀찮다는 듯이 거대한 앞발로 뺨을 한 대 툭 쳤고, 주인공은 그대로 눈밭을 수십 바퀴 굴렀다고 한다."
        },
        {
          headline: "🐯 '어흥' 한 방에 기절! 백두산 호랑이 앞에서 쥐가 난 주인공",
          body: "백두산 산군(山君)으로 불리는 대형 호랑이를 잡겠다고 나선 주인공이 호랑이의 웅장한 포효 소리에 소스라치게 놀라 다리에 쥐가 나는 사태가 벌어졌다. 꼼짝달싹 못 하게 된 주인공은 {weapon}을(를) 지팡이 삼아 눈물겹게 기어서 산을 내려와야 했으며, 사냥꾼들은 무리한 도전 대신 든든히 무기를 더 강화하고 오라며 위로를 건넸다."
        },
        {
          headline: "❄️ 백두산 눈보라와 붉은 눈빛! 호랑이의 꼬리치기에 혼비백산한 주인공",
          body: "매서운 백두산 칼바람 속에서 백호(白虎)를 추적하던 주인공이 호랑이의 꼬리 휘두르기에 가슴팍을 정통으로 맞고 뒤로 자빠졌다. 호랑이는 사냥할 가치도 없다는 듯이 콧방귀를 뀌며 동굴로 들어갔고, 주인공은 눈 속에 파묻힌 {weapon}을(를) 간신히 찾아내 엉금엉금 도망쳐 내려왔다."
        }
      ]
    }
  },
  4: {
    winLogs: [
      "홍길동도 인정한 무예! 명장으로 칭송받았다!",
      "홍길동의 분신술 속에서 진짜 홍길동을 찾아내 격타했다!",
      "현란한 도술을 날카로운 검풍으로 베어버리고 판정승을 거두었다!"
    ],
    loseLogs: [
      "홍길동의 묘한 분신술에 허를 찔려 쫓겨났다...",
      "길동이 동풍으로 불어넣은 나뭇잎 폭풍에 시야를 가려 패배했다...",
      "축지법을 쓰는 홍길동의 잔상만 베다가 체력이 다해 퇴각했다..."
    ],
    news: {
      lose: [
        {
          headline: "🎭 의적 홍길동 가라사대: '무기는 신묘하나 다루는 솜씨가 투박하구나!'",
          body: "주인공이 동에 번쩍 서에 번쩍하는 활빈당의 본거지에 출두하여 비무를 신청했으나 패배의 쓴잔을 마셨다. 홍길동은 주인공이 들고 온 {weapon}의 아름다운 모양새를 극찬하면서도, 화려한 분신술과 동풍을 일으키는 나뭇잎 도술로 주인공의 혼을 쏙 빼놓았다. 결국 주인공은 엽전 주머니 속 흙먼지까지 활빈당에게 기부당한 채(?) '수련을 더 쌓고 오라'는 훈계를 들으며 돌아왔다."
        },
        {
          headline: "💨 도술에 속은 주인공! 활빈당 허수아비만 100번 베다 체력 방전",
          body: "활빈당 대수령 홍길동과 한 판 승부를 벌인 주인공이 길동의 환술에 속아 짚단으로 만든 허수아비만 온종일 베다가 스스로 지쳐 쓰러졌다. 홍길동은 유유히 구름을 타고 공중에서 구경하다가, 지친 주인공에게 시원한 식혜 한 잔을 건네며 '대장간에 돌아가 풀무질이나 더 연습하거라'라며 훈계를 전했다."
        },
        {
          headline: "🎭 분신 8명에게 둘러싸인 주인공! 길동의 꿀밤 한 대에 비무 항복 선언",
          body: "홍길동의 비무에 응한 주인공이 동서남북에서 솟구치는 8명의 홍길동 분신들에게 둘러싸여 정신을 차리지 못했다. 진짜 길동은 주인공의 등 뒤로 소리 없이 나타나 가볍게 꿀밤을 한 대 때렸고, 주인공은 깜짝 놀라 비명을 지르며 항복을 선언하고 허탈하게 복귀했다."
        }
      ]
    }
  },
  5: {
    winLogs: [
      "왜구 선단을 격침시키고 바다를 되찾았다!",
      "왜구 해적들의 배에 도약해 두목의 칼을 부러뜨리고 승리했다!",
      "적선을 베어 가라앉혀 왜구들을 바다로 모두 쓸어 넣었다!"
    ],
    loseLogs: [
      "왜구의 조총 사격에 바다로 풍덩 빠졌다...",
      "갑판 위에서 적들의 집단 칼바람 공격에 밀려 퇴각했다...",
      "왜구 함선이 쏜 낡은 대포의 폭풍에 휩쓸려 튕겨 나갔다..."
    ],
    news: {
      lose: [
        {
          headline: "🏴‍☠️ 남해안 조총 포격에 혼비백산... 왜선 격퇴전에서 침몰 위기 모면",
          body: "남해를 어지럽히는 왜구 선단을 격파하려 배를 타고 나선 주인공이 조총 세례에 가로막혀 퇴각했다. 주인공이 배 위에서 {weapon}의 칼날을 세우자 왜구들은 일제히 조총을 쏘아대며 낡은 대포를 쏘아댔다. 포탄이 바다에 떨어져 튀어오른 엄청난 물보라와 화약 연기에 시야를 빼앗긴 주인공은 바닷물을 실컷 들이마신 채 겨우 나룻배를 저어 도망쳐 나왔다."
        },
        {
          headline: "🌊 앗 나의 옷가지가! 조총 화약 불꽃에 콧구멍만 까매진 채 생환한 주인공",
          body: "남해 바다로 출전해 왜구선에 호기롭게 뛰어올랐던 주인공이 적들의 비오듯 쏟아지는 불화살과 화약 공격에 무예를 펼치지도 못하고 강제로 수영을 해야 했다. 불화살에 옷깃이 다 타들어가고 머리카락과 콧구멍이 까맣게 그을린 채 바다로 탈출하는 굴욕을 겪었으며, 해안 경비병들은 무기 외에 해전에 맞는 전술적 훈련이 시급하다고 전했다."
        },
        {
          headline: "🏴‍☠️ 나룻배 침몰! 왜선 갈고리 공격에 {weapon}을(를) 들고 허우적댄 주인공",
          body: "왜구들의 거대 함선에 나룻배 한 자루로 접근하던 주인공이 적들이 던진 거대한 쇠갈고리와 돌멩이 세례에 배가 전복되는 위기를 겪었다. 물에 빠진 와중에도 {weapon}을(를) 놓치지 않으려 허우적대다가 왜구들의 비웃음 소리를 뒤로한 채 거북이처럼 기어 나와 목숨만 겨우 건져 생환했다."
        }
      ]
    }
  },
  6: {
    winLogs: [
      "여진족 기병을 몰아내고 북방 초소를 지켜냈다!",
      "여진족의 갑옷을 일격에 베어내고 철기병의 추격을 와해시켰다!",
      "적의 기마 대장을 말 위에서 단숨에 떨어뜨리고 북방 영토를 수호했다!"
    ],
    loseLogs: [
      "말발굽 먼지를 잔뜩 마시고 후퇴했다...",
      "여진족 철기대의 조직적인 기마 포위망을 뚫지 못하고 철수했다...",
      "북방 벌판의 무서운 칼바람과 여진족의 화살 세례에 후퇴했다..."
    ],
    news: {
      lose: [
        {
          headline: "🏇 말발굽 소리에 흙먼지만 켁켁! 북방 여진족 철기병의 벽에 가로막히다",
          body: "북방 영토 수복을 위해 거침없이 출정했던 주인공이 여진족 철기 기동대의 기습 전술에 밀려 철수하였다. 광활한 만주 벌판에서 {weapon}을(를) 꺼내 든 주인공을 본 여진족 기병들은 무기에서 풍기는 심상치 않은 오라에 놀라 포위 전술을 전개했다. 사방에서 흙먼지를 일으키며 말 고삐를 당기는 적들의 기세에 눈을 뜰 수 없었던 주인공은 한양 방향으로 필사적인 질주 끝에 생환했다."
        },
        {
          headline: "🏹 북방의 철화살 비! {weapon}의 주인공, 기마대의 흙먼지에 길을 잃다",
          body: "북방 국경을 침범한 여진족 철기 부대와 맞서기 위해 벌판으로 나선 주인공이 적들의 시야를 가리는 먼지 전술과 화살 사격에 방향 감각을 잃었다. 여진족의 훈련된 기마 전술에 완전히 가로막혀 {weapon}을(를) 제대로 휘두르지도 못했으며, 적의 말발굽이 쓸고 간 흙먼지만 배부르게 들이마신 채 눈물겹게 후퇴했다는 장병들의 전언이다."
        },
        {
          headline: "🏇 만주 벌판의 맹추격! 여진족 기마대장에게 투구 뺏기고 돌아온 주인공",
          body: "북방 기마병들의 압도적인 돌격력에 맞서 싸우려던 주인공이 적들의 거침없는 기마 차징 공격에 밀려 뒤로 후퇴해야만 했다. 여진족 대장이 채찍을 휘두르며 주인공의 투구를 낚아챘고, 주인공은 투구 없이 {weapon}만 꼭 쥔 채 헐레벌떡 대장간으로 도망쳐 돌아와 임금님의 깊은 탄식을 자아냈다."
        }
      ]
    }
  },
  7: {
    winLogs: [
      "이무기를 베어냈다! 조선의 영웅으로 역사에 이름을 새겼다!",
      "여의주를 물고 승천하려는 이무기의 목을 강타해 참수했다!",
      "이무기가 뿜는 푸른 번개를 온몸으로 받아치며 여의주를 파괴했다!"
    ],
    loseLogs: [
      "이무기의 번개벼락에 쓸려 강물에 떠내려갔다...",
      "이무기가 한강을 굽이치며 일으킨 쓰나미에 휩쓸려 패배했다...",
      "태풍 속에 웅크린 이무기의 거대한 꼬리에 정통으로 맞아 튕겨 나갔다..."
    ],
    news: {
      win: [
        {
          headline: "🎉 천지개벽! {weapon}의 영웅, 한강의 이무기를 참수하고 나라를 구하다!",
          body: "오늘 한양 한복판에서 역사적인 대전투가 발발하였다. 여의주를 물고 한양을 수몰시키려던 백색 이무기에 맞서, 주인공이 스스로 벼린 {weapon}을(를) 들고 단신으로 돌격하였다. 이무기의 비늘을 가르는 웅장한 검기가 번개처럼 내리꽂히자 요괴는 비명을 지르며 고꾸라졌고, 흩어진 여의주의 기운이 한양을 평화롭게 물들였다. 임금께서는 주인공에게 나라의 영웅 칭호와 함께 엄청난 포상금을 하사하셨으며, 온 백성들이 거리에 나와 어깨춤을 추고 있다."
        },
        {
          headline: "⚡ 이무기의 신화를 종결짓다! {weapon}으로 용을 벼려낸 조선의 참된 구원자!",
          body: "승천하여 재앙을 몰고 오려던 태고의 요괴 이무기가 마침내 주인공의 무자비한 철퇴에 쓰러졌다. 주인공은 먹구름 속에서 뿜어져 나오는 벼락을 {weapon}의 몸체로 흡수하여 역으로 방출, 이무기의 심장을 정통으로 뚫었다. 요괴가 소멸하며 내린 단비가 팔도 삼천리의 흉작을 해결하였고, 주인공은 한양 최고의 신화적인 명장으로 역사 서적에 영원히 박제되었다."
        },
        {
          headline: "🏆 여의주를 파괴한 영웅! {weapon}의 전설, 한양에 신비한 영광의 비가 내리다",
          body: "한강 상류를 뒤덮은 거대한 폭풍 속에서 이무기와의 격투가 종결되었다. 주인공이 날린 신묘한 검기가 이무기가 물고 있던 불타는 여의주를 반으로 갈랐고, 요괴는 힘을 잃고 한강 깊은 곳으로 침몰하였다. 이무기가 소멸한 자리에는 신비한 황금빛 안개가 내려앉았고, 주인공은 나라의 진정한 영웅으로 등극하며 대장간은 국보 제작소로 승격되었다."
        }
      ],
      lose: [
        {
          headline: "⚡ 이무기의 푸른 벼락 폭풍! 주인공, 한강 물귀신이 될 뻔한 극적 생환",
          body: "승천을 노리는 이무기의 폭풍우에 대적했던 주인공이 한강 변에서 참혹한 패배를 겪었다. {weapon}의 모든 기운을 끌어모아 이무기의 심장을 겨냥했으나, 하늘을 뒤덮은 먹구름 속에서 떨어진 십여 줄기의 푸른 번개가 한강 물을 끓여 올리며 주인공을 직격했다. 강한 물살에 휩쓸려 마포나루터까지 떠내려간 주인공은 주민들의 구출 덕분에 기적적으로 생존했다. 그는 병상에서 누워 '무기를 더 단단히 벼려 우주의 기운을 담아야만 뚫을 수 있을 것'이라며 주먹을 쥐었다."
        },
        {
          headline: "🌊 이무기가 부린 거대한 홍수! 주인공, 한강 소용돌이에 휘말려 도망",
          body: "한강을 삼키며 승천을 준비하던 요괴 이무기 소탕전에 임한 주인공이 이무기의 꼬리 휘두르기가 만들어낸 거대 소용돌이에 휩쓸려 나룻배가 박살나고 말았다. 주인공은 {weapon}을(를) 꼭 쥔 채 필사적으로 개구리헤엄을 치며 뚝섬나루터까지 떠내려와 목숨을 건졌다. 구출된 주인공은 요괴의 엄청난 힘에 혀를 내두르며 다시 벼리기로 돌아가 더 높은 강화를 다짐했다."
        },
        {
          headline: "🌀 먹구름 뒤에 숨은 이무기! 주인공, 태풍의 눈 속에서 무릎 꿇다",
          body: "태풍과 낙뢰를 자유자재로 다스리는 전설의 괴수 이무기에게 도전장을 던졌던 주인공이 태풍의 압도적인 바람 폭풍에 날아가 강둑에 처박혔다. 이무기가 번뜩이는 붉은 안광을 뿜어내며 한강 상류에서 노려보자 주인공은 기세에 완전히 질려 퇴각할 수밖에 없었다. 강변 주민들은 주인공의 도전에 경의를 표하면서도, 아직 무기의 강화가 이무기의 비늘을 베기엔 부족하다고 분석했다."
        }
      ]
    }
  }
};


const getCombatNews = (stageLevel, isWin, weaponName, tier, enemyName = '적') => {
  const titleDate = "조선 16XX년 O월 O일 (한성 일보 속보)";
  const formattedWeapon = `+${tier} [${weaponName}]`;

  if (!isWin) {
    return {
      titleDate,
      headline: `패배: ${enemyName} 조우에서 철수`,
      body: `${formattedWeapon}으로 맞섰지만 버티지 못했습니다. 이번 출진은 손실이 날 수 있으며, 무기가 손상되었을 수도 있습니다.`
    };
  }

  if (stageLevel < STAGES.length) {
    return {
      titleDate,
      headline: `귀환: ${enemyName}까지 돌파`,
      body: `${formattedWeapon}으로 조우를 넘기고 귀환했습니다. 얻은 전리품은 대장간에 정산됩니다.`
    };
  }

  const storyData = COMBAT_STORIES[stageLevel];
  if (!storyData) {
    return {
      titleDate,
      headline: isWin
        ? `⚔️ 전투 보고: 주인공, 조선 팔도 출진 완수!`
        : `⚔️ 전투 보고: 주인공, 조선 팔도 출진에서 생환!`,
      body: isWin
        ? `주인공이 ${formattedWeapon}을(를) 들고 ${enemyName}까지 꺾으며 조선 팔도 출진을 끝까지 완수했습니다.`
        : `주인공이 ${formattedWeapon}을(를) 들고 ${enemyName}에게 맞서다 가까스로 돌아왔습니다.`
    };
  }

  const options = isWin && stageLevel === 7
    ? storyData.news.win || []
    : storyData.news.lose || [];

  if (options.length === 0) {
    return {
      titleDate,
      headline: isWin
        ? `⚔️ 전투 보고: ${enemyName} 격퇴, 조선 팔도 출진 완수!`
        : `⚔️ 전투 보고: 주인공, 조선 팔도 출진에서 생환!`,
      body: isWin
        ? `주인공이 ${formattedWeapon}을(를) 들고 마지막 조우에서 ${enemyName}을(를) 물리쳤다. 험한 임무를 일곱 차례 넘긴 끝에 대장간에는 전리품과 함께 요란한 환호가 울려 퍼졌다.`
        : `주인공이 ${formattedWeapon}을(를) 들고 ${enemyName}에게 맞서다 가까스로 돌아왔습니다.`
    };
  }

  // Pick a random option
  const selected = options[Math.floor(Math.random() * options.length)];

  // Format placeholders
  const headline = selected.headline.replace(/{weapon}/g, formattedWeapon);
  const body = selected.body.replace(/{weapon}/g, formattedWeapon);

  return { titleDate, headline, body };
};

const getDeploymentFinalNews = (encounter, weaponName, tier, reward) => {
  if (encounter.kind === 'enemy') {
    return getCombatNews(encounter.storyLevel, true, weaponName, tier, encounter.name);
  }

  const titleDate = "조선 16XX년 O월 O일 (한성 일보 속보)";
  const formattedWeapon = `+${tier} [${weaponName}]`;
  const rewardText = reward >= 0 ? `+${reward} 냥` : `-${Math.abs(reward)} 냥`;
  const contextText = encounter.context ? ` ${encounter.context}` : '';
  const clueText = encounter.clue ? ` 현장 단서로는 ${encounter.clue}` : '';
  const settlementText = `최종 정산은 ${rewardText}입니다.`;

  if (encounter.kind === 'bond') {
    return {
      titleDate,
      headline: `인연: ${encounter.name}`,
      body: `${formattedWeapon}을(를) 들고 길 위에서 ${encounter.scene.enemyName}을(를) 만났습니다.${contextText}${clueText} 작은 도움은 전투보다 조용했지만, 다음 조우를 이어갈 힘이 되었습니다. ${settlementText}`
    };
  }

  if (encounter.kind === 'hazard') {
    return {
      titleDate,
      headline: `위험: ${encounter.name}`,
      body: `${formattedWeapon} 출진 중 ${encounter.name}에 휘말렸습니다.${contextText}${clueText} 이번 사건은 팔도 출진에서 적보다 길과 날씨, 사람의 욕심이 더 큰 손실을 만들 수 있음을 보여줍니다. ${settlementText}`
    };
  }

  if (encounter.kind === 'treasure') {
    return {
      titleDate,
      headline: `수확: ${encounter.name}`,
      body: `${formattedWeapon} 출진 중 ${encounter.name}을(를) 확인했습니다.${contextText}${clueText} 전투 없는 수확처럼 보여도, 남은 흔적은 다음 위험이나 새 인연으로 이어질 수 있습니다. ${settlementText}`
    };
  }

  return {
    titleDate,
    headline: `사건: ${encounter.name}`,
    body: `${formattedWeapon} 출진 중 ${encounter.name}을(를) 겪었습니다.${contextText}${clueText} ${settlementText}`
  };
};

const getDeploymentLoss = (accReward, storyLevel) => {
  const lossAmount = 8 + storyLevel * 3 + Math.floor(Math.random() * 8);
  const lootLoss = Math.min(accReward, lossAmount);
  const goldLoss = lossAmount - lootLoss;

  return {
    lossAmount,
    lootLoss,
    goldLoss,
    netReward: accReward - lootLoss - goldLoss,
  };
};

const ChromaKeyImage = ({ src, alt, className = "", style = {}, onError = null }) => {
  const [processedSrc, setProcessedSrc] = useState('');
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
    setProcessedSrc('');

    if (!src) return;

    const img = new Image();
    img.src = src;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const { width, height } = canvas;
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        const cornerOffsets = [
          0,
          (width - 1) * 4,
          (height - 1) * width * 4,
          (height * width - 1) * 4,
        ];
        const seeds = cornerOffsets.map(offset => [data[offset], data[offset + 1], data[offset + 2]]);
        const toleranceSq = 42 * 42;
        const visited = new Uint8Array(width * height);
        const queue = new Int32Array(width * height);
        let head = 0;
        let tail = 0;

        const isBackground = (pixelIndex) => {
          const offset = pixelIndex * 4;
          if (data[offset + 3] === 0) return false;
          const r = data[offset];
          const g = data[offset + 1];
          const b = data[offset + 2];
          return seeds.some(([sr, sg, sb]) => {
            const dr = r - sr;
            const dg = g - sg;
            const db = b - sb;
            return dr * dr + dg * dg + db * db <= toleranceSq;
          });
        };

        const enqueue = (pixelIndex) => {
          if (visited[pixelIndex] || !isBackground(pixelIndex)) return;
          visited[pixelIndex] = 1;
          queue[tail] = pixelIndex;
          tail += 1;
        };

        for (let x = 0; x < width; x += 1) {
          enqueue(x);
          enqueue((height - 1) * width + x);
        }
        for (let y = 0; y < height; y += 1) {
          enqueue(y * width);
          enqueue(y * width + width - 1);
        }

        while (head < tail) {
          const pixelIndex = queue[head];
          head += 1;
          data[pixelIndex * 4 + 3] = 0;

          const x = pixelIndex % width;
          const y = Math.floor(pixelIndex / width);
          if (x > 0) enqueue(pixelIndex - 1);
          if (x + 1 < width) enqueue(pixelIndex + 1);
          if (y > 0) enqueue(pixelIndex - width);
          if (y + 1 < height) enqueue(pixelIndex + width);
        }

        ctx.putImageData(imgData, 0, 0);
        setProcessedSrc(canvas.toDataURL());
      } catch {
        setProcessedSrc(src);
      }
    };
    img.onerror = () => {
      setHasError(true);
      if (onError) onError();
    };
  }, [src, onError]);

  if (hasError) {
    return <div className="image-fallback">⚠️</div>;
  }

  return (
    <img
      src={processedSrc || src}
      alt={alt}
      className={className}
      style={{ ...style, opacity: processedSrc ? 1 : 0.5, transition: 'opacity 0.2s' }}
    />
  );
};

const WeaponImage = ({ path, tier, name, className = "weapon-image" }) => {
  const [hasError, setHasError] = useState(false);

  const src = tier === 1 ? getImageUrl('weapon_1.png') : getImageUrl(`weapon_${path}_${tier}.png`);
  const handleError = useCallback(() => setHasError(true), []);

  if (hasError) {
    return (
      <div className="weapon-fallback">
        {path === '1H' ? '🗡️' : '🪓'}
      </div>
    );
  }

  return (
    <ChromaKeyImage
      src={src}
      alt={name}
      className={className}
      onError={handleError}
    />
  );
};

const EnemyImage = ({ src, name, fallback, className = "battle-enemy-img" }) => {
  const [hasError, setHasError] = useState(false);
  const handleError = useCallback(() => setHasError(true), []);

  if (hasError || !src) {
    return <span className="battle-enemy-fallback">{fallback}</span>;
  }

  return (
    <ChromaKeyImage
      src={src}
      alt={name}
      className={className}
      onError={handleError}
    />
  );
};

let sharedAudioContext = null;

const getAudioContext = () => {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!sharedAudioContext) {
    sharedAudioContext = new AudioContextClass();
  }

  if (sharedAudioContext.state === 'suspended') {
    sharedAudioContext.resume().catch(() => {});
  }

  return sharedAudioContext;
};

const playTone = (ctx, { freq, duration, type = 'sine', start = 0, volume = 0.08, bendTo = null }) => {
  const now = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (bendTo) {
    osc.frequency.exponentialRampToValueAtTime(bendTo, now + duration);
  }

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration + 0.03);
};

const playNoise = (ctx, { duration = 0.12, start = 0, volume = 0.04, filterFreq = 900 }) => {
  const now = ctx.currentTime + start;
  const buffer = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * duration)), ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }

  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  source.buffer = buffer;
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(filterFreq, now);
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start(now);
  source.stop(now + duration + 0.02);
};

const playSoundEffect = (name, enabled) => {
  if (!enabled) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  if (name === 'hammer') {
    playNoise(ctx, { duration: 0.1, volume: 0.06, filterFreq: 1400 });
    playTone(ctx, { freq: 180, bendTo: 95, duration: 0.12, type: 'square', volume: 0.045 });
    playTone(ctx, { freq: 760, bendTo: 420, duration: 0.08, type: 'triangle', volume: 0.035 });
  } else if (name === 'coin') {
    playTone(ctx, { freq: 880, duration: 0.07, type: 'triangle', volume: 0.04 });
    playTone(ctx, { freq: 1320, duration: 0.08, type: 'triangle', start: 0.06, volume: 0.035 });
  } else if (name === 'success') {
    playTone(ctx, { freq: 523, duration: 0.09, type: 'triangle', volume: 0.05 });
    playTone(ctx, { freq: 659, duration: 0.09, type: 'triangle', start: 0.08, volume: 0.05 });
    playTone(ctx, { freq: 784, duration: 0.16, type: 'triangle', start: 0.16, volume: 0.055 });
  } else if (name === 'tension') {
    playTone(ctx, { freq: 196, bendTo: 330, duration: 0.42, type: 'triangle', volume: 0.026 });
    playTone(ctx, { freq: 247, bendTo: 415, duration: 0.42, type: 'sine', start: 0.16, volume: 0.022 });
    playNoise(ctx, { duration: 0.5, start: 0.04, volume: 0.012, filterFreq: 1500 });
  } else if (name === 'near-success') {
    playTone(ctx, { freq: 659, duration: 0.11, type: 'triangle', volume: 0.036 });
    playTone(ctx, { freq: 784, duration: 0.14, type: 'triangle', start: 0.1, volume: 0.038 });
    playTone(ctx, { freq: 988, duration: 0.18, type: 'sine', start: 0.2, volume: 0.03 });
  } else if (name === 'fail') {
    playNoise(ctx, { duration: 0.22, volume: 0.055, filterFreq: 360 });
    playTone(ctx, { freq: 180, bendTo: 82, duration: 0.24, type: 'sawtooth', volume: 0.04 });
  } else if (name === 'crack') {
    playNoise(ctx, { duration: 0.08, volume: 0.05, filterFreq: 2400 });
    playTone(ctx, { freq: 1180, bendTo: 520, duration: 0.12, type: 'triangle', volume: 0.032 });
  } else if (name === 'shatter') {
    playNoise(ctx, { duration: 0.08, volume: 0.07, filterFreq: 2600 });
    playNoise(ctx, { duration: 0.16, start: 0.06, volume: 0.06, filterFreq: 900 });
    playNoise(ctx, { duration: 0.24, start: 0.14, volume: 0.045, filterFreq: 420 });
    playTone(ctx, { freq: 980, bendTo: 220, duration: 0.2, type: 'triangle', start: 0.02, volume: 0.04 });
    playTone(ctx, { freq: 196, bendTo: 73, duration: 0.34, type: 'sawtooth', start: 0.08, volume: 0.035 });
  } else if (name === 'deploy') {
    playTone(ctx, { freq: 196, duration: 0.08, type: 'square', volume: 0.035 });
    playTone(ctx, { freq: 294, duration: 0.1, type: 'square', start: 0.08, volume: 0.038 });
    playNoise(ctx, { duration: 0.18, start: 0.03, volume: 0.025, filterFreq: 700 });
  } else if (name === 'combat-hit') {
    playNoise(ctx, { duration: 0.12, volume: 0.065, filterFreq: 1100 });
    playTone(ctx, { freq: 260, bendTo: 130, duration: 0.1, type: 'square', volume: 0.04 });
  } else if (name === 'page') {
    playNoise(ctx, { duration: 0.08, volume: 0.025, filterFreq: 1800 });
    playTone(ctx, { freq: 440, duration: 0.05, type: 'triangle', volume: 0.025 });
  } else if (name === 'wrong') {
    playTone(ctx, { freq: 220, bendTo: 146, duration: 0.16, type: 'sawtooth', volume: 0.035 });
  }
};

function App() {
  const [gold, setGold] = useState(() => {
    try {
      const saved = localStorage.getItem('playerGold');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });
  const [tier, setTier] = useState(() => {
    try {
      const saved = localStorage.getItem('playerTier');
      return saved ? parseInt(saved, 10) : 1;
    } catch {
      return 1;
    }
  });
  const [path, setPath] = useState(() => {
    try {
      const saved = localStorage.getItem('playerPath');
      return saved === 'null' ? null : (saved || null);
    } catch {
      return null;
    }
  });
  const [currentQuiz, setCurrentQuiz] = useState(() => generateMathQuiz(QUIZ_MODES.MULTIPLICATION));
  const [logs, setLogs] = useState([]);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizPurpose, setQuizPurpose] = useState('gold');
  const [viewportMode, setViewportMode] = useState(getViewportMode);
  const [isViewportModeManual, setIsViewportModeManual] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(() => {
    try {
      return Boolean(document.fullscreenElement);
    } catch {
      return false;
    }
  });
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      return localStorage.getItem('soundEnabled') !== 'false';
    } catch {
      return true;
    }
  });

  // Deploy (출전) states
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [deployStep, setDeployStep] = useState(0); // index of current stage (0 to 6)
  const [deployLogs, setDeployLogs] = useState({}); // { 0: [...logs for stage 1], 1: [...logs for stage 2], ... }
  const [deployEncounters, setDeployEncounters] = useState({}); // { 0: encounter id, 1: encounter id, ... }
  const [deployStatus, setDeployStatus] = useState('idle'); // 'idle' | 'fighting' | 'decision' | 'finished'
  const [deployReward, setDeployReward] = useState(0);
  const [deployWeaponBroken, setDeployWeaponBroken] = useState(false);
  const [deployDecision, setDeployDecision] = useState(null); // { nextIndex, reward, completedIndex }
  const [lastDeploymentAt, setLastDeploymentAt] = useState(() => {
    try {
      const saved = localStorage.getItem('lastDeploymentAt');
      const parsed = saved ? parseInt(saved, 10) : 0;
      return Number.isFinite(parsed) ? parsed : 0;
    } catch {
      return 0;
    }
  });
  const [deployQuizCharge, setDeployQuizCharge] = useState(() => {
    try {
      const saved = localStorage.getItem('deployQuizCharge');
      const parsed = saved ? parseInt(saved, 10) : 0;
      return Number.isFinite(parsed) ? Math.min(parsed, DEPLOY_QUIZ_REQUIRED) : 0;
    } catch {
      return 0;
    }
  });
  const [nowTick, setNowTick] = useState(Date.now());
  const [combatShake, setCombatShake] = useState(false);
  const [newsReport, setNewsReport] = useState(null);

  // Page Navigation states
  const [currentDeployPage, setCurrentDeployPage] = useState(1); // 1-indexed (1 to 8: pages 1-7 are stages, page 8 is news)
  const [maxReachedPage, setMaxReachedPage] = useState(1); // max page unlocked so far

  // Animation states
  const [floatingTexts, setFloatingTexts] = useState([]);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancementPhase, setEnhancementPhase] = useState('idle'); // 'idle' | 'hammering' | 'judging'
  const [isStriking, setIsStriking] = useState(false);
  const [particles, setParticles] = useState([]);
  const [strikeTexts, setStrikeTexts] = useState([]);
  const [outcome, setOutcome] = useState(null); // 'success', 'fail', 'bonus', 'fakeout', 'false-bonus'
  const [outcomeWeaponName, setOutcomeWeaponName] = useState('');
  const [bonusUpgradeNotice, setBonusUpgradeNotice] = useState('');
  const [flashClass, setFlashClass] = useState('');

  // Blacksmith Apology & Recovery states
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [preFailureState, setPreFailureState] = useState(null); // { tier, path }
  const [recoveryQuiz, setRecoveryQuiz] = useState(null); // { step, correct, answers: [] }

  const deployLogViewerRef = useRef(null);
  const nextDeployEncounterRef = useRef(null);

  useEffect(() => {
    if (deployLogViewerRef.current) {
      deployLogViewerRef.current.scrollTop = deployLogViewerRef.current.scrollHeight;
    }
  }, [deployLogs, currentDeployPage]);

  useEffect(() => {
    const handleResize = () => {
      if (!isViewportModeManual) {
        setViewportMode(getViewportMode());
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isViewportModeManual]);

  useEffect(() => {
    document.documentElement.dataset.displayMode = VIEW_MODE_CLASS[viewportMode] || 'board';
  }, [viewportMode]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!lastDeploymentAt) return undefined;

    const timerId = window.setInterval(() => {
      setNowTick(Date.now());
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [lastDeploymentAt]);

  const [unlockedWeapons, setUnlockedWeapons] = useState(() => {
    try {
      const saved = localStorage.getItem('unlockedWeapons');
      return saved ? JSON.parse(saved) : ['common_1'];
    } catch {
      return ['common_1'];
    }
  });

  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [showNewspaperModal, setShowNewspaperModal] = useState(false);
  const [maxTierToday, setMaxTierToday] = useState(() => {
    try {
      const saved = localStorage.getItem('maxTierToday');
      return saved ? parseInt(saved, 10) : 1;
    } catch {
      return 1;
    }
  });
  const [maxPathToday, setMaxPathToday] = useState(() => {
    try {
      const saved = localStorage.getItem('maxPathToday');
      return saved === 'null' ? null : (saved || null);
    } catch {
      return null;
    }
  });
  const [activeTab, setActiveTab] = useState('1H');
  const [selectedGalleryItem, setSelectedGalleryItem] = useState({ key: 'common_1', item: WEAPON_TREE.common[1], path: 'common', tier: 1 });

  const addLog = (msg, type = 'info') => {
    setLogs(prev => [{ id: Date.now() + Math.random(), msg, type }, ...prev].slice(0, 5));
  };

  const playSfx = useCallback((name) => {
    playSoundEffect(name, soundEnabled);
  }, [soundEnabled]);

  const cycleViewportMode = () => {
    playSfx('page');
    setIsViewportModeManual(true);
    setViewportMode(currentMode => {
      const currentIndex = VIEW_MODES.indexOf(currentMode);
      const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % VIEW_MODES.length : 0;
      return VIEW_MODES[nextIndex];
    });
  };

  const toggleFullscreen = async () => {
    playSfx('page');

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      addLog(`전체화면 전환을 사용할 수 없습니다.`, 'warning');
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem('soundEnabled', soundEnabled ? 'true' : 'false');
    } catch (e) {
      console.error(e);
    }
  }, [soundEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem('lastDeploymentAt', lastDeploymentAt.toString());
    } catch (e) {
      console.error(e);
    }
  }, [lastDeploymentAt]);

  useEffect(() => {
    try {
      localStorage.setItem('deployQuizCharge', deployQuizCharge.toString());
    } catch (e) {
      console.error(e);
    }
  }, [deployQuizCharge]);

  useEffect(() => {
    try {
      localStorage.setItem('unlockedWeapons', JSON.stringify(unlockedWeapons));
    } catch (e) {
      console.error(e);
    }
  }, [unlockedWeapons]);

  useEffect(() => {
    try {
      localStorage.setItem('maxTierToday', maxTierToday.toString());
    } catch (e) {
      console.error(e);
    }
  }, [maxTierToday]);

  useEffect(() => {
    try {
      localStorage.setItem('maxPathToday', maxPathToday ? maxPathToday : 'null');
    } catch (e) {
      console.error(e);
    }
  }, [maxPathToday]);

  // Startup hook to check if a new day has arrived
  useEffect(() => {
    const todayStr = getTodayStr();
    const savedLastDate = localStorage.getItem('lastAccessDate');

    if (savedLastDate && savedLastDate !== todayStr) {
      // A new day has passed! Load previous max stats to show in the newspaper
      const savedMaxTier = localStorage.getItem('maxTierToday');
      const savedMaxPath = localStorage.getItem('maxPathToday');

      const prevMaxTier = savedMaxTier ? parseInt(savedMaxTier, 10) : 1;
      const prevMaxPath = savedMaxPath === 'null' ? null : (savedMaxPath || null);

      setMaxTierToday(prevMaxTier);
      setMaxPathToday(prevMaxPath);

      // Open the Newspaper report immediately
      setShowNewspaperModal(true);
      addLog(`🌅 새로운 조선의 아침이 밝아 전날의 결산 일보가 도착했습니다.`, 'warning');
    } else if (!savedLastDate) {
      // First time access
      localStorage.setItem('lastAccessDate', todayStr);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('playerGold', gold.toString());
    } catch (e) {
      console.error(e);
    }
  }, [gold]);

  useEffect(() => {
    try {
      localStorage.setItem('playerTier', tier.toString());
    } catch (e) {
      console.error(e);
    }
  }, [tier]);

  useEffect(() => {
    try {
      localStorage.setItem('playerPath', path ? path : 'null');
    } catch (e) {
      console.error(e);
    }
  }, [path]);

  const unlockWeapon = (targetTier, targetPath) => {
    const key = targetTier === 1 ? 'common_1' : `${targetPath}_${targetTier}`;
    setUnlockedWeapons(prev => {
      if (prev.includes(key)) return prev;
      return [...prev, key];
    });
  };

  const weaponName = getWeaponNameByState(tier, path);
  const displayedOutcomeWeaponName = outcomeWeaponName || weaponName;
  const outcomeWeaponLabel = outcome === 'success'
    ? `성공이다! ${displayedOutcomeWeaponName}`
    : outcome === 'bonus'
      ? `대성공! ${displayedOutcomeWeaponName}`
      : outcome === 'fakeout'
        ? `될 듯하다... ${displayedOutcomeWeaponName}`
        : outcome === 'false-bonus'
          ? `여기서 멈췄다... ${displayedOutcomeWeaponName}`
          : outcome === 'fail'
            ? `실패다! ${displayedOutcomeWeaponName}`
            : weaponName;

  const deployCooldownRemaining = Math.max(0, DEPLOY_COOLDOWN_MS - (nowTick - lastDeploymentAt));
  const isDeployCooldownReady = !lastDeploymentAt || deployCooldownRemaining <= 0;
  const isDeployQuizReady = deployQuizCharge >= DEPLOY_QUIZ_REQUIRED;
  const canStartDeployment = isDeployCooldownReady || isDeployQuizReady;
  const deployQuizRemaining = Math.max(0, DEPLOY_QUIZ_REQUIRED - deployQuizCharge);

  const openGoldQuiz = () => {
    setQuizPurpose('gold');
    setCurrentQuiz(generateMathQuiz(QUIZ_MODES.MULTIPLICATION));
    setShowQuizModal(true);
  };

  const openDeployQuiz = () => {
    setQuizPurpose('deploy');
    setCurrentQuiz(generateMathQuiz(QUIZ_MODES.DIVISION));
    setShowQuizModal(true);
  };

  const handleAnswer = (selected, e) => {
    if (selected === currentQuiz.a) {
      playSfx('coin');
      if (quizPurpose === 'deploy') {
        const nextCharge = Math.min(DEPLOY_QUIZ_REQUIRED, deployQuizCharge + 1);
        setDeployQuizCharge(nextCharge);
        if (nextCharge >= DEPLOY_QUIZ_REQUIRED) {
          addLog(`⚔️ 출진 게이지 충전 완료! 바로 출진할 수 있습니다.`, 'success');
          setShowQuizModal(false);
        } else {
          addLog(`⚔️ 출진 게이지 ${nextCharge}/${DEPLOY_QUIZ_REQUIRED} 충전.`, 'info');
        }
      } else {
        const reward = 50 + Math.floor(Math.random() * 50); // 50~99 gold
        setGold(g => g + reward);
        addLog(`[구구단 작업 완료] +${reward} 냥 획득!`, 'success');

        // Floating text effect
        const id = Date.now();
        const rect = e.target.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top;

        setFloatingTexts(prev => [...prev, { id, text: `+${reward}냥!`, x, y }]);
        setTimeout(() => {
          setFloatingTexts(prev => prev.filter(t => t.id !== id));
        }, 1000);
      }

    } else {
      playSfx('wrong');
      addLog(quizPurpose === 'deploy' ? `[풀무질 실수] 출진 게이지가 오르지 않았습니다.` : `[작업 실수] 엽전을 얻지 못했습니다.`, 'error');
    }
    // Next quiz immediately
    setCurrentQuiz(generateMathQuiz(quizPurpose === 'deploy' ? QUIZ_MODES.DIVISION : QUIZ_MODES.MULTIPLICATION));
  };

  const triggerFlash = (type) => {
    setFlashClass(`flash-${type}`);
    setTimeout(() => setFlashClass(''), 1000);
  };

  const triggerStrike = (text = '깡!', particleCount = 15) => {
    playSfx('hammer');
    setIsStriking(true);
    setTimeout(() => setIsStriking(false), 150);

    // Strike text pop
    const strikeId = `${Date.now()}-${Math.random()}`;
    const textX = 35 + Math.random() * 30;
    const textY = 25 + Math.random() * 20;
    setStrikeTexts(prev => [...prev, { id: strikeId, text, x: `${textX}%`, top: `${textY}%` }]);
    setTimeout(() => {
      setStrikeTexts(prev => prev.filter(t => t.id !== strikeId));
    }, 400);

    // Spark particles
    const newParticles = [];
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 80;
      const dx = Math.cos(angle) * speed;
      const dy = Math.sin(angle) * speed;
      newParticles.push({
        id: `${Date.now()}-strike-${i}-${Math.random()}`,
        left: '50%',
        top: '55%',
        dx: `${dx}px`,
        dy: `${dy}px`,
        type: 'spark'
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.includes(p)));
    }, 600);
  };

  const scheduleStrike = (delay, text, particleCount) => {
    setTimeout(() => triggerStrike(text, particleCount), Math.max(0, delay));
  };

  const triggerSuccessParticles = () => {
    const newParticles = [];
    for (let i = 0; i < 30; i++) {
      const dx = (Math.random() - 0.5) * 160;
      const dy = -80 - Math.random() * 120; // shoot upwards
      newParticles.push({
        id: `${Date.now()}-success-${i}-${Math.random()}`,
        left: `${35 + Math.random() * 30}%`,
        top: '55%',
        dx: `${dx}px`,
        dy: `${dy}px`,
        type: 'spark'
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.includes(p)));
    }, 600);
  };

  const triggerGreatSuccessParticles = (intensity = 1) => {
    const newParticles = [];
    const sparkCount = Math.round(42 * intensity);
    const rayCount = Math.round(12 * intensity);

    for (let i = 0; i < sparkCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 90 + Math.random() * 170;
      const dx = Math.cos(angle) * speed;
      const dy = Math.sin(angle) * speed - 40;
      newParticles.push({
        id: `${Date.now()}-great-spark-${i}-${Math.random()}`,
        left: `${43 + Math.random() * 14}%`,
        top: `${44 + Math.random() * 18}%`,
        dx: `${dx}px`,
        dy: `${dy}px`,
        type: 'bonus-spark'
      });
    }

    for (let i = 0; i < rayCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 110 + Math.random() * 120;
      newParticles.push({
        id: `${Date.now()}-great-ray-${i}-${Math.random()}`,
        left: '50%',
        top: '50%',
        dx: `${Math.cos(angle) * distance}px`,
        dy: `${Math.sin(angle) * distance}px`,
        rotate: `${angle}rad`,
        type: 'bonus-ray'
      });
    }

    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.includes(p)));
    }, 1400);
  };

  const triggerFailParticles = () => {
    const newParticles = [];
    for (let i = 0; i < 20; i++) {
      const dx = (Math.random() - 0.5) * 100;
      const dy = -50 - Math.random() * 60; // slow rise
      newParticles.push({
        id: `${Date.now()}-fail-${i}-${Math.random()}`,
        left: `${40 + Math.random() * 20}%`,
        top: '50%',
        dx: `${dx}px`,
        dy: `${dy}px`,
        type: 'smoke'
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.includes(p)));
    }, 1000);
  };

  const applySuccessfulUpgradeStep = (targetTier, targetPath) => {
    const nextTier = Math.min(MAX_WEAPON_TIER, targetTier);
    setTier(nextTier);
    if (nextTier > 1 && targetPath) {
      setPath(targetPath);
      setMaxPathToday(targetPath);
    }
    setMaxTierToday(mt => Math.max(mt, nextTier));
    unlockWeapon(nextTier, targetPath);
  };

  const continueGreatSuccessUpgrade = (currentDisplayTier, finalTargetTier, finalPath, bonusStepIndex = 1, totalBonusSteps = 1) => {
    const currentName = getWeaponNameByState(currentDisplayTier, finalPath);
    const nextTier = Math.min(MAX_WEAPON_TIER, currentDisplayTier + 1);
    const nextName = getWeaponNameByState(nextTier, finalPath);
    const isThirdUpgradeSurge = totalBonusSteps >= 2 && bonusStepIndex >= 2;
    const noticeText = isThirdUpgradeSurge
      ? '어어? 설마...한번 더?'
      : `...오잉? ${currentName} 안쪽의 결이 드러난다?`;
    const strikeDelay = getRandomDelay(1150, 450);
    const holdDelay = strikeDelay + getRandomDelay(950, 650);
    const bonusRevealDelay = holdDelay + getRandomDelay(1500, 800);
    const upgradeApplyDelay = bonusRevealDelay + getRandomDelay(2800, 950);
    setIsEnhancing(true);
    setEnhancementPhase('surging');
    setBonusUpgradeNotice(noticeText);
    setOutcome(null);
    triggerGreatSuccessParticles(0.65);
    addLog(isThirdUpgradeSurge ? `어어? 설마...한번 더?` : `...오잉? ${currentName} 안쪽의 결이 드러납니다.`, 'warning');

    scheduleStrike(360, '깡!', isThirdUpgradeSurge ? 18 : 14);
    scheduleStrike(880, '챙!', isThirdUpgradeSurge ? 20 : 16);
    scheduleStrike(strikeDelay, '번쩍!', 24);
    scheduleStrike(Math.min(holdDelay - 260, strikeDelay + 520), '카앙!', isThirdUpgradeSurge ? 24 : 18);

    setTimeout(() => {
      playSfx('tension');
      setBonusUpgradeNotice(isThirdUpgradeSurge ? '남은 잠재력을 더 끌어낸다...' : `${currentName} 숨은 힘이 올라온다...`);
      triggerStrike('...', 12);
    }, holdDelay);

    scheduleStrike(holdDelay + 620, isThirdUpgradeSurge ? '쾅!' : '깡!', isThirdUpgradeSurge ? 26 : 18);
    scheduleStrike(bonusRevealDelay - 360, '카앙!', isThirdUpgradeSurge ? 28 : 22);

    setTimeout(() => {
      playSfx('success');
      setOutcomeWeaponName(nextName);
      setOutcome('bonus');
      triggerGreatSuccessParticles(isThirdUpgradeSurge ? 1.45 : 1.15);
      triggerFlash('success');
      addLog(`🌟 대성공! 무기가 한 번 더 벼려집니다!`, 'great-success');
    }, bonusRevealDelay);

    setTimeout(() => {
      applySuccessfulUpgradeStep(nextTier, finalPath);

      if (nextTier < finalTargetTier) {
        setOutcome(null);
        setBonusUpgradeNotice('');
        setTimeout(() => {
          playSfx('tension');
          setBonusUpgradeNotice(`${nextName} 속의 결을 다시 두드린다...`);
          triggerStrike('...', 10);
        }, getRandomDelay(1200, 550));
        scheduleStrike(getRandomDelay(2050, 500), '챙...', 14);
        scheduleStrike(getRandomDelay(2650, 520), '카앙!', 20);
        setTimeout(() => {
          continueGreatSuccessUpgrade(nextTier, finalTargetTier, finalPath, bonusStepIndex + 1, totalBonusSteps);
        }, getRandomDelay(3150, 900));
        return;
      }

      setIsEnhancing(false);
      setEnhancementPhase('idle');
      setBonusUpgradeNotice('');
      setOutcome(null);
      addLog(`✨ 최종 강화 +${nextTier} 강 도달!`, 'success');
    }, upgradeApplyDelay);
  };

  const continueFalseGreatSuccessTease = (currentDisplayTier, finalPath) => {
    const currentName = getWeaponNameByState(currentDisplayTier, finalPath);
    const strikeDelay = getRandomDelay(1050, 450);
    const holdDelay = strikeDelay + getRandomDelay(1050, 650);
    const falseRevealDelay = holdDelay + getRandomDelay(1450, 850);
    const settleDelay = falseRevealDelay + getRandomDelay(1550, 800);
    setIsEnhancing(true);
    setEnhancementPhase('surging');
    setBonusUpgradeNotice(`...오잉? ${currentName} 안쪽의 결이 드러난다?`);
    setOutcome(null);
    triggerGreatSuccessParticles(0.55);
    addLog(`...오잉? ${currentName} 안쪽의 결이 드러납니다.`, 'warning');

    scheduleStrike(420, '깡!', 12);
    scheduleStrike(940, '챙!', 14);
    scheduleStrike(strikeDelay, '번쩍!', 18);
    scheduleStrike(Math.min(holdDelay - 240, strikeDelay + 520), '카앙!', 16);

    setTimeout(() => {
      playSfx('tension');
      setBonusUpgradeNotice(`${currentName} 숨은 힘이 올라올 듯하다...`);
      triggerStrike('...', 10);
    }, holdDelay);

    scheduleStrike(holdDelay + 620, '깡!', 16);
    scheduleStrike(falseRevealDelay - 360, '챙...', 14);

    setTimeout(() => {
      playSfx('page');
      setOutcomeWeaponName(currentName);
      setOutcome('false-bonus');
      triggerGreatSuccessParticles(0.42);
      addLog(`...하지만 더 변하지는 않았습니다. 대성공인 줄 알았지만 +${currentDisplayTier} 강에서 멈췄습니다.`, 'info');
    }, falseRevealDelay);

    setTimeout(() => {
      setIsEnhancing(false);
      setEnhancementPhase('idle');
      setBonusUpgradeNotice('');
      setOutcome(null);
    }, settleDelay);
  };

  const handleUpgrade = (selectedPath = null) => {
    if (isEnhancing || outcome) return; // Prevent multiple clicks

    const currentRateInfo = UPGRADE_RATES[tier];
    if (!currentRateInfo) return;

    if (gold < currentRateInfo.cost) {
      addLog(`엽전이 부족합니다. (필요: ${currentRateInfo.cost}냥)`, 'warning');
      return;
    }

    // Pay cost and start suspense animation
    setGold(g => g - currentRateInfo.cost);
    setIsEnhancing(true);
    setEnhancementPhase('hammering');
    addLog(`대장장이가 망치를 고쳐 쥐고 벼리기를 시작합니다...`, 'info');

    const strikeSequence = [
      { delay: 240, text: '깡!', particles: 12 },
      { delay: 620, text: '챙!', particles: 14 },
      { delay: 1000, text: '탕!', particles: 15 },
      { delay: 1380, text: '카앙!', particles: 18 },
      { delay: 1780, text: '쨍!', particles: 16 },
      { delay: 2180, text: '쾅!', particles: 20 },
      { delay: 2580, text: '깡!', particles: 18 },
      { delay: 2940, text: '쾅!', particles: 24 },
    ];

    strikeSequence.forEach(({ delay, text, particles }) => {
      setTimeout(() => triggerStrike(text, particles), delay);
    });

    const judgingDelay = getRandomDelay(3050, 520);
    const finalStrikeDelay = judgingDelay + getRandomDelay(260, 420);
    const decisionDelay = finalStrikeDelay + getRandomDelay(330, 680);

    setTimeout(() => {
      setEnhancementPhase('judging');
      playSfx('tension');
      addLog(`불꽃이 무기 위에서 크게 흔들립니다. 성공인가... 실패인가...`, 'warning');
    }, judgingDelay);

    setTimeout(() => triggerStrike(Math.random() < 0.45 ? '쾅!' : '카앙!', 30), finalStrikeDelay);

    // Decision after a longer dramatic forge sequence
    setTimeout(() => {
      setIsEnhancing(false);
      setEnhancementPhase('idle');
      setBonusUpgradeNotice('');
      const roll = Math.random() * 100;

      if (roll <= currentRateInfo.rate) {
        // Success
        const finalPath = path || selectedPath;
        const firstTier = Math.min(MAX_WEAPON_TIER, tier + 1);
        setOutcomeWeaponName(getWeaponNameByState(firstTier, finalPath));
        playSfx('success');
        setOutcome('success');
        triggerSuccessParticles();
        triggerFlash('success');
        addLog(`✨ 성공이다! 무기가 더욱 단단해집니다.`, 'success');

        setTimeout(() => {
          const totalSteps = getGreatSuccessStepCount(tier);
          const finalTargetTier = Math.min(MAX_WEAPON_TIER, tier + totalSteps);
          const shouldFalseAlarm = totalSteps === 1 && firstTier < MAX_WEAPON_TIER && Math.random() * 100 < GREAT_SUCCESS_FALSE_ALARM_RATE;

          applySuccessfulUpgradeStep(firstTier, finalPath);

          if (finalTargetTier > firstTier) {
            continueGreatSuccessUpgrade(firstTier, finalTargetTier, finalPath, 1, finalTargetTier - firstTier);
          } else if (shouldFalseAlarm) {
            continueFalseGreatSuccessTease(firstTier, finalPath);
          } else {
            setOutcome(null);
          }
        }, getRandomDelay(2850, 950));
      } else {
        // Failure
        const fakeoutFailure = Math.random() < 0.55;
        setPreFailureState({ tier, path });

        if (fakeoutFailure) {
          const holdDelay = getRandomDelay(950, 650);
          const crackDelay = holdDelay + getRandomDelay(850, 650);
          const shatterDelay = crackDelay + getRandomDelay(850, 700);
          const recoveryDelay = shatterDelay + getRandomDelay(1750, 850);
          playSfx('near-success');
          setOutcomeWeaponName(weaponName);
          setOutcome('fakeout');
          triggerSuccessParticles();
          triggerFlash('success');
          addLog(`✨ 거의 됐다...! 불꽃이 무기 표면에 달라붙습니다.`, 'warning');

          setTimeout(() => {
            playSfx('tension');
            triggerStrike('...', 10);
          }, holdDelay);

          setTimeout(() => {
            playSfx('crack');
            triggerStrike('쩌적!', 22);
          }, crackDelay);

          setTimeout(() => {
            playSfx('shatter');
            setOutcomeWeaponName(weaponName);
            setOutcome('fail');
            triggerFailParticles();
            triggerFlash('fail');
            addLog(`💥 쨍그랑! 될 듯하던 무기가 깨져 버렸습니다.`, 'error');
          }, shatterDelay);

          setTimeout(() => {
            setOutcome(null);
            setShowRecoveryModal(true);
          }, recoveryDelay);
        } else {
          playSfx('shatter');
          setOutcomeWeaponName(weaponName);
          setOutcome('fail');
          triggerFailParticles();
          triggerFlash('fail');
          addLog(`💥 실패다! 예고 없이 금이 가며 무기가 깨졌습니다.`, 'error');

          setTimeout(() => {
            setOutcome(null);
            setShowRecoveryModal(true);
          }, getRandomDelay(1550, 700));
        }
      }
    }, decisionDelay);
  };

  const handleAcceptRecovery = () => {
    setRecoveryQuiz({
      active: true,
      step: 0,
      correct: 0,
      answers: []
    });
    setCurrentQuiz(generateMathQuiz(QUIZ_MODES.DIVISION));
  };

  const handleDeclineRecovery = () => {
    const downgraded = getDowngradedWeaponState(preFailureState?.tier || tier, preFailureState?.path || path, 2);
    setTier(downgraded.tier);
    setPath(downgraded.path);
    addLog(`💥 복구를 포기하여 무기가 +${downgraded.tier} 단계로 손상되었습니다.`, 'error');
    setShowRecoveryModal(false);
    setPreFailureState(null);
  };

  const handleRecoveryAnswer = (selected) => {
    if (!recoveryQuiz) return;

    const isCorrect = selected === currentQuiz.a;
    const newAnswers = [...recoveryQuiz.answers, isCorrect];
    const newCorrect = recoveryQuiz.correct + (isCorrect ? 1 : 0);
    const nextStep = recoveryQuiz.step + 1;

    if (nextStep < 5) {
      setRecoveryQuiz({
        ...recoveryQuiz,
        step: nextStep,
        correct: newCorrect,
        answers: newAnswers
      });
      setCurrentQuiz(generateMathQuiz(QUIZ_MODES.DIVISION));
    } else {
      // 5 questions finished! Calculate success rate and roll!
      const finalCorrect = newCorrect;
      const recoveryRate = RECOVERY_BASE_RATE + finalCorrect * RECOVERY_CORRECT_BONUS;
      const roll = Math.random() * 100;

      if (roll <= recoveryRate) {
        // Recovery Success! Restore weapon!
        playSfx('success');
        setTier(preFailureState.tier);
        setPath(preFailureState.path);
        addLog(`✨ 대장장이의 복구 성공! 무기가 원래 상태(+${preFailureState.tier} 강)로 복원되었습니다!`, 'success');
        triggerFlash('success');
      } else {
        // Recovery Failed! Downgrade weapon instead of always resetting to 1
        playSfx('fail');
        const dropAmount = Math.max(1, 4 - Math.floor(finalCorrect / 2));
        const downgraded = getDowngradedWeaponState(preFailureState.tier, preFailureState.path, dropAmount);
        setTier(downgraded.tier);
        setPath(downgraded.path);
        addLog(`💥 복구 실패... 무기가 +${preFailureState.tier}에서 +${downgraded.tier} 단계로 손상되었습니다.`, 'error');
        triggerFlash('fail');
      }

      // Cleanup
      setShowRecoveryModal(false);
      setRecoveryQuiz(null);
      setPreFailureState(null);
      setCurrentQuiz(generateMathQuiz(QUIZ_MODES.MULTIPLICATION));
    }
  };

  const triggerMidnightReport = () => {
    playSfx('page');
    setShowNewspaperModal(true);
    addLog(`🔔 자정 정산일보가 도착했습니다.`, 'warning');
  };

  const completeMidnightReset = () => {
    setTier(1);
    setPath(null);
    setGold(0);
    setMaxTierToday(1);
    setMaxPathToday(null);
    setShowNewspaperModal(false);

    // Save new date and reset max values in localStorage
    const todayStr = getTodayStr();
    localStorage.setItem('lastAccessDate', todayStr);
    localStorage.setItem('maxTierToday', '1');
    localStorage.setItem('maxPathToday', 'null');

    addLog(`🌅 새로운 조선의 아침이 밝아, 무기가 [낡은 몽둥이]로 되돌아갑니다.`, 'info');
  };

  // [테스트 전용] 실제 강화 결과 없이 대성공 연출만 체험
  const handleTestGreatSuccessEffect = () => {
    if (isEnhancing || outcome) return;

    const currentName = weaponName;
    playSfx('page');
    addLog(`[테스트] 일반 강화 성공 뒤 대성공으로 이어지는 전체 흐름을 시작합니다.`, 'warning');

    setIsEnhancing(true);
    setEnhancementPhase('hammering');
    setBonusUpgradeNotice('');
    setOutcome(null);

    [
      { delay: 240, text: '깡!', particles: 12 },
      { delay: 620, text: '챙!', particles: 14 },
      { delay: 1000, text: '탕!', particles: 15 },
      { delay: 1380, text: '카앙!', particles: 18 },
      { delay: 1780, text: '쨍!', particles: 16 },
      { delay: 2180, text: '쾅!', particles: 20 },
      { delay: 2580, text: '깡!', particles: 18 },
      { delay: 2940, text: '쾅!', particles: 24 },
    ].forEach(({ delay, text, particles }) => {
      scheduleStrike(delay, text, particles);
    });

    setTimeout(() => {
      setEnhancementPhase('judging');
      playSfx('tension');
      addLog(`[테스트] 불꽃이 무기 위에서 크게 흔들립니다. 성공인가... 실패인가...`, 'warning');
    }, 3250);

    scheduleStrike(3800, '카앙!', 30);

    setTimeout(() => {
      setEnhancementPhase('idle');
      playSfx('success');
      setOutcomeWeaponName(currentName);
      setOutcome('success');
      triggerSuccessParticles();
      triggerFlash('success');
      addLog(`✨ [테스트] 성공이다! 강화가 끝난 듯합니다.`, 'success');
    }, 4350);

    setTimeout(() => {
      setOutcome(null);
      setBonusUpgradeNotice('');
      setEnhancementPhase('surging');
    }, 7600);

    setTimeout(() => {
      playSfx('tension');
      setBonusUpgradeNotice(`${currentName} 속의 결을 다시 두드린다...`);
      triggerStrike('...', 10);
    }, 9150);

    setTimeout(() => {
      setBonusUpgradeNotice(`...오잉? ${currentName} 안쪽의 결이 드러난다?`);
      triggerGreatSuccessParticles(0.65);
      addLog(`...오잉? ${currentName} 안쪽의 결이 드러납니다.`, 'warning');
    }, 10500);

    scheduleStrike(11000, '깡!', 14);
    scheduleStrike(11600, '챙!', 16);
    scheduleStrike(12150, '번쩍!', 24);

    setTimeout(() => {
      playSfx('tension');
      setBonusUpgradeNotice(`${currentName} 숨은 힘이 올라온다...`);
      triggerStrike('...', 12);
    }, 13000);

    scheduleStrike(13600, '쾅!', 22);
    scheduleStrike(14200, '카앙!', 22);

    setTimeout(() => {
      playSfx('success');
      setOutcomeWeaponName(currentName);
      setOutcome('bonus');
      triggerGreatSuccessParticles(1.15);
      triggerFlash('success');
      addLog(`🌟 [테스트] 대성공! 한 번 더 강화되는 연출입니다.`, 'great-success');
    }, 15050);

    setTimeout(() => {
      setOutcome(null);
      setBonusUpgradeNotice('');
    }, 18000);

    setTimeout(() => {
      playSfx('tension');
      setBonusUpgradeNotice(`${currentName} 속의 결을 다시 두드린다...`);
      triggerStrike('...', 10);
    }, 19400);

    scheduleStrike(20300, '챙...', 14);
    scheduleStrike(21200, '카앙!', 20);

    setTimeout(() => {
      setBonusUpgradeNotice('어어? 설마...한번 더?');
      triggerGreatSuccessParticles(0.75);
      addLog(`어어? 설마...한번 더?`, 'warning');
    }, 22250);

    scheduleStrike(23200, '깡!', 18);
    scheduleStrike(24200, '번쩍!', 28);

    setTimeout(() => {
      playSfx('tension');
      setBonusUpgradeNotice('남은 잠재력을 더 끌어낸다...');
      triggerStrike('...', 14);
    }, 25600);

    scheduleStrike(26500, '쾅!', 28);
    scheduleStrike(27100, '카앙!', 28);

    setTimeout(() => {
      playSfx('success');
      setOutcomeWeaponName(currentName);
      setOutcome('bonus');
      triggerGreatSuccessParticles(1.45);
      triggerFlash('success');
      addLog(`🌟 [테스트] +3 대성공의 두 번째 추가 연출입니다.`, 'great-success');
    }, 28000);

    setTimeout(() => {
      setIsEnhancing(false);
      setEnhancementPhase('idle');
      setBonusUpgradeNotice('');
      setOutcome(null);
      addLog(`[테스트] 대성공 효과 체험 종료. 실제 강화 단계는 유지됩니다.`, 'info');
    }, 31300);
  };

  // [테스트 전용] 특정 무기를 즉시 세팅
  const handleTestSetWeapon = (testPath, testTier) => {
    playSfx('page');
    setTier(testTier);
    if (testTier === 1) {
      setPath(null);
    } else {
      setPath(testPath);
    }
    unlockWeapon(testTier, testPath);

    // Update max stats for testing convenience
    setMaxTierToday(mt => Math.max(mt, testTier));
    if (testTier > 1) {
      setMaxPathToday(testPath);
    }

    addLog(`[테스트] +${testTier} ${testPath === null || testTier === 1 ? '낡은 몽둥이' : (WEAPON_TREE[testPath] && WEAPON_TREE[testPath][testTier] ? WEAPON_TREE[testPath][testTier].name : '?')} 장착!`, 'warning');
    setShowTestPanel(false);
  };

  const startDeployment = () => {
    if (deployStatus === 'fighting' || deployStatus === 'decision' || isEnhancing || outcome) return;

    if (!canStartDeployment) {
      playSfx('wrong');
      openDeployQuiz();
      addLog(`⏳ 출진 준비 중입니다. ${formatCooldown(deployCooldownRemaining)} 후 출진하거나, 나눗셈 퀴즈 ${deployQuizRemaining}문제를 더 맞히면 바로 출진할 수 있습니다.`, 'warning');
      return;
    }

    playSfx('deploy');
    const startedAt = Date.now();
    setLastDeploymentAt(startedAt);
    setDeployQuizCharge(0);
    setNowTick(startedAt);

    setDeployStatus('fighting');
    setDeployStep(0);
    setDeployReward(0);
    setDeployWeaponBroken(false);
    setDeployDecision(null);
    setDeployEncounters({});
    nextDeployEncounterRef.current = null;
    setDeployLogs({
      0: [{ id: 'start', msg: `⚔️ +${tier} [${weaponName}]을(를) 장착하고 조선 팔도 출진에 나섭니다.`, type: 'info' }]
    });
    setNewsReport(null);
    setCurrentDeployPage(1);
    setMaxReachedPage(1);
    setShowDeployModal(true);

    runStage(0, 0);
  };

  const runStage = (index, accReward) => {
    if (index >= STAGES.length) {
      // Cleared Stage 7
      playSfx('success');
      setDeployStatus('finished');
      setDeployReward(accReward);
      setGold(g => g + accReward);

      const lastEncounter = getDeployEncounterById(deployEncounters[6] || 'enemy-7');
      const report = getDeploymentFinalNews(lastEncounter, weaponName, tier, accReward);
      setNewsReport(report);

      setDeployLogs(prev => ({
        ...prev,
        6: [
          ...(prev[6] || []),
          { id: `win-7`, msg: `👑 [출진 완수] 마지막 조우의 ${lastEncounter.name}까지 물리치고 무사히 귀환했습니다!`, type: 'success' },
          { id: `finish-7`, msg: `📢 출진 완료! 총 ${accReward} 냥의 전리품을 얻었습니다.`, type: 'info' }
        ]
      }));

      setCurrentDeployPage(8);
      setMaxReachedPage(8);
      return;
    }

    const linkedEncounterId = nextDeployEncounterRef.current;
    nextDeployEncounterRef.current = null;
    const encounter = linkedEncounterId
      ? getDeployEncounterById(linkedEncounterId)
      : pickDeployEncounter(index);
    setDeployEncounters(prev => ({
      ...prev,
      [index]: encounter.id,
    }));

    // Auto flip to new stage page if not the first stage
    if (index > 0) {
      setDeployStep(index);
      setCurrentDeployPage(index + 1);
      setMaxReachedPage(index + 1);
    }

    setDeployLogs(prev => ({
      ...prev,
      [index]: [
        ...(prev[index] || []),
        {
          id: `encounter-${index}`,
          msg: encounter.kind === 'enemy'
            ? `조우 ${index + 1}: ${linkedEncounterId ? '이어진 조우 / ' : ''}${encounter.name} / 성공률 ${getDeployPassChance(encounter.baseChance, tier)}% / 보상 +${encounter.reward}냥`
            : `조우 ${index + 1}: ${linkedEncounterId ? '이어진 조우 / ' : ''}${encounter.name} / ${encounter.reward >= 0 ? `보상 +${encounter.reward}냥` : `손실 -${Math.abs(encounter.reward)}냥`}`,
          type: 'info'
        },
        ...(encounter.clue ? [{ id: `clue-${index}`, msg: `단서: ${encounter.clue}`, type: 'info' }] : [])
      ]
    }));

    setTimeout(() => {
      if (encounter.kind !== 'enemy') {
        playSfx(encounter.kind === 'treasure' ? 'coin' : 'page');
        const eventReward = encounter.reward;
        const eventLog = encounter.logs[Math.floor(Math.random() * encounter.logs.length)];
        const isHazard = eventReward < 0;
        const lossAmount = Math.abs(eventReward);
        const lootLoss = isHazard ? Math.min(accReward, lossAmount) : 0;
        const goldLoss = isHazard ? lossAmount - lootLoss : 0;
        const newTotalReward = isHazard ? Math.max(0, accReward - lootLoss) : accReward + eventReward;
        const hasWeaponDamage = Boolean(encounter.weaponDamageChance) && tier > 1 && Math.random() * 100 < encounter.weaponDamageChance;
        let downgraded = null;
        let nextLinkedEncounter = null;

        if (encounter.nextEncounterIds?.length && index + 1 < STAGES.length) {
          const nextId = encounter.nextEncounterIds[Math.floor(Math.random() * encounter.nextEncounterIds.length)];
          nextLinkedEncounter = getDeployEncounterById(nextId);
          nextDeployEncounterRef.current = nextLinkedEncounter.id;
        }

        if (goldLoss > 0) {
          setGold(g => Math.max(0, g - goldLoss));
        }

        if (hasWeaponDamage) {
          downgraded = getDowngradedWeaponState(tier, path, 1);
          setTier(downgraded.tier);
          setPath(downgraded.path);
          setDeployWeaponBroken(true);
          addLog(`🪓 출진 중 사고로 +${tier} [${weaponName}]이 +${downgraded.tier} 단계로 손상되었습니다.`, 'error');
        }

        setDeployReward(newTotalReward);
        setDeployLogs(prev => ({
          ...prev,
          [index]: [
            ...(prev[index] || []),
            {
              id: `event-${index}`,
              msg: isHazard
                ? `위험: ${eventLog} / 전리품 -${lootLoss}냥${goldLoss > 0 ? ` / 보유 엽전 -${goldLoss}냥` : ''}`
                : `수확: ${eventLog} / +${eventReward}냥`,
              type: isHazard ? 'error' : 'success'
            },
            ...(hasWeaponDamage ? [{ id: `event-break-${index}`, msg: `무기 손상: +${downgraded.tier} 단계로 하락`, type: 'error' }] : []),
            ...(nextLinkedEncounter ? [{ id: `linked-${index}`, msg: `예고: ${encounter.nextHint || nextLinkedEncounter.name}`, type: 'info' }] : [])
          ]
        }));

        if (index + 1 >= STAGES.length) {
          setDeployStatus('finished');
          setGold(g => g + newTotalReward);
          setNewsReport(getDeploymentFinalNews(encounter, weaponName, tier, newTotalReward));
          setCurrentDeployPage(8);
          setMaxReachedPage(8);
        } else {
          setDeployStatus('decision');
          setDeployDecision({ nextIndex: index + 1, reward: newTotalReward, completedIndex: index });
        }
        return;
      }

      // Pass Probability = BaseChance + weapon tier bonus (min 5%, max 90%)
      const passChance = getDeployPassChance(encounter.baseChance, tier);

      const roll = Math.random() * 100;
      const isSuccess = roll <= passChance;

      // Shake effect on hit!
      playSfx('combat-hit');
      setCombatShake(true);
      setTimeout(() => setCombatShake(false), 200);

      // Spark strike text
      const strikeId = `${Date.now()}-${Math.random()}`;
      const hits = ['깡!', '샥!', '퍽!', '콰광!', '챙강!'];
      const hitText = hits[Math.floor(Math.random() * hits.length)];
      setStrikeTexts(prev => [...prev, { id: strikeId, text: hitText, x: `${40 + Math.random() * 20}%`, top: `${35 + Math.random() * 15}%` }]);
      setTimeout(() => {
        setStrikeTexts(prev => prev.filter(t => t.id !== strikeId));
      }, 400);

      // Trigger spark particles
      const newParticles = [];
      for (let i = 0; i < 10; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 20 + Math.random() * 50;
        const dx = Math.cos(angle) * speed;
        const dy = Math.sin(angle) * speed;
        newParticles.push({
          id: `${Date.now()}-combat-strike-${i}-${Math.random()}`,
          left: '50%',
          top: '40%',
          dx: `${dx}px`,
          dy: `${dy}px`,
          type: 'spark'
        });
      }
      setParticles(prev => [...prev, ...newParticles]);
      setTimeout(() => {
        setParticles(prev => prev.filter(p => !newParticles.includes(p)));
      }, 600);

      if (isSuccess) {
        playSfx('success');
        const stageReward = encounter.reward;
        const newTotalReward = accReward + stageReward;
        setDeployReward(newTotalReward);

        setDeployLogs(prev => ({
          ...prev,
          [index]: [
            ...(prev[index] || []),
            { id: `success-${index}`, msg: `성공: ${encounter.winMsg} / +${stageReward}냥`, type: 'success' }
          ]
        }));

        if (index + 1 >= STAGES.length) {
          setDeployStatus('finished');
          setGold(g => g + newTotalReward);
          setNewsReport(getDeploymentFinalNews(encounter, weaponName, tier, newTotalReward));
          setDeployLogs(prev => ({
            ...prev,
            [index]: [
              ...(prev[index] || []),
              { id: `win-final-${index}`, msg: `출진 완수: 마지막 조우까지 성공`, type: 'success' },
              { id: `finish-final-${index}`, msg: `정산: +${newTotalReward}냥`, type: 'info' }
            ]
          }));
          setCurrentDeployPage(8);
          setMaxReachedPage(8);
        } else {
          setDeployStatus('decision');
          setDeployDecision({ nextIndex: index + 1, reward: newTotalReward, completedIndex: index });
        }
      } else {
        playSfx('fail');
        setDeployStatus('finished');
        const loss = getDeploymentLoss(accReward, encounter.storyLevel);
        setDeployReward(loss.netReward);
        setGold(g => Math.max(0, g + loss.netReward));

        const breakChance = getDeployBreakChance(tier);
        const isWeaponBroken = breakChance > 0 && Math.random() * 100 < breakChance;
        setDeployWeaponBroken(isWeaponBroken);
        let downgraded = null;
        if (isWeaponBroken) {
          const dropAmount = 1 + Math.floor(Math.random() * 2);
          downgraded = getDowngradedWeaponState(tier, path, dropAmount);
          setTier(downgraded.tier);
          setPath(downgraded.path);
          addLog(`💥 출진 퇴각 중 +${tier} [${weaponName}]이 파손되어 +${downgraded.tier} 단계로 약해졌습니다.`, 'error');
        }

        const report = getCombatNews(encounter.storyLevel, false, weaponName, tier, encounter.name);
        setNewsReport(report);
        const lossParts = [
          loss.lootLoss > 0 ? `전리품 -${loss.lootLoss}냥` : null,
          loss.goldLoss > 0 ? `보유 엽전 -${loss.goldLoss}냥` : null,
        ].filter(Boolean);

        setDeployLogs(prev => ({
          ...prev,
          [index]: [
            ...(prev[index] || []),
            { id: `fail-${index}`, msg: `패배: ${encounter.loseMsg}`, type: 'error' },
            { id: `loss-${index}`, msg: `손실: ${lossParts.join(' / ')}`, type: 'error' },
            ...(isWeaponBroken ? [{ id: `break-${index}`, msg: `무기 손상: +${downgraded.tier} 단계로 하락`, type: 'error' }] : []),
            { id: `finish-${index}`, msg: loss.netReward >= 0 ? `정산: +${loss.netReward}냥` : `정산: -${Math.abs(loss.netReward)}냥`, type: loss.netReward >= 0 ? 'info' : 'error' }
          ]
        }));

        // Flip to the final news page
        setCurrentDeployPage(index + 2);
        setMaxReachedPage(index + 2);
      }
    }, 1200);
  };

  const handleContinueDeployment = () => {
    if (!deployDecision) return;

    playSfx('deploy');
    const { nextIndex, reward } = deployDecision;
    setDeployDecision(null);
    setDeployStatus('fighting');
    runStage(nextIndex, reward);
  };

  const handleReturnFromDeployment = () => {
    if (!deployDecision) return;

    playSfx('page');
    const { reward, completedIndex } = deployDecision;
    setDeployDecision(null);
    setDeployStatus('finished');
    setDeployReward(reward);
    setGold(g => g + reward);
    setDeployLogs(prev => ({
      ...prev,
      [completedIndex]: [
        ...(prev[completedIndex] || []),
        { id: `return-${completedIndex}`, msg: `🏠 [자진 귀환] 전리품 ${reward} 냥을 챙겨 대장간으로 돌아갑니다.`, type: 'info' }
      ]
    }));
    setNewsReport({
      titleDate: "조선 16XX년 O월 O일 (한성 일보 속보)",
      headline: "무리한 진군 대신 실속 있는 귀환, 전리품 확보",
      body: `주인공은 +${tier} [${weaponName}]을(를) 들고 ${completedIndex + 1}단계 임무까지 마친 뒤, 다음 임무로 무리하게 진군하지 않고 전리품 ${reward} 냥을 얻어 안전하게 귀환하였다. 대장간에서는 '살아 돌아오는 것도 실력'이라며 다음 출진을 위한 풀무질을 준비하고 있다.`
    });
    setCurrentDeployPage(completedIndex + 2);
    setMaxReachedPage(completedIndex + 2);
  };

  return (
    <div className={`app-container ${flashClass}`}>
      {/* RENDER FLOATING TEXTS */}
      {floatingTexts.map(t => (
        <div key={t.id} className="floating-text" style={{ left: t.x, top: t.y }}>
          {t.text}
        </div>
      ))}

      <header className="header glass-panel">
        <div className="header-main">
          <div className="header-title-group">
            <h1>⚒️ 신비한 대장간</h1>
          </div>
          <div className="header-actions">
            <button
              className="gallery-btn"
              onClick={() => {
                playSfx('page');
                setShowGalleryModal(true);
              }}
            >
              📖 무기 도감
            </button>
            <button
              className={`sound-toggle-btn ${soundEnabled ? 'enabled' : 'muted'}`}
              onClick={() => {
                const nextSoundEnabled = !soundEnabled;
                setSoundEnabled(nextSoundEnabled);
                if (nextSoundEnabled) {
                  playSoundEffect('page', true);
                }
              }}
              title="효과음 켜기/끄기"
              aria-pressed={soundEnabled}
            >
              {soundEnabled ? '🔊 효과음' : '🔇 효과음'}
            </button>
            <button
              className="smith-tool-btn mode-switch-btn"
              onClick={cycleViewportMode}
              title="화면 모드 전환"
            >
              ↔ 모드전환: {viewportMode}
            </button>
            <button
              className="smith-tool-btn fullscreen-btn"
              onClick={toggleFullscreen}
              title={isFullscreen ? '전체화면 종료' : '전체화면'}
            >
              ⛶ {isFullscreen ? '전체화면 종료' : '전체화면'}
            </button>
          </div>
        </div>
        <div className="header-status">
          <div className="gold-display">🪙 {gold.toLocaleString()} 냥</div>
        </div>
      </header>

      <div className="main-content">
        <section className={`smith-section glass-panel`}>
          <div className={`weapon-display ${isEnhancing ? 'is-enhancing' : ''} ${enhancementPhase === 'judging' ? 'judging' : ''} ${enhancementPhase === 'surging' ? 'surging' : ''} ${isStriking ? 'is-striking' : ''} ${outcome ? outcome : ''}`}>
            <div
              className="bg-layer"
              style={{ backgroundImage: `url(${getImageUrl('anvil_bg.png')})` }}
            ></div>
            <div className="furnace-glow"></div>
            <div className="weapon-glow"></div>
            {(enhancementPhase === 'surging' || outcome === 'bonus') && (
              <div className="great-success-aura" aria-hidden="true">
                <span className="aura-ring aura-ring-one"></span>
                <span className="aura-ring aura-ring-two"></span>
                <span className="aura-core"></span>
              </div>
            )}

            <div className="weapon-tier">+{tier} 강</div>

            <div className="worktable-container">
              <div className="weapon-wrapper">
                <WeaponImage path={path} tier={tier} name={weaponName} />
              </div>
            </div>

            {/* Sparks and Smoke particles */}
            {particles.map(p => (
              <div
                key={p.id}
                className={`${p.type}-particle`}
                style={{
                  left: p.left,
                  top: p.top,
                  '--dx': p.dx,
                  '--dy': p.dy,
                  '--rotate': p.rotate || '0rad'
                }}
              />
            ))}

            {/* Strike Text popups */}
            {strikeTexts.map(st => (
              <div
                key={st.id}
                className="strike-text"
                style={{ left: st.x, top: st.top }}
              >
                {st.text}
              </div>
            ))}

            {/* Success/Fail Banner */}
            {enhancementPhase === 'judging' && !outcome && (
              <div className="suspense-banner">
                성공인가...? 실패인가...?
              </div>
            )}
            <div className={`weapon-name ${outcome ? `outcome-name ${outcome}` : ''}`}>
              {outcome ? outcomeWeaponLabel : enhancementPhase === 'judging' ? '판정 중...' : enhancementPhase === 'surging' ? (bonusUpgradeNotice || weaponName) : isEnhancing ? '망치질 중...' : weaponName}
            </div>
          </div>

          <div className="upgrade-controls">
            {tier < 7 ? (
              <>
                <div className="upgrade-info">
                  <span>비용: {UPGRADE_RATES[tier].cost} 냥</span>
                  <span>성공 확률: {UPGRADE_RATES[tier].rate}%</span>
                </div>

                <div className="smith-action-row">
                  <button
                    className="btn-primary quiz-toggle-btn primary-action-btn"
                    onClick={openGoldQuiz}
                    disabled={isEnhancing || outcome}
                  >
                    <span className="coin-image-icon" aria-hidden="true" />
                    <span>엽전 벌기</span>
                  </button>
                  {tier === 1 ? (
                    <div className="path-selection primary-action-btn">
                      <button className="btn-success" onClick={() => handleUpgrade("1H")} disabled={isEnhancing || outcome}>🔨 한손 강화</button>
                      <button className="btn-success" onClick={() => handleUpgrade("2H")} disabled={isEnhancing || outcome}>🔨 두손 강화</button>
                    </div>
                  ) : (
                    <button className="btn-success upgrade-main-btn primary-action-btn" onClick={() => handleUpgrade()} disabled={isEnhancing || outcome}>
                      🔨 무기 강화
                    </button>
                  )}
                  <button
                    className="btn-deploy primary-action-btn"
                    onClick={startDeployment}
                    disabled={isEnhancing || outcome || deployStatus === 'fighting' || deployStatus === 'decision'}
                  >
                    {canStartDeployment ? '⚔️ 조선팔도출진' : `🔥 출진 게이지 (${deployQuizCharge}/${DEPLOY_QUIZ_REQUIRED})`}
                  </button>
                </div>
              </>
            ) : (
              <div className="smith-action-row">
                <button
                  className="btn-primary quiz-toggle-btn primary-action-btn"
                  onClick={openGoldQuiz}
                  disabled={isEnhancing || outcome}
                >
                  <span className="coin-image-icon" aria-hidden="true" />
                  <span>엽전 벌기</span>
                </button>
                <div className="max-tier-notice primary-action-btn">
                  👑 최종 단계 무기입니다!
                </div>
                <button
                  className="btn-deploy primary-action-btn"
                  onClick={startDeployment}
                  disabled={isEnhancing || outcome || deployStatus === 'fighting' || deployStatus === 'decision'}
                >
                  {canStartDeployment ? '⚔️ 조선팔도출진' : `🔥 출진 게이지 (${deployQuizCharge}/${DEPLOY_QUIZ_REQUIRED})`}
                </button>
              </div>
            )}
            <div className={`deploy-cooldown-panel ${canStartDeployment ? 'ready' : 'locked'}`} aria-live="polite">
              <div className="deploy-cooldown-row">
                <span>{canStartDeployment ? '출진 가능' : `다음 출진까지 ${formatCooldown(deployCooldownRemaining)}`}</span>
                <strong>나눗셈 {deployQuizCharge}/{DEPLOY_QUIZ_REQUIRED}</strong>
              </div>
              <div className="deploy-gauge-track">
                <span style={{ width: `${(deployQuizCharge / DEPLOY_QUIZ_REQUIRED) * 100}%` }} />
              </div>
              {!canStartDeployment && (
                <p>5분을 기다리거나 풀무질 나눗셈 {deployQuizRemaining}문제를 맞히면 바로 출진할 수 있습니다.</p>
              )}
            </div>
          </div>
        </section>
      </div>

      <div className="glass-panel" style={{padding: '1rem', textAlign: 'center', display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap'}}>
        <button style={{background: '#374151'}} onClick={triggerMidnightReport}>
          🌙 시간 가속 (자정 초기화 테스트)
        </button>
        <button
          style={{background: 'linear-gradient(135deg, #0e7490, #ca8a04)', padding: '0.6rem 1rem', borderRadius: '0.5rem', color: 'white', border: '1px solid rgba(255,255,255,0.18)', cursor: isEnhancing || outcome ? 'not-allowed' : 'pointer', fontSize: '0.9rem', fontWeight: 900}}
          onClick={handleTestGreatSuccessEffect}
          disabled={isEnhancing || outcome}
        >
          🌟 대성공 효과 체험하기
        </button>
        <button
          style={{background: '#7c3aed', padding: '0.5rem 1rem', borderRadius: '0.5rem', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.9rem', width: '100%', marginTop: '0.4rem'}}
          onClick={() => setShowTestPanel(p => !p)}
        >
          🧪 [테스트 모드] 원하는 무기 즉시 획득
        </button>
        {showTestPanel && (
          <div style={{width: '100%', background: '#1f2937', borderRadius: '0.5rem', padding: '0.8rem', marginTop: '0.4rem'}}>
            <div style={{color: '#fbbf24', fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.85rem'}}>⚠️ 테스트 전용 - 무기 즉시 선택</div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '0.4rem'}}>
              <div style={{color: '#9ca3af', fontSize: '0.8rem', marginBottom: '0.2rem'}}>◼ 공통</div>
              <button
                style={{background: '#374151', padding: '0.4rem', borderRadius: '0.3rem', color: 'white', border: '1px solid #4b5563', cursor: 'pointer', fontSize: '0.8rem'}}
                onClick={() => handleTestSetWeapon(null, 1)}
              >+1 낡은 몽둥이 (공통)</button>
              <div style={{color: '#9ca3af', fontSize: '0.8rem', marginTop: '0.3rem', marginBottom: '0.2rem'}}>◼ 한손 무기 계열</div>
              {[2,3,4,5,6,7].map(t => (
                <button
                  key={`1H_${t}`}
                  style={{background: '#374151', padding: '0.4rem', borderRadius: '0.3rem', color: 'white', border: '1px solid #4b5563', cursor: 'pointer', fontSize: '0.8rem'}}
                  onClick={() => handleTestSetWeapon('1H', t)}
                >+{t} {WEAPON_TREE['1H'][t].name} (한손)</button>
              ))}
              <div style={{color: '#9ca3af', fontSize: '0.8rem', marginTop: '0.3rem', marginBottom: '0.2rem'}}>◼ 양손 무기 계열</div>
              {[2,3,4,5,6,7].map(t => (
                <button
                  key={`2H_${t}`}
                  style={{background: '#374151', padding: '0.4rem', borderRadius: '0.3rem', color: 'white', border: '1px solid #4b5563', cursor: 'pointer', fontSize: '0.8rem'}}
                  onClick={() => handleTestSetWeapon('2H', t)}
                >+{t} {WEAPON_TREE['2H'][t].name} (양손)</button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="action-log glass-panel">
        {logs.map((log) => (
          <div key={log.id} className={`log-entry ${log.type}`}>
            &gt; {log.msg}
          </div>
        ))}
        {logs.length === 0 && <div style={{color: '#4b5563'}}>&gt; 시스템 로그 대기 중...</div>}
      </div>

      {/* QUIZ MODAL */}
      {showQuizModal && (
        <div className="modal-overlay" onClick={(e) => {
          if(e.target.className === 'modal-overlay') setShowQuizModal(false);
        }}>
          <div className="modal-content glass-panel">
            <button className="close-btn" onClick={() => setShowQuizModal(false)}>✕</button>
            <h2>{quizPurpose === 'deploy' ? '🔥 출진 게이지 풀무질 (나눗셈)' : '💦 엽전 벌기 작업장 (구구단)'}</h2>
            <div className="quiz-question">
              {currentQuiz.q}
            </div>
            <div className="quiz-options">
              {currentQuiz.options.map((opt, idx) => (
                <button
                  key={idx}
                  className="quiz-option-btn"
                  onClick={(e) => handleAnswer(opt, e)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* BLACKSMITH RECOVERY MODAL */}
      {showRecoveryModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '550px' }}>
            <h2>😭 대장장이의 사죄와 복구 제안</h2>

            <div className="blacksmith-layout">
              <div className="blacksmith-image-container">
                <img
                  src={getImageUrl('blacksmith_apology.png')}
                  alt="사과하는 대장장이"
                  className="blacksmith-avatar"
                />
              </div>
              <div className="speech-bubble">
                {!recoveryQuiz ? (
                  <>
                    "아이고! 정말 면목이 없소... 내 망치질이 어긋나서 귀중한 무기가 그만 부서졌소이다!
                    내 온 힘을 다해 <strong>무료로 복구 작업</strong>을 시도해보려 하는데, 풀무질을 조금 도와주시겠소?"
                    <br/><br/>
                    <small style={{ color: '#fca5a5' }}>
                      (※ 복구 성공률: 5문제 모두 정답 시 50%, 한 문제 틀릴 때마다 8% 차감. 실패 또는 포기 시 무기는 몇 단계 하락)
                    </small>
                  </>
                ) : (
                  <>
                    "풀무질을 세게 밀어넣어 주시오! 나눗셈 문제를 빠르고 정확하게 풀수록 복구 성공률이 올라갑니다!"
                  </>
                )}
              </div>
            </div>

            {!recoveryQuiz ? (
              <div className="btn-group">
                <button className="btn-success" onClick={handleAcceptRecovery}>
                  🔥 예, 복구를 시도합니다! (퀴즈 5개)
                </button>
                <button className="btn-primary" style={{ background: '#4b5563' }} onClick={handleDeclineRecovery}>
                  💔 아니오, 포기합니다
                </button>
              </div>
            ) : (
              <div className="recovery-stats">
                <div className="progress-header">
                  <span>복구 시도 중 ({recoveryQuiz.step + 1} / 5)</span>
                  <span className="recovery-percentage-badge">
                    현재 복구 성공률: {RECOVERY_BASE_RATE + recoveryQuiz.correct * RECOVERY_CORRECT_BONUS}%
                  </span>
                </div>
                <div className="recovery-meter-bar">
                  <div
                    className="recovery-meter-fill"
                    style={{ width: `${((RECOVERY_BASE_RATE + recoveryQuiz.correct * RECOVERY_CORRECT_BONUS) / (RECOVERY_BASE_RATE + 5 * RECOVERY_CORRECT_BONUS)) * 100}%` }}
                  />
                </div>

                <div className="recovery-quiz-slots">
                  {[0, 1, 2, 3, 4].map(idx => {
                    let slotClass = '';
                    let char = '-';
                    if (idx === recoveryQuiz.step) {
                      slotClass = 'active';
                      char = '?';
                    } else if (idx < recoveryQuiz.step) {
                      if (recoveryQuiz.answers[idx]) {
                        slotClass = 'correct';
                        char = 'O';
                      } else {
                        slotClass = 'incorrect';
                        char = 'X';
                      }
                    }
                    return (
                      <div key={idx} className={`quiz-slot ${slotClass}`}>
                        {char}
                      </div>
                    );
                  })}
                </div>

                <div className="quiz-question" style={{ marginTop: '0.5rem' }}>
                  {currentQuiz.q}
                </div>
                <div className="quiz-options">
                  {currentQuiz.options.map((opt, idx) => (
                    <button
                      key={idx}
                      className="quiz-option-btn"
                      onClick={() => handleRecoveryAnswer(opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* GALLERY MODAL */}
      {showGalleryModal && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target.className === 'modal-overlay') setShowGalleryModal(false);
        }}>
          <div className="modal-content glass-panel" style={{ maxWidth: '800px', width: '95%' }}>
            <button className="close-btn" onClick={() => setShowGalleryModal(false)}>✕</button>
            <h2>📖 대장간 무기 도감</h2>

            <div className="gallery-layout">
              {/* Left Pane: Tabs and Grid */}
              <div className="gallery-left-pane">
                <div className="gallery-tabs">
                  <button
                    className={`gallery-tab-btn ${activeTab === '1H' ? 'active' : ''}`}
                    onClick={() => setActiveTab('1H')}
                  >
                    🗡️ 한손 무기
                  </button>
                  <button
                    className={`gallery-tab-btn ${activeTab === '2H' ? 'active' : ''}`}
                    onClick={() => setActiveTab('2H')}
                  >
                    🪓 두손 무기
                  </button>
                </div>

                <div className="gallery-grid">
                  {/* Tier 1 is Old Club (common_1) */}
                  {(() => {
                    const isActive = selectedGalleryItem?.key === 'common_1';
                    return (
                      <div
                        className={`gallery-card ${isActive ? 'active' : ''}`}
                        onClick={() => setSelectedGalleryItem({
                          key: 'common_1',
                          item: WEAPON_TREE.common[1],
                          path: 'common',
                          tier: 1
                        })}
                      >
                        <span className="gallery-card-tier">+1</span>
                        <WeaponImage path="common" tier={1} name="낡은 몽둥이" className="gallery-card-img" />
                      </div>
                    );
                  })()}

                  {/* Tiers 2 to 7 */}
                  {[2, 3, 4, 5, 6, 7].map(t => {
                    const key = `${activeTab}_${t}`;
                    const isUnlocked = unlockedWeapons.includes(key);
                    const item = WEAPON_TREE[activeTab][t];
                    const isActive = selectedGalleryItem?.key === key;

                    if (!isUnlocked) {
                      return (
                        <div key={key} className="gallery-card locked">
                          <span className="gallery-card-tier">+{t}</span>
                          <span className="gallery-card-lock-icon">🔒</span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={key}
                        className={`gallery-card ${isActive ? 'active' : ''}`}
                        onClick={() => setSelectedGalleryItem({
                          key,
                          item,
                          path: activeTab,
                          tier: t
                        })}
                      >
                        <span className="gallery-card-tier">+{t}</span>
                        <WeaponImage path={activeTab} tier={t} name={item.name} className="gallery-card-img" />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Pane: Detail View */}
              <div className="gallery-right-pane">
                {selectedGalleryItem ? (
                  <>
                    <div className="gallery-detail-img-container">
                      <WeaponImage
                        path={selectedGalleryItem.path}
                        tier={selectedGalleryItem.tier}
                        name={selectedGalleryItem.item.name}
                        className="gallery-detail-img"
                      />
                    </div>
                    <div className="gallery-detail-title">
                      {selectedGalleryItem.item.name}
                    </div>
                    <div className="gallery-detail-tier-badge">
                      +{selectedGalleryItem.tier} 강 무기 ({selectedGalleryItem.path === '1H' ? '한손' : selectedGalleryItem.path === '2H' ? '두손' : '공통'})
                    </div>
                    <p className="gallery-detail-desc">
                      {selectedGalleryItem.item.desc}
                    </p>
                  </>
                ) : (
                  <div style={{ color: '#9ca3af' }}>무기를 선택해 상세 정보를 확인하세요.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DEPLOY MODAL (조선 팔도 출진록 - 책장형 인터페이스) */}
      {showDeployModal && (() => {
        const isNewsPage = deployStatus === 'finished' && currentDeployPage === maxReachedPage;
        const pageIdx = currentDeployPage - 1;
        const stage = pageIdx < 7 ? STAGES[pageIdx] : null;
        const encounter = stage ? getDeployEncounterById(deployEncounters[pageIdx] || pageIdx + 1) : null;
        const deployScene = encounter?.scene || null;
        const visibleStagePage = deployStatus === 'finished' && newsReport
          ? Math.min(deployStep + 1, STAGES.length)
          : maxReachedPage;
        const stageLogs = stage ? (deployLogs[pageIdx] || []) : [];
        const hasStageSuccess = stageLogs.some(log => log.type === 'success' || String(log.id).startsWith('event-'));
        const hasStageFail = stageLogs.some(log => String(log.id).startsWith('fail-'));
        const isEnemyEncounter = encounter?.kind === 'enemy';
        const isBondEncounter = encounter?.kind === 'bond';
        const isHazardEncounter = encounter?.kind === 'hazard';
        const isStoryOnlyEncounter = !isEnemyEncounter;
        const stageChance = isEnemyEncounter ? getDeployPassChance(encounter.baseChance, tier) : 0;
        const stageBreakChance = getDeployBreakChance(tier);
        const deployRewardTone = deployReward >= 0 ? 'positive' : 'negative';
        const stageSceneState = hasStageSuccess || pageIdx < deployStep
          ? 'cleared'
          : hasStageFail
            ? 'failed'
            : pageIdx === deployStep && deployStatus === 'fighting'
              ? 'fighting'
              : 'pending';
        const isDecisionPage = deployStatus === 'decision' && deployDecision?.completedIndex === pageIdx;

        return (
          <div className={`modal-overlay deploy-overlay ${combatShake ? 'shake-combat' : ''}`}>
            <div className="deploy-scroll-container glass-panel page-slide">
              {deployStatus === 'finished' && (
                <button
                  className="close-btn"
                  onClick={() => setShowDeployModal(false)}
                >
                  ✕
                </button>
              )}

              <h2>⚔️ 조선 팔도 출진록</h2>

              {/* 상단 진행률 및 탭 이동 */}
              <div className="deploy-stage-flow">
                <div className="deploy-weapon-info">
                  <span className="weapon-badge">+{tier} 강 {weaponName}</span>
                  <span className={`reward-accumulated ${deployRewardTone}`}>정산 <strong>{deployReward >= 0 ? `+${deployReward}` : `-${Math.abs(deployReward)}`}</strong> 냥</span>
                </div>

                <div className="deploy-stage-progress">
                  <div className="stage-dots">
                    {STAGES.map((s, idx) => {
                      let dotClass = '';
                      const pageNum = idx + 1;

                      if (idx < deployStep) dotClass = 'passed';
                      else if (idx === deployStep && deployStatus === 'fighting') dotClass = 'active-fight';
                      else if (idx === deployStep && hasStageFail) dotClass = 'failed';
                      else if (idx === deployStep && (deployStatus === 'finished' || deployStatus === 'decision')) dotClass = 'passed';

                      if (currentDeployPage === pageNum) dotClass += ' viewing';

                      const isClickable = pageNum <= visibleStagePage;

                      return (
                        <button
                          key={idx}
                          className={`stage-dot-btn ${dotClass}`}
                          onClick={() => {
                            if (isClickable) {
                              playSfx('page');
                              setCurrentDeployPage(pageNum);
                            }
                          }}
                          disabled={!isClickable}
                          title={`${s.level}번째 조우`}
                        >
                          {s.level}
                        </button>
                      );
                    })}

                    {/* 뉴스 속보 배지 */}
                    {deployStatus === 'finished' && newsReport && (
                      <button
                        className={`stage-dot-btn news-badge ${currentDeployPage === maxReachedPage ? 'viewing' : ''}`}
                        onClick={() => {
                          playSfx('page');
                          setCurrentDeployPage(maxReachedPage);
                        }}
                        title="전투 속보"
                      >
                        📰 속보
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 페이지 본문 영역 */}
              {isNewsPage && newsReport ? (
                /* 뉴스 속보 독점 렌더링 */
                <div className={`newspaper-card traditional-style ${deployRewardTone}`}>
                  <div className="newspaper-header-mini">
                    <span>속보 (速報)</span>
                    <span>{newsReport.titleDate}</span>
                  </div>
                  <div className="newspaper-headline-mini">
                    "{newsReport.headline}"
                  </div>
                  <p className="newspaper-body-mini">
                    {newsReport.body}
                  </p>
                  <div className={`settlement-rewards ${deployRewardTone}`}>
                    <span>
                      {deployReward >= 0 ? '정산:' : '손실:'}
                      <strong>{deployReward >= 0 ? ` +${deployReward}` : ` -${Math.abs(deployReward)}`}</strong> 냥
                    </span>
                    {deployWeaponBroken && (
                      <span className="weapon-break-summary">무기 단계 하락</span>
                    )}
                  </div>
                  <button
                    className="btn-primary"
                    onClick={() => setShowDeployModal(false)}
                    style={{ width: '100%', marginTop: '1.2rem', padding: '0.8rem' }}
                  >
                    대장간으로 안전 귀환
                  </button>
                </div>
              ) : (
                /* 각 단계별 세부 전투 일지 렌더링 */
                stage && encounter && deployScene && (
                  <div className={`deploy-page-content result-${stageSceneState}`}>
                    <div className="deploy-stage-header">
                      <h3>조우 {currentDeployPage}: {encounter.name}</h3>
                      <div className="deploy-stage-meta">
                        <span>{isEnemyEncounter ? '전투' : isBondEncounter ? '인연' : isHazardEncounter ? '위험' : '보상'}</span>
                        <span>{isEnemyEncounter ? `성공 ${stageChance}%` : isBondEncounter ? '도움 받음' : isHazardEncounter ? '손실 발생' : '전투 없음'}</span>
                        <span>{encounter.reward >= 0 ? `+${encounter.reward}냥` : `-${Math.abs(encounter.reward)}냥`}</span>
                        <span>손상 {isEnemyEncounter ? `${stageBreakChance}%` : encounter.weaponDamageChance ? `${encounter.weaponDamageChance}%` : '0%'}</span>
                      </div>
                    </div>

                    <p className="deploy-stage-desc">
                      {encounter.desc}
                    </p>

                    {(encounter.context || encounter.clue) && (
                      <div className="deploy-stage-context">
                        {encounter.context && (
                          <p>
                            <strong>맥락</strong>
                            <span>{encounter.context}</span>
                          </p>
                        )}
                        {encounter.clue && (
                          <p>
                            <strong>단서</strong>
                            <span>{encounter.clue}</span>
                          </p>
                        )}
                      </div>
                    )}

                    <div className="deploy-stage-status">
                      {pageIdx < deployStep ? (
                        <span className="status-badge clear">{isEnemyEncounter ? '✅ 돌파 성공' : isBondEncounter ? '✅ 인연 완료' : '✅ 사건 완료'}</span>
                      ) : pageIdx === deployStep && deployStatus === 'fighting' ? (
                        <span className="status-badge fighting">{isEnemyEncounter ? '⚔️ 격렬한 교전 중' : isBondEncounter ? '🤝 만남 중' : '📜 사건 처리 중'}</span>
                      ) : hasStageSuccess ? (
                        <span className="status-badge clear">{isEnemyEncounter ? '✅ 돌파 성공' : isBondEncounter ? '✅ 인연 완료' : '✅ 사건 완료'}</span>
                      ) : (
                        <span className="status-badge fail">❌ 패배 및 철수</span>
                      )}
                    </div>

                    <div className="deploy-battleground">
                      <div
                        className={`battlefield-scene ${stageSceneState} ${isStoryOnlyEncounter ? 'story-focus' : ''}`}
                        style={{
                          '--scene-sky': deployScene.sky,
                          '--scene-ground': deployScene.ground,
                          '--scene-accent': deployScene.accent,
                        }}
                      >
                        <div className="battlefield-atmosphere" />
                        <div className="battlefield-terrain-label">{deployScene.terrain}</div>
                        {isEnemyEncounter ? (
                          <>
                            <div className="battlefield-side player-side">
                              <span className="battle-side-label">아군</span>
                              <div className="battle-weapon-aura">
                                <WeaponImage path={path} tier={tier} name={weaponName} className="battle-weapon-img" />
                              </div>
                              <strong>+{tier} {weaponName}</strong>
                            </div>
                            <div className="clash-zone">
                              <div className="clash-ring" />
                              <span>{stageSceneState === 'fighting' ? '격돌' : stageSceneState === 'cleared' ? '돌파' : stageSceneState === 'failed' ? '철수' : '대기'}</span>
                            </div>
                            <div className="battlefield-side enemy-side">
                              <span className="battle-side-label">적군</span>
                              <div className="battle-enemy-token">
                                <EnemyImage
                                  src={deployScene.enemySrc}
                                  name={deployScene.enemyName}
                                  fallback={deployScene.enemyIcon}
                                />
                              </div>
                              <strong>{deployScene.enemyName}</strong>
                            </div>
                          </>
                        ) : (
                          <div className={`event-focus-scene ${isBondEncounter ? 'bond' : isHazardEncounter ? 'hazard' : 'event'}`}>
                            <span className="event-focus-label">{isBondEncounter ? '인연' : isHazardEncounter ? '위험 사건' : encounter.kind === 'treasure' ? '보물 발견' : '사건'}</span>
                            <div className="battle-event-token">
                              <EnemyImage
                                src={deployScene.enemySrc}
                                name={deployScene.enemyName}
                                fallback={deployScene.enemyIcon}
                                className="battle-event-img"
                              />
                            </div>
                            <strong>{deployScene.enemyName}</strong>
                            <span className="event-focus-state">
                              {stageSceneState === 'fighting' ? (isBondEncounter ? '만나는 중' : isHazardEncounter ? '대처 중' : '확인 중') : stageSceneState === 'cleared' ? (isBondEncounter ? '인연 완료' : isHazardEncounter ? '위험 처리' : '사건 해결') : stageSceneState === 'failed' ? '손실 발생' : '대기'}
                            </span>
                          </div>
                        )}
                        {stageSceneState !== 'pending' && (
                          <div className={`battlefield-result-mark ${stageSceneState}`}>
                            {stageSceneState === 'cleared' ? (isEnemyEncounter ? '돌파 성공' : isBondEncounter ? '인연 완료' : '사건 해결') : stageSceneState === 'failed' ? '퇴각' : (isEnemyEncounter ? '교전 중' : isBondEncounter ? '만남 중' : '처리 중')}
                          </div>
                        )}
                        {pageIdx === deployStep && (
                          <>
                            {particles.map(p => (
                              <div
                                key={`deploy-${p.id}`}
                                className={`${p.type}-particle`}
                                style={{
                                  left: p.left,
                                  top: p.top,
                                  '--dx': p.dx,
                                  '--dy': p.dy
                                }}
                              />
                            ))}
                            {strikeTexts.map(st => (
                              <div
                                key={`deploy-${st.id}`}
                                className="strike-text"
                                style={{ left: st.x, top: st.top }}
                              >
                                {st.text}
                              </div>
                            ))}
                          </>
                        )}
                      </div>

                      <div className="battlefield-stat-row">
                        <span>{isEnemyEncounter ? `돌파 확률 ${stageChance}%` : isBondEncounter ? '인연을 만나 도움을 받습니다' : isHazardEncounter ? '위험 사건은 전리품이나 보유 엽전을 깎을 수 있습니다' : '전투 없이 전리품을 얻을 수 있습니다'}</span>
                        <div className="battlefield-chance-meter" aria-hidden="true">
                          <span style={{ width: `${isEnemyEncounter ? stageChance : isHazardEncounter ? 100 : 65}%` }} />
                        </div>
                      </div>

                      <div className="deploy-log-viewer" ref={deployLogViewerRef}>
                        {stageLogs.map((log, lIdx) => (
                          <div key={lIdx} className={`deploy-log-entry ${log.type}`}>
                            &gt; {log.msg}
                          </div>
                        ))}
                        {pageIdx === deployStep && deployStatus === 'fighting' && (
                          <div className="deploy-loading-dots">
                            <span>{isEnemyEncounter ? '전투 중' : isBondEncounter ? '만남 중' : '처리 중'}</span>
                            <span className="dot-bounce">.</span>
                            <span className="dot-bounce">.</span>
                            <span className="dot-bounce">.</span>
                          </div>
                        )}
                      </div>

                      {isDecisionPage && (
                        <div className="deploy-decision-panel">
                          <div className="decision-copy">
                            <strong>다음 선택</strong>
                            <span>현재 전리품 +{deployDecision.reward}냥</span>
                          </div>
                          <div className="decision-actions">
                            <button className="decision-btn return" onClick={handleReturnFromDeployment}>
                              🏠 귀환
                            </button>
                            <button className="decision-btn continue" onClick={handleContinueDeployment}>
                              ⚔️ 계속 출진
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              )}

              {/* 하단 쪽수 넘기기 컨트롤러 */}
              <div className="deploy-page-controls">
                <button
                  onClick={() => {
                    playSfx('page');
                    setCurrentDeployPage(p => Math.max(1, p - 1));
                  }}
                  disabled={currentDeployPage === 1}
                  className="page-btn"
                >
                  ◀ 이전 쪽
                </button>

                <span className="page-indicator">
                  [ {currentDeployPage} / {maxReachedPage} 쪽 ]
                </span>

                <button
                  onClick={() => {
                    playSfx('page');
                    setCurrentDeployPage(p => Math.min(maxReachedPage, p + 1));
                  }}
                  disabled={currentDeployPage === maxReachedPage}
                  className="page-btn"
                >
                  다음 쪽 ▶
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* NEWSPAPER MODAL */}
      {showNewspaperModal && (() => {
        const news = getMidnightNews(maxTierToday, maxPathToday);
        return (
          <div className="newspaper-overlay">
            <div className="newspaper-modal">
              <div className="newspaper-header">
                <h1 className="newspaper-title">大 匠 鍛 日 報</h1>
                <div className="newspaper-meta">
                  <span>제 874호</span>
                  <span>{news.dateStr}</span>
                  <span>발행인: 대장장이</span>
                </div>
              </div>
              <div className="newspaper-headline">
                "{news.title}"
              </div>
              <p className="newspaper-body">
                {news.body}
              </p>
              <button className="newspaper-btn" onClick={completeMidnightReset}>
                🌅 새로운 조선의 아침 맞이하기 (정산 완료)
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default App;
