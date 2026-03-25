'use client';

import { useState } from 'react';
import { Recipe, RecipeStep } from '@/lib/types';

interface Props {
  recipe: Recipe | null;
  onSaved: () => void;
  onCancel: () => void;
}

interface ModeConfig {
  doseMin: string;
  doseMax: string;
  tempMin: string;
  tempMax: string;
  method: 'x3rule' | 'manual';
  steps: RecipeStep[];
  waterAddMin: string;
  waterAddMax: string;
  stirSteps: Set<number>;
}

function defaultModeConfig(): ModeConfig {
  return {
    doseMin: '', doseMax: '', tempMin: '', tempMax: '',
    method: 'manual',
    steps: [{ label: '블루밍·교반', amount: 0 }],
    waterAddMin: '', waterAddMax: '',
    stirSteps: new Set([0]),
  };
}

function recipeToModeConfig(recipe: Recipe, mode: 'hot' | 'iced'): ModeConfig {
  const prefix = mode;
  const r = recipe as unknown as Record<string, unknown>;
  const stepsRaw = r[`${prefix}_steps`] as string | null;
  let steps: RecipeStep[] = [];
  try { if (stepsRaw) steps = JSON.parse(stepsRaw); } catch { /* empty */ }
  if (steps.length === 0) steps = [{ label: '블루밍·교반', amount: 0 }];

  const stirRaw = r[`${prefix}_stir_steps`] as string | null;
  let stirArr: string[] = [];
  try { if (stirRaw) stirArr = JSON.parse(stirRaw); } catch { /* empty */ }

  return {
    doseMin: String(r[`${prefix}_dose_min`] ?? ''),
    doseMax: String(r[`${prefix}_dose_max`] ?? ''),
    tempMin: String(r[`${prefix}_temp_min`] ?? ''),
    tempMax: String(r[`${prefix}_temp_max`] ?? ''),
    method: (r[`${prefix}_method`] as 'x3rule' | 'manual') || 'manual',
    steps,
    waterAddMin: String(r[`${prefix}_water_add_min`] ?? ''),
    waterAddMax: String(r[`${prefix}_water_add_max`] ?? ''),
    stirSteps: new Set(stirArr.map(Number)),
  };
}

