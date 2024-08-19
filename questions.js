let currentQuestionIndex = 0;
let correctAnswers = 0;
let questions = [];

document.getElementById('submit').addEventListener('click', checkAnswer);
document.getElementById('next').addEventListener('click', loadNextQuestion);

function loadQuestions() {
    const data = JSON.parse(localStorage.getItem('quizData'));
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
    const selectedOption = document.querySelector('#options li.selected');
    const isCorrect = (selectedOption.textContent === 'Wahr') === questions[currentQuestionIndex].correct;
    if (isCorrect) {
        correctAnswers++;
        document.getElementById('feedback').textContent = 'Richtig!';
    } else {
        document.getElementById('feedback').textContent = 'Falsch!';
        document.getElementById('feedback').textContent += ` Hinweis: ${questions[currentQuestionIndex].hint}`;
    }
    currentQuestionIndex++;
    document.getElementById('next').style.display = 'block';
}

function showResults() {
    const quizContainer = document.getElementById('quiz-container');
    quizContainer.innerHTML = `<h1>Quiz Abgeschlossen</h1>
    <p>Deine Punktzahl: ${correctAnswers}/${questions.length}</p>`;
}

window.onload = loadQuestions;
