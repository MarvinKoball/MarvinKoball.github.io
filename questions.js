let questions = [];
const State = {
    _currentQuestionIndex: 0,
    _correctAnswers: 0,
    init() {
        this._currentQuestionIndex = Number(localStorage.getItem('currentQuestionIndex')) ?? 0;
        this._correctAnswers = Number(localStorage.getItem('correctAnswers')) ?? 0;

    },
    get currentQuestionIndex() {
        return this._currentQuestionIndex;
    },
    set currentQuestionIndex(value) {
        this._currentQuestionIndex = value;
        this._saveToLocalStorage('currentQuestionIndex', value);
        if (document.getElementById('counter')) {
            document.getElementById('counter').textContent = `${this._currentQuestionIndex}/${questions.length}`
        }

    },
    get correctAnswers() {
        return this._correctAnswers;
    },
    set correctAnswers(value) {
        this._correctAnswers = value;
        this._saveToLocalStorage('correctAnswers', value);
    },
    _saveToLocalStorage(key, value) {
        localStorage.setItem(key, value);
    }
};

State.init();

function uploadFile() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    if (!file) {
        document.getElementById('file-status').textContent = "Please select a file.";
        return;
    }
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const json = JSON.parse(event.target.result)
            json.questions = json.questions
                .map(value => ({ value, sort: Math.random() }))
                .sort((a, b) => a.sort - b.sort)
                .map(({ value }) => value)
                .map((value) => {
                    if (value.type === 'multi_select') {
                        value.options = value.options
                            .map(value => ({ value, sort: Math.random() }))
                            .sort((a, b) => a.sort - b.sort)
                            .map(({ value }) => value);
                    }
                    return value
                })
            localStorage.setItem('root', JSON.stringify(json));
            document.getElementById('file-status').textContent = "JSON file parsed and stored in local storage.";
        } catch (e) {
            document.getElementById('file-status').textContent = "Error parsing JSON file.";
        }
    };

    reader.onerror = function() {
        document.getElementById('file-status').textContent = "Error reading file.";
    };

    reader.readAsText(file);
    loadQuestions()
    State.currentQuestionIndex = 0;
    State.correctAnswers = 0;
}


document.getElementById('submit').addEventListener('click', checkAnswer);
document.getElementById('next').addEventListener('click', loadNextQuestion);

function loadQuestions() {
    const data = JSON.parse(localStorage.getItem('root'));
    if (data?.questions) {
        questions = data.questions
        loadNextQuestion();
    }
}

function loadNextQuestion() {
    document.getElementById('feedback').textContent = '';
    document.getElementById('next').style.display = 'none';
    if (State.currentQuestionIndex < questions.length) {
        const question = questions[State.currentQuestionIndex];
        displayQuestion(question);
    } else {
        showResults();
    }
}

function displayQuestion(question) {
    if (question?.type === "true_or_false") {
        displayTrueOrFalse(question);
    } else if (question?.type === "multi_select") {
        displayMultiSelect(question)
    }
}

function displayMultiSelect(question) {
    document.getElementById('question').textContent = question.header_text;
    const optionsContainer = document.getElementById('options');
    optionsContainer.innerHTML = ''; // Clear previous options
    question.options.forEach((element, index) => {
        const option = document.createElement('li');
        option.textContent = element.text
        option.setAttribute("index", index)
        option.addEventListener('click', () => selectMultiSelect(index));
        optionsContainer.appendChild(option);
    })
}
function selectMultiSelect(index) {
    const feedbackSet = document.getElementById('feedback');
    if (feedbackSet?.textContent !== '') {
        return;
    }
    const options = document.querySelectorAll('#options li');
    Array.from(options).forEach((option) => {
        if (option.getAttribute("index") === index + '') {
            option.classList.toggle('selected')
            option.toggleAttribute('selected')
        }

    })
}

function displayTrueOrFalse(question) {
    document.getElementById('question').textContent = question.text;
    const optionsContainer = document.getElementById('options');
    optionsContainer.innerHTML = ''; // Clear previous options
    const trueOption = document.createElement('li');
    trueOption.textContent = 'Wahr';
    trueOption.addEventListener('click', () => selectTrueOrFalse(true));
    optionsContainer.appendChild(trueOption);

    const falseOption = document.createElement('li');
    falseOption.textContent = 'Falsch';
    falseOption.addEventListener('click', () => selectTrueOrFalse(false));
    optionsContainer.appendChild(falseOption);
}

function selectTrueOrFalse(selectedValue) {
    const feedbackSet = document.getElementById('feedback');
    if (feedbackSet?.textContent !== '') {
        return;
    }
    const options = document.querySelectorAll('#options li');
    options.forEach(option => {
        option.classList.remove('selected');
    });
    const selectedOption = Array.from(options).find(option => option.textContent === (selectedValue ? 'Wahr' : 'Falsch'));
    selectedOption.classList.add('selected');
}

function checkAnswer() {
    const feedbackSet = document.getElementById('feedback');
    if (feedbackSet?.textContent !== '') {
        return;
    }
    const currentQuestion = questions[State.currentQuestionIndex];
    let isCorrect = false;
    if (currentQuestion.type === 'true_or_false') {
        isCorrect = checkTrueOrFalse(currentQuestion);
    } else if (currentQuestion.type === 'multi_select') {
        isCorrect = checkMultiSelect(currentQuestion)
    }
    if (isCorrect) {
        State.correctAnswers += 1;
        document.getElementById('feedback').textContent = 'Richtig!';
    } else {
        document.getElementById('feedback').textContent = 'Falsch!';
    }
    if (currentQuestion?.hint) {
        document.getElementById('feedback').textContent += ` Hinweis: ${currentQuestion.hint}`;
    }
    State.currentQuestionIndex += 1;
    document.getElementById('next').style.display = 'block';
}

function checkMultiSelect(currentQuestion) {
    const options = document.querySelectorAll('#options li');
    let isCorrect = true;
    options.forEach((option) => {
        let optionCorrect = true
        currentQuestion.options.forEach((element, index) => {
            if (index + '' === option.getAttribute('index') && !(option.hasAttribute('selected') === element.correct)) {
                isCorrect = false;
                optionCorrect = false
            }
        })
        if (optionCorrect) {
            option.classList.add("correct")
        } else {
            option.classList.add("false")
        }
    })
    return isCorrect;
}
function checkTrueOrFalse(currentQuestion) {
    const selectedOption = document.querySelector('#options li.selected');
    return (selectedOption.textContent === 'Wahr') === currentQuestion.correct;
}

function showResults() {
    document.getElementById('question').textContent = '';
    const optionsContainer = document.getElementById('options');
    optionsContainer.innerHTML = "Quiz Abgeschlossen"; // Clear previous options
    document.getElementById('feedback').textContent = `Deine Punktzahl: ${State.correctAnswers}/${questions.length}`
}
function resetQuestions() {
    State.currentQuestionIndex = 0;
    State.correctAnswers = 0;
    loadNextQuestion()
}
window.onload = loadQuestions;
