'use client';

import { useState, useEffect, useCallback } from 'react';
import { Recipe, RecipeStep, TimerStepData, parseSteps, parseStirSteps, getX3RuleSteps, formatTime } from '@/lib/types';
import BrewTimer from './BrewTimer';

interface Props {
  selectedRecipeId: number | null;
  onSaved: () => void;
}

export default function RecordTab({ selectedRecipeId, onSaved }: Props) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recipeId, setRecipeId] = useState<number | null>(selectedRecipeId);
  const [brewType, setBrewType] = useState<'hot' | 'iced'>('hot');
  const [brewDate, setBrewDate] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  });
  const [dose, setDose] = useState('');
  const [waterTemp, setWaterTemp] = useState('');
  const [actualSteps, setActualSteps] = useState<RecipeStep[]>([]);
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [timerData, setTimerData] = useState<TimerStepData[] | null>(null);
  const [totalBrewTime, setTotalBrewTime] = useState<number | null>(null);

  const fetchRecipes = useCallback(async () => {
    const res = await fetch('/api/recipes');
    const data = await res.json();
    setRecipes(data);
  }, []);

  useEffect(() => { fetchRecipes(); }, [fetchRecipes]);

  useEffect(() => {
    if (selectedRecipeId) setRecipeId(selectedRecipeId);
  }, [selectedRecipeId]);

  const selectedRecipe = recipes.find(r => r.id === recipeId) ?? null;

  // Get reference steps from recipe
  const getReferenceSteps = useCallback((): RecipeStep[] => {
    if (!selectedRecipe) return [];
    const isHot = brewType === 'hot';
    const method = isHot ? selectedRecipe.hot_method : selectedRecipe.iced_method;
    const stepsJson = isHot ? selectedRecipe.hot_steps : selectedRecipe.iced_steps;
    const doseMin = isHot ? selectedRecipe.hot_dose_min : selectedRecipe.iced_dose_min;

    if (method === 'x3rule' && doseMin) {
      return getX3RuleSteps(doseMin);
    }
    return parseSteps(stepsJson);
  }, [selectedRecipe, brewType]);

  // Update actual steps when recipe/brew type changes
  useEffect(() => {
    const refSteps = getReferenceSteps();
    setActualSteps(refSteps.map(s => ({ ...s, amount: 0 })));
  }, [getReferenceSteps]);

  // Get placeholders
  const getPlaceholders = () => {
    if (!selectedRecipe) return { dose: '', temp: '' };
    const isHot = brewType === 'hot';
    const doseMin = isHot ? selectedRecipe.hot_dose_min : selectedRecipe.iced_dose_min;
    const doseMax = isHot ? selectedRecipe.hot_dose_max : selectedRecipe.iced_dose_max;
    const tempMin = isHot ? selectedRecipe.hot_temp_min : selectedRecipe.iced_temp_min;
    const tempMax = isHot ? selectedRecipe.hot_temp_max : selectedRecipe.iced_temp_max;
    return {
      dose: doseMin === doseMax || !doseMax ? `${doseMin}g` : `${doseMin}~${doseMax}g`,
      temp: tempMin === tempMax || !tempMax ? `${tempMin}°C` : `${tempMin}~${tempMax}°C`,
    };
  };

  const placeholders = getPlaceholders();
  const refSteps = getReferenceSteps();
  const stirSteps = selectedRecipe
    ? parseStirSteps(brewType === 'hot' ? selectedRecipe.hot_stir_steps : selectedRecipe.iced_stir_steps)
    : [];

  const totalAmount = actualSteps.reduce((sum, s) => sum + (s.amount || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipeId) return;
    setSaving(true);

    await fetch('/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipe_id: recipeId,
        brew_type: brewType,
        brew_date: brewDate,
        dose: dose ? Number(dose) : null,
        water_temp: waterTemp ? Number(waterTemp) : null,
        steps: JSON.stringify(actualSteps),
        total_amount: totalAmount || null,
        rating: rating || null,
        notes: notes || null,
        timer_data: timerData ? JSON.stringify(timerData) : null,
        total_brew_time: totalBrewTime || null,
      }),
    });

    setSaving(false);
    // Reset form
    setDose('');
    setWaterTemp('');
    setActualSteps([]);
    setRating(0);
    setNotes('');
    setTimerData(null);
    setTotalBrewTime(null);
    setShowTimer(false);
    onSaved();
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold text-warm-800 mb-4">기록하기</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Recipe selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">원두 선택</label>
          <select
            value={recipeId ?? ''}
            onChange={e => setRecipeId(e.target.value ? Number(e.target.value) : null)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-warm-400"
            required
          >
            <option value="">선택해주세요</option>
            {recipes.map(r => (
              <option key={r.id} value={r.id}>{r.bean_name} ({r.roastery})</option>
            ))}
          </select>
        </div>

        {/* Hot / Iced */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setBrewType('hot')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              brewType === 'hot' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-500'
            }`}
          >
            🔥 Hot
          </button>
          <button
            type="button"
            onClick={() => setBrewType('iced')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              brewType === 'iced' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'
            }`}
          >
            🧊 Iced
          </button>
        </div>

        {/* Date/Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">날짜·시간</label>
          <input
            type="datetime-local"
            value={brewDate}
            onChange={e => setBrewDate(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-warm-400"
          />
        </div>

        {/* Dose & Temp */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">원두량 (g)</label>
            <input
              type="number"
              step="0.1"
              value={dose}
              onChange={e => setDose(e.target.value)}
              placeholder={placeholders.dose}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-warm-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">물 온도 (°C)</label>
            <input
              type="number"
              step="0.1"
              value={waterTemp}
              onChange={e => setWaterTemp(e.target.value)}
              placeholder={placeholders.temp}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-warm-400"
            />
          </div>
        </div>

        {/* Steps */}
        {refSteps.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">단계별 추출량</label>
            <div className="space-y-2">
              {actualSteps.map((step, i) => {
                const isStir = stirSteps.includes(String(i));
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-md min-w-[80px] text-center font-medium ${
                      isStir ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {step.label}
                      {isStir && ' 🔄'}
                    </span>
                    <input
                      type="number"
                      step="0.1"
                      value={step.amount || ''}
                      onChange={e => {
                        const newSteps = [...actualSteps];
                        newSteps[i] = { ...newSteps[i], amount: Number(e.target.value) || 0 };
                        setActualSteps(newSteps);
                      }}
                      placeholder={`${refSteps[i]?.amount ?? 0}g`}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-warm-400"
                    />
                    <span className="text-[10px] text-gray-400 min-w-[36px]">
                      기준 {refSteps[i]?.amount}g
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 text-right text-sm font-semibold text-warm-700">
              총 추출량: {totalAmount}g
            </div>
          </div>
        )}

        {/* Timer */}
        {refSteps.length > 0 && (
          <div>
            {showTimer ? (
              <BrewTimer
                steps={refSteps}
                onComplete={(data, total) => {
                  setTimerData(data);
                  setTotalBrewTime(total);
                  setShowTimer(false);
                }}
                onCancel={() => setShowTimer(false)}
              />
            ) : (
              <button
                type="button"
                onClick={() => setShowTimer(true)}
                className="w-full py-2 border-2 border-dashed border-warm-300 text-warm-600 rounded-xl text-sm font-medium hover:bg-warm-50 transition-colors"
              >
                {timerData ? `✓ 추출 시간 기록됨 (${formatTime(totalBrewTime ?? 0)})` : '⏱ 타이머 사용하기'}
              </button>
            )}
          </div>
        )}

        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">별점</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`text-2xl transition-colors ${
                  star <= rating ? 'text-amber-400' : 'text-gray-300'
                }`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">후기</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="맛, 향, 농도, 특이사항 등을 자유롭게 기록하세요"
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-warm-400 resize-none"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={saving || !recipeId}
          className="w-full py-3 bg-warm-600 text-white rounded-xl font-semibold hover:bg-warm-700 disabled:opacity-50 transition-colors"
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </form>
    </div>
  );
}
