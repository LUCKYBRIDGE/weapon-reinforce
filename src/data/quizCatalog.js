export const QUIZ_PACKS = [
  {
    id: 'gugudan',
    label: '구구단',
    shortLabel: '구구단',
    icon: '✖️',
    kind: 'csv',
    file: 'gugudan-2to9.csv',
    questionCount: 72,
    reward: [50, 75],
    description: '2단부터 9단까지 곱셈을 연습합니다.',
  },
  {
    id: 'division-gugudan',
    label: '나눗셈(구구단)',
    shortLabel: '나눗셈',
    icon: '➗',
    kind: 'csv',
    file: 'division-gugudan-2to9.csv',
    questionCount: 72,
    reward: [55, 80],
    description: '구구단 범위에서 나누어떨어지는 나눗셈입니다.',
  },
  {
    id: 'make-10-addition',
    label: '더해서 10 만들기',
    shortLabel: '10 만들기',
    icon: '🔟',
    kind: 'csv',
    file: 'make-10-addition.csv',
    questionCount: 20,
    reward: [50, 70],
    description: '빈칸에 들어갈 수를 찾아 합을 10으로 만듭니다.',
  },
  {
    id: 'make-100-addition',
    label: '더해서 100 만들기',
    shortLabel: '100 만들기',
    icon: '💯',
    kind: 'csv',
    file: 'make-100-addition.csv',
    questionCount: 40,
    reward: [55, 80],
    description: '두 수의 합이 100이 되도록 빈칸을 채웁니다.',
  },
  {
    id: 'make-10-100-1000-multiplication',
    label: '10·100·1000 만들기 곱셈',
    shortLabel: '큰 수 곱셈',
    icon: '🧮',
    kind: 'csv',
    file: 'make-10-100-1000-multiplication.csv',
    questionCount: 52,
    reward: [65, 90],
    description: '곱해서 10, 100, 1000을 만드는 수를 찾습니다.',
  },
  {
    id: 'desk-chair-patterns',
    label: '규칙과 대응: 책상과 의자',
    shortLabel: '규칙과 대응',
    icon: '🪑',
    kind: 'json',
    file: 'desk-chair-pattern-questions.json',
    questionCount: 22,
    reward: [75, 105],
    description: '그림에서 책상과 의자 수의 대응 규칙을 찾습니다.',
  },
  {
    id: 'facecolor',
    label: '전개도: 평행한 면',
    shortLabel: '평행한 면',
    icon: '🟦',
    kind: 'json',
    file: 'facecolor-questions.json',
    questionCount: 132,
    reward: [90, 125],
    description: '입체도형을 접었을 때 서로 평행한 면을 찾습니다.',
  },
  {
    id: 'edgecolor',
    label: '전개도: 맞물리는 모서리',
    shortLabel: '맞물리는 모서리',
    icon: '📐',
    kind: 'json',
    file: 'edgecolor-questions.json',
    questionCount: 220,
    reward: [95, 130],
    description: '전개도를 접었을 때 만나는 모서리의 짝을 고릅니다.',
  },
  {
    id: 'validity',
    label: '전개도: 올바른 전개도',
    shortLabel: '올바른 전개도',
    icon: '🧊',
    kind: 'json',
    file: 'validity-questions.json',
    questionCount: 132,
    reward: [90, 125],
    description: '보기 네 개 중 실제 입체도형으로 접히는 전개도를 찾습니다.',
  },
];

export const DEFAULT_QUIZ_PACK_ID = 'gugudan';
export const QUIZ_TOTAL_QUESTION_COUNT = QUIZ_PACKS.reduce((sum, pack) => sum + pack.questionCount, 0);
export const QUIZ_REFERENCE_REWARD = Math.round(
  QUIZ_PACKS.reduce((sum, pack) => sum + (pack.reward[0] + pack.reward[1]) / 2, 0) / QUIZ_PACKS.length,
);

const packCache = new Map();

export const getQuizPack = (packId) => (
  QUIZ_PACKS.find(pack => pack.id === packId) || QUIZ_PACKS[0]
);

export const isQuizImageAsset = (value) => (
  /\.(svg|png|jpe?g|webp|gif)(\?.*)?$/i.test(String(value || '').trim())
);

const joinBaseUrl = (baseUrl, path) => `${String(baseUrl || '/').replace(/\/?$/, '/')}${String(path || '').replace(/^\/+/, '')}`;

