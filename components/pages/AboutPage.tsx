
import React from 'react';
import { Target, Users, Cpu, Award } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl animate-fade-in-up">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">من نحن؟</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          نحن فريق من المطورين والتربويين العرب، نؤمن بأن الذكاء الاصطناعي هو مستقبل التعليم.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-16">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
           <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center text-blue-600 mb-4">
             <Target size={24} />
           </div>
           <h3 className="text-xl font-bold text-gray-900 mb-2">رؤيتنا</h3>
           <p className="text-gray-600 leading-relaxed">
             تمكين كل طالب عربي من الوصول إلى أدوات تعليمية ذكية تساعده على فهم المواد المعقدة وتلخيصها في ثوانٍ، مجاناً وبأعلى جودة.
           </p>
        </div>
        
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
           <div className="bg-purple-100 w-12 h-12 rounded-xl flex items-center justify-center text-purple-600 mb-4">
             <Cpu size={24} />
           </div>
           <h3 className="text-xl font-bold text-gray-900 mb-2">التقنية</h3>
           <p className="text-gray-600 leading-relaxed">
             نعتمد على أحدث نماذج Google Gemini 2.5 Flash لمعالجة اللغة العربية بدقة، وفهم السياق الأكاديمي، ورسم الخرائط الذهنية.
           </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 md:p-12 text-white text-center">
         <Award size={48} className="mx-auto mb-6 text-yellow-300" />
         <h2 className="text-3xl font-bold mb-4">لماذا "المُلخص الدراسي الذكي"؟</h2>
         <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
           لأننا لا نقدم مجرد تلخيص نصي، بل نقدم تجربة تعليمية متكاملة تشمل الشرح، الأسئلة، والرسوم البيانية، مصممة خصيصاً للمناهج العربية.
         </p>
      </div>
    </div>
  );
};
