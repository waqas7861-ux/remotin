import React, { useState, useRef } from 'react';
import { breakdownScript, generateSvgCode } from '../services/geminiService';
import { ScriptScene, SvgStyle, AspectRatio, STYLE_DESCRIPTIONS } from '../types';
import { STYLE_OPTIONS } from '../constants';
import { Loader2, Clapperboard, Play, CheckCircle2, AlertCircle, Wand2, Download, Copy, Film, Settings, ListVideo, MonitorPlay, FileText, Upload, X, Clock, AlignVerticalJustifyCenter, AlignVerticalJustifyStart, AlignVerticalJustifyEnd } from 'lucide-react';

export const StoryGenerator: React.FC = () => {
  const [script, setScript] = useState('');
  const [style, setStyle] = useState<SvgStyle>(SvgStyle.FLAT);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.SQUARE);
  const [breakdownMode, setBreakdownMode] = useState<'scene' | 'timeline'>('timeline'); // Default to 'timeline' for granular syncing
  const [customInstructions, setCustomInstructions] = useState('');
  
  // Image Reference State
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [scenes, setScenes] = useState<ScriptScene[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [step, setStep] = useState<'input' | 'review' | 'results'>('input');
  const [sequenceCopied, setSequenceCopied] = useState(false);
  const [promptsCopied, setPromptsCopied] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size must be less than 5MB");
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = async () => {
    if (!script.trim()) return;
    setIsAnalyzing(true);
    try {
      const rawScenes = await breakdownScript(script, style, breakdownMode);
      const initialScenes: ScriptScene[] = rawScenes.map(s => ({
        ...s,
        status: 'pending'
      }));
      setScenes(initialScenes);
      setStep('review');
    } catch (error) {
      console.error(error);
      alert("Failed to analyze script. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateAll = async () => {
    setStep('results');
    setIsGenerating(true);

    const newScenes = [...scenes];
    
    // Prepare image data if available
    let base64Data = undefined;
    let mimeType = undefined;
    if (selectedImage && imagePreview) {
      const matches = imagePreview.match(/^data:(.+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        mimeType = matches[1];
        base64Data = matches[2];
      }
    }
    
    // Process sequentially to avoid rate limits
    for (let i = 0; i < newScenes.length; i++) {
      newScenes[i].status = 'generating';
      setScenes([...newScenes]);

      try {
        const svg = await generateSvgCode(
          newScenes[i].visualPrompt, 
          style, 
          { 
            aspectRatio, 
            customInstructions,
            imageBase64: base64Data,
            mimeType: mimeType
          }
        );
        newScenes[i].svgContent = svg;
        newScenes[i].status = 'completed';
      } catch (error) {
        console.error(error);
        newScenes[i].status = 'error';
      }
      setScenes([...newScenes]);

      // Add a 3-second delay between requests to avoid rate limits
      if (i < newScenes.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    setIsGenerating(false);
  };

  const updatePrompt = (id: string, newPrompt: string) => {
    setScenes(prev => prev.map(s => s.id === id ? { ...s, visualPrompt: newPrompt } : s));
  };
  
  const updateDuration = (id: string, newDuration: number) => {
    setScenes(prev => prev.map(s => s.id === id ? { ...s, durationInFrames: newDuration } : s));
  };

  const updatePlacement = (id: string, placement: 'top' | 'bottom' | 'center') => {
    setScenes(prev => prev.map(s => s.id === id ? { ...s, textPlacement: placement } : s));
  };

  const removeScene = (id: string) => {
    setScenes(prev => prev.filter(s => s.id !== id));
  };

  const handleCopyPrompts = () => {
    const text = scenes.map((s, i) => {
       return `[Scene ${i+1}]\nPrompt: ${s.visualPrompt}\nAnimation: ${s.animationNotes}\nDuration: ${s.durationInFrames} frames\nText: "${s.scriptSegment}" (${s.textPlacement})\n`;
    }).join('\n-------------------\n');
    
    navigator.clipboard.writeText(text);
    setPromptsCopied(true);
    setTimeout(() => setPromptsCopied(false), 2000);
  };

  const cleanSvgForJsx = (svg: string) => {
    return svg
      .replace(/class="/g, 'className="')
      .replace(/stroke-width/g, 'strokeWidth')
      .replace(/stroke-linecap/g, 'strokeLinecap')
      .replace(/stroke-linejoin/g, 'strokeLinejoin')
      .replace(/fill-rule/g, 'fillRule')
      .replace(/clip-rule/g, 'clipRule')
      .replace(/text-anchor/g, 'textAnchor')
      .replace(/stop-color/g, 'stopColor')
      .replace(/stop-opacity/g, 'stopOpacity')
      .replace(/fill-opacity/g, 'fillOpacity')
      .replace(/stroke-opacity/g, 'strokeOpacity');
  };

  const copyComponent = (scene: ScriptScene, index: number) => {
     if (!scene.svgContent) return;
     const componentName = `Scene${index + 1}`;
     const code = `
/**
 * SCENE ${index + 1}
 * Script: "${scene.scriptSegment}"
 * Text Placement: ${scene.textPlacement}
 * 
 * ANIMATION INSTRUCTIONS:
 * ${scene.animationNotes}
 */
export const ${componentName} = () => (
  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    ${cleanSvgForJsx(scene.svgContent)}
  </div>
);`;
     navigator.clipboard.writeText(code);
  };

  const copyFullSequence = () => {
    const completedScenes = scenes.filter(s => s.status === 'completed' && s.svgContent);
    if (completedScenes.length === 0) return;

    // 1. Generate SVG Components
    const componentDefinitions = completedScenes.map((scene, index) => {
      const compName = `SvgAsset${index + 1}`;
      return `
// SVG Asset for Scene ${index + 1}
const ${compName} = () => (
  <div className="w-full h-full flex items-center justify-center">
    ${cleanSvgForJsx(scene.svgContent!)}
  </div>
);`;
    }).join('\n');

    // 2. Generate Scene Wrappers (SVG + Text)
    const sceneWrappers = completedScenes.map((scene, index) => {
      const svgCompName = `SvgAsset${index + 1}`;
      const wrapperName = `Scene${index + 1}`;
      
      return `
// SCENE ${index + 1} COMPOSITION
// Script: "${scene.scriptSegment}"
// Animation: ${scene.animationNotes}
const ${wrapperName} = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#fff' }}>
      {/* 1. Visual Asset */}
      <AbsoluteFill>
         <${svgCompName} />
      </AbsoluteFill>
      
      {/* 2. Text Overlay */}
      <CosmicText 
        text="${scene.scriptSegment.replace(/"/g, '\\"')}" 
        position="${scene.textPlacement}" 
      />
    </AbsoluteFill>
  );
};`;
    }).join('\n');

    // 3. Generate Sequence
    let currentFrame = 0;
    const sequenceItems = completedScenes.map((scene, index) => {
       const startFrame = currentFrame;
       const duration = scene.durationInFrames || 90;
       currentFrame += duration;
       
       return `
      <Sequence from={${startFrame}} durationInFrames={${duration}}>
        <Scene${index + 1} />
      </Sequence>`;
    }).join('\n');

    const totalFrames = currentFrame;
    const totalDurationSec = (totalFrames / 30).toFixed(1);

    const fullCode = `import { Sequence, AbsoluteFill } from 'remotion';
// Note: For best results, install a cool font like Orbitron:
// npm install @remotion/google-fonts
// import { Orbitron } from '@remotion/google-fonts/Orbitron';

// --- Shared Components ---

const CosmicText = ({ text, position }) => {
  const getPositionStyle = (pos) => {
    switch(pos) {
      case 'top': return { top: '10%', bottom: 'auto' };
      case 'bottom': return { bottom: '10%', top: 'auto' };
      case 'center': return { top: '50%', transform: 'translateY(-50%)' };
      default: return { bottom: '10%' };
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        width: '80%',
        left: '10%',
        textAlign: 'center',
        fontFamily: "'Courier New', monospace", // Replace with 'Orbitron' if installed
        fontSize: '40px',
        fontWeight: 'bold',
        color: '#ffffff',
        textTransform: 'uppercase',
        textShadow: '0 0 10px #8b5cf6, 0 0 20px #8b5cf6, 0 0 30px #8b5cf6', // Cosmic purple glow
        zIndex: 100,
        ...getPositionStyle(position),
      }}
    >
      {text}
    </div>
  );
};

// --- Generated SVG Assets ---
${componentDefinitions}

// --- Scene Compositions (SVG + Text) ---
${sceneWrappers}

// --- Main Sequence ---
// Total Duration: ${totalFrames} frames (~${totalDurationSec}s)
export const StoryboardComposition = () => {
  return (
    <div style={{ flex: 1, backgroundColor: '#000000' }}>
      ${sequenceItems}
    </div>
  );
};`;

    navigator.clipboard.writeText(fullCode);
    setSequenceCopied(true);
    setTimeout(() => setSequenceCopied(false), 2000);
  };

  const downloadSvg = (scene: ScriptScene, index: number) => {
    if (!scene.svgContent) return;
    const blob = new Blob([scene.svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `scene-${index + 1}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-4 text-sm font-medium text-slate-500 mb-8">
        <div className={`flex items-center gap-2 ${step === 'input' ? 'text-primary' : 'text-slate-300'}`}>
          <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center">1</span>
          Setup & Script
        </div>
        <div className="w-8 h-[1px] bg-slate-700" />
        <div className={`flex items-center gap-2 ${step === 'review' ? 'text-primary' : step === 'results' ? 'text-slate-300' : 'text-slate-600'}`}>
          <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center">2</span>
          Plan
        </div>
        <div className="w-8 h-[1px] bg-slate-700" />
        <div className={`flex items-center gap-2 ${step === 'results' ? 'text-primary' : 'text-slate-600'}`}>
          <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center">3</span>
          Assets
        </div>
      </div>

      {step === 'input' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Script Input */}
          <div className="lg:col-span-2 bg-surface rounded-xl border border-slate-700 p-6 shadow-lg flex flex-col">
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
               <Clapperboard className="w-5 h-5 text-primary" />
               Script or Transcript
             </h2>
             
             <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              className="flex-1 min-h-[300px] p-4 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none mb-4 font-mono text-sm leading-relaxed"
              placeholder="Paste your video script or audio transcript here..."
            />
            
            <div className="flex justify-end">
              <button
                onClick={handleAnalyze}
                disabled={!script.trim() || isAnalyzing}
                className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all shadow-lg shadow-primary/20 w-full sm:w-auto justify-center"
              >
                {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                Analyze & Plan
              </button>
            </div>
          </div>

          {/* Configuration Panel */}
          <div className="bg-surface rounded-xl border border-slate-700 p-6 shadow-lg space-y-6 h-fit">
            <h2 className="text-lg font-semibold flex items-center gap-2 border-b border-slate-700 pb-2">
              <Settings className="w-4 h-4 text-slate-400" />
              Settings
            </h2>

             {/* Reference Image Input (Added for consistent characters) */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-300 flex items-center justify-between">
                <span>Reference Style/Character</span>
              </label>
              
              {!imagePreview ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 rounded-lg p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-800/50 hover:border-primary/50 transition-all group"
                >
                  <div className="p-2 rounded-full bg-slate-800 group-hover:bg-slate-700 transition-colors">
                    <Upload className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-[10px] text-slate-500 text-center">
                    Upload image to match character/style
                  </p>
                </div>
              ) : (
                <div className="relative rounded-lg overflow-hidden border border-slate-700 bg-slate-800 p-2 flex items-center gap-3">
                  <div className="h-12 w-12 rounded bg-slate-900 flex-shrink-0 relative overflow-hidden">
                      <img 
                        src={imagePreview} 
                        alt="Reference" 
                        className="w-full h-full object-cover" 
                      />
                  </div>
                  <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-200 truncate">{selectedImage?.name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={removeImage}
                    className="p-1 rounded-full hover:bg-slate-700 text-slate-400 hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden" 
              />
            </div>

            {/* Breakdown Mode */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 block">Breakdown Method</label>
              <div className="grid grid-cols-2 gap-2 bg-slate-800 p-1 rounded-lg border border-slate-700">
                <button
                  onClick={() => setBreakdownMode('scene')}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-md text-xs font-medium transition-all ${
                    breakdownMode === 'scene' 
                      ? 'bg-slate-700 text-white shadow-sm ring-1 ring-slate-600' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ListVideo className="w-4 h-4 mb-1" />
                  Scene by Scene
                </button>
                <button
                  onClick={() => setBreakdownMode('timeline')}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-md text-xs font-medium transition-all ${
                    breakdownMode === 'timeline' 
                      ? 'bg-slate-700 text-white shadow-sm ring-1 ring-slate-600' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <MonitorPlay className="w-4 h-4 mb-1" />
                  Timeline / Beat
                </button>
              </div>
            </div>

            {/* Visual Style */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 block">Visual Style</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value as SvgStyle)}
                className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white focus:ring-1 focus:ring-primary outline-none"
              >
                {STYLE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* Aspect Ratio */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 block">Output Ratio</label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white focus:ring-1 focus:ring-primary outline-none"
              >
                <option value={AspectRatio.SQUARE}>Square (1:1) - 512x512</option>
                <option value={AspectRatio.LANDSCAPE}>Landscape (16:9) - 1024x576</option>
                <option value={AspectRatio.PORTRAIT}>Portrait (9:16) - 576x1024</option>
              </select>
            </div>

            {/* Custom Instructions */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 block">
                Global Instructions <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <textarea
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                className="w-full h-24 p-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs placeholder-slate-500 focus:ring-1 focus:ring-primary outline-none resize-none"
                placeholder="e.g. Use a blue and purple color palette. Make all characters look like robots."
              />
            </div>

          </div>
        </div>
      )}

      {step === 'review' && (
        <div className="space-y-6">
           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Review Plan</h2>
                <p className="text-sm text-slate-500">
                  Found {scenes.length} {breakdownMode === 'timeline' ? 'segments' : 'scenes'} based on your script.
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                 <button
                  onClick={() => setStep('input')}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleCopyPrompts}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    promptsCopied 
                      ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                      : 'bg-slate-800 text-white border border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {promptsCopied ? <CheckCircle2 className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  {promptsCopied ? 'Copied!' : 'Copy Prompts'}
                </button>
                <button
                  onClick={handleGenerateAll}
                  className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Generate All Assets
                </button>
              </div>
           </div>
           
           <div className="grid gap-4">
              {scenes.map((scene, index) => (
                <div key={scene.id} className="bg-surface border border-slate-700 rounded-lg p-4 flex gap-4 items-start group hover:border-slate-600 transition-colors">
                   <div className="bg-slate-800 w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 text-slate-500 font-bold border border-slate-700">
                     {index + 1}
                   </div>
                   <div className="flex-1 space-y-3">
                      <div className="flex gap-4">
                        <div className="flex-1 bg-slate-800/50 p-3 rounded-md border border-slate-700/50">
                          <p className="text-xs text-slate-500 uppercase font-semibold mb-1">
                            {breakdownMode === 'timeline' ? 'Transcript Segment' : 'Script Scene'}
                          </p>
                          <p className="text-sm text-slate-300 italic">"{scene.scriptSegment}"</p>
                        </div>
                        <div className="flex-1 bg-indigo-900/20 p-3 rounded-md border border-indigo-500/20">
                          <p className="text-xs text-indigo-400 uppercase font-semibold mb-1">
                             Animation Suggestion
                          </p>
                          <p className="text-sm text-indigo-200">{scene.animationNotes}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-4 items-end">
                         <div className="flex-1">
                            <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Visual Prompt</p>
                            <textarea
                              value={scene.visualPrompt}
                              onChange={(e) => updatePrompt(scene.id, e.target.value)}
                              className="w-full h-20 p-3 rounded bg-slate-900 border border-slate-700 text-sm text-slate-200 focus:border-primary outline-none"
                            />
                         </div>
                         <div className="w-32 space-y-2">
                           <div>
                              <p className="text-xs text-slate-500 uppercase font-semibold mb-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Duration
                              </p>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  value={scene.durationInFrames}
                                  onChange={(e) => updateDuration(scene.id, parseInt(e.target.value) || 0)}
                                  className="w-16 p-2 rounded bg-slate-900 border border-slate-700 text-sm text-slate-200 focus:border-primary outline-none"
                                />
                                <span className="text-[10px] text-slate-500">
                                  {(scene.durationInFrames / 30).toFixed(1)}s
                                </span>
                              </div>
                           </div>
                           <div>
                              <p className="text-xs text-slate-500 uppercase font-semibold mb-1 flex items-center gap-1">
                                <AlignVerticalJustifyCenter className="w-3 h-3" /> Text Pos
                              </p>
                              <div className="flex bg-slate-900 rounded border border-slate-700 p-0.5">
                                 <button 
                                  onClick={() => updatePlacement(scene.id, 'top')}
                                  className={`flex-1 p-1 rounded hover:bg-slate-700 ${scene.textPlacement === 'top' ? 'bg-slate-700 text-primary' : 'text-slate-500'}`}
                                  title="Top"
                                 >
                                   <AlignVerticalJustifyStart className="w-4 h-4 mx-auto" />
                                 </button>
                                 <button 
                                  onClick={() => updatePlacement(scene.id, 'center')}
                                  className={`flex-1 p-1 rounded hover:bg-slate-700 ${scene.textPlacement === 'center' ? 'bg-slate-700 text-primary' : 'text-slate-500'}`}
                                  title="Center"
                                 >
                                   <AlignVerticalJustifyCenter className="w-4 h-4 mx-auto" />
                                 </button>
                                 <button 
                                  onClick={() => updatePlacement(scene.id, 'bottom')}
                                  className={`flex-1 p-1 rounded hover:bg-slate-700 ${scene.textPlacement === 'bottom' ? 'bg-slate-700 text-primary' : 'text-slate-500'}`}
                                  title="Bottom"
                                 >
                                   <AlignVerticalJustifyEnd className="w-4 h-4 mx-auto" />
                                 </button>
                              </div>
                           </div>
                         </div>
                      </div>
                   </div>
                   <button 
                     onClick={() => removeScene(scene.id)}
                     className="text-slate-500 hover:text-red-400 p-2"
                     title="Remove"
                   >
                     <AlertCircle className="w-5 h-5" />
                   </button>
                </div>
              ))}
           </div>
        </div>
      )}

      {step === 'results' && (
        <div className="space-y-6">
           <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : <CheckCircle2 className="w-5 h-5 text-green-500" />}
                {isGenerating ? 'Generating Assets...' : 'Generation Complete'}
              </h2>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={copyFullSequence}
                  disabled={isGenerating || scenes.some(s => s.status === 'generating')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    sequenceCopied 
                      ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                      : 'bg-slate-800 text-white border border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {sequenceCopied ? <CheckCircle2 className="w-4 h-4" /> : <Film className="w-4 h-4" />}
                  {sequenceCopied ? 'Copied Sequence!' : 'Copy Remotion Sequence'}
                </button>

                <button
                  onClick={() => setStep('input')}
                  className="text-slate-400 hover:text-white text-sm px-2"
                >
                  Start New Story
                </button>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {scenes.map((scene, index) => (
                <div key={scene.id} className="bg-surface border border-slate-700 rounded-xl overflow-hidden shadow-lg flex flex-col">
                   <div 
                      className={`relative flex items-center justify-center p-4 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-slate-900 
                        ${aspectRatio === AspectRatio.LANDSCAPE ? 'aspect-video' : aspectRatio === AspectRatio.PORTRAIT ? 'aspect-[9/16]' : 'aspect-square'}`}
                    >
                      {scene.status === 'completed' && scene.svgContent ? (
                        <div 
                          className="w-full h-full flex items-center justify-center filter drop-shadow-lg"
                          dangerouslySetInnerHTML={{ __html: scene.svgContent }}
                        />
                      ) : scene.status === 'generating' ? (
                        <div className="flex flex-col items-center gap-3 text-primary animate-pulse">
                           <Loader2 className="w-8 h-8 animate-spin" />
                           <span className="text-sm font-medium">Drawing...</span>
                        </div>
                      ) : scene.status === 'error' ? (
                        <div className="flex flex-col items-center gap-2 text-red-400">
                           <AlertCircle className="w-8 h-8" />
                           <span className="text-sm">Generation Failed</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-slate-600">
                           <div className="w-8 h-8 rounded-full border-2 border-slate-700 border-t-slate-500 animate-spin" />
                           <span className="text-sm">Waiting...</span>
                        </div>
                      )}
                      
                      {/* Text Overlay Preview */}
                      {scene.status === 'completed' && (
                         <div 
                           className={`absolute w-[80%] text-center text-white font-mono font-bold uppercase z-10 p-2 drop-shadow-md pointer-events-none
                             ${scene.textPlacement === 'top' ? 'top-[10%]' : scene.textPlacement === 'bottom' ? 'bottom-[10%]' : 'top-1/2 -translate-y-1/2'}
                           `}
                           style={{ textShadow: '0 0 10px #8b5cf6, 0 0 20px #8b5cf6' }}
                         >
                           {scene.scriptSegment}
                         </div>
                      )}

                      <div className="absolute top-2 left-2 bg-slate-800/80 backdrop-blur px-2 py-1 rounded text-xs font-bold text-white border border-slate-600 z-20">
                        #{index + 1}
                      </div>
                   </div>
                   
                   <div className="p-4 border-t border-slate-700 flex-1 flex flex-col">
                      <div className="mb-3">
                         <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Animation</span>
                         <p className="text-xs text-indigo-200 mt-1">{scene.animationNotes}</p>
                      </div>
                      
                      <div className="flex justify-between items-start mb-2 pt-2 border-t border-slate-800">
                         <p className="text-xs text-slate-500 line-clamp-2 flex-1 mr-2" title={scene.visualPrompt}>
                           {scene.visualPrompt}
                         </p>
                         <div className="flex flex-col items-end gap-1">
                            <span className="text-[10px] text-slate-600 whitespace-nowrap bg-slate-800 px-1 rounded">
                              {scene.durationInFrames}f
                            </span>
                            <span className="text-[10px] text-slate-500">
                              Text: {scene.textPlacement}
                            </span>
                         </div>
                      </div>
                      
                      <div className="mt-auto flex gap-2 pt-2">
                         <button
                           onClick={() => copyComponent(scene, index)}
                           disabled={scene.status !== 'completed'}
                           className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 text-xs py-2 px-3 rounded flex items-center justify-center gap-2 transition-colors border border-slate-600"
                         >
                           <Copy className="w-3 h-3" /> Component
                         </button>
                         <button
                           onClick={() => downloadSvg(scene, index)}
                           disabled={scene.status !== 'completed'}
                           className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 text-xs py-2 px-3 rounded flex items-center justify-center gap-2 transition-colors border border-slate-600"
                         >
                           <Download className="w-3 h-3" /> SVG
                         </button>
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

    </div>
  );
};