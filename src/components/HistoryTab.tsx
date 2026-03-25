'use client';

import { useState, useEffect, useCallback } from 'react';
import { BrewRecord, RecipeStep, parseSteps } from '@/lib/types';

export default function HistoryTab() {
  const [records, setRecords] = useState<BrewRecord[]>([]);
  const [recipes, setRecipes] = useState<{ id: number; bean_name: string }[]>([]);
  const [filterBean, setFilterBean] = useState('');
  const [filterType, setFilterType] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<BrewRecord | null>(null);

  const fetchRecords = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterBean) params.set('bean_name', filterBean);
    if (filterType) params.set('brew_type', filterType);
    const res = await fetch(`/api/records?${params}`);
    const data = await res.json();
    setRecords(data);
  }, [filterBean, filterType]);

  const fetchRecipes = useCallback(async () => {
    const res = await fetch('/api/recipes');
    const data = await res.json();
    setRecipes(data);
  }, []);

  useEffect(() => { fetchRecipes(); }, [fetchRecipes]);
  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const handleDelete = async (id: number) => {
    if (!confirm('이 기록을 삭제하시겠습니까?')) return;
    await fetch(`/api/records/${id}`, { method: 'DELETE' });
    setSelectedRecord(null);
    fetchRecords();
  };

  if (selectedRecord) {
    return <RecordDetail record={selectedRecord} onBack={() => setSelectedRecord(null)} onDelete={handleDelete} />;
  }

  const uniqueBeans = [...new Set(recipes.map(r => r.bean_name))];

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold text-warm-800 mb-4">히스토리</h2>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        <select
          value={filterBean}
          onChange={e => setFilterBean(e.target.value)}
          className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-warm-400"
        >
          <option value="">전체 원두</option>
          {uniqueBeans.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-warm-400"
        >
          <option value="">전체</option>
          <option value="hot">Hot</option>
          <option value="iced">Iced</option>
        </select>
      </div>

      {/* Records list */}
      {records.length === 0 ? (
        <div className="text-center text-gray-400 py-12 text-sm">
          기록이 없습니다
        </div>
      ) : (
        <div className="space-y-2">
          {records.map(record => (
            <button
              key={record.id}
              onClick={() => setSelectedRecord(record)}
              className="w-full text-left bg-white rounded-xl shadow-sm border border-gray-100 p-3 hover:border-warm-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${
                    record.brew_type === 'hot' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {record.brew_type === 'hot' ? '🔥 Hot' : '🧊 Iced'}
                  </span>
                  <span className="font-semibold text-sm text-warm-800">{record.bean_name}</span>
                </div>
                {record.rating && (
                  <div className="flex text-amber-400 text-xs">
                    {'★'.repeat(record.rating)}
                    <span className="text-gray-300">{'★'.repeat(5 - record.rating)}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-400">{record.roastery}</span>
                <span className="text-xs text-gray-400">
                  {new Date(record.brew_date).toLocaleDateString('ko-KR')}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function RecordDetail({ record, onBack, onDelete }: {
  record: BrewRecord;
  onBack: () => void;
  onDelete: (id: number) => void;
}) {
  const steps: RecipeStep[] = parseSteps(record.steps);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="text-warm-600 text-sm font-medium">← 뒤로</button>
        <button
          onClick={() => onDelete(record.id)}
          className="text-red-500 text-sm font-medium"
        >
          삭제
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-warm-800">{record.bean_name}</h3>
          <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${
            record.brew_type === 'hot' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
          }`}>
            {record.brew_type === 'hot' ? '🔥 Hot' : '🧊 Iced'}
          </span>
        </div>

        <p className="text-xs text-gray-500">{record.roastery}</p>

        <div className="text-sm space-y-1.5">
          <div className="flex justify-between">
            <span className="text-gray-500">날짜</span>
            <span className="font-medium">{new Date(record.brew_date).toLocaleString('ko-KR')}</span>
          </div>
          {record.dose && (
            <div className="flex justify-between">
              <span className="text-gray-500">원두량</span>
              <span className="font-medium">{record.dose}g</span>
            </div>
          )}
          {record.water_temp && (
            <div className="flex justify-between">
              <span className="text-gray-500">물 온도</span>
              <span className="font-medium">{record.water_temp}°C</span>
            </div>
          )}
        </div>

        {steps.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">추출 단계</p>
            <div className="space-y-1">
              {steps.map((step, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-medium">
                    {step.label}
                  </span>
                  <span className="font-semibold">{step.amount}g</span>
                </div>
              ))}
            </div>
            {record.total_amount && (
              <p className="text-sm font-semibold text-warm-700 mt-1 text-right">
                총 추출량: {record.total_amount}g
              </p>
            )}
          </div>
        )}

        {record.rating && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">별점</p>
            <div className="flex text-amber-400 text-xl">
              {'★'.repeat(record.rating)}
              <span className="text-gray-300">{'★'.repeat(5 - record.rating)}</span>
            </div>
          </div>
        )}

        {record.notes && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">후기</p>
            <p className="text-sm text-gray-600 bg-warm-50 rounded-lg p-3">{record.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
