import { Game } from './game.js';
import { Player } from './player.js';
import { setupControls } from './controls.js';
import { Tutorial } from './tutorial.js';
import { Achievements } from './achievements.js';
import { Storage } from './storage.js';
import { Leaderboard } from './leaderboard.js';
import { Skins } from './skins.js';

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
const loadingScreen = document.getElementById('loading-screen');
const loadingBarFill = document.querySelector('.loading-bar-fill');
const loadingText = document.querySelector('.loading-text');

// Game instance
let game = null;
let gameStartTime = 0;
let playersEaten = 0;
let selectedGameMode = 'classic';
let selectedSkin = 'default';
let tutorial = null;
let storage = null;
let achievements = null;
let leaderboard = null;
let skins = null;

// Initialize the application
function init() {
  // Create storage instance
  storage = new Storage();
  
  // Load saved settings
  loadSavedSettings();
  
  // Create leaderboard
  leaderboard = new Leaderboard();
  
  // Create skins manager
  skins = new Skins();
  
  // Set canvas size
  resizeCanvas();
  
  // Add event listeners
  setupEventListeners();
  
  // Show loading screen
  showLoadingScreen();
  
  // Simulate loading progress
  simulateLoading().then(() => {
    // Hide loading screen and show start screen
    hideLoadingScreen();
    showStartScreen();
    
    // Check for URL parameters
    checkUrlParameters();
    
    // Initialize skins
    initializeSkins();
    
    // Show tutorial for first-time players
    if (storage.isFirstTime()) {
      showWelcomeMessage();
    }
    
    // Load leaderboard data
    leaderboard.loadLeaderboard();
    
    // Update UI
    updateStartScreenUI();
  });
}

// Simulate loading process
function simulateLoading() {
  return new Promise((resolve) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      if (loadingBarFill) {
        loadingBarFill.style.width = `${progress}%`;
      }
      
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(resolve, 500); // Add a small delay at 100%
      }
    }, 100);
    
    // Update loading text
    if (loadingText) {
      loadingText.textContent = 'Loading game assets...';
      setTimeout(() => {
        if (loadingText) loadingText.textContent = 'Initializing game world...';
      }, 1500);
      setTimeout(() => {
        if (loadingText) loadingText.textContent = 'Preparing cells...';
      }, 3000);
    }
  });
}

// Show loading screen
function showLoadingScreen() {
  if (loadingScreen) {
    loadingScreen.style.display = 'flex';
  }
  if (startScreen) {
    startScreen.style.display = 'none';
  }
}

// Hide loading screen
function hideLoadingScreen() {
  if (loadingScreen) {
    loadingScreen.style.display = 'none';
  }
}

// Set canvas size
function resizeCanvas() {
  if (canvas) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (game) {
      game.width = canvas.width;
      game.height = canvas.height;
      game.updateViewport();
    }
  }
}

// Load saved settings
function loadSavedSettings() {
  const savedSettings = storage.getSettings();
  if (savedSettings) {
    // Apply saved settings
    if (savedSettings.playerName) {
      playerNameInput.value = savedSettings.playerName;
    }
    
    if (savedSettings.playerColor) {
      selectColorOption(savedSettings.playerColor);
    }
    
    if (savedSettings.gameMode) {
      selectGameMode(savedSettings.gameMode);
    }
    
    if (savedSettings.soundEnabled !== undefined && soundToggle) {
      soundToggle.checked = savedSettings.soundEnabled;
    }
    
    if (savedSettings.musicEnabled !== undefined && musicToggle) {
      musicToggle.checked = savedSettings.musicEnabled;
    }
    
    if (savedSettings.soundVolume !== undefined && soundVolumeSlider) {
      soundVolumeSlider.value = savedSettings.soundVolume * 100;
    }
    
    if (savedSettings.musicVolume !== undefined && musicVolumeSlider) {
      musicVolumeSlider.value = savedSettings.musicVolume * 100;
    }
    
    if (savedSettings.skin) {
      selectedSkin = savedSettings.skin;
    }
  }
}

