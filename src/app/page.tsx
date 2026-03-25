'use client';

import { useState } from 'react';
import RecipesTab from '@/components/RecipesTab';
import RecordTab from '@/components/RecordTab';
import HistoryTab from '@/components/HistoryTab';

const tabs = [
  { key: 'recipes', label: '레시피', icon: '📋' },
  { key: 'record', label: '기록하기', icon: '✏️' },
  { key: 'history', label: '히스토리', icon: '📊' },
] as const;

type TabKey = typeof tabs[number]['key'];

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabKey>('recipes');
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

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
    <div className="flex flex-col h-full max-w-[480px] mx-auto bg-warm-50">
      {/* Header */}
      <header className="bg-warm-700 text-white px-4 py-3 flex items-center justify-center shadow-md flex-shrink-0">
        <h1 className="text-xl font-bold tracking-wide">☕ 커피수첩</h1>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-16">
        {activeTab === 'recipes' && <RecipesTab onStartRecord={handleStartRecord} />}
        {activeTab === 'record' && (
          <RecordTab
            selectedRecipeId={selectedRecipeId}
            onSaved={handleRecordSaved}
          />
        )}
        {activeTab === 'history' && <HistoryTab key={refreshKey} />}
      </main>

      {/* Bottom Tab Navigation */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-gray-200 flex shadow-lg z-50">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => {
              if (tab.key === 'record') setSelectedRecipeId(null);
              setActiveTab(tab.key);
            }}
            className={`flex-1 py-2 flex flex-col items-center gap-0.5 text-xs transition-colors ${
              activeTab === tab.key
                ? 'text-warm-700 font-semibold'
                : 'text-gray-400'
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
