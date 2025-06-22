
import React, { useState, useEffect, useCallback } from 'react';
import { AppMode, WordEntry, LanguageOption } from './types';
import { SUPPORTED_LANGUAGES } from './constants';
import Navbar from './components/Navbar';
import LearnMode from './components/LearnMode';
import QuizMode from './components/QuizMode';
import { getWords, saveWords, getTargetLanguage, saveTargetLanguage } from './services/storageService';
import { LoadingSpinner } from './components/LoadingSpinner';

const App: React.FC = () => {
  const [wordLibrary, setWordLibrary] = useState<WordEntry[]>([]);
  const [currentMode, setCurrentMode] = useState<AppMode>(AppMode.LEARN);
  const [targetLanguage, setTargetLanguageState] = useState<LanguageOption>(SUPPORTED_LANGUAGES[0]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [apiKeyExists, setApiKeyExists] = useState<boolean>(false);

  useEffect(() => {
    // Check for API key. The prompt mandates using process.env.API_KEY.
    // This variable is assumed to be pre-configured and accessible.
    if (process.env.API_KEY) { 
        setApiKeyExists(true);
    } else {
        console.warn("API_KEY from process.env is not available. Gemini features may not work. This app assumes API_KEY is set in the execution environment.");
        setError("Gemini API Key is not configured. Please ensure API_KEY environment variable is set for the application environment.");
        setApiKeyExists(false);
    }
  }, []);


  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const storedWords = await getWords();
        setWordLibrary(storedWords.sort((a, b) => b.dateAdded - a.dateAdded));
        const storedLang = await getTargetLanguage();
        if (storedLang) {
          setTargetLanguageState(storedLang);
        }
      } catch (e) {
        console.error("Failed to load data:", e);
        setError("Could not load your saved words or preferences.");
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, []);

  const handleSetTargetLanguage = useCallback(async (lang: LanguageOption) => {
    setTargetLanguageState(lang);
    await saveTargetLanguage(lang);
  }, []);

  const addWordToLibrary = useCallback(async (originalWord: string) => {
    if (!originalWord.trim()) {
      setError("Word cannot be empty.");
      return;
    }
    if (wordLibrary.some(w => w.originalWord.toLowerCase() === originalWord.trim().toLowerCase())) {
      setError(`"${originalWord}" is already in your library.`);
      // Clear error after a few seconds
      setTimeout(() => setError(null), 3000);
      return;
    }
    const newWord: WordEntry = {
      id: Date.now().toString(),
      originalWord: originalWord.trim(),
      dateAdded: Date.now(),
      detailsByLanguage: {},
    };
    const updatedLibrary = [newWord, ...wordLibrary];
    setWordLibrary(updatedLibrary);
    await saveWords(updatedLibrary);
    setError(null); // Clear any previous errors
  }, [wordLibrary]);

  const updateWordInLibrary = useCallback(async (updatedWord: WordEntry) => {
    const updatedLibrary = wordLibrary.map(w => w.id === updatedWord.id ? updatedWord : w);
    setWordLibrary(updatedLibrary);
    await saveWords(updatedLibrary);
  }, [wordLibrary]);

  const removeWordFromLibrary = useCallback(async (wordId: string) => {
    const updatedLibrary = wordLibrary.filter(w => w.id !== wordId);
    setWordLibrary(updatedLibrary);
    await saveWords(updatedLibrary);
  }, [wordLibrary]);

  const handleCaptureHighlightedText = useCallback(async () => {
    setError(null);
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.scripting) {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && tab.id) {
                const results = await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: () => window.getSelection()?.toString().trim(),
                });
                if (results && results[0] && results[0].result) {
                    const selectedText = results[0].result;
                    if (selectedText) {
                        addWordToLibrary(selectedText);
                    } else {
                        setError("No text selected on the page.");
                         setTimeout(() => setError(null), 3000);
                    }
                } else {
                     setError("Could not retrieve selected text.");
                     setTimeout(() => setError(null), 3000);
                }
            } else {
                 setError("Could not find active tab.");
                 setTimeout(() => setError(null), 3000);
            }
        } catch (e: any) {
            console.error("Error capturing text:", e);
            setError(`Failed to capture text: ${e.message || 'Unknown error'}`);
            setTimeout(() => setError(null), 5000);
        }
    } else {
        setError("This feature is only available in a Chrome extension environment.");
        setTimeout(() => setError(null), 3000);
        // For local development without extension env, simulate adding a word
        // addWordToLibrary("example"); 
    }
  }, [addWordToLibrary]);


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner />
      </div>
    );
  }
  
  if (!apiKeyExists) {
    return (
        <div className="p-4 h-full flex flex-col items-center justify-center text-center bg-red-100 text-red-700">
            <h1 className="text-xl font-bold mb-4">API Key Error</h1>
            <p>{error}</p>
            <p className="mt-2 text-sm">Please ensure the Gemini API key (API_KEY environment variable) is correctly configured for the application environment.</p>
        </div>
    );
  }


  return (
    <div className="flex flex-col h-full bg-slate-100 text-slate-800">
      <header className="bg-sky-600 text-white p-4 shadow-md">
        <h1 className="text-2xl font-bold text-center">Word Learner</h1>
      </header>

      <Navbar currentMode={currentMode} onSetMode={setCurrentMode} />
      
      {error && (
        <div className="m-2 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md text-sm">
          {error}
        </div>
      )}

      <main className="flex-grow p-4 overflow-y-auto">
        {currentMode === AppMode.LEARN && (
          <LearnMode
            wordLibrary={wordLibrary}
            targetLanguage={targetLanguage}
            onSetTargetLanguage={handleSetTargetLanguage}
            onAddWord={addWordToLibrary}
            onUpdateWord={updateWordInLibrary}
            onRemoveWord={removeWordFromLibrary}
            onCaptureText={handleCaptureHighlightedText}
          />
        )}
        {currentMode === AppMode.QUIZ && (
          <QuizMode 
            wordLibrary={wordLibrary} 
            targetLanguage={targetLanguage} 
            onUpdateWord={updateWordInLibrary}
          />
        )}
      </main>
      <footer className="p-2 text-center text-xs text-slate-500 bg-slate-200">
        Expand your vocabulary!
      </footer>
    </div>
  );
};

export default App;