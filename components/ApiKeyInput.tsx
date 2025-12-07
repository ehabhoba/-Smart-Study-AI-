
import React, { useState, useEffect } from 'react';
import { Key, Lock, Unlock, Zap, MessageCircle, Star } from 'lucide-react';
import { REDEMPTION_CODES, TRIAL_KEY, getRandomKey, SubscriptionState } from '../config/subscriptionConfig';

interface Props {
  subscription: SubscriptionState;
  updateSubscription: (newState: SubscriptionState) => void;
}

export const ApiKeyInput: React.FC<Props> = ({ subscription, updateSubscription }) => {
  const [inputCode, setInputCode] = useState('');
  const [error, setError] = useState('');
  
  const whatsappNumber = "201022679250"; 
  const whatsappMessage = "مرحباً، أريد شراء كود شحن للملخص الدراسي الذكي.";

  // Handle Free Trial Activation
  const handleActivateTrial = () => {
    if (subscription.hasUsedTrial) return;
    
    const newState: SubscriptionState = {
      hasUsedTrial: true, // Mark as used immediately so they can't use it again after this session
      remainingCredits: 1, // One time use
      currentTier: 0,
      activeApiKey: TRIAL_KEY
    };
    updateSubscription(newState);
  };

  // Handle Code Redemption
  const handleRedeemCode = () => {
    const cleanCode = inputCode.trim().toUpperCase();
    const plan = REDEMPTION_CODES[cleanCode];

    if (plan) {
      // Valid Code
      const newState: SubscriptionState = {
        hasUsedTrial: true,
        remainingCredits: subscription.remainingCredits + plan.credits,
        currentTier: plan.tier,
        activeApiKey: getRandomKey(plan.keys) // Assign a random key from the pool
      };
      updateSubscription(newState);
      setInputCode('');
      setError('');
      alert(`تم شحن الرصيد بنجاح! تم إضافة ${plan.credits} مشروع.`);
    } else {
      setError('الكود غير صالح أو خاطئ. تأكد من كتابته بشكل صحيح (مثل: EG10-XXXX)');
    }
  };

  // 1. Case: Active Subscription with Credits
  if (subscription.remainingCredits > 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 border border-green-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-full">
              <Zap size={24} className="text-green-600 fill-current" />
            </div>
            <div>
              <h3 className="font-bold text-green-900 text-lg">الاشتراك مفعل</h3>
              <p className="text-green-700">
                الرصيد المتبقي: <span className="font-bold text-2xl mx-1">{subscription.remainingCredits}</span> مشروع
              </p>
            </div>
          </div>
          {subscription.currentTier > 0 && (
            <span className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
              باقة {subscription.currentTier} جنيه
            </span>
          )}
          {subscription.currentTier === 0 && (
            <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
              نسخة تجريبية
            </span>
          )}
        </div>
      </div>
    );
  }

  // 2. Case: No Credits (Expired or Fresh)
  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-2 h-full bg-red-500"></div>
      
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-2">
          <Lock className="text-red-500" />
          تفعيل الخدمة
        </h3>
        
        {!subscription.hasUsedTrial ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold text-blue-900">جديد معنا؟</p>
              <p className="text-sm text-blue-700">جرب الأداة مجاناً لمرة واحدة لتتأكد من الجودة.</p>
            </div>
            <button 
              onClick={handleActivateTrial}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold shadow-sm transition flex items-center gap-2"
            >
              <Star size={16} className="fill-current" />
              تجربة مجانية الآن
            </button>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-6 text-sm text-red-800 flex items-center gap-2">
            <div className="bg-white p-1 rounded-full"><Lock size={12} /></div>
            <span>لقد استهلكت جميع محاولاتك. يرجى شحن رصيدك للمتابعة.</span>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* Code Input Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            لديك كود تفعيل؟ أدخله هنا:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="EG10-XXXX"
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase font-mono tracking-wider"
            />
            <button
              onClick={handleRedeemCode}
              disabled={!inputCode}
              className="bg-gray-800 text-white px-5 rounded-lg font-bold hover:bg-gray-900 transition disabled:opacity-50"
            >
              تفعيل
            </button>
          </div>
          {error && <p className="text-red-500 text-sm mt-2 font-medium">{error}</p>}
        </div>

        {/* Pricing & Contact Section */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <h4 className="font-bold text-gray-900 mb-3 text-sm">باقات الشحن المتوفرة:</h4>
          <ul className="space-y-2 mb-4 text-sm">
            <li className="flex justify-between border-b border-gray-200 pb-1">
              <span>💎 باقة التوفير (10 مشاريع)</span>
              <span className="font-bold">10 جنيه</span>
            </li>
            <li className="flex justify-between border-b border-gray-200 pb-1">
              <span>💎 باقة المحترف (20 مشروع)</span>
              <span className="font-bold">50 جنيه</span>
            </li>
            <li className="flex justify-between border-b border-gray-200 pb-1">
              <span>💎 باقة الخبراء (50 مشروع)</span>
              <span className="font-bold">100 جنيه</span>
            </li>
          </ul>
          
          <a
            href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 shadow-sm transition transform active:scale-95"
          >
            <MessageCircle size={18} />
            <span>شراء كود عبر واتساب</span>
          </a>
        </div>
      </div>
    </div>
  );
};
