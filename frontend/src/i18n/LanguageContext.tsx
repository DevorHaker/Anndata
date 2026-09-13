import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Language, translations } from './translations';
import { LanguageSelectionModal } from '../components/LanguageSelectionModal';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  isAssistedMode: boolean;
  toggleAssistedMode: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('smartprocure_lang');
    return (saved as Language) || 'hi'; // Default Hindi for farmer inclusion
  });

  const [isAssistedMode, setIsAssistedMode] = useState<boolean>(() => {
    return localStorage.getItem('smartprocure_assisted_mode') === 'true';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('smartprocure_lang', lang);
  };

  const toggleAssistedMode = () => {
    setIsAssistedMode((prev) => {
      const next = !prev;
      localStorage.setItem('smartprocure_assisted_mode', String(next));
      return next;
    });
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const dict = translations[language] || translations.en;
    let template = dict[key] || translations.en[key] || key;

    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        template = template.replace(`{${paramKey}}`, String(value));
      });
    }

    return template;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isAssistedMode, toggleAssistedMode }}>
      <LanguageSelectionModal />
      <div className={isAssistedMode ? 'assisted-mode-high-visibility' : ''}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
