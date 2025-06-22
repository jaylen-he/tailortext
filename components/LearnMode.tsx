
import React, { useState, useCallback } from 'react';
import { WordEntry, LanguageOption } from '../types';
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

const LearnMode = ({
  wordLibrary,
  targetLanguage,
  onSetTargetLanguage,
  onAddWord,
  onUpdateWord,
  onRemoveWord,
  onCaptureText,
}: LearnModeProps): JSX.Element => {
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
    setSelectedWord(word);
    setIsModalOpen(true);

    if (word.detailsByLanguage && word.detailsByLanguage[targetLanguage]) {
      return; 
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
      setSelectedWord(updatedWord); 
    } catch (err: any) {
      console.error("Error fetching details:", err);
      setError(err.message || "Failed to load word details.");
    } finally {
      setIsLoadingDetails(false);
    }
  }, [targetLanguage, onUpdateWord]);


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ padding: '1rem', border: '1px solid #ccc' }}>
        <h2>Add New Word</h2>
        <form onSubmit={handleAddWordManually} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <input
            type="text"
            value={newWordInput}
            onChange={(e) => setNewWordInput(e.target.value)}
            placeholder="Enter a word"
            style={{ flexGrow: 1, padding: '0.5rem', border: '1px solid #ddd' }}
          />
          <button type="submit" style={{ padding: '0.5rem 1rem' }}>
            Add
          </button>
        </form>
        <button onClick={onCaptureText} style={{ width: '100%', padding: '0.5rem 1rem' }}>
          Capture Highlighted Text
        </button>
      </div>

      <div style={{ padding: '1rem', border: '1px solid #ccc' }}>
        <label htmlFor="language-select" style={{ display: 'block', marginBottom: '0.25rem' }}>
          Learn in:
        </label>
        <select
          id="language-select"
          value={targetLanguage}
          onChange={(e) => onSetTargetLanguage(e.target.value as LanguageOption)}
          style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd' }}
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
      </div>
      
      {error && <p style={{ color: 'red', padding: '0.5rem', border: '1px solid red' }}>{error}</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <h3>Your Word Library ({wordLibrary.length})</h3>
        {wordLibrary.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '1rem' }}>Your library is empty. Add some words to start learning!</p>
        ) : (
          <ul style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ccc', listStyle: 'none', padding: 0 }}>
            {wordLibrary.map((word) => (
              <li key={word.id} style={{ padding: '0.75rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span 
                  style={{ cursor: 'pointer', flexGrow: 1 }}
                  onClick={() => handleFetchAndShowDetails(word)}
                >
                  {word.originalWord}
                </span>
                <button 
                  onClick={() => onRemoveWord(word.id)}
                  style={{ marginLeft: '0.5rem', color: 'red', fontSize: '0.8rem', border: 'none', background: 'none', cursor: 'pointer' }}
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
            <div>
              <LoadingSpinner /> 
              <span>Loading details...</span>
            </div>
          ) : (
            <WordCard 
              originalWord={selectedWord.originalWord}
              wordDetails={selectedWord.detailsByLanguage?.[targetLanguage]} 
              targetLanguage={targetLanguage}
              error={!selectedWord.detailsByLanguage?.[targetLanguage] ? error : null}
            />
          )}
        </Modal>
      )}
    </div>
  );
};

export default LearnMode;
