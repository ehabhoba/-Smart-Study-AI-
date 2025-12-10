
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
  extractedImagesCount?: number,
  targetLanguage: string = 'auto' // 'auto', 'ar', 'en', 'fr', etc.
): Promise<StudyAnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey });

  let promptRole = "";
  
  // --- Define Persona and Strategy ---
  switch (summaryType) {
    case SummaryType.PRECISE_SUMMARY:
      promptRole = `
        You are a **Senior Academic Editor** creating a "High-Fidelity Comprehensive Summary".
        **GOAL:** Retain significant depth and nuance (approx 30-40% of original volume).
        **STRATEGY:** 
        1. Do NOT simply list bullet points; use paragraphs to explain complex ideas fully.
        2. Keep ALL specific examples, case studies, and mathematical derivations.
        3. Do NOT skip minor sections or side notes if they contain context.
        4. Your output must be substantial, thorough, and dense. Avoid brevity at all costs.
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
        **GOAL:** Create a definitive, deep-dive reference that rivals the original text in clarity but improves structure.
        **STRATEGY:**
        1. Expand on every major point. Do not summarize for the sake of shortness.
        2. Capture the nuances, arguments, and counter-arguments found in the text.
        3. Use rich, academic language.
        4. Ensure the analysis is comprehensive and not too concise.
      `;
      break;
  }

  // Determine Language Instruction
  let languageInstruction = "";
  if (targetLanguage && targetLanguage !== 'auto') {
      languageInstruction = `
      **CRITICAL: LANGUAGE ENFORCEMENT**
      The user has explicitly requested the output to be in: **${targetLanguage.toUpperCase()}**.
      - You MUST TRANSLATE the content if the source is different.
      - Ensure the translation is academic, fluent, and uses correct terminology for that language.
      - 'detectedLanguage' field in JSON should be '${targetLanguage}'.
      `;
  } else {
      languageInstruction = `
      **CRITICAL: LANGUAGE DETECTION**
      1. **DETECT LANGUAGE:** Read the input text/images and detect the dominant language.
      2. **MATCH OUPUT:** The entire JSON response **MUST BE IN THE SAME LANGUAGE AS THE INPUT**.
         - If input is Arabic -> Output Arabic.
         - If input is English -> Output English.
      3. Set 'detectedLanguage' to the detected ISO code (e.g., 'ar', 'en').
      `;
  }

  const systemPrompt = `
    ${promptRole}
    
    ${languageInstruction}

    **STYLE & TONE:**
    - Adapt your tone to match the book's style (e.g., formal vs. simple).
    - HOWEVER, ensure the explanation is **easy for a student to understand**. Simplify complex jargon while keeping core meaning.
    
    **SOLVE EVERYTHING:** 
    If the input text contains questions, exercises, or unfinished examples, **YOU MUST SOLVE THEM** and include the answers in the summary or QA section.

    **FORMATTING (COLORFUL & ORGANIZED):**
    The frontend uses specific Markdown syntax to render colorful boxes. Use them strictly:
    - **Headers:** Use \`##\` for main sections and \`###\` for subsections. Add relevant Emojis to headers.
    - **Important Notes / Definitions:** Wrap them in Blockquotes \`> \`. These will appear in **colorful amber boxes**.
    - **Questions/Examples:** When presenting a question or an example from the book, format it clearly, then provide the solution/explanation immediately after.
    - **Comparisons:** ALWAYS use Markdown Tables for comparisons. These render with **colorful headers**.
    - **Bold:** Use \`**text**\` for keywords.

    **YOUR TASK:** Analyze the content and generate a structured study JSON containing:
    1. **overview**: A powerful executive summary / introduction.
    2. **summary**: The core content formatted in Markdown.
       - Use H2/H3 headers with Emojis.
       - Use Tables for comparisons.
       - Use Blockquotes for important notes.
       - **Mnemonics:** If there are hard lists, invent a creative Mnemonic (abbreviation/rhyme) to help memory.
       - **Real-World Application:** At the end of major sections, add a paragraph titled "Why this matters?" explaining the practical use of this concept.
       - **Mermaid:** Use \`mermaid\` code blocks for diagrams (Flowcharts, Mindmaps). WRAP NODE TEXT IN QUOTES.
    3. **qa**: A list of review questions and answers (Markdown format). **Include solved questions from the book if found.**
    4. **flashcards**: An array of objects {term, definition} for the 10 most important terms.
    5. **quiz**: An array of objects {question, options[], correctAnswer, explanation} for 5 multiple-choice questions.

    ${extractedImagesCount ? `**IMAGES:** The file has ${extractedImagesCount} extracted images. Integrate them into the 'summary' markdown using \`![Figure X](index)\` where logical.` : ''}
    ${maxSections ? `**LENGTH:** Divide the summary into approx ${maxSections} sections.` : ''}
    ${summaryType === SummaryType.PRECISE_SUMMARY ? '**IMPORTANT:** For "summary", provide a dense, detailed explanation of ALL topics. Do NOT skip sections. Prioritize detail over brevity.' : ''}
    
    **MATH/SCIENCE RULES:**
    - Use LaTeX for formulas (e.g. $x^2$).
    - Use clear step-by-step logic for solving problems found in the text.
  `;

  const userContentParts: any[] = [{ text: systemPrompt }];
  
  if (content.image) {
    userContentParts.push({
      inlineData: {
        mimeType: content.image.mimeType,
        data: content.image.data
      }
    });
    userContentParts.push({ text: "Analyze this slide/image. Extract text, diagrams, and solve any visible questions." });
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
          detectedLanguage: { type: Type.STRING, description: "ISO code of the detected language (e.g. 'ar', 'en')" },
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
        required: ["detectedLanguage", "overview", "summary", "qa", "flashcards", "quiz"],
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
    
    **CRITICAL:** Detect the language of the "Context" and "Term". **Generate the explanation in that SAME language.**

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
