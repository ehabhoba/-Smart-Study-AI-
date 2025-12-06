import { GoogleGenAI, Type, Modality } from "@google/genai";
import { StudyAnalysisResult, SummaryType } from "../types";

export const analyzeText = async (
  apiKey: string,
  text: string,
  summaryType: SummaryType,
  maxSections?: number
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
    أنت خبير تعليمي ومدرس أول، متخصص في إعداد المذكرات الدراسية الملونة والمنسقة.
    
    المهمة:
    1. تحليل النص وتحديد اسم المادة والمرحلة الدراسية.
    2. عمل ${summaryInstructions}.
    3. **تنسيق الملخص (Summary)**:
       - استخدم عناوين **H2** للفصول أو الأبواب الرئيسية.
       - استخدم عناوين **H3** للمفاهيم الفرعية.
       - استخدم **Blockquotes (>)** فقط عند وصف شكل توضيحي، رسم بياني، أو ملاحظة هامة جداً (تنبيه).
       - استخدم **Markdown Tables** لأي مقارنات أو بيانات رقمية.
       - استخدم **القوائم النقطية** بكثرة لتسهيل القراءة.
       - استخدم **الإيموجي** (📌, 💡, ✅, ⚠️) لتزيين العناوين والنقاط الهامة.
    
    4. **تنسيق الأسئلة والأجوبة (Q&A)**:
       - يجب أن يكون كل سؤال عنواناً من نوع **H3** (مثال: ### ❓ س: ما هو تعريف الذرة؟).
       - يجب أن تكون الإجابة **مباشرة تحت السؤال** داخل **Blockquote (>)** (مثال: > ✅ **ج:** الذرة هي أصغر جزء في المادة...).
       - نوع في الأسئلة (اختر، صح/خطأ، علل، عرف).
    
    المخرجات مطلوبة كـ JSON Structure محدد.
    اللغة: العربية.
  `;

  // We use Schema to ensure JSON output structure
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      { role: "user", parts: [{ text: systemPrompt }] },
      { role: "user", parts: [{ text: `محتوى الكتاب:\n${text.substring(0, 500000)}` }] } // Limit context slightly just in case
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          overview: { type: Type.STRING, description: "وصف عام للمادة والمرحلة الدراسية." },
          summary: { type: Type.STRING, description: "الملخص بصيغة Markdown مع الجداول والتنسيق المماثل للكتاب." },
          qa: { type: Type.STRING, description: "الأسئلة والأجوبة بصيغة Markdown. أسئلة H3، وأجوبة داخل Blockquote." },
        },
        required: ["overview", "summary", "qa"],
      },
    },
  });

  if (response.text) {
    return JSON.parse(response.text) as StudyAnalysisResult;
  }

  throw new Error("لم يتم استلام رد صالح من النموذج.");
};

export const explainConcept = async (apiKey: string, term: string, context: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey });
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        parts: [{ text: `
          أنت مدرس خصوصي. اشرح المفهوم التالي: "${term}" لطلاب المدارس.
          استخدم سياق الكتاب التالي كمرجع للشرح لضمان الدقة:
          ${context.substring(0, 100000)}
          
          الشرح يجب أن يكون باللغة العربية، مبسط، ومنسق بـ Markdown.
          إذا كان الشرح يحتاج إلى جدول للمقارنة أو التوضيح، استخدم Markdown Tables.
        `}]
      }
    ]
  });

  return response.text || "عذراً، لم أتمكن من توليد الشرح.";
};

export const generateSpeech = async (apiKey: string, text: string): Promise<string> => {
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
                    prebuiltVoiceConfig: { voiceName: 'Zephyr' } // Or 'Kore', 'Fenrir'
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