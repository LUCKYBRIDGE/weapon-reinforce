export const TIMELINE_PATH = 'timeline';

export const WEAPON_TIMELINE = {
  1: {
    id: 'k2-rifle',
    name: 'K2 소총',
    era: '대한민국',
    yearLabel: '1984년 제식 채택',
    role: '현대 보병의 주력 개인화기',
    fact: '국방과학연구소가 1974년 개발을 시작해 시험을 거친 뒤 1984년 우리 군의 제식 소총으로 채택했다.',
    gameLore: '완성된 현대 무기 안에서 가장 오래된 쇳소리를 찾아 시간을 거슬러 올라간다.',
    certainty: '확인된 기록',
    sourceTitle: '방위사업청 20년사: K2 소총 개발과 제식화',
    sourceUrl: 'https://www.dapa.go.kr/upload/pcm/_86035e05-f5df-4446-a164-57d5e14efd711780014911973.pdf',
    image: 'weapon_timeline_1.png',
    combatStyle: 'firearm',
    combatProfile: { attackName: '정밀 2점사', critChance: 0.05, critMultiplier: 1.25, guard: 0, healOnHit: 0 },
    battlePose: {
      held: { left: 44, top: 36, width: 92, rotation: -8, flip: false },
      firstPerson: { left: 48, bottom: -18, width: 72, rotation: -7, flip: false },
    },
  },
  2: {
    id: 'woldo-1790',
    name: '정조대 월도',
    era: '조선 후기',
    yearLabel: '1790년 기록',
    role: '긴 자루로 크게 베는 장병기',
    fact: '정조의 명으로 편찬된 《무예도보통지》에는 월도와 마상월도의 자세와 운용법이 실려 있다.',
    gameLore: '현대의 정밀함이 사라지고, 긴 자루에 실린 큰 궤적이 깨어난다.',
    certainty: '대표 기록 기준',
    sourceTitle: '우리역사넷: 무예도보통지',
    sourceUrl: 'https://contents.history.go.kr/mobile/kc/view.do?code=kc_age_30&levelId=kc_r300500',
    image: 'weapon_timeline_2.png',
    combatStyle: 'polearm-slash',
    combatProfile: { attackName: '큰 원호 베기', critChance: 0.08, critMultiplier: 1.3, guard: 1, healOnHit: 0 },
    battlePose: {
      held: { left: 36, top: 25, width: 112, rotation: -18, flip: false },
      firstPerson: { left: 38, bottom: -28, width: 92, rotation: -24, flip: false },
    },
  },
  3: {
    id: 'ssangsudo-1598',
    name: '선조대 장도·쌍수도',
    era: '조선 중기',
    yearLabel: '1598년 무예서 계통',
    role: '두 손으로 다루는 긴 칼',
    fact: '1598년 편찬된 《무예제보》는 두 손으로 긴 칼을 다루는 쌍수도(장도) 훈련을 정리했고, 이 계통은 이후 《무예도보통지》에 집대성되었다.',
    gameLore: '시간이 더 벗겨지자 짧은 조작 대신 온몸으로 휘두르는 긴 칼의 힘이 남는다.',
    certainty: '무예서 계통 기준',
    sourceTitle: '우리역사넷: 도검류와 쌍수도',
    sourceUrl: 'https://contents.history.go.kr/front/km/print.do?levelId=km_014_0060_0030_0030_0020&whereStr=',
    image: 'weapon_timeline_3.png',
    combatStyle: 'heavy-slash',
    combatProfile: { attackName: '양손 내려베기', critChance: 0.16, critMultiplier: 1.45, guard: 0, healOnHit: 0 },
    battlePose: {
      held: { left: 45, top: 23, width: 96, rotation: -12, flip: true },
      firstPerson: { left: 48, bottom: -26, width: 86, rotation: -18, flip: true },
    },
  },
  4: {
    id: 'hwando-joseon',
    name: '조선 군영 환도',
    era: '조선 전기',
    yearLabel: '15세기 대표 군용 도검',
    role: '휴대와 위급한 근접전에 알맞은 도검',
    fact: '환도는 조선 전기의 대표적인 도검으로 전투와 호신에 쓰였고, 휴대하기 편하도록 비교적 짧은 규격도 중시되었다.',
    gameLore: '화려한 힘이 걷히고 군영에서 실제로 버텨 낸 짧고 단단한 칼이 드러난다.',
    certainty: '확인된 기록',
    sourceTitle: '우리역사넷: 조선 전기의 환도',
    sourceUrl: 'https://contents.history.go.kr/mobile/km/view.do?levelId=km_014_0050_0010_0020_0060',
    image: 'weapon_timeline_4.png',
    combatStyle: 'saber-slash',
    combatProfile: { attackName: '빠른 발도', critChance: 0.18, critMultiplier: 1.3, guard: 1, healOnHit: 0 },
    battlePose: {
      held: { left: 48, top: 28, width: 82, rotation: -15, flip: false },
      firstPerson: { left: 50, bottom: -24, width: 78, rotation: -14, flip: false },
    },
  },
  5: {
    id: 'seven-branched-sword',
    name: '백제 칠지도',
    era: '백제',
    yearLabel: '4세기경 추정',
    role: '백제와 왜의 교류를 보여 주며 의식용으로 추정되는 철제 칼',
    fact: '가지처럼 뻗은 여섯 날과 가운데 몸체를 합쳐 일곱 갈래를 이루며, 명문 해석과 전달 관계에는 여러 견해가 있다.',
    gameLore: '실전 성능이 아니라 오래된 외교와 의례의 기억이 역사 공명을 크게 일으킨다.',
    certainty: '제작 시기·명문 해석 논의 중',
    sourceTitle: '우리역사넷: 칠지도',
    sourceUrl: 'https://contents.history.go.kr/mobile/kc/view.do?code=kc_age_10&levelId=kc_r101500',
    image: 'weapon_timeline_5.png',
    combatStyle: 'resonance',
    combatProfile: { attackName: '일곱 갈래 공명', critChance: 0.12, critMultiplier: 1.35, guard: 3, healOnHit: 0 },
    battlePose: {
      held: { left: 55, top: 18, width: 58, rotation: 28, flip: false },
      firstPerson: { left: 57, bottom: -24, width: 54, rotation: 12, flip: false },
    },
  },
  6: {
    id: 'korean-bronze-dagger',
    name: '한국식 동검',
    era: '초기철기',
    yearLabel: '기원전 5~4세기경 이후',
    role: '한반도 특유의 청동기 문화를 보여 주는 좁은 동검',
    fact: '비파형동검보다 날이 좁고 직선에 가까워 세형동검 또는 좁은놋단검이라고도 한다.',
    gameLore: '철보다 앞선 청동의 기억이 깨어나며 무기의 힘이 시간 그 자체와 가까워진다.',
    certainty: '유물 편년 기준',
    sourceTitle: '국립중앙박물관: 한국식 동검',
    sourceUrl: 'https://www.museum.go.kr/MUSEUM/contents/M0502000000.do?relicId=1996&schM=view&searchId=search',
    image: 'weapon_timeline_6.png',
    combatStyle: 'dagger-thrust',
    combatProfile: { attackName: '좁은 날 정밀 찌르기', critChance: 0.22, critMultiplier: 1.4, guard: 2, healOnHit: 1 },
    battlePose: {
      held: { left: 50, top: 29, width: 76, rotation: -12, flip: false },
      firstPerson: { left: 54, bottom: -25, width: 72, rotation: -9, flip: false },
    },
  },
  7: {
    id: 'lute-shaped-bronze-dagger',
    name: '비파형동검',
    era: '청동기 시대',
    yearLabel: '기원전 8~7세기경 이후',
    role: '고조선과 청동기 문화를 상징하는 동검',
    fact: '검몸 아래쪽이 비파처럼 둥글고 칼몸과 손잡이를 따로 만들어 결합한 조립식 구조가 특징이다.',
    gameLore: '가장 오래된 역사층에 닿아 화려함 대신 태고의 무게가 최종 힘으로 남는다.',
    certainty: '유물 형식·편년 기준',
    sourceTitle: '우리역사넷: 비파형동검',
    sourceUrl: 'https://contents.history.go.kr/mobile/kc/view.do?levelId=kc_r000300',
    image: 'weapon_timeline_7.png',
    combatStyle: 'dagger-thrust',
    combatProfile: { attackName: '태고의 공명 찌르기', critChance: 0.28, critMultiplier: 1.5, guard: 3, healOnHit: 2 },
    battlePose: {
      held: { left: 49, top: 28, width: 74, rotation: -10, flip: false },
      firstPerson: { left: 53, bottom: -24, width: 70, rotation: -8, flip: false },
    },
  },
};

