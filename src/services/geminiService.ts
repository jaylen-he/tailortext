
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { LanguageOption, WordDetails } from '../types';
import { GEMINI_MODEL_NAME } from '../constants';

const apiKey = process.env.API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
} else {
  console.error("Gemini API key is missing. Please set the API_KEY environment variable.");
}

export const getWordDetailsFromGemini = async (
  word: string, // This is the original English word
  targetLanguage: LanguageOption
): Promise<WordDetails> => {
  if (!ai) {
    throw new Error("Gemini API client not initialized. API key might be missing.");
  }

  const prompt = `
    For the English word "${word}", provide the following information:
    1. A concise definition of the English word.
    2. An example sentence using the English word.
    3. A simple phonetic pronunciation guide for the English word (e.g., using common phonetic notation like IPA or a simplified version).
    4. Its translation into ${targetLanguage}.
    5. An example sentence using the ${targetLanguage} translation.
    6. A simple phonetic pronunciation guide for the ${targetLanguage} translation.
    7. Optionally, base64 encoded audio data (e.g., MP3 or WAV) for the English pronunciation of "${word}".
    8. Optionally, base64 encoded audio data (e.g., MP3 or WAV) for the ${targetLanguage} pronunciation of the translated word.

    Return the response as a JSON object with the following keys: 
    "definition" (string), 
    "exampleSentence" (string, English), 
    "englishPronunciation" (string), 
    "translation" (string, ${targetLanguage}),
    "targetLanguageExampleSentence" (string, ${targetLanguage}),
    "targetLanguagePronunciation" (string),
    "englishPronunciationAudio" (string, optional, base64 audio data),
    "targetLanguagePronunciationAudio" (string, optional, base64 audio data).
    Ensure the JSON is valid. If audio data cannot be generated, omit the audio keys or set them to null.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: { parts: [{ text: prompt }] }, // Corrected contents structure
      config: {
        responseMimeType: "application/json",
      },
    });

    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }
    
    const parsedData = JSON.parse(jsonStr);

    // Validate mandatory fields
    if (
        typeof parsedData.definition !== 'string' ||
        typeof parsedData.exampleSentence !== 'string' ||
        typeof parsedData.englishPronunciation !== 'string' ||
        typeof parsedData.translation !== 'string' ||
        typeof parsedData.targetLanguagePronunciation !== 'string'
    ) {
        console.error("Parsed JSON data is missing mandatory fields:", parsedData);
        throw new Error("Received malformed data from Gemini API (missing mandatory fields).");
    }
    
    // Construct the WordDetails object, including optional fields
    // Construct the WordDetails object, including optional fields
    const wordDetails: WordDetails = {
        definition: parsedData.definition,
        exampleSentence: parsedData.exampleSentence,
        englishPronunciation: parsedData.englishPronunciation,
        translation: parsedData.translation,
        targetLanguagePronunciation: parsedData.targetLanguagePronunciation,
        targetLanguageExampleSentence: typeof parsedData.targetLanguageExampleSentence === 'string' ? parsedData.targetLanguageExampleSentence : `Example sentence in ${targetLanguage} not provided.`,
        englishPronunciationAudio: typeof parsedData.englishPronunciationAudio === 'string' ? parsedData.englishPronunciationAudio : undefined,
        targetLanguagePronunciationAudio: typeof parsedData.targetLanguagePronunciationAudio === 'string' ? parsedData.targetLanguagePronunciationAudio : undefined,
    };
    return wordDetails;

  } catch (error) {
    console.error('Error fetching word details from Gemini:', error);
    if (error instanceof Error) {
        throw new Error(`Gemini API error: ${error.message}`);
    }
    throw new Error('Unknown error fetching word details from Gemini.');
  }
};
