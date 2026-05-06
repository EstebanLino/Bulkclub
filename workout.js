// ============================================================================
// Workout Tracker — inline accordion edition
// One concept per screen, auto-save, rotation as a global setting.
// ============================================================================

let workoutData = {
    weeks: {
        monday:    { type: 'rest', name: '', exercises: [] },
        tuesday:   { type: 'rest', name: '', exercises: [] },
        wednesday: { type: 'rest', name: '', exercises: [] },
        thursday:  { type: 'rest', name: '', exercises: [] },
        friday:    { type: 'rest', name: '', exercises: [] },
        saturday:  { type: 'rest', name: '', exercises: [] },
        sunday:    { type: 'rest', name: '', exercises: [] }
    },
    settings: {
        rotationActive: false
    },
    currentWeek: 1
};

const dayNames = {
    monday: 'Lundi', tuesday: 'Mardi', wednesday: 'Mercredi',
    thursday: 'Jeudi', friday: 'Vendredi', saturday: 'Samedi', sunday: 'Dimanche'
};

const dayKeyOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

// Days currently expanded in the accordion (persisted within session)
const expandedDays = new Set();

// ============================================================================
// Bootstrap
// ============================================================================
function init() {
    loadFromLocalStorage();
    migrateLegacyData();

    // Open today's card by default on the current week
    if (workoutData.currentWeek === 1) {
        expandedDays.add(getTodayKey());
    }

    renderHeader();
    renderRotationToggle();
    renderWeekView();
    attachListeners();
}

// One-shot migration from the old per-day rotation type to a global setting
function migrateLegacyData() {
    if (!workoutData.settings) {
        workoutData.settings = { rotationActive: false };
    }
    let foundLegacyRotation = false;
    Object.keys(workoutData.weeks).forEach(key => {
        if (workoutData.weeks[key].type === 'rotation') {
            workoutData.weeks[key].type = 'workout';
            foundLegacyRotation = true;
        }
    });
    if (foundLegacyRotation) {
        workoutData.settings.rotationActive = true;
        save();
    }
}

// ============================================================================
// Date helpers
// ============================================================================
function getTodayKey() {
    const idx = (new Date().getDay() + 6) % 7;
    return dayKeyOrder[idx];
}

function getDateForDayKey(dayKey) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIdx = (today.getDay() + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - todayIdx);
    const weekOffset = (workoutData.currentWeek - 1) * 7;
    const targetIdx = dayKeyOrder.indexOf(dayKey);
    const date = new Date(monday);
    date.setDate(monday.getDate() + weekOffset + targetIdx);
    return date;
}

function formatShortDate(date) {
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }).replace('.', '');
}

// ============================================================================
// Rotation logic
// ============================================================================
function getWorkoutSessions() {
    const sessions = [];
    dayKeyOrder.forEach(key => {
        const d = workoutData.weeks[key];
        if (d.type === 'workout' && (d.name || (d.exercises && d.exercises.length > 0))) {
            sessions.push({ day: key, name: d.name, exercises: d.exercises });
        }
    });
    return sessions;
}

function getTrainingDays() {
    return dayKeyOrder.filter(key => workoutData.weeks[key].type === 'workout');
}

function getRotatedSessionForDay(dayKey) {
    const sessions = getWorkoutSessions();
    if (sessions.length === 0) return null;
    const trainingDays = getTrainingDays();
    const dayIdx = trainingDays.indexOf(dayKey);
    if (dayIdx === -1) return null;
    const total = trainingDays.length;
    const sCount = sessions.length;
    const offset = ((workoutData.currentWeek - 1) * total) % sCount;
    return sessions[(offset + dayIdx) % sCount];
}

// Resolve what to display for a given day (handles rotation transparently)
function resolveDayDisplay(dayKey) {
    const dayData = workoutData.weeks[dayKey];
    if (dayData.type === 'rest') {
        return { type: 'rest', sessionName: '', exerciseCount: 0, isRotated: false };
    }
    if (workoutData.settings.rotationActive) {
        const rotated = getRotatedSessionForDay(dayKey);
        if (rotated) {
            return {
                type: 'workout',
                sessionName: rotated.name || 'Séance',
                exerciseCount: rotated.exercises ? rotated.exercises.length : 0,
                isRotated: true,
                rotatedFromDay: rotated.day
            };
        }
    }
    return {
        type: 'workout',
        sessionName: dayData.name || 'Séance',
        exerciseCount: dayData.exercises ? dayData.exercises.length : 0,
        isRotated: false
    };
}

// ============================================================================
// Rendering
// ============================================================================
function renderHeader() {
    const today = new Date();
    const longStr = today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    document.getElementById('todayDateLabel').textContent =
        longStr.charAt(0).toUpperCase() + longStr.slice(1);
}

