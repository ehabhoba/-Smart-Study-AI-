
import React from 'react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl animate-fade-in-up bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 border-b pb-4">سياسة الخصوصية</h1>
      
      <div className="prose prose-blue max-w-none text-gray-700">
        <p className="lead text-lg mb-6">
          في <strong>المُلخص الدراسي الذكي</strong>، نولي خصوصية بياناتك أهمية قصوى. تشرح هذه الوثيقة كيف نتعامل مع المعلومات التي تشاركها معنا.
        </p>

        <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">1. البيانات التي نجمعها</h3>
        <p>
          نحن لا نطلب منك تسجيل الدخول باستخدام بريد إلكتروني أو رقم هاتف لاستخدام الميزات الأساسية.
          عند رفع ملف (PDF/PPTX)، يتم معالجته لحظياً بواسطة خوادم الذكاء الاصطناعي (Google Gemini) ولا يتم تخزينه بشكل دائم على خوادمنا الخاصة.
        </p>

        <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">2. استخدام التخزين المحلي (Local Storage)</h3>
        <p>
          نستخدم ذاكرة المتصفح (Local Storage) لحفظ:
        </p>
        <ul className="list-disc list-inside mb-4">
          <li>سجل الملخصات السابقة (History) لتسهيل وصولك إليها.</li>
          <li>حالة الاشتراك والرصيد المتبقي.</li>
          <li>إعداداتك المفضلة.</li>
        </ul>
        <p>هذه البيانات مخزنة على جهازك أنت فقط، ولا يمكننا الوصول إليها.</p>

        <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">3. خدمات الطرف الثالث</h3>
        <p>
          نستخدم <strong>Google Gemini API</strong> لتحليل النصوص. تخضع البيانات المرسلة إليهم لسياسة خصوصية Google Cloud AI.
          كما نستخدم <strong>Google Analytics</strong> لتحسين تجربة المستخدم وفهم كيفية استخدام الموقع.
        </p>

        <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">4. حقوقك</h3>
        <p>
          لديك الحق في حذف جميع بياناتك المحفوظة (سجل البحث) من خلال زر "مسح الأرشيف" الموجود في التطبيق في أي وقت.
        </p>
        
        <p className="mt-8 text-sm text-gray-500">
          آخر تحديث: 24 مايو 2024
        </p>
      </div>
    </div>
  );
};
