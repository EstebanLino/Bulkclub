// Workout Tracker App - Main JavaScript

// Data Structure
let workoutData = {
    // Session templates for rotation
    templates: [],

    // Current week number (for rotation)
    currentWeek: 1,

    // Week configuration: which days are workout days
    weekConfig: {
        monday: { type: 'rest', name: '', exercises: [] },
        tuesday: { type: 'rest', name: '', exercises: [] },
        wednesday: { type: 'rest', name: '', exercises: [] },
        thursday: { type: 'rest', name: '', exercises: [] },
        friday: { type: 'rest', name: '', exercises: [] },
        saturday: { type: 'rest', name: '', exercises: [] },
        sunday: { type: 'rest', name: '', exercises: [] }
    },

    // Historical data for each week (stores user modifications)
    weekHistory: {}
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
    renderWeekView();
    attachEventListeners();
}

// Get current week data with rotation
function getCurrentWeekData() {
    const weekKey = `week_${workoutData.currentWeek}`;

    // Check if we have historical data for this week
    if (workoutData.weekHistory[weekKey]) {
        return workoutData.weekHistory[weekKey];
    }

    // Otherwise, apply rotation from templates
    const weekData = {};
    const workoutDays = Object.keys(dayNames).filter(
        dayKey => workoutData.weekConfig[dayKey].type === 'workout'
    );

    if (workoutData.templates.length > 0 && workoutDays.length > 0) {
        // Calculate rotation offset based on week number
        const totalTrainingDays = workoutDays.length;
        const templateCount = workoutData.templates.length;
        const weekOffset = ((workoutData.currentWeek - 1) * totalTrainingDays) % templateCount;

        let trainingDayIndex = 0;
        Object.keys(dayNames).forEach(dayKey => {
            if (workoutData.weekConfig[dayKey].type === 'workout') {
                const templateIndex = (weekOffset + trainingDayIndex) % templateCount;
                const template = workoutData.templates[templateIndex];

                weekData[dayKey] = {
                    type: 'workout',
                    name: template.name,
                    exercises: JSON.parse(JSON.stringify(template.exercises || []))
                };
                trainingDayIndex++;
            } else {
                weekData[dayKey] = { type: 'rest', name: '', exercises: [] };
            }
        });
    } else {
        // No templates, use base config
        Object.keys(dayNames).forEach(dayKey => {
            weekData[dayKey] = { ...workoutData.weekConfig[dayKey] };
        });
    }

    return weekData;
}

// Save current week data to history
function saveCurrentWeekData(data) {
    const weekKey = `week_${workoutData.currentWeek}`;
    workoutData.weekHistory[weekKey] = data;
}

// Get day data from current week
function getCurrentDayData(dayKey) {
    const weekData = getCurrentWeekData();
    return weekData[dayKey];
}

// Update day data in current week
function updateCurrentDayData(dayKey, data) {
    const weekKey = `week_${workoutData.currentWeek}`;

    if (!workoutData.weekHistory[weekKey]) {
        workoutData.weekHistory[weekKey] = getCurrentWeekData();
    }

    workoutData.weekHistory[weekKey][dayKey] = data;
}

