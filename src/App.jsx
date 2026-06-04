import { useState, useEffect, useRef } from 'react';

// 구구단 및 나눗셈 퀴즈 생성기 (knol-defence 스타일)
const generateMathQuiz = () => {
  const isDivision = Math.random() > 0.5;
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
  1: { cost: 50, rate: 100 },
  2: { cost: 100, rate: 90 },
  3: { cost: 200, rate: 70 },
  4: { cost: 400, rate: 50 },
  5: { cost: 800, rate: 30 },
  6: { cost: 1500, rate: 10 },
};


// 변방 출전 스테이지 (7단계, 보상은 매우 적게)
const STAGES = [
  {
    level: 1,
    name: '뒷골목 깡패 소탕',
    desc: '마을 뒷골목을 점령한 불량배 무리를 진압하라.',
    baseChance: 80,
    reward: 5,
    winMsg: '뒷골목 불량배들을 쫓아냈다!',
    loseMsg: '깡패 두목에게 발목을 잡혀 철수했다...',
  },
  {
    level: 2,
    name: '지리산 멧돼지 사냥',
    desc: '마을 농작물을 쑥대밭으로 만드는 멧돼지 떼를 토벌하라.',
    baseChance: 65,
    reward: 8,
    winMsg: '멧돼지 떼를 산속 깊이 몰아냈다!',
    loseMsg: '멧돼지 돌진에 밀려 산에서 굴러 내려왔다...',
  },
  {
    level: 3,
    name: '백두산 호랑이 격퇴',
    desc: '백두산에 출몰해 인명 피해를 입히는 산군(山君) 호랑이를 상대하라.',
    baseChance: 50,
    reward: 12,
    winMsg: '호랑이를 굴복시키고 백두산에서 돌아왔다!',
    loseMsg: '호랑이의 앞발 후려치기에 도망쳤다...',
  },
  {
    level: 4,
    name: '홍길동과의 비무',
    desc: '민초를 돕는 의적 홍길동과의 비무 대결. 이겨야 조선 제일 무사로 인정받는다.',
    baseChance: 38,
    reward: 18,
    winMsg: '홍길동도 인정한 무예! 명장으로 칭송받았다!',
    loseMsg: '홍길동의 묘한 분신술에 허를 찔려 쫓겨났다...',
  },
  {
    level: 5,
    name: '왜구 해적 토벌',
    desc: '남해를 노략질하는 왜구 선단에 침투해 두목을 잡아라.',
    baseChance: 27,
    reward: 25,
    winMsg: '왜구 선단을 격침시키고 바다를 되찾았다!',
    loseMsg: '왜구의 조총 사격에 바다로 풍덩 빠졌다...',
  },
  {
    level: 6,
    name: '북방 여진족 철기 격퇴',
    desc: '북방 변경을 침략한 여진족 기마 철기병을 맞아 싸워라.',
    baseChance: 18,
    reward: 35,
    winMsg: '여진족 기병을 몰아내고 변방에 깃발을 꽂았다!',
    loseMsg: '말발굽 먼지를 잔뜩 마시고 후퇴했다...',
  },
  {
    level: 7,
    name: '이무기 토벌 (최종)',
    desc: '한강 상류에 웅크린 전설의 이무기. 이것을 물리쳐야 조선의 진정한 영웅이 된다.',
    baseChance: 10,
    reward: 50,
    winMsg: '이무기를 베어냈다! 조선의 영웅으로 역사에 이름을 새겼다!',
    loseMsg: '이무기의 번개벼락에 쓸려 강물에 떠내려갔다...',
  },
];

