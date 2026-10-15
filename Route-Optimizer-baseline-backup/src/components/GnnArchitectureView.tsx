import React, { useState } from 'react';
import { MATH_FORMULATIONS, SYSTEM_ARCH_LAYERS } from '../data/thesisData';
import { Cpu, Network, Calculator, Sliders, ChevronRight, Binary, ArrowRight } from 'lucide-react';

export const GnnArchitectureView: React.FC = () => {
  // Dynamic Edge Weight Calculator State
  const [calcLengthKm, setCalcLengthKm] = useState<number>(2.4);
  const [calcSpeedKmh, setCalcSpeedKmh] = useState<number>(12);
  const [roadCorridor, setRoadCorridor] = useState<string>('Great East Road (Manda Hill Flyover)');

  // Dynamic cost in minutes: (length / speed) * 60
  const dynamicCostMinutes = (calcLengthKm / Math.max(calcSpeedKmh, 1)) * 60;
  const freeFlowCostMinutes = (calcLengthKm / 65) * 60;
  const penaltyMinutes = Math.max(0, dynamicCostMinutes - freeFlowCostMinutes);

  return (
    <div className="space-y-8">
      
      {/* Overview Header */}
      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
          <span>THEORETICAL FOUNDATION &amp; MATHEMATICAL FORMULATION</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          Spatio-Temporal Graph Neural Network &amp; VRPTW Model
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 max-w-3xl mt-1">
          Lusaka's urban road network is modeled as a directed spatial graph G=(V,E) extracted via OSMnx. 
          The ST-GCN integrates graph spatial convolutions with 1D temporal convolutions to predict time-dependent edge traversal costs We(t), which feed the Google OR-Tools optimization engine.
        </p>
      </div>

      {/* System Architecture 5-Layer Stack */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-300">
            System Architectural Layers
          </h2>
          <span className="text-xs font-mono text-neutral-400">End-to-End Pipeline</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {SYSTEM_ARCH_LAYERS.map((layer, idx) => (
            <div
              key={layer.layer}
              className="p-4 rounded-xl glass-panel space-y-2 border border-white/10 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-neutral-400 font-semibold">0{idx + 1}</span>
                  <span className="font-mono text-[10px] text-neutral-400 uppercase">{layer.tech.split(',')[0]}</span>
                </div>
                <h3 className="font-bold text-white text-xs mt-1.5">{layer.layer}</h3>
                <div className="font-mono text-[11px] text-neutral-300 mt-1">{layer.tech}</div>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed pt-2 border-t border-white/5">
                {layer.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Mathematical Formulations Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-300">
            Key Mathematical Formulations
          </h2>
          <span className="text-xs font-mono text-neutral-400">Formal Graph Theory</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {MATH_FORMULATIONS.map((form) => (
            <div
              key={form.title}
              className="glass-panel p-5 rounded-2xl space-y-4 border border-white/10 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <span className="text-xs font-mono text-neutral-400 block font-semibold">
                  {form.title}
                </span>

                {/* Mathematical Equation Display Box */}
                <div className="p-4 rounded-xl bg-black/60 border border-white/15 text-center font-mono text-sm sm:text-base text-white font-bold tracking-wider overflow-x-auto">
                  {form.latexDisplay}
                </div>

                {/* Variable Breakdown */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <span className="text-[10px] font-mono uppercase text-neutral-400 block">Variable Definitions:</span>
                  {form.variables.map((v) => (
                    <div key={v.symbol} className="text-xs flex items-baseline gap-2">
                      <span className="font-mono text-white font-bold shrink-0">{v.symbol}:</span>
                      <span className="text-neutral-400 text-[11px]">{v.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 text-[11px] text-neutral-400 italic">
                {form.note}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Edge Weight Simulator & GCN Convolution Mechanics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Dynamic Edge Cost Calculator (6 cols) */}
        <div className="lg:col-span-6 glass-panel p-6 rounded-2xl space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-white" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Dynamic Edge Weight Simulator: We(t)
              </h3>
            </div>
            <span className="text-xs font-mono text-neutral-400">Interactive Formula</span>
          </div>

          <p className="text-xs text-neutral-400">
            Simulate how a predicted drop in road speed under Lusaka rush hours exponentially inflates the traversal cost We(t) in the VRPTW routing model:
          </p>

          <div className="space-y-4 p-4 rounded-xl bg-white/[0.02] border border-white/10">
            
            {/* Road Corridor Preset */}
            <div>
              <label className="text-xs text-neutral-400 block mb-1">Target Corridor</label>
              <select
                value={roadCorridor}
                onChange={(e) => {
                  setRoadCorridor(e.target.value);
                  if (e.target.value.includes('Manda Hill')) { setCalcLengthKm(2.4); setCalcSpeedKmh(12); }
                  if (e.target.value.includes('Kafue')) { setCalcLengthKm(3.4); setCalcSpeedKmh(16); }
                  if (e.target.value.includes('Addis Ababa')) { setCalcLengthKm(2.1); setCalcSpeedKmh(48); }
                }}
                className="w-full glass-input px-3 py-2 rounded-xl text-xs text-white"
              >
                <option value="Great East Road (Manda Hill Flyover)" className="bg-neutral-900">Great East Road (Manda Hill Flyover) · Length 2.4 km</option>
                <option value="Kafue Road (Downtown Flyover to Makeni)" className="bg-neutral-900">Kafue Road (Downtown Flyover to Makeni) · Length 3.4 km</option>
                <option value="Addis Ababa Drive (Bypass Route)" className="bg-neutral-900">Addis Ababa Drive (Bypass Route) · Length 2.1 km</option>
              </select>
            </div>

            {/* Length Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-neutral-400">Segment Length (km):</span>
                <span className="font-mono text-white font-bold">{calcLengthKm.toFixed(1)} km</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="10.0"
                step="0.1"
                value={calcLengthKm}
                onChange={(e) => setCalcLengthKm(parseFloat(e.target.value))}
                className="w-full accent-white"
              />
            </div>

            {/* Predicted Speed Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-neutral-400">ST-GNN Predicted Speed (km/h):</span>
                <span className={`font-mono font-bold ${calcSpeedKmh < 15 ? 'text-rose-400' : 'text-white'}`}>
                  {calcSpeedKmh} km/h {calcSpeedKmh < 15 ? '(Choke Alert)' : '(Nominal)'}
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="80"
                step="1"
                value={calcSpeedKmh}
                onChange={(e) => setCalcSpeedKmh(parseInt(e.target.value))}
                className="w-full accent-white"
              />
            </div>

          </div>

          {/* Calculator Output */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-white/[0.04] border border-white/20 text-xs font-mono">
            <div>
              <div className="text-neutral-400 text-[10px]">Traversal Time We(t)</div>
              <div className="text-xl font-bold text-white mt-1">
                {dynamicCostMinutes.toFixed(1)} <span className="text-xs font-normal">min</span>
              </div>
            </div>
            <div>
              <div className="text-neutral-400 text-[10px]">Free-Flow Baseline</div>
              <div className="text-xl font-bold text-neutral-300 mt-1">
                {freeFlowCostMinutes.toFixed(1)} <span className="text-xs font-normal">min</span>
              </div>
            </div>
            <div>
              <div className="text-neutral-400 text-[10px]">Congestion Penalty</div>
              <div className={`text-xl font-bold mt-1 ${penaltyMinutes > 5 ? 'text-rose-400' : 'text-emerald-400'}`}>
                +{penaltyMinutes.toFixed(1)} <span className="text-xs font-normal">min</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-neutral-400 leading-relaxed">
            When predicted speed drops below 15 km/h, the OR-Tools VRPTW solver penalizes this edge severely, immediately selecting adjacent bypass nodes (e.g. Addis Ababa Dr or Los Angeles Blvd).
          </div>

        </div>

        {/* ST-GCN Architecture Breakdown (6 cols) */}
        <div className="lg:col-span-6 glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-white" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Graph Neural Network Topology
              </h3>
            </div>
            <span className="text-xs font-mono text-neutral-400">PyTorch Geometric</span>
          </div>

          <div className="space-y-3">
            
            {/* Stage 1 */}
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
              <span className="w-6 h-6 rounded-lg bg-white/10 text-white font-mono text-xs flex items-center justify-center shrink-0 mt-0.5">
                1
              </span>
              <div className="text-xs">
                <div className="font-semibold text-white">Spatial Graph Topology G=(V,E)</div>
                <p className="text-neutral-400 text-[11px] mt-0.5">
                  4,520 nodes (intersections) and 9,244 directed edges. Encoded into symmetric normalized adjacency matrix Ã with self-loops.
                </p>
              </div>
            </div>

            {/* Stage 2 */}
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
              <span className="w-6 h-6 rounded-lg bg-white/10 text-white font-mono text-xs flex items-center justify-center shrink-0 mt-0.5">
                2
              </span>
              <div className="text-xs">
                <div className="font-semibold text-white">Spatial GCN Convolution (Kipf &amp; Welling)</div>
                <p className="text-neutral-400 text-[11px] mt-0.5">
                  Aggregates neighbor speed features across road junctions: H^(l+1) = σ( D̃^(-1/2) Ã D̃^(-1/2) H^(l) W^(l) ). Propagates traffic wave dynamics across 2 hops.
                </p>
              </div>
            </div>

            {/* Stage 3 */}
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
              <span className="w-6 h-6 rounded-lg bg-white/10 text-white font-mono text-xs flex items-center justify-center shrink-0 mt-0.5">
                3
              </span>
              <div className="text-xs">
                <div className="font-semibold text-white">1D Temporal Convolution (TCN Block)</div>
                <p className="text-neutral-400 text-[11px] mt-0.5">
                  Captures rush-hour progression over past 6 timesteps (30 min history). Convolves temporal sequences with kernel size k=3.
                </p>
              </div>
            </div>

            {/* Stage 4 */}
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
              <span className="w-6 h-6 rounded-lg bg-white/10 text-white font-mono text-xs flex items-center justify-center shrink-0 mt-0.5">
                4
              </span>
              <div className="text-xs">
                <div className="font-semibold text-white">Speed Vector Regression &amp; VRPTW Feed</div>
                <p className="text-neutral-400 text-[11px] mt-0.5">
                  Linear projection outputs 15-min and 30-min forward speed vectors across all 9,244 edges. Evaluated with 3.42 km/h MAE.
                </p>
              </div>
            </div>

          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 font-mono text-[11px] text-neutral-400 flex items-center justify-between">
            <span>Optimization Solver:</span>
            <span className="text-white font-semibold">Google OR-Tools VRPTW + Heuristic A*</span>
          </div>

        </div>

      </div>

    </div>
  );
};
