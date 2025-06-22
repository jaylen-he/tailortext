
import React from 'react';
import { WordDetails, LanguageOption } from '../types';

interface WordCardProps {
  originalWord: string; // English word
  wordDetails?: WordDetails;
  targetLanguage: LanguageOption;
  error?: string | null;
}

const SpeakerIcon: React.FC<{ size?: number, className?: string }> = ({ size = 20, className = "" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    width={size} 
    height={size}
    className={className}
    aria-hidden="true" // Decorative if button has aria-label
  >
    <path d="M5 9V15H9L14 20V4L9 9H5ZM16.5 12C16.5 10.23 15.48 8.71 14 7.97V16.03C15.48 15.29 16.5 13.77 16.5 12ZM14 3.23V5.29C16.89 6.15 19 8.83 19 12C19 15.17 16.89 17.85 14 18.71V20.77C18.01 19.86 21 16.28 21 12C21 7.72 18.01 4.14 14 3.23Z" />
  </svg>
);


const DetailItem: React.FC<{ 
  label: string; 
  value?: string; 
  audioData?: string; 
  onPlayAudio?: (audioData: string) => void;
  ariaLabelAudio?: string;
}> = ({ label, value, audioData, onPlayAudio, ariaLabelAudio }) => (
  value ? (
    <div className="py-2">
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 text-md text-slate-900 flex items-center">
        <span>{value}</span>
        {audioData && onPlayAudio && (
          <button 
            onClick={() => onPlayAudio(audioData)} 
            className="ml-2 p-1 text-sky-600 hover:text-sky-800 rounded-full hover:bg-sky-100 transition-colors"
            aria-label={ariaLabelAudio || `Play pronunciation for ${label}`}
            title={ariaLabelAudio || `Play pronunciation for ${label}`}
          >
            <SpeakerIcon />
          </button>
        )}
      </dd>
    </div>
  ) : null
);

const WordCard: React.FC<WordCardProps> = ({ originalWord, wordDetails, targetLanguage, error }) => {
  
  const playAudio = (base64Audio: string) => {
    try {
      // Basic check for base64 pattern, could be more robust
      if (!base64Audio || base64Audio.length < 20 || !/^[A-Za-z0-9+/=]+$/.test(base64Audio.substring(0, Math.min(base64Audio.length, 100))))) {
        console.warn("Invalid or missing audio data for playback.");
        alert("Audio data seems to be invalid or missing.");
        return;
      }
      // Assuming MP3, adjust if API returns different types or provides MIME type
      const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
      audio.play().catch(e => {
        console.error("Error playing audio:", e);
        alert("Could not play audio. See console for details.");
      });
    } catch (e) {
      console.error("Error initializing audio:", e);
      alert("Could not initialize audio for playback.");
    }
  };

  if (error) {
    return <p className="text-red-500 p-3 bg-red-50 rounded-md">Error: {error}</p>;
  }
  if (!wordDetails) {
    return <p className="text-slate-500">Details not available for this word in {targetLanguage}.</p>;
  }

  return (
    <div className="p-1 bg-white rounded-lg ">
      <dl className="divide-y divide-slate-200">
        <DetailItem label="Original Word (English)" value={originalWord} />
        <DetailItem 
          label={`Translation (${targetLanguage})`} 
          value={wordDetails.translation} 
          audioData={wordDetails.targetLanguagePronunciationAudio}
          onPlayAudio={playAudio}
          ariaLabelAudio={`Play ${targetLanguage} pronunciation for ${wordDetails.translation}`}
        />
        <DetailItem label="Definition (English)" value={wordDetails.definition} />
        <DetailItem label="Example Sentence (English)" value={wordDetails.exampleSentence} />
        {wordDetails.targetLanguageExampleSentence && (
            <DetailItem label={`Example Sentence (${targetLanguage})`} value={wordDetails.targetLanguageExampleSentence} />
        )}
        <DetailItem 
            label="Pronunciation (English)" 
            value={wordDetails.englishPronunciation}
            audioData={wordDetails.englishPronunciationAudio}
            onPlayAudio={playAudio}
            ariaLabelAudio={`Play English pronunciation for ${originalWord}`}
        />
        <DetailItem 
            label={`Pronunciation (${targetLanguage})`} 
            value={wordDetails.targetLanguagePronunciation}
            audioData={wordDetails.targetLanguagePronunciationAudio} // Re-using targetLanguagePronunciationAudio for the text too
            onPlayAudio={playAudio}
            ariaLabelAudio={`Play ${targetLanguage} pronunciation for ${wordDetails.translation}`}
        />
      </dl>
    </div>
  );
};

export default WordCard;
