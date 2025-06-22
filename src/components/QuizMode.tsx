
import React, { useState, useEffect, useCallback } from 'react';
import { WordEntry, LanguageOption } from '../types';
import { getWordDetailsFromGemini } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import QuizQuestionCard from './QuizQuestionCard';

interface QuizModeProps {
  wordLibrary: WordEntry[];
  targetLanguage: LanguageOption;
  onUpdateWord: (word: WordEntry) => Promise<void>;
}

const QuizMode = ({ wordLibrary, targetLanguage, onUpdateWord }: QuizModeProps): JSX.Element => {
  const [quizWords, setQuizWords] = useState<WordEntry[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(-1);
  const [currentQuizWordData, setCurrentQuizWordData] = useState<{ wordToGuess: string; correctAnswer: string } | null>(null);
  const [isLoadingWord, setIsLoadingWord] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState<number>(0);
  const [answeredCount, setAnsweredCount] = useState<number>(0);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [skippedWordsCount, setSkippedWordsCount] = useState<number>(0);

  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const prepareQuizWord = useCallback(async (wordEntry: WordEntry): Promise<{ wordToGuess: string; correctAnswer: string } | null> => {
    let details = wordEntry.detailsByLanguage?.[targetLanguage];
    if (!details || !details.translation) {
      try {
        details = await getWordDetailsFromGemini(wordEntry.originalWord, targetLanguage);
        const updatedWordEntry: WordEntry = {
          ...wordEntry,
          detailsByLanguage: { ...wordEntry.detailsByLanguage, [targetLanguage]: details },
        };
        await onUpdateWord(updatedWordEntry);
        // `details` variable is updated, subsequent check will use it.
      } catch (err: any) {
       console.error(`Error fetching details for "${wordEntry.originalWord}" during quiz:`, err);
        return null; 
      }
    }
    // This check uses `details` which might have been fetched and updated above.
    if (details && details.translation) {
        return { wordToGuess: details.translation, correctAnswer: wordEntry.originalWord };
    }
    console.warn(`Could not get translation for "${wordEntry.originalWord}" in ${targetLanguage}.`);
    return null;
  }, [targetLanguage, onUpdateWord]);

  const loadNextQuestion = useCallback(async (startingIndex: number = currentWordIndex) => {
    setIsLoadingWord(true);
    setError(null);
    let nextAttemptIndex = startingIndex + 1;
    let newSkippedCount = 0;

    while (nextAttemptIndex < quizWords.length) {
      const wordToTry = quizWords[nextAttemptIndex];
      if (!wordToTry || !wordToTry.originalWord.trim()) {
        console.warn("Skipping invalid word entry in quizWords.", wordToTry);
        newSkippedCount++;
        nextAttemptIndex++;
        continue;
      }
      const quizData = await prepareQuizWord(wordToTry);
      if (quizData) {
        setCurrentWordIndex(nextAttemptIndex);
        setCurrentQuizWordData(quizData);
        setIsLoadingWord(false);
        setSkippedWordsCount(prev => prev + newSkippedCount);
        return; // Found a question
      } else {
        console.warn(`Skipping word "${quizWords[nextAttemptIndex]?.originalWord}" during quiz due to loading failure.`);
        newSkippedCount++;
        nextAttemptIndex++;
      }
    }
    // If loop finishes, no more valid questions
    setSkippedWordsCount(prev => prev + newSkippedCount);
    setShowResults(true);
    setCurrentQuizWordData(null);
    setIsLoadingWord(false);
  }, [currentWordIndex, quizWords, prepareQuizWord]);

  const startQuiz = useCallback(async () => {
    if (wordLibrary.length === 0) {
        setError("Add words to your library to start a quiz!");
        setCurrentQuizWordData(null); setQuizWords([]); setShowResults(false); setIsLoadingWord(false);
        return;
    }
    setIsLoadingWord(true); setError(null);
    const shuffled = shuffleArray(wordLibrary.filter(w => w.originalWord && w.originalWord.trim() !== ''));
    setQuizWords(shuffled); setCurrentWordIndex(-1); setScore(0); setAnsweredCount(0);
    setShowResults(false); setCurrentQuizWordData(null); setSkippedWordsCount(0);

    if (shuffled.length > 0) {
      await loadNextQuestion(-1);
    } else {
      setError(wordLibrary.length > 0 ? "No valid words available for a quiz." : "Your library is empty or has no valid words.");
      setIsLoadingWord(false); setShowResults(false);
    }
  }, [wordLibrary, loadNextQuestion]);

  useEffect(() => {
    startQuiz();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetLanguage, wordLibrary]); // Rerun quiz if target language or library changes

  const handleAnswerSubmit = (isCorrect: boolean) => {
    if (isCorrect) setScore(prev => prev + 1);
    setAnsweredCount(prev => prev + 1);
    setTimeout(() => {
      if (currentWordIndex < quizWords.length -1 || quizWords.slice(currentWordIndex + 1).some(w => w.originalWord.trim() !== '')) {
         loadNextQuestion();
      } else {
         setShowResults(true); setCurrentQuizWordData(null);
      }
    }, 1500); 
  };
  
  if (showResults) {
    return (
      <div style={{ padding: '1rem', border: '1px solid #ccc', textAlign: 'center' }}>
        <h2>Quiz Complete!</h2>
        <p>Your score: <strong>{score}</strong> / <strong>{answeredCount}</strong></p>
        {skippedWordsCount > 0 && (
            <p style={{fontSize: '0.9rem', color: '#555'}}>({skippedWordsCount} word{skippedWordsCount > 1 ? 's' : ''} skipped due to loading issues)</p>
        )}
        <button onClick={startQuiz} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
          Play Again
        </button>
      </div>
    );
  }

  if (isLoadingWord) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem', minHeight: '100px' }}>
        <LoadingSpinner />
        <p style={{ marginTop: '0.5rem' }}>Preparing question...</p>
      </div>
    );
  }

  if (error) {
     return (
        <div style={{ padding: '1rem', color: 'red', border: '1px solid red', textAlign: 'center' }}>
            <p>{error}</p>
            <button onClick={startQuiz} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
              Try Again
            </button>
        </div>
     );
  }
  
  if (!currentQuizWordData) {
    return (
        <div style={{ padding: '1rem', textAlign: 'center' }}>
            <p>{wordLibrary.length === 0 ? "Add words to your library to start a quiz!" : (quizWords.length > 0 ? "Finished loading questions or no more valid questions." : "No questions available.")}</p>
            {wordLibrary.length > 0 && (
                <button onClick={startQuiz} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
                    Start Quiz
                </button>
            )}
        </div>
    );
  }
  
  const questionNumber = answeredCount + 1;
  const totalQuestions = quizWords.length - skippedWordsCount;


  return (
    <div style={{ padding: '1rem', border: '1px solid #ccc' }}>
      <h2>Quiz Time!</h2>
      {quizWords.length > 0 && (
         <p style={{ fontSize: '0.9rem', color: '#555', marginBottom: '1rem' }}>
            Question {questionNumber} of {totalQuestions > 0 ? totalQuestions : quizWords.length} (Targeting ~{quizWords.length} words initially)
        </p>
      )}
      <QuizQuestionCard
          wordToGuess={currentQuizWordData.wordToGuess}
          correctAnswer={currentQuizWordData.correctAnswer}
          onSubmitAnswer={handleAnswerSubmit}
      />
       <div style={{ marginTop: '1rem', textAlign: 'right' }}>
        <p>Score: {score}/{answeredCount}</p>
      </div>
    </div>
  );
};

export default QuizMode;
