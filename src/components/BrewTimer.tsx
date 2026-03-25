'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { RecipeStep, TimerStepData, formatTime } from '@/lib/types';

interface Props {
  steps: RecipeStep[];
  onComplete: (timerData: TimerStepData[], totalTime: number) => void;
  onCancel: () => void;
}

export default function BrewTimer({ steps, onComplete, onCancel }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [stepTimes, setStepTimes] = useState<number[]>(steps.map(() => 0));
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsed(e => e + 1);
        setTotalElapsed(t => t + 1);
      }, 1000);
    } else {
      stopInterval();
    }
    return stopInterval;
  }, [isRunning, stopInterval]);

  const handleStart = () => setIsRunning(true);

  const handleNextStep = () => {
    const newTimes = [...stepTimes];
    newTimes[currentStep] = elapsed;
    setStepTimes(newTimes);
    setElapsed(0);

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsRunning(false);
      setFinished(true);
      const timerData: TimerStepData[] = steps.map((s, i) => ({
        label: s.label,
        duration: i === currentStep ? elapsed : newTimes[i],
      }));
      onComplete(timerData, totalElapsed);
    }
  };

  const handlePause = () => setIsRunning(!isRunning);

  const handleStop = () => {
    setIsRunning(false);
    const newTimes = [...stepTimes];
    newTimes[currentStep] = elapsed;
    setStepTimes(newTimes);
    setFinished(true);
    const timerData: TimerStepData[] = steps.map((s, i) => ({
      label: s.label,
      duration: newTimes[i],
    }));
    onComplete(timerData, totalElapsed);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-warm-800 text-sm">추출 타이머</h3>
        <button onClick={onCancel} className="text-gray-400 text-xs">닫기</button>
      </div>

      {/* Total time */}
      <div className="text-center">
        <div className="text-3xl font-bold text-warm-700 font-mono">
          {formatTime(isRunning || finished ? totalElapsed : 0)}
        </div>
        <p className="text-xs text-gray-400 mt-1">총 추출 시간</p>
      </div>

      {/* Steps progress */}
      <div className="space-y-2">
        {steps.map((step, i) => {
          const isCurrent = i === currentStep && !finished;
          const isDone = i < currentStep || finished;
          return (
            <div
              key={i}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                isCurrent ? 'bg-warm-100 border border-warm-400' :
                isDone ? 'bg-green-50 border border-green-200' :
                'bg-gray-50 border border-gray-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  isDone ? 'bg-green-500 text-white' :
                  isCurrent ? 'bg-warm-500 text-white' :
                  'bg-gray-300 text-white'
                }`}>
                  {isDone ? '✓' : i + 1}
                </span>
                <span className={`font-medium ${isCurrent ? 'text-warm-800' : isDone ? 'text-green-700' : 'text-gray-500'}`}>
                  {step.label}
                </span>
              </div>
              <span className="font-mono text-xs">
                {isCurrent ? formatTime(elapsed) : isDone ? formatTime(stepTimes[i]) : '--:--'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      {!finished && (
        <div className="flex gap-2">
          {!isRunning && currentStep === 0 && elapsed === 0 ? (
            <button
              onClick={handleStart}
              className="flex-1 py-2.5 bg-green-500 text-white rounded-xl font-semibold text-sm hover:bg-green-600 transition-colors"
            >
              ▶ 시작
            </button>
          ) : (
            <>
              <button
                onClick={handlePause}
                className="flex-1 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-300 transition-colors"
              >
                {isRunning ? '⏸ 일시정지' : '▶ 재개'}
              </button>
              <button
                onClick={handleNextStep}
                disabled={!isRunning}
                className="flex-1 py-2.5 bg-warm-600 text-white rounded-xl font-semibold text-sm hover:bg-warm-700 disabled:opacity-50 transition-colors"
              >
                {currentStep < steps.length - 1 ? '다음 단계 →' : '✓ 완료'}
              </button>
              <button
                onClick={handleStop}
                className="py-2.5 px-3 bg-red-500 text-white rounded-xl font-semibold text-sm hover:bg-red-600 transition-colors"
              >
                ■
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
