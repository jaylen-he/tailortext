
import React, { useState, FormEvent, useEffect } from 'react';

interface QuizQuestionCardProps {
  wordToGuess: string; // This will be the word in the target language
  correctAnswer: string; // This will be the English translation
  onSubmitAnswer: (isCorrect: boolean) => void;
}

const QuizQuestionCard: React.FC<QuizQuestionCardProps> = ({
  wordToGuess,
  correctAnswer,
  onSubmitAnswer,
}) => {
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  // Effect to reset state when the question changes
  useEffect(() => {
    setUserAnswer('');
    setFeedback(null);
    setIsSubmitted(false);
  }, [wordToGuess, correctAnswer]); // Depend on wordToGuess and correctAnswer to ensure reset for new question

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitted) return;

    // Normalize answers for comparison: trim whitespace and convert to lowercase
    const normalizedUserAnswer = userAnswer.trim().toLowerCase();
    const normalizedCorrectAnswer = correctAnswer.trim().toLowerCase();
    
    const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
    setIsSubmitted(true);
    if (isCorrect) {
      setFeedback('Correct! 🎉');
    } else {
      setFeedback(`Not quite. The correct English translation is: ${correctAnswer}`);
    }
    onSubmitAnswer(isCorrect);
  };

  return (
    <div className="p-4 border border-slate-200 rounded-lg shadow-sm bg-slate-50">
      <p className="text-lg font-medium text-slate-700 mb-2">
        What is the English translation of: <strong className="text-sky-600">{wordToGuess}</strong>?
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          placeholder="Type your English translation"
          disabled={isSubmitted}
          className="w-full p-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500 disabled:bg-slate-100"
          aria-label="Your English translation"
        />
        <button
          type="submit"
          disabled={isSubmitted || !userAnswer.trim()}
          className="w-full px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
        >
          {isSubmitted ? 'Answered' : 'Submit Answer'}
        </button>
      </form>
      {feedback && (
        <p className={`mt-3 text-sm p-2 rounded-md ${feedback.startsWith('Correct') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {feedback}
        </p>
      )}
    </div>
  );
};

export default QuizQuestionCard;
