function updateGreetingDate() {
  const dateEl = document.getElementById("currentDate");

  const now = new Date();

  const options = {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric"
  };

  dateEl.textContent = now.toLocaleDateString("en-GB", options);
}

updateGreetingDate();

// Keep track of chart instances globally
let lineChartInstance = null;
let barChartInstance = null;

document.addEventListener("DOMContentLoaded", () => {
  if (typeof Chart === "undefined") return;
  
  // Initial render of charts with real data
  refreshCharts();
});


//random thoughts 
const thoughts = [
    "Small habits make big changes.",
    "Discipline beats motivation every time.",
    "Consistency creates confidence.",
    "Start where you are. Use what you have.",
    "Your future self will thank you.",
    "Progress, not perfection.",
    "Dreams don’t work unless you do.",
    "One day or day one. You decide.",
    "Hard work compounds silently.",
    "Focus on growth, not comfort."
];

const motivationEl = document.getElementById("motivation");

const randomIndex = Math.floor(Math.random() * thoughts.length);
motivationEl.textContent = `“${thoughts[randomIndex]}”`;

// ===============================
// DATE HELPERS
// ===============================
const today = new Date();
today.setHours(0, 0, 0, 0);

const todayKey = today.toISOString().split("T")[0];
const todayIndex = today.getDay(); // 0 = Sun

// ===============================
// STORAGE
// ===============================
const STORAGE_KEY = "habit_dashboard_v2";

const defaultState = {
  habits: [],
  challenges: [],
  perfectDays: 0,
  streak: 0,
  lastPerfectDate: null
};

let state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || structuredClone(defaultState);

// ===============================
// ELEMENTS
// ===============================
const habitInput = document.getElementById("habitName");
const addHabitBtn = document.getElementById("addHabitBtn");
const habitList = document.getElementById("habitList");
const noHabitText = document.getElementById("noHabit");

const perfectDaysEl = document.querySelector(".progress .stat:nth-child(2) strong");
const streakEl = document.querySelector(".progress .stat:nth-child(3) strong");

const highestStreakEl = document.getElementById("highestStreak");
const totalCompletedEl = document.getElementById("totalCompleted");
const skippedDaysEl = document.getElementById("skippedDays");

// ===============================
// SAVE
// ===============================
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ===============================
// HABITS
// ===============================
function addHabit() {
  const name = habitInput.value.trim();
  
  // 1. Safety Check: Ensure state and habits array exist
  if (!state || !state.habits) {
    console.error("State is corrupted! Resetting to default.");
    state = structuredClone(defaultState);
  }

  if (!name) return;

  // 2. Safety Check: Ensure every habit object actually has a name string
  // This prevents .toLowerCase() from crashing if a habit name is null
  const isDuplicate = state.habits.some(habit => {
    return habit.name && habit.name.toLowerCase() === name.toLowerCase();
  });

  if (isDuplicate) {
    alert("This habit already exists!");
    habitInput.value = "";
    return;
  }

  // 3. Create the new habit object
  const newHabit = {
    id: Date.now(),
    name: name,
    checkedDates: {}
  };

  state.habits.push(newHabit);

  // 4. Update UI
  habitInput.value = "";
  save();
  renderHabits();
  recalcToday();
  updateHabitAnalytics();
}

function removeHabit(id) {
  state.habits = state.habits.filter(h => h.id !== id);
  save();
  renderHabits();
  recalcToday();
  updateHabitAnalytics();
}

function toggleHabit(habitId, dateKey) {
  if (dateKey < todayKey) return;

  const habit = state.habits.find(h => h.id === habitId);
  if (!habit) return;

  habit.checkedDates[dateKey] = !habit.checkedDates[dateKey];
  save();
  recalcToday();
  updateHabitAnalytics();
}

// ===============================
// PERFECT DAY + STREAK LOGIC
// ===============================
function recalcToday() {
  if (state.habits.length === 0) {
    state.perfectDays = 0;
    state.streak = 0;
    state.lastPerfectDate = null;
    save();
    updateUI();
    return;
  }

  const isPerfectToday = state.habits.every(
    h => h.checkedDates[todayKey] === true
  );

  if (!isPerfectToday) {
    state.streak = 0;
    save();
    updateUI();
    return;
  }

  if (state.lastPerfectDate === todayKey) {
    updateUI();
    return;
  }

  state.perfectDays++;

  if (
    state.lastPerfectDate &&
    new Date(todayKey) - new Date(state.lastPerfectDate) === 86400000
  ) {
    state.streak++;
  } else {
    state.streak = 1;
  }

  state.lastPerfectDate = todayKey;
  save();
  updateUI();
}

// ===============================
// STREAK CALCULATOR
// ===============================
function calculateStreaks(dateKeys) {
  if (dateKeys.length === 0) return { current: 0, highest: 0 };

  const dates = dateKeys.map(d => new Date(d)).sort((a, b) => a - b);

  let highest = 1;
  let current = 1;

  for (let i = 1; i < dates.length; i++) {
    const diff = (dates[i] - dates[i - 1]) / 86400000;
    if (diff === 1) {
      current++;
      highest = Math.max(highest, current);
    } else {
      current = 1;
    }
  }

  const last = dates[dates.length - 1].toISOString().split("T")[0];
  if (last !== todayKey) current = 0;

  return { current, highest };
}

