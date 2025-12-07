
import React, { useState, useEffect } from 'react';
import { Loader2, FileText, Brain, CheckCircle, AlertCircle, Sparkles, Wand2, Rocket } from 'lucide-react';
import { ProcessingStatus } from '../types';

interface Props {
  status: ProcessingStatus;
}

const TIPS = [
  "💡 نصيحة احترافية: اضغط على أي مربع في الرسوم البيانية (Mermaid) لفتح شرح تفصيلي فوري.",
  "💡 هل تعلم؟ يمكنك رفع ملفات PowerPoint وسيقوم الذكاء الاصطناعي بتحليل الشرائح والصور.",
  "💡 ميزة خفية: استخدم زر 'قراءة (TTS)' للاستماع للملخص بصوت طبيعي أثناء المشي.",
  "💡 تلميح: إذا كان الشرح معقداً، افتح نافذة 'Deep Dive' واختر المستوى 'مبسط'.",
  "💡 هل تعلم؟ قسم 'الأسئلة' يتم توليده بناءً على أنماط الامتحانات الحقيقية.",
  "💡 نصيحة: يمكنك تصدير الملخص إلى Word أو PDF للمذاكرة الورقية."
];

export const ProcessingArea: React.FC<Props> = ({ status }) => {
  const steps = [
    { id: 'extracting', label: 'قراءة الملف', icon: FileText },
    { id: 'analyzing', label: 'التحليل الذكي', icon: Brain },
    { id: 'completed', label: 'النتائج', icon: CheckCircle },
  ];

  const [currentTip, setCurrentTip] = useState(0);

  // Rotate tips
  useEffect(() => {
    if (status.step === 'analyzing') {
      const timer = setInterval(() => {
        setCurrentTip((prev) => (prev + 1) % TIPS.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [status.step]);

  let activeIndex = 0;
  if (status.step === 'extracting') activeIndex = 0;
  if (status.step === 'analyzing') activeIndex = 1;
  if (status.step === 'completed') activeIndex = 2;
  
  const isError = status.step === 'error';
  const isComplete = status.step === 'completed';

  return (
    <div className={`
      relative overflow-hidden rounded-2xl border transition-all duration-500 mb-8 p-8 shadow-xl
      ${isError ? 'bg-red-50 border-red-200' : 
        isComplete ? 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-200' : 
        'bg-gradient-to-br from-indigo-50 via-white to-purple-50 border-indigo-100'}
    `}>
      
      {/* Background Decorative Elements (Blobs) */}
      {!isError && !isComplete && (
        <>
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-0 left-0 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </>
      )}

      {isError ? (
        <div className="flex flex-col items-center text-center text-red-600 animate-in fade-in zoom-in relative z-10">
          <div className="bg-white p-4 rounded-full mb-4 shadow-sm border border-red-100">
             <AlertCircle size={48} className="text-red-500" />
          </div>
          <h3 className="text-2xl font-bold mb-2 text-red-700">حدث خطأ أثناء المعالجة</h3>
          <p className="text-red-600/80 max-w-md bg-white/50 py-2 px-4 rounded-lg">{status.message}</p>
        </div>
      ) : isComplete ? (
        <div className="flex flex-col items-center text-center relative z-10 animate-in zoom-in duration-500">
           <div className="bg-white p-5 rounded-full mb-4 shadow-lg border-4 border-green-100">
             <CheckCircle size={56} className="text-green-500" />
           </div>
           <h3 className="text-3xl font-extrabold text-green-800 mb-2 drop-shadow-sm">تم التحليل بنجاح! 🚀</h3>
           <p className="text-green-700 font-medium text-lg">النتائج جاهزة بالأسفل، استمتع بالمذاكرة الذكية.</p>
        </div>
      ) : (
        /* Active Processing State */
        <div className="flex flex-col items-center w-full relative z-10">
          
          {/* Main Icon Animation */}
          <div className="mb-8 relative">
             <div className="absolute inset-0 bg-blue-400 rounded-full blur-xl opacity-20 animate-pulse"></div>
             <div className="bg-white p-6 rounded-2xl shadow-lg border border-blue-100 flex items-center justify-center relative">
                {status.step === 'analyzing' ? (
                   <Brain size={48} className="text-indigo-600 animate-[bounce_2s_infinite]" />
                ) : (
                   <FileText size={48} className="text-blue-600 animate-pulse" />
                )}
                <div className="absolute -top-2 -right-2 bg-yellow-400 text-white p-1.5 rounded-full shadow-sm animate-bounce">
                  <Wand2 size={16} fill="white" />
                </div>
             </div>
          </div>

          {/* Steps Progress Visualizer */}
          <div className="flex items-center justify-between w-full max-w-2xl mb-10 relative">
             {/* Progress Track */}
             <div className="absolute top-1/2 left-0 right-0 h-2 bg-gray-200 rounded-full -z-10 mx-4"></div>
             <div 
               className="absolute top-1/2 left-0 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full -z-10 transition-all duration-700 ease-out mx-4"
               style={{ width: `calc(${(activeIndex / (steps.length - 1)) * 100}%)` }}
             ></div>

             {steps.map((step, index) => {
               const isActive = index === activeIndex;
               const isCompleted = index < activeIndex;

               return (
                 <div key={step.id} className="flex flex-col items-center relative">
                   <div className={`
                     w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border-4 z-20
                     ${isCompleted ? 'bg-green-500 border-green-500 text-white shadow-green-200' : ''}
                     ${isActive ? 'bg-white border-blue-500 text-blue-600 scale-125 shadow-lg shadow-blue-200 ring-4 ring-blue-50' : ''}
                     ${!isActive && !isCompleted ? 'bg-white border-gray-300 text-gray-300' : ''}
                   `}>
                     {isCompleted ? <CheckCircle size={18} /> : <step.icon size={18} />}
                   </div>
                   <span className={`mt-3 text-sm font-bold transition-colors ${isActive ? 'text-blue-700' : 'text-gray-400'}`}>
                     {step.label}
                   </span>
                 </div>
               );
             })}
          </div>

          {/* Status Text & Bar */}
          <div className="w-full max-w-xl text-center">
            <h4 className="text-xl font-bold text-gray-800 mb-2 flex justify-center items-center gap-2">
               <Loader2 className="animate-spin text-blue-600" /> 
               {status.message}
            </h4>
            
            <div className="w-full bg-gray-200/50 rounded-full h-4 overflow-hidden mb-6 backdrop-blur-sm border border-white/50">
                <div 
                    className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-300 relative"
                    style={{ width: `${status.progress}%` }}
                >
                    <div className="absolute inset-0 bg-white/30 animate-[shimmer_1.5s_infinite] w-full"></div>
                </div>
            </div>

            {/* Smart Tips Card */}
            {status.step === 'analyzing' && (
               <div className="bg-white/80 backdrop-blur-md border border-amber-200/60 rounded-xl p-5 shadow-sm transform transition-all hover:scale-[1.02] duration-300">
                  <div className="flex items-center justify-center gap-2 text-amber-600 font-bold mb-2 uppercase tracking-wide text-xs">
                    <Sparkles size={14} />
                    معلومة ذكية
                  </div>
                  <p className="text-gray-700 font-medium text-lg min-h-[3rem] flex items-center justify-center animate-fade-in key={currentTip}">
                    {TIPS[currentTip]}
                  </p>
               </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};
