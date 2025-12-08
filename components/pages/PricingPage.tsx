
import React from 'react';
import { Check, Star, Zap, Crown, MessageCircle, HelpCircle, ArrowLeft } from 'lucide-react';

interface Props {
  onNavigateHome: () => void;
}

export const PricingPage: React.FC<Props> = ({ onNavigateHome }) => {
  const whatsappNumber = "201022679250";
  const whatsappMessage = "مرحباً، أرغب في شراء باقة شحن للمنصة.";

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl animate-fade-in-up">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
          استثمر في مستقبلك الدراسي <span className="text-blue-600">بذكاء</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          اختر الباقة المناسبة لاحتياجاتك. جميع الباقات تمنحك وصولاً كاملاً لأدوات التلخيص، الخرائط الذهنية، والشرح العميق.
        </p>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20 relative z-10">
        
        {/* FREE PLAN */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-xl transition-shadow flex flex-col">
          <div className="mb-4">
             <span className="bg-gray-100 text-gray-600 font-bold px-3 py-1 rounded-full text-xs">البداية</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">الباقة اليومية</h3>
          <div className="flex items-baseline gap-1 mb-6">
             <span className="text-4xl font-extrabold text-gray-900">0</span>
             <span className="text-gray-500 font-medium">جنيه</span>
             <span className="text-sm text-gray-400">/ يومياً</span>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            مثالية للتجربة والملفات الصغيرة السريعة.
          </p>
          <ul className="space-y-3 mb-8 flex-1">
            <li className="flex items-center gap-2 text-sm text-gray-700"><Check size={16} className="text-green-500" /> 5 مشاريع يومياً</li>
            <li className="flex items-center gap-2 text-sm text-gray-700"><Check size={16} className="text-green-500" /> تلخيص PDF أساسي</li>
            <li className="flex items-center gap-2 text-sm text-gray-700"><Check size={16} className="text-green-500" /> رسوم بيانية محدودة</li>
          </ul>
          <button onClick={onNavigateHome} className="w-full py-3 rounded-xl border-2 border-gray-800 text-gray-800 font-bold hover:bg-gray-50 transition">
            جرب الآن مجاناً
          </button>
        </div>

        {/* TIER 10 */}
        <div className="bg-white rounded-2xl p-6 border border-blue-100 shadow-md hover:shadow-xl transition-shadow flex flex-col relative overflow-hidden">
          <div className="mb-4">
             <span className="bg-blue-100 text-blue-600 font-bold px-3 py-1 rounded-full text-xs">التوفير</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">باقة الطالب</h3>
          <div className="flex items-baseline gap-1 mb-6">
             <span className="text-4xl font-extrabold text-blue-600">10</span>
             <span className="text-gray-500 font-medium">جنيه</span>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            لمن يحتاج تلخيص عدة محاضرات أو فصول في وقت قصير.
          </p>
          <ul className="space-y-3 mb-8 flex-1">
            <li className="flex items-center gap-2 text-sm text-gray-700"><Check size={16} className="text-blue-500" /> <strong>10 مشاريع</strong> رصيد</li>
            <li className="flex items-center gap-2 text-sm text-gray-700"><Check size={16} className="text-blue-500" /> لا تنتهي صلاحيتها</li>
            <li className="flex items-center gap-2 text-sm text-gray-700"><Check size={16} className="text-blue-500" /> أولوية في المعالجة</li>
          </ul>
          <a href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage + " (باقة 10 جنيه)")}`} target="_blank" rel="noopener noreferrer" className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition flex justify-center items-center gap-2">
            شراء الكود <MessageCircle size={18} />
          </a>
        </div>

        {/* TIER 20 (Most Popular) */}
        <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-shadow flex flex-col relative transform scale-105 border-4 border-purple-200">
          <div className="absolute top-0 right-0 bg-yellow-400 text-purple-900 text-xs font-bold px-3 py-1 rounded-bl-xl">
             الأكثر مبيعاً 🔥
          </div>
          <div className="mb-4">
             <span className="bg-white/20 text-white font-bold px-3 py-1 rounded-full text-xs flex items-center gap-1 w-fit"><Star size={12} fill="white" /> المحترف</span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">باقة التميز</h3>
          <div className="flex items-baseline gap-1 mb-6">
             <span className="text-5xl font-extrabold text-white">20</span>
             <span className="text-purple-200 font-medium">جنيه</span>
          </div>
          <p className="text-sm text-purple-100 mb-6">
            أفضل قيمة مقابل سعر. تكفي لتلخيص مادة كاملة تقريباً.
          </p>
          <ul className="space-y-3 mb-8 flex-1">
            <li className="flex items-center gap-2 text-sm text-white"><Check size={16} className="text-yellow-400" /> <strong>20 مشروع</strong> كامل</li>
            <li className="flex items-center gap-2 text-sm text-white"><Check size={16} className="text-yellow-400" /> دعم الصور والملفات الكبيرة</li>
            <li className="flex items-center gap-2 text-sm text-white"><Check size={16} className="text-yellow-400" /> ميزة Deep Dive المتقدمة</li>
          </ul>
          <a href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage + " (باقة 20 جنيه)")}`} target="_blank" rel="noopener noreferrer" className="w-full py-3 rounded-xl bg-white text-purple-700 font-bold hover:bg-gray-50 transition flex justify-center items-center gap-2 shadow-lg">
            شراء الكود <Zap size={18} fill="currentColor" />
          </a>
        </div>

        {/* TIER 100 */}
        <div className="bg-white rounded-2xl p-6 border border-amber-200 shadow-md hover:shadow-xl transition-shadow flex flex-col relative overflow-hidden">
           <div className="absolute -right-6 top-6 bg-amber-100 w-24 h-24 rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
          <div className="mb-4 relative">
             <span className="bg-amber-100 text-amber-700 font-bold px-3 py-1 rounded-full text-xs flex items-center gap-1 w-fit"><Crown size={12} /> الخبراء</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">الباقة الذهبية</h3>
          <div className="flex items-baseline gap-1 mb-6">
             <span className="text-4xl font-extrabold text-amber-600">100</span>
             <span className="text-gray-500 font-medium">جنيه</span>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            للطلبة المجتهدين، الباحثين، ومجموعات المذاكرة.
          </p>
          <ul className="space-y-3 mb-8 flex-1">
            <li className="flex items-center gap-2 text-sm text-gray-700"><Check size={16} className="text-amber-500" /> <strong>200 مشروع</strong> (عرض ضخم)</li>
            <li className="flex items-center gap-2 text-sm text-gray-700"><Check size={16} className="text-amber-500" /> سعر المشروع = 0.5 جنيه</li>
            <li className="flex items-center gap-2 text-sm text-gray-700"><Check size={16} className="text-amber-500" /> دعم فني مباشر</li>
          </ul>
          <a href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage + " (باقة 100 جنيه)")}`} target="_blank" rel="noopener noreferrer" className="w-full py-3 rounded-xl bg-gray-900 text-white font-bold hover:bg-black transition flex justify-center items-center gap-2">
            شراء الكود <Crown size={18} />
          </a>
        </div>

      </div>

      {/* Info Sections Grid */}
      <div className="grid md:grid-cols-2 gap-8">
        
        {/* How it Works */}
        <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
           <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <HelpCircle className="text-blue-600" />
              ما هو "المشروع" أو "الرصيد"؟
           </h3>
           <p className="text-gray-700 leading-relaxed mb-4">
              الرصيد الواحد (1 Credit) يساوي عملية تحليل كاملة لملف واحد.
           </p>
           <ul className="space-y-2 text-sm text-gray-600">
              <li>• رفع كتاب PDF وتلخيصه = <strong>1 مشروع</strong></li>
              <li>• رفع عرض PowerPoint وشرحه = <strong>1 مشروع</strong></li>
              <li>• الأسئلة والدردشة (Deep Dive) داخل الملف = <strong>مجاناً</strong> (ضمن المشروع)</li>
              <li>• الاستماع الصوتي = <strong>مجاناً</strong></li>
           </ul>
        </div>

        {/* Payment Methods */}
        <div className="bg-blue-50 rounded-2xl p-8 border border-blue-100">
           <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
              <MessageCircle className="text-blue-600" />
              طريقة الشراء والشحن
           </h3>
           <ol className="space-y-4 text-blue-800 list-decimal list-inside">
              <li>اضغط على زر <strong>"شراء الكود"</strong> في الباقة التي تناسبك.</li>
              <li>سيحولك الزر إلى <strong>واتساب</strong> للتواصل مع خدمة العملاء.</li>
              <li>قم بالدفع عبر <strong>فودافون كاش (Vodafone Cash)</strong> أو <strong>Instapay</strong>.</li>
              <li>سيتم إرسال <strong>كود الشحن</strong> (مثال: EG20-ABCD) فوراً.</li>
              <li>ضع الكود في الصفحة الرئيسية للموقع وسيتم إضافة الرصيد.</li>
           </ol>
        </div>

      </div>

    </div>
  );
};
