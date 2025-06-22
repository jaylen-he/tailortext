// Sample word data
const words = [
    {
        word: "Hola",
        example: "Hola, buenos días",
        translation: "Hello, good morning",
        meaning: "Hello",
        options: ["Hello", "Goodbye", "Thank you", "Please"]
    },
    {
        word: "Gracias",
        example: "Gracias por tu ayuda",
        translation: "Thank you for your help",
        meaning: "Thank you",
        options: ["Thank you", "Please", "Excuse me", "Hello"]
    },
    {
        word: "Casa",
        example: "Mi casa es grande",
        translation: "My house is big",
        meaning: "House",
        options: ["House", "Car", "School", "Store"]
    }
];

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
            quizOptions[index].dataset.answer = option === currentWord.meaning ? 'correct' : 'wrong';
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
            feedbackText.textContent = 'Correct! Well done!';
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
const soundBtn = document.querySelector('.sound-btn');
soundBtn.addEventListener('click', () => {
    // Add pronunciation functionality here
    console.log('Playing pronunciation for:', words[currentWordIndex].word);
    // You can integrate with Web Speech API or Google Translate TTS here
});

// Next button functionality
const nextBtn = document.querySelector('.next-btn');
nextBtn.addEventListener('click', () => {
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
});

// Initialize with learn mode
updateLearnContent();