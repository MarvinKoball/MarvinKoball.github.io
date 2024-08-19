let currentQuestionIndex = localStorage.getItem('currentQuestionIndex') ?? 0;
let correctAnswers = localStorage.getItem('correctAnswers') ?? 0;
let questions = [];

document.getElementById('submit').addEventListener('click', checkAnswer);
document.getElementById('next').addEventListener('click', loadNextQuestion);

function loadQuestions() {
    const data = JSON.parse(localStorage.getItem('root'));
    if (data?.questions) {
        questions = data.questions; // Load questions from local storage
        loadNextQuestion();
    }
}

function loadNextQuestion() {
    document.getElementById('feedback').textContent = '';
    document.getElementById('next').style.display = 'none';
    if (currentQuestionIndex < questions.length) {
        const question = questions[currentQuestionIndex];
        displayQuestion(question);
    } else {
        showResults();
    }
}

function displayQuestion(question) {
    document.getElementById('question').textContent = question.text;
    const optionsContainer = document.getElementById('options');
    optionsContainer.innerHTML = ''; // Clear previous options
    // As it's true or false, create only two options
    const trueOption = document.createElement('li');
    trueOption.textContent = 'Wahr';
    trueOption.addEventListener('click', () => selectOption(true));
    optionsContainer.appendChild(trueOption);

    const falseOption = document.createElement('li');
    falseOption.textContent = 'Falsch';
    falseOption.addEventListener('click', () => selectOption(false));
    optionsContainer.appendChild(falseOption);
}

function selectOption(selectedValue) {
    const options = document.querySelectorAll('#options li');
    options.forEach(option => {
        option.classList.remove('selected'); // Remove selected from all options
    });
    const selectedOption = Array.from(options).find(option => option.textContent === (selectedValue ? 'Wahr' : 'Falsch'));
    selectedOption.classList.add('selected');
}

function checkAnswer() {
    const feedbackSet = document.getElementById('feedback');
    if (feedbackSet?.textContent !== '') {
        return;
    }
    const selectedOption = document.querySelector('#options li.selected');
    const isCorrect = (selectedOption.textContent === 'Wahr') === questions[currentQuestionIndex].correct;
    if (isCorrect) {
        incrementCorrectAnswer()
        document.getElementById('feedback').textContent = 'Richtig!';
        document.getElementById('feedback').textContent += ` Hinweis: ${questions[currentQuestionIndex].hint}`;
    } else {
        document.getElementById('feedback').textContent = 'Falsch!';
        document.getElementById('feedback').textContent += ` Hinweis: ${questions[currentQuestionIndex].hint}`;
    }
    incrementQuestionIndex()
    document.getElementById('next').style.display = 'block';
}
function incrementQuestionIndex() {
    localStorage.setItem('currentQuestionIndex', ++currentQuestionIndex);
}
function incrementCorrectAnswer() {
    localStorage.setItem('correctAnswers', ++correctAnswers);
}

function showResults() {
    const quizContainer = document.getElementById('quiz-container');
    quizContainer.innerHTML = `<h1>Quiz Abgeschlossen</h1>
    <p>Deine Punktzahl: ${correctAnswers}/${questions.length}</p>`;
}
function resetQuestions() {
    localStorage.setItem('currentQuestionIndex', 0);
    currentQuestionIndex = 0;
    localStorage.setItem('correctAnswers', 0);
    correctAnswers = 0;
    loadNextQuestion()
}

window.onload = loadQuestions;