// Save settings
function saveSettings() {
  const settings = {
    playerName: playerNameInput.value,
    playerColor: getSelectedColor(),
    gameMode: selectedGameMode,
    soundEnabled: soundToggle ? soundToggle.checked : true,
    musicEnabled: musicToggle ? musicToggle.checked : true,
    soundVolume: soundVolumeSlider ? soundVolumeSlider.value / 100 : 0.5,
    musicVolume: musicVolumeSlider ? musicVolumeSlider.value / 100 : 0.3,
    skin: selectedSkin
  };
  
  storage.saveSettings(settings);
}

// Initialize the game
// Correção do arquivo main.js - Função initGame
function initGame() {
  const playerName = playerNameInput?.value.trim() || 'Player';
  const selectedColor = getSelectedColor();
  
  // Save settings
  saveSettings();
  
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
  
  // Create achievements
  achievements = new Achievements(game);
  
  // Create player
  const player = new Player(playerName, selectedColor, game);
  
  // Set player skin
  player.setSkin(selectedSkin);
  
  // Set player in game
  game.setPlayer(player);
  
  // Setup controls - IMPORTANTE: Certifique-se de que isso está sendo chamado
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
  
  // Create tutorial if first time
  if (storage.isFirstTime()) {
    tutorial = new Tutorial(game);
    tutorial.start();
  }
  
  // Start game loop
  game.start();
  
  // Update UI
  updateUI();
  
  // Track player eaten events
  trackPlayerEaten();
  
  // Adicionar log para debug
  console.log("Game initialized, player position:", player.x, player.y);
  console.log("Player target:", player.targetX, player.targetY);
}


