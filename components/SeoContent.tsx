import React from 'react';
import { BookOpen, GraduationCap, School, Lightbulb, Link2, PlayCircle } from 'lucide-react';

export const SeoContent: React.FC = () => {
  return (
    <article className="container mx-auto px-4 py-12 max-w-5xl bg-white rounded-xl shadow-sm border border-gray-100 mt-12 mb-8">
      {/* Blog Header */}
      <header className="mb-8 border-b border-gray-100 pb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          كيف يحدث "المُلخص الدراسي الذكي" ثورة في طرق المذاكرة للطلاب؟
        </h1>
        <p className="text-gray-600 text-lg leading-relaxed">
          اكتشف كيف تساعدك <a href="https://tool-v1.5199.online" className="text-blue-600 hover:underline font-bold">أداة الملخص الدراسي الذكي</a> في تحسين تحصيلك الدراسي، تلخيص المحاضرات الجامعية، وحل الكتب المدرسية باستخدام أحدث تقنيات الذكاء الاصطناعي (Gemini AI).
        </p>
      </header>

      {/* Main Content */}
      <div className="grid md:grid-cols-3 gap-8">
        
        <div className="md:col-span-2 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-blue-800 mb-3 flex items-center gap-2">
              <GraduationCap className="text-blue-600" />
              لطلاب الجامعات والباحثين
            </h2>
            <p className="text-gray-700 leading-relaxed">
              يواجه طلاب الجامعات (مثل <strong>جامعة القاهرة، جامعة عين شمس، وجامعة الملك سعود</strong>) تحدياً كبيراً في قراءة المراجع الضخمة. توفر أداتنا حلاً سحرياً:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2 text-gray-700 marker:text-blue-500">
              <li><strong>تلخيص ملفات PDF:</strong> رفع كتب كاملة وتلخيصها في نقاط مركزة.</li>
              <li><strong>تحليل عروض PowerPoint:</strong> تحويل شرائح المحاضرات إلى نص مقروء ومذكرات دراسية.</li>
              <li><strong>الخرائط الذهنية:</strong> تحويل المفاهيم المعقدة إلى رسوم بيانية (Mermaid Charts) لتسهيل الحفظ.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-800 mb-3 flex items-center gap-2">
              <School className="text-green-600" />
              لطلاب المدارس والثانوية العامة
            </h2>
            <p className="text-gray-700 leading-relaxed">
              سواء كنت تدرس في المنهج المصري، السعودي، أو الدولي، تساعدك المنصة في:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2 text-gray-700 marker:text-green-500">
              <li><strong>بنك الأسئلة المتوقعة:</strong> يقوم الذكاء الاصطناعي بصياغة أسئلة مراجعة بناءً على محتوى الكتاب المدرسي.</li>
              <li><strong>شرح الدروس الصعبة:</strong> استخدم ميزة "Deep Dive" للحصول على شرح مبسط لأي جزء غير مفهوم.</li>
              <li><strong>القراءة الصوتية:</strong> استمع للملخصات بدلاً من قراءتها لتوفير الوقت.</li>
            </ul>
          </section>

          <section className="bg-amber-50 p-6 rounded-lg border border-amber-200">
            <h2 className="text-xl font-bold text-amber-900 mb-3 flex items-center gap-2">
              <Lightbulb className="text-amber-600" />
              لماذا تختار منصتنا؟
            </h2>
            <p className="text-gray-800">
              على عكس الأدوات الأخرى، نحن ندعم <strong>اللغة العربية بنسبة 100%</strong> ونستخدم نماذج ذكية متخصصة في التعليم. الأداة مجانية وتعمل مباشرة من المتصفح دون تثبيت برامج.
            </p>
            <div className="mt-4 pt-4 border-t border-amber-200">
              <p className="font-bold text-amber-800 mb-2">رابط الأداة الرسمي للمشاركة:</p>
              <div className="flex items-center gap-2 bg-white p-3 rounded border border-amber-300">
                <Link2 size={16} className="text-gray-500" />
                <code className="text-blue-700 select-all">https://tool-v1.5199.online</code>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar / Tags */}
        <aside className="space-y-6">
          
          {/* Promo Video Widget - Optimized for Shorts */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
             <div className="bg-gradient-to-r from-red-600 to-red-700 p-3 text-white flex items-center gap-2">
                <PlayCircle size={20} />
                <h3 className="font-bold text-sm">شرح سريع (فيديو)</h3>
             </div>
             {/* Aspect Ratio 9:16 Container */}
             <div className="relative w-full aspect-[9/16] bg-black">
                <iframe 
                  className="absolute top-0 left-0 w-full h-full"
                  src="https://www.youtube.com/embed/aBPrk3asifg?rel=0&playsinline=1" 
                  title="Smart Study AI Promo"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                  allowFullScreen
                ></iframe>
             </div>
          </div>

          <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4 border-b pb-2">كلمات بحث شائعة</h3>
            <div className="flex flex-wrap gap-2">
              {['تلخيص PDF', 'حل أسئلة', 'شرح مناهج', 'ثانوية عامة', 'ذكاء اصطناعي', 'خرائط ذهنية', 'مذاكرة', 'جامعة', 'بحث علمي'].map(tag => (
                <span key={tag} className="text-xs bg-white px-2 py-1 rounded border border-gray-300 text-gray-600 hover:text-blue-600 cursor-default">
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 p-5 rounded-lg border border-blue-100 text-center">
            <BookOpen size={48} className="mx-auto text-blue-600 mb-3" />
            <h3 className="font-bold text-blue-900 mb-2">ابدأ المذاكرة الآن</h3>
            <p className="text-sm text-blue-700 mb-4">
              ارفع كتابك واكتشف سحر الدراسة الذكية.
            </p>
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
            >
              اصعد للتلخيص
            </button>
          </div>
        </aside>

      </div>
    </article>
  );
};