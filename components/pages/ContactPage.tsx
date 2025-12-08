
import React from 'react';
import { Mail, MessageCircle, MapPin, Send } from 'lucide-react';

export const ContactPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl animate-fade-in-up">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">اتصل بنا</h1>
        <p className="text-xl text-gray-600">
          نحن هنا لمساعدتك. هل لديك استفسار أو اقتراح؟
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        {/* Contact Info */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
             <div className="bg-green-100 p-3 rounded-full text-green-600"><MessageCircle size={24} /></div>
             <div>
               <h3 className="font-bold text-gray-900 text-lg">واتساب (دعم فوري)</h3>
               <p className="text-gray-500 mb-2">متاح من 9 صباحاً حتى 10 مساءً</p>
               <a href="https://wa.me/201022679250" className="text-green-600 font-bold hover:underline">
                 +20 102 267 9250
               </a>
             </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
             <div className="bg-blue-100 p-3 rounded-full text-blue-600"><Mail size={24} /></div>
             <div>
               <h3 className="font-bold text-gray-900 text-lg">البريد الإلكتروني</h3>
               <p className="text-gray-500 mb-2">للاستفسارات التجارية والتقنية</p>
               <a href="mailto:info@ehabgm.online" className="text-blue-600 font-bold hover:underline">
                 info@ehabgm.online
               </a>
             </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
             <div className="bg-gray-100 p-3 rounded-full text-gray-600"><MapPin size={24} /></div>
             <div>
               <h3 className="font-bold text-gray-900 text-lg">المقر</h3>
               <p className="text-gray-600">
                 القاهرة، جمهورية مصر العربية<br />
                 المنطقة التكنولوجية
               </p>
             </div>
          </div>
        </div>

        {/* Fake Form for Visuals */}
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
           <h3 className="text-2xl font-bold mb-6 text-gray-800">أرسل لنا رسالة</h3>
           <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">الاسم</label>
                <input type="text" className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 focus:border-blue-500 outline-none" placeholder="اسمك الكريم" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">البريد الإلكتروني</label>
                <input type="email" className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 focus:border-blue-500 outline-none" placeholder="email@example.com" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">الرسالة</label>
                <textarea rows={4} className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 focus:border-blue-500 outline-none" placeholder="كيف يمكننا مساعدتك؟"></textarea>
              </div>
              <button className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-black transition flex items-center justify-center gap-2">
                 <Send size={18} />
                 إرسال الرسالة
              </button>
           </form>
        </div>
      </div>
    </div>
  );
};