// Update game UI (score, leaderboard)
function updateUI() {
  if (!game || !game.player) return;
  
  // Update score and level
  if (scoreElement) scoreElement.textContent = Math.floor(game.player.score);
  if (levelElement) levelElement.textContent = game.player.level;
  if (xpElement) xpElement.textContent = Math.floor(game.player.experience);
  if (nextLevelXpElement) nextLevelXpElement.textContent = game.player.experienceToNextLevel;
  
  // Update XP bar
  const xpBarFill = document.querySelector('.xp-bar-fill');
  if (xpBarFill) {
    const xpPercentage = (game.player.experience / game.player.experienceToNextLevel) * 100;
    xpBarFill.style.width = `${xpPercentage}%`;
  }
  
  // Update leaderboard
  if (leaderboardElement) {
    const leaders = game.getLeaderboard();
    leaderboardElement.innerHTML = '';
    
    leaders.forEach((leader, index) => {
      const li = document.createElement('li');
      
      // Add team indicator in team mode
      let teamIndicator = '';
      if (game.gameMode === 'teams' && leader.team) {
        teamIndicator = `<span class="team-indicator" style="color: ${game.getTeamColor(leader.team)}">■</span> `;
      }
      
      li.innerHTML = `${teamIndicator}${leader.name}: ${Math.floor(leader.score)}`;
      
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
  if (playersEatenElement) playersEatenElement.textContent = game.player.stats.playersEaten;
  
  // Save game stats
  saveGameStats(timeSurvived);
  
  // Submit score to leaderboard
  leaderboard.submitScore(game.player.name, Math.floor(game.player.score));
  
  // Stop game
  game.stop();
}

// Save game stats
function saveGameStats(timeSurvived) {
  if (!game || !game.player) return;
  
  const stats = {
    score: Math.floor(game.player.score),
    level: game.player.level,
    playTime: timeSurvived,
    foodEaten: game.player.stats.foodEaten,
    playersEaten: game.player.stats.playersEaten,
    maxSize: Math.floor(game.player.stats.maxSize),
    date: new Date().toISOString()
  };
  
  storage.saveGameStats(stats);
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
  if (!game || !game.player) return;
  
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
  if (scoreElement) {
    scoreObserver.observe(scoreElement, { 
      characterData: true,
      subtree: true,
      characterDataOldValue: true
    });
  }
}

// Show start screen
function showStartScreen() {
  if (startScreen) startScreen.style.display = 'block';
  if (gameUI) gameUI.style.display = 'none';
  if (gameOver) gameOver.style.display = 'none';
  if (pauseMenu) pauseMenu.style.display = 'none';
  
  // Update start screen UI
  updateStartScreenUI();
}

// Update start screen UI
function updateStartScreenUI() {
  // Update player stats display
  const playerStats = storage.getPlayerStats();
  if (playerStats) {
    const statsContainer = document.getElementById('player-stats');
    if (statsContainer) {
      statsContainer.innerHTML = `
        <div class="stat">High Score: ${playerStats.highScore || 0}</div>
        <div class="stat">Games Played: ${playerStats.gamesPlayed || 0}</div>
        <div class="stat">Highest Level: ${playerStats.highestLevel || 1}</div>
      `;
    }
  }
  
  // Update available skins
  updateSkinSelector();
}

// Initialize skins
function initializeSkins() {
  // Create skin selector if it doesn't exist
  let skinSelector = document.getElementById('skin-selector');
  if (!skinSelector && startScreen) {
    const skinContainer = document.createElement('div');
    skinContainer.className = 'skin-container';
    skinContainer.innerHTML = `
      <h3>Choose Skin</h3>
      <div id="skin-selector" class="skin-options"></div>
    `;
    
    // Insert after color picker
    const colorPicker = document.querySelector('.color-picker');
    if (colorPicker) {
      colorPicker.parentNode.insertBefore(skinContainer, colorPicker.nextSibling);
    } else {
      startScreen.querySelector('.player-settings').appendChild(skinContainer);
    }
    
    skinSelector = document.getElementById('skin-selector');
  }
  
  // Update skin selector
  updateSkinSelector();
}

// Update skin selector
function updateSkinSelector() {
  const skinSelector = document.getElementById('skin-selector');
  if (!skinSelector || !skins) return;
  
  // Clear existing skins
  skinSelector.innerHTML = '';
  
  // Get available skins
  const availableSkins = skins.getAvailableSkins();
  
  // Add skins to selector
  availableSkins.forEach(skin => {
    const skinElement = document.createElement('div');
    skinElement.className = 'skin-option';
    if (skin.id === selectedSkin) {
      skinElement.className += ' selected';
    }
    
    skinElement.dataset.skin = skin.id;
    
    // Create skin preview
    const preview = document.createElement('div');
    preview.className = 'skin-preview';
    preview.style.backgroundColor = getSelectedColor();
    
    // Add skin pattern or image
    if (skin.pattern) {
      preview.style.backgroundImage = `url(${skin.pattern})`;
      preview.style.backgroundSize = 'cover';
    }
    
    // Add skin name
    const name = document.createElement('div');
    name.className = 'skin-name';
    name.textContent = skin.name;
    
    skinElement.appendChild(preview);
    skinElement.appendChild(name);
    
    // Add locked overlay if skin is locked
    if (skin.locked) {
      const lockedOverlay = document.createElement('div');
      lockedOverlay.className = 'locked-overlay';
      lockedOverlay.innerHTML = '<i class="lock-icon">🔒</i>';
      skinElement.appendChild(lockedOverlay);
      
      // Add unlock condition tooltip
      skinElement.title = `Unlock: ${skin.unlockCondition}`;
    }
    
    // Add click event
    skinElement.addEventListener('click', () => {
      if (!skin.locked) {
        selectSkin(skin.id);
      } else {
        showUnlockMessage(skin);
      }
    });
    
    skinSelector.appendChild(skinElement);
  });
}

// Select skin
function selectSkin(skinId) {
  selectedSkin = skinId;
  
  // Update selected skin in UI
  const skinOptions = document.querySelectorAll('.skin-option');
  skinOptions.forEach(option => {
    if (option.dataset.skin === skinId) {
      option.classList.add('selected');
    } else {
      option.classList.remove('selected');
    }
  });
  
  // Update skin previews with current color
  updateSkinPreviews();
}

// Update skin previews with current color
function updateSkinPreviews() {
  const skinPreviews = document.querySelectorAll('.skin-preview');
  const currentColor = getSelectedColor();
  
  skinPreviews.forEach(preview => {
    preview.style.backgroundColor = currentColor;
  });
}

// Show unlock message for locked skins
function showUnlockMessage(skin) {
  const message = document.createElement('div');
  message.className = 'unlock-message';
  message.innerHTML = `
    <div class="unlock-content">
      <h3>Skin Locked</h3>
      <p>${skin.unlockCondition}</p>
      <button class="close-button">OK</button>
    </div>
  `;
  
  // Add close button functionality
  message.querySelector('.close-button').addEventListener('click', () => {
    document.body.removeChild(message);
  });
  
  document.body.appendChild(message);
}

// Show welcome message for first-time players
function showWelcomeMessage() {
  const message = document.createElement('div');
  message.className = 'welcome-message';
  message.innerHTML = `
    <div class="welcome-content">
      <h2>Welcome to Cytosis.io!</h2>
      <p>Eat smaller cells and food to grow, avoid larger cells, and become the biggest cell in the game!</p>
      <p>Would you like to play the tutorial?</p>
      <div class="welcome-buttons">
        <button class="tutorial-button">Play Tutorial</button>
        <button class="skip-button">Skip Tutorial</button>
      </div>
    </div>
  `;
  
  // Add button functionality
  message.querySelector('.tutorial-button').addEventListener('click', () => {
    document.body.removeChild(message);
    storage.setTutorialSeen(false); // Will show tutorial when game starts
  });
  
  message.querySelector('.skip-button').addEventListener('click', () => {
    document.body.removeChild(message);
    storage.setTutorialSeen(true); // Skip tutorial
  });
  
  document.body.appendChild(message);
}

// Get selected color
function getSelectedColor() {
  const selectedColorElement = document.querySelector('.color-option.selected');
  return selectedColorElement?.dataset.color || '#ff5252';
}

// Select color option
function selectColorOption(color) {
  colorOptions.forEach(option => {
    if (option.dataset.color === color) {
      option.classList.add('selected');
    } else {
      option.classList.remove('selected');
    }
  });
  
  // Update skin previews with new color
  updateSkinPreviews();
}

// Select game mode
function selectGameMode(mode) {
  selectedGameMode = mode;
  
  gameModes.forEach(modeElement => {
    if (modeElement.dataset.mode === mode) {
      modeElement.classList.add('selected');
    } else {
      modeElement.classList.remove('selected');
    }
  });
}

// Check URL parameters
function checkUrlParameters() {
  const urlParams = new URLSearchParams(window.location.search);
  
  // Check for game mode
  const modeParam = urlParams.get('mode');
  if (modeParam && ['classic', 'battle-royale', 'teams'].includes(modeParam)) {
    selectGameMode(modeParam);
  }
  
  // Check for player name
  const nameParam = urlParams.get('name');
  if (nameParam && playerNameInput) {
    playerNameInput.value = nameParam.substring(0, 15); // Limit to 15 chars
  }
  
  // Check for color
  const colorParam = urlParams.get('color');
  if (colorParam && colorParam.match(/^#[0-9A-F]{6}$/i)) {
    selectColorOption(colorParam);
  }
  
  // Check for skin
  const skinParam = urlParams.get('skin');
  if (skinParam) {
    selectedSkin = skinParam;
  }
}

// Setup event listeners
function setupEventListeners() {
  // Window resize
  window.addEventListener('resize', resizeCanvas);
  
  // Start button
  if (startButton) {
    startButton.addEventListener('click', () => {
      if (checkRequiredElements()) {
        initGame();
      } else {
        console.error('Cannot start game: missing required elements');
        alert('Error: Some required elements are missing. Check the console for details.');
      }
    });
  }
  
  // Restart button
  if (restartButton) {
    restartButton.addEventListener('click', () => {
      if (game) game.stop();
      showStartScreen();
    });
  }
  
  // Pause button
  if (pauseButton) {
    pauseButton.addEventListener('click', togglePause);
  }
  
  // Resume button
  if (resumeButton) {
    resumeButton.addEventListener('click', togglePause);
  }
  
  // Quit button
  if (quitButton) {
    quitButton.addEventListener('click', () => {
      if (game) game.stop();
      showStartScreen();
    });
  }
  
  // Play again button
  if (playAgainButton) {
    playAgainButton.addEventListener('click', () => {
      if (gameOver) gameOver.style.display = 'none';
      showStartScreen();
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
          
          // Update skin previews with new color
          updateSkinPreviews();
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
      saveSettings();
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
      saveSettings();
    });
  }
  
  if (soundVolumeSlider) {
    soundVolumeSlider.addEventListener('input', () => {
      if (game) {
        game.soundManager.setVolume(soundVolumeSlider.value / 100);
      }
      saveSettings();
    });
  }
  
  if (musicVolumeSlider) {
    musicVolumeSlider.addEventListener('input', () => {
      if (game) {
        game.soundManager.setMusicVolume(musicVolumeSlider.value / 100);
      }
      saveSettings();
    });
  }
  
  // Keyboard shortcuts for pause
  document.addEventListener('keydown', (e) => {
    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
      if (game && !game.isGameOver) {
        togglePause();
      }
    }
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

// Select first color by default
if (colorOptions && colorOptions.length > 0 && colorOptions[0]) {
  colorOptions[0].classList.add('selected');
}

// Initialize the application
document.addEventListener('DOMContentLoaded', init);

// Add Game.prototype.getLeaderboard method if it doesn't exist
if (typeof Game !== 'undefined' && Game.prototype && !Game.prototype.getLeaderboard) {
  Game.prototype.getLeaderboard = function() {
    const leaders = [];
    
    // Add player if not dead
    if (this.player && !this.player.isDead) {
      leaders.push({
        id: 'player',
        name: this.player.name,
        score: this.player.score,
        team: this.player.team
      });
    }
    
    // Add AI players
    this.ais.forEach(ai => {
      if (!ai.isDead) {
        leaders.push({
          id: ai.id,
          name: ai.name,
          score: ai.score,
          team: ai.team
        });
      }
    });
    
    // Sort by score (descending)
    leaders.sort((a, b) => b.score - a.score);
    
    // Return top 10
    return leaders.slice(0, 10);
  };
}

// Add Game.prototype.updateViewport method if it doesn't exist
if (typeof Game !== 'undefined' && Game.prototype && !Game.prototype.updateViewport) {
  Game.prototype.updateViewport = function() {
    if (this.canvas) {
      this.width = this.canvas.width;
      this.height = this.canvas.height;
    }
  };
}

// Add Game.prototype.showAnnouncement method if it doesn't exist
if (typeof Game !== 'undefined' && Game.prototype && !Game.prototype.showAnnouncement) {
  Game.prototype.showAnnouncement = function(message, duration = 3000) {
    const announcementElement = document.getElementById('game-announcement');
    if (!announcementElement) return;
    
    // Set message
    announcementElement.textContent = message;
    
    // Show announcement
    announcementElement.style.opacity = '1';
    
    // Hide after duration
    setTimeout(() => {
      announcementElement.style.opacity = '0';
    }, duration);
  };
}

// Add missing methods to Game.prototype if needed
if (typeof Game !== 'undefined' && Game.prototype) {
  // Add getTeamColor method if it doesn't exist
  if (!Game.prototype.getTeamColor) {
    Game.prototype.getTeamColor = function(teamName) {
      if (this.teams && this.teams[teamName] && this.teams[teamName].color) {
        return this.teams[teamName].color;
      }
      return '#ffffff'; // Default white
    };
  }
}

// Create a game announcement element if it doesn't exist
document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('game-announcement')) {
    const announcementElement = document.createElement('div');
    announcementElement.id = 'game-announcement';
    document.getElementById('game-container').appendChild(announcementElement);
  }
  
  // Create minimap container if it doesn't exist
  if (!document.getElementById('minimap-container')) {
    const minimapContainer = document.createElement('div');
    minimapContainer.id = 'minimap-container';
    document.getElementById('game-container').appendChild(minimapContainer);
  }
  
  // Create power-up indicators container if it doesn't exist
  if (!document.getElementById('power-up-indicators')) {
    const powerUpIndicators = document.createElement('div');
    powerUpIndicators.id = 'power-up-indicators';
    document.getElementById('game-ui').appendChild(powerUpIndicators);
  }
});
