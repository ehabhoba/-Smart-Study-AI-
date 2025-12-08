
import React, { useState, useEffect } from 'react';
import { GraduationCap, Menu, X, Home, Info, Phone, Shield, Sparkles, LogIn } from 'lucide-react';

interface Props {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Header: React.FC<Props> = ({ currentPage, onNavigate }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { id: 'home', label: 'الرئيسية', icon: Home },
    { id: 'about', label: 'عن المنصة', icon: Info },
    { id: 'pricing', label: 'الأسعار والباقات', icon: Sparkles }, // Will scroll to pricing or show page
    { id: 'contact', label: 'اتصل بنا', icon: Phone },
  ];

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out border-b
          ${isScrolled 
            ? 'bg-white/90 backdrop-blur-md shadow-lg border-gray-200 py-3' 
            : 'bg-white border-transparent py-5'
          }
        `}
      >
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
          
          {/* Logo Section */}
          <div 
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className={`
              relative flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-xl transition-all duration-300
              ${isScrolled ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'}
              group-hover:scale-105
            `}>
              <GraduationCap size={24} className="animate-bounce-slight" />
              {/* Glow effect */}
              <div className="absolute inset-0 bg-white opacity-20 rounded-xl animate-pulse"></div>
            </div>
            
            <div className="flex flex-col">
              <h1 className={`font-bold text-xl md:text-2xl tracking-tight transition-colors ${isScrolled ? 'text-gray-900' : 'text-blue-900'}`}>
                المُلخص <span className="text-blue-600">الذكي</span>
              </h1>
              <span className="text-[10px] text-gray-500 font-medium tracking-wide hidden md:block">Smart Study AI Platform</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-gray-100/50 p-1.5 rounded-full border border-gray-200/50 backdrop-blur-sm">
            {navLinks.map((link) => {
              const isActive = currentPage === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => onNavigate(link.id)}
                  className={`
                    px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2
                    ${isActive 
                      ? 'bg-white text-blue-600 shadow-md shadow-gray-200 transform scale-105' 
                      : 'text-gray-600 hover:text-blue-600 hover:bg-white/50'
                    }
                  `}
                >
                  <link.icon size={16} className={isActive ? 'fill-current' : ''} />
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
             <button 
                onClick={() => onNavigate('privacy')}
                className="text-gray-500 hover:text-blue-600 transition p-2 rounded-full hover:bg-gray-100"
                title="سياسة الخصوصية"
             >
                <Shield size={20} />
             </button>
             <button 
                onClick={() => {
                   onNavigate('home');
                   setTimeout(() => document.getElementById('subscription-section')?.scrollIntoView({ behavior: 'smooth' }), 100);
                }}
                className="bg-gray-900 hover:bg-black text-white px-6 py-2.5 rounded-xl font-bold transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
             >
                <LogIn size={18} />
                <span>ابدأ الآن</span>
             </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-gray-700 bg-gray-100 rounded-lg"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu size={24} />
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-xl animate-in slide-in-from-top-10 flex flex-col p-6">
           <div className="flex justify-between items-center mb-8">
              <span className="font-bold text-xl text-blue-900">القائمة الرئيسية</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-red-50 text-red-600 rounded-full">
                <X size={24} />
              </button>
           </div>
           
           <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => {
                    onNavigate(link.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`
                    p-4 rounded-xl text-lg font-bold flex items-center gap-4 transition
                    ${currentPage === link.id ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-gray-50 text-gray-700 hover:bg-white border border-transparent'}
                  `}
                >
                  <div className={`p-2 rounded-lg ${currentPage === link.id ? 'bg-blue-200' : 'bg-gray-200'}`}>
                    <link.icon size={20} />
                  </div>
                  {link.label}
                </button>
              ))}
              
              <div className="h-px bg-gray-100 my-2"></div>

              <button 
                onClick={() => {
                   onNavigate('privacy');
                   setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 p-2 text-gray-500"
              >
                 <Shield size={18} /> سياسة الخصوصية
              </button>
           </nav>
        </div>
      )}
      
      {/* Spacer to prevent content overlap */}
      <div className="h-24 md:h-28"></div>
    </>
  );
};
