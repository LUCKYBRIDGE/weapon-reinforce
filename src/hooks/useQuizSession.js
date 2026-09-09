import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createEmptyQuizStats,
  DEFAULT_QUIZ_PACK_ID,
  getQuizPack,
  loadQuizPack,
  pickQuizQuestion,
  QUIZ_PACKS,
} from '../data/quizCatalog.js';
import {
  readStoredObject,
  readStoredString,
  sanitizeNumericStats,
} from '../data/safeStorage.js';

const QUIZ_WRONG_DELAY_MS = 5000;
const QUIZ_WRONG_DELAY_SECONDS = QUIZ_WRONG_DELAY_MS / 1000;
const EMPTY_SESSION_STATS = { correct: 0, wrong: 0, earned: 0, streak: 0 };

const createStoredQuizStats = () => {
  const defaults = createEmptyQuizStats();
  const saved = readStoredObject('weaponQuizStats');
  const numericDefaults = { ...defaults };
  delete numericDefaults.byPack;

  const byPackSource = saved.byPack && typeof saved.byPack === 'object' && !Array.isArray(saved.byPack)
    ? saved.byPack
    : {};
  const byPack = Object.fromEntries(QUIZ_PACKS.map(pack => [
    pack.id,
    sanitizeNumericStats(byPackSource[pack.id], { total: 0, correct: 0, wrong: 0, earned: 0 }),
  ]));

  return { ...sanitizeNumericStats(saved, numericDefaults), byPack };
};

