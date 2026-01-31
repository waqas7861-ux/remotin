import React, { useState } from 'react';
import { Generator } from './components/Generator';
import { SvgDisplay } from './components/SvgDisplay';
import { HistoryList } from './components/HistoryList';
import { StoryGenerator } from './components/StoryGenerator';
import { GeneratedAsset } from './types';
import { Code, Layout, Palette, Wand2, Film, Image } from 'lucide-react';

const App: React.FC = () => {
  const [mode, setMode] = useState<'single' | 'story'>('single');
  const [currentAsset, setCurrentAsset] = useState<GeneratedAsset | null>(null);
  const [history, setHistory] = useState<GeneratedAsset[]>([]);

  const handleGenerationSuccess = (asset: GeneratedAsset) => {
    setCurrentAsset(asset);
    setHistory((prev) => [asset, ...prev]);
  };

  const handleSelectHistory = (asset: GeneratedAsset) => {
    setCurrentAsset(asset);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-surface/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-primary to-accent p-2 rounded-lg">
              <Wand2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                VectorCraft AI
              </h1>
              <p className="text-xs text-slate-400">Professional SVG Generator for Remotion</p>
            </div>
          </div>
          
          {/* Mode Switcher */}
          <div className="hidden md:flex bg-slate-800 p-1 rounded-lg border border-slate-700">
            <button
              onClick={() => setMode('single')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                mode === 'single' 
                  ? 'bg-primary text-white shadow-lg' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Image className="w-4 h-4" /> Single Asset
            </button>
            <button
              onClick={() => setMode('story')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                mode === 'story' 
                  ? 'bg-primary text-white shadow-lg' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Film className="w-4 h-4" /> Story Mode
            </button>
          </div>

          <div className="flex items-center gap-4 text-sm font-medium text-slate-400">
            <span className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer">
              <Code className="w-4 h-4" /> API
            </span>
          </div>
        </div>
        
        {/* Mobile Mode Switcher */}
        <div className="md:hidden p-2 border-t border-slate-800 flex bg-surface">
           <button
              onClick={() => setMode('single')}
              className={`flex-1 flex justify-center items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 ${
                mode === 'single' ? 'border-primary text-primary' : 'border-transparent text-slate-400'
              }`}
            >
              Single Asset
            </button>
            <button
              onClick={() => setMode('story')}
              className={`flex-1 flex justify-center items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 ${
                mode === 'story' ? 'border-primary text-primary' : 'border-transparent text-slate-400'
              }`}
            >
              Story Mode
            </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6">
        
        {mode === 'single' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Controls */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="bg-surface rounded-xl border border-slate-700 p-5 shadow-lg">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Layout className="w-5 h-5 text-primary" />
                  Generator
                </h2>
                <Generator onGenerate={handleGenerationSuccess} />
              </div>

              <div className="bg-surface rounded-xl border border-slate-700 p-5 shadow-lg flex-1 min-h-[300px]">
                 <h2 className="text-lg font-semibold mb-4">History</h2>
                 <HistoryList history={history} onSelect={handleSelectHistory} currentId={currentAsset?.id} />
              </div>
            </div>

            {/* Right Column: Preview */}
            <div className="lg:col-span-8 flex flex-col h-full min-h-[600px]">
              <SvgDisplay asset={currentAsset} />
            </div>
          </div>
        ) : (
          <StoryGenerator />
        )}

      </main>

      <footer className="border-t border-slate-800 py-6 text-center text-slate-500 text-sm">
        <p>Powered by Gemini 3 Flash &bull; Designed for Creators</p>
      </footer>
    </div>
  );
};

export default App;