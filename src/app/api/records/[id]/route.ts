import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const record = db.prepare(`
    SELECT records.*, recipes.bean_name, recipes.roastery
    FROM records JOIN recipes ON records.recipe_id = recipes.id
    WHERE records.id = ?
  `).get(id);
  if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(record);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const existing = db.prepare('SELECT * FROM records WHERE id = ?').get(id);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  db.prepare('DELETE FROM records WHERE id = ?').run(id);
  return NextResponse.json({ success: true });
}
