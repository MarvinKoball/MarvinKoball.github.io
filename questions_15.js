// @ts-ignore
let questions = [];
let images = [];

const State = {
    /**
     * @private
     * @type {number}
     */
    _currentQuestionIndex: 0,
    /**
     * @private
     * @type {number}
     */
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
    },
    get correctAnswers() {
        return this._correctAnswers;
    },
    set correctAnswers(value) {
        this._correctAnswers = value;
        this._saveToLocalStorage('correctAnswers', value);
    },
    /**
     * @param {string} key
     * @param {number} value
     */
    _saveToLocalStorage(key, value) {
        localStorage.setItem(key, String(value));
    }
};

State.init();
// @ts-ignore
const db = new Dexie("imageDb");

db.version(1).stores({
    imageStore: "id"
});

function storeImageArray(array) {
    db.imageStore
        .put({ id: 1, data: array })
        .catch((error) => {
            console.error("Error storing image array:", error);
        });
}

async function getImageArray() {
    const record = await db.imageStore.get(1)
    if (record) {
        images = record.data;
    } else {
        console.log("No record found for key=1");
    }
}

function uploadFile() {
    const fileInput = document.getElementById('fileInput');
    const fileText = document.getElementById('file-text');
    if (!(fileInput instanceof HTMLInputElement)) {
        document.getElementById('file-status').textContent = "unexpected error";
        return;
    }
    const file = fileInput.files[0];
    if (!file) {
        document.getElementById('file-status').textContent = "Please select a file.";
        fileText.textContent = "Select File"
        return;
    }
    fileText.textContent = file.name
    localStorage.setItem('file-name', file.name)
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            State.currentQuestionIndex = 0;
            State.correctAnswers = 0;
            // @ts-ignore
            const json = JSON.parse(event.target.result)
            let quest = json.questions;
            if (shouldShuffle()) {
                quest = quest
                    .map(value => ({ value, sort: Math.random() }))
                    .sort((a, b) => a.sort - b.sort)
                    .map(({ value }) => value)
            }
            quest = quest
                .map((value) => {
                    if (value.type === 'multi_select') {
                        let count = value.sample ?? value.options.length
                        value.options = value.options
                            .map(value => ({ value, sort: Math.random() }))
                            .sort((a, b) => a.sort - b.sort)
                            .map(({ value }) => value)
                            .slice(0, count);
                    }
                    return value
                })
            json.questions = quest;
            localStorage.setItem('root', JSON.stringify({ questions: quest }));
            storeImageArray(json.images)
            document.getElementById('file-status').textContent = "JSON file parsed and stored in local storage.";
            loadQuestionsAndImages()
            setTimeout(clearStatusText, 3000)
        } catch (e) {
            document.getElementById('file-status').textContent = "Error parsing JSON file.";
        }
    };

    reader.onerror = function() {
        document.getElementById('file-status').textContent = "Error reading file.";
    };

    reader.readAsText(file);
}
function shouldShuffle() {
    const shuffleBox = document.getElementById("shuffle");
    if (!(shuffleBox instanceof HTMLInputElement)) {
        return false;
    }
    return shuffleBox.checked
}
function clearStatusText() {
    document.getElementById('file-status').textContent = "";
}


document.getElementById('submit').addEventListener('click', checkAnswer);
document.getElementById('next').addEventListener('click', loadNextQuestion);

/**
 * @param {boolean} show
 */
function showSubmit(show) {
    const btn = document.getElementById('submit');
    if (show) {
        btn.style['display'] = 'block'
    } else {
        btn.style['display'] = 'none'
    }

}
async function loadQuestionsAndImages() {
    const data = JSON.parse(localStorage.getItem('root'));
    await getImageArray();
    if (data?.questions) {
        questions = data.questions
        const fileName = localStorage.getItem('file-name') ?? "Select File"
        const fileText = document.getElementById('file-text');
        fileText.textContent = fileName;
        loadNextQuestion();
    }
}
function replayWrongQuestions() {
    questions = questions.filter(question => !question.correctlyAnswered)
    localStorage.setItem('root', JSON.stringify({ questions: questions }));
    State.currentQuestionIndex = 0;
    State.correctAnswers = 0;
    loadNextQuestion()

}

