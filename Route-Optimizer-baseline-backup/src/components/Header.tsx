import React from 'react';
import { Layers, MapPin, BarChart3, GraduationCap, Navigation, Sun, Moon, Mountain, Activity } from 'lucide-react';

interface HeaderProps {
  activeView: 'map_hub' | 'traffic';
  onSelectView: (view: 'map_hub' | 'traffic') => void;
  onOpenThesisModal: () => void;
  isNavigating: boolean;
  destinationsCount: number;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  mapView?: 'traffic' | 'terrain';
  onToggleMapView?: (view: 'traffic' | 'terrain') => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onSelectView,
  onOpenThesisModal,
  isNavigating,
  destinationsCount,
  theme,
  onToggleTheme,
  mapView = 'traffic',
  onToggleMapView
}) => {
  const isDark = theme === 'dark';

  return (
    <header className="sticky top-0 z-40 w-full dark:bg-[#050507]/90 bg-white/90 backdrop-blur-xl border-b dark:border-white/10 border-black/10 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 min-h-14 sm:h-16 flex flex-wrap sm:flex-nowrap items-center justify-between gap-x-2 gap-y-2 py-2 sm:py-0">
        
        {/* Zone 1: Single element brand wordmark */}
        <div className="order-1 flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg dark:bg-white/10 bg-black/5 dark:border-white/20 border-black/10 flex items-center justify-center dark:text-white text-neutral-900 shrink-0 shadow-sm">
            <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs sm:text-sm font-bold tracking-tight dark:text-white text-neutral-900 whitespace-nowrap">
              <span className="font-mono dark:text-neutral-400 text-neutral-500 font-normal text-[11px] sm:text-xs hidden min-[400px]:inline">LUSAKA</span>
            </span>
            {isNavigating && (
              <span className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 text-[10px] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
                <span>Active</span>
              </span>
            )}
          </div>
        </div>

        {/* Zone 2: Streamlined App Navigation */}
        <nav className="order-3 sm:order-2 w-full sm:w-auto flex items-center justify-center gap-1 dark:bg-white/[0.04] bg-black/[0.04] p-0.5 sm:p-1 rounded-xl border dark:border-white/10 border-black/10 shrink-0">
          <button
            onClick={() => onSelectView('map_hub')}
            className={`flex-1 sm:flex-initial justify-center px-2.5 sm:px-4 py-1.5 min-h-10 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeView === 'map_hub'
                ? 'bg-teal-700 text-white dark:bg-teal-300 dark:text-teal-950 font-semibold shadow-sm'
                : (isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-black')
            }`}
            aria-label="Route and Navigation Hub"
          >
            {isNavigating ? (
              <Navigation className="w-3.5 h-3.5 fill-current animate-pulse text-emerald-500 dark:text-emerald-400 shrink-0" />
            ) : (
              <MapPin className="w-3.5 h-3.5 shrink-0" />
            )}
            <span className="hidden min-[480px]:inline">{isNavigating ? 'Navigating' : 'Route & Navigate'}</span>
            <span className="min-[480px]:hidden">{isNavigating ? 'Nav' : 'Route'}</span>
            {!isNavigating && destinationsCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeView === 'map_hub'
                  ? (isDark ? 'bg-black/15 text-black' : 'bg-white/20 text-white')
                  : (isDark ? 'bg-white/10 text-white' : 'bg-black/10 text-neutral-800')
              }`}>
                {destinationsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectView('traffic')}
            className={`flex-1 sm:flex-initial justify-center px-2.5 sm:px-4 py-1.5 min-h-10 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeView === 'traffic'
                ? 'bg-teal-700 text-white dark:bg-teal-300 dark:text-teal-950 font-semibold shadow-sm'
                : (isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-black')
            }`}
            aria-label="Traffic Analytics"
          >
            <BarChart3 className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden min-[480px]:inline">Traffic Analytics</span>
            <span className="min-[480px]:hidden">Traffic</span>
          </button>
        </nav>

        {/* Zone 3: Dark/Light Mode Switch & Academic Details */}
        <div className="order-2 sm:order-3 flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* Map View Switcher in Header (when in map view) */}
          {activeView === 'map_hub' && onToggleMapView && (
            <div className={`hidden lg:flex items-center p-0.5 rounded-xl border ${
              isDark ? 'bg-white/[0.04] border-white/10' : 'bg-black/[0.04] border-black/10'
            }`}>
              <button
                onClick={() => onToggleMapView('traffic')}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  mapView === 'traffic'
                    ? 'bg-teal-700 text-white dark:bg-teal-300 dark:text-teal-950 font-semibold shadow-sm'
                    : (isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-black')
                }`}
                title="Traffic View: Congestion & Speed vectors"
              >
                <Activity className="w-3 h-3" />
                <span>Traffic</span>
              </button>
              <button
                onClick={() => onToggleMapView('terrain')}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  mapView === 'terrain'
                    ? 'bg-teal-700 text-white dark:bg-teal-300 dark:text-teal-950 font-semibold shadow-sm'
                    : (isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-black')
                }`}
                title="Terrain View: Lusaka Topography & Green Reserves"
              >
                <Mountain className="w-3 h-3" />
                <span>Terrain</span>
              </button>
            </div>
          )}

          {/* Dark / Light Mode Switch */}
          <button
            onClick={onToggleTheme}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 min-h-10 min-w-10 rounded-xl border text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
              isDark
                ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                : 'bg-black/5 hover:bg-black/10 border-black/10 text-neutral-800'
            }`}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden md:inline text-[11px] font-mono">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-neutral-700" />
                <span className="hidden md:inline text-[11px] font-mono">Dark</span>
              </>
            )}
          </button>

          {/* Academic Dissertation Button */}
          <button
            onClick={onOpenThesisModal}
            className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 min-h-10 rounded-xl border text-xs font-medium transition-all whitespace-nowrap ${
              isDark
                ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                : 'bg-black/5 hover:bg-black/10 border-black/10 text-neutral-800'
            }`}
            title="Academic Research & Thesis Details"
            aria-label="View Thesis Details"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Thesis Info</span>
          </button>
        </div>

      </div>
    </header>
  );
};
