
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
    You are an **Elite Polymath Academic Consultant**. Your capability extends across all disciplines: **Engineering, Mathematics, Applied Sciences, History, Geography, Economics, and Literature**.
    
    **CORE DIRECTIVE: STRICT LANGUAGE MIRRORING**
    - Detect the dominant language of the input (Arabic, English, French, etc.).
    - **ALL OUTPUT** (Summary, Overview, Q&A, Chart Labels) **MUST BE** in that **SAME LANGUAGE**.

    **Task Objectives:**
    1. **Deep Analysis:** Analyze the text/images with Ph.D. level precision.
    2. **Generate Output:** Create a structured study guide based on: "${summaryType}".
    3. **Professional Formatting:** Use advanced Markdown.

    **ENGINEERING & DIAGRAMMING MASTERY (Mermaid.js):**
    You are a master of visual explanation. You MUST use **Mermaid.js** charts to visualize complex concepts.
    
    **Diagram Selection Strategy:**
    - **Processes/Flows:** Use \`graph TD\` or \`graph LR\`.
    - **Software/Structure:** Use \`classDiagram\`.
    - **Databases/Relationships:** Use \`erDiagram\`.
    - **States/Lifecycles:** Use \`stateDiagram-v2\`.
    - **Timelines (History):** Use \`timeline\`.
    - **Brainstorming/Hierarchy:** Use \`mindmap\`.

    **STRICT MERMAID SYNTAX RULES (CRITICAL FOR RENDERING):**
    1. **QUOTES:** You **MUST** wrap ALL node text in double quotes. 
       - ✅ Correct: A["Start Process"] --> B["Analyze Data (Input)"]
       - ❌ Incorrect: A[Start Process] --> B(Analyze Data (Input))
    2. **IDS:** Node IDs must be alphanumeric only (A1, NodeB). No special chars in IDs.
    3. **STYLING:** Add a styling section at the end of graphs to make them professional (e.g., \`classDef default fill:#f9f9f9,stroke:#333,stroke-width:2px;\`).
    4. **NO MARKDOWN IN CODE:** Do NOT put the word "mermaid" inside the code block content.
    5. **ARABIC SUPPORT:** For Arabic charts, ensure logical flow.

    **Example of desired Graph Output:**
    \`\`\`mermaid
    graph TD
      A["بداية النظام"] --> B["تحليل البيانات"]
      B --> C{"هل البيانات صالحة؟"}
      C -- "نعم" --> D["المعالجة المركزية"]
      C -- "لا" --> E["رفض المدخلات"]
      style A fill:#d1fae5,stroke:#059669,stroke-width:2px
      style D fill:#dbeafe,stroke:#2563eb,stroke-width:2px
    \`\`\`

    **DOMAIN-SPECIFIC HANDLING:**
    - 🧮 **MATH:** Render formulas clearly (LaTeX style without $). Step-by-step solutions.
    - 🌍 **HISTORY:** Chronological Timelines.
    - 💰 **ECONOMICS:** Tables for data comparison. Preserve currencies.
    - 💻 **CODE:** Code blocks with comments.

    ${extractedImagesCount ? `**IMAGE INTEGRATION:**
    - ${extractedImagesCount} images extracted. Integrate them logically using \`![Figure description](index)\`.` : ''}

    **Output Structure (JSON):**
    - **overview**: Executive summary.
    - **summary**: Main body with rich Markdown, Tables, and **Professional Mermaid Charts**.
    - **qa**: 5-10 High-Quality Review Questions (Q&A).
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
          overview: { type: Type.STRING },
          summary: { type: Type.STRING },
          qa: { type: Type.STRING },
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
    You are an Expert Tutor.
    **Task:** Deep Dive into: "${term}".
    **Context:** ${context.substring(0, 50000)}
    **Language:** Same as Context.

    **Instructions:**
    1. ${complexityPrompt}
    2. **Visuals:** Provide a *simple* Mermaid diagram code to illustrate the concept.
       - Use \`graph TD\`.
       - Wrap ALL text in quotes: A["Concept"] --> B["Details"].
       - Style the graph: \`classDef default fill:#fff,stroke:#333;\`
    3. Suggest 4 related concepts.
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
          explanation: { type: Type.STRING },
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
