import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Flow } from 'flow-sdk';
import { ThreeViewport, ViewportHandle } from './components/ThreeViewport';
import { Sidebar } from './components/Sidebar';
import { GenHistoryItem, SceneObject, AspectRatio } from './type';

// Design System Components
const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center px-2">
    <span className="text-[11px] font-medium text-[rgba(218,220,224,0.9)] tracking-[0.1px] normal-case">
      {children}
    </span>
  </div>
);

const PillButton: React.FC<{
  icon?: React.ReactNode; children: React.ReactNode;
  variant?: 'filled' | 'outline' | 'solid'; onClick?: () => void;
  disabled?: boolean;
  className?: string;
}> = ({ icon, children, variant = 'filled', onClick, disabled, className = '' }) => {
  const base = 'flex items-center gap-[2px] justify-center h-[34px] rounded-xl font-medium tracking-[0.1px] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
  const variants: Record<string, string> = {
    filled: 'bg-[#969696] hover:bg-[#a6a6a6] active:bg-[#868686] text-black text-[11px] pl-[8px] pr-[24px] py-1 select-none',
    outline: 'border border-[#595959] hover:bg-white/5 active:bg-white/10 backdrop-blur-[40px] text-[12px] pl-[8px] pr-[16px] py-2 text-white select-none',
    solid: 'bg-white hover:bg-gray-200 active:bg-gray-300 text-black text-[12px] pl-[8px] pr-[16px] py-2 select-none',
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} onClick={onClick} disabled={disabled}>
      {icon && <span className="flex items-center justify-center w-6 h-6">{icon}</span>}
      <span className="truncate">{children}</span>
    </button>
  );
};

