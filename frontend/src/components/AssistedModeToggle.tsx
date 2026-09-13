import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Volume2, Eye, Globe } from 'lucide-react';
import { voiceAssistanceService } from '../services/voiceAssistance';

export const AssistedModeToggle: React.FC = () => {
  const { language, setLanguage, isAssistedMode, toggleAssistedMode, t } = useLanguage();

  return (
    <div className="flex items-center space-x-2 bg-emerald-950/40 border border-emerald-800/40 p-1.5 rounded-xl">
      {/* Language Switcher */}
      <button
        onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-emerald-900/60 hover:bg-emerald-800 text-emerald-100 border border-emerald-700/50"
        title="Switch Language / भाषा बदलें"
      >
        <Globe className="w-4 h-4 text-emerald-400" />
        <span>{language === 'en' ? 'हिन्दी (Hindi)' : 'English'}</span>
      </button>

      {/* Low Literacy Visual / Voice Mode */}
      <button
        onClick={() => {
          toggleAssistedMode();
          if (!isAssistedMode) {
            voiceAssistanceService.speak('किसान सहायक मोड सक्रिय किया गया है।', 'hi');
          }
        }}
        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
          isAssistedMode
            ? 'bg-amber-500 text-black border-amber-400 font-extrabold shadow-lg shadow-amber-500/20'
            : 'bg-emerald-900/40 text-emerald-200 border-emerald-800 hover:bg-emerald-800/60'
        }`}
      >
        <Eye className="w-4 h-4" />
        <Volume2 className="w-4 h-4" />
        <span>{t('assistedMode')}</span>
      </button>
    </div>
  );
};
