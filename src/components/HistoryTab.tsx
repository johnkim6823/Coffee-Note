'use client';

import { useState, useEffect, useCallback } from 'react';
import { BrewRecord, RecipeStep, parseSteps, parseTimerData, TimerStepData, formatTime } from '@/lib/types';

export default function HistoryTab() {
  const [records, setRecords] = useState<BrewRecord[]>([]);
  const [recipes, setRecipes] = useState<{ id: number; bean_name: string }[]>([]);
  const [filterBean, setFilterBean] = useState('');
  const [filterType, setFilterType] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<BrewRecord | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<Set<number>>(new Set());

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

  const toggleCompare = (id: number) => {
    const next = new Set(compareIds);
    if (next.has(id)) next.delete(id);
    else if (next.size < 2) next.add(id);
    setCompareIds(next);
  };

  // Comparison view
  if (compareMode && compareIds.size === 2) {
    const [id1, id2] = Array.from(compareIds);
    const r1 = records.find(r => r.id === id1)!;
    const r2 = records.find(r => r.id === id2)!;
    return (
      <CompareView
        record1={r1}
        record2={r2}
        onBack={() => { setCompareMode(false); setCompareIds(new Set()); }}
      />
    );
  }

  if (selectedRecord) {
    return <RecordDetail record={selectedRecord} onBack={() => setSelectedRecord(null)} onDelete={handleDelete} />;
  }

  const uniqueBeans = [...new Set(recipes.map(r => r.bean_name))];

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-warm-800">히스토리</h2>
        <button
          onClick={() => { setCompareMode(!compareMode); setCompareIds(new Set()); }}
          className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
            compareMode ? 'bg-warm-600 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          {compareMode ? '비교 취소' : '비교하기'}
        </button>
      </div>

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

      {compareMode && (
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs text-gray-500">비교할 기록 2개를 선택하세요 ({compareIds.size}/2)</p>
          {compareIds.size === 2 && (
            <button
              onClick={() => {}}
              className="text-xs bg-warm-600 text-white px-3 py-1 rounded-lg font-medium"
              // This triggers the compare view via the conditional render above
              ref={el => { if (el) el.click = () => {}; }}
            >
              비교 보기
            </button>
          )}
        </div>
      )}

      {/* Records list */}
      {records.length === 0 ? (
        <div className="text-center text-gray-400 py-12 text-sm">
          기록이 없습니다
        </div>
      ) : (
        <div className="space-y-2">
          {records.map(record => (
            <div key={record.id} className="flex items-center gap-2">
              {compareMode && (
                <button
                  onClick={() => toggleCompare(record.id)}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    compareIds.has(record.id)
                      ? 'bg-warm-600 border-warm-600 text-white text-xs'
                      : 'border-gray-300'
                  }`}
                >
                  {compareIds.has(record.id) ? '✓' : ''}
                </button>
              )}
              <button
                onClick={() => {
                  if (compareMode) toggleCompare(record.id);
                  else setSelectedRecord(record);
                }}
                className="flex-1 text-left bg-white rounded-xl shadow-sm border border-gray-100 p-3 hover:border-warm-300 transition-colors"
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
                  <div className="flex items-center gap-2">
                    {record.total_brew_time ? (
                      <span className="text-[10px] text-gray-400 font-mono">{formatTime(record.total_brew_time)}</span>
                    ) : null}
                    {record.rating ? (
                      <div className="flex text-amber-400 text-xs">
                        {'★'.repeat(record.rating)}
                        <span className="text-gray-300">{'★'.repeat(5 - record.rating)}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-400">{record.roastery}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(record.brew_date).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Compare button at bottom */}
      {compareMode && compareIds.size === 2 && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-[460px] px-4">
          <button
            onClick={() => {}}
            className="w-full py-3 bg-warm-600 text-white rounded-xl font-semibold text-sm shadow-lg"
          >
            선택한 2개 기록 비교하기
          </button>
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
  const timerSteps: TimerStepData[] = parseTimerData(record.timer_data);

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
          {record.total_brew_time ? (
            <div className="flex justify-between">
              <span className="text-gray-500">총 추출 시간</span>
              <span className="font-medium font-mono">{formatTime(record.total_brew_time)}</span>
            </div>
          ) : null}
        </div>

        {steps.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">추출 단계</p>
            <div className="space-y-1">
              {steps.map((step, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-medium">
                      {step.label}
                    </span>
                    <span className="font-semibold">{step.amount}g</span>
                  </div>
                  {timerSteps[i] && (
                    <span className="text-gray-400 font-mono">{formatTime(timerSteps[i].duration)}</span>
                  )}
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

function CompareView({ record1, record2, onBack }: {
  record1: BrewRecord;
  record2: BrewRecord;
  onBack: () => void;
}) {
  const steps1 = parseSteps(record1.steps);
  const steps2 = parseSteps(record2.steps);
  const timer1 = parseTimerData(record1.timer_data);
  const timer2 = parseTimerData(record2.timer_data);

  const compareRow = (label: string, val1: string | number | null, val2: string | number | null) => {
    if (!val1 && !val2) return null;
    return (
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 text-xs items-center">
        <span className="text-right font-medium">{val1 ?? '-'}</span>
        <span className="text-gray-400 text-[10px] min-w-[60px] text-center">{label}</span>
        <span className="font-medium">{val2 ?? '-'}</span>
      </div>
    );
  };

  return (
    <div className="p-4">
      <button onClick={onBack} className="text-warm-600 text-sm font-medium mb-4">← 뒤로</button>

      <h2 className="text-lg font-bold text-warm-800 mb-4 text-center">추출 비교</h2>

      <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
        {/* Headers */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 text-xs items-center mb-2">
          <div className="text-right">
            <p className="font-bold text-warm-800">{record1.bean_name}</p>
            <p className="text-gray-400">{new Date(record1.brew_date).toLocaleDateString('ko-KR')}</p>
          </div>
          <span className="text-gray-300 text-lg">VS</span>
          <div>
            <p className="font-bold text-warm-800">{record2.bean_name}</p>
            <p className="text-gray-400">{new Date(record2.brew_date).toLocaleDateString('ko-KR')}</p>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-2 space-y-2">
          {compareRow('타입',
            record1.brew_type === 'hot' ? '🔥 Hot' : '🧊 Iced',
            record2.brew_type === 'hot' ? '🔥 Hot' : '🧊 Iced'
          )}
          {compareRow('원두량', record1.dose ? `${record1.dose}g` : null, record2.dose ? `${record2.dose}g` : null)}
          {compareRow('물 온도', record1.water_temp ? `${record1.water_temp}°C` : null, record2.water_temp ? `${record2.water_temp}°C` : null)}
          {compareRow('총 추출량', record1.total_amount ? `${record1.total_amount}g` : null, record2.total_amount ? `${record2.total_amount}g` : null)}
          {compareRow('추출 시간',
            record1.total_brew_time ? formatTime(record1.total_brew_time) : null,
            record2.total_brew_time ? formatTime(record2.total_brew_time) : null
          )}
          {compareRow('별점',
            record1.rating ? '★'.repeat(record1.rating) : null,
            record2.rating ? '★'.repeat(record2.rating) : null
          )}
        </div>

        {/* Step comparison */}
        {(steps1.length > 0 || steps2.length > 0) && (
          <div className="border-t border-gray-100 pt-2">
            <p className="text-xs font-medium text-gray-500 text-center mb-2">단계별 추출량</p>
            {Array.from({ length: Math.max(steps1.length, steps2.length) }).map((_, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto_1fr] gap-2 text-xs items-center mb-1">
                <span className="text-right font-medium">
                  {steps1[i] ? `${steps1[i].amount}g` : '-'}
                  {timer1[i] ? ` (${formatTime(timer1[i].duration)})` : ''}
                </span>
                <span className="text-gray-400 text-[10px] min-w-[70px] text-center">
                  {steps1[i]?.label || steps2[i]?.label || `단계${i + 1}`}
                </span>
                <span className="font-medium">
                  {steps2[i] ? `${steps2[i].amount}g` : '-'}
                  {timer2[i] ? ` (${formatTime(timer2[i].duration)})` : ''}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Notes comparison */}
        {(record1.notes || record2.notes) && (
          <div className="border-t border-gray-100 pt-2 space-y-2">
            <p className="text-xs font-medium text-gray-500 text-center">후기</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-warm-50 rounded-lg p-2 text-xs text-gray-600">{record1.notes || '-'}</div>
              <div className="bg-warm-50 rounded-lg p-2 text-xs text-gray-600">{record2.notes || '-'}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