export const TIMELINE_UPGRADE_RATES = {
  1: { cost: 20, rate: 90 },
  2: { cost: 50, rate: 80 },
  3: { cost: 100, rate: 68 },
  4: { cost: 180, rate: 52 },
  5: { cost: 320, rate: 35 },
  6: { cost: 550, rate: 20 },
};

export const TIMING_BONUS = {
  miss: 0,
  good: 3,
  perfect: 7,
};

export const RESTORE_SHOP_PRICES = {
  1: 0,
  2: 150,
  3: 450,
  4: 1100,
  5: 2400,
};

export const CURIOSITY_RARITIES = {
  common: { label: '흔한 괴작', color: '#cbd5e1' },
  uncommon: { label: '드문 괴작', color: '#86efac' },
  rare: { label: '희귀 괴작', color: '#7dd3fc' },
  legendary: { label: '전설 괴작', color: '#fbbf24' },
};

export const CURIOSITIES = [
  {
    id: 'soot-fire-tongs',
    name: '숯 묻은 부젓가락',
    icon: '🥢',
    rarity: 'common',
    price: 80,
    basis: '생활문화 모티프',
    description: '무기가 되지 못한 쇠가 화로의 숯을 뒤집는 집게 모양으로 굳었다.',
  },
  {
    id: 'scorched-roof-tile',
    name: '불에 그을린 기와 조각',
    icon: '◼️',
    rarity: 'common',
    price: 70,
    basis: '생활문화 모티프',
    description: '담금질 불꽃 속에서 지붕 기와 한 조각이 튀어나왔다. 무기로 쓸 수는 없다.',
  },
  {
    id: 'bent-brass-spoon',
    name: '휘어진 놋숟가락',
    icon: '🥄',
    rarity: 'common',
    price: 95,
    basis: '생활문화 모티프',
    description: '손잡이가 이상하게 휘었지만 밥 한 술은 뜰 수 있을 것 같은 놋숟가락이다.',
  },
  {
    id: 'dried-inkstone',
    name: '먹이 말라붙은 벼루',
    icon: '⬛',
    rarity: 'common',
    price: 110,
    basis: '생활문화 모티프',
    description: '칼날 대신 먹물이 굳은 벼루가 나왔다. 글씨도 무기도 지금은 어렵다.',
  },
  {
    id: 'grandmothers-kindling',
    name: '할머니의 불쏘시개',
    icon: '🪵',
    rarity: 'uncommon',
    price: 220,
    basis: '게임 속 상상',
    description: '누군가 아껴 둔 마른 장작 한 토막. 대장장이는 왜 시간의 틈에서 나왔는지 모른 척한다.',
  },
  {
    id: 'dented-pot-lid',
    name: '찌그러진 무쇠 솥뚜껑',
    icon: '⚫',
    rarity: 'uncommon',
    price: 260,
    basis: '생활문화 모티프',
    description: '한쪽이 움푹 들어가 솥에도 맞지 않는다. 두드린 흔적만은 장인급이다.',
  },
  {
    id: 'cracked-spindle-whorl',
    name: '금 간 가락바퀴',
    icon: '🛞',
    rarity: 'uncommon',
    price: 290,
    basis: '생활문화 모티프',
    description: '실을 잣는 도구를 닮았지만 가운데 금이 가 있어 실제로 쓰기는 어렵다.',
  },
  {
    id: 'silent-bronze-bell',
    name: '소리 나지 않는 청동 방울',
    icon: '🔔',
    rarity: 'rare',
    price: 620,
    basis: '역사 유물 모티프',
    description: '청동 방울 모양은 남았지만 아무리 흔들어도 소리가 나지 않는다.',
  },
  {
    id: 'backward-hourglass',
    name: '거꾸로 흐르는 모래시계',
    icon: '⌛',
    rarity: 'rare',
    price: 700,
    basis: '게임 속 상상',
    description: '모래가 아래가 아니라 위로 흐른다. 시간역행 대장간에서도 설명하기 어려운 물건이다.',
  },
  {
    id: 'hidden-smith-seal',
    name: '대장장이가 숨긴 낙관',
    icon: '🟥',
    rarity: 'rare',
    price: 760,
    basis: '게임 속 상상',
    description: '실패작에 찍으려다 감춘 작은 도장. 뒷면에는 “이번만”이라고 새겨져 있다.',
  },
  {
    id: 'unfading-ember',
    name: '꺼지지 않는 태고의 숯',
    icon: '🔥',
    rarity: 'legendary',
    price: 1600,
    basis: '게임 속 상상',
    description: '차갑게 식은 것처럼 보여도 중심에 붉은 점 하나가 계속 살아 있다.',
  },
  {
    id: 'fine-lined-mirror-fragment',
    name: '깨진 잔무늬거울 조각',
    icon: '🪞',
    rarity: 'legendary',
    price: 1900,
    basis: '역사 유물 모티프',
    description: '가느다란 기하무늬가 남은 청동 조각. 실제 유물이 아니라 시간 오류가 만든 게임 속 괴작이다.',
  },
];

