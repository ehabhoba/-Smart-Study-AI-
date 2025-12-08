
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

  let promptRole = "";
  
  // --- Define Persona and Strategy ---
  switch (summaryType) {
    case SummaryType.PRECISE_SUMMARY:
      promptRole = `
        You are a **Senior Academic Editor** creating a "Dense Extended Summary".
        **GOAL:** Retain approx 25% of the original text volume. DO NOT over-summarize or be brief.
        **STRATEGY:** 
        1. Maintain the original structure (Chapters/Sections).
        2. Include EVERY key definition, theorem, and essential example.
        3. Eliminate only fluff, repetition, and filler words.
        4. Your output must be LONG and DETAILED.
      `;
      break;
    case SummaryType.EXAM_CAPSULE:
      promptRole = `
        You are a **Senior Chief Examiner** creating a "Last Minute Review Capsule".
        **Focus:** High-yield exam topics, definitions, and laws only. Cut the fluff.
        **Tone:** Urgent, precise, and authoritative.
      `;
      break;
    case SummaryType.MALZAMA:
      promptRole = `
        You are a **Professional Private Tutor** creating a "Study Guide (Malzama)".
        **Focus:** Simplifying concepts, using examples, and organizing logically.
        **Tone:** Friendly, encouraging, and clear.
      `;
      break;
    case SummaryType.WORKSHEET:
      promptRole = `
        You are an **Educational Designer** creating a "Student Worksheet".
        **Focus:** Active learning tasks, fill-in-the-blanks, and practice problems.
      `;
      break;
    case SummaryType.QA_ONLY:
      promptRole = `
        You are an **Exam Question Bank Generator**.
        **Focus:** Comprehensive coverage of all details via questions.
      `;
      break;
    default: // FULL_ANALYSIS
      promptRole = `
        You are an **Elite Polymath Academic Consultant**.
        **Focus:** Detailed, master-level reference with deep analysis.
      `;
      break;
  }

  const systemPrompt = `
    ${promptRole}
    
    **CORE DIRECTIVE:** Detect the input language (e.g., Arabic). **ALL OUTPUT MUST BE IN THAT SAME LANGUAGE.**

    **YOUR TASK:** Analyze the content and generate a structured study JSON containing:
    1. **overview**: A powerful executive summary / introduction.
    2. **summary**: The core content formatted in Markdown.
       - Use H2/H3 headers with Emojis.
       - Use Tables for comparisons.
       - Use Blockquotes for important notes.
       - **Mnemonics:** If there are hard lists, invent a creative Mnemonic (abbreviation/rhyme) to help memory.
       - **Mermaid:** Use \`mermaid\` code blocks for diagrams (Flowcharts, Mindmaps). WRAP NODE TEXT IN QUOTES.
    3. **qa**: A list of review questions and answers (Markdown format).
    4. **flashcards**: An array of objects {term, definition} for the 10 most important terms.
    5. **quiz**: An array of objects {question, options[], correctAnswer, explanation} for 5 multiple-choice questions.

    ${extractedImagesCount ? `**IMAGES:** The file has ${extractedImagesCount} extracted images. Integrate them into the 'summary' markdown using \`![Figure X](index)\` where logical.` : ''}
    ${maxSections ? `**LENGTH:** Divide the summary into approx ${maxSections} sections.` : ''}
    ${summaryType === SummaryType.PRECISE_SUMMARY ? '**IMPORTANT:** For "summary", provide a dense, detailed explanation of ALL topics. Do NOT skip sections.' : ''}
    
    **MATH/SCIENCE RULES:**
    - Use LaTeX for formulas (e.g. $x^2$).
    - Use clear step-by-step logic.
  `;

  const userContentParts: any[] = [{ text: systemPrompt }];
  
  if (content.image) {
    userContentParts.push({
      inlineData: {
        mimeType: content.image.mimeType,
        data: content.image.data
      }
    });
    userContentParts.push({ text: "Analyze this slide/image. Extract text and diagrams." });
  }
  
  if (content.text) {
    userContentParts.push({ text: `Source Content:\n${content.text.substring(0, 500000)}` });
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
          // Enhanced Structured Data
          flashcards: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    term: { type: Type.STRING },
                    definition: { type: Type.STRING }
                }
            }
          },
          quiz: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctAnswer: { type: Type.STRING },
                    explanation: { type: Type.STRING }
                }
            }
          }
        },
        required: ["overview", "summary", "qa", "flashcards", "quiz"],
      },
    },
  });

  if (response.text) {
    try {
      const cleanedJson = cleanJson(response.text);
      return JSON.parse(cleanedJson) as StudyAnalysisResult;
    } catch (e) {
      console.error("JSON Parsing Error", e);
      throw new Error("Failed to parse AI response. Try again.");
    }
  }

  throw new Error("No response from AI.");
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
      complexityPrompt = "Explain academically with context and examples.";
      break;
    case ComplexityLevel.ADVANCED:
      complexityPrompt = "Explain with technical depth, history, and advanced theory.";
      break;
  }

  const systemPrompt = `
    You are an Expert Tutor.
    **Task:** Deep Dive into: "${term}".
    **Context:** ${context.substring(0, 50000)}
    **Language:** Same as Context.

    **Instructions:**
    1. ${complexityPrompt}
    2. **Mnemonics:** Provide a memory aid (acronym or rhyme) if applicable.
    3. **Visuals:** Provide a *simple* Mermaid diagram code.
       - Use \`graph TD\` or \`mindmap\`.
       - Wrap ALL text in quotes.
    4. Suggest 4 related concepts.
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
