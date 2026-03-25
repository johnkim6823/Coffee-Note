'use client';

import { useState, useEffect } from 'react';
import RecipesTab from '@/components/RecipesTab';
import RecordTab from '@/components/RecordTab';
import HistoryTab from '@/components/HistoryTab';
import StatsView from '@/components/StatsView';

const tabs = [
  { key: 'recipes', label: '레시피', icon: '📋' },
  { key: 'record', label: '기록하기', icon: '✏️' },
  { key: 'history', label: '히스토리', icon: '📊' },
  { key: 'stats', label: '통계', icon: '📈' },
] as const;

type TabKey = typeof tabs[number]['key'];

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabKey>('recipes');
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('coffee-note-dark');
    if (saved === 'true') setDark(true);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('coffee-note-dark', String(dark));
  }, [dark]);

  const handleStartRecord = (recipeId: number) => {
    setSelectedRecipeId(recipeId);
    setActiveTab('record');
  };

  const handleRecordSaved = () => {
    setSelectedRecipeId(null);
    setRefreshKey(k => k + 1);
    setActiveTab('history');
  };

  return (
    <div className="flex flex-col h-full max-w-[480px] mx-auto bg-warm-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-warm-700 dark:bg-gray-800 text-white px-4 py-3 flex items-center justify-between shadow-md flex-shrink-0">
        <div />
        <h1 className="text-xl font-bold tracking-wide">☕ 커피수첩</h1>
        <button
          onClick={() => setDark(!dark)}
          className="text-lg opacity-80 hover:opacity-100 transition-opacity"
          title={dark ? '라이트 모드' : '다크 모드'}
        >
          {dark ? '☀️' : '🌙'}
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-16 dark:text-gray-100">
        {activeTab === 'recipes' && <RecipesTab onStartRecord={handleStartRecord} />}
        {activeTab === 'record' && (
          <RecordTab
            selectedRecipeId={selectedRecipeId}
            onSaved={handleRecordSaved}
          />
        )}
        {activeTab === 'history' && <HistoryTab key={refreshKey} />}
        {activeTab === 'stats' && <StatsView key={refreshKey} />}
      </main>

      {/* Bottom Tab Navigation */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex shadow-lg z-50">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => {
              if (tab.key === 'record') setSelectedRecipeId(null);
              setActiveTab(tab.key);
            }}
            className={`flex-1 py-2 flex flex-col items-center gap-0.5 text-xs transition-colors ${
              activeTab === tab.key
                ? 'text-warm-700 dark:text-amber-400 font-semibold'
                : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
