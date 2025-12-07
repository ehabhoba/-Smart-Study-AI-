import { GoogleGenAI, Type, Modality } from "@google/genai";
import { StudyAnalysisResult, SummaryType, DeepDiveResponse, ComplexityLevel } from "../types";

/**
 * Helper to clean JSON string from Markdown code blocks and extraneous text.
 * Also handles common JSON syntax errors like trailing commas.
 */
function cleanJson(text: string): string {
  // 1. Remove Markdown code blocks
  let cleaned = text.replace(/```json\s*|```/g, '').trim();
  
  // 2. Locate the JSON object
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  // 3. Remove trailing commas (Common AI generation error: {"key": "value",})
  // This regex finds a comma followed immediately by a closing brace or bracket, ignoring whitespace
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');

  return cleaned;
}

export const analyzeText = async (
  apiKey: string,
  content: { text?: string, image?: { data: string, mimeType: string } },
  summaryType: SummaryType,
  maxSections?: number,
  extractedImagesCount?: number
): Promise<StudyAnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey });

  let summaryInstructions = "";
  switch (summaryType) {
    case SummaryType.EXAM:
      summaryInstructions = "Strictly focus on exam-critical content: Definitions, Theorems, Laws, Dates, and Formulas. Exclude introductions and filler text.";
      break;
    case SummaryType.MEDIUM:
      summaryInstructions = "Provide a balanced professional summary. Explain core concepts clearly, provide examples, and highlight key takeaways.";
      break;
    case SummaryType.FULL:
      summaryInstructions = "Produce a comprehensive, master-level reference. Cover every chapter, section, and nuance. Include detailed derivations and extensive data analysis.";
      break;
  }

  if (maxSections) {
    summaryInstructions += ` The summary should be structured into approximately ${maxSections} main sections.`;
  }

  const systemPrompt = `
    You are an **Elite Polymath Academic Consultant**. Your capability extends across all disciplines: **Mathematics, Applied Sciences, History, Geography, Economics, Literature, and Linguistics**.
    
    **CORE DIRECTIVE: STRICT LANGUAGE MIRRORING**
    - Detect the dominant language of the input (Arabic, English, French, Spanish, etc.).
    - **ALL OUTPUT** (Summary, Overview, Q&A, Chart Labels) **MUST BE** in that **SAME LANGUAGE**.
    - Do not translate unless explicitly asked. If input is Arabic, output Arabic.

    **Task Objectives:**
    1. **Deep Analysis:** Analyze the provided text/images with Ph.D. level precision.
    2. **Generate Output:** Create a structured study guide based on: "${summaryType}".
    3. **Professional Formatting:** Use advanced Markdown to create a visually stunning document.

    **DOMAIN-SPECIFIC HANDLING RULES:**

    🧮 **MATHEMATICS & PHYSICS:**
    - Render formulas clearly using standard text notation or simple LaTeX if needed (e.g., E = mc², a² + b² = c²).
    - Show **step-by-step** solutions for examples found in the text.
    - Highlight variables and constants in **Bold**.
    - Ensure symbols (∫, ∑, ∂, π, θ, ∞) are used correctly.

    🌍 **HISTORY & GEOGRAPHY:**
    - For History: Construct **Chronological Timelines** using lists. Link causes to effects.
    - For Geography: Describe spatial relationships. If coordinates or locations are mentioned, list them clearly.
    - Use "Callout Boxes" (Blockquotes) for key dates and figures.

    💰 **ECONOMICS & DATA:**
    - Preserve all currency symbols ($, €, £, EGP, SAR, AED) and numerical formats exactly.
    - **MANDATORY:** Use **Markdown Tables** to compare data, years, prices, or statistics. Never list data in paragraphs if a table is possible.

    💻 **PROGRAMMING & TECHNICAL:**
    - Use Code Blocks for any code snippets.
    - Explain algorithms using step-by-step logic.

    **FORMATTING STANDARDS (The "Golden Rules"):**
    - **Headers:** Use Emoji prefixes for H2 and H3 (e.g., 📊 **Analysis**, 🏛 **History**, 🧪 **Formula**).
    - **Tables:** Use them aggressively for comparisons.
    - **Visuals:** Use **Mermaid.js** for EVERY complex concept.
      - *History:* Use \`timeline\` or \`mindmap\`.
      - *Process:* Use \`graph TD\` or \`sequenceDiagram\`.
      - *Structure:* Use \`classDiagram\`.
      - *Database:* Use \`erDiagram\`.
      - *State:* Use \`stateDiagram-v2\`.
    - **Mermaid Rules:** All text inside diagrams must be in the **Detected Language**. All text in nodes must be wrapped in quotes (e.g., A["النص العربي"]).

    ${extractedImagesCount ? `**IMAGE INTEGRATION:**
    - ${extractedImagesCount} images have been extracted from the source file.
    - You **MUST** integrate them into the summary where they are logically relevant.
    - Use the syntax: \`![Figure X description](index)\` where index is 0, 1, 2...
    - Example: "As shown in the diagram below:\n\n![Market Trend Graph](0)"` : ''}

    **Output Structure (JSON):**
    - **overview**: A professional executive summary (Subject, Level, Core Topics).
    - **summary**: The main body. Rich Markdown. Tables. Mermaid Charts. Formulas.
    - **qa**: 5-10 High-Quality Review Questions (Mix of Definitions, Problem Solving, and Critical Thinking) with Answers.
  `;

  const userContentParts: any[] = [{ text: systemPrompt }];
  
  if (content.image) {
    userContentParts.push({
      inlineData: {
        mimeType: content.image.mimeType,
        data: content.image.data
      }
    });
    userContentParts.push({ text: "Analyze this image in detail. Read all numbers, symbols, and text. Describe charts/graphs if present." });
  }
  
  if (content.text) {
    userContentParts.push({ text: `Source Content to Analyze:\n${content.text.substring(0, 500000)}` });
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      { role: "user", parts: userContentParts }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          overview: { type: Type.STRING, description: "Professional executive overview in detected language." },
          summary: { type: Type.STRING, description: "The comprehensive Markdown analysis including tables, math, and diagrams." },
          qa: { type: Type.STRING, description: "Exam-style Q&A section with answers." },
        },
        required: ["overview", "summary", "qa"],
      },
    },
  });

  if (response.text) {
    try {
      const cleanedJson = cleanJson(response.text);
      return JSON.parse(cleanedJson) as StudyAnalysisResult;
    } catch (e) {
      console.error("JSON Parsing Error", e);
      // Fallback or retry logic could go here
      throw new Error("Failed to process the AI response. The analysis might be too complex or the file content is unclear.");
    }
  }

  throw new Error("No response received from AI model.");
};

export const explainConcept = async (
  apiKey: string, 
  term: string, 
  context: string,
  complexity: ComplexityLevel = ComplexityLevel.INTERMEDIATE
): Promise<DeepDiveResponse> => {
  const ai = new GoogleGenAI({ apiKey });
  
  let complexityPrompt = "";
  switch (complexity) {
    case ComplexityLevel.BASIC:
      complexityPrompt = "Explain simply (EL5). Use analogies.";
      break;
    case ComplexityLevel.INTERMEDIATE:
      complexityPrompt = "Explain academically. Define terms and give context.";
      break;
    case ComplexityLevel.ADVANCED:
      complexityPrompt = "Explain with high technical depth. Include formulas, dates, or advanced theory.";
      break;
  }

  const systemPrompt = `
    You are an Expert Tutor specialized in accurate definitions.
    
    **Task:** Deep Dive into the concept: "${term}".
    **Context:** ${context.substring(0, 50000)}
    
    **Language Rule:** Output MUST be in the same language as the Context/Term.

    **Instructions:**
    1. ${complexityPrompt}
    2. **Formatting:** Use Bold for keywords. Use bullet points.
    3. **Domain Specifics:**
       - If Math: Show the formula and a solved example.
       - If History: Give the date, key figures, and significance.
       - If Science: Explain the mechanism/process.
    4. **Visualization:** Suggest a small Mermaid diagram code if it helps explain (e.g., a small flowchart).
    5. **Related:** Suggest 4 related concepts.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      { role: "user", parts: [{ text: systemPrompt }] }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          explanation: { type: Type.STRING, description: "Rich markdown explanation." },
          relatedTerms: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["explanation", "relatedTerms"]
      }
    }
  });

  if (response.text) {
    try {
      const cleanedJson = cleanJson(response.text);
      return JSON.parse(cleanedJson) as DeepDiveResponse;
    } catch (e) {
      console.error("JSON Parsing Error", e);
      throw new Error("Failed to generate explanation.");
    }
  }
  
  throw new Error("Failed to generate explanation.");
};

export const generateSpeech = async (apiKey: string, text: string, voiceName: string = 'Zephyr'): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey });

    // Truncate text if too long for a single TTS request (approx limit)
    const textToSpeak = text.length > 2000 ? text.substring(0, 2000) + "..." : text;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: textToSpeak }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voiceName }
                }
            }
        }
    });

    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioData) {
        throw new Error("No audio data returned");
    }
    return audioData;
};