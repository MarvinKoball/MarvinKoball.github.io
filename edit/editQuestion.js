let questions = [];

function loadQuestionsFromLocalStorage() {
    const data = JSON.parse(localStorage.getItem('root'));
    if (data?.questions) {
        questions = data.questions;
        displayQuestions();
    }
}

function displayQuestions() {
    const questionsList = document.getElementById('questionsList');
    questionsList.innerHTML = '';

    questions.forEach((question, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-item';
        questionDiv.id = `question-${index}`;

        questionDiv.innerHTML = `
            <p>${question.type === 'true_or_false' ? question.text : question.header_text}</p>
            <button onclick="editQuestion(${index})">Edit</button>
            <button onclick="deleteQuestion(${index})">Delete</button>
        `;
        questionsList.appendChild(questionDiv);
    });
}
function editQuestion(index) {
    const question = questions[index];
    const questionDiv = document.getElementById(`question-${index}`);

    questionDiv.innerHTML = `
        <h3>Edit Question</h3>
        <label>Question Type: ${question.type}</label><br>
        ${question.type === 'true_or_false' ? `
            <textarea id="editTrueFalseQuestion" rows="6" class="full-width">${question.text}</textarea>
            <label>Correct Answer:</label>
            <select id="editTrueFalseCorrect">
                <option value="true" ${question.correct ? 'selected' : ''}>True</option>
                <option value="false" ${!question.correct ? 'selected' : ''}>False</option>
            </select><br>
            <label>Hint (Optional):</label>
            <textarea id="editTrueFalseHint" rows="4" class="full-width">${question.hint || ''}</textarea>
        ` : `
            <textarea id="editMultiSelectQuestion" rows="6" class="full-width">${question.header_text}</textarea>
            <div id="editOptionsContainer">
                <h3>Options</h3>
                ${question.options.map((option, optIndex) => `
                    <div class="inline-option">
                        <textarea rows="2">${option.text}</textarea>
                        <input type="checkbox" ${option.correct ? 'checked' : ''}>
                        <button onclick="removeOption(${index}, ${optIndex})">Remove Option</button>
                    </div>
                `).join('')}
                <button onclick="addEditOption(${index})">Add Option</button>
            </div>
        `}
        <button onclick="saveEditedQuestion(${index})">Save</button>
        <button onclick="cancelEdit(${index})">Cancel</button>
    `;
}

function addEditOption(index) {
    const optionsContainer = document.getElementById('editOptionsContainer');
    const optionDiv = document.createElement('div');

    optionDiv.className = 'inline-option';

    optionDiv.innerHTML = `
        <textarea rows="2"></textarea>
        <input type="checkbox" style="margin-left: 10px;">
        <button onclick="this.parentNode.remove()">Remove Option</button>
    `;

    optionsContainer.insertBefore(optionDiv, optionsContainer.lastElementChild);
}

function changeQuestionType() {
    const type = document.getElementById('questionType').value;
    if (type === 'true_or_false') {
        document.getElementById('trueOrFalseContainer').style.display = 'block';
        document.getElementById('multiSelectContainer').style.display = 'none';
    } else {
        document.getElementById('trueOrFalseContainer').style.display = 'none';
        document.getElementById('multiSelectContainer').style.display = 'block';
    }
}

function removeOption(questionIndex, optionIndex) {
    const question = questions[questionIndex];
    question.options.splice(optionIndex, 1);
    editQuestion(questionIndex);
}


function saveEditedQuestion(index) {
    const question = questions[index];

    if (question.type === 'true_or_false') {
        question.text = document.getElementById('editTrueFalseQuestion').value;
        question.correct = document.getElementById('editTrueFalseCorrect').value === 'true';
        question.hint = document.getElementById('editTrueFalseHint').value || '';
    } else if (question.type === 'multi_select') {
        question.header_text = document.getElementById('editMultiSelectQuestion').value;
        question.options = Array.from(document.getElementById('editOptionsContainer').children)
            .filter(div => div.tagName === 'DIV')
            .map(div => ({
                text: div.querySelector('textarea').value,
                correct: div.querySelector('input[type="checkbox"]').checked
            }));
    }

    displayQuestions();
}

function cancelEdit(index) {
    displayQuestions();
}

function deleteQuestion(index) {
    questions.splice(index, 1);
    displayQuestions();
}

function addOption() {
    const optionsContainer = document.getElementById('optionsContainer');
    const optionDiv = document.createElement('div');
    optionDiv.innerHTML = `
        <textarea rows="2" cols="40" placeholder="Option Text"></textarea>
        <input type="checkbox" style="margin-left: 10px;">
        <button onclick="this.parentNode.remove()">Remove Option</button>
    `;
    optionsContainer.appendChild(optionDiv);
}

function saveQuestion() {
    const type = document.getElementById('questionType').value;

    if (type === 'true_or_false') {
        const text = document.getElementById('trueFalseQuestion').value;
        const correct = document.getElementById('trueFalseCorrect').value === 'true';
        const hint = document.getElementById('trueFalseHint').value || '';
        questions.push({ type: 'true_or_false', text, correct, hint });
    } else if (type === 'multi_select') {
        const header_text = document.getElementById('multiSelectQuestion').value;
        const options = Array.from(document.getElementById('optionsContainer').children)
            .filter(div => div.querySelector('textarea'))
            .map(optionDiv => ({
                text: optionDiv.querySelector('textarea').value || "",
                correct: optionDiv.querySelector('input[type="checkbox"]').checked
            }));
        questions.push({ type: 'multi_select', header_text, options });
    }

    displayQuestions();


    document.getElementById('question-form').reset();
    changeQuestionType();
}

function downloadQuestions() {
    const jsonData = JSON.stringify({ questions }, null, 4);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'updated_questions.json';
    a.click();
    URL.revokeObjectURL(url);
}

function confirmReturnToMainPage() {
    const userConfirmed = confirm("hast du WIRKLICH ans runterladen gedacht?");
    if (userConfirmed) {
        window.location.href = '/';
    }
}

window.onload = loadQuestionsFromLocalStorage;
