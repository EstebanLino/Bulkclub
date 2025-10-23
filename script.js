// Workout Tracker App - Main JavaScript

// Data Structure
let workoutData = {
    weeks: {
        monday: { type: 'rest', name: '', exercises: [] },
        tuesday: { type: 'rest', name: '', exercises: [] },
        wednesday: { type: 'rest', name: '', exercises: [] },
        thursday: { type: 'rest', name: '', exercises: [] },
        friday: { type: 'rest', name: '', exercises: [] },
        saturday: { type: 'rest', name: '', exercises: [] },
        sunday: { type: 'rest', name: '', exercises: [] }
    }
};

// Day names in French
const dayNames = {
    monday: 'Lundi',
    tuesday: 'Mardi',
    wednesday: 'Mercredi',
    thursday: 'Jeudi',
    friday: 'Vendredi',
    saturday: 'Samedi',
    sunday: 'Dimanche'
};

// Current editing day
let currentDay = null;

// Initialize App
function initApp() {
    loadFromLocalStorage();
    renderWeekView();
    attachEventListeners();
}

// Render Week View
function renderWeekView() {
    const weekView = document.getElementById('weekView');
    weekView.innerHTML = '';

    Object.keys(dayNames).forEach(dayKey => {
        const dayData = workoutData.weeks[dayKey];
        const isWorkout = dayData.type === 'workout';

        const dayCard = document.createElement('div');
        dayCard.className = `day-card ${isWorkout ? 'workout' : ''}`;
        dayCard.dataset.day = dayKey;

        const sessionTitle = isWorkout && dayData.name
            ? dayData.name
            : isWorkout
                ? 'Séance d\'entraînement'
                : 'Jour de repos';

        dayCard.innerHTML = `
            <div class="day-header">
                <span class="day-name">${dayNames[dayKey]}</span>
                <span class="day-indicator"></span>
            </div>
            <div class="session-title">${sessionTitle}</div>
        `;

        dayCard.addEventListener('click', () => openModal(dayKey));
        weekView.appendChild(dayCard);
    });
}

// Open Modal
function openModal(dayKey) {
    currentDay = dayKey;
    const modal = document.getElementById('sessionModal');
    const dayData = workoutData.weeks[dayKey];

    // Set modal title
    document.getElementById('modalDay').textContent = dayNames[dayKey];

    // Set session type
    const isWorkout = dayData.type === 'workout';
    updateSessionType(isWorkout ? 'workout' : 'rest');

    // Load session data
    if (isWorkout) {
        document.getElementById('sessionName').value = dayData.name || '';
        renderExercises();
    }

    // Show modal
    modal.classList.add('active');
}

// Close Modal
function closeModal() {
    const modal = document.getElementById('sessionModal');
    modal.classList.remove('active');
    currentDay = null;
}

// Update Session Type
function updateSessionType(type) {
    const workoutSection = document.getElementById('workoutSection');
    const restSection = document.getElementById('restSection');
    const toggleBtns = document.querySelectorAll('.toggle-btn');

    toggleBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === type);
    });

    if (type === 'workout') {
        workoutSection.style.display = 'block';
        restSection.style.display = 'none';
    } else {
        workoutSection.style.display = 'none';
        restSection.style.display = 'block';
    }
}

// Render Exercises
function renderExercises() {
    const container = document.getElementById('exercisesContainer');
    const dayData = workoutData.weeks[currentDay];

    container.innerHTML = '';

    dayData.exercises.forEach((exercise, index) => {
        const exerciseCard = createExerciseCard(exercise, index);
        container.appendChild(exerciseCard);
    });
}

