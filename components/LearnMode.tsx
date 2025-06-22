
import React, { useState, useCallback } from 'react';
import { WordEntry, LanguageOption, WordDetails } from '../types';
import { SUPPORTED_LANGUAGES } from '../constants';
import { getWordDetailsFromGemini } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import WordCard from './WordCard';
import Modal from './Modal';

interface LearnModeProps {
  wordLibrary: WordEntry[];
  targetLanguage: LanguageOption;
  onSetTargetLanguage: (language: LanguageOption) => void;
  onAddWord: (word: string) => Promise<void>;
  onUpdateWord: (word: WordEntry) => Promise<void>;
  onRemoveWord: (wordId: string) => Promise<void>;
  onCaptureText: () => Promise<void>;
}

const LearnMode: React.FC<LearnModeProps> = ({
  wordLibrary,
  targetLanguage,
  onSetTargetLanguage,
  onAddWord,
  onUpdateWord,
  onRemoveWord,
  onCaptureText,
}) => {
  const [newWordInput, setNewWordInput] = useState<string>('');
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedWord, setSelectedWord] = useState<WordEntry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const handleAddWordManually = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newWordInput.trim()) {
      try {
        await onAddWord(newWordInput.trim());
        setNewWordInput('');
        setError(null);
      } catch (err: any) {
        setError(err.message || "Failed to add word.");
      }
    }
  };

  const handleFetchAndShowDetails = useCallback(async (word: WordEntry) => {
    setError(null);
    setSelectedWord(word); // Show word immediately, details will load
    setIsModalOpen(true);

    // Check if details for the current target language are already fetched
    if (word.detailsByLanguage && word.detailsByLanguage[targetLanguage]) {
      return; // Details already exist, no need to fetch
    }

    setIsLoadingDetails(true);
    try {
      const details = await getWordDetailsFromGemini(word.originalWord, targetLanguage);
      const updatedWord: WordEntry = {
        ...word,
        detailsByLanguage: {
          ...word.detailsByLanguage,
          [targetLanguage]: details,
        },
      };
      await onUpdateWord(updatedWord);
      setSelectedWord(updatedWord); // Update selected word with new details
    } catch (err: any) {
      console.error("Error fetching details:", err);
      setError(err.message || "Failed to load word details.");
      // Keep modal open to show error, or close if preferred
    } finally {
      setIsLoadingDetails(false);
    }
  }, [targetLanguage, onUpdateWord]);


  return (
    <div className="space-y-4">
      <div className="p-4 bg-white shadow rounded-lg">
        <h2 className="text-xl font-semibold text-sky-700 mb-3">Add New Word</h2>
        <form onSubmit={handleAddWordManually} className="flex gap-2 mb-2">
          <input
            type="text"
            value={newWordInput}
            onChange={(e) => setNewWordInput(e.target.value)}
            placeholder="Enter a word"
            className="flex-grow p-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 transition-colors"
          >
            Add
          </button>
        </form>
        <button
          onClick={onCaptureText}
          className="w-full px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors"
        >
          Capture Highlighted Text
        </button>
      </div>

      <div className="p-4 bg-white shadow rounded-lg">
        <label htmlFor="language-select" className="block text-sm font-medium text-slate-700 mb-1">
          Learn in:
        </label>
        <select
          id="language-select"
          value={targetLanguage}
          onChange={(e) => onSetTargetLanguage(e.target.value as LanguageOption)}
          className="w-full p-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
      </div>
      
      {error && <p className="text-red-500 text-sm p-2 bg-red-100 rounded-md">{error}</p>}

      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-sky-700 mt-4">Your Word Library ({wordLibrary.length})</h3>
        {wordLibrary.length === 0 ? (
          <p className="text-slate-500 text-center py-4">Your library is empty. Add some words to start learning!</p>
        ) : (
          <ul className="max-h-80 overflow-y-auto bg-white rounded-lg shadow divide-y divide-slate-200">
            {wordLibrary.map((word) => (
              <li key={word.id} className="p-3 hover:bg-slate-50 flex justify-between items-center">
                <span 
                  className="text-slate-800 cursor-pointer hover:text-sky-600 flex-grow"
                  onClick={() => handleFetchAndShowDetails(word)}
                >
                  {word.originalWord}
                </span>
                <button 
                  onClick={() => onRemoveWord(word.id)}
                  className="ml-2 text-red-500 hover:text-red-700 text-xs"
                  aria-label={`Remove ${word.originalWord}`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {isModalOpen && selectedWord && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Details for "${selectedWord.originalWord}"`}>
          {isLoadingDetails ? (
            <div className="flex justify-center items-center h-32">
              <LoadingSpinner /> 
              <span className="ml-2">Loading details...</span>
            </div>
          ) : (
            <WordCard 
              wordDetails={selectedWord.detailsByLanguage?.[targetLanguage]} 
              originalWord={selectedWord.originalWord}
              targetLanguage={targetLanguage}
              error={!selectedWord.detailsByLanguage?.[targetLanguage] ? error : null} // Show error if details couldn't load
            />
          )}
        </Modal>
      )}
    </div>
  );
};

export default LearnMode;