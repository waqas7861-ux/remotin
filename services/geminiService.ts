import { GoogleGenAI, Type } from "@google/genai";
import { SvgStyle, ScriptScene, AspectRatio } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_ID = 'gemini-3-flash-preview';

interface GenerateOptions {
  imageBase64?: string;
  mimeType?: string;
  aspectRatio?: AspectRatio;
  customInstructions?: string;
}

const VIEWBOX_MAP: Record<AspectRatio, string> = {
  [AspectRatio.SQUARE]: "0 0 512 512",
  [AspectRatio.LANDSCAPE]: "0 0 1024 576",
  [AspectRatio.PORTRAIT]: "0 0 576 1024"
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateSvgCode = async (
  prompt: string, 
  style: SvgStyle, 
  options: GenerateOptions = {}
): Promise<string> => {
  
  const { 
    imageBase64, 
    mimeType, 
    aspectRatio = AspectRatio.SQUARE, 
    customInstructions = '' 
  } = options;

  const viewBox = VIEWBOX_MAP[aspectRatio];

  const systemInstruction = `
    You are a world-class SVG (Scalable Vector Graphics) artist and coder specializing in assets for high-end motion graphics (Remotion).
    Your task is to generate professional, clean, and grouped SVG code based on the user's description.
    
    Rules:
    1. Output ONLY the raw XML string for the <svg>...</svg>. Do not wrap it in markdown code blocks (\`\`\`).
    2. The SVG must use a 'viewBox' of "${viewBox}" to match the requested aspect ratio.
    3. **CRITICAL FOR ANIMATION**: Use semantic IDs for major groups (e.g., id="head", id="arm-left", id="background"). Group related elements (<g>) logically so they can be rotated or moved in Remotion.
    4. Ensure the SVG is self-contained. Do not use external links or images.
    5. Optimize for cleanliness; use <path>, <rect>, <circle> efficiently.
    6. Style adherence: Strictly follow the requested visual style (e.g., Flat, Pixel, Line Art, Vector Painting).
       - For "Vector Painting": Use layered paths with varying opacity or gradients to simulate depth and brush strokes.
    7. If the user asks for a 'character', ensure they have a distinct personality, facial features, and correct anatomy.
    8. Use hex codes for colors. Ensure high contrast and professional color palettes.
  `;

  let userPrompt = `
    Create a professional asset/character with the following description: "${prompt}".
    
    Style: ${style}
    
    Technical constraints:
    - ViewBox: ${viewBox}
    - Complexity: High (Professional detail)
    - Output: Pure SVG string.
  `;

  if (customInstructions) {
    userPrompt += `\n\nAdditional Global Instructions: ${customInstructions}`;
  }

  let contents: any = userPrompt;

  if (imageBase64 && mimeType) {
    userPrompt += "\n\nReference Image Instruction: Analyze the attached image deeply. Use this image as the STRICT visual reference for the character design, color palette, and line style. The generated SVG should look like it belongs in the same universe as this image, but performing the action described in the prompt.";
    
    contents = {
      parts: [
        {
          inlineData: {
            mimeType: mimeType,
            data: imageBase64
          }
        },
        {
          text: userPrompt
        }
      ]
    };
  }

  try {
    let retries = 3;
    let waitTime = 2000;
    let response;

    while (true) {
      try {
        response = await ai.models.generateContent({
          model: MODEL_ID,
          contents: contents,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.4, 
            maxOutputTokens: 8192,
          },
        });
        break; // Success, exit loop
      } catch (err: any) {
        const isRateLimit = err.status === 429 || err.code === 429 || (err.message && err.message.includes('429')) || (err.message && err.message.includes('quota'));
        
        if (isRateLimit && retries > 0) {
          console.warn(`Rate limit hit in generateSvgCode. Retrying in ${waitTime}ms...`);
          await delay(waitTime);
          retries--;
          waitTime *= 2; // Exponential backoff
        } else {
          throw err;
        }
      }
    }

    let text = response.text || '';
    
    text = text.replace(/```xml/g, '').replace(/```svg/g, '').replace(/```/g, '').trim();
    
    if (!text.startsWith('<svg') && !text.includes('<svg')) {
      throw new Error("Model failed to generate valid SVG markup.");
    }

    return text;

  } catch (error) {
    console.error("Gemini SVG Generation Error:", error);
    throw error;
  }
};

export const enhancePrompt = async (
  simplePrompt: string, 
  style: SvgStyle,
  customInstructions: string = ''
): Promise<string> => {
  const prompt = `
    You are a professional prompt engineer for generative art.
    Refine and expand the following simple concept into a highly detailed, descriptive visual prompt suitable for generating a professional SVG or illustration.
    
    Concept: "${simplePrompt}"
    Target Style: ${style}
    ${customInstructions ? `Additional Instructions: ${customInstructions}` : ''}
    
    Guidelines:
    - Include specific details about lighting, composition, colors, and mood.
    - explicitly mention visual elements characteristic of the "${style}" style.
    - Keep it concise but descriptive (approx 40-60 words).
    - Do NOT include the SVG code, just the text prompt description.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 200,
      }
    });
    return response.text?.trim() || simplePrompt;
  } catch (error) {
    console.error("Prompt Enhancement Error:", error);
    return simplePrompt;
  }
};

