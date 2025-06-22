
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

const QuizMode: React.FC<QuizModeProps> = ({ wordLibrary, targetLanguage, onUpdateWord }) => {
  const [quizWords, setQuizWords] = useState<WordEntry[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(-1); // Actual index in quizWords
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
    // Note: setError is not called here directly for individual word load failures,
    // as the calling function will handle skipping.
    // A general error might be set if all words fail.
    let details = wordEntry.detailsByLanguage?.[targetLanguage];

    if (!details || !details.translation) {
      // setIsLoadingWord(true); // Handled by caller
      try {
        details = await getWordDetailsFromGemini(wordEntry.originalWord, targetLanguage);
        const updatedWordEntry: WordEntry = {
          ...wordEntry,
          detailsByLanguage: {
            ...wordEntry.detailsByLanguage,
            [targetLanguage]: details,
          },
        };
        await onUpdateWord(updatedWordEntry);
      } catch (err: any) {
        console.error(`Error fetching details for "${wordEntry.originalWord}" during quiz:`, err);
        // setIsLoadingWord(false); // Handled by caller
        return null; 
      } finally {
        // setIsLoadingWord(false); // Handled by caller
      }
    }
    
    if (details && details.translation) {
        return { wordToGuess: details.translation, correctAnswer: wordEntry.originalWord };
    }
    console.warn(`Could not get translation for "${wordEntry.originalWord}" in ${targetLanguage}.`);
    return null;
  }, [targetLanguage, onUpdateWord]);

  const loadNextQuestion = useCallback(async (startingIndex: number = currentWordIndex) => {
    setIsLoadingWord(true);
    setError(null); // Clear previous errors before trying to load next
    
    let nextAttemptIndex = startingIndex + 1;
    let newSkippedCount = 0;

    while (nextAttemptIndex < quizWords.length) {
      const wordToTry = quizWords[nextAttemptIndex];
      if (!wordToTry || !wordToTry.originalWord.trim()) { // Basic check for invalid entry
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
        return; // Found and set next question
      } else {
        console.warn(`Skipping word "${quizWords[nextAttemptIndex]?.originalWord}" during quiz due to loading failure.`);
        newSkippedCount++;
        nextAttemptIndex++;
        // Optionally, inform user that a word was skipped, e.g., via a temporary message
      }
    }

    // If loop completes, no more loadable words
    setSkippedWordsCount(prev => prev + newSkippedCount);
    setShowResults(true);
    setCurrentQuizWordData(null);
    setIsLoadingWord(false);
  }, [currentWordIndex, quizWords, prepareQuizWord]);


  const startQuiz = useCallback(async () => {
    if (wordLibrary.length === 0) {
        setError("Add words to your library to start a quiz!");
        setCurrentQuizWordData(null);
        setQuizWords([]);
        setShowResults(false);
        setIsLoadingWord(false);
        return;
    }
    
    setIsLoadingWord(true);
    setError(null);
    const shuffled = shuffleArray(wordLibrary.filter(w => w.originalWord && w.originalWord.trim() !== ''));
    
    setQuizWords(shuffled);
    setCurrentWordIndex(-1); // Reset index to start before the first item
    setScore(0);
    setAnsweredCount(0);
    setShowResults(false);
    setCurrentQuizWordData(null);
    setSkippedWordsCount(0);

    if (shuffled.length > 0) {
      await loadNextQuestion(-1); // Pass -1 to start search from index 0
    } else {
      setError(wordLibrary.length > 0 ? "No valid words available for a quiz." : "Your library is empty or has no valid words.");
      setIsLoadingWord(false);
      setShowResults(false); // Ensure results aren't shown if no questions
    }
  }, [wordLibrary, loadNextQuestion]);

  useEffect(() => {
    // This effect will run when the component mounts or when targetLanguage changes,
    // as startQuiz's dependencies include wordLibrary and targetLanguage (via loadNextQuestion -> prepareQuizWord).
    startQuiz();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetLanguage, wordLibrary]); // Explicitly depend on wordLibrary for full quiz restart on change


  const handleAnswerSubmit = (isCorrect: boolean) => {
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
    setAnsweredCount(prev => prev + 1);
    
    // Give feedback time, then load next
    setTimeout(() => {
      if (currentWordIndex < quizWords.length -1 || quizWords.slice(currentWordIndex + 1).some(w => w.originalWord.trim() !== '')) {
         loadNextQuestion();
      } else {
         setShowResults(true); // No more potential words
         setCurrentQuizWordData(null);
      }
    }, 1500); 
  };
  
  if (showResults) {
    return (
      <div className="p-4 bg-white shadow rounded-lg text-center">
        <h2 className="text-2xl font-bold text-sky-700 mb-4">Quiz Complete!</h2>
        <p className="text-lg text-slate-700 mb-1">
          Your score: <span className="font-semibold">{score}</span> / <span className="font-semibold">{answeredCount}</span>
        </p>
        {skippedWordsCount > 0 && (
            <p className="text-sm text-slate-500 mb-2">
                ({skippedWordsCount} word{skippedWordsCount > 1 ? 's' : ''} skipped due to loading issues)
            </p>
        )}
        <button
          onClick={startQuiz}
          className="mt-4 px-6 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 transition-colors"
        >
          Play Again
        </button>
      </div>
    );
  }

  if (isLoadingWord) {
    return (
      <div className="flex flex-col items-center justify-center p-4 h-48">
        <LoadingSpinner />
        <p className="mt-2 text-slate-600">Preparing question...</p>
      </div>
    );
  }

  if (error) { // General errors like "no words in library" or "all words failed to load"
     return (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg text-center">
            <p>{error}</p>
            <button
                onClick={startQuiz} // Allow trying to start quiz again
                className="mt-4 px-6 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 transition-colors"
            >
            Try Again
            </button>
        </div>
     );
  }
  
  if (!currentQuizWordData) {
    // This state can be hit if all words were skipped or initial load found no questions
    // Error state should ideally cover most of these, but as a fallback:
    return (
        <div className="p-4 text-center">
            <p className="text-slate-600">
                {wordLibrary.length === 0 ? "Add words to your library to start a quiz!" : "No questions available for the quiz."}
            </p>
            {wordLibrary.length > 0 && (
                <button
                    onClick={startQuiz}
                    className="mt-4 px-6 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 transition-colors"
                >
                    Start Quiz
                </button>
            )}
        </div>
    );
  }
  
  // Calculate displayed question number based on answeredCount, as currentWordIndex might jump if words are skipped.
  // Or, more simply, use answeredCount + 1 for the current question number if a question is displayed.
  const questionNumber = answeredCount + 1;
  const totalQuestionsInSession = quizWords.length - skippedWordsCount; // A more dynamic total could be quizWords.length

  return (
    <div className="p-4 bg-white shadow rounded-lg">
      <h2 className="text-xl font-semibold text-sky-700 mb-1">Quiz Time!</h2>
      {quizWords.length > 0 && (
         <p className="text-sm text-slate-500 mb-4">
            Question {questionNumber} (Targeting ~{quizWords.length} words)
        </p>
      )}
      
      <QuizQuestionCard
          wordToGuess={currentQuizWordData.wordToGuess}
          correctAnswer={currentQuizWordData.correctAnswer}
          onSubmitAnswer={handleAnswerSubmit}
      />
       <div className="mt-4 text-right">
        <p className="text-lg font-semibold text-slate-700">Score: {score}/{answeredCount}</p>
      </div>
    </div>
  );
};

export default QuizMode;