function renderRotationToggle() {
    document.getElementById('rotationToggle').checked = workoutData.settings.rotationActive;
}

function updateWeekRangeLabel() {
    const monday = getDateForDayKey('monday');
    const sunday = getDateForDayKey('sunday');
    const range = `${formatShortDate(monday)} → ${formatShortDate(sunday)}`;
    let label;
    if (workoutData.currentWeek === 1) {
        label = `Cette semaine · ${range}`;
    } else if (workoutData.currentWeek === 2) {
        label = `Semaine prochaine · ${range}`;
    } else if (workoutData.currentWeek > 2) {
        label = `Sem. +${workoutData.currentWeek - 1} · ${range}`;
    } else {
        label = range;
    }
    document.getElementById('weekRangeLabel').textContent = label;
    document.getElementById('prevWeek').disabled = workoutData.currentWeek <= 1;
}

function renderWeekView() {
    updateWeekRangeLabel();
    const view = document.getElementById('weekView');
    view.innerHTML = '';

    const todayKey = getTodayKey();
    const showTodayHighlight = workoutData.currentWeek === 1;

    dayKeyOrder.forEach(dayKey => {
        const isToday = showTodayHighlight && dayKey === todayKey;
        view.appendChild(createDayCard(dayKey, isToday));
    });
}

function createDayCard(dayKey, isToday) {
    const display = resolveDayDisplay(dayKey);
    const isExpanded = expandedDays.has(dayKey);
    const dateStr = formatShortDate(getDateForDayKey(dayKey));

    const article = document.createElement('article');
    const classes = ['day-card', display.type];
    if (isToday) classes.push('today');
    if (isExpanded) classes.push('expanded');
    article.className = classes.join(' ');
    article.dataset.day = dayKey;

    const summaryParts = [];
    if (display.type === 'workout') {
        summaryParts.push(escapeHTML(display.sessionName));
        if (display.exerciseCount > 0) {
            summaryParts.push(`${display.exerciseCount} ex.`);
        }
    } else {
        summaryParts.push('Repos');
    }
    const summaryText = summaryParts.join(' · ');
    const rotationIcon = display.isRotated
        ? '<svg class="rotation-icon-inline"><use href="#icon-rotation"></use></svg>'
        : '';
    const todayBadge = isToday ? '<span class="today-badge">Aujourd\'hui</span>' : '';

    article.innerHTML = `
        <button class="day-card-header" type="button" data-action="toggle">
            <div class="day-card-info">
                <div class="day-card-name">
                    <span class="day-name">${dayNames[dayKey]}</span>
                    <span class="day-date">${dateStr}</span>
                    ${todayBadge}
                </div>
                <span class="day-card-summary">${rotationIcon}${summaryText}</span>
            </div>
            <span class="day-card-chevron" aria-hidden="true">▾</span>
        </button>
        <div class="day-card-body">
            <div class="day-body-content">
                ${createDayBodyHTML(dayKey, display)}
            </div>
        </div>
    `;
    return article;
}

function createDayBodyHTML(dayKey, display) {
    const dayData = workoutData.weeks[dayKey];
    const isWorkout = dayData.type === 'workout';

    return `
        <div class="type-toggle" role="tablist">
            <button class="toggle-btn ${dayData.type === 'rest' ? 'active' : ''}"
                    type="button" data-type="rest" data-day="${dayKey}">Repos</button>
            <button class="toggle-btn ${dayData.type === 'workout' ? 'active' : ''}"
                    type="button" data-type="workout" data-day="${dayKey}">Entraînement</button>
        </div>
        ${isWorkout ? createWorkoutBodyHTML(dayKey, display) : createRestBodyHTML()}
    `;
}

function createWorkoutBodyHTML(dayKey, display) {
    const dayData = workoutData.weeks[dayKey];
    const rotationActive = workoutData.settings.rotationActive;

    let rotationBanner = '';
    if (rotationActive && display.isRotated) {
        const fromDayName = display.rotatedFromDay && display.rotatedFromDay !== dayKey
            ? ` (depuis ${dayNames[display.rotatedFromDay]})`
            : '';
        rotationBanner = `
            <div class="rotation-banner">
                <svg class="info-icon-inline"><use href="#icon-info"></use></svg>
                <span>Rotation active · cette semaine vous faites <strong>${escapeHTML(display.sessionName)}</strong>${fromDayName}.</span>
            </div>
        `;
    }

    const exercisesHTML = dayData.exercises.length === 0
        ? '<p class="exercises-empty">Aucun exercice. Cliquez ci-dessous pour ajouter.</p>'
        : dayData.exercises.map((ex, i) => createExerciseHTML(ex, i, dayKey)).join('');

    return `
        ${rotationBanner}
        <div class="session-name-container">
            <input type="text" class="session-name-input" data-day="${dayKey}"
                   placeholder="Nom de la séance (ex: Push, Pull, Legs)"
                   value="${escapeHTML(dayData.name || '')}">
        </div>
        <div class="exercises-container" data-day="${dayKey}">
            ${exercisesHTML}
        </div>
        <button class="add-exercise-btn" type="button" data-action="add-exercise" data-day="${dayKey}">
            <span class="plus-icon">+</span> Ajouter un exercice
        </button>
    `;
}

