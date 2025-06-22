
export enum LanguageOption {
  SPANISH = 'Spanish',
  CHINESE = 'Chinese (Mandarin)',
}

export interface WordDetails {
  translation: string;
  definition: string;
  exampleSentence: string; // English example sentence
  targetLanguageExampleSentence?: string; // Example sentence in the target language
  englishPronunciation: string;
  targetLanguagePronunciation: string;
  englishPronunciationAudio?: string; // Base64 encoded audio data or URL
  targetLanguagePronunciationAudio?: string; // Base64 encoded audio data or URL
}

export interface WordEntry {
  id: string;
  originalWord: string; // This will always be the English word
  dateAdded: number;
  detailsByLanguage: Partial<Record<LanguageOption, WordDetails>>;
}

export enum AppMode {
  LEARN = 'Learn',
  QUIZ = 'Quiz',
}