// Render Week View
function renderWeekView() {
    const weekView = document.getElementById('weekView');
    weekView.innerHTML = '';

    // Update week number display
    document.getElementById('weekNumber').textContent = workoutData.currentWeek;

    const currentWeekData = getCurrentWeekData();

    Object.keys(dayNames).forEach(dayKey => {
        const dayData = currentWeekData[dayKey];
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
    const currentWeekData = getCurrentWeekData();
    const dayData = currentWeekData[dayKey];

    // Set modal title
    document.getElementById('modalDay').textContent = dayNames[dayKey];

    // Set session type
    const isWorkout = dayData.type === 'workout';
    updateSessionType(isWorkout ? 'workout' : 'rest');

    // Determine if session has saved data
    const hasSavedData = isWorkout && (dayData.name || dayData.exercises.length > 0);

    // Load session data
    if (isWorkout) {
        document.getElementById('sessionName').value = dayData.name || '';
        renderExercises();
    }

    // Show in view mode if has saved data, otherwise edit mode
    if (hasSavedData) {
        switchToViewMode();
    } else {
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
    const dayData = getCurrentDayData(currentDay);
    updateSessionType(dayData.type);
}

// Render View Mode
function renderViewMode() {
    if (!currentDay) return;

    const dayData = getCurrentDayData(currentDay);
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
    const dayData = getCurrentDayData(currentDay);

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

    const dayData = getCurrentDayData(currentDay);
    dayData.exercises.push({
        name: '',
        weight: '',
        sets: '',
        reps: ''
    });

    updateCurrentDayData(currentDay, dayData);
    renderExercises();
}

// Update Exercise
function updateExercise(index, field, value) {
    if (!currentDay) return;

    const dayData = getCurrentDayData(currentDay);
    if (dayData.exercises[index]) {
        dayData.exercises[index][field] = value;
        updateCurrentDayData(currentDay, dayData);
    }
}

// Delete Exercise
function deleteExercise(index) {
    if (!currentDay) return;

    const dayData = getCurrentDayData(currentDay);
    dayData.exercises.splice(index, 1);
    updateCurrentDayData(currentDay, dayData);
    renderExercises();
}

// Save Session
function saveSession() {
    if (!currentDay) return;

    const sessionType = document.querySelector('.toggle-btn.active').dataset.type;
    const sessionName = document.getElementById('sessionName').value;

    const dayData = getCurrentDayData(currentDay);
    dayData.type = sessionType;
    dayData.name = sessionName;

    // Clean up exercises if rest day
    if (sessionType === 'rest') {
        dayData.exercises = [];
    }

    updateCurrentDayData(currentDay, dayData);
    saveToLocalStorage();
    renderWeekView();

    // Switch to view mode if workout session with data
    const hasSavedData = sessionType === 'workout' && (dayData.name || dayData.exercises.length > 0);

    if (hasSavedData) {
        switchToViewMode();
    } else {
        closeModal();
    }
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
            const newType = btn.dataset.type;
            updateSessionType(newType);

            // Update weekConfig when changing session type
            if (currentDay) {
                workoutData.weekConfig[currentDay].type = newType;
                saveToLocalStorage();
            }
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
            const dayData = getCurrentDayData(currentDay);
            dayData.name = e.target.value;
            updateCurrentDayData(currentDay, dayData);
        }
    });

    // Templates button
    document.getElementById('templatesBtn').addEventListener('click', openTemplatesModal);

    // Close templates modal
    document.getElementById('closeTemplatesModal').addEventListener('click', closeTemplatesModal);

    // Close templates modal when clicking outside
    document.getElementById('templatesModal').addEventListener('click', (e) => {
        if (e.target.id === 'templatesModal') {
            closeTemplatesModal();
        }
    });

    // Add template button
    document.getElementById('addTemplateBtn').addEventListener('click', addTemplate);

    // Save templates button
    document.getElementById('saveTemplatesBtn').addEventListener('click', saveTemplates);

    // Week navigation
    document.getElementById('prevWeek').addEventListener('click', goToPreviousWeek);
    document.getElementById('nextWeek').addEventListener('click', goToNextWeek);

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Escape to close modal
        if (e.key === 'Escape') {
            if (document.getElementById('sessionModal').classList.contains('active')) {
                closeModal();
            } else if (document.getElementById('templatesModal').classList.contains('active')) {
                closeTemplatesModal();
            }
        }

        // Ctrl/Cmd + S to save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            if (document.getElementById('sessionModal').classList.contains('active')) {
                saveSession();
            } else if (document.getElementById('templatesModal').classList.contains('active')) {
                saveTemplates();
            }
        }
    });
}

// ==================================
// TEMPLATES MANAGEMENT
// ==================================

// Open Templates Modal
function openTemplatesModal() {
    const modal = document.getElementById('templatesModal');
    renderTemplatesList();
    renderRotationPreview();
    modal.classList.add('active');
}

