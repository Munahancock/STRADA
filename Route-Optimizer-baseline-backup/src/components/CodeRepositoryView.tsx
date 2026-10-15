import React, { useState } from 'react';
import { SOURCE_FILES } from '../data/thesisData';
import { FileCode2, Copy, Check, Terminal, ExternalLink } from 'lucide-react';

export const CodeRepositoryView: React.FC = () => {
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  const currentFile = SOURCE_FILES[selectedFileIndex];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = currentFile.code.trim().split('\n');

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
          <span>SYSTEM IMPLEMENTATION &amp; SOURCE OVERVIEW</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          Implementation Code Repository
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 max-w-3xl mt-1">
          The four core engineering modules comprising the Lusaka Logistics Route Optimizer: GIS graph extraction, PyTorch Geometric ST-GCN speed predictor, FastAPI asynchronous microservice, and Streamlit dispatcher console.
        </p>
      </div>

      {/* Code Browser Container */}
      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
        
        {/* Top File Bar */}
        <div className="flex flex-wrap items-center justify-between border-b border-white/10 px-4 py-2.5 bg-black/40 gap-3">
          
          {/* File Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {SOURCE_FILES.map((file, idx) => (
              <button
                key={file.name}
                onClick={() => { setSelectedFileIndex(idx); setCopied(false); }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                  selectedFileIndex === idx
                    ? 'bg-white text-black font-semibold shadow-sm'
                    : 'text-neutral-400 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                <FileCode2 className="w-3.5 h-3.5" />
                <span>{file.name}</span>
              </button>
            ))}
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-panel-subtle hover:bg-white/10 text-neutral-300 hover:text-white text-xs font-mono transition-all border border-white/10"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Copied to Clipboard</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Source</span>
              </>
            )}
          </button>
        </div>

        {/* Description Banner for Selected File */}
        <div className="px-5 py-3 bg-white/[0.02] border-b border-white/5 text-xs text-neutral-300 font-sans flex items-start gap-2.5">
          <Terminal className="w-4 h-4 text-white shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-white font-mono mr-2">{currentFile.name}:</span>
            <span className="text-neutral-400">{currentFile.description}</span>
          </div>
        </div>

        {/* Code Content with Line Numbers */}
        <div className="p-4 overflow-x-auto max-h-[580px] bg-black/60 font-mono text-xs leading-relaxed">
          <table className="w-full text-left">
            <tbody>
              {lines.map((line, idx) => (
                <tr key={idx} className="hover:bg-white/[0.04]">
                  <td className="w-12 select-none text-right pr-4 text-neutral-600 font-mono text-[11px] align-top">
                    {idx + 1}
                  </td>
                  <td className="text-neutral-200 whitespace-pre font-mono">
                    {/* Basic syntax coloration for keywords and strings */}
                    {line.startsWith('#') || line.startsWith('//') ? (
                      <span className="text-neutral-500 italic">{line}</span>
                    ) : line.includes('def ') || line.includes('class ') || line.includes('import ') || line.includes('from ') ? (
                      <span>
                        <span className="text-white font-semibold">{line.split(' ')[0]} </span>
                        <span className="text-neutral-300">{line.slice(line.indexOf(' ') + 1)}</span>
                      </span>
                    ) : line.includes('"""') ? (
                      <span className="text-neutral-400 italic">{line}</span>
                    ) : (
                      line
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
