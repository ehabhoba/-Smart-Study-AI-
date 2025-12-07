import React, { useState } from 'react';
import { Key, Eye, EyeOff, MessageCircle, CheckCircle, Trash2 } from 'lucide-react';

interface Props {
  apiKey: string;
  setApiKey: (key: string) => void;
}

export const ApiKeyInput: React.FC<Props> = ({ apiKey, setApiKey }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');
  
  // رقم الواتساب لخدمة العملاء
  const whatsappNumber = "201022679250"; 

  const handleSave = () => {
    if (inputValue.trim()) {
      setApiKey(inputValue.trim());
      setInputValue('');
    }
  };

  const handleClear = () => {
    if (window.confirm('هل أنت متأكد من حذف المفتاح من هذا الجهاز؟')) {
      setApiKey('');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
        <Key size={16} className="text-blue-600" />
        مفتاح Google Gemini API
      </label>
      
      {apiKey ? (
        // Saved State
        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-3">
             <div className="bg-green-100 p-2 rounded-full">
               <CheckCircle size={24} className="text-green-600" />
             </div>
             <div>
               <p className="font-bold text-green-800 text-sm">المفتاح محفوظ على هذا الجهاز</p>
               <p className="text-xs text-green-600">يمكنك استخدام التطبيق مباشرة</p>
             </div>
          </div>
          <button 
            onClick={handleClear}
            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded transition flex items-center gap-1 text-sm font-medium"
          >
            <Trash2 size={16} />
            حذف
          </button>
        </div>
      ) : (
        // Input State
        <>
          <div className="flex gap-2 mb-2">
            <div className="relative flex-1">
              <input
                type={isVisible ? "text" : "password"}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>
            <button
              onClick={() => setIsVisible(!isVisible)}
              className="text-gray-500 hover:text-blue-600 px-3 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition"
            >
              {isVisible ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
            <button
              onClick={handleSave}
              disabled={!inputValue}
              className="bg-blue-600 text-white px-6 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              حفظ
            </button>
          </div>
          
          <p className="text-xs text-gray-500 mb-4">
            سيتم حفظ المفتاح على هذا الجهاز فقط لسهولة الاستخدام مستقبلاً.
          </p>
        </>
      )}

      {/* WhatsApp Upsell Section */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
           <p className="text-sm text-gray-800 font-bold mb-1">
             تواجه صعوبة في استخراج المفتاح أو لا تملك واحداً؟
           </p>
           <p className="text-sm text-gray-600">
             يمكنك طلب مفتاح API جاهز ومفعل مقابل <span className="font-bold text-red-600 text-lg">10 جنيه مصري</span> فقط.
           </p>
        </div>
        <a
          href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent("مرحباً، أريد شراء مفتاح Gemini API للملخص الدراسي الذكي.")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-5 rounded-lg flex items-center gap-2 shadow-sm transition transform active:scale-95 whitespace-nowrap"
        >
          <MessageCircle size={20} />
          <span>اطلب عبر واتساب</span>
        </a>
      </div>
    </div>
  );
};