function loadNextQuestion() {
    document.getElementById('feedback').innerHTML = '';
    document.getElementById('next').style.display = 'none';
    if (State.currentQuestionIndex < questions.length) {
        const question = questions[State.currentQuestionIndex];
        displayQuestion(question);
        if (document.getElementById('counter')) {
            document.getElementById('counter').textContent = `${State.currentQuestionIndex + 1}/${questions.length}`
        }

    } else {
        showSubmit(false);
        showResults();
    }
}

/**
 * @param {{ type: string; }} question
 */
function displayQuestion(question) {
    if (question?.type === "true_or_false") {
        showSubmit(false);
        displayTrueOrFalse(question);
    } else if (question?.type === "multi_select") {
        showSubmit(true);
        displayMultiSelect(question)
    } else if (question?.type === "card") {
        showSubmit(false);
        displayCard(question, "front");
    }
}
function formatOptionsOrder(horizontal) {
    const optionsContainer = document.getElementById('options');
    if (horizontal) {
        optionsContainer.classList.add('horizontal-list')
    } else {
        optionsContainer.classList.remove('horizontal-list')
    }
}

/** 
 * @param {object} question
 * @param{"front" | "back"} side 
 * */
function displayCard(question, side) {
    const questionEl = document.getElementById('question')
    const optionsContainer = document.getElementById('options');
    optionsContainer.innerHTML = '';
    formatOptionsOrder(true);
    if (side == "front") {
        questionEl.innerHTML = question.header_text;
        if (question?.questionImageId) {
            questionEl.appendChild(createImage(question.questionImageId))
        }
        const button = document.createElement("button");
        button.textContent = "flip";
        button.className = "flipButton";
        button.addEventListener('click', () => displayCard(question, "back"));
        questionEl.appendChild(button);
    } else {
        questionEl.innerHTML = question.header_text;
        questionEl.appendChild(document.createElement("br"));
        questionEl.appendChild(document.createElement("br"));
        questionEl.innerHTML += question.correctAnswer;
        questionEl.appendChild(document.createElement("br"));
        if (question?.answerImageId) {
            questionEl.appendChild(createImage(question.answerImageId))
        }
        questionEl.appendChild(document.createElement("br"));
        const button = document.createElement("button");
        button.textContent = "flip back";
        button.className = "flipButton";
        button.addEventListener('click', () => displayCard(question, "front"));
        questionEl.appendChild(button);
        const optionsContainer = document.getElementById('options');
        const trueOption = document.createElement('li');
        trueOption.textContent = 'Wahr';
        trueOption.addEventListener('click', () => {
            selectTrueOrFalse(true)
            checkAnswer();
        });
        optionsContainer.appendChild(trueOption);

        const falseOption = document.createElement('li');
        falseOption.textContent = 'Falsch';
        falseOption.addEventListener('click', () => {
            selectTrueOrFalse(false)
            checkAnswer()
        });
        optionsContainer.appendChild(falseOption);
    }
}
/**
 * @param {{ type?: string; header_text?: any; imageId?: any; options?: any; }} question
 */
function displayMultiSelect(question) {
    const questionEl = document.getElementById('question')
    questionEl.innerHTML = question.header_text;
    if (question?.imageId) {
        questionEl.appendChild(createImage(question.imageId))
    }
    const optionsContainer = document.getElementById('options');
    optionsContainer.innerHTML = '';
    formatOptionsOrder(false)
    question.options.forEach((element, index) => {
        const option = document.createElement('li');
        option.innerHTML = element.text
        option.setAttribute("index", index)
        option.addEventListener('click', () => selectMultiSelect(index));
        optionsContainer.appendChild(option);
    })
}
/**
 * @param {string} index
 */
