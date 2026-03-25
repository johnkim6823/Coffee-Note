'use client';

import { useState, useEffect, useCallback } from 'react';
import { Recipe, RecipeStep, parseSteps, parseStirSteps, getX3RuleSteps, BLEND_TYPE_LABELS } from '@/lib/types';
import RecipeForm from './RecipeForm';

interface Props {
  onStartRecord: (recipeId: number) => void;
}

export default function RecipesTab({ onStartRecord }: Props) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

  const fetchRecipes = useCallback(async () => {
    const res = await fetch('/api/recipes');
    const data = await res.json();
    setRecipes(data);
  }, []);

  useEffect(() => { fetchRecipes(); }, [fetchRecipes]);

  const handleDelete = async (id: number) => {
    if (!confirm('이 레시피를 삭제하시겠습니까?')) return;
    await fetch(`/api/recipes/${id}`, { method: 'DELETE' });
    fetchRecipes();
  };

  const handleSaved = () => {
    setShowForm(false);
    setEditingRecipe(null);
    fetchRecipes();
  };

  if (showForm || editingRecipe) {
    return (
      <RecipeForm
        recipe={editingRecipe}
        onSaved={handleSaved}
        onCancel={() => { setShowForm(false); setEditingRecipe(null); }}
      />
    );
  }

  // Group by blend_type
  const grouped: Record<string, Recipe[]> = {};
  recipes.forEach(r => {
    const key = r.blend_type;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(r);
  });

  const sectionOrder = ['seasonal', 'signature', 'other'];

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-warm-800">레시피 목록</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-warm-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-warm-700 transition-colors"
        >
          + 레시피 추가
        </button>
      </div>

      {sectionOrder.map(type => {
        const items = grouped[type];
        if (!items || items.length === 0) return null;
        return (
          <div key={type} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                type === 'seasonal' ? 'bg-amber-200 text-amber-800' :
                type === 'signature' ? 'bg-warm-200 text-warm-800' :
                'bg-gray-200 text-gray-700'
              }`}>
                {BLEND_TYPE_LABELS[type]}
              </span>
              {items[0]?.roastery && (
                <span className="text-xs text-gray-500">{items[0].roastery}</span>
              )}
            </div>
            <div className="space-y-3">
              {items.map(recipe => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onStartRecord={() => onStartRecord(recipe.id)}
                  onEdit={() => setEditingRecipe(recipe)}
                  onDelete={() => handleDelete(recipe.id)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RecipeCard({
  recipe,
  onStartRecord,
  onEdit,
  onDelete,
}: {
  recipe: Recipe;
  onStartRecord: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [mode, setMode] = useState<'hot' | 'iced'>('hot');

  const isHot = mode === 'hot';
  const method = isHot ? recipe.hot_method : recipe.iced_method;
  const doseMin = isHot ? recipe.hot_dose_min : recipe.iced_dose_min;
  const doseMax = isHot ? recipe.hot_dose_max : recipe.iced_dose_max;
  const tempMin = isHot ? recipe.hot_temp_min : recipe.iced_temp_min;
  const tempMax = isHot ? recipe.hot_temp_max : recipe.iced_temp_max;
  const stepsJson = isHot ? recipe.hot_steps : recipe.iced_steps;
  const waterAddMin = isHot ? recipe.hot_water_add_min : recipe.iced_water_add_min;
  const waterAddMax = isHot ? recipe.hot_water_add_max : recipe.iced_water_add_max;
  const stirStepsJson = isHot ? recipe.hot_stir_steps : recipe.iced_stir_steps;

  const stirSteps = parseStirSteps(stirStepsJson);

  let steps: RecipeStep[];
  if (method === 'x3rule' && doseMin) {
    const avgDose = doseMax ? (doseMin + doseMax) / 2 : doseMin;
    steps = getX3RuleSteps(avgDose);
  } else {
    steps = parseSteps(stepsJson);
  }

  const doseText = doseMin === doseMax || !doseMax ? `${doseMin}g` : `${doseMin}~${doseMax}g`;
  const tempText = tempMin === tempMax || !tempMax ? `${tempMin}°C` : `${tempMin}~${tempMax}°C`;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {recipe.is_default ? (
              <span className="text-gray-400 text-sm" title="기본 제공 레시피">🔒</span>
            ) : null}
            <h3 className="font-bold text-warm-800">{recipe.bean_name}</h3>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
              recipe.blend_type === 'seasonal' ? 'bg-amber-100 text-amber-700' :
              recipe.blend_type === 'signature' ? 'bg-warm-100 text-warm-600' :
              'bg-gray-100 text-gray-600'
            }`}>
              {BLEND_TYPE_LABELS[recipe.blend_type]}
            </span>
          </div>
          {!recipe.is_default && (
            <div className="flex gap-1">
              <button onClick={onEdit} className="text-gray-400 hover:text-warm-600 p-1 text-sm">✎</button>
              <button onClick={onDelete} className="text-gray-400 hover:text-red-500 p-1 text-sm">✕</button>
            </div>
          )}
        </div>

        {/* Hot / Iced toggle */}
        <div className="flex gap-1 mb-3">
          <button
            onClick={() => setMode('hot')}
            className={`flex-1 py-1 text-xs font-medium rounded-lg transition-colors ${
              isHot ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-500'
            }`}
          >
            🔥 Hot
          </button>
          <button
            onClick={() => setMode('iced')}
            className={`flex-1 py-1 text-xs font-medium rounded-lg transition-colors ${
              !isHot ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'
            }`}
          >
            🧊 Iced
          </button>
        </div>

        {/* Details */}
        <div className="space-y-1.5 text-sm">
          <div className="flex gap-4">
            <span className="text-gray-500">원두량</span>
            <span className="font-medium">{doseText}</span>
          </div>
          <div className="flex gap-4">
            <span className="text-gray-500">물 온도</span>
            <span className="font-medium">{tempText}</span>
          </div>

          {/* Steps */}
          {steps.length > 0 && (
            <div className="mt-2 space-y-1">
              {steps.map((step, i) => {
                const isStir = stirSteps.includes(String(i));
                const isFinal = step.label.includes('최종') || step.label.includes('추출4');
                return (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className={`inline-block px-2 py-0.5 rounded-md font-medium ${
                      isStir ? 'bg-green-100 text-green-700' :
                      isFinal ? 'bg-yellow-100 text-yellow-600' :
                      'bg-gray-50 text-gray-600'
                    }`}>
                      {step.label}
                      {isStir && ' 🔄'}
                    </span>
                    <span className={`font-semibold ${isFinal ? 'text-yellow-600' : ''}`}>
                      {step.amount}g
                    </span>
                  </div>
                );
              })}
              {waterAddMin && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="inline-block px-2 py-0.5 rounded-md font-medium bg-blue-50 text-blue-600">
                    물 추가
                  </span>
                  <span className="font-semibold">
                    {waterAddMin === waterAddMax || !waterAddMax ? `${waterAddMin}g` : `${waterAddMin}~${waterAddMax}g`}
                  </span>
                </div>
              )}
              {!isHot && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="inline-block px-2 py-0.5 rounded-md font-medium bg-blue-100 text-blue-600">
                    칠링
                  </span>
                </div>
              )}
            </div>
          )}

          {method === 'x3rule' && (
            <p className="text-[10px] text-gray-400 mt-1">* ×3 룰 자동 계산 기준값</p>
          )}
        </div>
      </div>

      {/* Action */}
      <button
        onClick={onStartRecord}
        className="w-full py-2.5 bg-warm-600 text-white text-sm font-medium hover:bg-warm-700 transition-colors"
      >
        기록 시작 →
      </button>
    </div>
  );
}
