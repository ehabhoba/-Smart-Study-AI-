import React, { useState, useEffect } from 'react';
import { Loader2, FileText, Brain, CheckCircle, AlertCircle, Lightbulb } from 'lucide-react';
import { ProcessingStatus } from '../types';

interface Props {
  status: ProcessingStatus;
}

const TIPS = [
  "💡 هل تعلم؟ أخذ استراحة قصيرة كل 25 دقيقة (تقنية بومودورو) يضاعف تركيزك.",
  "💡 هل تعلم؟ شرب الماء بانتظام أثناء الدراسة يحسن الوظائف الإدراكية.",
  "💡 نصيحة: حاول شرح ما تعلمته لشخص آخر لترسيخ المعلومة في ذهنك.",
  "💡 هل تعلم؟ النوم الجيد بعد الدراسة يساعد الدماغ على نقل المعلومات للذاكرة طويلة المدى.",
  "💡 نصيحة: استخدام الألوان والرسوم البيانية يجعل التذكر أسهل بمراحل.",
  "💡 هل تعلم؟ الدراسة في أوقات الصباح الباكر غالباً ما تكون أكثر إنتاجية."
];

export const ProcessingArea: React.FC<Props> = ({ status }) => {
  // Define discrete steps for the process
  const steps = [
    { id: 'extracting', label: 'قراءة الملف', icon: FileText },
    { id: 'analyzing', label: 'التحليل الذكي', icon: Brain },
    { id: 'completed', label: 'النتائج', icon: CheckCircle },
  ];

  const [currentTip, setCurrentTip] = useState(0);

  // Rotate tips every 5 seconds
  useEffect(() => {
    if (status.step === 'analyzing') {
      const timer = setInterval(() => {
        setCurrentTip((prev) => (prev + 1) % TIPS.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [status.step]);

  // Determine current active index based on status.step
  let activeIndex = 0;
  if (status.step === 'extracting') activeIndex = 0;
  if (status.step === 'analyzing') activeIndex = 1;
  if (status.step === 'completed') activeIndex = 2;
  
  const isError = status.step === 'error';

  return (
    <div className={`bg-white border rounded-xl p-8 mb-6 shadow-sm transition-all duration-300 ${isError ? 'border-red-200 bg-red-50' : 'border-blue-100'}`}>
      
      {/* Error View */}
      {isError ? (
        <div className="flex flex-col items-center text-center text-red-600 animate-in fade-in zoom-in duration-300">
          <div className="bg-red-100 p-4 rounded-full mb-4">
             <AlertCircle size={40} className="text-red-600" />
          </div>
          <h3 className="text-xl font-bold mb-2">حدث خطأ أثناء المعالجة</h3>
          <p className="text-gray-700 max-w-md">{status.message}</p>
        </div>
      ) : (
        /* Progress Stepper View */
        <div className="flex flex-col items-center w-full">
            
          {/* Stepper Header */}
          <div className="flex items-center justify-between w-full max-w-3xl mb-10 relative px-4">
             {/* Connection Line Background */}
             <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-100 -z-10 -translate-y-1/2 rounded mx-10"></div>
             
             {/* Connection Line Progress */}
             <div 
               className="absolute top-1/2 left-0 h-1 bg-blue-500 -z-10 -translate-y-1/2 rounded transition-all duration-700 ease-in-out mx-10"
               style={{ width: `calc(${(activeIndex / (steps.length - 1)) * 100}% - 5rem)` }}
             ></div>

             {steps.map((step, index) => {
               const isActive = index === activeIndex;
               const isCompleted = index < activeIndex;
               const isPending = index > activeIndex;

               return (
                 <div key={step.id} className="flex flex-col items-center bg-white px-2 relative z-10 min-w-[100px]">
                   <div className={`
                     w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-all duration-500 border-4 shadow-sm
                     ${isCompleted ? 'bg-green-500 border-green-500 text-white' : ''}
                     ${isActive ? 'bg-white border-blue-500 text-blue-600 scale-110 shadow-blue-200' : ''}
                     ${isPending ? 'bg-gray-50 border-gray-200 text-gray-300' : ''}
                   `}>
                     {isCompleted ? (
                       <CheckCircle size={24} className="animate-in zoom-in duration-300" />
                     ) : isActive ? (
                       <step.icon size={24} className={status.step !== 'completed' ? 'animate-pulse' : ''} />
                     ) : (
                       <step.icon size={24} />
                     )}
                   </div>
                   <span className={`text-sm font-bold transition-colors duration-300 ${isActive ? 'text-blue-800 scale-105' : isCompleted ? 'text-green-700' : 'text-gray-400'}`}>
                     {step.label}
                   </span>
                 </div>
               );
             })}
          </div>

          {/* Current Status Message & Spinner */}
          <div className="flex flex-col items-center animate-in slide-in-from-bottom-2 fade-in duration-500 w-full max-w-md">
            <div className="flex items-center gap-3 mb-6 bg-blue-50 px-6 py-3 rounded-full text-blue-800 border border-blue-100 shadow-sm">
               {status.step !== 'completed' && <Loader2 size={20} className="animate-spin text-blue-600" />}
               <span className="font-semibold text-center">{status.message}</span>
            </div>
            
            {/* Detailed Progress Bar */}
            {status.step !== 'completed' && (
                <div className="w-full">
                    <div className="flex justify-between text-xs text-gray-500 mb-2 font-medium">
                        <span>التقدم</span>
                        <span>{status.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner relative">
                        <div 
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300 ease-out relative" 
                            style={{ width: `${status.progress}%` }}
                        >
                            <div className="absolute inset-0 bg-white/30 w-full h-full animate-[shimmer_2s_infinite] skew-x-12"></div>
                        </div>
                    </div>
                    
                    {/* Animated Tips Section */}
                    {status.step === 'analyzing' && (
                      <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-4 w-full flex flex-col items-center text-center animate-fade-in transition-all duration-500">
                        <div className="flex items-center gap-2 text-amber-600 font-bold mb-2">
                          <Lightbulb size={18} />
                          <span>تلميح دراسي</span>
                        </div>
                        <p className="text-sm text-gray-700 font-medium min-h-[3rem] flex items-center justify-center animate-in fade-in slide-in-from-bottom-1 duration-500 key={currentTip}">
                          {TIPS[currentTip]}
                        </p>
                      </div>
                    )}
                </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};