const getMidnightNews = (maxTier, maxPath) => {
  const dateStr = `조선 16XX년 O월 O일 (대장간 일보)`;
  let title = "";
  let body = "";

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
      "여진족 기병을 몰아내고 변방에 깃발을 꽂았다!",
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


const getCombatNews = (stageLevel, isWin, weaponName, tier) => {
  const titleDate = "조선 16XX년 O월 O일 (한성 일보 속보)";
  const formattedWeapon = `+${tier} [${weaponName}]`;

  const storyData = COMBAT_STORIES[stageLevel];
  if (!storyData) {
    return {
      titleDate,
      headline: `⚔️ 전투 보고: 주인공, 변방에서 생환!`,
      body: `주인공이 ${formattedWeapon}을(를) 들고 용맹하게 싸우다 돌아왔습니다.`
    };
  }

  let options = [];
  if (isWin && stageLevel === 7) {
    options = storyData.news.win || [];
  } else {
    options = storyData.news.lose || [];
  }

  if (options.length === 0) {
    return {
      titleDate,
      headline: `⚔️ 전투 보고: 주인공, 변방에서 생환!`,
      body: `주인공이 ${formattedWeapon}을(를) 들고 용맹하게 싸우다 돌아왔습니다.`
    };
  }

  // Pick a random option
  const selected = options[Math.floor(Math.random() * options.length)];
  
  // Format placeholders
  const headline = selected.headline.replace(/{weapon}/g, formattedWeapon);
  const body = selected.body.replace(/{weapon}/g, formattedWeapon);

  return { titleDate, headline, body };
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
        
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        
        // Remove white or off-white background pixels (R > 240, G > 240, B > 240)
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          if (r > 240 && g > 240 && b > 240) {
            data[i + 3] = 0; // set alpha to 0
          }
        }
        ctx.putImageData(imgData, 0, 0);
        setProcessedSrc(canvas.toDataURL());
      } catch (e) {
        setProcessedSrc(src);
      }
    };
    img.onerror = () => {
      setHasError(true);
      if (onError) onError();
    };
  }, [src]);

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

  const src = tier === 1 ? '/images/weapon_1.png' : `/images/weapon_${path}_${tier}.png`;

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
      onError={() => setHasError(true)} 
    />
  );
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
  const [currentQuiz, setCurrentQuiz] = useState(generateMathQuiz());
  const [logs, setLogs] = useState([]);
  const [showQuizModal, setShowQuizModal] = useState(false);
  
  // Deploy (출전) states
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [deployStep, setDeployStep] = useState(0); // index of current stage (0 to 6)
  const [deployLogs, setDeployLogs] = useState({}); // { 0: [...logs for stage 1], 1: [...logs for stage 2], ... }
  const [deployStatus, setDeployStatus] = useState('idle'); // 'idle' | 'fighting' | 'finished'
  const [deployReward, setDeployReward] = useState(0);
  const [combatShake, setCombatShake] = useState(false);
  const [newsReport, setNewsReport] = useState(null);

  // Page Navigation states
  const [currentDeployPage, setCurrentDeployPage] = useState(1); // 1-indexed (1 to 8: pages 1-7 are stages, page 8 is news)
  const [maxReachedPage, setMaxReachedPage] = useState(1); // max page unlocked so far
  
  // Animation states
  const [floatingTexts, setFloatingTexts] = useState([]);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isStriking, setIsStriking] = useState(false);
  const [particles, setParticles] = useState([]);
  const [strikeTexts, setStrikeTexts] = useState([]);
  const [outcome, setOutcome] = useState(null); // 'success', 'fail'
  const [flashClass, setFlashClass] = useState('');

  // Blacksmith Apology & Recovery states
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [preFailureState, setPreFailureState] = useState(null); // { tier, path }
  const [recoveryQuiz, setRecoveryQuiz] = useState(null); // { step, correct, answers: [] }

  const deployLogViewerRef = useRef(null);

  useEffect(() => {
    if (deployLogViewerRef.current) {
      deployLogViewerRef.current.scrollTop = deployLogViewerRef.current.scrollHeight;
    }
  }, [deployLogs, currentDeployPage]);

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

  const addLog = (msg, type = 'info') => {
    setLogs(prev => [{ id: Date.now() + Math.random(), msg, type }, ...prev].slice(0, 5));
  };

  let weaponName = WEAPON_TREE.common[1].name;
  if (tier > 1 && path) {
    weaponName = WEAPON_TREE[path][tier].name;
  }

  const handleAnswer = (selected, e) => {
    if (selected === currentQuiz.a) {
      const reward = 50 + Math.floor(Math.random() * 50); // 50~99 gold
      setGold(g => g + reward);
      addLog(`[작업 완료] +${reward} 냥 획득!`, 'success');
      
      // Floating text effect
      const id = Date.now();
      const rect = e.target.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top;
      
      setFloatingTexts(prev => [...prev, { id, text: `+${reward}냥!`, x, y }]);
      setTimeout(() => {
        setFloatingTexts(prev => prev.filter(t => t.id !== id));
      }, 1000);

    } else {
      addLog(`[작업 실수] 엽전을 얻지 못했습니다.`, 'error');
    }
    // Next quiz immediately
    setCurrentQuiz(generateMathQuiz());
  };

  const triggerFlash = (type) => {
    setFlashClass(`flash-${type}`);
    setTimeout(() => setFlashClass(''), 1000);
  };

  const triggerStrike = () => {
    setIsStriking(true);
    setTimeout(() => setIsStriking(false), 150);

    // Strike text pop
    const strikeId = `${Date.now()}-${Math.random()}`;
    const textX = 35 + Math.random() * 30;
    const textY = 25 + Math.random() * 20;
    setStrikeTexts(prev => [...prev, { id: strikeId, text: '깡!', x: `${textX}%`, top: `${textY}%` }]);
    setTimeout(() => {
      setStrikeTexts(prev => prev.filter(t => t.id !== strikeId));
    }, 400);

    // Spark particles
    const newParticles = [];
    for (let i = 0; i < 15; i++) {
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
    addLog(`망치질을 시작합니다...`, 'info');

    // Strike at 300ms, 700ms, 1100ms
    setTimeout(() => triggerStrike(), 300);
    setTimeout(() => triggerStrike(), 700);
    setTimeout(() => triggerStrike(), 1100);

    // Decision at 1500ms
    setTimeout(() => {
      setIsEnhancing(false);
      const targetPath = selectedPath || path;
      const roll = Math.random() * 100;

      if (roll <= currentRateInfo.rate) {
        // Success
        setOutcome('success');
        triggerSuccessParticles();
        triggerFlash('success');
        addLog(`✨ 강화 성공! 무기가 더욱 단단해집니다.`, 'success');
        
        setTimeout(() => {
          setTier(t => {
            const nextTier = t + 1;
            setMaxTierToday(mt => Math.max(mt, nextTier));
            return nextTier;
          });
          const finalPath = path || selectedPath;
          if (!path && selectedPath) {
            setPath(selectedPath);
            setMaxPathToday(selectedPath);
          }
          unlockWeapon(tier + 1, finalPath);
          setOutcome(null);
        }, 1500);
      } else {
        // Failure
        setOutcome('fail');
        triggerFailParticles();
        triggerFlash('fail');
        addLog(`💥 강화 실패... 무기가 심하게 흔들립니다.`, 'error');

        // Backup current tier/path for recovery option
        setPreFailureState({ tier, path });

        setTimeout(() => {
          setOutcome(null);
          setShowRecoveryModal(true); // Open blacksmith recovery choice modal
        }, 1500);
      }
    }, 1500);
  };

  const handleAcceptRecovery = () => {
    setRecoveryQuiz({
      active: true,
      step: 0,
      correct: 0,
      answers: []
    });
    setCurrentQuiz(generateMathQuiz());
  };

  const handleDeclineRecovery = () => {
    setTier(1);
    setPath(null);
    addLog(`💥 복구를 포기하여 무기가 파괴되었습니다. (낡은 몽둥이 1강)`, 'error');
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
      setCurrentQuiz(generateMathQuiz());
    } else {
      // 5 questions finished! Calculate success rate and roll!
      const finalCorrect = newCorrect;
      const recoveryRate = 30 + finalCorrect * 10; // 0 correct = 30%, 5 correct = 80%
      const roll = Math.random() * 100;

      if (roll <= recoveryRate) {
        // Recovery Success! Restore weapon!
        setTier(preFailureState.tier);
        setPath(preFailureState.path);
        addLog(`✨ 대장장이의 복구 성공! 무기가 원래 상태(+${preFailureState.tier} 강)로 복원되었습니다!`, 'success');
        triggerFlash('success');
      } else {
        // Recovery Failed! Reset weapon to 1
        setTier(1);
        setPath(null);
        addLog(`💥 복구 실패... 무기가 산산조각 나며 [낡은 몽둥이]가 되었습니다.`, 'error');
        triggerFlash('fail');
      }

      // Cleanup
      setShowRecoveryModal(false);
      setRecoveryQuiz(null);
      setPreFailureState(null);
      setCurrentQuiz(generateMathQuiz());
    }
  };

  const triggerMidnightReport = () => {
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

  // [테스트 전용] 특정 무기를 즉시 세팅
  const handleTestSetWeapon = (testPath, testTier) => {
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
    if (deployStatus === 'fighting' || isEnhancing || outcome) return;
    
    setDeployStatus('fighting');
    setDeployStep(0);
    setDeployReward(0);
    setDeployLogs({
      0: [{ id: 'start', msg: `⚔️ +${tier} [${weaponName}]을(를) 장착하고 변방으로 출전합니다.`, type: 'info' }]
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
      setDeployStatus('finished');
      setDeployReward(accReward);
      setGold(g => g + accReward);
      
      const report = getCombatNews(7, true, weaponName, tier);
      setNewsReport(report);
      
      setDeployLogs(prev => ({
        ...prev,
        6: [
          ...(prev[6] || []),
          { id: `win-7`, msg: `👑 [최종 승리] 한강의 이무기를 격퇴하고 한양의 평화를 수호했습니다!`, type: 'success' },
          { id: `finish-7`, msg: `📢 출전 완료! 총 ${accReward} 냥의 전리품이 국고(엽전)로 입금되었습니다.`, type: 'info' }
        ]
      }));

      setCurrentDeployPage(8);
      setMaxReachedPage(8);
      return;
    }

    const stage = STAGES[index];
    
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
        { id: `encounter-${index}`, msg: `[${index + 1}단계] ${stage.name}에 진입합니다... (기본 확률: ${stage.baseChance}%)`, type: 'info' }
      ]
    }));

    setTimeout(() => {
      // Pass Probability = BaseChance + (tier - 1) * 12% (min 5%, max 95%)
      let passChance = stage.baseChance + (tier - 1) * 12;
      passChance = Math.max(5, Math.min(95, passChance));

      const roll = Math.random() * 100;
      const isSuccess = roll <= passChance;

      // Shake effect on hit!
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
        const stageReward = stage.reward;
        const newTotalReward = accReward + stageReward;
        
        setDeployLogs(prev => ({
          ...prev,
          [index]: [
            ...(prev[index] || []),
            { id: `success-${index}`, msg: `✨ [돌파 성공] ${COMBAT_STORIES[index + 1] ? COMBAT_STORIES[index + 1].winLogs[Math.floor(Math.random() * COMBAT_STORIES[index + 1].winLogs.length)] : stage.winMsg} (+${stageReward} 냥)`, type: 'success' }
          ]
        }));

        runStage(index + 1, newTotalReward);
      } else {
        setDeployStatus('finished');
        setDeployReward(accReward);
        setGold(g => g + accReward);

        const report = getCombatNews(index + 1, false, weaponName, tier);
        setNewsReport(report);

        setDeployLogs(prev => ({
          ...prev,
          [index]: [
            ...(prev[index] || []),
            { id: `fail-${index}`, msg: `💥 [패배] ${COMBAT_STORIES[index + 1] ? COMBAT_STORIES[index + 1].loseLogs[Math.floor(Math.random() * COMBAT_STORIES[index + 1].loseLogs.length)] : stage.loseMsg}`, type: 'error' },
            { id: `finish-${index}`, msg: `📢 출전 종료! 총 ${accReward} 냥의 전리품이 입금되었습니다.`, type: 'info' }
          ]
        }));

        // Flip to the final news page
        setCurrentDeployPage(index + 2);
        setMaxReachedPage(index + 2);
      }
    }, 1200);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h1 style={{ margin: 0 }}>Weapon Reinforce</h1>
          <button className="gallery-btn" onClick={() => setShowGalleryModal(true)}>📖 무기 도감</button>
        </div>
        <div className="gold-display">🪙 {gold.toLocaleString()} 냥</div>
      </header>

      <div className="main-content">
        <section className={`smith-section glass-panel`}>
          <h2>⚒️ 신비한 대장간</h2>
          
          <button 
            className="btn-primary quiz-toggle-btn" 
            onClick={() => setShowQuizModal(true)}
            disabled={isEnhancing || outcome}
          >
            🔥 대장간 풀무질 알바 (엽전 벌기)
          </button>
          
          <div className={`weapon-display ${isEnhancing ? 'is-enhancing' : ''} ${isStriking ? 'is-striking' : ''} ${outcome ? outcome : ''}`}>
            <div className="bg-layer"></div>
            <div className="furnace-glow"></div>
            <div className="weapon-glow"></div>
            
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
                  '--dy': p.dy 
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
            {outcome && (
              <div className={`result-banner ${outcome}`}>
                {outcome === 'success' ? '성공!' : '실패...'}
              </div>
            )}

            <div className="weapon-name">
              {isEnhancing ? "강화 중..." : weaponName}
            </div>
          </div>

          <div className="upgrade-controls">
            {tier < 7 ? (
              <>
                <div className="upgrade-info">
                  <span>비용: {UPGRADE_RATES[tier].cost} 냥</span>
                  <span>성공 확률: {UPGRADE_RATES[tier].rate}%</span>
                </div>
                
                {tier === 1 ? (
                  <div className="path-selection">
                    <button className="btn-success" onClick={() => handleUpgrade("1H")} disabled={isEnhancing || outcome}>한손검 진화</button>
                    <button className="btn-success" onClick={() => handleUpgrade("2H")} disabled={isEnhancing || outcome}>두손검 진화</button>
                  </div>
                ) : (
                  <button className="btn-success" onClick={() => handleUpgrade()} disabled={isEnhancing || outcome} style={{padding: '1rem', fontSize: '1.2rem'}}>
                    무기 벼리기 (강화)
                  </button>
                )}
              </>
            ) : (
              <div className="upgrade-info" style={{justifyContent: 'center', color: '#fbbf24', fontSize: '1.2rem', fontWeight: 'bold'}}>
                👑 최종 단계 무기입니다!
              </div>
            )}
            
            <button 
              className="btn-deploy" 
              onClick={startDeployment} 
              disabled={isEnhancing || outcome || deployStatus === 'fighting'}
              style={{ padding: '1rem', fontSize: '1.2rem', marginTop: '0.5rem', width: '100%' }}
            >
              ⚔️ 변방 출전 (전투 시뮬레이션)
            </button>
          </div>
        </section>
      </div>

      <div className="glass-panel" style={{padding: '1rem', textAlign: 'center', display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap'}}>
        <button style={{background: '#374151'}} onClick={triggerMidnightReport}>
          🌙 시간 가속 (자정 초기화 테스트)
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
            <h2>💦 불꽃 튀는 작업 현장 (구구단)</h2>
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
                  src="/images/blacksmith_apology.png" 
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
                      (※ 복구 성공률: 5문제 모두 정답 시 80%, 한 문제 틀릴 때마다 10% 차감. 실패 시 복구 불가 및 1강 리셋)
                    </small>
                  </>
                ) : (
                  <>
                    "풀무질을 세게 밀어넣어 주시오! 수학 문제를 빠르고 정확하게 풀수록 복구 성공률이 올라갑니다!"
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
                    현재 복구 성공률: {30 + recoveryQuiz.correct * 10}%
                  </span>
                </div>
                <div className="recovery-meter-bar">
                  <div 
                    className="recovery-meter-fill" 
                    style={{ width: `${((30 + recoveryQuiz.correct * 10) / 80) * 100}%` }}
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

      {/* DEPLOY MODAL (변방 출전첩 - 책장형 인터페이스) */}
      {showDeployModal && (() => {
        const isNewsPage = deployStatus === 'finished' && currentDeployPage === maxReachedPage;
        const pageIdx = currentDeployPage - 1;
        const stage = pageIdx < 7 ? STAGES[pageIdx] : null;
        
        return (
          <div className={`modal-overlay deploy-overlay ${combatShake ? 'shake-combat' : ''}`}>
            <div className="deploy-scroll-container glass-panel page-slide">
              {deployStatus !== 'fighting' && (
                <button 
                  className="close-btn" 
                  onClick={() => setShowDeployModal(false)}
                >
                  ✕
                </button>
              )}
              
              <h2>⚔️ 조선 변방 토벌 출전첩</h2>
              
              {/* 상단 진행률 및 탭 이동 */}
              <div className="deploy-stage-flow">
                <div className="deploy-weapon-info">
                  <span className="weapon-badge">+{tier} 강 {weaponName}</span>
                  <span className="reward-accumulated">💰 누적 획득: <strong>{deployReward}</strong> 냥</span>
                </div>
                
                <div className="deploy-stage-progress">
                  <div className="stage-dots">
                    {STAGES.map((s, idx) => {
                      let dotClass = '';
                      const pageNum = idx + 1;
                      
                      if (idx < deployStep) dotClass = 'passed';
                      else if (idx === deployStep && deployStatus === 'fighting') dotClass = 'active-fight';
                      else if (idx === deployStep && deployStatus === 'finished') dotClass = 'failed';
                      
                      if (currentDeployPage === pageNum) dotClass += ' viewing';
                      
                      const isClickable = pageNum <= maxReachedPage;
                      
                      return (
                        <button 
                          key={idx} 
                          className={`stage-dot-btn ${dotClass}`}
                          onClick={() => {
                            if (isClickable) setCurrentDeployPage(pageNum);
                          }}
                          disabled={!isClickable}
                          title={s.name}
                        >
                          {s.level}
                        </button>
                      );
                    })}
                    
                    {/* 뉴스 속보 배지 */}
                    {deployStatus === 'finished' && newsReport && (
                      <button 
                        className={`stage-dot-btn news-badge ${currentDeployPage === maxReachedPage ? 'viewing' : ''}`}
                        onClick={() => setCurrentDeployPage(maxReachedPage)}
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
                <div className="newspaper-card traditional-style">
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
                  <div className="settlement-rewards">
                    <span>🎁 최종 전리품 정산: <strong>+{deployReward}</strong> 냥</span>
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
                stage && (
                  <div className="deploy-page-content">
                    <div className="deploy-stage-header">
                      <h3>{currentDeployPage}단계: {stage.name}</h3>
                      <div className="deploy-stage-meta">
                        <span>🎯 기본 성공률: {Math.max(5, Math.min(95, stage.baseChance + (tier - 1) * 12))}%</span>
                        <span>💰 성공 보상: {stage.reward} 냥</span>
                      </div>
                    </div>
                    
                    <p className="deploy-stage-desc">
                      <strong>토벌 임무:</strong> {stage.desc}
                    </p>
                    
                    <div className="deploy-stage-status">
                      {pageIdx < deployStep ? (
                        <span className="status-badge clear">✅ 돌파 성공</span>
                      ) : pageIdx === deployStep && deployStatus === 'fighting' ? (
                        <span className="status-badge fighting">⚔️ 격렬한 교전 중</span>
                      ) : (
                        <span className="status-badge fail">❌ 패배 및 철수</span>
                      )}
                    </div>

                    <div className="deploy-battleground">
                      <div className="deploy-log-viewer" ref={deployLogViewerRef}>
                        {(deployLogs[pageIdx] || []).map((log, lIdx) => (
                          <div key={lIdx} className={`deploy-log-entry ${log.type}`}>
                            &gt; {log.msg}
                          </div>
                        ))}
                        {pageIdx === deployStep && deployStatus === 'fighting' && (
                          <div className="deploy-loading-dots">
                            <span>⚔️ 격전 진행 중</span>
                            <span className="dot-bounce">.</span>
                            <span className="dot-bounce">.</span>
                            <span className="dot-bounce">.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              )}

              {/* 하단 쪽수 넘기기 컨트롤러 */}
              <div className="deploy-page-controls">
                <button 
                  onClick={() => setCurrentDeployPage(p => Math.max(1, p - 1))}
                  disabled={currentDeployPage === 1}
                  className="page-btn"
                >
                  ◀ 이전 쪽
                </button>
                
                <span className="page-indicator">
                  [ {currentDeployPage} / {maxReachedPage} 쪽 ]
                </span>
                
                <button 
                  onClick={() => setCurrentDeployPage(p => Math.min(maxReachedPage, p + 1))}
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
