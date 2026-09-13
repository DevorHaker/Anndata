import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Globe, Check, Sparkles } from 'lucide-react';
import { Language } from '../i18n/translations';

export const LanguageSelectionModal: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSelected = localStorage.getItem('smartprocure_lang_selected');
    if (!hasSelected) {
      setIsOpen(true);
    }
  }, []);

  const handleSelectLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('smartprocure_lang_selected', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 font-sans animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Top Decorative Header */}
        <div className="flex items-center space-x-3 text-[#0d6e48]">
          <div className="w-12 h-12 rounded-2xl bg-[#e6f7ef] border border-[#b2e8cf] flex items-center justify-center font-bold text-lg">
            <Globe className="w-6 h-6 text-[#0d6e48]" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5 text-xs font-bold text-[#0d6e48] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Anndata Platform</span>
            </div>
            <h2 className="text-xl font-bold font-serif-header text-slate-900 leading-tight">
              Select Preferred Language
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              अपनी पसंदीदा भाषा का चयन करें
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 font-medium bg-slate-50 p-3 rounded-xl border border-slate-200">
          Please choose your language before continuing to the platform. You can update this anytime in your preferences.
        </p>

        {/* Language Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Hindi Option */}
          <button
            type="button"
            onClick={() => handleSelectLanguage('hi')}
            className={`group text-left p-5 rounded-2xl border-2 transition-all relative flex flex-col justify-between space-y-3 ${
              language === 'hi'
                ? 'border-[#0d6e48] bg-[#e6f7ef]/60 shadow-md'
                : 'border-slate-200 hover:border-[#b2e8cf] hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-2xl">🇮🇳</span>
              {language === 'hi' && (
                <div className="w-6 h-6 rounded-full bg-[#0d6e48] text-white flex items-center justify-center">
                  <Check className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
            <div>
              <h3 className="text-base font-bold font-serif-header text-slate-900 group-hover:text-[#0d6e48] transition-colors">
                हिन्दी (Hindi)
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                अन्नदाता डिजिटल खरीद मंच का उपयोग हिंदी भाषा में करें।
              </p>
            </div>
            <div className="pt-2">
              <span className="w-full inline-flex items-center justify-center py-2 px-3 bg-[#0d6e48] text-white text-xs font-bold rounded-xl group-hover:bg-[#095235] transition-colors">
                हिंदी चुनें (Select Hindi)
              </span>
            </div>
          </button>

          {/* English Option */}
          <button
            type="button"
            onClick={() => handleSelectLanguage('en')}
            className={`group text-left p-5 rounded-2xl border-2 transition-all relative flex flex-col justify-between space-y-3 ${
              language === 'en'
                ? 'border-[#0d6e48] bg-[#e6f7ef]/60 shadow-md'
                : 'border-slate-200 hover:border-[#b2e8cf] hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-2xl">🇬🇧</span>
              {language === 'en' && (
                <div className="w-6 h-6 rounded-full bg-[#0d6e48] text-white flex items-center justify-center">
                  <Check className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
            <div>
              <h3 className="text-base font-bold font-serif-header text-slate-900 group-hover:text-[#0d6e48] transition-colors">
                English
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Access the Anndata Digital Procurement Platform in English.
              </p>
            </div>
            <div className="pt-2">
              <span className="w-full inline-flex items-center justify-center py-2 px-3 bg-[#0d6e48] text-white text-xs font-bold rounded-xl group-hover:bg-[#095235] transition-colors">
                Select English (अंग्रेजी चुनें)
              </span>
            </div>
          </button>
        </div>

        <div className="text-center pt-2">
          <p className="text-[11px] text-slate-400 font-medium">
            Government of India • Grain Procurement System
          </p>
        </div>
      </div>
    </div>
  );
};
