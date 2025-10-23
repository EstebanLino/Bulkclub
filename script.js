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

// Check if rotation mode is active
function isRotationActive() {
    return Object.values(workoutData.weeks).some(day => day.type === 'rotation');
}

// Get all workout sessions (template sessions to rotate)
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

// Get all training days (workout + rotation days, excluding rest days)
function getTrainingDays() {
    return Object.keys(dayNames).filter(key => {
        const dayData = workoutData.weeks[key];
        return dayData.type === 'workout' || dayData.type === 'rotation';
    });
}

// Get rotated session for a day based on current week
// When rotation is active, ALL training days (workout + rotation) rotate through sessions
function getRotatedSessionForDay(dayKey) {
    if (!isRotationActive()) {
        return null;
    }

    const workoutSessions = getWorkoutSessions();
    if (workoutSessions.length === 0) {
        return null;
    }

    const trainingDays = getTrainingDays();
    if (trainingDays.length === 0) {
        return null;
    }

    // Find the index of the current day in training days
    const dayIndex = trainingDays.indexOf(dayKey);
    if (dayIndex === -1) {
        return null;
    }

    // Calculate which session should be shown this week
    const sessionCount = workoutSessions.length;
    const totalTrainingDays = trainingDays.length;
    const weekOffset = ((workoutData.currentWeek - 1) * totalTrainingDays) % sessionCount;
    const sessionIndex = (weekOffset + dayIndex) % sessionCount;

    return workoutSessions[sessionIndex];
}

