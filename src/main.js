import { Game } from './game.js';
import { Player } from './player.js';
import { setupControls } from './controls.js';

// DOM Elements
const canvas = document.getElementById('game-canvas');
const startScreen = document.getElementById('start-screen');
const gameUI = document.getElementById('game-ui');
const gameOver = document.getElementById('game-over');
const pauseMenu = document.getElementById('pause-menu');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const pauseButton = document.getElementById('pause-button');
const resumeButton = document.getElementById('resume-button');
const quitButton = document.getElementById('quit-button');
const playAgainButton = document.getElementById('play-again-button');
const playerNameInput = document.getElementById('player-name');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const xpElement = document.getElementById('xp');
const nextLevelXpElement = document.getElementById('next-level-xp');
const finalScoreElement = document.getElementById('final-score');
const finalLevelElement = document.getElementById('final-level');
const timeSurvivedElement = document.getElementById('time-survived');
const playersEatenElement = document.getElementById('players-eaten');
const leaderboardElement = document.getElementById('leaders');
const colorOptions = document.querySelectorAll('.color-option');
const gameModes = document.querySelectorAll('.game-mode');
const soundToggle = document.getElementById('sound-toggle');
const musicToggle = document.getElementById('music-toggle');
const soundVolumeSlider = document.getElementById('sound-volume');
const musicVolumeSlider = document.getElementById('music-volume');

// Game instance
let game = null;
let gameStartTime = 0;
let playersEaten = 0;
let selectedGameMode = 'classic';

// Set canvas size
function resizeCanvas() {
  if (canvas) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (game) {
      game.updateViewport();
    }
  }
}

// Initialize the game
function initGame() {
  const playerName = playerNameInput?.value.trim() || 'Player';
  const selectedColorElement = document.querySelector('.color-option.selected');
  const selectedColor = selectedColorElement?.dataset.color || '#ff5252';
  
  // Hide start screen and show game UI
  if (startScreen) startScreen.style.display = 'none';
  if (gameUI) gameUI.style.display = 'block';
  if (gameOver) gameOver.style.display = 'none';
  if (pauseMenu) pauseMenu.style.display = 'none';
  
  // Check if canvas exists
  if (!canvas) {
    console.error('Canvas element not found!');
    return;
  }
  
  // Create new game instance
  game = new Game(canvas);
  game.gameMode = selectedGameMode;
  
  // Create player
  const player = new Player(playerName, selectedColor, game);
  game.setPlayer(player);
  
  // Setup controls
  setupControls(game, player);
  
  // Set audio preferences
  if (soundToggle && musicToggle && soundVolumeSlider && musicVolumeSlider) {
    game.soundManager.soundEnabled = soundToggle.checked;
    game.soundManager.musicEnabled = musicToggle.checked;
    game.soundManager.setVolume(soundVolumeSlider.value / 100);
    game.soundManager.setMusicVolume(musicVolumeSlider.value / 100);
  }
  
  // Reset stats
  gameStartTime = Date.now();
  playersEaten = 0;
  
  // Start game loop
  game.start();
  
  // Update UI
  updateUI();
}

// Update game UI (score, leaderboard)
function updateUI() {
  if (!game || !game.player) return;
  
  // Update score and level
  if (scoreElement) scoreElement.textContent = Math.floor(game.player.score);
  if (levelElement) levelElement.textContent = game.player.level;
  if (xpElement) xpElement.textContent = Math.floor(game.player.experience);
  if (nextLevelXpElement) nextLevelXpElement.textContent = game.player.experienceToNextLevel;
  
  // Update leaderboard
  if (leaderboardElement) {
    const leaders = game.getLeaderboard();
    leaderboardElement.innerHTML = '';
    
    leaders.forEach((leader, index) => {
      const li = document.createElement('li');
      
      // Add team indicator in team mode
      let teamIndicator = '';
      if (game.gameMode === 'teams' && leader.team) {
        teamIndicator = `[${leader.team.toUpperCase()}] `;
      }
      
      li.textContent = `${teamIndicator}${leader.name}: ${Math.floor(leader.score)}`;
      
      // Highlight player
      if (leader.id === 'player') {
        li.style.fontWeight = 'bold';
        li.style.color = game.player.color;
      }
      
      leaderboardElement.appendChild(li);
    });
  }
  
  // Check if game is over
  if (game.isGameOver) {
    showGameOver();
    return;
  }
  
  requestAnimationFrame(updateUI);
}

// Show game over screen
function showGameOver() {
  if (gameUI) gameUI.style.display = 'none';
  if (gameOver) gameOver.style.display = 'block';
  
  // Update final stats
  if (finalScoreElement) finalScoreElement.textContent = Math.floor(game.player.score);
  if (finalLevelElement) finalLevelElement.textContent = game.player.level;
  
  // Calculate time survived
  const timeSurvived = Math.floor((Date.now() - gameStartTime) / 1000);
  const minutes = Math.floor(timeSurvived / 60);
  const seconds = timeSurvived % 60;
  if (timeSurvivedElement) timeSurvivedElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  
  // Update players eaten
  if (playersEatenElement) playersEatenElement.textContent = playersEaten;
  
  // Stop game
  game.stop();
}