export default function RecipeForm({ recipe, onSaved, onCancel }: Props) {
  const [beanName, setBeanName] = useState(recipe?.bean_name ?? '');
  const [roastery, setRoastery] = useState(recipe?.roastery ?? '');
  const [blendType, setBlendType] = useState(recipe?.blend_type ?? 'other');
  const [hot, setHot] = useState<ModeConfig>(recipe ? recipeToModeConfig(recipe, 'hot') : defaultModeConfig());
  const [iced, setIced] = useState<ModeConfig>(recipe ? recipeToModeConfig(recipe, 'iced') : defaultModeConfig());
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!beanName.trim() || !roastery.trim()) return;
    setSaving(true);

    const buildPayload = (cfg: ModeConfig, prefix: string) => ({
      [`${prefix}_dose_min`]: cfg.doseMin ? Number(cfg.doseMin) : null,
      [`${prefix}_dose_max`]: cfg.doseMax ? Number(cfg.doseMax) : null,
      [`${prefix}_temp_min`]: cfg.tempMin ? Number(cfg.tempMin) : null,
      [`${prefix}_temp_max`]: cfg.tempMax ? Number(cfg.tempMax) : null,
      [`${prefix}_method`]: cfg.method,
      [`${prefix}_steps`]: cfg.method === 'manual' ? JSON.stringify(cfg.steps) : null,
      [`${prefix}_water_add_min`]: cfg.waterAddMin ? Number(cfg.waterAddMin) : null,
      [`${prefix}_water_add_max`]: cfg.waterAddMax ? Number(cfg.waterAddMax) : null,
      [`${prefix}_stir_steps`]: JSON.stringify(Array.from(cfg.stirSteps).map(String)),
    });

    const body = {
      bean_name: beanName.trim(),
      roastery: roastery.trim(),
      blend_type: blendType,
      ...buildPayload(hot, 'hot'),
      ...buildPayload(iced, 'iced'),
    };

    const url = recipe ? `/api/recipes/${recipe.id}` : '/api/recipes';
    const method = recipe ? 'PUT' : 'POST';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setSaving(false);
    onSaved();
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-warm-800">{recipe ? '레시피 수정' : '레시피 추가'}</h2>
        <button onClick={onCancel} className="text-gray-500 text-sm">취소</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="원두명" value={beanName} onChange={setBeanName} required />
        <Input label="로스터리명" value={roastery} onChange={setRoastery} required />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">블랜드 종류</label>
          <div className="flex gap-2">
            {(['seasonal', 'signature', 'other'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setBlendType(t)}
                className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${
                  blendType === t ? 'bg-warm-600 text-white border-warm-600' : 'bg-white text-gray-600 border-gray-300'
                }`}
              >
                {t === 'seasonal' ? '시즈널' : t === 'signature' ? '시그니처' : '기타'}
              </button>
            ))}
          </div>
        </div>

        <ModeSection title="🔥 Hot 설정" config={hot} onChange={setHot} />
        <ModeSection title="🧊 Iced 설정" config={iced} onChange={setIced} />

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-warm-600 text-white rounded-xl font-semibold hover:bg-warm-700 disabled:opacity-50 transition-colors"
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </form>
    </div>
  );
}

function ModeSection({ title, config, onChange }: { title: string; config: ModeConfig; onChange: (c: ModeConfig) => void }) {
  const updateStep = (idx: number, field: keyof RecipeStep, value: string) => {
    const newSteps = [...config.steps];
    if (field === 'amount') {
      newSteps[idx] = { ...newSteps[idx], amount: Number(value) || 0 };
    } else {
      newSteps[idx] = { ...newSteps[idx], [field]: value };
    }
    onChange({ ...config, steps: newSteps });
  };

  const addStep = () => {
    onChange({ ...config, steps: [...config.steps, { label: `추출${config.steps.length}`, amount: 0 }] });
  };

  const removeStep = (idx: number) => {
    if (config.steps.length <= 1) return;
    const newSteps = config.steps.filter((_, i) => i !== idx);
    const newStir = new Set<number>();
    config.stirSteps.forEach(s => {
      if (s < idx) newStir.add(s);
      else if (s > idx) newStir.add(s - 1);
    });
    onChange({ ...config, steps: newSteps, stirSteps: newStir });
  };

  const toggleStir = (idx: number) => {
    const newSet = new Set(config.stirSteps);
    if (newSet.has(idx)) newSet.delete(idx);
    else newSet.add(idx);
    onChange({ ...config, stirSteps: newSet });
  };

  return (
    <div className="border border-gray-200 rounded-xl p-3 space-y-3">
      <h3 className="font-semibold text-sm text-warm-700">{title}</h3>

      <div className="grid grid-cols-2 gap-2">
        <Input label="원두량 최소(g)" value={config.doseMin} onChange={v => onChange({ ...config, doseMin: v })} type="number" />
        <Input label="원두량 최대(g)" value={config.doseMax} onChange={v => onChange({ ...config, doseMax: v })} type="number" />
        <Input label="온도 최소(°C)" value={config.tempMin} onChange={v => onChange({ ...config, tempMin: v })} type="number" />
        <Input label="온도 최대(°C)" value={config.tempMax} onChange={v => onChange({ ...config, tempMax: v })} type="number" />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">추출 방식</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChange({ ...config, method: 'x3rule' })}
            className={`flex-1 py-1.5 text-xs rounded-lg border ${
              config.method === 'x3rule' ? 'bg-warm-600 text-white border-warm-600' : 'bg-white text-gray-600 border-gray-300'
            }`}
          >
            ×3 룰 자동
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...config, method: 'manual' })}
            className={`flex-1 py-1.5 text-xs rounded-lg border ${
              config.method === 'manual' ? 'bg-warm-600 text-white border-warm-600' : 'bg-white text-gray-600 border-gray-300'
            }`}
          >
            직접 입력
          </button>
        </div>
      </div>

      {config.method === 'manual' && (
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-600">단계별 추출량</label>
          {config.steps.map((step, i) => (
            <div key={i} className="flex items-center gap-1">
              <input
                type="text"
                value={step.label}
                onChange={e => updateStep(i, 'label', e.target.value)}
                className="flex-1 min-w-0 text-xs border border-gray-200 rounded-lg px-2 py-1.5"
                placeholder="단계명"
              />
              <input
                type="number"
                value={step.amount || ''}
                onChange={e => updateStep(i, 'amount', e.target.value)}
                className="w-16 text-xs border border-gray-200 rounded-lg px-2 py-1.5"
                placeholder="g"
              />
              <label className="flex items-center gap-0.5 text-[10px] text-green-600 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={config.stirSteps.has(i)}
                  onChange={() => toggleStir(i)}
                  className="w-3 h-3"
                />
                교반
              </label>
              {config.steps.length > 1 && (
                <button type="button" onClick={() => removeStep(i)} className="text-red-400 text-xs px-1">✕</button>
              )}
            </div>
          ))}
          <button type="button" onClick={addStep} className="text-xs text-warm-600 font-medium">+ 단계 추가</button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Input label="물 추가 최소(g)" value={config.waterAddMin} onChange={v => onChange({ ...config, waterAddMin: v })} type="number" />
        <Input label="물 추가 최대(g)" value={config.waterAddMax} onChange={v => onChange({ ...config, waterAddMax: v })} type="number" />
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text', required = false }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-0.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-warm-400"
      />
    </div>
  );
}