// Render Week View
function renderWeekView() {
    const weekView = document.getElementById('weekView');
    weekView.innerHTML = '';

    // Update week number
    document.getElementById('weekNumber').textContent = workoutData.currentWeek;

    const rotationActive = isRotationActive();

    Object.keys(dayNames).forEach(dayKey => {
        const dayData = workoutData.weeks[dayKey];
        let isWorkout = false;
        let sessionTitle = '';

        // If rotation is active, ALL training days show rotated sessions
        if (rotationActive && (dayData.type === 'workout' || dayData.type === 'rotation')) {
            const rotatedSession = getRotatedSessionForDay(dayKey);
            if (rotatedSession) {
                sessionTitle = `🔄 ${rotatedSession.name || 'Séance'}`;
                isWorkout = true;
            } else {
                sessionTitle = 'Rotation (aucune séance)';
                isWorkout = false;
            }
        } else if (dayData.type === 'workout') {
            // No rotation active, show normal workout
            sessionTitle = dayData.name || 'Séance d\'entraînement';
            isWorkout = true;
        } else if (dayData.type === 'rest') {
            sessionTitle = 'Jour de repos';
            isWorkout = false;
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
    const rotationActive = isRotationActive();

    // Set modal title
    document.getElementById('modalDay').textContent = dayNames[dayKey];

    // Set session type
    updateSessionType(dayData.type);

    // If rotation is active and this is a training day, show rotated session
    if (rotationActive && (dayData.type === 'workout' || dayData.type === 'rotation')) {
        const rotatedSession = getRotatedSessionForDay(dayKey);
        const sessionDisplay = document.getElementById('rotationCurrentSession');

        if (rotatedSession) {
            sessionDisplay.innerHTML = `
                <h4>Cette semaine</h4>
                <div class="session-name">${rotatedSession.name || 'Séance d\'entraînement'}</div>
                <div class="rotation-exercises-preview" style="margin-top: 16px;">
                    ${rotatedSession.exercises.map(ex => `
                        <div style="padding: 8px 0; border-bottom: 1px solid #eee;">
                            <div style="font-weight: 500;">${ex.name || 'Exercice'}</div>
                            <div style="font-size: 13px; color: var(--text-light); margin-top: 4px;">
                                ${ex.weight ? ex.weight + ' kg' : '-'} • ${ex.sets || '-'} séries • ${ex.reps || '-'} reps
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            sessionDisplay.innerHTML = `
                <p style="font-size: 14px; color: var(--text-light);">
                    Aucune séance définie pour la rotation.<br>
                    Créez d'abord des séances en mode "Séance".
                </p>
            `;
        }
        // Show rotation section (set type to rotation for display)
        updateSessionType('rotation');
        switchToEditMode();
    } else if (dayData.type === 'workout') {
        // No rotation active, show normal workout
        const hasSavedData = dayData.name || dayData.exercises.length > 0;
        document.getElementById('sessionName').value = dayData.name || '';
        renderExercises();

        if (hasSavedData) {
            switchToViewMode();
        } else {
            switchToEditMode();
        }
    } else if (dayData.type === 'rest') {
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
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    initNutrition();
});

// Auto-save every 30 seconds
setInterval(() => {
    if (currentDay && workoutData.weeks[currentDay].type === 'workout') {
        saveToLocalStorage();
    }
}, 30000);


//================================
// NUTRITION MODULE
//================================

// Nutrition Data Structure
let nutritionData = {
    profile: {
        weight: null,          // kg
        height: null,          // cm
        age: null,
        gender: 'male',        // 'male' or 'female'
        activityLevel: 1.55,   // multiplier
        goal: 'maintain'       // 'cut', 'maintain', 'bulk'
    },
    targets: {
        calories: 0,
        protein: 0
    },
    daily: {
        date: null,
        calories: 0,
        protein: 0,
        meals: []
    }
};

// Initialize Nutrition Module
function initNutrition() {
    loadNutritionData();
    attachNutritionListeners();
    checkDailyReset();
    updateNutritionUI();
}

// Calculate BMR using Mifflin-St Jeor Equation
function calculateBMR(weight, height, age, gender) {
    if (gender === 'male') {
        return (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
        return (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }
}

// Calculate TDEE (Total Daily Energy Expenditure)
function calculateTDEE(bmr, activityLevel) {
    return bmr * activityLevel;
}

// Calculate Macros based on profile and goal
function calculateMacros() {
    const { weight, height, age, gender, activityLevel, goal } = nutritionData.profile;

    if (!weight || !height || !age) {
        return null;
    }

    const bmr = calculateBMR(weight, height, age, gender);
    const tdee = calculateTDEE(bmr, activityLevel);

    let calories = tdee;
    let proteinPerKg = 1.8; // g per kg body weight

    // Adjust based on goal
    switch (goal) {
        case 'cut':
            calories = tdee - 500; // Deficit of 500 kcal
            proteinPerKg = 2.2;    // Higher protein to preserve muscle
            break;
        case 'bulk':
            calories = tdee + 300; // Surplus of 300 kcal
            proteinPerKg = 2.0;    // Moderate protein for growth
            break;
        case 'maintain':
            calories = tdee;
            proteinPerKg = 1.8;    // Maintenance protein
            break;
    }

    const protein = Math.round(weight * proteinPerKg);
    calories = Math.round(calories);

    return { calories, protein };
}

// Save Profile and Calculate Macros
function saveProfile() {
    const weight = parseFloat(document.getElementById('userWeight').value);
    const height = parseFloat(document.getElementById('userHeight').value);
    const age = parseInt(document.getElementById('userAge').value);
    const gender = document.getElementById('userGender').value;
    const activityLevel = parseFloat(document.getElementById('activityLevel').value);
    const goal = document.getElementById('goal').value;

    if (!weight || !height || !age) {
        alert('Veuillez remplir tous les champs requis');
        return;
    }

    nutritionData.profile = {
        weight,
        height,
        age,
        gender,
        activityLevel,
        goal
    };

    const macros = calculateMacros();
    if (macros) {
        nutritionData.targets = macros;
        saveNutritionData();
        closeProfileModal();
        updateNutritionUI();
    }
}

// Check if daily data needs to be reset
function checkDailyReset() {
    const today = new Date().toDateString();

    if (nutritionData.daily.date !== today) {
        // Reset daily data
        nutritionData.daily = {
            date: today,
            calories: 0,
            protein: 0,
            meals: []
        };
        saveNutritionData();
    }
}

// Add Meal
function addMeal() {
    const calories = parseFloat(document.getElementById('addCalories').value);
    const protein = parseFloat(document.getElementById('addProtein').value);

    if (!calories && !protein) {
        return;
    }

    const meal = {
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        calories: calories || 0,
        protein: protein || 0
    };

    nutritionData.daily.meals.push(meal);
    nutritionData.daily.calories += meal.calories;
    nutritionData.daily.protein += meal.protein;

    // Clear inputs
    document.getElementById('addCalories').value = '';
    document.getElementById('addProtein').value = '';

    saveNutritionData();
    renderMealList();
    updateMacroDisplay();
}

// Delete Meal
function deleteMeal(index) {
    const meal = nutritionData.daily.meals[index];
    nutritionData.daily.calories -= meal.calories;
    nutritionData.daily.protein -= meal.protein;
    nutritionData.daily.meals.splice(index, 1);

    saveNutritionData();
    renderMealList();
    updateMacroDisplay();
}

// Reset Daily Data
function resetDaily() {
    if (confirm('Voulez-vous vraiment réinitialiser les données du jour ?')) {
        nutritionData.daily = {
            date: new Date().toDateString(),
            calories: 0,
            protein: 0,
            meals: []
        };
        saveNutritionData();
        renderMealList();
        updateMacroDisplay();
    }
}

// Render Meal List
function renderMealList() {
    const mealList = document.getElementById('mealList');

    if (nutritionData.daily.meals.length === 0) {
        mealList.innerHTML = '<div class="meal-list-empty">Aucun repas ajouté aujourd\'hui</div>';
        return;
    }

    mealList.innerHTML = '';
    nutritionData.daily.meals.forEach((meal, index) => {
        const mealItem = document.createElement('div');
        mealItem.className = 'meal-item';
        mealItem.innerHTML = `
            <div class="meal-info">
                <div class="meal-time">${meal.time}</div>
                <div class="meal-macros">
                    <div class="meal-macro">${meal.calories} <span>kcal</span></div>
                    <div class="meal-macro">${meal.protein.toFixed(1)} <span>g</span></div>
                </div>
            </div>
            <button class="delete-meal-btn" data-index="${index}">×</button>
        `;

        const deleteBtn = mealItem.querySelector('.delete-meal-btn');
        deleteBtn.addEventListener('click', () => deleteMeal(index));

        mealList.appendChild(mealItem);
    });
}

// Update Macro Display
function updateMacroDisplay() {
    const caloriesCurrent = nutritionData.daily.calories;
    const caloriesTarget = nutritionData.targets.calories;
    const proteinCurrent = nutritionData.daily.protein;
    const proteinTarget = nutritionData.targets.protein;

    // Update text
    document.getElementById('caloriesCurrent').textContent = Math.round(caloriesCurrent);
    document.getElementById('caloriesTarget').textContent = caloriesTarget;
    document.getElementById('proteinCurrent').textContent = proteinCurrent.toFixed(1);
    document.getElementById('proteinTarget').textContent = proteinTarget;

    // Update progress bars
    const caloriesPercent = Math.min((caloriesCurrent / caloriesTarget) * 100, 100);
    const proteinPercent = Math.min((proteinCurrent / proteinTarget) * 100, 100);

    document.getElementById('caloriesBar').style.width = caloriesPercent + '%';
    document.getElementById('proteinBar').style.width = proteinPercent + '%';

    // Update date
    const today = new Date();
    const dateStr = today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    document.getElementById('dailyDate').textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
}

// Update Nutrition UI
function updateNutritionUI() {
    const hasProfile = nutritionData.targets.calories > 0;

    if (hasProfile) {
        document.getElementById('nutritionProfile').style.display = 'none';
        document.getElementById('dailyTracking').style.display = 'block';
        renderMealList();
        updateMacroDisplay();
    } else {
        document.getElementById('nutritionProfile').style.display = 'flex';
        document.getElementById('dailyTracking').style.display = 'none';
    }
}

// Open Profile Modal
function openProfileModal() {
    const modal = document.getElementById('profileModal');

    // Fill existing data if available
    if (nutritionData.profile.weight) {
        document.getElementById('userWeight').value = nutritionData.profile.weight;
        document.getElementById('userHeight').value = nutritionData.profile.height;
        document.getElementById('userAge').value = nutritionData.profile.age;
        document.getElementById('userGender').value = nutritionData.profile.gender;
        document.getElementById('activityLevel').value = nutritionData.profile.activityLevel;
        document.getElementById('goal').value = nutritionData.profile.goal;
    }

    modal.classList.add('active');
}

// Close Profile Modal
function closeProfileModal() {
    document.getElementById('profileModal').classList.remove('active');
}

// Page Navigation
function switchPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Show selected page
    document.getElementById(pageName + 'Page').classList.add('active');

    // Update nav buttons
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.nav-item[data-page="${pageName}"]`).classList.add('active');

    // Check daily reset when switching to nutrition
    if (pageName === 'nutrition') {
        checkDailyReset();
        updateMacroDisplay();
    }
}

// Attach Nutrition Event Listeners
function attachNutritionListeners() {
    // Bottom navigation
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.dataset.page;
            switchPage(page);
        });
    });

    // Profile setup button
    document.getElementById('profileSetupBtn').addEventListener('click', openProfileModal);

    // Profile modal
    document.getElementById('closeProfileModal').addEventListener('click', closeProfileModal);
    document.getElementById('profileModal').addEventListener('click', (e) => {
        if (e.target.id === 'profileModal') {
            closeProfileModal();
        }
    });
    document.getElementById('saveProfileBtn').addEventListener('click', saveProfile);

    // Meal tracking
    document.getElementById('addMealBtn').addEventListener('click', addMeal);
    document.getElementById('resetDayBtn').addEventListener('click', resetDaily);

    // Allow Enter key in inputs
    document.getElementById('addCalories').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addMeal();
    });
    document.getElementById('addProtein').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addMeal();
    });

    // Escape key for profile modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (document.getElementById('profileModal').classList.contains('active')) {
                closeProfileModal();
            }
        }
    });
}

// Local Storage for Nutrition
function saveNutritionData() {
    try {
        localStorage.setItem('nutritionTrackerData', JSON.stringify(nutritionData));
    } catch (error) {
        console.error('Error saving nutrition data:', error);
    }
}

function loadNutritionData() {
    try {
        const savedData = localStorage.getItem('nutritionTrackerData');
        if (savedData) {
            nutritionData = JSON.parse(savedData);
        }
    } catch (error) {
        console.error('Error loading nutrition data:', error);
    }
}

// Check daily reset every hour
setInterval(() => {
    if (document.getElementById('nutritionPage').classList.contains('active')) {
        checkDailyReset();
        if (nutritionData.daily.date === new Date().toDateString()) {
            updateMacroDisplay();
        }
    }
}, 3600000); // Check every hour
