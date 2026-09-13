export class VoiceAssistanceService {
  private synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;

  public speak(text: string, language: 'en' | 'hi' = 'hi') {
    if (!this.synth) return;

    this.synth.cancel(); // Stop any active speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'hi' ? 'hi-IN' : 'en-US';
    utterance.rate = 0.9; // Slightly slower speed for clarity and farmer accessibility

    this.synth.speak(utterance);
  }

  public listen(onResult: (transcript: string) => void, onError?: (err: any) => void) {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      if (onError) onError('Speech recognition not supported');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN';
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