const FieldDropdown: React.FC<{
  label: string; value: string; options: string[];
  onChange: (val: string) => void; className?: string;
}> = ({ label, value, options, onChange, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) return;
      setIsOpen(false);
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button type="button" onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left border border-[#595959] hover:border-[#7a7a7a] transition-colors rounded-xl flex flex-col gap-0.5 justify-center pb-2 pl-2.5 pr-1 pt-[5px] select-none focus:outline-none min-h-[49px]">
        <p className="text-[11px] font-medium text-[rgba(255,255,255,0.35)] tracking-[0.1px]">{label}</p>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-white tracking-[0.1px] truncate mr-1">{value}</span>
          <span className={`material-symbols-outlined text-[16px] text-[rgba(218,220,224,0.5)] mr-1 transition-transform ${isOpen ? 'rotate-180' : ''}`}>keyboard_arrow_down</span>
        </div>
      </button>
      {isOpen && (
        <div className="absolute z-[100] bottom-[calc(100%+4px)] left-0 w-full bg-[#0e0e0e] border border-[#595959] rounded-xl overflow-hidden shadow-xl backdrop-blur-md animate-dropdown origin-bottom">
          <div className="max-h-40 overflow-y-auto custom-scrollbar">
            {options.map((opt) => (
              <button key={opt} type="button"
                className={`w-full text-left px-2.5 py-2 text-[11px] font-medium tracking-[0.1px] hover:bg-[#1a1a1a] transition-colors ${value === opt ? 'bg-[#1a1a1a] text-white' : 'text-[rgba(218,220,224,0.9)]'}`}
                onClick={() => { onChange(opt); setIsOpen(false); }}>
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const DragNumberField: React.FC<{
  label: string; value: number; min?: number; max?: number;
  step?: number; suffix?: string; onChange: (val: number) => void; className?: string;
}> = ({ label, value, min = 0, max = 999, step = 1, suffix = 'px', onChange, className = '' }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{ startY: number; startVal: number; moved: boolean } | null>(null);

  const commitEdit = (raw: string) => {
    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) onChange(Math.min(max, Math.max(min, Math.round(parsed / step) * step)));
    setIsEditing(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing) return;
    e.preventDefault();
    dragRef.current = { startY: e.clientY, startVal: value, moved: false };
    const handleMouseMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      if (Math.abs(ev.clientY - dragRef.current.startY) > 3) dragRef.current.moved = true;
      if (dragRef.current.moved) {
        const delta = dragRef.current.startY - ev.clientY;
        const newVal = Math.round((dragRef.current.startVal + delta * step) / step) * step;
        onChange(Math.min(max, Math.max(min, newVal)));
        document.body.style.cursor = 'ns-resize';
      }
    };
    const handleMouseUp = () => {
      const wasDrag = dragRef.current?.moved;
      dragRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      if (!wasDrag) {
        setEditValue(String(value));
        setIsEditing(true);
        setTimeout(() => inputRef.current?.select(), 0);
      }
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className={`border border-[#595959] hover:border-[#7a7a7a] rounded-xl flex flex-col gap-0.5 justify-center pb-2 pl-2.5 pr-1 pt-[5px] select-none transition-colors ${isEditing ? '' : 'cursor-ns-resize'} ${className} min-h-[49px]`}
      onMouseDown={handleMouseDown}>
      <p className="text-[11px] font-medium text-[rgba(255,255,255,0.35)] tracking-[0.1px]">{label}</p>
      <div className="flex items-center justify-between">
        {isEditing ? (
          <input ref={inputRef} type="text" value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(editValue); if (e.key === 'Escape') setIsEditing(false); }}
            onBlur={() => commitEdit(editValue)}
            className="bg-transparent text-[11px] font-medium text-white tracking-[0.1px] outline-none w-full border-none p-0 m-0" autoFocus />
        ) : (
          <>
            <span className="text-[11px] font-medium text-white tracking-[0.1px] cursor-text">{value}{suffix}</span>
            <div className="flex flex-col items-center mr-1.5 -gap-px text-white/40">
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M5 0L9 5H1L5 0Z" fill="currentColor"/></svg>
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M5 6L1 1H9L5 6Z" fill="currentColor"/></svg>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const HDRIS = {
  'Studio Brown': 'https://cdn.jsdelivr.net/gh/manhhuynh-designer/POSMARS-CUSTOMUI@main/hdri/brown_photostudio_02_1k.exr',
  'Studio Small': 'https://cdn.jsdelivr.net/gh/manhhuynh-designer/POSMARS-CUSTOMUI@main/hdri/studio_small_09_1k.exr',
  'Urban Street': 'https://cdn.jsdelivr.net/gh/manhhuynh-designer/POSMARS-CUSTOMUI@main/hdri/wide_street_01_4k.exr',
  'Default': ''
};

const AI_MODELS = ['🍌 Nano Banana Pro', '🍌 Nano Banana 2', '🍌 Nano Banana 2 Lite'];

export default function App() {
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [sceneObjects, setSceneObjects] = useState<SceneObject[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  
  const [focalLength, setFocalLength] = useState<number>(50);
  const [framePrompt, setFramePrompt] = useState('');
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawColor, setDrawColor] = useState('#ef4444');
  
  const [hdriName, setHdriName] = useState('Studio Brown');
  const [showTexture] = useState(true);
  
  // AI Config
  const [selectedModel, setSelectedModel] = useState('🍌 Nano Banana Pro');
  const [numImages, setNumImages] = useState(1);
  const [referenceMedia, setReferenceMedia] = useState<any[]>([]);
  
  const [viewMode, setViewMode] = useState<'3D' | 'Image'>('3D');
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<GenHistoryItem[]>([]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const viewportRef = useRef<ViewportHandle>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = 'flow-design-system-css';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      .animate-shimmer { animation: shimmer 1.5s infinite; }
      @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
      html, body, #root { margin: 0; padding: 0; width: 100%; height: 100%; background: #0e0e0e; font-family: 'Google Sans Text', 'Google Sans', sans-serif; letter-spacing: 0.1px; }
      .custom-scrollbar::-webkit-scrollbar { width: 4px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      @keyframes dropdown-enter { from { opacity: 0; transform: scale(0.95) translateY(-5px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      .animate-dropdown { animation: dropdown-enter 0.15s ease-out forwards; }
    `;
    document.head.appendChild(style);
  }, []);

  const handleModelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const newObj: SceneObject = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'Model',
        name: file.name,
        url: url,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      };
      setSceneObjects(prev => [...prev, newObj]);
      setSelectedId(newObj.id);
      setViewMode('3D');
      viewportRef.current?.resetCamera();
    }
    e.target.value = '';
  };

  const addPrimitive = (type: 'Cube' | 'Sphere') => {
    const newObj: SceneObject = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      name: type === 'Cube' ? 'Khối lập phương' : 'Khối cầu',
      position: [0, 1, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1]
    };
    setSceneObjects(prev => [...prev, newObj]);
    setSelectedId(newObj.id);
  };

  const handleUpdateObject = useCallback((id: string, updates: Partial<SceneObject>) => {
    setSceneObjects(prev => prev.map(obj => obj.id === id ? { ...obj, ...updates } : obj));
  }, []);

  const removeObject = (id: string) => {
    setSceneObjects(prev => prev.filter(obj => obj.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setBackgroundUrl(url);
      setViewMode('3D');
    }
  };

  const selectReferenceImages = async () => {
    try {
      const remainingSlots = 9 - referenceMedia.length;
      if (remainingSlots <= 0) return;
      const selected = await Flow.media.selectMultiple({ 
        filter: 'image', 
        maxCount: remainingSlots 
      });
      setReferenceMedia(prev => [...prev, ...selected]);
    } catch (err) {
      console.error("Failed to select media", err);
    }
  };

  const removeReference = (index: number) => {
    setReferenceMedia(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerateImage = async () => {
    if (!framePrompt) return;
    setError(null);
    setIsGenerating(true);
    const lastSelected = selectedId;
    setSelectedId(null); 
    
    try {
      await new Promise(r => setTimeout(r, 200));

      const cap = await viewportRef.current?.capture();
      if (!cap || cap.length < 100) throw new Error("Capture failed.");
      
      const rawBase64 = cap.split(',')[1];
      const uploaded = await Flow.upload({
        base64: rawBase64,
        mimeType: 'image/jpeg',
        name: 'Scene Capture'
      });
      
      const refIds = [uploaded.mediaId, ...referenceMedia.map(m => m.mediaId)];
      const finalPrompt = `[GUIDE: Composition from image 0] User Prompt: ${framePrompt}`;

      const results = await Promise.all(
        Array.from({ length: numImages }).map(() => 
          Flow.generate.image({ 
            prompt: finalPrompt, 
            referenceImageMediaIds: refIds,
            modelDisplayName: selectedModel,
            aspectRatio: aspectRatio
          })
        )
      );

      const firstResult = results[0];
      setGeneratedImage(`data:${firstResult.mimeType};base64,${firstResult.base64}`);
      setViewMode('Image');

      const newHistoryItems: GenHistoryItem[] = results.map((res: { mimeType: string; base64: string }) => ({
        id: Math.random().toString(36).substr(2, 9),
        prompt: framePrompt,
        camera: viewportRef.current?.getCameraState() || { focalLength, position: [12,12,12], rotation: [0,0,0] },
        generatedImage: `data:${res.mimeType};base64,${res.base64}`,
      }));
      setHistory(prev => [...newHistoryItems, ...prev]);
    } catch (err: any) {
      setError(err.message || "Generation failed.");
    } finally {
      setIsGenerating(false);
      setSelectedId(lastSelected);
    }
  };

  const restoreFromHistory = (item: GenHistoryItem) => {
    setFramePrompt(item.prompt);
    setFocalLength(item.camera.focalLength);
    if (item.generatedImage) {
      setGeneratedImage(item.generatedImage);
      setViewMode('Image');
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0e0e0e] text-white overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Panel */}
        <div className="relative border-r border-[rgba(218,220,224,0.15)] flex flex-col items-start overflow-clip px-[10px] py-[12px] w-[300px] h-full bg-[#0e0e0e]">
          <div className="flex flex-col gap-[24px] items-start w-full overflow-y-auto custom-scrollbar pr-1">
            
            <div className="flex flex-col gap-2 items-start w-full">
              <SectionLabel>Scene Configuration</SectionLabel>
              <div className="flex flex-col gap-1.5 w-full">
                <FieldDropdown label="Environment" value={hdriName} options={Object.keys(HDRIS)} onChange={setHdriName} className="w-full" />
                <div className="flex gap-1 w-full">
                  <FieldDropdown label="Ratio" value={aspectRatio} options={['1:1', '16:9', '9:16', '4:3', '3:4']} onChange={(v) => setAspectRatio(v as AspectRatio)} className="flex-1" />
                  <DragNumberField label="Focal" value={focalLength} min={10} max={200} suffix="mm" onChange={setFocalLength} className="flex-1" />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 items-start w-full">
              <SectionLabel>Transform Mode</SectionLabel>
              <div className="flex w-full items-center border border-[#595959] rounded-xl overflow-hidden bg-transparent">
                {(['translate', 'rotate', 'scale'] as const).map(mode => (
                  <button 
                    key={mode}
                    onClick={() => setTransformMode(mode)}
                    className={`flex-1 flex items-center justify-center h-[34px] transition-all ${transformMode === mode ? 'bg-[#969696] text-black' : 'text-white/40 hover:text-white'}`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {mode === 'translate' ? 'open_with' : mode === 'rotate' ? 'restart_alt' : 'aspect_ratio'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 items-start w-full">
              <SectionLabel>Scene Objects</SectionLabel>
              <div className="flex flex-col gap-1.5 w-full">
                <div className="flex gap-1 w-full">
                  <PillButton variant="outline" icon={<span className="material-symbols-outlined text-[18px]">upload_file</span>} onClick={() => modelInputRef.current?.click()} className="flex-1">Add GLB</PillButton>
                  <PillButton variant="outline" icon={<span className="material-symbols-outlined text-[18px]">add_photo_alternate</span>} onClick={() => imageInputRef.current?.click()} className="flex-1">Add BG</PillButton>
                </div>
                <div className="flex gap-1 w-full">
                  <PillButton variant="filled" onClick={() => addPrimitive('Cube')} className="flex-1">Cube</PillButton>
                  <PillButton variant="filled" onClick={() => addPrimitive('Sphere')} className="flex-1">Sphere</PillButton>
                </div>
                
                <div className="mt-2 flex flex-col gap-1 w-full max-h-[200px] overflow-y-auto custom-scrollbar">
                  {sceneObjects.map(obj => (
                    <div key={obj.id} onClick={() => setSelectedId(obj.id)} className={`flex items-center justify-between px-3 py-2 rounded-lg border cursor-pointer transition-all ${selectedId === obj.id ? 'border-[#969696] bg-white/5' : 'border-[#595959] hover:border-[#7a7a7a]'}`}>
                      <span className="text-[11px] truncate w-[160px]">{obj.name}</span>
                      <button onClick={(e) => { e.stopPropagation(); removeObject(obj.id); }} className="text-white/30 hover:text-red-400">
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  ))}
                  {sceneObjects.length === 0 && <p className="text-[10px] text-white/20 text-center py-4 italic">No objects in scene</p>}
                </div>
              </div>
            </div>

            <input type="file" ref={imageInputRef} onChange={handleImageUpload} className="hidden" accept=".png,.jpg,.jpeg,.webp" />
            <input type="file" ref={modelInputRef} onChange={handleModelUpload} className="hidden" accept=".glb,.gltf" />

            <div className="flex flex-col gap-2 items-start w-full">
              <SectionLabel>Pen Overlay</SectionLabel>
              <button 
                onClick={() => setIsDrawingMode(!isDrawingMode)}
                className={`flex items-center gap-2 justify-center w-full h-[34px] rounded-xl transition-all ${isDrawingMode ? 'bg-[#969696] text-black' : 'border border-[#595959] text-white hover:bg-white/5'}`}
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
                <span className="text-[12px]">{isDrawingMode ? 'Drawing...' : 'Enable Pen'}</span>
              </button>
              {isDrawingMode && (
                <div className="flex justify-between items-center bg-[#1a1a1a] p-2 rounded-xl border border-[#595959] w-full">
                  {['#ef4444', '#22c55e', '#3b82f6', '#ffffff'].map((color) => (
                    <button key={color} onClick={() => setDrawColor(color)} className={`w-5 h-5 rounded-full border ${drawColor === color ? 'border-white' : 'border-transparent opacity-60'}`} style={{ backgroundColor: color }} />
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Viewport Area */}
        <div className="flex-1 flex flex-col relative bg-[#09090b] items-center justify-center p-4">
          <div className="absolute top-4 z-50 flex border border-[#595959] rounded-xl overflow-hidden bg-[#0e0e0e]/90 backdrop-blur-md">
            {(['3D', 'Image'] as const).map((mode) => (
              <button key={mode} onClick={() => setViewMode(mode)} className={`px-8 h-[36px] text-[12px] font-medium tracking-[0.2px] transition-all ${viewMode === mode ? 'bg-[#969696] text-black' : 'text-white/60 hover:text-white'}`}>
                {mode === '3D' ? '3D VIEW' : 'RESULT'}
              </button>
            ))}
          </div>

          <div 
            className="relative shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-black overflow-hidden"
            style={{ aspectRatio: aspectRatio.replace(':', '/'), height: 'calc(100vh - 280px)', maxWidth: '100%' }}
          >
            <div className={`absolute inset-0 z-10 transition-opacity duration-300 ${viewMode === '3D' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <ThreeViewport 
                ref={viewportRef} 
                backgroundUrl={backgroundUrl} 
                hdriUrl={HDRIS[hdriName as keyof typeof HDRIS]}
                showTexture={showTexture}
                focalLength={focalLength} 
                objects={sceneObjects} 
                selectedId={selectedId}
                onSelect={setSelectedId}
                onUpdateObject={handleUpdateObject}
                transformMode={transformMode}
                isDrawingMode={isDrawingMode}
                drawColor={drawColor}
                isGenerating={isGenerating}
                viewMode={viewMode}
                aspectRatio={aspectRatio}
              />
            </div>
            <div className={`absolute inset-0 z-20 transition-opacity duration-300 ${viewMode === 'Image' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              {generatedImage ? <img src={generatedImage} className="w-full h-full object-contain" /> : <div className="w-full h-full bg-[#0c0c0e] flex items-center justify-center text-white/10 flex-col gap-2"><span className="material-symbols-outlined text-[48px]">imagesmode</span><p className="text-[12px]">Generate to see results</p></div>}
            </div>

            {isGenerating && (
              <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
                <div className="w-12 h-12 border-2 border-t-white rounded-full animate-spin mb-4 border-white/20" />
                <p className="text-[12px] tracking-[3px] uppercase animate-pulse">Processing idea...</p>
              </div>
            )}
          </div>
          {error && <div className="absolute bottom-8 px-6 py-3 bg-red-900/40 border border-red-500/50 rounded-2xl text-red-200 text-[12px] z-50 backdrop-blur-md">{error}</div>}
        </div>

        <Sidebar history={history} onRestore={restoreFromHistory} />
      </div>

      {/* Bottom Interface */}
      <div className="border-t border-[rgba(218,220,224,0.15)] bg-[#0e0e0e] px-4 py-4 lg:py-6">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-end max-w-[1400px] mx-auto">
          
          {/* Model & Qty Selection */}
          <div className="grid grid-cols-2 lg:flex gap-2 w-full lg:w-auto">
            <FieldDropdown label="AI Model" value={selectedModel} options={AI_MODELS} onChange={setSelectedModel} className="flex-1 lg:w-[200px]" />
            <FieldDropdown label="Qty" value={String(numImages)} options={['1', '2', '4']} onChange={(val) => setNumImages(Number(val))} className="w-full lg:w-[80px]" />
          </div>

          {/* Prompt & References Container */}
          <div className="flex-1 flex flex-col gap-3">
            
            {/* References Scroll */}
            {referenceMedia.length > 0 && (
              <div className="flex gap-2 items-center overflow-x-auto pb-1 custom-scrollbar">
                {referenceMedia.map((media, idx) => (
                  <div key={idx} className="relative group flex-shrink-0">
                    <img src={`data:${media.mimeType};base64,${media.base64}`} className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg object-cover border border-[#595959]" />
                    <button onClick={() => removeReference(idx)} className="absolute -top-1.5 -right-1.5 bg-black border border-[#595959] rounded-full w-5 h-5 flex items-center justify-center text-white/60 hover:text-red-400 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Prompt Input Area */}
            <div className="relative">
              <textarea 
                value={framePrompt}
                onChange={(e) => setFramePrompt(e.target.value)}
                placeholder="Describe your design concept (e.g. Minimalist spaceship, metallic texture, cinematic lighting)..."
                className="border border-[#595959] hover:border-[#7a7a7a] focus:border-[#969696] rounded-2xl w-full h-[60px] lg:h-[70px] px-4 py-3 resize-none bg-[#1a1a1a] text-[13px] text-white focus:outline-none transition-all pr-[160px]"
              />
              <div className="absolute right-2.5 bottom-2.5 flex items-center gap-2">
                <button 
                  onClick={selectReferenceImages}
                  disabled={isGenerating || referenceMedia.length >= 9}
                  className="flex items-center justify-center w-[40px] h-[34px] rounded-xl border border-[#595959] hover:bg-white/5 active:bg-white/10 text-white transition-all disabled:opacity-30"
                  title="Add reference image"
                >
                  <span className="material-symbols-outlined text-[20px]">add_photo_alternate</span>
                </button>
                <PillButton 
                  variant="solid" 
                  disabled={isGenerating || !framePrompt} 
                  icon={<span className="material-symbols-outlined text-[18px]">auto_fix_high</span>} 
                  onClick={handleGenerateImage}
                >
                  Generate
                </PillButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
