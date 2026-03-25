'use client';

import { useState, useEffect, useCallback } from 'react';
import { BrewRecord, parseTimerData, formatTime } from '@/lib/types';

interface BeanStats {
  bean_name: string;
  count: number;
  avgRating: number;
  avgDose: number;
  avgTemp: number;
  avgBrewTime: number;
  hotCount: number;
  icedCount: number;
}

export default function StatsView() {
  const [records, setRecords] = useState<BrewRecord[]>([]);
  const [stats, setStats] = useState<BeanStats[]>([]);

  const fetchRecords = useCallback(async () => {
    const res = await fetch('/api/records');
    const data: BrewRecord[] = await res.json();
    setRecords(data);
    computeStats(data);
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const computeStats = (data: BrewRecord[]) => {
    const grouped: Record<string, BrewRecord[]> = {};
    data.forEach(r => {
      const key = r.bean_name ?? 'Unknown';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(r);
    });

    const result: BeanStats[] = Object.entries(grouped).map(([bean_name, recs]) => {
      const ratings = recs.filter(r => r.rating).map(r => r.rating!);
      const doses = recs.filter(r => r.dose).map(r => r.dose!);
      const temps = recs.filter(r => r.water_temp).map(r => r.water_temp!);
      const times = recs.filter(r => r.total_brew_time).map(r => r.total_brew_time!);
      const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

      return {
        bean_name,
        count: recs.length,
        avgRating: Math.round(avg(ratings) * 10) / 10,
        avgDose: Math.round(avg(doses) * 10) / 10,
        avgTemp: Math.round(avg(temps) * 10) / 10,
        avgBrewTime: Math.round(avg(times)),
        hotCount: recs.filter(r => r.brew_type === 'hot').length,
        icedCount: recs.filter(r => r.brew_type === 'iced').length,
      };
    });

    result.sort((a, b) => b.count - a.count);
    setStats(result);
  };

  if (records.length === 0) {
    return (
      <div className="p-4">
        <h2 className="text-lg font-bold text-warm-800 mb-4">통계</h2>
        <div className="text-center text-gray-400 py-12 text-sm">
          기록이 없습니다. 추출 기록을 쌓아보세요!
        </div>
      </div>
    );
  }

  const totalRecords = records.length;
  const avgRating = records.filter(r => r.rating).length > 0
    ? Math.round(records.filter(r => r.rating).reduce((s, r) => s + r.rating!, 0) / records.filter(r => r.rating).length * 10) / 10
    : 0;
  const hotTotal = records.filter(r => r.brew_type === 'hot').length;
  const icedTotal = records.filter(r => r.brew_type === 'iced').length;

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-bold text-warm-800">통계</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-2">
        <SummaryCard label="총 추출 횟수" value={`${totalRecords}회`} />
        <SummaryCard label="평균 별점" value={avgRating ? `${avgRating} ★` : '-'} />
        <SummaryCard label="Hot 추출" value={`${hotTotal}회`} color="text-red-500" />
        <SummaryCard label="Iced 추출" value={`${icedTotal}회`} color="text-blue-500" />
      </div>

      {/* Per-bean stats */}
      <h3 className="font-semibold text-sm text-warm-700 mt-2">원두별 분석</h3>
      <div className="space-y-2">
        {stats.map(s => (
          <div key={s.bean_name} className="bg-white rounded-xl border border-gray-100 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm text-warm-800">{s.bean_name}</span>
              <span className="text-xs text-gray-400">{s.count}회</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">평균 별점</span>
                <span className="font-medium text-amber-500">{s.avgRating || '-'} ★</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Hot / Iced</span>
                <span className="font-medium">{s.hotCount} / {s.icedCount}</span>
              </div>
              {s.avgDose > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">평균 원두량</span>
                  <span className="font-medium">{s.avgDose}g</span>
                </div>
              )}
              {s.avgTemp > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">평균 온도</span>
                  <span className="font-medium">{s.avgTemp}°C</span>
                </div>
              )}
              {s.avgBrewTime > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">평균 추출시간</span>
                  <span className="font-medium">{formatTime(s.avgBrewTime)}</span>
                </div>
              )}
            </div>

            {/* Mini bar chart for rating distribution */}
            <RatingBar records={records.filter(r => r.bean_name === s.bean_name)} />
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-lg font-bold ${color ?? 'text-warm-700'}`}>{value}</p>
    </div>
  );
}

function RatingBar({ records }: { records: BrewRecord[] }) {
  const rated = records.filter(r => r.rating);
  if (rated.length === 0) return null;

  const dist = [0, 0, 0, 0, 0];
  rated.forEach(r => { dist[r.rating! - 1]++; });
  const max = Math.max(...dist);

  return (
    <div className="mt-2 pt-2 border-t border-gray-50">
      <p className="text-[10px] text-gray-400 mb-1">별점 분포</p>
      <div className="flex items-end gap-1 h-8">
        {dist.map((count, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
            <div
              className="w-full bg-amber-300 rounded-sm"
              style={{ height: max > 0 ? `${(count / max) * 24}px` : '2px', minHeight: '2px' }}
            />
            <span className="text-[8px] text-gray-400">{i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
