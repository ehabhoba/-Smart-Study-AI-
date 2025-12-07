import { GoogleGenAI, Type, Modality } from "@google/genai";
import { StudyAnalysisResult, SummaryType, DeepDiveResponse, ComplexityLevel } from "../types";

/**
 * Helper to clean JSON string from Markdown code blocks and extraneous text.
 */
function cleanJson(text: string): string {
  let cleaned = text.replace(/```json\s*|```/g, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
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
      summaryInstructions = "تلخيص مكثف جداً (Exam Capsule) يركز فقط على النقاط الهامة للامتحان.";
      break;
    case SummaryType.MEDIUM:
      summaryInstructions = "تلخيص متوسط متوازن يشرح المفاهيم الرئيسية بوضوح.";
      break;
    case SummaryType.FULL:
      summaryInstructions = "تلخيص شامل ومفصل يغطي جميع أبواب وفصول الكتاب بالتفصيل.";
      break;
  }

  if (maxSections) {
    summaryInstructions += ` يجب أن لا يتجاوز التلخيص ${maxSections} قسم/فقرة رئيسية.`;
  }

  const systemPrompt = `
    أنت خبير تعليمي ومهندس برمجيات/نظم محترف. مهمتك إعداد مذكرات دراسية متطورة ورسوم هندسية توضيحية.
    
    المهمة:
    1. تحليل المحتوى وتحديد المادة والمرحلة.
    2. عمل ${summaryInstructions}.
    
    3. **الرسوم الهندسية والبيانية (Engineering Drawings & Graphical Representation)**:
       - أنت مطالب بتطوير رسوم بيانية وتوضيحية باستخدام **Mermaid.js**.
       - إذا كان المحتوى يتحدث عن أنظمة، برمجة، أو عمليات هندسية، استخدم:
         * **Class Diagram** (classDiagram) لهيكلة البيانات.
         * **Sequence Diagram** (sequenceDiagram) لتتابع العمليات.
         * **State Diagram** (stateDiagram-v2) لحالات النظام.
         * **ER Diagram** (erDiagram) لقواعد البيانات.
       - للمفاهيم العامة، استخدم **Mindmap** أو **Flowchart** (graph TD).
       - **هام**: بعد كل رسم بياني، أضف فقرة قصيرة تشرح الرسم (مثال: *> 💡 يوضح الرسم أعلاه العلاقة بين الكائنات...*).
       - **تحذير**: النصوص داخل Mermaid يجب أن تكون بين علامات تنصيص مزدوجة "" (مثال: A["النظام الفرعي"]).

    4. **التنسيق العام**:
       - استخدم H2 للعناوين الرئيسية، H3 للفرعية.
       - استخدم Blockquotes للملاحظات الهامة.
       - استخدم الجداول للمقارنات.

    5. **تنسيق الأسئلة والأجوبة (Q&A)**:
       - H3 للسؤال، والجواب في Blockquote تحته مباشرة.

    ${extractedImagesCount ? `6. ملاحظة: تم استخراج ${extractedImagesCount} صورة من الملف الأصلي وسيتم عرضها في تبويب "الأشكال والرسومات". أشر إليها في الشرح إذا لزم الأمر (مثال: "انظر الأشكال المرفقة").` : ''}
    
    المخرجات مطلوبة كـ JSON Structure محدد.
    اللغة: العربية.
  `;

  const userContentParts: any[] = [{ text: systemPrompt }];
  
  if (content.image) {
    userContentParts.push({
      inlineData: {
        mimeType: content.image.mimeType,
        data: content.image.data
      }
    });
    userContentParts.push({ text: "قم بتحليل هذه الصورة واستخراج المعلومات منها لعمل التلخيص." });
  }
  
  if (content.text) {
    userContentParts.push({ text: `محتوى الكتاب:\n${content.text.substring(0, 500000)}` });
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
          overview: { type: Type.STRING, description: "وصف عام للمادة والمرحلة الدراسية." },
          summary: { type: Type.STRING, description: "الملخص بصيغة Markdown مع رسوم هندسية Mermaid." },
          qa: { type: Type.STRING, description: "الأسئلة والأجوبة بصيغة Markdown." },
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
      throw new Error("فشل في تحليل استجابة الذكاء الاصطناعي (JSON Error).");
    }
  }

  throw new Error("لم يتم استلام رد صالح من النموذج.");
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
      complexityPrompt = "اشرح بأسلوب مبسط جداً (Language: Simple Arabic).";
      break;
    case ComplexityLevel.INTERMEDIATE:
      complexityPrompt = "اشرح بأسلوب أكاديمي متوازن (Language: Standard Academic Arabic).";
      break;
    case ComplexityLevel.ADVANCED:
      complexityPrompt = "اشرح بعمق تقني وعلمي دقيق (Language: Advanced/Technical Arabic).";
      break;
  }

  const systemPrompt = `
    أنت مدرس خصوصي ومهندس. اشرح المفهوم: "${term}".
    السياق: ${context.substring(0, 100000)}
    
    المتطلبات:
    1. ${complexityPrompt}
    2. الشرح Markdown.
    3. إذا كان المفهوم عملية أو نظام، ارسم مخطط Mermaid بسيط لتوضيحه.
    4. اقترح 3-5 مصطلحات مرتبطة.
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
          explanation: { type: Type.STRING, description: "الشرح Markdown" },
          relatedTerms: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "قائمة مصطلحات" 
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
      throw new Error("عذراً، لم أتمكن من توليد الشرح (JSON Error).");
    }
  }
  
  throw new Error("عذراً، لم أتمكن من توليد الشرح.");
};

export const generateSpeech = async (apiKey: string, text: string, voiceName: string = 'Zephyr'): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey });

    // Truncate text if too long for a single TTS request (approx limit)
    const textToSpeak = text.length > 2000 ? text.substring(0, 2000) + "..." : text;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `اقرأ بصوت واضح ومناسب للمواد التعليمية: ${textToSpeak}` }] }],
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
