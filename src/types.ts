export interface VocabularyWord {
  source: string;
  target: string;
  sourcePhonetic: string;
  targetPhonetic: string;
  partOfSpeech: string;
  meaning: string;
}

export interface TranslationExample {
  source: string;
  target: string;
  sourcePhonetic: string;
  targetPhonetic: string;
}

export interface TranslationResult {
  translation: string;
  phonetic: string;
  words: VocabularyWord[];
  examples: TranslationExample[];
  speakingTips: string;
}

export interface FavoriteItem {
  id: string;
  type: "phrase" | "word";
  sourceText: string;
  translatedText: string;
  sourceLanguage: "zh" | "th";
  targetLanguage: "zh" | "th";
  phonetic: string;
  partOfSpeech?: string;
  meaning?: string;
  createdAt: number;
}
