import React, { useState, useEffect } from 'react';
import { GeneratedAsset, AspectRatio } from '../types';
import { PLACEHOLDER_SVG } from '../constants';
import { Check, Copy, Download, Code, Eye, RefreshCw } from 'lucide-react';

interface SvgDisplayProps {
  asset: GeneratedAsset | null;
}

export const SvgDisplay: React.FC<SvgDisplayProps> = ({ asset }) => {
  const [viewMode, setViewMode] = useState<'preview' | 'code' | 'react'>('preview');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCopied(false);
  }, [asset, viewMode]);

  const handleCopy = () => {
    if (!asset) return;
    
    let textToCopy = asset.svgContent;
    if (viewMode === 'react') {
      textToCopy = `export const Character = () => (\n${asset.svgContent.replace(/class="/g, 'className="')}\n);`;
    }

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!asset) return;
    const blob = new Blob([asset.svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `character-${asset.id.slice(0, 8)}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getResolutionText = (ratio?: AspectRatio) => {
    if (!ratio) return '512 x 512px';
    switch (ratio) {
      case AspectRatio.LANDSCAPE: return '1024 x 576px';
      case AspectRatio.PORTRAIT: return '576 x 1024px';
      case AspectRatio.SQUARE: return '512 x 512px';
      default: return '512 x 512px';
    }
  };

  const content = asset ? asset.svgContent : PLACEHOLDER_SVG;

  return (
    <div className="bg-surface rounded-xl border border-slate-700 shadow-xl overflow-hidden flex flex-col h-full animate-in fade-in zoom-in duration-300">
      
      {/* Toolbar */}
      <div className="h-14 border-b border-slate-700 flex items-center justify-between px-4 bg-slate-800/50">
        <div className="flex bg-slate-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode('preview')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
              viewMode === 'preview' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-4 h-4" /> Preview
          </button>
          <button
            onClick={() => setViewMode('code')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
              viewMode === 'code' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Code className="w-4 h-4" /> SVG Source
          </button>
          <button
            onClick={() => setViewMode('react')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
              viewMode === 'react' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <RefreshCw className="w-4 h-4" /> Remotion
          </button>
        </div>

        <div className="flex items-center gap-2">
           <button
            onClick={handleCopy}
            disabled={!asset}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-50"
            title="Copy Code"
          >
            {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
          </button>
          <button
            onClick={handleDownload}
            disabled={!asset}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-50"
            title="Download SVG"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Display Area */}
      <div className="flex-1 overflow-auto bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-slate-900 relative">
        
        {viewMode === 'preview' && (
          <div className="w-full h-full flex items-center justify-center p-8">
            <div 
                className="w-full h-full max-w-[600px] max-h-[600px] flex items-center justify-center filter drop-shadow-2xl transition-all duration-500"
                dangerouslySetInnerHTML={{ __html: content }} 
            />
          </div>
        )}

        {viewMode === 'code' && (
          <pre className="p-6 text-sm font-mono text-slate-300 leading-relaxed w-full h-full overflow-auto">
            <code>{asset ? asset.svgContent : '<!-- Generated SVG code will appear here -->'}</code>
          </pre>
        )}

        {viewMode === 'react' && (
          <div className="w-full h-full flex flex-col">
            <div className="bg-yellow-900/20 border-b border-yellow-500/20 p-3 text-xs text-yellow-200 px-6">
               Tip: Copy this component directly into your Remotion project.
            </div>
            <pre className="p-6 text-sm font-mono text-blue-300 leading-relaxed w-full h-full overflow-auto">
              <code>{asset ? `// Remotion / React Component
export const Character = () => (
${asset.svgContent.replace(/class="/g, 'className="')
                  .replace(/stroke-width/g, 'strokeWidth')
                  .replace(/stroke-linecap/g, 'strokeLinecap')
                  .replace(/stroke-linejoin/g, 'strokeLinejoin')
                  .replace(/fill-rule/g, 'fillRule')
                  .replace(/clip-rule/g, 'clipRule')
                  .replace(/text-anchor/g, 'textAnchor')
}
);` : '// React component will appear here'}</code>
            </pre>
          </div>
        )}
      </div>
      
      {/* Footer Info */}
      <div className="h-10 bg-surface border-t border-slate-700 flex items-center justify-between px-4 text-xs text-slate-500">
         <span>{asset ? `Style: ${asset.style}` : 'Ready to generate'}</span>
         <span>{asset ? getResolutionText(asset.aspectRatio) : ''}</span>
      </div>
    </div>
  );
};