function selectMultiSelect(index) {
    const feedbackSet = document.getElementById('feedback');
    if (feedbackSet?.innerHTML !== '') {
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

/**
 * @param {{ type?: string; text?: any; imageId?: any; }} question
 */
function displayTrueOrFalse(question) {
    const questionEl = document.getElementById('question')
    questionEl.innerHTML = question.text;
    if (question?.imageId) {
        questionEl.appendChild(createImage(question.imageId))
    }
    const optionsContainer = document.getElementById('options');
    optionsContainer.innerHTML = '';
    formatOptionsOrder(true)
    const trueOption = document.createElement('li');
    trueOption.textContent = 'Wahr';
    trueOption.addEventListener('click', () => {
        selectTrueOrFalse(true)
        checkAnswer();
    });
    optionsContainer.appendChild(trueOption);

    const falseOption = document.createElement('li');
    falseOption.textContent = 'Falsch';
    falseOption.addEventListener('click', () => {
        selectTrueOrFalse(false)
        checkAnswer()
    });
    optionsContainer.appendChild(falseOption);
}
/** @param{string}id */
function createImage(id) {
    const image = document.createElement("img")
    const imgObj = images.find((el) => el?.id === id)
    image.src = imgObj.content;
    image.className = "container";
    return image;
}

/**
 * @param {boolean} selectedValue
 */
function selectTrueOrFalse(selectedValue) {
    const feedbackSet = document.getElementById('feedback');
    if (feedbackSet?.innerHTML !== '') {
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
    if (feedbackSet?.innerHTML !== '') {
        return;
    }
    const currentQuestion = questions[State.currentQuestionIndex];
    let isCorrect = false;
    if (currentQuestion.type === 'true_or_false') {
        isCorrect = checkTrueOrFalse(currentQuestion);
    } else if (currentQuestion.type === 'multi_select') {
        isCorrect = checkMultiSelect(currentQuestion)
    } else if (currentQuestion.type === 'card') {
        // be honest to yourself :)
        isCorrect = checkCard();
    }
    if (isCorrect) {
        State.correctAnswers += 1;
        document.getElementById('feedback').innerHTML = 'Richtig!';
        currentQuestion.correctlyAnswered = true;
    } else {
        document.getElementById('feedback').innerHTML = 'Falsch!';
    }
    if (currentQuestion?.hint) {
        document.getElementById('feedback').innerHTML += `<br/>Hinweis:<br/> ${currentQuestion.hint}`;
    }
    if (currentQuestion?.hintImageId) {
        document.getElementById('feedback').appendChild(createImage(currentQuestion.hintImageId))
    }

    State.currentQuestionIndex += 1;
    localStorage.setItem('root', JSON.stringify({ questions: questions }));
    document.getElementById('next').style.display = 'block';
}
function checkCard() {
    const selectedOption = document.querySelector('#options li.selected');
    return (selectedOption.textContent === 'Wahr');
}

/**
 * @param {{ options: any[]; }} currentQuestion
 */
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
/**
 * @param {{ correct: boolean; }} currentQuestion
 */
function checkTrueOrFalse(currentQuestion) {
    const selectedOption = document.querySelector('#options li.selected');
    return (selectedOption.textContent === 'Wahr') === currentQuestion.correct;
}

function showResults() {
    document.getElementById('question').textContent = '';
    const optionsContainer = document.getElementById('options');
    optionsContainer.innerHTML = "Quiz Abgeschlossen"; // Clear previous options
    document.getElementById('feedback').innerHTML = `Deine Punktzahl: ${State.correctAnswers}/${questions.length}`
}
function resetQuestions() {
    State.currentQuestionIndex = 0;
    State.correctAnswers = 0;
    loadNextQuestion()
}
function showJumpMenu() {
    const jump = document.getElementById('jump');
    if (!jump.hasChildNodes()) {
        const input = document.createElement("input")
        input.id = "jumpInput";
        const button = document.createElement("button")
        button.textContent = "jump";
        button.addEventListener("click", jumpToQuestion)
        jump.appendChild(input)
        jump.appendChild(button)
    } else {
        jump.innerHTML = ""
    }
}
function jumpToQuestion() {
    const input = document.getElementById('jumpInput');
    if (!(input instanceof HTMLInputElement)) {
        return;
    }
    let index = Number(input.value)
    index--;
    for (let question of questions) {
        if (questions.indexOf(question) < index && question.correctlyAnswered !== false) {
            question.correctlyAnswered = true;
        }
    }
    State.currentQuestionIndex = index;
    loadNextQuestion();
    const jump = document.getElementById('jump');
    jump.innerHTML = ""
}
/**
 * @param {KeyboardEvent} event
 */
function jumpOnEnter(event) {
    if (event?.key === "Enter") {
        jumpToQuestion()
    }
}

window.addEventListener("keydown", jumpOnEnter)
window.onload = loadQuestionsAndImages;
