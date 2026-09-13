import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Globe, Check, Sparkles, X } from 'lucide-react';
import { LANGUAGES, Language } from '../i18n/translations';

export const LanguageSelectionModal: React.FC = () => {
  const { language, setLanguage, isLanguageModalOpen, closeLanguageModal, t } = useLanguage();

  if (!isLanguageModalOpen) return null;

  const handleSelectLanguage = (langCode: Language) => {
    setLanguage(langCode);
    closeLanguageModal();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 font-sans animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full p-6 md:p-8 shadow-2xl space-y-6 relative overflow-hidden max-h-[90vh] flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 text-[#0d6e48]">
            <div className="w-12 h-12 rounded-2xl bg-[#e6f7ef] border border-[#b2e8cf] flex items-center justify-center font-bold text-lg">
              <Globe className="w-6 h-6 text-[#0d6e48]" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5 text-xs font-bold text-[#0d6e48] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Anndata Kisan Portal • अन्नदाता पोर्टल</span>
              </div>
              <h2 className="text-xl font-bold font-serif-header text-slate-900 leading-tight">
                {t('selectLanguage')} / भाषा चुनें
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {t('farmerWelcome')}
              </p>
            </div>
          </div>

          <button
            onClick={closeLanguageModal}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
            title="Close / बंद करें"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600 font-medium bg-[#e6f7ef]/50 p-3 rounded-2xl border border-[#b2e8cf]/60">
          {t('selectLanguageDesc')}
        </p>

        {/* 8 Languages Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 overflow-y-auto pr-1 py-1 flex-1">
          {LANGUAGES.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleSelectLanguage(lang.code)}
                className={`group text-left p-4 rounded-2xl border-2 transition-all relative flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? 'border-[#0d6e48] bg-[#e6f7ef] shadow-md'
                    : 'border-slate-200 hover:border-[#b2e8cf] hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xl">{lang.flag}</span>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-[#0d6e48] text-white flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-bold font-serif-header text-slate-900 group-hover:text-[#0d6e48] transition-colors">
                    {lang.nativeName}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    {lang.name} • {lang.region}
                  </p>
                </div>

                <div className="pt-1">
                  <span
                    className={`w-full inline-flex items-center justify-center py-1.5 px-2 text-[11px] font-bold rounded-xl transition-colors ${
                      isSelected
                        ? 'bg-[#0d6e48] text-white'
                        : 'bg-slate-100 text-slate-700 group-hover:bg-[#0d6e48] group-hover:text-white'
                    }`}
                  >
                    {isSelected ? 'चयनित (Selected)' : `चुनें (${lang.name})`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="text-center pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <span>Government Grain Procurement Portal</span>
          <button
            onClick={closeLanguageModal}
            className="text-[#0d6e48] font-bold hover:underline"
          >
            {t('confirmLanguage')} →
          </button>
        </div>
      </div>
    </div>
  );
};
