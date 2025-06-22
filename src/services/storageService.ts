
import { WordEntry, LanguageOption } from '../types';

const WORDS_KEY = 'wordLearnerLibrary';
const LANGUAGE_KEY = 'wordLearnerTargetLanguage';

export const saveWords = async (words: WordEntry[]): Promise<void> => {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    await chrome.storage.local.set({ [WORDS_KEY]: words });
  } else {
    // Fallback for non-extension environment (e.g., local development)
    localStorage.setItem(WORDS_KEY, JSON.stringify(words));
  }
};

export const getWords = async (): Promise<WordEntry[]> => {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    const result = await chrome.storage.local.get(WORDS_KEY);
    return result[WORDS_KEY] || [];
  } else {
    const data = localStorage.getItem(WORDS_KEY);
    return data ? JSON.parse(data) : [];
  }
};

export const saveTargetLanguage = async (language: LanguageOption): Promise<void> => {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    await chrome.storage.local.set({ [LANGUAGE_KEY]: language });
  } else {
    localStorage.setItem(LANGUAGE_KEY, language);
  }
};

export const getTargetLanguage = async (): Promise<LanguageOption | null> => {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    const result = await chrome.storage.local.get(LANGUAGE_KEY);
    return result[LANGUAGE_KEY] || null;
  } else {
    return localStorage.getItem(LANGUAGE_KEY) as LanguageOption | null;
  }
};