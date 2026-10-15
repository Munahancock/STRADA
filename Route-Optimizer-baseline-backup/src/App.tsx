import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { UnifiedRouteHub } from './components/UnifiedRouteHub';
import { BenchmarksView } from './components/BenchmarksView';
import { ThesisModal } from './components/ThesisModal';

export default function App() {
  const [activeView, setActiveView] = useState<'map_hub' | 'traffic'>('map_hub');
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [isThesisModalOpen, setIsThesisModalOpen] = useState<boolean>(false);

  // Global Theme: 'dark' | 'light' with persistence
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('routemaster-theme');
      if (saved === 'light' || saved === 'dark') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

  // Map View Mode: 'traffic' | 'terrain'
  const [mapView, setMapView] = useState<'traffic' | 'terrain'>('traffic');

  // Synchronize documentElement dark and light class
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    try {
      localStorage.setItem('routemaster-theme', theme);
    } catch (e) {}
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Shared destination state
  const [startNodeId, setStartNodeId] = useState<string>('cbd_depot');
  const [destinationNodeIds, setDestinationNodeIds] = useState<string[]>([
    'arcades',
    'unza_gate',
    'woodlands_mall'
  ]);

  return (
    <div className="min-h-screen dark:bg-[#040406] bg-[#f8fafc] dark:text-neutral-100 text-neutral-900 flex flex-col font-sans selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-black transition-colors duration-200">
      
      {/* Top Header */}
      <Header
        activeView={activeView}
        onSelectView={(view) => setActiveView(view)}
        onOpenThesisModal={() => setIsThesisModalOpen(true)}
        isNavigating={isNavigating}
        destinationsCount={destinationNodeIds.length}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        mapView={mapView}
        onToggleMapView={(view) => setMapView(view)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6">
        {activeView === 'map_hub' && (
          <UnifiedRouteHub
            isNavigating={isNavigating}
            setIsNavigating={setIsNavigating}
            startNodeId={startNodeId}
            setStartNodeId={setStartNodeId}
            destinationNodeIds={destinationNodeIds}
            setDestinationNodeIds={setDestinationNodeIds}
            theme={theme}
            mapView={mapView}
            setMapView={setMapView}
          />
        )}

        {activeView === 'traffic' && (
          <BenchmarksView theme={theme} />
        )}
      </main>

      {/* Clean Minimalist Academic Footer */}
      <footer className="w-full border-t dark:border-white/10 border-black/10 dark:bg-[#070709]/80 bg-white/80 backdrop-blur-xl py-4 sm:py-5 mt-8 sm:mt-10 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs dark:text-neutral-400 text-neutral-600">
          <div className="text-center sm:text-left">
            <span className="font-semibold dark:text-white text-neutral-900">Logistics Management Route Optimizer</span>
            <span className="mx-2 dark:text-neutral-600 text-neutral-400 hidden sm:inline">·</span>
            <span className="block sm:inline mt-0.5 sm:mt-0">Lusaka Urban Courier Fleet System</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono">
            <button
              onClick={() => setIsThesisModalOpen(true)}
              className="dark:text-neutral-400 dark:hover:text-white text-neutral-600 hover:text-black underline underline-offset-4 p-1"
            >
              Thesis Research Specs (DMI - St. Eugene University)
            </button>
          </div>
        </div>
      </footer>

      {/* Academic Dissertation & Architecture Modal */}
      <ThesisModal
        isOpen={isThesisModalOpen}
        onClose={() => setIsThesisModalOpen(false)}
        theme={theme}
      />

    </div>
  );
}
