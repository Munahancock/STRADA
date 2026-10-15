import React, { useState } from 'react';
import { THESIS_DETAILS, MATH_FORMULATIONS, SYSTEM_ARCH_LAYERS, SOURCE_FILES, BENCHMARK_METRICS } from '../data/thesisData';
import { X, GraduationCap, Building2, User, BookOpen, MapPin, Calculator, Code2, Layers, Award } from 'lucide-react';

interface ThesisModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'dark' | 'light';
}

export const ThesisModal: React.FC<ThesisModalProps> = ({ isOpen, onClose, theme = 'dark' }) => {
  const isDark = theme === 'dark';
  const [tab, setTab] = useState<'overview' | 'math' | 'code'>('overview');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      
      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-3xl glass-panel rounded-2xl border dark:border-white/20 border-black/15 p-4 sm:p-6 sm:p-8 space-y-5 sm:space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-xl dark:text-neutral-400 dark:hover:text-white text-neutral-500 hover:text-black dark:hover:bg-white/10 hover:bg-black/5 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
          title="Close dialog"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Thesis Title Header */}
        <div className="space-y-1.5 pr-8">
          <div className="flex items-center gap-2 text-xs font-mono dark:text-neutral-400 text-neutral-500">
            <GraduationCap className="w-3.5 h-3.5 dark:text-white text-neutral-900" />
            <span>ACADEMIC DISSERTATION &amp; ARCHITECTURE</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight dark:text-white text-neutral-900">
            {THESIS_DETAILS.title}
          </h2>
          <div className="text-xs font-mono dark:text-neutral-300 text-neutral-600">
            {THESIS_DETAILS.academicLevel} · {THESIS_DETAILS.institution} ({THESIS_DETAILS.institutionLocation})
          </div>
        </div>

        {/* Modal Segmented Navigation */}
        <div className="flex rounded-xl p-1 dark:bg-white/[0.04] bg-black/[0.04] border dark:border-white/10 border-black/10 text-xs">
          <button
            onClick={() => setTab('overview')}
            className={`flex-1 py-1.5 rounded-lg transition-all font-medium ${
              tab === 'overview' ? (isDark ? 'bg-white text-black font-semibold shadow-sm' : 'bg-neutral-900 text-white font-semibold shadow-sm') : (isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-black')
            }`}
          >
            Project Summary
          </button>
          <button
            onClick={() => setTab('math')}
            className={`flex-1 py-1.5 rounded-lg transition-all font-medium ${
              tab === 'math' ? (isDark ? 'bg-white text-black font-semibold shadow-sm' : 'bg-neutral-900 text-white font-semibold shadow-sm') : (isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-black')
            }`}
          >
            Mathematical Model
          </button>
          <button
            onClick={() => setTab('code')}
            className={`flex-1 py-1.5 rounded-lg transition-all font-medium ${
              tab === 'code' ? (isDark ? 'bg-white text-black font-semibold shadow-sm' : 'bg-neutral-900 text-white font-semibold shadow-sm') : (isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-black')
            }`}
          >
            Source Architecture
          </button>
        </div>

        {/* Tab 1: Overview */}
        {tab === 'overview' && (
          <div className="space-y-5 animate-in fade-in duration-100">
            {/* Academic Attribution Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl dark:bg-white/[0.03] bg-black/[0.03] border dark:border-white/10 border-black/10 text-xs">
              <div className="space-y-1">
                <div className="dark:text-neutral-400 text-neutral-500 font-mono text-[10px]">CANDIDATE</div>
                <div className="font-semibold dark:text-white text-neutral-900 text-sm">{THESIS_DETAILS.candidateName}</div>
                <div className="font-mono dark:text-neutral-400 text-neutral-500 text-[11px]">Reg No: {THESIS_DETAILS.regNo}</div>
              </div>

              <div className="space-y-1">
                <div className="dark:text-neutral-400 text-neutral-500 font-mono text-[10px]">PROJECT GUIDE</div>
                <div className="font-semibold dark:text-white text-neutral-900 text-sm">{THESIS_DETAILS.guideName}</div>
                <div className="dark:text-neutral-400 text-neutral-500 text-[11px]">Department of Computer Science</div>
              </div>

              <div className="space-y-1 pt-2 sm:pt-0 sm:border-t-0 border-t dark:border-white/5 border-black/5">
                <div className="dark:text-neutral-400 text-neutral-500 font-mono text-[10px]">INSTITUTION</div>
                <div className="font-semibold dark:text-white text-neutral-900">{THESIS_DETAILS.institution}</div>
                <div className="dark:text-neutral-400 text-neutral-500 text-[11px]">{THESIS_DETAILS.institutionLocation}</div>
              </div>

              <div className="space-y-1 pt-2 sm:pt-0 sm:border-t-0 border-t dark:border-white/5 border-black/5">
                <div className="dark:text-neutral-400 text-neutral-500 font-mono text-[10px]">LOCATION FOCUS</div>
                <div className="font-semibold dark:text-white text-neutral-900">{THESIS_DETAILS.locationFocus}</div>
                <div className="dark:text-neutral-400 text-neutral-500 text-[11px]">Great East Rd · Kafue Rd · Lumumba Rd</div>
              </div>
            </div>

            {/* Problem & Solution */}
            <div className="space-y-3 text-xs leading-relaxed">
              <div className="p-3.5 rounded-xl dark:bg-black/50 bg-black/[0.04] border dark:border-white/10 border-black/10 space-y-1">
                <div className="font-bold dark:text-white text-neutral-900 font-mono text-[11px]">Problem Statement:</div>
                <p className="dark:text-neutral-300 text-neutral-700">{THESIS_DETAILS.problemSummary}</p>
              </div>

              <div className="p-3.5 rounded-xl dark:bg-black/50 bg-black/[0.04] border dark:border-white/10 border-black/10 space-y-1">
                <div className="font-bold dark:text-white text-neutral-900 font-mono text-[11px]">AI-Driven Solution:</div>
                <p className="dark:text-neutral-300 text-neutral-700">{THESIS_DETAILS.solutionSummary}</p>
              </div>
            </div>

            {/* Key Benchmarks */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
              <div className="p-3 rounded-xl dark:bg-white/[0.03] bg-black/[0.03] border dark:border-white/10 border-black/10">
                <div className="text-xl font-bold dark:text-white text-neutral-900">29.1%</div>
                <div className="text-[10px] dark:text-neutral-400 text-neutral-500">Duration Reduction</div>
              </div>
              <div className="p-3 rounded-xl dark:bg-white/[0.03] bg-black/[0.03] border dark:border-white/10 border-black/10">
                <div className="text-xl font-bold dark:text-white text-neutral-900">62.8%</div>
                <div className="text-[10px] dark:text-neutral-400 text-neutral-500">Idle Reduction</div>
              </div>
              <div className="p-3 rounded-xl dark:bg-white/[0.03] bg-black/[0.03] border dark:border-white/10 border-black/10">
                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">95.4%</div>
                <div className="text-[10px] dark:text-neutral-400 text-neutral-500">SLA Compliance</div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Mathematical Formulations */}
        {tab === 'math' && (
          <div className="space-y-4 animate-in fade-in duration-100">
            {MATH_FORMULATIONS.map((form) => (
              <div key={form.title} className="p-4 rounded-xl dark:bg-white/[0.03] bg-black/[0.03] border dark:border-white/10 border-black/10 space-y-2 text-xs">
                <div className="font-mono dark:text-neutral-400 text-neutral-500 font-semibold">{form.title}</div>
                <div className="p-2.5 rounded-lg dark:bg-black/70 bg-neutral-900 border dark:border-white/15 border-black/20 font-mono text-center text-white font-bold">
                  {form.latexDisplay}
                </div>
                <p className="dark:text-neutral-400 text-neutral-600 text-[11px]">{form.note}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Source Code & Tech Stack */}
        {tab === 'code' && (
          <div className="space-y-3 animate-in fade-in duration-100 text-xs">
            <div className="dark:text-neutral-400 text-neutral-500 mb-2">
              Core Python backend modules developed for the research thesis:
            </div>
            {SOURCE_FILES.map(file => (
              <div key={file.name} className="p-3 rounded-xl dark:bg-white/[0.03] bg-black/[0.03] border dark:border-white/10 border-black/10 space-y-1">
                <div className="font-mono dark:text-white text-neutral-900 font-semibold flex items-center justify-between">
                  <span>{file.name}</span>
                </div>
                <div className="dark:text-neutral-400 text-neutral-500 text-[11px]">{file.description}</div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Footer */}
        <div className="pt-2 flex items-center justify-between border-t dark:border-white/10 border-black/10">
          <div className="text-[11px] font-mono dark:text-neutral-400 text-neutral-500">
            DMI - St. Eugene University · Computer Science
          </div>
          <button
            onClick={onClose}
            className="glass-button-primary px-4 py-2 rounded-xl text-xs font-semibold"
          >
            Close
          </button>
        </div>

      </div>

    </div>
  );
};
