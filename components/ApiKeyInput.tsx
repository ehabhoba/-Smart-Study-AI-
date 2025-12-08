
import React, { useState, useEffect } from 'react';
import { Key, Lock, Unlock, Zap, MessageCircle, Star, CheckCircle, XCircle, Clock, Terminal } from 'lucide-react';
import { REDEMPTION_CODES, TRIAL_KEY, getRandomKey, SubscriptionState, DAILY_FREE_LIMIT } from '../config/subscriptionConfig';

interface Props {
  subscription: SubscriptionState;
  updateSubscription: (newState: SubscriptionState) => void;
}

export const ApiKeyInput: React.FC<Props> = ({ subscription, updateSubscription }) => {
  const [inputCode, setInputCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [nextReset, setNextReset] = useState('');

  const whatsappNumber = "201022679250"; 
  const whatsappMessage = "مرحباً، أريد شراء كود شحن للملخص الدراسي الذكي.";

  // Calculate time until next reset for free tier
  useEffect(() => {
    if (subscription.currentTier === 0 && subscription.lastDailyReset) {
      const updateTimer = () => {
        const resetTime = new Date(subscription.lastDailyReset!).getTime() + (24 * 60 * 60 * 1000);
        const now = new Date().getTime();
        const diff = resetTime - now;

        if (diff <= 0) {
          setNextReset('جاهز للتجديد الآن');
        } else {
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setNextReset(`${hours} ساعة و ${minutes} دقيقة`);
        }
      };
      
      updateTimer();
      const interval = setInterval(updateTimer, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [subscription.lastDailyReset, subscription.currentTier]);

  // Handle Code Redemption
  const handleRedeemCode = () => {
    const cleanCode = inputCode.trim(); // Case sensitive check later

    if (!cleanCode) {
        setError("يرجى إدخال الكود أولاً.");
        return;
    }

    // --- Developer Mode: Direct API Key Input ---
    // If input starts with 'AIza', treat it as a direct Google API Key
    if (cleanCode.startsWith('AIza')) {
        const newState: SubscriptionState = {
            ...subscription,
            remainingCredits: 9999, // Unlimited for direct key
            currentTier: 999, // Developer Tier
            activeApiKey: cleanCode,
        };
        updateSubscription(newState);
        setInputCode('');
        setError('');
        setSuccess('تم تفعيل وضع المطور (Developer Mode) بنجاح! 🚀');
        setTimeout(() => setSuccess(''), 5000);
        return;
    }

    // --- Normal User Mode: Coupon Codes ---
    const upperCode = cleanCode.toUpperCase();
    
    // Check if code has been used locally
    const usedCodes = JSON.parse(localStorage.getItem('smart_study_used_codes') || '[]');
    if (usedCodes.includes(upperCode)) {
       setError('⚠️ هذا الكود تم استخدامه مسبقاً على هذا الجهاز.');
       setSuccess('');
       return;
    }

    const plan = REDEMPTION_CODES[upperCode];

    if (plan) {
      // Valid Code Logic
      const newState: SubscriptionState = {
        ...subscription,
        remainingCredits: subscription.remainingCredits + plan.credits,
        currentTier: plan.tier,
        activeApiKey: getRandomKey(plan.keys),
      };
      
      updateSubscription(newState);
      
      usedCodes.push(upperCode);
      localStorage.setItem('smart_study_used_codes', JSON.stringify(usedCodes));

      setInputCode('');
      setError('');
      setSuccess(`تم شحن الرصيد بنجاح! 🎉\nتم إضافة ${plan.credits} مشروع.`);
      setTimeout(() => setSuccess(''), 5000);
    } else {
      setError('❌ الكود غير صالح. تأكد من كتابته بشكل صحيح (مثل: EG10-XXXX) أو أدخل مفتاح API مباشر.');
      setSuccess('');
    }
  };

  const isFreeTier = subscription.currentTier === 0;

  // 1. Case: Active Subscription (Free or Paid) with Credits
  if (subscription.remainingCredits > 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 border border-green-200 animate-in fade-in slide-in-from-top-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-full">
              <Zap size={24} className="text-green-600 fill-current" />
            </div>
            <div>
              <h3 className="font-bold text-green-900 text-lg">
                {subscription.currentTier === 999 ? 'وضع المطور (غير محدود)' : isFreeTier ? 'الباقة المجانية اليومية' : 'الاشتراك المميز مفعل'}
              </h3>
              <p className="text-green-700">
                المتبقي اليوم: <span className="font-bold text-2xl mx-1">{subscription.remainingCredits}</span> {isFreeTier ? `/ ${DAILY_FREE_LIMIT}` : ''} مشروع
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            {isFreeTier ? (
              <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Clock size={12} />
                يتجدد الرصيد خلال: {nextReset || '...'}
              </span>
            ) : (
              <span className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                باقة {subscription.currentTier === 999 ? 'DEV' : subscription.currentTier + ' جنيه'}
              </span>
            )}
            
            {!isFreeTier && (
                 <div className="text-xs text-gray-500 underline cursor-pointer mt-1" onClick={() => setSuccess('أدخل كود جديد في الأسفل للشحن')}>
                    شحن المزيد؟
                 </div>
            )}
          </div>
        </div>
        
        {success && (
            <div className="mt-4 bg-green-50 border border-green-200 text-green-800 p-3 rounded-lg flex items-center gap-2 text-sm font-medium">
                <CheckCircle size={18} />
                <span className="whitespace-pre-line">{success}</span>
            </div>
        )}
      </div>
    );
  }

  // 2. Case: No Credits
  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-2 h-full bg-red-500"></div>
      
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-2">
          <Lock className="text-red-500" />
          تفعيل الخدمة
        </h3>
        
        {isFreeTier ? (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold text-orange-900">انتهت المحاولات المجانية لليوم ({DAILY_FREE_LIMIT}/5)</p>
              <p className="text-sm text-orange-800 flex items-center gap-1 mt-1">
                 <Clock size={14} />
                 سيتم تجديد الرصيد المجاني خلال: <span className="font-bold dir-ltr">{nextReset}</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-6 text-sm text-red-800 flex items-center gap-2">
            <div className="bg-white p-1 rounded-full"><Lock size={12} /></div>
            <span>لقد استهلكت جميع رصيدك المدفوع. يرجى شحن رصيد جديد للمتابعة.</span>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* Code Input Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            أدخل كود الشحن (EG10...) أو مفتاح API مباشر:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => {
                  setInputCode(e.target.value);
                  setError('');
              }}
              placeholder="EG10-XXXX أو AIzaSy..."
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono tracking-wider"
              onKeyDown={(e) => e.key === 'Enter' && handleRedeemCode()}
            />
            <button
              onClick={handleRedeemCode}
              disabled={!inputCode}
              className="bg-gray-800 text-white px-5 rounded-lg font-bold hover:bg-gray-900 transition disabled:opacity-50"
            >
              تفعيل
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
             <Terminal size={12} />
             تلميح: يمكنك إدخال مفتاح Google API الخاص بك مباشرة (يبدأ بـ AIza) لتخطي نظام الكوبونات.
          </p>
          
          {error && (
             <div className="mt-3 text-red-600 text-sm font-medium flex items-center gap-1 bg-red-50 p-2 rounded animate-in fade-in">
                 <XCircle size={16} />
                 {error}
             </div>
          )}
          {success && (
             <div className="mt-3 text-green-700 text-sm font-medium flex items-center gap-1 bg-green-50 p-2 rounded animate-in fade-in border border-green-200">
                 <CheckCircle size={16} />
                 <span className="whitespace-pre-line">{success}</span>
             </div>
          )}
        </div>

        {/* Pricing & Contact Section */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <h4 className="font-bold text-gray-900 mb-3 text-sm">باقات الشحن الإضافية:</h4>
          <ul className="space-y-2 mb-4 text-sm">
            <li className="flex justify-between border-b border-gray-200 pb-1">
              <span>💎 باقة التوفير (10 مشاريع)</span>
              <span className="font-bold">10 جنيه</span>
            </li>
            <li className="flex justify-between border-b border-gray-200 pb-1">
              <span>💎 باقة المحترف (20 مشروع)</span>
              <span className="font-bold">20 جنيه</span>
            </li>
            <li className="flex justify-between border-b border-gray-200 pb-1">
              <span>💎 باقة الخبراء (200 مشروع)</span>
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