export const TITLE_DEFINITIONS = [
  {
    id: 'first-curiosity',
    name: '망치가 낳은 것',
    type: 'permanent',
    reward: 120,
    description: '괴작을 처음 발견했다.',
    check: ({ uniqueDiscovered }) => uniqueDiscovered >= 1,
  },
  {
    id: 'curiosity-collector',
    name: '괴작 수집가',
    type: 'permanent',
    reward: 350,
    description: '서로 다른 괴작 5종을 발견했다.',
    check: ({ uniqueDiscovered }) => uniqueDiscovered >= 5,
  },
  {
    id: 'time-junk-dealer',
    name: '시간의 고물상',
    type: 'permanent',
    reward: 800,
    description: '서로 다른 괴작 10종을 발견했다.',
    check: ({ uniqueDiscovered }) => uniqueDiscovered >= 10,
  },
  {
    id: 'legendary-failure',
    name: '태고의 실패를 본 자',
    type: 'permanent',
    reward: 1000,
    description: '전설 괴작을 한 번 이상 발견했다.',
    check: ({ legendaryDiscovered }) => legendaryDiscovered >= 1,
  },
  {
    id: 'failure-is-money',
    name: '실패도 돈이 된다',
    type: 'permanent',
    reward: 600,
    description: '괴작 판매 누적 3,000냥을 달성했다.',
    check: ({ soldValue }) => soldValue >= 3000,
  },
  {
    id: 'curiosity-holder',
    name: '괴작을 품은 자',
    type: 'possession',
    reward: 250,
    description: '괴작을 합계 5개 이상 보유 중이다. 판매해 조건이 깨지면 비활성화된다.',
    check: ({ ownedTotal }) => ownedTotal >= 5,
  },
  {
    id: 'grandmothers-firekeeper',
    name: '할머니의 화로지기',
    type: 'possession',
    reward: 300,
    description: '할머니의 불쏘시개를 보유 중이다. 판매하면 비활성화된다.',
    check: ({ inventory }) => (inventory['grandmothers-kindling'] || 0) >= 1,
  },
];