// ===============================
// ANALYTICS
// ===============================
function updateHabitAnalytics() {
  let totalCompleted = 0;
  let skippedDays = 0;
  let highestStreakEver = 0;

  state.habits.forEach(habit => {
    const completedDates = Object.keys(habit.checkedDates).filter(
      d => habit.checkedDates[d]
    );

    totalCompleted += completedDates.length;

    const { current, highest } = calculateStreaks(completedDates);
    highestStreakEver = Math.max(highestStreakEver, highest);

    if (completedDates.length > 1) {
      const sorted = completedDates.map(d => new Date(d)).sort((a, b) => a - b);
      for (let i = 1; i < sorted.length; i++) {
        const diff = (sorted[i] - sorted[i - 1]) / 86400000;
        if (diff > 1) skippedDays += diff - 1;
      }
    }

    habit.analytics = {
      currentStreak: current,
      highestStreak: highest,
      totalCompleted: completedDates.length
    };
  });

  highestStreakEl.textContent = highestStreakEver;
  totalCompletedEl.textContent = totalCompleted;
  skippedDaysEl.textContent = skippedDays;
}

// ===============================
// RENDER HABITS
// ===============================
function renderHabits() {
  habitList.innerHTML = "";

  if (state.habits.length === 0) {
    noHabitText.style.display = "block";
    habitList.appendChild(noHabitText);
    updateUI();
    return;
  }

  noHabitText.style.display = "none";

  state.habits.forEach(habit => {
    const card = document.createElement("div");
    card.className = "habit-card";

    const header = document.createElement("div");
    header.className = "habit-header";
    header.innerHTML = `
      <h4>${habit.name}</h4>
      <button onclick="removeHabit(${habit.id})">Remove</button>
    `;

    const week = document.createElement("div");
    week.className = "week";

    ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].forEach((day, idx) => {
      const label = document.createElement("label");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";

      const date = new Date(today);
      date.setDate(today.getDate() - todayIndex + idx);
      const dateKey = date.toISOString().split("T")[0];

      checkbox.checked = habit.checkedDates[dateKey] || false;
      if (dateKey < todayKey) checkbox.disabled = true;

      checkbox.addEventListener("change", () =>
        toggleHabit(habit.id, dateKey)
      );

      label.append(day, checkbox);
      week.appendChild(label);
    });

    card.append(header, week);
    habitList.appendChild(card);
  });
}

// ===============================
// UI
// ===============================
function updateUI() {
  perfectDaysEl.textContent = state.perfectDays;
  streakEl.textContent = state.streak;
}

// ===============================
// INIT
// ===============================


// ===============================
// CHALLENGES
// ===============================
const challengeInput = document.getElementById("challengeInput");
const addChallengeBtn = document.getElementById("addChallengeBtn");
const challengeList = document.getElementById("challengeList");

function addChallenge() {
  const name = challengeInput.value.trim();
  if (!name) return;

  state.challenges.push({
    id: Date.now(),
    name
  });

  challengeInput.value = "";
  save();
  renderChallenges();
}

function removeChallenge(id) {
  state.challenges = state.challenges.filter(c => c.id !== id);
  save();
  renderChallenges();
}

function renderChallenges() {
  challengeList.innerHTML = "";

  if (state.challenges.length === 0) return;

  state.challenges.forEach(challenge => {
    const div = document.createElement("div");
    div.className = "challenge-item";

    div.innerHTML = `
      <span>${challenge.name}</span>
      <button onclick="removeChallenge(${challenge.id})">✕</button>
    `;

    challengeList.appendChild(div);
  });
}

addHabitBtn.addEventListener("click", addHabit);
addChallengeBtn.addEventListener("click", addChallenge);

renderHabits();
renderChallenges();
recalcToday();
updateHabitAnalytics();
updateUI();

// ===============================
// LINE CHART – HABIT PERFORMANCE
// ===============================

let myLineChart;

document.addEventListener("DOMContentLoaded", () => {
  // Safety check: Chart.js loaded or not
  if (typeof Chart === "undefined") {
    console.error("Chart.js not loaded");
    return;
  }

  // Get canvas
  const lineCanvas = document.getElementById("lineChart");
  if (!lineCanvas) {
    console.error("lineChart canvas not found");
    return;
  }

  // Labels & initial data (new user)
  const dailyLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const initialDailyData = [0, 0, 0, 0, 0, 0, 0];

  // Create line chart
  myLineChart = new Chart(lineCanvas.getContext("2d"), {
    type: "line",
    data: {
      labels: dailyLabels,
      datasets: [
        {
          label: "Habits Completed",
          data: initialDailyData,
          borderColor: "#ffcc99",
          backgroundColor: "rgba(255, 204, 153, 0.3)",
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointHoverRadius: 7
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });

  // Load data after chart creation
  loadUserData();
});

// ===============================
// UPDATE CHART DATA
// ===============================
function updatePerformanceChart(newDataArray) {
  if (!myLineChart) return;

  // Prevent data mismatch bugs
  if (newDataArray.length !== myLineChart.data.labels.length) {
    console.error("Data length does not match labels length");
    return;
  }

  myLineChart.data.datasets[0].data = newDataArray;
  myLineChart.update();
}

// ===============================
// LOAD USER DATA (SIMULATION)
// ===============================
function loadUserData() {
  // Later: fetch from localStorage / backend
  // Example for new user
  const realDataFromStorage = [0, 0, 0, 0, 0, 0, 0];

  updatePerformanceChart(realDataFromStorage);
}
