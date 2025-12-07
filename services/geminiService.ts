import { GoogleGenAI, Type, Modality } from "@google/genai";
import { StudyAnalysisResult, SummaryType, DeepDiveResponse, ComplexityLevel } from "../types";

export const analyzeText = async (
  apiKey: string,
  content: { text?: string, image?: { data: string, mimeType: string } },
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
    1. تحليل المحتوى (نص أو صورة) وتحديد اسم المادة والمرحلة الدراسية.
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
    
    5. **الرسوم التوضيحية (Diagrams)**:
       - إذا كان المحتوى يتضمن عمليات معقدة، تسلسل أحداث، أو مقارنات هيكلية، قم بإنشاء مخطط **Mermaid.js**.
       - ضع كود Mermaid داخل كتلة كود (code block) معرفة بـ \`mermaid\`.
       - استخدم مخططات Flowcharts (graph TD/LR) أو Mindmaps لتلخيص الأفكار.
       - **هام جداً**: عند كتابة النصوص داخل العقد (Nodes)، يجب وضع النص دائماً بين علامتي تنصيص مزدوجة "" لتجنب أخطاء بناء الجملة مع الأقواس.
         ✅ صحيح: A["مؤشرات الأداء (KPIs)"]
         ❌ خطأ: A[مؤشرات الأداء (KPIs)]
    
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
          summary: { type: Type.STRING, description: "الملخص بصيغة Markdown مع مخططات Mermaid." },
          qa: { type: Type.STRING, description: "الأسئلة والأجوبة بصيغة Markdown." },
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
      complexityPrompt = "اشرح بأسلوب مبسط جداً، سهل الفهم، ومناسب للمبتدئين (Language: Simple Arabic).";
      break;
    case ComplexityLevel.INTERMEDIATE:
      complexityPrompt = "اشرح بأسلوب متوازن، مدرسي، ومناسب للطلاب (Language: Standard Academic Arabic).";
      break;
    case ComplexityLevel.ADVANCED:
      complexityPrompt = "اشرح بعمق، تفصيل دقيق، واستخدم المصطلحات التقنية أو العلمية (Language: Advanced/Technical Arabic).";
      break;
  }

  const systemPrompt = `
    أنت مدرس خصوصي ذكي. اشرح المفهوم التالي: "${term}".
    استخدم سياق الكتاب التالي كمرجع للشرح لضمان الدقة:
    ${context.substring(0, 100000)}
    
    المتطلبات:
    1. ${complexityPrompt}
    2. الشرح يجب أن يكون باللغة العربية ومنسق بـ Markdown.
    3. إذا كان الشرح يحتاج إلى جدول للمقارنة أو التوضيح، استخدم Markdown Tables.
    4. اقترح 3 إلى 5 مصطلحات أو مفاهيم مرتبطة بهذا الموضوع (related terms) يمكن للطالب أن يسأل عنها لاحقاً لتعميق الفهم.
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
          explanation: { type: Type.STRING, description: "الشرح بصيغة Markdown" },
          relatedTerms: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "قائمة بالمصطلحات المرتبطة" 
          }
        },
        required: ["explanation", "relatedTerms"]
      }
    }
  });

  if (response.text) {
    return JSON.parse(response.text) as DeepDiveResponse;
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