export const resolveQuizAssetUrl = (value, baseUrl = import.meta.env.BASE_URL) => {
  const source = String(value || '').trim();
  if (!source) return '';
  if (/^(https?:|data:|blob:)/i.test(source)) return source;
  const normalized = source
    .replace(/^\.\//, '')
    .replace(/^assets\/quiz\/nets\//, '')
    .replace(/^quiz\/nets\//, '');
  return joinBaseUrl(baseUrl, `quiz/nets/${normalized}`);
};

export const parseCsvQuizPack = (text, pack) => {
  const lines = String(text || '').trim().split(/\r?\n/).filter(Boolean);
  return lines.slice(1).map((line, index) => {
    const columns = line.split(',').map(value => value.trim());
    const options = columns.slice(1, 5).filter(Boolean);
    const answerIndex = Number(columns[5]) - 1;
    const answer = options[answerIndex];
    return {
      id: `${pack.id}-${index + 1}`,
      packId: pack.id,
      type: pack.id,
      prompt: '정답을 고르세요',
      q: columns[0],
      text: columns[0],
      image: '',
      options,
      a: answer,
      answer,
      hasQuestionImage: false,
      hasChoiceImages: false,
      difficulty: 1,
      tags: [pack.id],
    };
  }).filter(question => question.text && question.options.length >= 2 && question.answer);
};

export const normalizeJsonQuizPack = (payload, pack, baseUrl = import.meta.env.BASE_URL) => {
  const questions = Array.isArray(payload?.questions) ? payload.questions : [];
  return questions.map((question, index) => {
    const rawQuestion = String(question.question || question.image || '').trim();
    const prompt = String(question.prompt || '정답을 고르세요').trim();
    const options = Array.isArray(question.choices)
      ? question.choices.slice(0, 4).map(choice => String(choice).trim()).filter(Boolean)
      : [];
    const choiceOnlyImageQuestion = question.type === 'validity'
      || /올바르지?\s*않은\s*전개도|올바른\s*전개도/.test(prompt);
    const hasQuestionImage = !choiceOnlyImageQuestion && isQuizImageAsset(rawQuestion);
    const hasChoiceImages = options.some(isQuizImageAsset);
    const answer = String(question.answer || '').trim();
    return {
      id: String(question.id || `${pack.id}-${index + 1}`),
      packId: pack.id,
      type: String(question.type || pack.id),
      prompt,
      q: String(question.text || prompt).trim(),
      text: String(question.text || '').trim(),
      image: hasQuestionImage ? resolveQuizAssetUrl(rawQuestion, baseUrl) : '',
      options,
      a: answer,
      answer,
      hasQuestionImage,
      hasChoiceImages,
      difficulty: Number(question.difficulty) || 1,
      tags: Array.isArray(question.tags) ? question.tags.map(String) : [],
    };
  }).filter(question => (
    (question.image || question.text || question.prompt)
    && question.options.length >= 2
    && question.answer
    && question.options.includes(question.answer)
  ));
};

export const loadQuizPack = async (packId, options = {}) => {
  const pack = getQuizPack(packId);
  const baseUrl = options.baseUrl ?? import.meta.env.BASE_URL;
  if (packCache.has(pack.id)) return packCache.get(pack.id);

  const response = await fetch(joinBaseUrl(baseUrl, `quiz/data/${pack.file}`), { cache: 'no-store' });
  if (!response.ok) throw new Error(`${pack.label} 문제 데이터를 불러오지 못했습니다.`);
  const questions = pack.kind === 'csv'
    ? parseCsvQuizPack(await response.text(), pack)
    : normalizeJsonQuizPack(await response.json(), pack, baseUrl);
  if (!questions.length) throw new Error(`${pack.label}에 사용할 수 있는 문제가 없습니다.`);
  packCache.set(pack.id, questions);
  return questions;
};

export const pickQuizQuestion = (questions, recentIds = [], random = Math.random) => {
  const list = Array.isArray(questions) ? questions : [];
  if (!list.length) return null;
  const recent = new Set(recentIds);
  const available = list.filter(question => !recent.has(question.id));
  const pool = available.length ? available : list;
  return pool[Math.floor(random() * pool.length)] || pool[0];
};

export const getQuizReward = (packId, random = Math.random) => {
  const [min, max] = getQuizPack(packId).reward;
  return min + Math.floor(random() * (max - min + 1));
};

export const createEmptyQuizStats = () => ({
  total: 0,
  correct: 0,
  wrong: 0,
  earned: 0,
  streak: 0,
  bestStreak: 0,
  byPack: {},
});
