// Workout Tracker App - Main JavaScript

// Data Structure
let workoutData = {
    // Basic weekly structure - each day can be: 'workout', 'rest', or 'rotation'
    weeks: {
        monday: { type: 'rest', name: '', exercises: [] },
        tuesday: { type: 'rest', name: '', exercises: [] },
        wednesday: { type: 'rest', name: '', exercises: [] },
        thursday: { type: 'rest', name: '', exercises: [] },
        friday: { type: 'rest', name: '', exercises: [] },
        saturday: { type: 'rest', name: '', exercises: [] },
        sunday: { type: 'rest', name: '', exercises: [] }
    },
    // Current week number for rotation
    currentWeek: 1
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

// Current mode: 'view' or 'edit'
let currentMode = 'edit';

// Initialize App
function initApp() {
    loadFromLocalStorage();

    // Update week number display
    document.getElementById('weekNumber').textContent = workoutData.currentWeek;

    // Render week view
    renderWeekView();

    // Check if any day uses rotation
    const hasRotation = Object.values(workoutData.weeks).some(day => day.type === 'rotation');
    if (hasRotation) {
        document.getElementById('rotationInfoBox').style.display = 'block';
    }

    attachEventListeners();
}

// Get workout sessions (non-rotation sessions)
function getWorkoutSessions() {
    const sessions = [];
    Object.keys(dayNames).forEach(dayKey => {
        const dayData = workoutData.weeks[dayKey];
        if (dayData.type === 'workout' && (dayData.name || dayData.exercises.length > 0)) {
            sessions.push({
                day: dayKey,
                name: dayData.name,
                exercises: dayData.exercises
            });
        }
    });
    return sessions;
}

// Get rotated session for a day based on current week
function getRotatedSession(dayKey) {
    const workoutSessions = getWorkoutSessions();

    if (workoutSessions.length === 0) {
        return null;
    }

    // Get rotation days (days marked as rotation)
    const rotationDays = Object.keys(dayNames).filter(key =>
        workoutData.weeks[key].type === 'rotation'
    );

    if (rotationDays.length === 0) {
        return null;
    }

    // Find the index of the current day in rotation days
    const dayIndex = rotationDays.indexOf(dayKey);
    if (dayIndex === -1) {
        return null;
    }

    // Calculate which session should be shown this week
    const sessionCount = workoutSessions.length;
    const totalRotationDays = rotationDays.length;
    const weekOffset = ((workoutData.currentWeek - 1) * totalRotationDays) % sessionCount;
    const sessionIndex = (weekOffset + dayIndex) % sessionCount;

    return workoutSessions[sessionIndex];
}

// Render Week View
function renderWeekView() {
    const weekView = document.getElementById('weekView');
    weekView.innerHTML = '';

    // Update week number
    document.getElementById('weekNumber').textContent = workoutData.currentWeek;

    Object.keys(dayNames).forEach(dayKey => {
        const dayData = workoutData.weeks[dayKey];
        let isWorkout = dayData.type === 'workout' || dayData.type === 'rotation';
        let sessionTitle = '';

        if (dayData.type === 'workout') {
            sessionTitle = dayData.name || 'Séance d\'entraînement';
        } else if (dayData.type === 'rotation') {
            const rotatedSession = getRotatedSession(dayKey);
            sessionTitle = rotatedSession ? `🔄 ${rotatedSession.name || 'Séance'}` : 'Rotation (aucune séance)';
            isWorkout = !!rotatedSession;
        } else {
            sessionTitle = 'Jour de repos';
        }

        const dayCard = document.createElement('div');
        dayCard.className = `day-card ${isWorkout ? 'workout' : ''}`;
        dayCard.dataset.day = dayKey;

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
    updateSessionType(dayData.type);

    // Handle different types
    if (dayData.type === 'workout') {
        const hasSavedData = dayData.name || dayData.exercises.length > 0;
        document.getElementById('sessionName').value = dayData.name || '';
        renderExercises();

        if (hasSavedData) {
            switchToViewMode();
        } else {
            switchToEditMode();
        }
    } else if (dayData.type === 'rotation') {
        // Show rotation info
        const rotatedSession = getRotatedSession(dayKey);
        const sessionDisplay = document.getElementById('rotationCurrentSession');

        if (rotatedSession) {
            sessionDisplay.innerHTML = `
                <h4>Cette semaine</h4>
                <div class="session-name">${rotatedSession.name || 'Séance d\'entraînement'}</div>
            `;
        } else {
            sessionDisplay.innerHTML = `
                <p style="font-size: 14px; color: var(--text-light);">
                    Aucune séance définie pour la rotation.<br>
                    Créez d'abord des séances dans d'autres jours.
                </p>
            `;
        }
        // Show in edit mode so rotation section is visible
        switchToEditMode();
    } else {
        // Rest day - show in edit mode
        switchToEditMode();
    }

    // Show modal
    modal.classList.add('active');
}

// Close Modal
function closeModal() {
    const modal = document.getElementById('sessionModal');
    modal.classList.remove('active');
    currentDay = null;
    currentMode = 'edit';
}

// Switch to View Mode
function switchToViewMode() {
    currentMode = 'view';

    // Show/hide sections
    document.getElementById('viewMode').style.display = 'block';
    document.getElementById('editMode').style.display = 'none';
    document.getElementById('sessionTypeToggle').style.display = 'none';

    // Show/hide buttons
    document.getElementById('editBtn').style.display = 'block';
    document.getElementById('saveBtn').style.display = 'none';

    // Render view mode content
    renderViewMode();
}

// Switch to Edit Mode
function switchToEditMode() {
    currentMode = 'edit';

    // Show/hide sections
    document.getElementById('viewMode').style.display = 'none';
    document.getElementById('editMode').style.display = 'block';
    document.getElementById('sessionTypeToggle').style.display = 'flex';

    // Show/hide buttons
    document.getElementById('editBtn').style.display = 'none';
    document.getElementById('saveBtn').style.display = 'block';

    // Update session type display
    const dayData = workoutData.weeks[currentDay];
    updateSessionType(dayData.type);
}

// Render View Mode
function renderViewMode() {
    if (!currentDay) return;

    const dayData = workoutData.weeks[currentDay];
    const viewSessionName = document.getElementById('viewSessionName');
    const viewExercisesContainer = document.getElementById('viewExercisesContainer');

    // Display session name
    viewSessionName.textContent = dayData.name || 'Séance d\'entraînement';

    // Clear container
    viewExercisesContainer.innerHTML = '';

    // Display exercises
    if (dayData.exercises.length === 0) {
        viewExercisesContainer.innerHTML = `
            <div class="view-empty-state">
                <p>Aucun exercice pour cette séance</p>
                <span>Cliquez sur "Modifier" pour en ajouter</span>
            </div>
        `;
    } else {
        dayData.exercises.forEach(exercise => {
            const exerciseCard = createViewExerciseCard(exercise);
            viewExercisesContainer.appendChild(exerciseCard);
        });
    }
}

// Create View Exercise Card
function createViewExerciseCard(exercise) {
    const card = document.createElement('div');
    card.className = 'view-exercise-card';

    const weightDisplay = exercise.weight ? `${exercise.weight}<span class="unit">kg</span>` : '-';
    const setsDisplay = exercise.sets || '-';
    const repsDisplay = exercise.reps || '-';

    card.innerHTML = `
        <div class="view-exercise-name">${exercise.name || 'Exercice sans nom'}</div>
        <div class="view-exercise-details">
            <div class="view-detail-item">
                <div class="view-detail-label">Poids</div>
                <div class="view-detail-value">${weightDisplay}</div>
            </div>
            <div class="view-detail-item">
                <div class="view-detail-label">Séries</div>
                <div class="view-detail-value">${setsDisplay}</div>
            </div>
            <div class="view-detail-item">
                <div class="view-detail-label">Reps</div>
                <div class="view-detail-value">${repsDisplay}</div>
            </div>
        </div>
    `;

    return card;
}

// Update Session Type
function updateSessionType(type) {
    const workoutSection = document.getElementById('workoutSection');
    const restSection = document.getElementById('restSection');
    const rotationSection = document.getElementById('rotationSection');
    const toggleBtns = document.querySelectorAll('.toggle-btn');

    toggleBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === type);
    });

    // Hide all sections first
    workoutSection.style.display = 'none';
    restSection.style.display = 'none';
    rotationSection.style.display = 'none';

    // Show the appropriate section
    if (type === 'workout') {
        workoutSection.style.display = 'block';
    } else if (type === 'rest') {
        restSection.style.display = 'block';
    } else if (type === 'rotation') {
        rotationSection.style.display = 'block';
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

    workoutData.weeks[currentDay].type = sessionType;

    // Handle based on type
    if (sessionType === 'workout') {
        const sessionName = document.getElementById('sessionName').value;
        workoutData.weeks[currentDay].name = sessionName;
    } else {
        // Clear data for rest and rotation types
        workoutData.weeks[currentDay].name = '';
        workoutData.weeks[currentDay].exercises = [];
    }

    saveToLocalStorage();
    renderWeekView();

    // Check if rotation info box should be shown
    const hasRotation = Object.values(workoutData.weeks).some(day => day.type === 'rotation');
    document.getElementById('rotationInfoBox').style.display = hasRotation ? 'block' : 'none';

    // Switch to view mode if workout session with data
    const dayData = workoutData.weeks[currentDay];
    const hasSavedData = sessionType === 'workout' && (dayData.name || dayData.exercises.length > 0);

    if (hasSavedData) {
        switchToViewMode();
    } else {
        closeModal();
    }
}

// Week navigation
function goToPreviousWeek() {
    if (workoutData.currentWeek > 1) {
        workoutData.currentWeek--;
        renderWeekView();
        saveToLocalStorage();
    }
}

function goToNextWeek() {
    workoutData.currentWeek++;
    renderWeekView();
    saveToLocalStorage();
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

    // Edit button
    document.getElementById('editBtn').addEventListener('click', switchToEditMode);

    // Session name input
    document.getElementById('sessionName').addEventListener('input', (e) => {
        if (currentDay) {
            workoutData.weeks[currentDay].name = e.target.value;
        }
    });

    // Week navigation
    document.getElementById('prevWeek').addEventListener('click', goToPreviousWeek);
    document.getElementById('nextWeek').addEventListener('click', goToNextWeek);

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Escape to close modal
        if (e.key === 'Escape') {
            if (document.getElementById('sessionModal').classList.contains('active')) {
                closeModal();
            }
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
