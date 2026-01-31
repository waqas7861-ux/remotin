import { SvgStyle } from './types';

export const DEFAULT_PROMPT = "A friendly robot mascot waving hello";

export const STYLE_OPTIONS = Object.values(SvgStyle);

export const PLACEHOLDER_SVG = `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-slate-700">
  <rect width="400" height="300" fill="#1e293b" rx="12" />
  <circle cx="200" cy="150" r="40" fill="#334155" />
  <path d="M160 150 L240 150" stroke="#475569" stroke-width="4" stroke-linecap="round" />
  <path d="M200 110 L200 190" stroke="#475569" stroke-width="4" stroke-linecap="round" />
  <text x="200" y="240" font-family="sans-serif" font-size="14" fill="#64748b" text-anchor="middle">Your SVG will appear here</text>
</svg>`;
