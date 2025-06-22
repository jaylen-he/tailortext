
import React, { useState, useEffect, useCallback } from 'react';
import { AppMode, WordEntry, LanguageOption } from './types';
import { SUPPORTED_LANGUAGES } from './constants';
import Navbar from './components/Navbar';
import LearnMode from './components/LearnMode';
import QuizMode from './components/QuizMode';
import { getWords, saveWords, getTargetLanguage, saveTargetLanguage } from './services/storageService';
import { LoadingSpinner } from './components/LoadingSpinner';

const App = (): JSX.Element => {
  const [wordLibrary, setWordLibrary] = useState<WordEntry[]>([]);
  const [currentMode, setCurrentMode] = useState<AppMode>(AppMode.LEARN);
  const [targetLanguage, setTargetLanguageState] = useState<LanguageOption>(SUPPORTED_LANGUAGES[0]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [apiKeyExists, setApiKeyExists] = useState<boolean>(false);

  useEffect(() => {
    console.log("App.tsx: App component mounted and initial useEffect running");
    if (process.env.API_KEY) {
        console.log("App.tsx: API_KEY found in process.env");
        setApiKeyExists(true);
    } else {
        console.warn("App.tsx: API_KEY from process.env is NOT available. Gemini features may not work.");
        setError("Gemini API Key is not configured. This key should be embedded during the build process.");
        setApiKeyExists(false);
    }
  }, []);


  useEffect(() => {
    // Use this to check for the API key
    if (import.meta.env.VITE_GEMINI_API_KEY) {
        console.log("App.tsx: VITE_GEMINI_API_KEY found!");
        setApiKeyExists(true);
    } else {
        console.warn("App.tsx: VITE_GEMINI_API_KEY is NOT available.");
        setError("Gemini API Key is not configured.");
        setApiKeyExists(false);
    }
  }, []);
  
  useEffect(() => {
    const loadInitialData = async () => {
      console.log("App.tsx: loadInitialData started");
      setIsLoading(true);
      try {
        const storedWords = await getWords();
        console.log("App.tsx: Stored words fetched:", storedWords.length);
        setWordLibrary(storedWords.sort((a, b) => b.dateAdded - a.dateAdded));
        const storedLang = await getTargetLanguage();
        console.log("App.tsx: Stored language fetched:", storedLang);
        if (storedLang) {
          setTargetLanguageState(storedLang);
        }
      } catch (e) {
        console.error("App.tsx: Failed to load data:", e);
        setError("Could not load your saved words or preferences.");
      } finally {
        console.log("App.tsx: loadInitialData finished");
        setIsLoading(false);
      }
    };
    if (apiKeyExists) { // Only load data if API key exists
        loadInitialData();
    } else {
        setIsLoading(false); // Ensure loading stops if API key doesn't exist
    }
  }, [apiKeyExists]);

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
    setError(null);
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
    }
  }, [addWordToLibrary]);


  if (isLoading && !error && apiKeyExists) { // Added apiKeyExists check here too
    return (
      <div><LoadingSpinner /></div>
    );
  }
  
  if (!apiKeyExists) {
    return (
        <div style={{ padding: '1rem', textAlign: 'center', color: 'red' }}>
            <h1>API Key Error</h1>
            <p>{error || "Gemini API Key is not configured. This key should be embedded during the build process."}</p>
            <p>Please ensure the Gemini API key (API_KEY environment variable) was correctly configured and embedded during the build process.</p>
        </div>
    );
  }

  return (
    <div>
      <header style={{ padding: '1rem', backgroundColor: '#f0f0f0', textAlign: 'center' }}>
        <h1>Word Learner</h1>
      </header>

      <Navbar currentMode={currentMode} onSetMode={setCurrentMode} />
      
      {error && !isLoading && ( // Ensure error message doesn't show during initial API key check loading
        <div style={{ margin: '0.5rem', padding: '0.75rem', color: 'red', border: '1px solid red' }}>
          {error}
        </div>
      )}

      <main style={{ padding: '1rem', overflowY: 'auto' }}>
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
      <footer style={{ padding: '0.5rem', textAlign: 'center', fontSize: '0.75rem', backgroundColor: '#f9f9f9' }}>
        Expand your vocabulary!
      </footer>
    </div>
  );
};

export default App;
