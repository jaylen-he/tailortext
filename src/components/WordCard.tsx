
import React from 'react';
import { WordDetails, LanguageOption } from '../types';

interface WordCardProps {
  originalWord: string;
  wordDetails?: WordDetails;
  targetLanguage: LanguageOption;
  error?: string | null;
}

const DetailItem: React.FC<{ 
  label: string; 
  value?: string; 
  audioData?: string; 
  onPlayAudio?: (audioData: string) => void;
  ariaLabelAudio?: string;
}> = ({ label, value, audioData, onPlayAudio, ariaLabelAudio }) => (
  value ? (
    <div style={{ padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
      <dt style={{ fontSize: '0.9rem', color: '#555' }}>{label}</dt>
      <dd style={{ marginTop: '0.25rem', display: 'flex', alignItems: 'center' }}>
        <span>{value}</span>
        {audioData && onPlayAudio && (
          <button 
            onClick={() => onPlayAudio(audioData)} 
            style={{ marginLeft: '0.5rem', padding: '0.2rem 0.4rem', fontSize: '0.8rem', cursor: 'pointer', border: '1px solid #ccc', background: '#f9f9f9' }}
            aria-label={ariaLabelAudio || `Play pronunciation for \${label}`}
            title={ariaLabelAudio || `Play pronunciation for \${label}`}
          >
            Play
          </button>
        )}
      </dd>
    </div>
  ) : null
);

const WordCard = ({ originalWord, wordDetails, targetLanguage, error }: WordCardProps): JSX.Element => {
  
  const playAudio = (base64Audio: string) => {
    try {
      if (!base64Audio || base64Audio.length < 20 || !/^[A-Za-z0-9+/=]+$/.test(base64Audio.substring(0, Math.min(base64Audio.length, 100)))) {
        console.warn("Invalid or missing audio data for playback.");
        alert("Audio data seems to be invalid or missing. Cannot play.");
        return;
      }
      const audio = new Audio(`data:audio/mp3;base64,\${base64Audio}`); // Assuming MP3, could be WAV etc.
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
    return <p style={{ color: 'red', padding: '0.75rem', border: '1px solid red' }}>Error: {error}</p>;
  }
  if (!wordDetails) {
    // This case should return a JSX.Element, not undefined or null implicitly if the function signature demands JSX.Element
    return <p>Details not available for this word in {targetLanguage}. Please try fetching them again.</p>;
  }

  return (
    <div style={{ padding: '0.25rem' }}>
      <dl>
        <DetailItem label="Original Word (English)" value={originalWord} />
        <DetailItem 
          label={`Translation (\${targetLanguage})`} 
          value={wordDetails.translation} 
          audioData={wordDetails.targetLanguagePronunciationAudio}
          onPlayAudio={playAudio}
          ariaLabelAudio={`Play \${targetLanguage} pronunciation for \${wordDetails.translation}`}
        />
        <DetailItem label="Definition (English)" value={wordDetails.definition} />
        <DetailItem label="Example Sentence (English)" value={wordDetails.exampleSentence} />
        {wordDetails.targetLanguageExampleSentence && (
            <DetailItem label={`Example Sentence (\${targetLanguage})`} value={wordDetails.targetLanguageExampleSentence} />
        )}
        <DetailItem 
            label="Pronunciation (English)" 
            value={wordDetails.englishPronunciation}
            audioData={wordDetails.englishPronunciationAudio}
            onPlayAudio={playAudio}
            ariaLabelAudio={`Play English pronunciation for \${originalWord}`}
        />
        <DetailItem 
            label={`Pronunciation (\${targetLanguage})`} 
            value={wordDetails.targetLanguagePronunciation}
            audioData={wordDetails.targetLanguagePronunciationAudio}
            onPlayAudio={playAudio}
            ariaLabelAudio={`Play \${targetLanguage} pronunciation for \${wordDetails.translation}`}
        />
      </dl>
    </div>
  );
};

export default WordCard;
