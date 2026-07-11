import React from 'react';
import { GenHistoryItem } from '../type';

interface Props {
  history: GenHistoryItem[];
  onRestore: (item: GenHistoryItem) => void;
}

export const Sidebar: React.FC<Props> = ({ history, onRestore }) => {
  return (
    <div className="relative border-l border-cds-border-subtle flex flex-col items-start overflow-clip w-[300px] h-full min-h-0 bg-cds-background">
      <div className="p-[12px] pb-2 w-full">
        <div className="flex items-center px-2 mb-4">
          <span className="text-[11px] font-medium text-cds-text-secondary tracking-[0.1px] normal-case font-mono">
            LỊCH SỬ SÁNG TẠO
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-[10px] space-y-3 w-full custom-scrollbar pb-6">
        {history.length === 0 ? (
          <div className="h-[200px] flex flex-col items-center justify-center text-cds-text-muted gap-2">
            <span className="material-symbols-outlined text-[32px]">history</span>
            <p className="text-[10px] font-medium uppercase tracking-widest font-mono">Trống</p>
          </div>
        ) : (
          history.map((item) => (
            <div
              key={item.id}
              onClick={() => onRestore(item)}
              className="group relative bg-cds-layer1 border border-cds-border-subtle rounded-xl overflow-hidden shadow-lg transition-all duration-300 cursor-pointer hover:border-cds-border-strong hover:scale-[1.02]"
            >
              <div className="relative aspect-video bg-black overflow-hidden">
                {item.isPending ? (
                  <div className="w-full h-full relative overflow-hidden bg-cds-background">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer" />
                  </div>
                ) : item.generatedImage ? (
                  <img src={item.generatedImage} className="w-full h-full object-cover" alt="Generated" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-cds-background text-white/20">
                    <span className="material-symbols-outlined text-[24px]">image</span>
                  </div>
                )}
                
                {/* Overlay with info */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                  <p className="text-[9px] text-white line-clamp-2 leading-tight font-mono">
                    {item.prompt}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
