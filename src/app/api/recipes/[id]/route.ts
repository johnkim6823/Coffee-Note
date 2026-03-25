import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(id);
  if (!recipe) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(recipe);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const db = getDb();

  const existing = db.prepare('SELECT * FROM recipes WHERE id = ?').get(id) as { is_default: number } | undefined;
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  db.prepare(`
    UPDATE recipes SET
      bean_name = @bean_name, roastery = @roastery, blend_type = @blend_type,
      hot_dose_min = @hot_dose_min, hot_dose_max = @hot_dose_max,
      hot_temp_min = @hot_temp_min, hot_temp_max = @hot_temp_max,
      hot_method = @hot_method, hot_steps = @hot_steps,
      hot_water_add_min = @hot_water_add_min, hot_water_add_max = @hot_water_add_max,
      hot_stir_steps = @hot_stir_steps,
      iced_dose_min = @iced_dose_min, iced_dose_max = @iced_dose_max,
      iced_temp_min = @iced_temp_min, iced_temp_max = @iced_temp_max,
      iced_method = @iced_method, iced_steps = @iced_steps,
      iced_water_add_min = @iced_water_add_min, iced_water_add_max = @iced_water_add_max,
      iced_stir_steps = @iced_stir_steps,
      updated_at = datetime('now')
    WHERE id = @id
  `).run({
    id,
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

  const updated = db.prepare('SELECT * FROM recipes WHERE id = ?').get(id);
  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();

  const existing = db.prepare('SELECT * FROM recipes WHERE id = ?').get(id) as { is_default: number } | undefined;
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (existing.is_default) return NextResponse.json({ error: 'Cannot delete default recipe' }, { status: 403 });

  db.prepare('DELETE FROM recipes WHERE id = ?').run(id);
  return NextResponse.json({ success: true });
}
