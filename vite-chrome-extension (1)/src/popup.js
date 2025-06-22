const apiKey = "AIzaSyAhfVe5xdFLaTxQtjl_Ko8G6QVFvNv_U9E";

import { GoogleGenAI } from "@google/genai";

/**
 * Selects phrases from English text for language learning translation
 * Uses Claude API to intelligently choose phrases based on difficulty level
 */

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
    async selectPhrases(url, difficultyLevel, targetLanguage, maxPhrases = 10) {
        try {
            const prompt = this.buildPrompt(url, difficultyLevel, targetLanguage, maxPhrases);
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


    buildPrompt(url, difficultyLevel, targetLanguage, maxPhrases) {
        const difficultyGuidelines = {
            beginner: `
        - Focus on basic vocabulary and simple sentence structures
        - Prioritize everyday words and common expressions
        - Avoid complex grammar constructions
        - Select phrases that introduce fundamental concepts`,

            intermediate: `
        - Include moderately complex vocabulary and phrases
        - Focus on idiomatic expressions and phrasal verbs
        - Select phrases with interesting grammar patterns
        - Balance common and less common vocabulary`,

            advanced: `
        - Prioritize sophisticated vocabulary and complex structures
        - Include technical terms, nuanced expressions, and advanced idioms
        - Focus on phrases that demonstrate advanced grammar
        - Select culturally specific or context-dependent expressions`
        };

        return `You are helping create a language learning tool. Analyze the text from the following url: ${url} and select up to ${maxPhrases} words that would be most valuable for a ${difficultyLevel} ${targetLanguage} learner to see translated.

DIFFICULTY LEVEL: ${difficultyLevel.toUpperCase()}
${difficultyGuidelines[difficultyLevel]}

SELECTION CRITERIA:
1. Educational value for ${difficultyLevel} learners
2. Frequency and usefulness in daily communication
3. Complexity appropriate for the difficulty level
4. Diversity of vocabulary and grammar patterns
5. Cultural or contextual significance

Please respond with a nothing else (don't include any introductory remarks like selected phrases:) but a list of the words, each word being on a different line. `;
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const getUrlBtn = document.getElementById('getUrlBtn');
    const urlDisplay = document.getElementById('urlDisplay');
    const urlText = document.getElementById('urlText');
    const copyBtn = document.getElementById('copyBtn');
    const status = document.getElementById('status');


    let currentUrl = '';

    getUrlBtn.addEventListener('click', async function () {
        alert("This is a warning message!")
        try {
            // Query the active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (tab && tab.url) {
                currentUrl = tab.url;
                const selector = new PhraseSelector(apiKey);
                const selected = selector.selectPhrases(currentUrl, 'intermediate', 'Spanish', 10)
                    .then(phrases => {
                        const newElement = document.createElement("p");
                        newElement.textContent = phrases.text;
                        urlText.appendChild(newElement);
                    })
                    .catch(error => {
                        console.error('Selection failed:', error);
                    });
            } else {
                status.textContent = 'Could not retrieve URL';
                status.style.color = '#ea4335';
            }
        } catch (error) {
            status.textContent = 'Error: ' + error.message;
            status.style.color = '#ea4335';
        }
    });
});