// Create Exercise Card
function createExerciseCard(exercise, index) {
    const card = document.createElement('div');
    card.className = 'exercise-card';
    card.dataset.index = index;

    card.innerHTML = `
        <div class="exercise-header">
            <input
                type="text"
                class="exercise-name-input"
                placeholder="Nom de l'exercice"
                value="${exercise.name || ''}"
                data-index="${index}"
            >
            <button class="delete-exercise-btn" data-index="${index}">×</button>
        </div>
        <div class="exercise-details">
            <div class="detail-group">
                <label class="detail-label">Poids (kg)</label>
                <input
                    type="number"
                    class="detail-input weight-input"
                    placeholder="0"
                    value="${exercise.weight || ''}"
                    data-index="${index}"
                    min="0"
                    step="0.5"
                >
            </div>
            <div class="detail-group">
                <label class="detail-label">Séries</label>
                <input
                    type="number"
                    class="detail-input sets-input"
                    placeholder="0"
                    value="${exercise.sets || ''}"
                    data-index="${index}"
                    min="1"
                >
            </div>
            <div class="detail-group">
                <label class="detail-label">Reps</label>
                <input
                    type="number"
                    class="detail-input reps-input"
                    placeholder="0"
                    value="${exercise.reps || ''}"
                    data-index="${index}"
                    min="1"
                >
            </div>
        </div>
    `;

    // Attach event listeners
    const nameInput = card.querySelector('.exercise-name-input');
    const weightInput = card.querySelector('.weight-input');
    const setsInput = card.querySelector('.sets-input');
    const repsInput = card.querySelector('.reps-input');
    const deleteBtn = card.querySelector('.delete-exercise-btn');

    nameInput.addEventListener('input', (e) => updateExercise(index, 'name', e.target.value));
    weightInput.addEventListener('input', (e) => updateExercise(index, 'weight', e.target.value));
    setsInput.addEventListener('input', (e) => updateExercise(index, 'sets', e.target.value));
    repsInput.addEventListener('input', (e) => updateExercise(index, 'reps', e.target.value));
    deleteBtn.addEventListener('click', () => deleteExercise(index));

    return card;
}

// Add Exercise
function addExercise() {
    if (!currentDay) return;

    const dayData = workoutData.weeks[currentDay];
    dayData.exercises.push({
        name: '',
        weight: '',
        sets: '',
        reps: ''
    });

    renderExercises();
}

// Update Exercise
function updateExercise(index, field, value) {
    if (!currentDay) return;

    const dayData = workoutData.weeks[currentDay];
    if (dayData.exercises[index]) {
        dayData.exercises[index][field] = value;
    }
}

// Delete Exercise
function deleteExercise(index) {
    if (!currentDay) return;

    const dayData = workoutData.weeks[currentDay];
    dayData.exercises.splice(index, 1);
    renderExercises();
}

// Save Session
function saveSession() {
    if (!currentDay) return;

    const sessionType = document.querySelector('.toggle-btn.active').dataset.type;
    const sessionName = document.getElementById('sessionName').value;

    workoutData.weeks[currentDay].type = sessionType;
    workoutData.weeks[currentDay].name = sessionName;

    // Clean up exercises if rest day
    if (sessionType === 'rest') {
        workoutData.weeks[currentDay].exercises = [];
    }

    saveToLocalStorage();
    renderWeekView();
    closeModal();
}

// Local Storage Functions
function saveToLocalStorage() {
    try {
        localStorage.setItem('workoutTrackerData', JSON.stringify(workoutData));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

function loadFromLocalStorage() {
    try {
        const savedData = localStorage.getItem('workoutTrackerData');
        if (savedData) {
            workoutData = JSON.parse(savedData);
        }
    } catch (error) {
        console.error('Error loading from localStorage:', error);
    }
}

// Attach Event Listeners
function attachEventListeners() {
    // Close modal
    document.getElementById('closeModal').addEventListener('click', closeModal);

    // Close modal when clicking outside
    document.getElementById('sessionModal').addEventListener('click', (e) => {
        if (e.target.id === 'sessionModal') {
            closeModal();
        }
    });

    // Session type toggle
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            updateSessionType(btn.dataset.type);
        });
    });

    // Add exercise button
    document.getElementById('addExerciseBtn').addEventListener('click', addExercise);

    // Save button
    document.getElementById('saveBtn').addEventListener('click', saveSession);

    // Session name input
    document.getElementById('sessionName').addEventListener('input', (e) => {
        if (currentDay) {
            workoutData.weeks[currentDay].name = e.target.value;
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Escape to close modal
        if (e.key === 'Escape' && document.getElementById('sessionModal').classList.contains('active')) {
            closeModal();
        }

        // Ctrl/Cmd + S to save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            if (document.getElementById('sessionModal').classList.contains('active')) {
                saveSession();
            }
        }
    });
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Auto-save every 30 seconds
setInterval(() => {
    if (currentDay && workoutData.weeks[currentDay].type === 'workout') {
        saveToLocalStorage();
    }
}, 30000);
