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

// Ring geometry — must match the SVG circles' r attribute
const RING_RADIUS = 52;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function applyRingProgress(circleEl, percent) {
    if (!circleEl) return;
    const clamped = Math.max(0, Math.min(percent, 100));
    const offset = RING_CIRCUMFERENCE - (clamped / 100) * RING_CIRCUMFERENCE;
    circleEl.style.strokeDasharray = String(RING_CIRCUMFERENCE);
    circleEl.style.strokeDashoffset = String(offset);
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

    // Update circular ring progress
    const caloriesPercent = caloriesTarget ? (caloriesCurrent / caloriesTarget) * 100 : 0;
    const proteinPercent = proteinTarget ? (proteinCurrent / proteinTarget) * 100 : 0;
    applyRingProgress(document.getElementById('caloriesBar'), caloriesPercent);
    applyRingProgress(document.getElementById('proteinBar'), proteinPercent);

    // Update dates
    const today = new Date();
    const longStr = today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    const formatted = longStr.charAt(0).toUpperCase() + longStr.slice(1);
    const dailyDateEl = document.getElementById('dailyDate');
    if (dailyDateEl) dailyDateEl.textContent = formatted;
    const headerDateEl = document.getElementById('nutritionDateLabel');
    if (headerDateEl) headerDateEl.textContent = formatted;
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

// Attach Nutrition Event Listeners
function attachNutritionListeners() {
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

    // Edit profile button (gear) — only present when profile already exists
    const editProfileBtn = document.getElementById('editProfileBtn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', openProfileModal);
    }

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

// Initialize nutrition module when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initNutrition();
});

// Check daily reset every hour
setInterval(() => {
    checkDailyReset();
    if (nutritionData.daily.date === new Date().toDateString()) {
        updateMacroDisplay();
    }
}, 3600000); // Check every hour