// Toggle pause menu
function togglePause() {
  if (!game) return;
  
  game.isPaused = !game.isPaused;
  
  if (pauseMenu) {
    if (game.isPaused) {
      pauseMenu.style.display = 'block';
    } else {
      pauseMenu.style.display = 'none';
    }
  }
}

// Format time as MM:SS
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Track when player eats another player
function trackPlayerEaten() {
  if (!game || !game.player || !scoreElement) return;
  
  // Create a MutationObserver to watch for changes in the player's score
  const scoreObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'characterData') {
        const newScore = parseInt(mutation.target.textContent);
        const oldScore = parseInt(mutation.oldValue || 0);
        
        // If score increased significantly, assume a player was eaten
        if (newScore - oldScore > 100) {
          playersEaten++;
        }
      }
    });
  });
  
  // Start observing the score element
  scoreObserver.observe(scoreElement, { 
    characterData: true,
    subtree: true,
    characterDataOldValue: true
  });
}

// Check if all required elements exist
function checkRequiredElements() {
  const requiredElements = [
    { name: 'Canvas', element: canvas },
    { name: 'Start Screen', element: startScreen },
    { name: 'Game UI', element: gameUI },
    { name: 'Game Over Screen', element: gameOver },
    { name: 'Start Button', element: startButton }
  ];
  
  let missingElements = requiredElements.filter(item => !item.element);
  
  if (missingElements.length > 0) {
    console.error('Missing required DOM elements:');
    missingElements.forEach(item => {
      console.error(`- ${item.name} is missing`);
    });
    return false;
  }
  
  return true;
}

// Event listeners
window.addEventListener('resize', resizeCanvas);

// Add event listeners only if elements exist
if (startButton) {
  startButton.addEventListener('click', () => {
    if (checkRequiredElements()) {
      initGame();
      trackPlayerEaten();
    } else {
      console.error('Cannot start game: missing required elements');
      alert('Error: Some required elements are missing. Check the console for details.');
    }
  });
}

if (restartButton) {
  restartButton.addEventListener('click', () => {
    if (game) game.stop();
    if (startScreen) startScreen.style.display = 'block';
    if (gameUI) gameUI.style.display = 'none';
  });
}

if (pauseButton) {
  pauseButton.addEventListener('click', togglePause);
}

if (resumeButton) {
  resumeButton.addEventListener('click', togglePause);
}

if (quitButton) {
  quitButton.addEventListener('click', () => {
    if (game) game.stop();
    if (startScreen) startScreen.style.display = 'block';
    if (pauseMenu) pauseMenu.style.display = 'none';
    if (gameUI) gameUI.style.display = 'none';
  });
}

if (playAgainButton) {
  playAgainButton.addEventListener('click', () => {
    if (gameOver) gameOver.style.display = 'none';
    if (startScreen) startScreen.style.display = 'block';
  });
}

// Color selection
if (colorOptions && colorOptions.length > 0) {
  colorOptions.forEach(option => {
    if (option) {
      option.addEventListener('click', () => {
        colorOptions.forEach(opt => {
          if (opt) opt.classList.remove('selected');
        });
        option.classList.add('selected');
      });
    }
  });
}

// Game mode selection
if (gameModes && gameModes.length > 0) {
  gameModes.forEach(mode => {
    if (mode) {
      mode.addEventListener('click', () => {
        gameModes.forEach(m => {
          if (m) m.classList.remove('selected');
        });
        mode.classList.add('selected');
        selectedGameMode = mode.dataset.mode;
      });
    }
  });
}

// Audio settings
if (soundToggle) {
  soundToggle.addEventListener('change', () => {
    if (game) {
      game.soundManager.soundEnabled = soundToggle.checked;
    }
  });
}

if (musicToggle) {
  musicToggle.addEventListener('change', () => {
    if (game) {
      game.soundManager.musicEnabled = musicToggle.checked;
      
      if (game.soundManager.musicEnabled) {
        game.soundManager.playBackgroundMusic();
      } else {
        game.soundManager.stopBackgroundMusic();
      }
    }
  });
}

if (soundVolumeSlider) {
  soundVolumeSlider.addEventListener('input', () => {
    if (game) {
      game.soundManager.setVolume(soundVolumeSlider.value / 100);
    }
  });
}

if (musicVolumeSlider) {
  musicVolumeSlider.addEventListener('input', () => {
    if (game) {
      game.soundManager.setMusicVolume(musicVolumeSlider.value / 100);
    }
  });
}

// Keyboard shortcuts for pause
document.addEventListener('keydown', (e) => {
  if (e.key === 'p' || e.key === 'P') {
    togglePause();
  }
});

// Select first color by default
if (colorOptions && colorOptions.length > 0 && colorOptions[0]) {
  colorOptions[0].classList.add('selected');
}

// Log initialization status
console.log('Game initialization ready. Required elements check:', checkRequiredElements());

// Initialize canvas size
resizeCanvas();
