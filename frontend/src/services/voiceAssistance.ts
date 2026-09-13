import { Language } from '../i18n/translations';

const LANG_MAPPING: Record<Language, string> = {
  hi: 'hi-IN',
  pa: 'pa-IN',
  gu: 'gu-IN',
  mr: 'mr-IN',
  te: 'te-IN',
  ta: 'ta-IN',
  bn: 'bn-IN',
  en: 'en-US'
};

export class VoiceAssistanceService {
  private synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;

  public speak(text: string, language: Language = 'hi') {
    if (!this.synth) return;

    this.synth.cancel(); // Stop any active speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANG_MAPPING[language] || 'hi-IN';
    utterance.rate = 0.9; // Slower speed for clarity and farmer accessibility

    this.synth.speak(utterance);
  }

  public listen(onResult: (transcript: string) => void, onError?: (err: any) => void, language: Language = 'hi') {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      if (onError) onError('Speech recognition not supported');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = LANG_MAPPING[language] || 'hi-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };

    recognition.onerror = (err: any) => {
      if (onError) onError(err);
    };

    recognition.start();
  }
}

export const voiceAssistanceService = new VoiceAssistanceService();