function createRestBodyHTML() {
    return `
        <div class="rest-message-inline">
            <svg class="rest-icon-svg"><use href="#icon-rest"></use></svg>
            <p>Jour de repos</p>
            <span class="rest-subtitle">Récupération et régénération</span>
        </div>
    `;
}

function createExerciseHTML(exercise, index, dayKey) {
    return `
        <div class="exercise-card" data-day="${dayKey}" data-index="${index}">
            <div class="exercise-header">
                <input type="text" class="exercise-name-input"
                       placeholder="Nom de l'exercice"
                       value="${escapeHTML(exercise.name || '')}"
                       data-field="name">
                <button class="delete-exercise-btn" type="button"
                        data-action="delete-exercise"
                        aria-label="Supprimer l'exercice">×</button>
            </div>
            <div class="exercise-details">
                <div class="detail-group">
                    <label class="detail-label">Poids (kg)</label>
                    <input type="number" class="detail-input" data-field="weight"
                           placeholder="0" value="${exercise.weight || ''}" min="0" step="0.5">
                </div>
                <div class="detail-group">
                    <label class="detail-label">Séries</label>
                    <input type="number" class="detail-input" data-field="sets"
                           placeholder="0" value="${exercise.sets || ''}" min="1">
                </div>
                <div class="detail-group">
                    <label class="detail-label">Reps</label>
                    <input type="number" class="detail-input" data-field="reps"
                           placeholder="0" value="${exercise.reps || ''}" min="1">
                </div>
            </div>
        </div>
    `;
}

function escapeHTML(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
}

// Replace a single day card while keeping accordion state
function replaceDayCard(dayKey) {
    const oldCard = document.querySelector(`.day-card[data-day="${dayKey}"]`);
    if (!oldCard) return;
    const wasFocusedField = document.activeElement &&
        oldCard.contains(document.activeElement) ? document.activeElement.dataset.field : null;

    const todayKey = getTodayKey();
    const isToday = workoutData.currentWeek === 1 && dayKey === todayKey;
    const newCard = createDayCard(dayKey, isToday);
    oldCard.replaceWith(newCard);

    // Re-focus first input if we were typing
    if (wasFocusedField) {
        const newInput = newCard.querySelector(`[data-field="${wasFocusedField}"]`);
        if (newInput) newInput.focus();
    }
}

// Lighter update — only refresh the summary in the header without rerendering body
function refreshDayCardSummary(dayKey) {
    const card = document.querySelector(`.day-card[data-day="${dayKey}"]`);
    if (!card) return;
    const display = resolveDayDisplay(dayKey);
    const summaryEl = card.querySelector('.day-card-summary');
    if (!summaryEl) return;
    const parts = display.type === 'workout'
        ? [escapeHTML(display.sessionName), display.exerciseCount > 0 ? `${display.exerciseCount} ex.` : null].filter(Boolean)
        : ['Repos'];
    const rotationIcon = display.isRotated
        ? '<svg class="rotation-icon-inline"><use href="#icon-rotation"></use></svg>'
        : '';
    summaryEl.innerHTML = rotationIcon + parts.join(' · ');
    card.classList.toggle('workout', display.type === 'workout');
    card.classList.toggle('rest', display.type === 'rest');
}

// When rotation is toggled, summaries of *all* training days may change
function refreshAllSummaries() {
    dayKeyOrder.forEach(refreshDayCardSummary);
}

// ============================================================================
// Event handling (delegated)
// ============================================================================
function attachListeners() {
    // Settings panel toggle
    document.getElementById('settingsBtn').addEventListener('click', toggleSettingsPanel);
    document.getElementById('rotationToggle').addEventListener('change', e => {
        workoutData.settings.rotationActive = e.target.checked;
        save();
        refreshAllSummaries();
        // Re-render bodies of currently expanded days so banners update
        Array.from(expandedDays).forEach(replaceDayCard);
    });

    // Week navigation
    document.getElementById('prevWeek').addEventListener('click', () => {
        if (workoutData.currentWeek > 1) {
            workoutData.currentWeek--;
            save();
            // Collapse all when switching weeks (today might no longer apply)
            expandedDays.clear();
            renderWeekView();
        }
    });
    document.getElementById('nextWeek').addEventListener('click', () => {
        workoutData.currentWeek++;
        save();
        expandedDays.clear();
        renderWeekView();
    });

    // Delegated event handling for the week view
    const weekView = document.getElementById('weekView');
    weekView.addEventListener('click', handleWeekViewClick);
    weekView.addEventListener('input', handleWeekViewInput);
}