const safeCuriosityCount = value => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : 0;
};

export const getCuriosityMetrics = ({ inventory = {}, discoveries = {}, soldValue = 0 } = {}) => {
  const safeInventory = Object.fromEntries(CURIOSITIES.map(item => [item.id, safeCuriosityCount(inventory[item.id])]));
  const safeDiscoveries = Object.fromEntries(CURIOSITIES.map(item => [item.id, safeCuriosityCount(discoveries[item.id])]));
  return {
    uniqueDiscovered: CURIOSITIES.filter(item => safeDiscoveries[item.id] > 0).length,
    ownedTotal: Object.values(safeInventory).reduce((sum, count) => sum + count, 0),
    legendaryDiscovered: CURIOSITIES
      .filter(item => item.rarity === 'legendary')
      .reduce((sum, item) => sum + safeDiscoveries[item.id], 0),
    soldValue: safeCuriosityCount(soldValue),
    inventory: safeInventory,
  };
};

export const getCuriositySaleImpact = ({ inventory = {}, discoveries = {}, soldValue = 0 } = {}, itemId, quantity = 1) => {
  const item = CURIOSITIES.find(candidate => candidate.id === itemId);
  const currentMetrics = getCuriosityMetrics({ inventory, discoveries, soldValue });
  if (!item) return { result: 'missing-item', quantity: 0, saleValue: 0, deactivatedTitles: [], nextInventory: currentMetrics.inventory };
  const owned = currentMetrics.inventory[itemId] || 0;
  const safeQuantity = Math.min(owned, Math.max(1, safeCuriosityCount(quantity)));
  if (safeQuantity <= 0) return { result: 'not-owned', quantity: 0, saleValue: 0, deactivatedTitles: [], nextInventory: currentMetrics.inventory };
  const nextInventory = {
    ...currentMetrics.inventory,
    [itemId]: owned - safeQuantity,
  };
  const nextMetrics = getCuriosityMetrics({
    inventory: nextInventory,
    discoveries,
    soldValue: currentMetrics.soldValue + item.price * safeQuantity,
  });
  const deactivatedTitles = TITLE_DEFINITIONS.filter(title => (
    title.type === 'possession'
    && title.check(currentMetrics)
    && !title.check(nextMetrics)
  ));
  return {
    result: 'ready',
    quantity: safeQuantity,
    saleValue: item.price * safeQuantity,
    deactivatedTitles,
    nextInventory,
  };
};
