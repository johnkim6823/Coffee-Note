import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const beanName = searchParams.get('bean_name');
  const brewType = searchParams.get('brew_type');

  const db = getDb();
  let query = `
    SELECT records.*, recipes.bean_name, recipes.roastery
    FROM records
    JOIN recipes ON records.recipe_id = recipes.id
    WHERE 1=1
  `;
  const queryParams: Record<string, string> = {};

  if (beanName) {
    query += ' AND recipes.bean_name = @bean_name';
    queryParams.bean_name = beanName;
  }
  if (brewType) {
    query += ' AND records.brew_type = @brew_type';
    queryParams.brew_type = brewType;
  }

  query += ' ORDER BY records.brew_date DESC, records.created_at DESC';

  const records = db.prepare(query).all(queryParams);
  return NextResponse.json(records);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const db = getDb();

  const result = db.prepare(`
    INSERT INTO records (recipe_id, brew_type, brew_date, dose, water_temp, steps, total_amount, rating, notes)
    VALUES (@recipe_id, @brew_type, @brew_date, @dose, @water_temp, @steps, @total_amount, @rating, @notes)
  `).run({
    recipe_id: body.recipe_id,
    brew_type: body.brew_type,
    brew_date: body.brew_date,
    dose: body.dose ?? null,
    water_temp: body.water_temp ?? null,
    steps: body.steps ?? null,
    total_amount: body.total_amount ?? null,
    rating: body.rating ?? null,
    notes: body.notes ?? null,
  });

  const newRecord = db.prepare(`
    SELECT records.*, recipes.bean_name, recipes.roastery
    FROM records JOIN recipes ON records.recipe_id = recipes.id
    WHERE records.id = ?
  `).get(result.lastInsertRowid);
  return NextResponse.json(newRecord, { status: 201 });
}
