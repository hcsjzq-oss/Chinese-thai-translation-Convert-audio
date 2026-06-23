/**
 * Speaks text using the browser's built-in Web Speech API (SpeechSynthesis).
 * Autodetects available voices and falls back gracefully.
 */
export function speakText(text: string, lang: "zh" | "th", onEnd?: () => void) {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    console.warn("Speech synthesis is not supported in this browser.");
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  
  // Set accurate speech locale
  const speechLang = lang === "zh" ? "zh-CN" : "th-TH";
  utterance.lang = speechLang;
  
  // Slightly slower speed for better language learning comprehension
  utterance.rate = lang === "th" ? 0.95 : 1.0; 
  utterance.pitch = 1.0;

  // Attempt to match a voice specifically for the target language
  const voices = window.speechSynthesis.getVoices();
  const matchedVoice = voices.find((v) => 
    v.lang.toLowerCase().includes(speechLang.toLowerCase()) ||
    v.lang.toLowerCase().startsWith(lang)
  );

  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }

  window.speechSynthesis.speak(utterance);
}

/**
 * Checks if Speech Recognition is supported in the current environment.
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  return !!SpeechRecognition;
}

/**
 * Retrieves the SpeechRecognition constructor if supported.
 */
export function getSpeechRecognition() {
  if (typeof window === "undefined") return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}
