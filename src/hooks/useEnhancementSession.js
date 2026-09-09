import { useCallback, useRef, useState } from 'react';
import { TIMING_BONUS } from '../data/weaponTimeline.js';

const INITIAL_TIMING_WINDOW = { active: false, grade: null, position: null };
const TIMING_CYCLE_MS = 1800;

export default function useEnhancementSession({ playSfx, addLog }) {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancementPhase, setEnhancementPhase] = useState('idle');
  const [isStriking, setIsStriking] = useState(false);
  const [particles, setParticles] = useState([]);
  const [strikeTexts, setStrikeTexts] = useState([]);
  const [outcome, setOutcome] = useState(null);
  const [outcomeWeaponName, setOutcomeWeaponName] = useState('');
  const [bonusUpgradeNotice, setBonusUpgradeNotice] = useState('');
  const [previewWeaponState, setPreviewWeaponState] = useState(null);
  const [flashClass, setFlashClass] = useState('');
  const [timingWindow, setTimingWindow] = useState(INITIAL_TIMING_WINDOW);

  const timingStartedAtRef = useRef(0);
  const timingGradeRef = useRef('miss');

  const resetTimingChallenge = useCallback(() => {
    timingGradeRef.current = 'miss';
    timingStartedAtRef.current = 0;
    setTimingWindow(INITIAL_TIMING_WINDOW);
  }, []);

  const startTimingChallenge = useCallback(() => {
    timingStartedAtRef.current = Date.now();
    setTimingWindow({ active: true, grade: null, position: null });
  }, []);

  const finishTimingChallenge = useCallback(() => {
    setTimingWindow(current => ({
      ...current,
      active: false,
      grade: current.grade || 'miss',
    }));
    return timingGradeRef.current;
  }, []);

  const handleTimingHit = useCallback(() => {
    if (!timingWindow.active || !timingStartedAtRef.current) return;

    const cycleProgress = ((Date.now() - timingStartedAtRef.current) % TIMING_CYCLE_MS) / TIMING_CYCLE_MS;
    const position = cycleProgress <= 0.5 ? cycleProgress * 200 : (1 - cycleProgress) * 200;
    const distanceFromCenter = Math.abs(position - 50);
    const grade = distanceFromCenter <= 8 ? 'perfect' : distanceFromCenter <= 20 ? 'good' : 'miss';

    timingGradeRef.current = grade;
    setTimingWindow({ active: false, grade, position });
    playSfx(grade === 'perfect' ? 'success' : grade === 'good' ? 'page' : 'wrong');
    addLog(
      grade === 'perfect'
        ? `🎯 PERFECT! 기본 성공률에 +${TIMING_BONUS.perfect}%p가 더해집니다.`
        : grade === 'good'
          ? `👍 GOOD! 기본 성공률에 +${TIMING_BONUS.good}%p가 더해집니다.`
          : '타이밍 보너스 없이 기본 확률로 판정합니다.',
      grade === 'perfect' ? 'great-success' : grade === 'good' ? 'success' : 'info',
    );

    return grade;
  }, [addLog, playSfx, timingWindow.active]);

  const triggerFlash = useCallback((type) => {
    setFlashClass(`flash-${type}`);
    setTimeout(() => setFlashClass(''), 1000);
  }, []);

  const triggerStrike = useCallback((text = '깡!', particleCount = 15) => {
    playSfx('hammer');
    setIsStriking(true);
    setTimeout(() => setIsStriking(false), 150);

    const strikeId = `${Date.now()}-${Math.random()}`;
    const textX = 35 + Math.random() * 30;
    const textY = 25 + Math.random() * 20;
    setStrikeTexts(current => [
      ...current,
      { id: strikeId, text, x: `${textX}%`, top: `${textY}%` },
    ]);
    setTimeout(() => {
      setStrikeTexts(current => current.filter(item => item.id !== strikeId));
    }, 400);

    const newParticles = [];
    for (let i = 0; i < particleCount; i += 1) {
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
        type: 'spark',
      });
    }

    setParticles(current => [...current, ...newParticles]);
    setTimeout(() => {
      setParticles(current => current.filter(particle => !newParticles.includes(particle)));
    }, 600);
  }, [playSfx]);

  const scheduleStrike = useCallback((delay, text, particleCount) => {
    setTimeout(() => triggerStrike(text, particleCount), Math.max(0, delay));
  }, [triggerStrike]);

  const triggerSuccessParticles = useCallback(() => {
    const newParticles = [];
    for (let i = 0; i < 30; i += 1) {
      const dx = (Math.random() - 0.5) * 160;
      const dy = -80 - Math.random() * 120;
      newParticles.push({
        id: `${Date.now()}-success-${i}-${Math.random()}`,
        left: `${35 + Math.random() * 30}%`,
        top: '55%',
        dx: `${dx}px`,
        dy: `${dy}px`,
        type: 'spark',
      });
    }

    setParticles(current => [...current, ...newParticles]);
    setTimeout(() => {
      setParticles(current => current.filter(particle => !newParticles.includes(particle)));
    }, 600);
  }, []);

  const triggerGreatSuccessParticles = useCallback((intensity = 1) => {
    const newParticles = [];
    const sparkCount = Math.round(42 * intensity);
    const rayCount = Math.round(12 * intensity);

    for (let i = 0; i < sparkCount; i += 1) {
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
        type: 'bonus-spark',
      });
    }

    for (let i = 0; i < rayCount; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 110 + Math.random() * 120;
      newParticles.push({
        id: `${Date.now()}-great-ray-${i}-${Math.random()}`,
        left: '50%',
        top: '50%',
        dx: `${Math.cos(angle) * distance}px`,
        dy: `${Math.sin(angle) * distance}px`,
        rotate: `${angle}rad`,
        type: 'bonus-ray',
      });
    }

    setParticles(current => [...current, ...newParticles]);
    setTimeout(() => {
      setParticles(current => current.filter(particle => !newParticles.includes(particle)));
    }, 1400);
  }, []);

  const triggerFailParticles = useCallback(() => {
    const newParticles = [];
    for (let i = 0; i < 20; i += 1) {
      const dx = (Math.random() - 0.5) * 100;
      const dy = -50 - Math.random() * 60;
      newParticles.push({
        id: `${Date.now()}-fail-${i}-${Math.random()}`,
        left: `${40 + Math.random() * 20}%`,
        top: '50%',
        dx: `${dx}px`,
        dy: `${dy}px`,
        type: 'smoke',
      });
    }

    setParticles(current => [...current, ...newParticles]);
    setTimeout(() => {
      setParticles(current => current.filter(particle => !newParticles.includes(particle)));
    }, 1000);
  }, []);

  return {
    isEnhancing,
    setIsEnhancing,
    enhancementPhase,
    setEnhancementPhase,
    isStriking,
    particles,
    strikeTexts,
    outcome,
    setOutcome,
    outcomeWeaponName,
    setOutcomeWeaponName,
    bonusUpgradeNotice,
    setBonusUpgradeNotice,
    previewWeaponState,
    setPreviewWeaponState,
    flashClass,
    timingWindow,
    resetTimingChallenge,
    startTimingChallenge,
    finishTimingChallenge,
    handleTimingHit,
    triggerFlash,
    triggerStrike,
    scheduleStrike,
    triggerSuccessParticles,
    triggerGreatSuccessParticles,
    triggerFailParticles,
  };
}
