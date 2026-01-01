const holes = document.querySelectorAll(".hole");
const scoreEl = document.getElementById("score");
const hitsEl = document.getElementById("hits");
const missesEl = document.getElementById("misses");
const hitSound = document.getElementById("hitSound");
const missSound = document.getElementById("missSound");
const pauseBtn = document.getElementById("pauseBtn");
const easyBtn = document.getElementById("easyBtn");
const mediumBtn = document.getElementById("mediumBtn");
const hardBtn = document.getElementById("hardBtn");
const themeToggle = document.getElementById("themeToggle");
const badgesList = document.getElementById("badgesList");

// Badge names for display
const badgeNames = [
  "🚀 Combo Master",
  "🎯 Accuracy Star",
  "🔥 Fast Player",
  "⭐ Starter",
  "👑 High Score"
];

// small WebAudio pop (no file) for mole pop
let audioCtx = null;
function playPop() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(700, audioCtx.currentTime);
    g.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.15, audioCtx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.25);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + 0.26);
  } catch (e) {
    // fallback: play hitSound if WebAudio unavailable
    try { hitSound.play(); } catch (_) {}
  }
}



let gameOver = false;
let isPaused = false;
let currentDifficulty = "medium";
let moleSpawnInterval = 1000; // update interval in ms
let currentBadges = [false, false, false, false, false];

function endGame() {
  gameOver = true;
  clearInterval(timerInterval);
  clearInterval(moleInterval);
  holes.forEach(hole => hole.style.pointerEvents = "none");
  setTimeout(() => {
    let badgeText = "";
    if (currentBadges.some(b => b)) {
      badgeText = "\n\nBadges Earned: " + badgeNames.filter((_, i) => currentBadges[i]).join(", ");
    }
    alert("Game Over! Final Score: " + scoreEl.textContent + badgeText);
  }, 100);
}

function resetGame() {
  // Reset all game state on frontend
  gameOver = false;
  isPaused = false;
  timeLeft = 30;
  timerEl.textContent = timeLeft;
  scoreEl.textContent = 0;
  hitsEl.textContent = 0;
  missesEl.textContent = 0;
  holes.forEach(hole => hole.style.pointerEvents = "auto");
  pauseBtn.textContent = "Pause";
  pauseBtn.style.background = "#a7f3d0";
  updateGame();
  clearInterval(timerInterval);
  clearInterval(moleInterval);
  
  timerInterval = setInterval(() => {
    if (gameOver || isPaused) return;
    if (timeLeft > 0) {
      timeLeft--;
      timerEl.textContent = timeLeft;
      updateGame();
    } else {
      clearInterval(timerInterval);
      clearInterval(moleInterval);
      holes.forEach(hole => hole.style.pointerEvents = "none");
      alert("Time's up! Final Score: " + scoreEl.textContent);
    }
  }, 1000); // changed to 1000ms for accurate timer
  
  moleInterval = setInterval(() => {
    if (!gameOver && !isPaused) {
      updateGame();
    }
  }, moleSpawnInterval);

  // Reset backend state
  fetch('/reset', { method: 'POST' });
}

document.getElementById('resetBtn').onclick = resetGame;

// Difficulty level handlers
easyBtn.onclick = async () => {
  currentDifficulty = "easy";
  moleSpawnInterval = 1500;
  setDifficultyButtonStates("easy");
  await fetch('/set_difficulty', {
    method: 'POST',
    body: 'level=easy'
  });
};

mediumBtn.onclick = async () => {
  currentDifficulty = "medium";
  moleSpawnInterval = 1000;
  setDifficultyButtonStates("medium");
  await fetch('/set_difficulty', {
    method: 'POST',
    body: 'level=medium'
  });
};

hardBtn.onclick = async () => {
  currentDifficulty = "hard";
  moleSpawnInterval = 500;
  setDifficultyButtonStates("hard");
  await fetch('/set_difficulty', {
    method: 'POST',
    body: 'level=hard'
  });
};

function setDifficultyButtonStates(selected) {
  easyBtn.style.borderColor = selected === "easy" ? "#eebbc3" : "#a7a9be";
  mediumBtn.style.borderColor = selected === "medium" ? "#eebbc3" : "#a7a9be";
  hardBtn.style.borderColor = selected === "hard" ? "#eebbc3" : "#a7a9be";
}

