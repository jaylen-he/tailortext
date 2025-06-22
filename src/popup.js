const apiKey = "AIzaSyAhfVe5xdFLaTxQtjl_Ko8G6QVFvNv_U9E";

import { GoogleGenAI } from "@google/genai";

// Sample word data

class PhraseSelector {
    constructor(apiKey) {
        this.ai = new GoogleGenAI({ apiKey: apiKey });
    }

    /**
     * Select phrases from text based on difficulty level
     * @param {string} url - The English text to analyze
     * @param {string} difficultyLevel - 'beginner', 'intermediate', or 'advanced'
     * @param {string} targetLanguage - The language the user is learning (e.g., 'Spanish', 'French')
     * @param {number} maxPhrases - Maximum number of phrases to select (default: 10)
     * @returns {Promise<Array>} Array of selected phrases with metadata
     */
    async selectPhrases(url, targetLanguage, maxPhrases) {
        try {
            const prompt = this.buildPrompt(url, targetLanguage, maxPhrases);
            const response = await this.ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt
            });
            return response;
        }
        catch (error) {
            console.error('Error selecting phrases:', error);
            throw error;
        }
    }

    buildPrompt(url, targetLanguage, maxPhrases) {

        return `You are helping create a language learning tool. Analyze the text from the following url: ${url} and select ${maxPhrases} that would be most valuable for a beginner ${targetLanguage} learner to see translated.

SELECTION CRITERIA:
1. Educational value for beginner learners
2. Frequency and usefulness in daily communication
3. Complexity appropriate for the difficulty level
4. Diversity of vocabulary and grammar patterns
5. Cultural or contextual significance

For each word, return:
      - the word in ${targetLanguage}
      - a short example sentence using that word
      - an English translation of the sentence
      - the English meaning of the word
      - 4 multiple choice options(in english), including the correct choice, in an array
      - the index of the correct answer in the options array

      Produce JSON matching this specification:

    phrase = { "word": string, "example": string, "translation": string, "meaning": string, "options": array<string>, "correct": int}
    Return: array<phrases>`;
    }
}

function extractAndParseJSON(responseText) {
  try {
    // Remove markdown code block markers if present
    let cleanedResponse = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Remove any leading/trailing whitespace
    cleanedResponse = cleanedResponse.trim();
    
    // Parse the JSON
    const parsed = JSON.parse(cleanedResponse);
    return parsed;
  } catch (error) {
    console.error('Failed to extract and parse JSON:', error);
    return null;
  }
}

var words = [];
async function fetchAndProcessPhraseData(language) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab && tab.url) {
        const currentUrl = tab.url;
        const selector = new PhraseSelector(apiKey);

        try {
            const phrases = await selector.selectPhrases(currentUrl, language, 5);
            console.log(phrases.text);
            
            words = extractAndParseJSON(phrases.text);
            console.log(words);

            updateLearnContent();
        } catch (error) {
            console.error('Selection failed or JSON parse error:', error);
        }
    } else {
        console.error("No active tab found.");
    }
}

document.addEventListener('DOMContentLoaded', ()=>(fetchAndProcessPhraseData("Spanish")));

let currentWordIndex = 0;
let currentMode = 'learn';

// Mode selector functionality
const modeButtons = document.querySelectorAll('.mode-btn');
const learnContent = document.getElementById('learn-content');
const quizContent = document.getElementById('quiz-content');

modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        modeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const mode = btn.textContent.toLowerCase().includes('learn') ? 'learn' : 'quiz';
        switchMode(mode);
    });
});

function switchMode(mode) {
    currentMode = mode;

    if (mode === 'learn') {
        learnContent.style.display = 'block';
        quizContent.style.display = 'none';
        updateLearnContent();
    } else {
        learnContent.style.display = 'none';
        quizContent.style.display = 'block';
        updateQuizContent();
    }
}

function updateLearnContent() {
    const currentWord = words[currentWordIndex];
    document.querySelector('.main-word').textContent = currentWord.word;
    document.querySelector('.example-section .section-content').textContent = currentWord.example;
    document.querySelectorAll('.example-section .section-content')[1].textContent = currentWord.translation;
}

function updateQuizContent() {
    const currentWord = words[currentWordIndex];
    const quizQuestion = document.querySelector('.quiz-question');
    const quizOptions = document.querySelectorAll('.quiz-option');
    const feedback = document.querySelector('.quiz-feedback');

    quizQuestion.textContent = `What does "${currentWord.word}" mean?`;

    // Reset quiz state
    feedback.style.display = 'none';
    quizOptions.forEach(option => {
        option.className = 'quiz-option';
        option.disabled = false;
    });

    // Set options
    currentWord.options.forEach((option, index) => {
        if (quizOptions[index]) {
            quizOptions[index].textContent = option;
            quizOptions[index].dataset.answer = currentWord["correct"] === currentWord.meaning ? 'correct' : 'wrong';
            if(currentWord["correct"] == index){
                quizOptions[index].dataset.answer = 'correct';
            }
            else{
                 quizOptions[index].dataset.answer = 'wrong';
            }
        }
    });
}

// Quiz option click handlers
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('quiz-option') && currentMode === 'quiz') {
        const isCorrect = e.target.dataset.answer === 'correct';
        const feedback = document.querySelector('.quiz-feedback');
        const feedbackText = document.querySelector('.feedback-text');
        const quizOptions = document.querySelectorAll('.quiz-option');

        // Disable all options
        quizOptions.forEach(option => option.disabled = true);

        if (isCorrect) {
            e.target.classList.add('selected-correct');
            feedback.className = 'quiz-feedback correct';
            feedbackText.textContent = 'Correct!';
        } else {
            e.target.classList.add('selected-wrong');
            // Show the correct answer
            quizOptions.forEach(option => {
                if (option.dataset.answer === 'correct') {
                    option.classList.add('show-correct');
                }
            });
            feedback.className = 'quiz-feedback wrong';
            feedbackText.textContent = `Incorrect. The correct answer is "${words[currentWordIndex].meaning}".`;
        }

        feedback.style.display = 'block';
    }
});

// Sound button functionality
const backBtn = document.querySelector('.back-btn');
backBtn.addEventListener('click', () => {
    alert('back pressed');
    currentWordIndex = (currentWordIndex - 1) % words.length;

    if (currentMode === 'learn') {
        updateLearnContent();
    } else {
        updateQuizContent();
    }
    
});

// Next button functionality
const nextBtn = document.querySelector('.next-btn');
nextBtn.addEventListener('click', () => {
    alert('next button')
    currentWordIndex = (currentWordIndex + 1) % words.length;

    if (currentMode === 'learn') {
        updateLearnContent();
    } else {
        updateQuizContent();
    }
});

const languageDropdown = document.querySelector('.language-dropdown');
languageDropdown.addEventListener('change', (e) => {
    console.log('Language changed to:', e.target.value);
    // Here you can load different word sets based on language
    fetchAndProcessPhraseData(e.target.value);
});