export default function useQuizSession({ isGameplayLocked, onStorageFailure }) {
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizPenalty, setQuizPenalty] = useState(null);
  const [selectedQuizPackId, setSelectedQuizPackId] = useState(() => readStoredString(
    'selectedQuizPackId',
    DEFAULT_QUIZ_PACK_ID,
    QUIZ_PACKS.map(pack => pack.id),
  ));
  const [quizLoadState, setQuizLoadState] = useState('idle');
  const [quizLoadError, setQuizLoadError] = useState('');
  const [quizQuestionCount, setQuizQuestionCount] = useState(0);
  const [quizSessionStats, setQuizSessionStats] = useState(EMPTY_SESSION_STATS);
  const [quizStats, setQuizStats] = useState(createStoredQuizStats);
  const [quizAnswerLocked, setQuizAnswerLocked] = useState(false);

  const quizPenaltyTimerRef = useRef(null);
  const quizPenaltyIntervalRef = useRef(null);
  const quizPackRequestRef = useRef(0);
  const quizRecentIdsRef = useRef([]);
  const quizAnswerLockRef = useRef(false);

  const stopQuizPenaltyTimers = useCallback(() => {
    if (quizPenaltyTimerRef.current) {
      window.clearTimeout(quizPenaltyTimerRef.current);
      quizPenaltyTimerRef.current = null;
    }

    if (quizPenaltyIntervalRef.current) {
      window.clearInterval(quizPenaltyIntervalRef.current);
      quizPenaltyIntervalRef.current = null;
    }
  }, []);

  const clearQuizPenalty = useCallback(() => {
    stopQuizPenaltyTimers();
    setQuizPenalty(null);
  }, [stopQuizPenaltyTimers]);

  const beginQuizPenalty = useCallback(({ correctAnswer, message, delayLabel, onComplete }) => {
    stopQuizPenaltyTimers();

    const deadline = Date.now() + QUIZ_WRONG_DELAY_MS;
    setQuizPenalty({
      correctAnswer,
      message,
      delayLabel,
      remainingSeconds: QUIZ_WRONG_DELAY_SECONDS,
    });

    quizPenaltyIntervalRef.current = window.setInterval(() => {
      const remainingSeconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setQuizPenalty(current => current ? { ...current, remainingSeconds } : current);
    }, 200);

    quizPenaltyTimerRef.current = window.setTimeout(() => {
      stopQuizPenaltyTimers();
      setQuizPenalty(null);
      onComplete?.();
    }, QUIZ_WRONG_DELAY_MS);
  }, [stopQuizPenaltyTimers]);

  useEffect(() => () => {
    stopQuizPenaltyTimers();
  }, [stopQuizPenaltyTimers]);

  useEffect(() => {
    try {
      localStorage.setItem('selectedQuizPackId', selectedQuizPackId);
      localStorage.setItem('weaponQuizStats', JSON.stringify(quizStats));
    } catch (error) {
      onStorageFailure?.(error);
    }
  }, [selectedQuizPackId, quizStats, onStorageFailure]);

  const prepareGoldQuizPack = useCallback(async (packId, { resetRecent = false } = {}) => {
    const safePack = getQuizPack(packId);
    const requestId = quizPackRequestRef.current + 1;
    quizPackRequestRef.current = requestId;

    if (resetRecent) quizRecentIdsRef.current = [];
    quizAnswerLockRef.current = true;
    setQuizAnswerLocked(true);
    setQuizLoadState('loading');
    setQuizLoadError('');

    try {
      const questions = await loadQuizPack(safePack.id);
      if (quizPackRequestRef.current !== requestId) return;

      const nextQuestion = pickQuizQuestion(questions, quizRecentIdsRef.current);
      if (!nextQuestion) throw new Error(`${safePack.label}에서 다음 문제를 고르지 못했습니다.`);

      quizRecentIdsRef.current = [...quizRecentIdsRef.current, nextQuestion.id].slice(-6);
      setCurrentQuiz(nextQuestion);
      setQuizQuestionCount(questions.length);
      setQuizLoadState('ready');
      quizAnswerLockRef.current = false;
      setQuizAnswerLocked(false);
    } catch (error) {
      if (quizPackRequestRef.current !== requestId) return;

      setQuizLoadState('error');
      setQuizLoadError(error instanceof Error ? error.message : '퀴즈 데이터를 불러오지 못했습니다.');
      quizAnswerLockRef.current = false;
      setQuizAnswerLocked(false);
    }
  }, []);

  const openGoldQuiz = useCallback(() => {
    if (isGameplayLocked) return;

    clearQuizPenalty();
    setQuizSessionStats(EMPTY_SESSION_STATS);
    setShowQuizModal(true);
    void prepareGoldQuizPack(selectedQuizPackId, { resetRecent: true });
  }, [clearQuizPenalty, isGameplayLocked, prepareGoldQuizPack, selectedQuizPackId]);

  const handleQuizPackChange = useCallback((nextPackId) => {
    if (quizPenalty || quizAnswerLocked) return;

    const safePack = getQuizPack(nextPackId);
    setSelectedQuizPackId(safePack.id);
    setQuizSessionStats(EMPTY_SESSION_STATS);
    void prepareGoldQuizPack(safePack.id, { resetRecent: true });
  }, [prepareGoldQuizPack, quizAnswerLocked, quizPenalty]);

  const closeQuizModal = useCallback(() => {
    if (quizPenalty) return;

    quizPackRequestRef.current += 1;
    quizAnswerLockRef.current = false;
    setQuizAnswerLocked(false);
    setShowQuizModal(false);
  }, [quizPenalty]);

  const beginQuizAnswer = useCallback(() => {
    if (quizPenalty || quizAnswerLockRef.current || quizLoadState !== 'ready' || !currentQuiz) {
      return false;
    }

    quizAnswerLockRef.current = true;
    setQuizAnswerLocked(true);
    return true;
  }, [currentQuiz, quizLoadState, quizPenalty]);

  const recordQuizCorrect = useCallback((packId, reward) => {
    setQuizSessionStats(current => ({
      correct: current.correct + 1,
      wrong: current.wrong,
      earned: current.earned + reward,
      streak: current.streak + 1,
    }));

    setQuizStats(current => {
      const packStats = current.byPack[packId] || { total: 0, correct: 0, wrong: 0, earned: 0 };
      const nextStreak = current.streak + 1;
      return {
        ...current,
        total: current.total + 1,
        correct: current.correct + 1,
        earned: current.earned + reward,
        streak: nextStreak,
        bestStreak: Math.max(current.bestStreak, nextStreak),
        byPack: {
          ...current.byPack,
          [packId]: {
            ...packStats,
            total: packStats.total + 1,
            correct: packStats.correct + 1,
            earned: packStats.earned + reward,
          },
        },
      };
    });
  }, []);

  const recordQuizWrong = useCallback((packId) => {
    setQuizSessionStats(current => ({
      ...current,
      wrong: current.wrong + 1,
      streak: 0,
    }));

    setQuizStats(current => {
      const packStats = current.byPack[packId] || { total: 0, correct: 0, wrong: 0, earned: 0 };
      return {
        ...current,
        total: current.total + 1,
        wrong: current.wrong + 1,
        streak: 0,
        byPack: {
          ...current.byPack,
          [packId]: {
            ...packStats,
            total: packStats.total + 1,
            wrong: packStats.wrong + 1,
          },
        },
      };
    });
  }, []);

  const scheduleNextQuizQuestion = useCallback((packId, delay = 320) => {
    const nextQuestionMarker = quizPackRequestRef.current;
    window.setTimeout(() => {
      if (quizPackRequestRef.current === nextQuestionMarker) {
        void prepareGoldQuizPack(packId);
      }
    }, delay);
  }, [prepareGoldQuizPack]);

  return {
    currentQuiz,
    showQuizModal,
    quizPenalty,
    selectedQuizPackId,
    quizLoadState,
    quizLoadError,
    quizQuestionCount,
    quizSessionStats,
    quizStats,
    quizAnswerLocked,
    prepareGoldQuizPack,
    openGoldQuiz,
    handleQuizPackChange,
    closeQuizModal,
    beginQuizAnswer,
    recordQuizCorrect,
    recordQuizWrong,
    beginQuizPenalty,
    scheduleNextQuizQuestion,
  };
}
