export interface RecipeStep {
  label: string;
  amount: number;
}

export interface Recipe {
  id: number;
  bean_name: string;
  roastery: string;
  blend_type: 'seasonal' | 'signature' | 'other';
  is_default: number;

  hot_dose_min: number | null;
  hot_dose_max: number | null;
  hot_temp_min: number | null;
  hot_temp_max: number | null;
  hot_method: 'x3rule' | 'manual';
  hot_steps: string | null; // JSON string of RecipeStep[]
  hot_water_add_min: number | null;
  hot_water_add_max: number | null;
  hot_stir_steps: string | null; // JSON string of string[] (step indices)

  iced_dose_min: number | null;
  iced_dose_max: number | null;
  iced_temp_min: number | null;
  iced_temp_max: number | null;
  iced_method: 'x3rule' | 'manual';
  iced_steps: string | null;
  iced_water_add_min: number | null;
  iced_water_add_max: number | null;
  iced_stir_steps: string | null;

  created_at: string;
  updated_at: string;
}

export interface TimerStepData {
  label: string;
  duration: number; // seconds
}

export interface BrewRecord {
  id: number;
  recipe_id: number;
  brew_type: 'hot' | 'iced';
  brew_date: string;
  dose: number | null;
  water_temp: number | null;
  steps: string | null; // JSON string of RecipeStep[]
  total_amount: number | null;
  rating: number | null;
  notes: string | null;
  timer_data: string | null; // JSON string of TimerStepData[]
  total_brew_time: number | null; // seconds
  created_at: string;
  // joined fields
  bean_name?: string;
  roastery?: string;
}

export function parseTimerData(json: string | null): TimerStepData[] {
  if (!json) return [];
  try { return JSON.parse(json); } catch { return []; }
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function getX3RuleSteps(dose: number): RecipeStep[] {
  return [
    { label: '블루밍·교반', amount: dose * 3 },
    { label: '추출1', amount: dose * 6 },
    { label: '추출2', amount: dose * 9 },
    { label: '추출3', amount: dose * 12 },
    { label: '추출4', amount: dose * 15 },
  ];
}

export function parseSteps(stepsJson: string | null): RecipeStep[] {
  if (!stepsJson) return [];
  try {
    return JSON.parse(stepsJson);
  } catch {
    return [];
  }
}

export function parseStirSteps(stirJson: string | null): string[] {
  if (!stirJson) return [];
  try {
    return JSON.parse(stirJson);
  } catch {
    return [];
  }
}

export const BLEND_TYPE_LABELS: Record<string, string> = {
  seasonal: '시즈널',
  signature: '시그니처',
  other: '기타',
};
