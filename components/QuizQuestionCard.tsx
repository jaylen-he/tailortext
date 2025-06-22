
import React, { useState, FormEvent, useEffect } from 'react';

interface QuizQuestionCardProps {
  wordToGuess: string; 
  correctAnswer: string;
  onSubmitAnswer: (isCorrect: boolean) => void;
}

const QuizQuestionCard = ({
  wordToGuess,
  correctAnswer,
  onSubmitAnswer,
}: QuizQuestionCardProps): JSX.Element => {
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  useEffect(() => {
    setUserAnswer('');
    setFeedback(null);
    setIsSubmitted(false);
  }, [wordToGuess, correctAnswer]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitted) return;

    const normalizedUserAnswer = userAnswer.trim().toLowerCase();
    const normalizedCorrectAnswer = correctAnswer.trim().toLowerCase();
    
    const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
    setIsSubmitted(true);
    if (isCorrect) {
      setFeedback('Correct! 🎉');
    } else {
      setFeedback(`Not quite. The correct English translation is: \${correctAnswer}`);
    }
    onSubmitAnswer(isCorrect);
  };

  return (
    <div style={{ padding: '1rem', border: '1px solid #ddd' }}>
      <p style={{ marginBottom: '0.5rem' }}>
        What is the English translation of: <strong>{wordToGuess}</strong>?
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <input
          type="text"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          placeholder="Type your English translation"
          disabled={isSubmitted}
          style={{ width: 'calc(100% - 1rem)', padding: '0.5rem', border: '1px solid #ccc' }}
          aria-label="Your English translation"
        />
        <button
          type="submit"
          disabled={isSubmitted || !userAnswer.trim()}
          style={{ padding: '0.5rem 1rem' }}
        >
          {isSubmitted ? 'Answered' : 'Submit Answer'}
        </button>
      </form>
      {feedback && (
        <p style={{ 
            marginTop: '0.75rem', 
            padding: '0.5rem', 
            border: `1px solid ${feedback.startsWith('Correct') ? 'green' : 'red'}`,
            color: feedback.startsWith('Correct') ? 'green' : 'red'
        }}>
          {feedback}
        </p>
      )}
    </div>
  );
};

export default QuizQuestionCard;
