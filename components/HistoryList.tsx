import React from 'react';
import { GeneratedAsset } from '../types';
import { Trash2 } from 'lucide-react';

interface HistoryListProps {
  history: GeneratedAsset[];
  onSelect: (asset: GeneratedAsset) => void;
  currentId?: string;
}

export const HistoryList: React.FC<HistoryListProps> = ({ history, onSelect, currentId }) => {
  if (history.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2 p-4 border-2 border-dashed border-slate-700 rounded-lg">
        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
           <span className="text-xl">📜</span>
        </div>
        <p className="text-sm">No history yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-3 overflow-y-auto max-h-[400px] pr-2">
      {history.map((item) => (
        <div
          key={item.id}
          onClick={() => onSelect(item)}
          className={`
            group relative cursor-pointer rounded-lg border p-2 transition-all hover:shadow-md
            ${currentId === item.id 
              ? 'bg-slate-700 border-primary ring-1 ring-primary' 
              : 'bg-slate-800 border-slate-700 hover:border-slate-500'
            }
          `}
        >
          {/* Mini Preview */}
          <div 
            className="w-full aspect-square bg-slate-900 rounded mb-2 overflow-hidden flex items-center justify-center p-2"
            dangerouslySetInnerHTML={{ __html: item.svgContent }}
          />
          
          <div className="space-y-1">
             <p className="text-xs font-medium text-slate-200 line-clamp-1 truncate" title={item.prompt}>
               {item.prompt}
             </p>
             <p className="text-[10px] text-slate-500 uppercase tracking-wider">
               {item.style}
             </p>
          </div>
        </div>
      ))}
    </div>
  );
};
