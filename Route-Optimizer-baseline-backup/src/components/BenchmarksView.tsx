import React, { useState } from 'react';
import {
  TrendingDown,
  Clock,
  Fuel,
  Activity
} from 'lucide-react';

export interface BenchmarksViewProps {
  theme?: 'dark' | 'light';
}

export const BenchmarksView: React.FC<BenchmarksViewProps> = ({ theme = 'dark' }) => {
  const isDark = theme === 'dark';
  const [selectedCorridor, setSelectedCorridor] = useState<'great_east' | 'kafue' | 'lumumba'>('great_east');

  // Hourly congestion speed curves (06:00 to 20:00) for Lusaka primary corridors
  const speedProfiles = {
    great_east: [
      { hour: '06:00', speed: 65, status: 'free' },
      { hour: '07:00', speed: 38, status: 'slow' },
      { hour: '07:30', speed: 14, status: 'choke' },
      { hour: '08:00', speed: 9, status: 'choke' }, // Peak morning choke
      { hour: '08:30', speed: 12, status: 'choke' },
      { hour: '09:00', speed: 28, status: 'slow' },
      { hour: '10:00', speed: 52, status: 'free' },
      { hour: '12:00', speed: 55, status: 'free' },
      { hour: '14:00', speed: 50, status: 'free' },
      { hour: '16:00', speed: 35, status: 'slow' },
      { hour: '17:00', speed: 15, status: 'choke' }, // Peak evening choke
      { hour: '17:30', speed: 11, status: 'choke' },
      { hour: '18:30', speed: 22, status: 'slow' },
      { hour: '20:00', speed: 62, status: 'free' }
    ],
    kafue: [
      { hour: '06:00', speed: 60, status: 'free' },
      { hour: '07:00', speed: 32, status: 'slow' },
      { hour: '07:30', speed: 12, status: 'choke' },
      { hour: '08:00', speed: 10, status: 'choke' },
      { hour: '08:30', speed: 16, status: 'choke' },
      { hour: '09:00', speed: 30, status: 'slow' },
      { hour: '10:00', speed: 48, status: 'free' },
      { hour: '12:00', speed: 50, status: 'free' },
      { hour: '14:00', speed: 46, status: 'free' },
      { hour: '16:00', speed: 29, status: 'slow' },
      { hour: '17:00', speed: 13, status: 'choke' },
      { hour: '17:30', speed: 10, status: 'choke' },
      { hour: '18:30', speed: 24, status: 'slow' },
      { hour: '20:00', speed: 58, status: 'free' }
    ],
    lumumba: [
      { hour: '06:00', speed: 55, status: 'free' },
      { hour: '07:00', speed: 35, status: 'slow' },
      { hour: '07:30', speed: 18, status: 'slow' },
      { hour: '08:00', speed: 13, status: 'choke' },
      { hour: '08:30', speed: 15, status: 'choke' },
      { hour: '09:00', speed: 25, status: 'slow' },
      { hour: '10:00', speed: 42, status: 'free' },
      { hour: '12:00', speed: 45, status: 'free' },
      { hour: '14:00', speed: 40, status: 'free' },
      { hour: '16:00', speed: 26, status: 'slow' },
      { hour: '17:00', speed: 14, status: 'choke' },
      { hour: '17:30', speed: 12, status: 'choke' },
      { hour: '18:30', speed: 28, status: 'slow' },
      { hour: '20:00', speed: 52, status: 'free' }
    ]
  };

  const currentProfile = speedProfiles[selectedCorridor];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-150">
      
      {/* Top Header */}
      <div className="glass-panel p-4 sm:p-6 rounded-2xl">
        <div className="flex items-center gap-2 text-xs font-mono dark:text-neutral-400 text-neutral-500 mb-1">
          <span className="w-1.5 h-1.5 rounded-full dark:bg-white bg-neutral-900"></span>
          <span>INTELLIGENT FLEET TRAFFIC ANALYTICS</span>
        </div>
        <h1 className="text-lg sm:text-2xl font-bold tracking-tight dark:text-white text-neutral-900">
          Lusaka Arterial Traffic &amp; Velocity Profiles
        </h1>
        <p className="text-xs sm:text-sm dark:text-neutral-400 text-neutral-600 max-w-3xl mt-1 leading-relaxed">
          An easy-to-read summary of major urban congestion corridors in Lusaka and empirical hourly velocity collapse curves during peak morning and evening rush hours.
        </p>
      </div>

      {/* 1. EASY TO READ SUMMARY OF TRAFFIC SITUATIONS */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider dark:text-white text-neutral-900">
              Lusaka Road Traffic Situations at a Glance
            </h2>
            <p className="text-xs dark:text-neutral-400 text-neutral-600 mt-0.5">
              Live status across Lusaka’s three major commercial arteries
            </p>
          </div>
          <span className="text-[11px] font-mono dark:text-neutral-400 text-neutral-500">Peak: 07:00–09:00 &amp; 16:30–18:30</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          
          {/* Situation Card 1: Great East Road */}
          <div className="glass-panel p-4 sm:p-5 rounded-2xl border dark:border-white/10 border-black/10 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase text-rose-500 dark:text-rose-400 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 font-bold">
                  Severe Bottleneck
                </span>
                <span className="text-[11px] font-mono dark:text-neutral-400 text-neutral-500">T4 Highway</span>
              </div>
              <h3 className="font-bold dark:text-white text-neutral-900 text-sm sm:text-base">Great East Road</h3>
              <p className="text-xs dark:text-neutral-400 text-neutral-600 leading-relaxed">
                Connects CBD to Arcades, UNZA, Chelston &amp; Airport. Critical standstill at Manda Hill Flyover during rush hours.
              </p>
            </div>

            <div className="pt-2.5 border-t dark:border-white/10 border-black/10 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="dark:text-neutral-500 text-neutral-500">Choke Point:</span>
                <span className="dark:text-neutral-200 text-neutral-800 font-medium">Manda Hill Flyover</span>
              </div>
              <div className="flex justify-between">
                <span className="dark:text-neutral-500 text-neutral-500">Speed Drop:</span>
                <span className="text-rose-500 dark:text-rose-400 font-bold">65 → 9 km/h</span>
              </div>
              <div className="flex justify-between">
                <span className="dark:text-neutral-500 text-neutral-500">Standstill Delay:</span>
                <span className="dark:text-white text-neutral-900 font-medium">+24 to +32 min</span>
              </div>
            </div>
          </div>

          {/* Situation Card 2: Kafue Road */}
          <div className="glass-panel p-4 sm:p-5 rounded-2xl border dark:border-white/10 border-black/10 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 font-bold">
                  High Congestion
                </span>
                <span className="text-[11px] font-mono dark:text-neutral-400 text-neutral-500">T2 Highway</span>
              </div>
              <h3 className="font-bold dark:text-white text-neutral-900 text-sm sm:text-base">Kafue Road</h3>
              <p className="text-xs dark:text-neutral-400 text-neutral-600 leading-relaxed">
                Southern artery linking Lusaka Downtown to Chawama, Makeni Mall, and Lilayi. Heavy commuter flow and bus stops cause crawls.
              </p>
            </div>

            <div className="pt-2.5 border-t dark:border-white/10 border-black/10 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="dark:text-neutral-500 text-neutral-500">Choke Point:</span>
                <span className="dark:text-neutral-200 text-neutral-800 font-medium">Downtown to Makeni</span>
              </div>
              <div className="flex justify-between">
                <span className="dark:text-neutral-500 text-neutral-500">Speed Drop:</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">60 → 10 km/h</span>
              </div>
              <div className="flex justify-between">
                <span className="dark:text-neutral-500 text-neutral-500">Standstill Delay:</span>
                <span className="dark:text-white text-neutral-900 font-medium">+18 to +25 min</span>
              </div>
            </div>
          </div>

          {/* Situation Card 3: Lumumba Road */}
          <div className="glass-panel p-4 sm:p-5 rounded-2xl border dark:border-white/10 border-black/10 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase dark:text-neutral-300 text-neutral-700 px-2 py-0.5 rounded dark:bg-white/10 bg-black/5 border dark:border-white/20 border-black/10 font-bold">
                  Freight Slowdown
                </span>
                <span className="text-[11px] font-mono dark:text-neutral-400 text-neutral-500">Industrial Arterial</span>
              </div>
              <h3 className="font-bold dark:text-white text-neutral-900 text-sm sm:text-base">Lumumba Road</h3>
              <p className="text-xs dark:text-neutral-400 text-neutral-600 leading-relaxed">
                Primary spine for heavy transport and Matero industrial logistics. Congestion builds rapidly when freight merges with commuters.
              </p>
            </div>

            <div className="pt-2.5 border-t dark:border-white/10 border-black/10 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="dark:text-neutral-500 text-neutral-500">Choke Point:</span>
                <span className="dark:text-neutral-200 text-neutral-800 font-medium">Matero Industrial</span>
              </div>
              <div className="flex justify-between">
                <span className="dark:text-neutral-500 text-neutral-500">Speed Drop:</span>
                <span className="dark:text-neutral-300 text-neutral-700 font-bold">55 → 13 km/h</span>
              </div>
              <div className="flex justify-between">
                <span className="dark:text-neutral-500 text-neutral-500">Standstill Delay:</span>
                <span className="dark:text-white text-neutral-900 font-medium">+15 to +20 min</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 2. LUSAKA ARTERIAL CONGESTION VELOCITY PROFILES */}
      <div className="glass-panel p-4 sm:p-6 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider dark:text-white text-neutral-900">
              Lusaka Arterial Congestion Velocity Profiles
            </h2>
            <p className="text-xs dark:text-neutral-400 text-neutral-600 mt-0.5">
              Empirical hourly speed collapse illustrating morning (07:00-09:00) and evening (16:30-18:30) gridlock
            </p>
          </div>

          {/* Corridor Selector */}
          <div className="flex items-center gap-1 p-1 rounded-xl dark:bg-white/[0.04] bg-black/[0.04] border dark:border-white/10 border-black/10 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setSelectedCorridor('great_east')}
              className={`px-2.5 sm:px-3 py-1.5 text-xs rounded-lg transition-all whitespace-nowrap min-h-[36px] ${
                selectedCorridor === 'great_east'
                  ? (isDark ? 'bg-white text-black font-semibold shadow-sm' : 'bg-neutral-900 text-white font-semibold shadow-sm')
                  : (isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-black')
              }`}
            >
              Great East Road
            </button>
            <button
              onClick={() => setSelectedCorridor('kafue')}
              className={`px-2.5 sm:px-3 py-1.5 text-xs rounded-lg transition-all whitespace-nowrap min-h-[36px] ${
                selectedCorridor === 'kafue'
                  ? (isDark ? 'bg-white text-black font-semibold shadow-sm' : 'bg-neutral-900 text-white font-semibold shadow-sm')
                  : (isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-black')
              }`}
            >
              Kafue Road
            </button>
            <button
              onClick={() => setSelectedCorridor('lumumba')}
              className={`px-2.5 sm:px-3 py-1.5 text-xs rounded-lg transition-all whitespace-nowrap min-h-[36px] ${
                selectedCorridor === 'lumumba'
                  ? (isDark ? 'bg-white text-black font-semibold shadow-sm' : 'bg-neutral-900 text-white font-semibold shadow-sm')
                  : (isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-black')
              }`}
            >
              Lumumba Road
            </button>
          </div>
        </div>

        {/* Responsive Speed Velocity Chart Container */}
        <div className="h-56 sm:h-64 w-full pt-2 overflow-x-auto">
          <div className="min-w-[550px] h-full">
            <svg viewBox="0 0 700 200" className="w-full h-full overflow-visible">
              <line x1="40" y1="160" x2="680" y2="160" stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"} strokeWidth="1" />
              <text x="30" y="163" textAnchor="end" fill={isDark ? "#71717a" : "#64748b"} fontSize="10" className="font-mono">0</text>

              <line x1="40" y1="125" x2="680" y2="125" stroke="#f43f5e" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
              <text x="30" y="128" textAnchor="end" fill="#f43f5e" fontSize="10" className="font-mono">15</text>
              <text x="685" y="128" fill="#f43f5e" fontSize="9" className="font-mono">Choke Alert (&lt;15 km/h)</text>

              <line x1="40" y1="70" x2="680" y2="70" stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"} strokeWidth="1" />
              <text x="30" y="73" textAnchor="end" fill={isDark ? "#71717a" : "#64748b"} fontSize="10" className="font-mono">45</text>

              <line x1="40" y1="20" x2="680" y2="20" stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"} strokeWidth="1" />
              <text x="30" y="23" textAnchor="end" fill={isDark ? "#71717a" : "#64748b"} fontSize="10" className="font-mono">70 km/h</text>

              {(() => {
                const xStep = 640 / (currentProfile.length - 1);
                const points = currentProfile.map((p, i) => {
                  const x = 40 + i * xStep;
                  const y = 160 - (p.speed / 70) * 140;
                  return { x, y, speed: p.speed, hour: p.hour };
                });

                const pathD = points.reduce((acc, curr, idx) => {
                  return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
                }, '');

                return (
                  <g>
                    <path
                      d={`${pathD} L ${points[points.length - 1].x} 160 L ${points[0].x} 160 Z`}
                      fill={isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.04)"}
                    />
                    <path
                      d={pathD}
                      fill="none"
                      stroke={isDark ? "#ffffff" : "#09090b"}
                      strokeWidth="2.5"
                    />
                    {points.map((pt, idx) => (
                      <g key={idx}>
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={pt.speed < 15 ? 4.5 : 3}
                          fill={pt.speed < 15 ? "#f43f5e" : (isDark ? "#ffffff" : "#09090b")}
                          stroke={isDark ? "#000000" : "#ffffff"}
                          strokeWidth="1.5"
                        />
                        <text
                          x={pt.x}
                          y="180"
                          textAnchor="middle"
                          fill={isDark ? "#a1a1aa" : "#64748b"}
                          fontSize="9"
                          className="font-mono"
                        >
                          {pt.hour}
                        </text>
                        {(pt.speed <= 14) && (
                          <text
                            x={pt.x}
                            y={pt.y - 8}
                            textAnchor="middle"
                            fill="#f43f5e"
                            fontSize="9"
                            fontWeight="700"
                            className="font-mono"
                          >
                            {pt.speed}
                          </text>
                        )}
                      </g>
                    ))}
                  </g>
                );
              })()}
            </svg>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t dark:border-white/5 border-black/5 text-xs dark:text-neutral-400 text-neutral-600 font-mono">
          <div>
            Corridor Length: <span className="dark:text-white text-neutral-900 font-semibold">14.8 km</span>
          </div>
          <div>
            Predicted Recovery Time: <span className="dark:text-white text-neutral-900 font-semibold">09:30 &amp; 19:15</span>
          </div>
        </div>

      </div>

      {/* 3. PERFORMANCE IMPACT SUMMARY STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-xs font-mono">
        <div className="glass-panel p-3.5 sm:p-4 rounded-2xl border dark:border-white/10 border-black/10 space-y-1">
          <div className="flex items-center justify-between text-[9px] sm:text-[10px] dark:text-neutral-400 text-neutral-500">
            <span>TRIP TIME REDUCTION</span>
            <Clock className="w-3.5 h-3.5 opacity-60" />
          </div>
          <div className="text-xl sm:text-2xl font-bold dark:text-white text-neutral-900">29.1%</div>
          <div className="text-[10px] sm:text-[11px] dark:text-neutral-400 text-neutral-500 font-sans">Faster than Dijkstra</div>
        </div>

        <div className="glass-panel p-3.5 sm:p-4 rounded-2xl border dark:border-white/10 border-black/10 space-y-1">
          <div className="flex items-center justify-between text-[9px] sm:text-[10px] dark:text-neutral-400 text-neutral-500">
            <span>IDLE TIME SAVED</span>
            <TrendingDown className="w-3.5 h-3.5 opacity-60" />
          </div>
          <div className="text-xl sm:text-2xl font-bold dark:text-white text-neutral-900">62.8%</div>
          <div className="text-[10px] sm:text-[11px] dark:text-neutral-400 text-neutral-500 font-sans">Less gridlock delay</div>
        </div>

        <div className="glass-panel p-3.5 sm:p-4 rounded-2xl border dark:border-white/10 border-black/10 space-y-1">
          <div className="flex items-center justify-between text-[9px] sm:text-[10px] dark:text-neutral-400 text-neutral-500">
            <span>FUEL SAVINGS</span>
            <Fuel className="w-3.5 h-3.5 opacity-60" />
          </div>
          <div className="text-xl sm:text-2xl font-bold dark:text-white text-neutral-900">23.2%</div>
          <div className="text-[10px] sm:text-[11px] dark:text-neutral-400 text-neutral-500 font-sans">Per 100km fleet run</div>
        </div>

        <div className="glass-panel p-3.5 sm:p-4 rounded-2xl border dark:border-white/10 border-black/10 space-y-1">
          <div className="flex items-center justify-between text-[9px] sm:text-[10px] dark:text-neutral-400 text-neutral-500">
            <span>ON-TIME SLA RATE</span>
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">95.4%</div>
          <div className="text-[10px] sm:text-[11px] dark:text-neutral-400 text-neutral-500 font-sans">Up from 71.5%</div>
        </div>
      </div>

    </div>
  );
};