export const breakdownScript = async (
  script: string, 
  style: SvgStyle,
  mode: 'scene' | 'timeline'
): Promise<Omit<ScriptScene, 'status'>[]> => {
  
  let breakdownPrompt = "";
  
  if (mode === 'timeline') {
    breakdownPrompt = `
      Analyze the following transcript/script and break it down into a HIGHLY GRANULAR sequence of visual assets.
      
      CRITICAL INSTRUCTION:
      - You MUST split the script into short, punchy visual segments (every 2-5 seconds).
      - Create a new visual scene for EVERY distinct phrase, keyword, noun, or action.
      - Do NOT group multiple ideas into one scene. Split them!
      
      Example splitting:
      "The sun hammers Earth with energy" ->
      1. "The Sun" (Visual: Blazing sun)
      2. "Hammers Earth" (Visual: Sun rays hitting the planet violently)
      3. "With Energy" (Visual: Glowing energetic waves or battery charging)
    `;
  } else {
    breakdownPrompt = `
      Analyze the following video script and break it down into distinct visual scenes.
      
      Strategy: SCENE / NARRATIVE MODE
      - Even in narrative mode, ensure long sentences are split if the visual subject changes.
      - Create a new scene whenever the subject matter changes significantly.
      - Do not simply create one scene per sentence if the sentence is complex. Break it up.
    `;
  }

  const prompt = `
    ${breakdownPrompt}
    
    For each segment, provide:
    1. The exact segment of the script text to display on screen.
    2. A highly detailed visual description (visualPrompt) for an SVG illustration. Use keywords for "${style}".
    3. **animationNotes**: A short, technical instruction for a motion graphics editor (using Remotion/After Effects) on how to animate this SVG. e.g., "Rotate the robot arm", "Scale up the background", "Wiggle the eyebrows".
    4. **durationInSeconds**: Estimate the time (in seconds) it takes to read this segment. Keep it short (2-5s) to maintain pace.
    5. **textPlacement**: Analyze the visual composition described in step 2. Where is the best place to put the script text so it does not obscure the main subject? Options: "top", "bottom", "center".
    
    Output JSON.
  `;

  try {
    let retries = 3;
    let waitTime = 2000;
    let response;

    while (true) {
      try {
        response = await ai.models.generateContent({
          model: MODEL_ID,
          contents: [
            { text: prompt },
            { text: `SCRIPT:\n${script}` }
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  scriptSegment: { type: Type.STRING },
                  visualPrompt: { type: Type.STRING },
                  animationNotes: { type: Type.STRING, description: "Instructions for animating the SVG in Remotion" },
                  durationInSeconds: { type: Type.NUMBER, description: "Estimated duration in seconds" },
                  textPlacement: { type: Type.STRING, enum: ["top", "bottom", "center"] }
                },
                required: ["scriptSegment", "visualPrompt", "animationNotes", "durationInSeconds", "textPlacement"],
              }
            }
          }
        });
        break;
      } catch (err: any) {
        const isRateLimit = err.status === 429 || err.code === 429 || (err.message && err.message.includes('429')) || (err.message && err.message.includes('quota'));
        
        if (isRateLimit && retries > 0) {
          console.warn(`Rate limit hit in breakdownScript. Retrying in ${waitTime}ms...`);
          await delay(waitTime);
          retries--;
          waitTime *= 2;
        } else {
          throw err;
        }
      }
    }

    const data = JSON.parse(response.text || '[]');
    
    return data.map((item: any) => ({
      id: crypto.randomUUID(),
      scriptSegment: item.scriptSegment,
      visualPrompt: item.visualPrompt,
      animationNotes: item.animationNotes || "Fade in element",
      durationInFrames: Math.ceil((item.durationInSeconds || 3) * 30), // 30fps assumption
      textPlacement: item.textPlacement || 'bottom'
    }));

  } catch (error) {
    console.error("Script Breakdown Error:", error);
    throw error;
  }
};