// Pause/Resume handler
pauseBtn.onclick = async () => {
  if (gameOver) return;
  
  if (!isPaused) {
    // Pause the game
    isPaused = true;
    pauseBtn.textContent = "Resume";
    pauseBtn.style.background = "#fbbf24";
    holes.forEach(hole => hole.style.pointerEvents = "none");
    clearInterval(moleInterval);
    await fetch('/pause', {
      method: 'POST',
      body: `timeLeft=${timeLeft * 1000}`
    });
  } else {
    // Resume the game
    isPaused = false;
    pauseBtn.textContent = "Pause";
    pauseBtn.style.background = "#a7f3d0";
    holes.forEach(hole => hole.style.pointerEvents = "auto");
    await fetch('/resume', {
      method: 'POST'
    });
    moleInterval = setInterval(() => {
      if (!gameOver && !isPaused) {
        updateGame();
      }
    }, moleSpawnInterval);
  }
};

holes.forEach(hole => {
  hole.addEventListener("click", async () => {
    if (gameOver || isPaused) return;
    const idx = hole.dataset.index;
    const res = await fetch("/hit", {
      method: "POST",
      body: `hole=${idx}`
    });
    const result = await res.text();
    if (result === "hit") hitSound.play();
    else if (result === "gameOver") {
      missSound.play();
      endGame();
      return;
    } else {
      missSound.play();
    }
    updateGame();
  });
});

async function updateGame() {
  const res = await fetch("/game_state");
  const data = await res.json();

  // show active mole(s)
  holes.forEach(hole => hole.classList.remove("active"));
  if (Array.isArray(data.moles)) {
    // available creature images (fallback to mole.png)
    const creatures = [
      'mole.png',
      'cat.svg',
      'bunny.svg',
      'butterfly.svg'
    ];
    data.moles.forEach(idx => {
      if (idx >= 0 && idx < holes.length) {
        const hole = holes[idx];
        // pick a random creature
        const img = creatures[Math.floor(Math.random() * creatures.length)];
        hole.style.setProperty('--mole-img', `url('${img}')`);
        hole.classList.add("active");
        // schedule a pop sound roughly at the peak of the animation (~280ms)
        setTimeout(playPop, 280);
      }
    });
  }

  scoreEl.textContent = data.score;
  hitsEl.textContent = data.hits;
  missesEl.textContent = data.misses;
  
  // Update badges display
  currentBadges = data.badges;
  updateBadgesDisplay();
  
  // Check for game over due to 5 misses
  if (data.misses >= data.maxMisses && !gameOver) {
    endGame();
  }
}

function updateBadgesDisplay() {
  badgesList.innerHTML = "";
  badgeNames.forEach((name, idx) => {
    if (currentBadges[idx]) {
      const badge = document.createElement("div");
      badge.style.cssText = "background: #fbbf24; color: #232946; padding: 8px; border-radius: 5px; font-weight: bold; font-size: 0.9em;";
      badge.textContent = name;
      badgesList.appendChild(badge);
    }
  });
}



// Timer logic

const timerEl = document.getElementById("timer");
let timeLeft = 30;

let timerInterval;
let moleInterval;

// Always start with a fresh game state on page load
function freshStart() {
  gameOver = false;
  isPaused = false;
  timeLeft = 30;
  timerEl.textContent = timeLeft;
  scoreEl.textContent = 0;
  hitsEl.textContent = 0;
  missesEl.textContent = 0;
  holes.forEach(hole => hole.style.pointerEvents = "auto");
  updateGame();
  clearInterval(timerInterval);
  clearInterval(moleInterval);
  
  setDifficultyButtonStates("medium");
  
  timerInterval = setInterval(() => {
    if (gameOver || isPaused) return;
    if (timeLeft > 0) {
      timeLeft--;
      timerEl.textContent = timeLeft;
      updateGame();
    } else {
      clearInterval(timerInterval);
      clearInterval(moleInterval);
      holes.forEach(hole => hole.style.pointerEvents = "none");
      alert("Time's up! Final Score: " + scoreEl.textContent);
    }
  }, 1000);

  moleInterval = setInterval(() => {
    if (!gameOver && !isPaused) {
      updateGame();
    }
  }, moleSpawnInterval);
}

// Theme toggle functionality
function initializeTheme() {
  const savedTheme = localStorage.getItem("gameTheme") || "dark";
  if (savedTheme === "light") {
    document.body.classList.add("light-mode");
    themeToggle.textContent = "☀️";
  } else {
    document.body.classList.remove("light-mode");
    themeToggle.textContent = "🌙";
  }
}

themeToggle.onclick = () => {
  document.body.classList.toggle("light-mode");
  const isLightMode = document.body.classList.contains("light-mode");
  localStorage.setItem("gameTheme", isLightMode ? "light" : "dark");
  themeToggle.textContent = isLightMode ? "☀️" : "🌙";
};

window.onload = function() {
  initializeTheme();
  freshStart();
};