// Close Templates Modal
function closeTemplatesModal() {
    const modal = document.getElementById('templatesModal');
    modal.classList.remove('active');
}

// Render Templates List
function renderTemplatesList() {
    const container = document.getElementById('templatesList');
    container.innerHTML = '';

    workoutData.templates.forEach((template, index) => {
        const templateCard = createTemplateCard(template, index);
        container.appendChild(templateCard);
    });
}

// Create Template Card
function createTemplateCard(template, index) {
    const card = document.createElement('div');
    card.className = 'template-card';

    card.innerHTML = `
        <span class="template-handle">☰</span>
        <input
            type="text"
            class="template-input"
            placeholder="Nom du template (ex: Push, Pull, Legs...)"
            value="${template.name || ''}"
            data-index="${index}"
        >
        <button class="delete-template-btn" data-index="${index}">×</button>
    `;

    const input = card.querySelector('.template-input');
    const deleteBtn = card.querySelector('.delete-template-btn');

    input.addEventListener('input', (e) => {
        workoutData.templates[index].name = e.target.value;
        renderRotationPreview();
    });

    deleteBtn.addEventListener('click', () => {
        workoutData.templates.splice(index, 1);
        renderTemplatesList();
        renderRotationPreview();
    });

    return card;
}

// Add Template
function addTemplate() {
    workoutData.templates.push({
        name: '',
        exercises: []
    });
    renderTemplatesList();
    renderRotationPreview();
}

// Save Templates
function saveTemplates() {
    // Update week config to set workout days
    // For now, let user manually set workout days via modal
    saveToLocalStorage();
    renderWeekView();
    closeTemplatesModal();
}

// Render Rotation Preview
function renderRotationPreview() {
    const container = document.getElementById('rotationInfo');

    if (workoutData.templates.length === 0) {
        container.innerHTML = '';
        return;
    }

    // Count workout days
    const workoutDays = Object.keys(dayNames).filter(
        dayKey => workoutData.weekConfig[dayKey].type === 'workout'
    );

    if (workoutDays.length === 0) {
        container.innerHTML = `
            <h3>Aperçu de la rotation</h3>
            <p style="font-size: 13px; color: var(--text-light); margin-top: 8px;">
                Configurez vos jours d'entraînement en cliquant sur les jours de la semaine et en choisissant "Séance".
            </p>
        `;
        return;
    }

    const previewHtml = [];
    previewHtml.push('<h3>Aperçu de la rotation</h3>');
    previewHtml.push('<div class="rotation-preview">');

    // Show first 3 weeks as example
    for (let week = 1; week <= 3; week++) {
        const weekTemplates = [];
        const totalTrainingDays = workoutDays.length;
        const templateCount = workoutData.templates.length;
        const weekOffset = ((week - 1) * totalTrainingDays) % templateCount;

        for (let i = 0; i < totalTrainingDays; i++) {
            const templateIndex = (weekOffset + i) % templateCount;
            const template = workoutData.templates[templateIndex];
            weekTemplates.push(template.name || `Template ${templateIndex + 1}`);
        }

        previewHtml.push(`
            <div class="rotation-week">
                <strong>Semaine ${week}:</strong> ${weekTemplates.join(' → ')}
            </div>
        `);
    }

    previewHtml.push('</div>');
    container.innerHTML = previewHtml.join('');
}

// ==================================
// WEEK NAVIGATION
// ==================================

// Navigate to previous week
function goToPreviousWeek() {
    if (workoutData.currentWeek > 1) {
        workoutData.currentWeek--;
        renderWeekView();
        saveToLocalStorage();
    }
}

// Navigate to next week
function goToNextWeek() {
    workoutData.currentWeek++;
    renderWeekView();
    saveToLocalStorage();
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Auto-save every 30 seconds
setInterval(() => {
    if (currentDay) {
        const dayData = getCurrentDayData(currentDay);
        if (dayData && dayData.type === 'workout') {
            saveToLocalStorage();
        }
    }
}, 30000);
