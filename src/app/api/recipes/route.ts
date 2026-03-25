import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET() {
  const db = getDb();
  const recipes = db.prepare('SELECT * FROM recipes ORDER BY blend_type, bean_name').all();
  return NextResponse.json(recipes);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const db = getDb();

  const result = db.prepare(`
    INSERT INTO recipes (
      bean_name, roastery, blend_type, is_default,
      hot_dose_min, hot_dose_max, hot_temp_min, hot_temp_max, hot_method, hot_steps, hot_water_add_min, hot_water_add_max, hot_stir_steps,
      iced_dose_min, iced_dose_max, iced_temp_min, iced_temp_max, iced_method, iced_steps, iced_water_add_min, iced_water_add_max, iced_stir_steps
    ) VALUES (
      @bean_name, @roastery, @blend_type, 0,
      @hot_dose_min, @hot_dose_max, @hot_temp_min, @hot_temp_max, @hot_method, @hot_steps, @hot_water_add_min, @hot_water_add_max, @hot_stir_steps,
      @iced_dose_min, @iced_dose_max, @iced_temp_min, @iced_temp_max, @iced_method, @iced_steps, @iced_water_add_min, @iced_water_add_max, @iced_stir_steps
    )
  `).run({
    bean_name: body.bean_name,
    roastery: body.roastery,
    blend_type: body.blend_type,
    hot_dose_min: body.hot_dose_min ?? null,
    hot_dose_max: body.hot_dose_max ?? null,
    hot_temp_min: body.hot_temp_min ?? null,
    hot_temp_max: body.hot_temp_max ?? null,
    hot_method: body.hot_method ?? 'manual',
    hot_steps: body.hot_steps ?? null,
    hot_water_add_min: body.hot_water_add_min ?? null,
    hot_water_add_max: body.hot_water_add_max ?? null,
    hot_stir_steps: body.hot_stir_steps ?? null,
    iced_dose_min: body.iced_dose_min ?? null,
    iced_dose_max: body.iced_dose_max ?? null,
    iced_temp_min: body.iced_temp_min ?? null,
    iced_temp_max: body.iced_temp_max ?? null,
    iced_method: body.iced_method ?? 'manual',
    iced_steps: body.iced_steps ?? null,
    iced_water_add_min: body.iced_water_add_min ?? null,
    iced_water_add_max: body.iced_water_add_max ?? null,
    iced_stir_steps: body.iced_stir_steps ?? null,
  });

  const newRecipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(result.lastInsertRowid);
  return NextResponse.json(newRecipe, { status: 201 });
}
