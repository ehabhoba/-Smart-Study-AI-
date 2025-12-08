
import React, { useState, useEffect, useCallback } from 'react';
import { X, ArrowRight, ArrowLeft, Check } from 'lucide-react';

interface Props {
  onClose: () => void;
}

const STEPS = [
  {
    targetId: 'header-logo', // We need to ensure header has this ID or fallback to center
    title: "مرحباً بك في المُلخص الدراسي الذكي! 🎓",
    content: "دعنا نأخذك في جولة سريعة لتعلم كيفية استخدام الأدوات باحترافية.",
    position: 'center'
  },
  {
    targetId: 'subscription-section',
    title: "1. الشحن والتفعيل 🔑",
    content: "هنا يتم إدخال كود التفعيل. يمكنك معرفة رصيدك المتبقي، وموعد تجديد الباقة المجانية، أو شحن رصيد جديد.",
    position: 'bottom'
  },
  {
    targetId: 'upload-section',
    title: "2. رفع الملفات 📂",
    content: "اضغط هنا لرفع ملفاتك. نحن ندعم ملفات PDF، عروض PowerPoint، وحتى الصور.",
    position: 'right'
  },
  {
    targetId: 'settings-section',
    title: "3. إعدادات التحليل ⚙️",
    content: "تحكم في نوع الملخص (امتحان/شامل) وعدد الفقرات قبل البدء. ثم اضغط زر 'ابدأ التحليل'.",
    position: 'left'
  }
];

export const OnboardingTour: React.FC<Props> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isReady, setIsReady] = useState(false);

  const updatePosition = useCallback(() => {
    const step = STEPS[currentStep];
    
    // If it's the welcome step (center), strictly return null rect to trigger center modal
    if (step.position === 'center') {
        setTargetRect(null);
        return;
    }

    const element = document.getElementById(step.targetId);
    if (element) {
      const rect = element.getBoundingClientRect();
      // Ensure the element is in view
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTargetRect(rect);
    } else {
      // Fallback if element not found
      setTargetRect(null);
    }
  }, [currentStep]);

  useEffect(() => {
    // Add small delay to allow UI to render/scroll
    const timer = setTimeout(() => {
        updatePosition();
        setIsReady(true);
    }, 500);

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);
    
    return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition);
    };
  }, [currentStep, updatePosition]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  if (!isReady) return null;

  const step = STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden">
      
      {/* 1. The Spotlight Mask / Overlay */}
      {targetRect ? (
        <div 
            className="absolute transition-all duration-500 ease-in-out border-blue-500/30"
            style={{
                top: targetRect.top - 4, // Add padding
                left: targetRect.left - 4,
                width: targetRect.width + 8,
                height: targetRect.height + 8,
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75)', // The trick to create a hole
                borderRadius: '12px',
                pointerEvents: 'none' // Allow clicking through if needed, though usually we block interaction during tour
            }}
        >
             {/* Pulsing ring */}
             <div className="absolute inset-0 border-2 border-blue-400 rounded-xl animate-ping opacity-75"></div>
        </div>
      ) : (
        // Full dark overlay for center modal
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"></div>
      )}

      {/* 2. The Tooltip Card */}
      <div 
        className={`absolute bg-white p-6 rounded-2xl shadow-2xl w-[90%] max-w-md transition-all duration-500 flex flex-col`}
        style={targetRect ? {
            // Logic to position tooltip near the spotlight
            top: targetRect.bottom + 20 > window.innerHeight - 200 
                 ? targetRect.top - 220 // If low on screen, place above
                 : targetRect.bottom + 20, // Else place below
            left: Math.max(20, Math.min(window.innerWidth - 340, targetRect.left + (targetRect.width / 2) - 160)), // Center horizontally but keep in bounds
            position: 'fixed'
        } : {
            // Center position
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            position: 'fixed'
        }}
      >
         {/* Arrow (Only if spotlight active) */}
         {targetRect && (
             <div 
                className={`absolute w-4 h-4 bg-white transform rotate-45 left-1/2 -translate-x-1/2 
                ${targetRect.bottom + 20 > window.innerHeight - 200 ? '-bottom-2' : '-top-2'}`}
             ></div>
         )}

         <div className="flex justify-between items-start mb-4">
             <h3 className="text-xl font-bold text-gray-900">{step.title}</h3>
             <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
         </div>
         
         <p className="text-gray-600 mb-6 leading-relaxed">
             {step.content}
         </p>

         <div className="flex justify-between items-center mt-auto">
             <div className="flex gap-1">
                 {STEPS.map((_, i) => (
                     <div key={i} className={`h-2 w-2 rounded-full transition-colors ${i === currentStep ? 'bg-blue-600' : 'bg-gray-200'}`} />
                 ))}
             </div>
             
             <div className="flex gap-2">
                 {currentStep > 0 && (
                     <button onClick={handlePrev} className="px-3 py-1.5 text-gray-500 hover:text-gray-800 font-medium">
                         السابق
                     </button>
                 )}
                 <button 
                    onClick={handleNext}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg shadow-blue-200 font-bold flex items-center gap-2 transform active:scale-95 transition"
                 >
                    {currentStep === STEPS.length - 1 ? 'ابدأ' : 'التالي'}
                    {currentStep === STEPS.length - 1 ? <Check size={16} /> : <ArrowLeft size={16} />}
                 </button>
             </div>
         </div>
      </div>

    </div>
  );
};
