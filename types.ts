export interface GeneratedAsset {
  id: string;
  svgContent: string;
  prompt: string;
  style: SvgStyle;
  aspectRatio: AspectRatio;
  createdAt: number;
}

export interface ScriptScene {
  id: string;
  scriptSegment: string;
  visualPrompt: string;
  animationNotes: string;
  durationInFrames: number;
  textPlacement: 'top' | 'bottom' | 'center';
  status: 'pending' | 'generating' | 'completed' | 'error';
  svgContent?: string;
}

export enum SvgStyle {
  FLAT = 'Flat Design',
  PIXEL = 'Pixel Art',
  LINE_ART = 'Line Art',
  ISOMETRIC = 'Isometric',
  LOW_POLY = 'Low Poly',
  HAND_DRAWN = 'Hand Drawn',
  PAINTERLY = 'Vector Painting',
  ABSTRACT = 'Abstract',
  CORPORATE = 'Corporate Memphis',
  MATERIAL = 'Material Design'
}

export enum AspectRatio {
  SQUARE = '1:1',
  LANDSCAPE = '16:9',
  PORTRAIT = '9:16'
}

export const STYLE_DESCRIPTIONS: Record<SvgStyle, string> = {
  [SvgStyle.FLAT]: 'Clean, minimalistic, no gradients, bold solid colors.',
  [SvgStyle.PIXEL]: 'Blocky, retro 8-bit aesthetic, square paths.',
  [SvgStyle.LINE_ART]: 'Black and white, strobed paths, minimal fill.',
  [SvgStyle.ISOMETRIC]: '3D perspective, geometric shapes, technical feel.',
  [SvgStyle.LOW_POLY]: 'Triangular mesh, sharp edges, vibrant geometric shading.',
  [SvgStyle.HAND_DRAWN]: 'Rough edges, sketch-like strokes, organic feel.',
  [SvgStyle.PAINTERLY]: 'Complex layered shapes simulating brush strokes and depth.',
  [SvgStyle.ABSTRACT]: 'Fluid shapes, artistic interpretation, non-representational.',
  [SvgStyle.CORPORATE]: 'Exaggerated proportions, flat colors, modern tech flow.',
  [SvgStyle.MATERIAL]: 'Google Material design, subtle shadows, layered paper look.'
};

export interface GenerateResponse {
  svg: string;
  error?: string;
}