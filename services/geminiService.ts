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
      summaryInstructions = "Focus ONLY on critical exam definitions, formulas, and key takeaways. Ignore filler text.";
      break;
    case SummaryType.MEDIUM:
      summaryInstructions = "Provide a balanced summary explaining main concepts clearly with examples.";
      break;
    case SummaryType.FULL:
      summaryInstructions = "Provide a comprehensive, detailed analysis covering every chapter and section thoroughly.";
      break;
  }

  if (maxSections) {
    summaryInstructions += ` The summary should be structured into approximately ${maxSections} main sections.`;
  }

  const systemPrompt = `
    You are an elite Educational Consultant and Systems Architect. Your task is to analyze study materials and generate high-quality, structured study guides.

    **CORE INSTRUCTION - LANGUAGE DETECTION:**
    1. **DETECT** the dominant language of the user's input content (Text/Images).
    2. **GENERATE ALL OUTPUT strictly in that SAME LANGUAGE**.
       - If input is Arabic -> Output MUST be Arabic.
       - If input is English -> Output MUST be English.
       - If input is French -> Output MUST be French.

    **Task Objectives:**
    1. **Analyze** the provided content (text/images).
    2. **Generate** a ${summaryType} summary based on these instructions: ${summaryInstructions}.
    3. **Format** the output professionally using Markdown.

    **Formatting Rules (Strictly Follow):**
    - Use **Bold** for key terms and definitions.
    - Use *Italic* for emphasis.
    - Use Tables for comparisons or structured data lists.
    - Use Bullet points for readability.
    - Use H2 (##) for Main Sections and H3 (###) for Subsections.
    - Add emojis to section headers to make it engaging (e.g., 📌, 💡, ⚙️).

    **3. Engineering & Diagrams (Mermaid.js):**
    - You MUST generate **Mermaid.js** code for visual representation.
    - Identify systems, processes, or hierarchies in the text.
    - Use:
      * **Class Diagram** (classDiagram) for object-oriented or structural data.
      * **Sequence Diagram** (sequenceDiagram) for interactions/processes.
      * **State Diagram** (stateDiagram-v2) for lifecycle/states.
      * **ER Diagram** (erDiagram) for databases/relationships.
      * **Mindmap** or **Flowchart** (graph TD) for general concepts.
    - **CRITICAL**: All text inside Mermaid nodes MUST be in the **SAME LANGUAGE** as the input.
    - **CRITICAL**: All text inside Mermaid nodes MUST be wrapped in double quotes "". Example: A["النص هنا"]

    **4. Q&A Section:**
    - Generate smart, high-value review questions.
    - Format: Question (H3), Answer (Blockquote).

    ${extractedImagesCount ? `Note: ${extractedImagesCount} images were extracted from the source file. Reference them in the summary if relevant (e.g., "See Figure 1").` : ''}
    
    **Output Format:** JSON object containing 'overview', 'summary', and 'qa'.
  `;

  const userContentParts: any[] = [{ text: systemPrompt }];
  
  if (content.image) {
    userContentParts.push({
      inlineData: {
        mimeType: content.image.mimeType,
        data: content.image.data
      }
    });
    userContentParts.push({ text: "Analyze this image and include its content in the summary." });
  }
  
  if (content.text) {
    userContentParts.push({ text: `Source Content:\n${content.text.substring(0, 500000)}` });
  }

  // We use Schema to ensure JSON output structure
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
          overview: { type: Type.STRING, description: "General overview of the material (subject, level, main topic) in the detected language." },
          summary: { type: Type.STRING, description: "The detailed Markdown summary including Mermaid diagrams in the detected language." },
          qa: { type: Type.STRING, description: "Review questions and answers in Markdown format in the detected language." },
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
      console.log("Raw Text:", response.text);
      if (response.text.includes("overview")) {
         throw new Error("Formatting error in AI response. Please try again.");
      }
      throw new Error("Failed to analyze content. Please try again.");
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
      complexityPrompt = "Explain in very simple terms (EL15).";
      break;
    case ComplexityLevel.INTERMEDIATE:
      complexityPrompt = "Explain in a standard academic tone.";
      break;
    case ComplexityLevel.ADVANCED:
      complexityPrompt = "Explain with technical depth and advanced terminology.";
      break;
  }

  const systemPrompt = `
    You are an expert tutor.
    
    **Task:** Explain the concept: "${term}".
    **Context:** ${context.substring(0, 100000)}
    
    **CRITICAL LANGUAGE RULE:** Detect the language of the 'Context' provided. The explanation MUST be in the **SAME LANGUAGE** as the context.

    **Requirements:**
    1. ${complexityPrompt}
    2. Format using clear Markdown (Bold key terms, use bullet points).
    3. If applicable, generate a small Mermaid diagram to visualize the concept.
    4. Suggest 3-5 related terms for further study.
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
          explanation: { type: Type.STRING, description: "Detailed Markdown explanation in the same language as context." },
          relatedTerms: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "List of related terms in the same language." 
          }
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