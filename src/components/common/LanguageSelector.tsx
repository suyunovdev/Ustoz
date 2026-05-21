'use client';

import { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

interface LanguageSelectorProps {
  defaultLanguage?: string;
  onLanguageChange?: (languageCode: string) => void;
}

const LanguageSelector = ({ 
  defaultLanguage = 'uz',
  onLanguageChange 
}: LanguageSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(defaultLanguage);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages: Language[] = [
    { code: 'uz', name: 'Uzbek', nativeName: 'O\'zbek', flag: '🇺🇿' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  ];

  const currentLanguage = languages.find(lang => lang.code === selectedLanguage) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleLanguageSelect = (languageCode: string) => {
    setSelectedLanguage(languageCode);
    setIsOpen(false);
    if (onLanguageChange) {
      onLanguageChange(languageCode);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-md text-foreground hover:bg-muted transition-smooth"
        aria-label="Select language"
        aria-expanded={isOpen}
      >
        <span className="text-xl">{currentLanguage.flag}</span>
        <span className="hidden sm:inline font-medium">{currentLanguage.code.toUpperCase()}</span>
        <Icon name={isOpen ? 'ChevronUpIcon' : 'ChevronDownIcon'} size={16} />
      </button>

      {/* Desktop Dropdown */}
      {isOpen && (
        <div className="hidden md:block absolute top-full right-0 mt-2 w-56 bg-popover rounded-md shadow-warm-lg border border-border z-200 overflow-hidden">
          <div className="py-2">
            {languages.map((language, index) => {
              const isSelected = language.code === selectedLanguage;
              return (
                <button
                  key={language.code}
                  onClick={() => handleLanguageSelect(language.code)}
                  className={`w-full flex items-center justify-between px-4 py-3 transition-smooth ${
                    isSelected 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-foreground hover:bg-muted'
                  } ${index !== languages.length - 1 ? 'border-b border-border' : ''}`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{language.flag}</span>
                    <div className="text-left">
                      <div className="font-medium">{language.nativeName}</div>
                      <div className={`text-sm caption ${isSelected ? 'text-primary-foreground opacity-80' : 'text-muted-foreground'}`}>
                        {language.name}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <Icon name="CheckIcon" size={20} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Mobile Modal */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 bg-background z-300 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="text-lg font-heading font-semibold">Select Language</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-md hover:bg-muted transition-smooth"
              aria-label="Close language selector"
            >
              <Icon name="XMarkIcon" size={24} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {languages.map((language) => {
              const isSelected = language.code === selectedLanguage;
              return (
                <button
                  key={language.code}
                  onClick={() => handleLanguageSelect(language.code)}
                  className={`w-full flex items-center justify-between px-4 py-4 rounded-md transition-smooth ${
                    isSelected 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <span className="text-3xl">{language.flag}</span>
                    <div className="text-left">
                      <div className="font-medium text-lg">{language.nativeName}</div>
                      <div className={`text-sm caption ${isSelected ? 'text-primary-foreground opacity-80' : 'text-muted-foreground'}`}>
                        {language.name}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <Icon name="CheckIcon" size={24} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;