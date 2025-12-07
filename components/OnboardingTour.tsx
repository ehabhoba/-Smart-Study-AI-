
import React, { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, Check, Zap, Upload, Brain, GraduationCap } from 'lucide-react';

interface Props {
  onClose: () => void;
}

const STEPS = [
  {
    title: "أهلاً بك في المُلخص الدراسي الذكي! 🎓",
    content: "رفيقك الذكي لتحليل الكتب، تلخيص المناهج، وحل الأسئلة باستخدام أحدث تقنيات الذكاء الاصطناعي.",
    icon: <GraduationCap size={64} className="text-blue-600" />,
    color: "bg-blue-50"
  },
  {
    title: "1. الشحن والتفعيل 🔑",
    content: "للبدء، تحتاج إلى تفعيل الخدمة. يمكنك تجربة الأداة مجاناً لمرة واحدة، أو شراء كود شحن (باقات 10، 20، 100 جنيه) للحصول على رصيد دائم.",
    icon: <Zap size={64} className="text-yellow-500" />,
    color: "bg-yellow-50"
  },
  {
    title: "2. رفع الملفات 📂",
    content: "نحن ندعم جميع الصيغ! ارفع كتب PDF، عروض PowerPoint، أو حتى صور من المذكرات. سيقوم النظام بقراءة النصوص والصور بداخلها.",
    icon: <Upload size={64} className="text-purple-600" />,
    color: "bg-purple-50"
  },
  {
    title: "3. اختر نوع التحليل ⚙️",
    content: "حدد مستوى التلخيص المناسب لك: 'كبسولة الامتحان' للمراجعة السريعة، أو 'شامل' للدراسة العميقة مع الرسوم البيانية.",
    icon: <Brain size={64} className="text-green-600" />,
    color: "bg-green-50"
  }
];

export const OnboardingTour: React.FC<Props> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Small delay for animation
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for exit animation
  };

  const stepData = STEPS[currentStep];

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className={`
        bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden transform transition-all duration-300
        ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'}
      `}>
        
        {/* Top Image/Icon Area */}
        <div className={`h-40 ${stepData.color} flex items-center justify-center relative transition-colors duration-500`}>
          <button 
            onClick={handleClose} 
            className="absolute top-4 right-4 bg-white/50 hover:bg-white/80 p-2 rounded-full transition text-gray-600"
          >
            <X size={20} />
          </button>
          <div className="transform transition-all duration-500 scale-110 animate-[bounce_3s_infinite]">
            {stepData.icon}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-8 text-center">
          <div className="flex justify-center gap-1.5 mb-6">
            {STEPS.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-8 bg-blue-600' : 'w-2 bg-gray-200'}`}
              ></div>
            ))}
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4 animate-fade-in key={currentStep}">
            {stepData.title}
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed mb-8 min-h-[80px] animate-fade-in key={currentStep}-p">
            {stepData.content}
          </p>

          <div className="flex items-center justify-between gap-4">
             {currentStep > 0 ? (
               <button 
                 onClick={handlePrev}
                 className="text-gray-500 font-medium hover:text-gray-800 px-4 py-2 transition"
               >
                 السابق
               </button>
             ) : (
               <button 
                 onClick={handleClose}
                 className="text-gray-400 font-medium hover:text-gray-600 px-4 py-2 transition"
               >
                 تخطي
               </button>
             )}

             <button 
               onClick={handleNext}
               className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 transform hover:scale-105 transition flex items-center gap-2"
             >
               {currentStep === STEPS.length - 1 ? 'ابدأ الآن' : 'التالي'}
               {currentStep === STEPS.length - 1 ? <Check size={18} /> : <ArrowLeft size={18} />}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