function toggleSettingsPanel() {
    const panel = document.getElementById('settingsPanel');
    const btn = document.getElementById('settingsBtn');
    const opening = panel.hidden;
    panel.hidden = !opening;
    btn.classList.toggle('active', opening);
    btn.setAttribute('aria-expanded', String(opening));
}

function handleWeekViewClick(e) {
    // Toggle accordion expand/collapse
    const headerBtn = e.target.closest('[data-action="toggle"]');
    if (headerBtn) {
        const card = headerBtn.closest('.day-card');
        const day = card.dataset.day;
        if (expandedDays.has(day)) {
            expandedDays.delete(day);
            card.classList.remove('expanded');
        } else {
            expandedDays.add(day);
            card.classList.add('expanded');
        }
        return;
    }

    // Day type toggle (Repos / Entraînement)
    const typeBtn = e.target.closest('.toggle-btn[data-type]');
    if (typeBtn) {
        const day = typeBtn.dataset.day;
        const newType = typeBtn.dataset.type;
        if (workoutData.weeks[day].type !== newType) {
            workoutData.weeks[day].type = newType;
            save();
            // Body content depends on type — replace the whole card
            replaceDayCard(day);
            // Rotation pool may have changed — refresh all summaries
            if (workoutData.settings.rotationActive) {
                refreshAllSummaries();
            }
        }
        return;
    }

    // Add exercise
    const addBtn = e.target.closest('[data-action="add-exercise"]');
    if (addBtn) {
        const day = addBtn.dataset.day;
        workoutData.weeks[day].exercises.push({ name: '', weight: '', sets: '', reps: '' });
        save();
        replaceDayCard(day);
        // Focus the newly added exercise's name input
        const newCard = document.querySelector(`.day-card[data-day="${day}"]`);
        const lastExerciseName = newCard && newCard.querySelectorAll('.exercise-name-input');
        if (lastExerciseName && lastExerciseName.length) {
            lastExerciseName[lastExerciseName.length - 1].focus();
        }
        return;
    }

    // Delete exercise
    const deleteBtn = e.target.closest('[data-action="delete-exercise"]');
    if (deleteBtn) {
        const exCard = deleteBtn.closest('.exercise-card');
        const day = exCard.dataset.day;
        const idx = parseInt(exCard.dataset.index, 10);
        workoutData.weeks[day].exercises.splice(idx, 1);
        save();
        replaceDayCard(day);
        if (workoutData.settings.rotationActive) {
            refreshAllSummaries();
        }
    }
}

function handleWeekViewInput(e) {
    // Session name typing — auto-save + refresh summary
    const sessionInput = e.target.closest('.session-name-input');
    if (sessionInput) {
        const day = sessionInput.dataset.day;
        workoutData.weeks[day].name = sessionInput.value;
        save();
        if (workoutData.settings.rotationActive) {
            refreshAllSummaries();
        } else {
            refreshDayCardSummary(day);
        }
        return;
    }

    // Exercise field typing — auto-save
    const exerciseInput = e.target.closest('.exercise-card input[data-field]');
    if (exerciseInput) {
        const exCard = exerciseInput.closest('.exercise-card');
        const day = exCard.dataset.day;
        const idx = parseInt(exCard.dataset.index, 10);
        const field = exerciseInput.dataset.field;
        workoutData.weeks[day].exercises[idx][field] = exerciseInput.value;
        save();
    }
}

// ============================================================================
// Persistence
// ============================================================================
function save() {
    try {
        localStorage.setItem('workoutTrackerData', JSON.stringify(workoutData));
    } catch (e) {
        console.error('Save failed:', e);
    }
}

function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem('workoutTrackerData');
        if (saved) {
            const parsed = JSON.parse(saved);
            // Merge with defaults so we don't lose new fields
            workoutData = Object.assign({}, workoutData, parsed);
            workoutData.weeks = Object.assign({}, workoutData.weeks, parsed.weeks || {});
            workoutData.settings = Object.assign({ rotationActive: false }, parsed.settings || {});
        }
    } catch (e) {
        console.error('Load failed:', e);
    }
}

document.addEventListener('DOMContentLoaded', init);
