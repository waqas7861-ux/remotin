import React, { useState, useRef } from 'react';
import { generateSvgCode, enhancePrompt } from '../services/geminiService';
import { GeneratedAsset, SvgStyle, STYLE_DESCRIPTIONS, AspectRatio } from '../types';
import { STYLE_OPTIONS, DEFAULT_PROMPT } from '../constants';
import { Loader2, Sparkles, Image as ImageIcon, X, Upload, Wand2, Monitor, Smartphone, Square } from 'lucide-react';

interface GeneratorProps {
  onGenerate: (asset: GeneratedAsset) => void;
}

export const Generator: React.FC<GeneratorProps> = ({ onGenerate }) => {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [style, setStyle] = useState<SvgStyle>(SvgStyle.FLAT);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.SQUARE);
  const [loading, setLoading] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setError(null);
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

  const handleEnhance = async () => {
    if (!prompt.trim()) return;
    setEnhancing(true);
    try {
      const enhanced = await enhancePrompt(prompt, style);
      setPrompt(enhanced);
    } catch (err) {
      console.error("Failed to enhance prompt");
    } finally {
      setEnhancing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);

    try {
      let base64Data = undefined;
      let mimeType = undefined;

      if (selectedImage && imagePreview) {
        const matches = imagePreview.match(/^data:(.+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          mimeType = matches[1];
          base64Data = matches[2];
        }
      }

      const svgContent = await generateSvgCode(
        prompt, 
        style, 
        {
          imageBase64: base64Data,
          mimeType: mimeType,
          aspectRatio: aspectRatio
        }
      );
      
      const newAsset: GeneratedAsset = {
        id: crypto.randomUUID(),
        prompt,
        style,
        aspectRatio,
        svgContent,
        createdAt: Date.now(),
      };

      onGenerate(newAsset);
    } catch (err: any) {
      setError(err.message || "Failed to generate SVG. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      
      {/* Prompt Input */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label htmlFor="prompt" className="text-sm font-medium text-slate-300">
            Character Description
          </label>
          <button
            type="button"
            onClick={handleEnhance}
            disabled={enhancing || !prompt.trim()}
            className="text-xs flex items-center gap-1 text-primary hover:text-white transition-colors disabled:opacity-50"
          >
            {enhancing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
            {enhancing ? 'Enhancing...' : 'Magic Enhance'}
          </button>
        </div>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full h-32 p-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none transition-all"
          placeholder="e.g. A cyberpunk ninja cat with neon glowing eyes..."
        />
      </div>

      {/* Reference Image Input */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-300 flex items-center justify-between">
          <span>Reference Image <span className="text-slate-500 font-normal">(Optional)</span></span>
        </label>
        
        {!imagePreview ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 rounded-lg p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-800/50 hover:border-primary/50 transition-all group"
          >
            <div className="p-3 rounded-full bg-slate-800 group-hover:bg-slate-700 transition-colors">
              <Upload className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
            </div>
            <p className="text-xs text-slate-500 text-center">
              Click to upload a reference image<br/>
              <span className="opacity-70">to copy style or pose</span>
            </p>
          </div>
        ) : (
          <div className="relative rounded-lg overflow-hidden border border-slate-700 bg-slate-800 p-2 flex items-center gap-3">
             <div className="h-16 w-16 rounded bg-slate-900 flex-shrink-0 relative overflow-hidden">
                <img 
                  src={imagePreview} 
                  alt="Reference" 
                  className="w-full h-full object-cover" 
                />
             </div>
             <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200 truncate">{selectedImage?.name}</p>
                <p className="text-xs text-slate-500">{(selectedImage!.size / 1024).toFixed(1)} KB</p>
             </div>
             <button
               type="button"
               onClick={removeImage}
               className="p-2 rounded-full hover:bg-slate-700 text-slate-400 hover:text-red-400 transition-colors"
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

      <div className="grid grid-cols-2 gap-4">
        {/* Aspect Ratio Selection */}
        <div className="flex flex-col gap-2">
          <label htmlFor="ratio" className="text-sm font-medium text-slate-300">
            Dimensions & Ratio
          </label>
          <div className="relative">
            <select
              id="ratio"
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
              className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none appearance-none cursor-pointer"
            >
              <option value={AspectRatio.SQUARE}>Square (1:1) - 512px</option>
              <option value={AspectRatio.LANDSCAPE}>Landscape (16:9) - 1080p</option>
              <option value={AspectRatio.PORTRAIT}>Portrait (9:16) - Mobile</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-400">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
            </div>
            
            {/* Icon Preview */}
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              {aspectRatio === AspectRatio.SQUARE && <Square className="w-4 h-4" />}
              {aspectRatio === AspectRatio.LANDSCAPE && <Monitor className="w-4 h-4" />}
              {aspectRatio === AspectRatio.PORTRAIT && <Smartphone className="w-4 h-4" />}
            </div>
          </div>
        </div>

        {/* Style Selection */}
        <div className="flex flex-col gap-2">
          <label htmlFor="style" className="text-sm font-medium text-slate-300">
            Art Style
          </label>
          <div className="relative">
            <select
              id="style"
              value={style}
              onChange={(e) => setStyle(e.target.value as SvgStyle)}
              className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none appearance-none cursor-pointer"
            >
              {STYLE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-400">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
            </div>
          </div>
        </div>
      </div>
      
      <p className="text-xs text-slate-500 -mt-2">
        {STYLE_DESCRIPTIONS[style]}
      </p>

      {/* Error Message */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !prompt.trim()}
        className={`
          flex items-center justify-center gap-2 p-3 rounded-lg font-semibold text-white transition-all
          ${loading 
            ? 'bg-slate-700 cursor-not-allowed' 
            : 'bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-[0.98]'
          }
        `}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Generate Asset
          </>
        )}
      </button>
    </form>
  );
};