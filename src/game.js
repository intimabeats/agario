import { Food } from './food.js';
import { AI } from './ai.js';
import { Virus } from './virus.js';
import { PowerUp } from './powerup.js';
import { ParticleSystem } from './particles.js';
import { SoundManager } from './sound.js';
import { MiniMap } from './minimap.js';
import { Storage } from './storage.js';
import { Achievements } from './achievements.js';
import { Skins } from './skins.js';
import { Leaderboard } from './leaderboard.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;
    
    // Game properties
    this.player = null;
    this.foods = [];
    this.ais = [];
    this.viruses = [];
    this.powerUps = [];
    this.isGameOver = false;
    this.isPaused = false;
    this.gameTime = 0;
    this.lastUpdateTime = Date.now();
    this.frameCount = 0;
    this.fps = 0;
    this.fpsUpdateTime = 0;
    this.targetFPS = 60;
    this.frameInterval = 1000 / this.targetFPS;
    this.accumulator = 0;
    
    // World properties
    this.worldSize = 6000;
    this.gridSize = 50;
    this.camera = { x: 0, y: 0, scale: 1 };
    this.cameraSmoothing = 0.1; // Camera smoothing factor
    this.cameraBounds = {
      minX: 0,
      minY: 0,
      maxX: this.worldSize,
      maxY: this.worldSize
    };
    
    // Game settings
    this.foodCount = 1000;
    this.aiCount = 20;
    this.virusCount = 25;
    this.powerUpCount = 12;
    this.maxCellsPerPlayer = 16;
    this.maxMass = 10000; // Maximum mass a cell can have
    
    // Physics settings
    this.cellCollisionElasticity = 0.7;
    this.cellRepulsionForce = 0.05;
    this.foodAttractionRadius = 5;
    this.timeScale = 1.0; // For slow-motion effects
    
    // Visual effects
    this.particles = new ParticleSystem(this);
    this.backgroundPattern = this.createBackgroundPattern();
    this.miniMap = new MiniMap(this);
    
    // Sound effects
    this.soundManager = new SoundManager();
    
    // Game stats
    this.stats = {
      fps: 0,
      frameCount: 0,
      lastFpsUpdate: 0,
      entitiesRendered: 0,
      collisionsChecked: 0,
      updateTime: 0,
      renderTime: 0,
      physicsTime: 0,
      aiTime: 0
    };
    
    // Animation frame
    this.animationId = null;
    this.lastFrameTime = 0;
    
    // Game modes
    this.gameMode = 'classic'; // classic, battle-royale, teams
    this.battleRoyaleState = {
      active: false,
      safeZoneRadius: this.worldSize / 2,
      safeZoneX: this.worldSize / 2,
      safeZoneY: this.worldSize / 2,
      shrinkStartTime: 0,
      shrinkDuration: 60000, // 1 minute
      minRadius: 500,
      damagePerSecond: 5,
      warningTime: 10000, // 10 seconds warning before shrink
      isWarning: false,
      nextShrinkTime: 0
    };
    
    // Teams
    this.teams = {
      red: { score: 0, players: [], color: '#ff5252' },
      blue: { score: 0, players: [], color: '#2196f3' },
      green: { score: 0, players: [], color: '#4caf50' }
    };
    
    // Spatial partitioning for collision detection optimization
    this.gridCellSize = 200; // Size of each grid cell
    this.spatialGrid = {}; // Will store entities by grid cell
    
    // Performance optimization
    this.lastFoodGenerationTime = 0;
    this.foodGenerationInterval = 100; // Generate food in batches every 100ms
    this.visibleEntities = {
      foods: [],
      ais: [],
      viruses: [],
      powerUps: []
    };
    
    // Entity removal queues to avoid modification during iteration
    this.removalQueues = {
      foods: [],
      viruses: [],
      powerUps: [],
      ais: []
    };
    
    // Game balance settings
    this.balanceSettings = {
      // AI settings
      aiBaseSpeed: 4.5,
      aiAggressionMultiplier: 1.2,
      aiSpawnRate: 1.0,
      
      // Player settings
      playerBaseSpeed: 6.5,
      playerSplitVelocity: 18,
      playerEjectSpeed: 35,
      playerGrowthRate: 1.5,
      playerShrinkRate: 0.005,
      
      // Food settings
      foodValue: 1.0,
      foodSpawnRate: 1.0,
      foodMaxSize: 12,
      
      // Virus settings
      virusSpawnRate: 1.0,
      virusSplitForce: 1.0,
      virusMaxCount: 25,
      
      // Power-up settings
      powerUpSpawnRate: 1.0,
      powerUpDuration: 1.0,
      powerUpMaxCount: 12,
      
      // Physics settings
      frictionCoefficient: 0.02,
      elasticityCoefficient: 0.7,
      
      // Game difficulty
      difficultyLevel: 2, // 1-5, affects AI behavior and spawn rates
      
      // Experience and leveling
      expMultiplier: 1.0,
      levelUpRequirement: 1000
    };
    
    // Difficulty presets
    this.difficultyPresets = {
      easy: {
        aiAggressionMultiplier: 0.8,
        aiSpawnRate: 0.7,
        playerGrowthRate: 1.8,
        playerShrinkRate: 0.003,
        expMultiplier: 1.2
      },
      normal: {
        aiAggressionMultiplier: 1.2,
        aiSpawnRate: 1.0,
        playerGrowthRate: 1.5,
        playerShrinkRate: 0.005,
        expMultiplier: 1.0
      },
      hard: {
        aiAggressionMultiplier: 1.5,
        aiSpawnRate: 1.3,
        playerGrowthRate: 1.2,
        playerShrinkRate: 0.007,
        expMultiplier: 0.8
      }
    };
    
    // Initialize additional systems
    this.storage = new Storage();
    this.achievements = new Achievements(this);
    this.skins = new Skins();
    this.leaderboard = new Leaderboard();
    
    // Load saved settings
    this.loadSettings();
    
    // Debug mode
    this.debugMode = false;
    
    // Mobile detection
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Event listeners
    this.setupEventListeners();
  }
  
  createBackgroundPattern() {
    // Create an off-screen canvas for the pattern
    const patternCanvas = document.createElement('canvas');
    const patternContext = patternCanvas.getContext('2d');
    
    // Set pattern size
    patternCanvas.width = this.gridSize * 2;
    patternCanvas.height = this.gridSize * 2;
    
    // Draw pattern
    patternContext.fillStyle = '#f8f8f8';
    patternContext.fillRect(0, 0, patternCanvas.width, patternCanvas.height);
    
    // Draw grid lines
    patternContext.strokeStyle = '#e0e0e0';
    patternContext.lineWidth = 1;
    
    // Vertical lines
    patternContext.beginPath();
    patternContext.moveTo(this.gridSize, 0);
    patternContext.lineTo(this.gridSize, patternCanvas.height);
    patternContext.stroke();
    
    // Horizontal lines
    patternContext.beginPath();
    patternContext.moveTo(0, this.gridSize);
    patternContext.lineTo(patternCanvas.width, this.gridSize);
    patternContext.stroke();
    
    // Create pattern from canvas
    return this.ctx.createPattern(patternCanvas, 'repeat');
  }
  
  setupEventListeners() {
    // Listen for visibility change to pause game when tab is inactive
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && !this.isGameOver) {
        this.isPaused = true;
        const pauseMenu = document.getElementById('pause-menu');
        if (pauseMenu) {
          pauseMenu.style.display = 'block';
        }
      }
    });
    
    // Listen for resize events
    window.addEventListener('resize', () => {
      this.updateViewport();
    });
    
    // Listen for fullscreen change
    document.addEventListener('fullscreenchange', () => {
      this.updateViewport();
    });
    
    // Custom event for game state changes
    this.canvas.addEventListener('gameStateChange', (e) => {
      if (e.detail && e.detail.type === 'gameOver') {
        this.handleGameOver(e.detail.data);
      }
    });
  }
  
  loadSettings() {
    const savedSettings = this.storage.getSettings();
    if (savedSettings) {
      // Apply saved settings
      if (savedSettings.soundEnabled !== undefined) {
        this.soundManager.soundEnabled = savedSettings.soundEnabled;
      }
      if (savedSettings.musicEnabled !== undefined) {
        this.soundManager.musicEnabled = savedSettings.musicEnabled;
      }
      if (savedSettings.soundVolume !== undefined) {
        this.soundManager.setVolume(savedSettings.soundVolume);
      }
      if (savedSettings.musicVolume !== undefined) {
        this.soundManager.setMusicVolume(savedSettings.musicVolume);
      }
      if (savedSettings.difficulty !== undefined) {
        this.setDifficulty(savedSettings.difficulty);
      }
    }
  }
  
  saveSettings() {
    const settings = {
      soundEnabled: this.soundManager.soundEnabled,
      musicEnabled: this.soundManager.musicEnabled,
      soundVolume: this.soundManager.volume,
      musicVolume: this.soundManager.musicVolume,
      difficulty: this.balanceSettings.difficultyLevel
    };
    this.storage.saveSettings(settings);
  }
  
  setDifficulty(level) {
    let preset;
    switch(level) {
      case 1:
        preset = this.difficultyPresets.easy;
        break;
      case 3:
        preset = this.difficultyPresets.hard;
        break;
      case 2:
      default:
        preset = this.difficultyPresets.normal;
        break;
    }
    
    this.balanceSettings.difficultyLevel = level;
    this.balanceSettings.aiAggressionMultiplier = preset.aiAggressionMultiplier;
    this.balanceSettings.aiSpawnRate = preset.aiSpawnRate;
    this.balanceSettings.playerGrowthRate = preset.playerGrowthRate;
    this.balanceSettings.playerShrinkRate = preset.playerShrinkRate;
    this.balanceSettings.expMultiplier = preset.expMultiplier;
    
    // Apply to existing entities
    this.applyBalanceSettings();
  }
  
  applyBalanceSettings() {
    // Apply to player if exists
    if (this.player) {
      this.player.baseSpeed = this.balanceSettings.playerBaseSpeed;
      this.player.splitVelocity = this.balanceSettings.playerSplitVelocity;
      this.player.ejectSpeed = this.balanceSettings.playerEjectSpeed;
      this.player.growthRate = this.balanceSettings.playerGrowthRate;
      this.player.shrinkRate = this.balanceSettings.playerShrinkRate;
    }
    
    // Apply to AIs
    this.ais.forEach(ai => {
      ai.baseSpeed = this.balanceSettings.aiBaseSpeed;
      ai.personality.aggression *= this.balanceSettings.aiAggressionMultiplier;
    });
  }
  
setPlayer(player) {
  if (!player) {
    console.error("Cannot set null player");
    return;
  }
  
  this.player = player;
  
  // Ensure player's initial position is valid and centered in the world
  player.x = this.worldSize / 2;
  player.y = this.worldSize / 2;
  player.targetX = player.x;
  player.targetY = player.y;
  
  // Initialize player's cells with correct position
  if (!player.cells || player.cells.length === 0) {
    player.cells = [{
      x: player.x,
      y: player.y,
      radius: player.baseRadius,
      mass: Math.PI * player.baseRadius * player.baseRadius,
      velocityX: 0,
      velocityY: 0,
      membrane: {
        points: 20,
        elasticity: 0.3,
        distortion: 0.15,
        oscillation: 0.05,
        oscillationSpeed: 1.5,
        phase: Math.random() * Math.PI * 2,
        vertices: []
      },
      z: 0,
      id: 'cell-' + Date.now() + '-0',
      effects: []
    }];
  } else {
    // Update all cells with the correct position
    player.cells.forEach(cell => {
      cell.x = player.x;
      cell.y = player.y;
    });
  }
  
  // Initialize the cell membrane
  if (typeof player.initCellMembranes === 'function') {
    player.initCellMembranes();
  }
  
  // Center camera on player
  this.centerCamera();
  
  // Add player to team in team mode
  if (this.gameMode === 'teams') {
    const teamNames = Object.keys(this.teams);
    const teamName = teamNames[Math.floor(Math.random() * teamNames.length)];
    this.teams[teamName].players.push(player);
    player.team = teamName;
    player.color = this.getTeamColor(teamName);
  }
  
  // Apply balance settings to player
  player.baseSpeed = this.balanceSettings.playerBaseSpeed;
  player.splitVelocity = this.balanceSettings.playerSplitVelocity;
  player.ejectSpeed = this.balanceSettings.playerEjectSpeed;
  player.growthRate = this.balanceSettings.playerGrowthRate;
  player.shrinkRate = this.balanceSettings.playerShrinkRate;
  
  // Initialize player achievements
  if (this.achievements) {
    this.achievements.initPlayer(player);
  }
  
  console.log("Player set in game:", player.x, player.y, "Target:", player.targetX, player.targetY);
  console.log("Cell coordinates:", JSON.stringify(player.cells[0]));
}
  
  getTeamColor(teamName) {
    return this.teams[teamName]?.color || '#ffffff';
  }
  
  start() {
    this.generateWorld();
    this.lastUpdateTime = Date.now();
    this.lastFrameTime = performance.now();
    this.gameLoop();
    this.soundManager.playBackgroundMusic();
    
    // Show tutorial for new players
    if (this.storage.isFirstTime()) {
      this.showTutorial();
    }
    
    // Trigger game start event
    const event = new CustomEvent('gameStart', { detail: { gameMode: this.gameMode } });
    this.canvas.dispatchEvent(event);
  }
  
  showTutorial() {
    // Implementation will be in tutorial.js
    const tutorialElement = document.getElementById('tutorial');
    if (tutorialElement) {
      tutorialElement.style.display = 'block';
    }
  }
  
  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.soundManager.stopBackgroundMusic();
    
    // Save game stats
    this.saveGameStats();
    
    // Trigger game end event
    const event = new CustomEvent('gameEnd', { 
      detail: { 
        score: this.player ? this.player.score : 0,
        level: this.player ? this.player.level : 1,
        gameTime: this.gameTime
      } 
    });
    this.canvas.dispatchEvent(event);
  }
  saveGameStats() {
    if (!this.player) return;
    
    const stats = {
      score: Math.floor(this.player.score),
      level: this.player.level,
      playTime: this.gameTime,
      foodEaten: this.player.stats.foodEaten,
      playersEaten: this.player.stats.playersEaten,
      maxSize: Math.floor(this.player.stats.maxSize),
      date: new Date().toISOString()
    };
    
    this.storage.saveGameStats(stats);
    this.leaderboard.submitScore(this.player.name, Math.floor(this.player.score));
  }
  
  generateWorld() {
    // Generate food
    for (let i = 0; i < this.foodCount; i++) {
      this.foods.push(new Food(
        Math.random() * this.worldSize,
        Math.random() * this.worldSize,
        this
      ));
    }
    
    // Generate AI players
    for (let i = 0; i < this.aiCount; i++) {
      const ai = new AI(
        `Bot ${i + 1}`,
        this.getRandomColor(),
        this
      );
      
      // Apply balance settings
      ai.baseSpeed = this.balanceSettings.aiBaseSpeed;
      ai.personality.aggression *= this.balanceSettings.aiAggressionMultiplier;
      
      // Assign team in team mode
      if (this.gameMode === 'teams') {
        const teamNames = Object.keys(this.teams);
        const teamName = teamNames[Math.floor(Math.random() * teamNames.length)];
        this.teams[teamName].players.push(ai);
        ai.team = teamName;
        ai.color = this.getTeamColor(teamName);
      }
      
      this.ais.push(ai);
    }
    
    // Generate viruses
    for (let i = 0; i < this.virusCount; i++) {
      this.viruses.push(new Virus(
        Math.random() * this.worldSize,
        Math.random() * this.worldSize,
        this
      ));
    }
    
    // Generate power-ups
    for (let i = 0; i < this.powerUpCount; i++) {
      this.powerUps.push(new PowerUp(
        Math.random() * this.worldSize,
        Math.random() * this.worldSize,
        this
      ));
    }
  }
  
  getRandomColor() {
    const colors = [
      '#ff5252', // Red
      '#4caf50', // Green
      '#2196f3', // Blue
      '#ff9800', // Orange
      '#9c27b0', // Purple
      '#00bcd4', // Cyan
      '#ffeb3b', // Yellow
      '#e91e63'  // Pink
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
gameLoop(timestamp) {
  // Calculate delta time
  if (!timestamp) timestamp = performance.now();
  const deltaTime = (timestamp - this.lastFrameTime) / 1000; // Convert to seconds
  this.lastFrameTime = timestamp;
  
  // Cap delta time to prevent large jumps
  const cappedDeltaTime = Math.min(deltaTime, 0.1);
  
  // Update game time
  this.gameTime += cappedDeltaTime;
  
  // Update FPS counter
  this.frameCount++;
  if (timestamp - this.fpsUpdateTime > 1000) {
    this.fps = this.frameCount;
    this.frameCount = 0;
    this.fpsUpdateTime = timestamp;
    
    // Debug log
    if (this.debugMode) {
      console.log("FPS:", this.fps, "Player position:", this.player?.x, this.player?.y);
    }
  }
  
  // Skip update if paused
  if (this.isPaused) {
    this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
    return;
  }
  
  try {
    // Fixed time step for physics
    this.accumulator += cappedDeltaTime;
    while (this.accumulator >= 1 / this.targetFPS) {
      this.update(1 / this.targetFPS);
      this.accumulator -= 1 / this.targetFPS;
    }
    
    // Render at display refresh rate
    this.render();
    
    // Process removal queues
    this.processRemovalQueues();
    
    if (!this.isGameOver) {
      this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
    }
  } catch (error) {
    console.error("Error in game loop:", error);
    
    // Try to recover from error
    this.accumulator = 0;
    
    // Reset player position if it's the source of the error
    if (this.player && (isNaN(this.player.x) || isNaN(this.player.y))) {
      console.error("Resetting player position due to error");
      this.player.x = this.worldSize / 2;
      this.player.y = this.worldSize / 2;
      this.player.targetX = this.player.x;
      this.player.targetY = this.player.y;
      
      // Reset player cells
      if (this.player.cells && this.player.cells.length > 0) {
        this.player.cells.forEach(cell => {
          if (cell) {
            cell.x = this.player.x;
            cell.y = this.player.y;
            cell.velocityX = 0;
            cell.velocityY = 0;
          }
        });
      }
    }
    
    // Continue game loop
    if (!this.isGameOver) {
      this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
    }
  }
}
  
update(deltaTime) {
  // Scale delta time by time scale (for slow-motion effects)
  const scaledDeltaTime = deltaTime * this.timeScale;
  
  // Performance measurement
  const updateStart = performance.now();
  
  // Verificar se o jogo está inicializado corretamente
  if (!this.worldSize) {
    console.error("worldSize is undefined. Initializing with default value.");
    this.worldSize = 6000; // Valor padrão
  }
  
  // Update battle royale mode
  if (this.gameMode === 'battle-royale') {
    this.updateBattleRoyale(scaledDeltaTime);
  }
  
  // Update team scores
  if (this.gameMode === 'teams') {
    this.updateTeamScores();
  }
  
  // Update spatial grid
  this.updateSpatialGrid();
  
  // Update player
  if (this.player && !this.player.isDead) {
    const playerUpdateStart = performance.now();
    this.player.update(scaledDeltaTime);
    this.centerCamera();
    
    // Check if player is out of bounds
    this.keepEntityInBounds(this.player);
    
    // Apply battle royale damage if outside safe zone
    if (this.gameMode === 'battle-royale' && this.battleRoyaleState.active) {
      const dx = this.player.x - this.battleRoyaleState.safeZoneX;
      const dy = this.player.y - this.battleRoyaleState.safeZoneY;
      const distanceToCenter = Math.sqrt(dx * dx + dy * dy);
      
      if (distanceToCenter > this.battleRoyaleState.safeZoneRadius) {
        this.player.takeDamage(this.battleRoyaleState.damagePerSecond * scaledDeltaTime);
      }
    }
    
    // Check achievements
    if (this.achievements) {
      this.achievements.checkAchievements(this.player);
    }
    
    this.stats.playerUpdateTime = performance.now() - playerUpdateStart;
  } else if (this.player && this.player.isDead) {
    this.handleGameOver();
  }
  
  // Update AI players
  const aiUpdateStart = performance.now();
  if (this.ais && this.ais.length > 0) {
    this.ais.forEach(ai => {
      if (!ai.isDead) {
        ai.update(scaledDeltaTime);
        
        // Keep AI in bounds
        this.keepEntityInBounds(ai);
        
        // Apply battle royale damage if outside safe zone
        if (this.gameMode === 'battle-royale' && this.battleRoyaleState.active) {
          const dx = ai.x - this.battleRoyaleState.safeZoneX;
          const dy = ai.y - this.battleRoyaleState.safeZoneY;
          const distanceToCenter = Math.sqrt(dx * dx + dy * dy);
          
          if (distanceToCenter > this.battleRoyaleState.safeZoneRadius) {
            ai.takeDamage(this.battleRoyaleState.damagePerSecond * scaledDeltaTime);
          }
        }
      } else {
        // Queue dead AIs for removal
        this.removalQueues.ais.push(ai);
      }
    });
  }
  this.stats.aiTime = performance.now() - aiUpdateStart;
  
  // Update food
  if (this.foods && this.foods.length > 0) {
    this.foods.forEach(food => {
      food.update(scaledDeltaTime);
    });
  }
  
  // Update viruses
  if (this.viruses && this.viruses.length > 0) {
    this.viruses.forEach(virus => {
      virus.update(scaledDeltaTime);
    });
  }
  
  // Update power-ups
  if (this.powerUps && this.powerUps.length > 0) {
    this.powerUps.forEach(powerUp => {
      powerUp.update(scaledDeltaTime);
    });
  }
  
  // Update particles
  if (this.particles) {
    this.particles.update(scaledDeltaTime);
  }
  
  // Only add new AIs in classic mode or if battle royale hasn't started yet
  if (this.gameMode === 'classic' || 
      (this.gameMode === 'battle-royale' && !this.battleRoyaleState.active)) {
    this.replenishAIs();
  }
  
  // Replenish food in batches for better performance
  this.replenishFood();
  
  // Replenish viruses
  this.replenishViruses();
  
  // Replenish power-ups
  this.replenishPowerUps();
  
  // Check for battle royale start
  if (this.gameMode === 'battle-royale' && !this.battleRoyaleState.active && this.gameTime > 30) {
    this.startBattleRoyale();
  }
  
  // Update visible entities for rendering optimization
  this.updateVisibleEntities();
  
  // Update performance stats
  this.stats.updateTime = performance.now() - updateStart;
}
  
keepEntityInBounds(entity) {
  if (!entity) return;
  
  // Verify if worldSize is defined
  if (!this.worldSize) {
    console.error("worldSize is undefined in keepEntityInBounds. Using default value.");
    this.worldSize = 6000; // Default value
  }
  
  // Keep entity position within world bounds
  entity.x = Math.max(0, Math.min(this.worldSize, entity.x));
  entity.y = Math.max(0, Math.min(this.worldSize, entity.y));
  
  // Also keep all cells within bounds
  if (entity.cells) {
    entity.cells.forEach(cell => {
      if (!cell || !cell.radius) return;
      
      cell.x = Math.max(cell.radius, Math.min(this.worldSize - cell.radius, cell.x));
      cell.y = Math.max(cell.radius, Math.min(this.worldSize - cell.radius, cell.y));
    });
  }
}
  
  replenishAIs() {
    const aiSpawnRate = this.balanceSettings.aiSpawnRate;
    const targetAICount = Math.floor(this.aiCount * aiSpawnRate);
    
    while (this.ais.length < targetAICount) {
      const ai = new AI(
        `Bot ${Math.floor(Math.random() * 1000)}`,
        this.getRandomColor(),
        this
      );
      
      // Apply balance settings
      ai.baseSpeed = this.balanceSettings.aiBaseSpeed;
      ai.personality.aggression *= this.balanceSettings.aiAggressionMultiplier;
      
      // Assign team in team mode
      if (this.gameMode === 'teams') {
        const teamNames = Object.keys(this.teams);
        const teamName = teamNames[Math.floor(Math.random() * teamNames.length)];
        this.teams[teamName].players.push(ai);
        ai.team = teamName;
        ai.color = this.getTeamColor(teamName);
      }
      
      // Spawn AI away from player for fairness
      if (this.player && !this.player.isDead) {
        let validPosition = false;
        let attempts = 0;
        let x, y;
        
        while (!validPosition && attempts < 10) {
          x = Math.random() * this.worldSize;
          y = Math.random() * this.worldSize;
          
          const dx = x - this.player.x;
          const dy = y - this.player.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Ensure AI spawns at least 1000 units away from player
          if (distance > 1000) {
            validPosition = true;
          }
          
          attempts++;
        }
        
        if (validPosition) {
          ai.x = x;
          ai.y = y;
          ai.cells[0].x = x;
          ai.cells[0].y = y;
        }
      }
      
      this.ais.push(ai);
    }
  }
  
  replenishFood() {
    const now = Date.now();
    if (now - this.lastFoodGenerationTime > this.foodGenerationInterval) {
      this.lastFoodGenerationTime = now;
      
      const foodNeeded = this.foodCount - this.foods.length;
      const batchSize = Math.min(foodNeeded, 50); // Generate up to 50 food items at once
      
      for (let i = 0; i < batchSize; i++) {
        this.foods.push(new Food(
          Math.random() * this.worldSize,
          Math.random() * this.worldSize,
          this
        ));
      }
    }
  }
  
  replenishViruses() {
    const maxViruses = this.balanceSettings.virusMaxCount;
    const spawnRate = this.balanceSettings.virusSpawnRate;
    const targetVirusCount = Math.floor(maxViruses * spawnRate);
    
    while (this.viruses.length < targetVirusCount) {
      // Try to spawn viruses away from player
      let x = Math.random() * this.worldSize;
      let y = Math.random() * this.worldSize;
      
      if (this.player && !this.player.isDead) {
        // Try a few times to find a position away from player
        for (let i = 0; i < 5; i++) {
          const testX = Math.random() * this.worldSize;
          const testY = Math.random() * this.worldSize;
          
          const dx = testX - this.player.x;
          const dy = testY - this.player.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // If this position is farther from player, use it
          if (distance > 500) {
            x = testX;
            y = testY;
            break;
          }
        }
      }
      
      this.viruses.push(new Virus(x, y, this));
    }
  }
  
  replenishPowerUps() {
    const maxPowerUps = this.balanceSettings.powerUpMaxCount;
    const spawnRate = this.balanceSettings.powerUpSpawnRate;
    const targetPowerUpCount = Math.floor(maxPowerUps * spawnRate);
    
    while (this.powerUps.length < targetPowerUpCount) {
      this.powerUps.push(new PowerUp(
        Math.random() * this.worldSize,
        Math.random() * this.worldSize,
        this
      ));
    }
  }
  
  processRemovalQueues() {
    // Remove foods
    if (this.removalQueues.foods.length > 0) {
      this.foods = this.foods.filter(food => !this.removalQueues.foods.includes(food));
      this.removalQueues.foods = [];
    }
    
    // Remove viruses
    if (this.removalQueues.viruses.length > 0) {
      this.viruses = this.viruses.filter(virus => !this.removalQueues.viruses.includes(virus));
      this.removalQueues.viruses = [];
    }
    
    // Remove power-ups
    if (this.removalQueues.powerUps.length > 0) {
      this.powerUps = this.powerUps.filter(powerUp => !this.removalQueues.powerUps.includes(powerUp));
      this.removalQueues.powerUps = [];
    }
    
    // Remove AIs
    if (this.removalQueues.ais.length > 0) {
      this.ais = this.ais.filter(ai => !this.removalQueues.ais.includes(ai));
      this.removalQueues.ais = [];
    }
  }
  
  updateBattleRoyale(deltaTime) {
    if (!this.battleRoyaleState.active) return;
    
    const now = Date.now();
    
    // Check if it's time to shrink the zone
    if (now >= this.battleRoyaleState.nextShrinkTime) {
      // Start shrinking
      this.battleRoyaleState.shrinkStartTime = now;
      this.battleRoyaleState.nextShrinkTime = now + this.battleRoyaleState.shrinkDuration + 30000; // Next shrink after 30 seconds
      
      // Calculate new target radius
      const currentRadius = this.battleRoyaleState.safeZoneRadius;
      const newRadius = Math.max(this.battleRoyaleState.minRadius, currentRadius * 0.7);
      
      // Store target radius
      this.battleRoyaleState.targetRadius = newRadius;
      
      // Play shrink sound
      this.soundManager.playSound('battleRoyaleShrink');
      
      // Show announcement
      this.showAnnouncement('Safe zone is shrinking!', 3000);
    }
    // Check if we need to show warning
    else if (!this.battleRoyaleState.isWarning && now >= this.battleRoyaleState.nextShrinkTime - this.battleRoyaleState.warningTime) {
      // Show warning
      this.battleRoyaleState.isWarning = true;
      
      // Play warning sound
      this.soundManager.playSound('battleRoyaleWarning');
      
      // Show announcement
      this.showAnnouncement('Safe zone will shrink soon!', 3000);
    }
    
    // Update shrinking
    if (this.battleRoyaleState.shrinkStartTime > 0) {
      const elapsed = now - this.battleRoyaleState.shrinkStartTime;
      
      if (elapsed < this.battleRoyaleState.shrinkDuration) {
        // Calculate progress (0-1)
        const progress = elapsed / this.battleRoyaleState.shrinkDuration;
        
        // Update radius
        const startRadius = this.battleRoyaleState.safeZoneRadius;
        const targetRadius = this.battleRoyaleState.targetRadius;
        this.battleRoyaleState.safeZoneRadius = startRadius - (startRadius - targetRadius) * progress;
      } else {
        // Shrinking complete
        this.battleRoyaleState.safeZoneRadius = this.battleRoyaleState.targetRadius;
        this.battleRoyaleState.shrinkStartTime = 0;
        this.battleRoyaleState.isWarning = false;
      }
    }
    
    // Check for game end
    if (this.player && !this.player.isDead) {
      // Count alive AIs
      const aliveAIs = this.ais.filter(ai => !ai.isDead);
      
      // If player is the only one left, they win
      if (aliveAIs.length === 0) {
        this.handleBattleRoyaleWin();
      }
    }
  }
  
  startBattleRoyale() {
    this.battleRoyaleState.active = true;
    this.battleRoyaleState.safeZoneRadius = this.worldSize / 2;
    this.battleRoyaleState.safeZoneX = this.worldSize / 2;
    this.battleRoyaleState.safeZoneY = this.worldSize / 2;
    this.battleRoyaleState.shrinkStartTime = 0;
    this.battleRoyaleState.nextShrinkTime = Date.now() + 30000; // First shrink after 30 seconds
    
    // Play start sound
    this.soundManager.playSound('battleRoyaleStart');
    
    // Show announcement
    this.showAnnouncement('Battle Royale has begun!', 3000);
  }
  
  handleBattleRoyaleWin() {
    // Show win announcement
    this.showAnnouncement('Victory Royale!', 5000);
    
    // Unlock achievement
    if (this.achievements) {
      this.achievements.unlock('battle_royale_win');
    }
    
    // Add bonus score
    if (this.player) {
      this.player.score += 10000;
      this.player.addExperience(5000);
    }
    
    // End game after a delay
    setTimeout(() => {
      this.handleGameOver();
    }, 5000);
  }
  updateTeamScores() {
    // Reset team scores
    Object.keys(this.teams).forEach(team => {
      this.teams[team].score = 0;
    });
    
    // Add player score to team
    if (this.player && !this.player.isDead && this.player.team) {
      this.teams[this.player.team].score += this.player.score;
    }
    
    // Add AI scores to teams
    this.ais.forEach(ai => {
      if (!ai.isDead && ai.team) {
        this.teams[ai.team].score += ai.score;
      }
    });
    
    // Check for team victory
    const teamScores = Object.entries(this.teams).map(([team, data]) => ({
      team,
      score: data.score
    }));
    
    // Sort by score (descending)
    teamScores.sort((a, b) => b.score - a.score);
    
    // If top team has 2x the score of the second team and score > 100000, they win
    if (teamScores.length >= 2 && 
        teamScores[0].score > 100000 && 
        teamScores[0].score > teamScores[1].score * 2) {
      this.handleTeamVictory(teamScores[0].team);
    }
  }
  
  handleTeamVictory(winningTeam) {
    // Show victory announcement
    this.showAnnouncement(`Team ${winningTeam} wins!`, 5000);
    
    // Unlock achievement if player is on winning team
    if (this.achievements && this.player && this.player.team === winningTeam) {
      this.achievements.unlock('team_victory');
    }
    
    // End game after a delay
    setTimeout(() => {
      this.handleGameOver();
    }, 5000);
  }
  
updateSpatialGrid() {
  // Clear grid
  this.spatialGrid = {};
  
  // Add entities to grid
  this.addEntitiesToGrid(this.foods, 'foods');
  this.addEntitiesToGrid(this.viruses, 'viruses');
  this.addEntitiesToGrid(this.powerUps, 'powerUps');
  
  // Add player cells to grid
  if (this.player && !this.player.isDead) {
    this.player.cells.forEach(cell => {
      if (!cell || isNaN(cell.x) || isNaN(cell.y) || isNaN(cell.radius)) return;
      this.addEntityToGrid(cell.x, cell.y, cell.radius, { type: 'player', cell, parent: this.player });
    });
  }
  
  // Add AI cells to grid
  this.ais.forEach(ai => {
    if (!ai || ai.isDead) return;
    
    ai.cells.forEach(cell => {
      if (!cell || isNaN(cell.x) || isNaN(cell.y) || isNaN(cell.radius)) return;
      this.addEntityToGrid(cell.x, cell.y, cell.radius, { type: 'ai', cell, parent: ai });
    });
  });
}
  
  addEntitiesToGrid(entities, type) {
    entities.forEach(entity => {
      this.addEntityToGrid(entity.x, entity.y, entity.radius, { type, ...entity });
    });
  }
  
  addEntityToGrid(x, y, radius, entity) {
    // Calculate grid cell coordinates
    const cellX = Math.floor(x / this.gridCellSize);
    const cellY = Math.floor(y / this.gridCellSize);
    
    // Add to grid cells that this entity overlaps
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const gridX = cellX + i;
        const gridY = cellY + j;
        
        // Skip invalid grid cells
        if (gridX < 0 || gridY < 0 || 
            gridX >= Math.ceil(this.worldSize / this.gridCellSize) || 
            gridY >= Math.ceil(this.worldSize / this.gridCellSize)) {
          continue;
        }
        
        const cellKey = `${gridX},${gridY}`;
        
        if (!this.spatialGrid[cellKey]) {
          this.spatialGrid[cellKey] = [];
        }
        
        this.spatialGrid[cellKey].push(entity);
      }
    }
  }
  
getEntitiesInRange(x, y, radius, types) {
  // Validate input parameters
  if (isNaN(x) || isNaN(y) || isNaN(radius) || !Array.isArray(types)) {
    console.error("Invalid parameters for getEntitiesInRange:", x, y, radius, types);
    return {};
  }
  
  // Calculate grid cell coordinates
  const cellX = Math.floor(x / this.gridCellSize);
  const cellY = Math.floor(y / this.gridCellSize);
  
  // Calculate how many cells to check in each direction
  const cellRadius = Math.ceil(radius / this.gridCellSize);
  
  // Initialize result
  const result = {};
  types.forEach(type => {
    result[type] = [];
  });
  
  // Check grid cells in range
  for (let i = -cellRadius; i <= cellRadius; i++) {
    for (let j = -cellRadius; j <= cellRadius; j++) {
      const gridX = cellX + i;
      const gridY = cellY + j;
      
      // Skip invalid grid cells
      if (gridX < 0 || gridY < 0 || 
          gridX >= Math.ceil(this.worldSize / this.gridCellSize) || 
          gridY >= Math.ceil(this.worldSize / this.gridCellSize)) {
        continue;
      }
      
      const cellKey = `${gridX},${gridY}`;
      
      // Skip empty cells
      if (!this.spatialGrid[cellKey]) continue;
      
      // Check entities in this cell
      this.spatialGrid[cellKey].forEach(entity => {
        // Skip invalid entities
        if (!entity || !entity.type || !entity.x || !entity.y || !entity.radius) {
          return;
        }
        
        if (types.includes(entity.type)) {
          // Calculate distance
          const dx = entity.x - x;
          const dy = entity.y - y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Add if in range
          if (distance <= radius + entity.radius) {
            // Avoid duplicates
            if (!result[entity.type].some(e => e === entity)) {
              result[entity.type].push(entity);
            }
          }
        }
      });
    }
  }
  
  return result;
}
  
updateVisibleEntities() {
  // Calculate viewport bounds
  const viewportBounds = this.getViewportBounds();
  
  // Validate viewport bounds
  if (!viewportBounds || 
      isNaN(viewportBounds.left) || 
      isNaN(viewportBounds.right) || 
      isNaN(viewportBounds.top) || 
      isNaN(viewportBounds.bottom)) {
    console.error("Invalid viewport bounds:", viewportBounds);
    return;
  }
  
  // Update visible entities
  this.visibleEntities.foods = this.foods.filter(food => {
    // Skip invalid foods
    if (!food) return false;
    
    // Check if food has checkVisibility method, otherwise use isInViewport
    if (typeof food.checkVisibility === 'function') {
      return food.checkVisibility(viewportBounds);
    } else {
      return this.isInViewport(food.x, food.y, food.radius, viewportBounds);
    }
  });
  
  this.visibleEntities.viruses = this.viruses.filter(virus => {
    // Skip invalid viruses
    if (!virus) return false;
    
    if (typeof virus.checkVisibility === 'function') {
      return virus.checkVisibility(viewportBounds);
    } else {
      return this.isInViewport(virus.x, virus.y, virus.radius, viewportBounds);
    }
  });
  
  this.visibleEntities.powerUps = this.powerUps.filter(powerUp => {
    // Skip invalid power-ups
    if (!powerUp) return false;
    
    if (typeof powerUp.checkVisibility === 'function') {
      return powerUp.checkVisibility(viewportBounds);
    } else {
      return this.isInViewport(powerUp.x, powerUp.y, powerUp.radius, viewportBounds);
    }
  });
  
  // Update visible AIs
  this.visibleEntities.ais = [];
  this.ais.forEach(ai => {
    if (!ai || ai.isDead) return;
    
    let isVisible = false;
    
    // Check if any cell is visible
    ai.cells.forEach(cell => {
      if (this.isInViewport(cell.x, cell.y, cell.radius, viewportBounds)) {
        isVisible = true;
      }
    });
    
    if (isVisible) {
      this.visibleEntities.ais.push(ai);
    }
  });
}
  
  getViewportBounds() {
  // Validate camera properties
  if (!this.camera || isNaN(this.camera.x) || isNaN(this.camera.y) || isNaN(this.camera.scale)) {
    console.error("Invalid camera for viewport calculation:", this.camera);
    return {
      left: 0,
      right: this.worldSize,
      top: 0,
      bottom: this.worldSize
    };
  }
  
  const halfWidth = this.width / (2 * this.camera.scale);
  const halfHeight = this.height / (2 * this.camera.scale);
  
  return {
    left: this.camera.x - halfWidth,
    right: this.camera.x + halfWidth,
    top: this.camera.y - halfHeight,
    bottom: this.camera.y + halfHeight
  };
}
  
isInViewport(x, y, radius, viewportBounds) {
  // Validate parameters
  if (isNaN(x) || isNaN(y) || isNaN(radius)) {
    return false;
  }
  
  const bounds = viewportBounds || this.getViewportBounds();
  
  // Validate bounds
  if (!bounds || 
      isNaN(bounds.left) || 
      isNaN(bounds.right) || 
      isNaN(bounds.top) || 
      isNaN(bounds.bottom)) {
    return false;
  }
  
  return (
    x + radius > bounds.left &&
    x - radius < bounds.right &&
    y + radius > bounds.top &&
    y - radius < bounds.bottom
  );
}
  
centerCamera() {
  if (!this.player) return;
  
  // Verify player coordinates are valid
  if (isNaN(this.player.x) || isNaN(this.player.y)) {
    console.error("Invalid player coordinates for camera centering:", this.player.x, this.player.y);
    return;
  }
  
  // Calculate target camera position (center of mass of player cells)
  let totalX = 0;
  let totalY = 0;
  let totalMass = 0;
  let validCells = 0;
  
  this.player.cells.forEach(cell => {
    // Verify cell coordinates and mass are valid
    if (isNaN(cell.x) || isNaN(cell.y) || isNaN(cell.mass) || cell.mass <= 0) {
      return;
    }
    
    totalX += cell.x * cell.mass;
    totalY += cell.y * cell.mass;
    totalMass += cell.mass;
    validCells++;
  });
  
  // If no valid cells, use player position
  if (validCells === 0 || totalMass <= 0) {
    this.camera.x = this.player.x;
    this.camera.y = this.player.y;
  } else {
    const targetX = totalX / totalMass;
    const targetY = totalY / totalMass;
    
    // Verify calculated coordinates are valid
    if (isNaN(targetX) || isNaN(targetY)) {
      console.error("Invalid camera target calculated:", totalX, totalY, totalMass);
      return;
    }
    
    // Smooth camera movement
    if (isNaN(this.camera.x) || isNaN(this.camera.y)) {
      this.camera.x = targetX;
      this.camera.y = targetY;
    } else {
      this.camera.x += (targetX - this.camera.x) * this.cameraSmoothing;
      this.camera.y += (targetY - this.camera.y) * this.cameraSmoothing;
    }
  }
  
  // Calculate camera scale based on player size
  if (this.player.cells.length > 0) {
    const largestCell = this.player.cells.reduce((largest, cell) => 
      cell.radius > largest.radius ? cell : largest, this.player.cells[0]);
    
    // Scale inversely with player size, but with limits
    const targetScale = Math.max(0.5, Math.min(1.0, 40 / largestCell.radius));
    
    // Smooth scale transition
    if (isNaN(this.camera.scale)) {
      this.camera.scale = targetScale;
    } else {
      this.camera.scale += (targetScale - this.camera.scale) * this.cameraSmoothing * 0.5;
    }
  }
  
  // Keep camera within world bounds
  this.camera.x = Math.max(this.cameraBounds.minX, Math.min(this.cameraBounds.maxX, this.camera.x));
  this.camera.y = Math.max(this.cameraBounds.minY, Math.min(this.cameraBounds.maxY, this.camera.y));
  
  // Verify final camera values are valid
  if (isNaN(this.camera.x) || isNaN(this.camera.y) || isNaN(this.camera.scale)) {
    console.error("Invalid camera values after centering:", this.camera.x, this.camera.y, this.camera.scale);
    this.camera.x = this.worldSize / 2;
    this.camera.y = this.worldSize / 2;
    this.camera.scale = 1.0;
  }
}
  
  render() {
    // Performance measurement
    const renderStart = performance.now();
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // Save context
    this.ctx.save();
    
    // Apply camera transform
    this.ctx.translate(this.width / 2, this.height / 2);
    this.ctx.scale(this.camera.scale, this.camera.scale);
    this.ctx.translate(-this.camera.x, -this.camera.y);
    
    // Draw background grid
    this.drawBackground();
    
    // Draw battle royale safe zone if active
    if (this.gameMode === 'battle-royale' && this.battleRoyaleState.active) {
      this.drawBattleRoyaleSafeZone();
    }
    
    // Draw entities
    this.drawEntities();
    
    // Draw particles
    this.particles.draw(this.ctx);
    
    // Restore context
    this.ctx.restore();
    
    // Draw UI elements
    this.drawUI();
    
    // Update performance stats
    this.stats.renderTime = performance.now() - renderStart;
  }
  
  drawBackground() {
    // Calculate visible area
    const viewportBounds = this.getViewportBounds();
    const { left, right, top, bottom } = viewportBounds;
    
    // Align to grid
    const startX = Math.floor(left / this.gridSize) * this.gridSize;
    const startY = Math.floor(top / this.gridSize) * this.gridSize;
    const endX = Math.ceil(right / this.gridSize) * this.gridSize;
    const endY = Math.ceil(bottom / this.gridSize) * this.gridSize;
    
    // Draw background
    this.ctx.fillStyle = '#f8f8f8';
    this.ctx.fillRect(startX, startY, endX - startX, endY - startY);
    
    // Draw grid
    this.ctx.strokeStyle = '#e0e0e0';
    this.ctx.lineWidth = 1;
    
    // Vertical lines
    for (let x = startX; x <= endX; x += this.gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, startY);
      this.ctx.lineTo(x, endY);
      this.ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = startY; y <= endY; y += this.gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(startX, y);
      this.ctx.lineTo(endX, y);
      this.ctx.stroke();
    }
    
    // Draw world border
    this.ctx.strokeStyle = '#ff0000';
    this.ctx.lineWidth = 10;
    this.ctx.strokeRect(0, 0, this.worldSize, this.worldSize);
  }
  
  drawBattleRoyaleSafeZone() {
    const { safeZoneX, safeZoneY, safeZoneRadius, isWarning } = this.battleRoyaleState;
    
    // Draw danger zone
    this.ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
    this.ctx.beginPath();
    this.ctx.rect(0, 0, this.worldSize, this.worldSize);
    this.ctx.arc(safeZoneX, safeZoneY, safeZoneRadius, 0, Math.PI * 2, true);
    this.ctx.fill();
    
    // Draw safe zone border
    this.ctx.strokeStyle = isWarning ? 
      'rgba(255, 0, 0, ' + (0.5 + 0.5 * Math.sin(Date.now() / 200)) + ')' : 
      'rgba(0, 200, 255, 0.8)';
    this.ctx.lineWidth = 5;
    this.ctx.beginPath();
    this.ctx.arc(safeZoneX, safeZoneY, safeZoneRadius, 0, Math.PI * 2);
    this.ctx.stroke();
    
    // Draw pulsing effect if warning
    if (isWarning) {
      this.ctx.strokeStyle = 'rgba(255, 0, 0, ' + (0.2 + 0.2 * Math.sin(Date.now() / 100)) + ')';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(safeZoneX, safeZoneY, safeZoneRadius + 5 + 5 * Math.sin(Date.now() / 200), 0, Math.PI * 2);
      this.ctx.stroke();
    }
  }
  
  drawEntities() {
    // Reset entity count
    this.stats.entitiesRendered = 0;
    
    // Draw food
    this.visibleEntities.foods.forEach(food => {
      food.draw(this.ctx);
      this.stats.entitiesRendered++;
    });
    
    // Draw power-ups
    this.visibleEntities.powerUps.forEach(powerUp => {
      powerUp.draw(this.ctx);
      this.stats.entitiesRendered++;
    });
    
    // Collect all cells for z-index sorting
    const allCells = [];
    
    // Add player cells
    if (this.player && !this.player.isDead) {
      this.player.cells.forEach(cell => {
        allCells.push({ entity: this.player, cell, z: cell.z || 0 });
      });
    }
    
    // Add AI cells
    this.visibleEntities.ais.forEach(ai => {
      ai.cells.forEach(cell => {
        allCells.push({ entity: ai, cell, z: cell.z || 0 });
      });
    });
    
    // Add viruses
    this.visibleEntities.viruses.forEach(virus => {
      allCells.push({ entity: virus, cell: null, z: virus.z || 5 });
    });
    
    // Sort by z-index
    allCells.sort((a, b) => a.z - b.z);
    
    // Draw cells in order
    allCells.forEach(item => {
      if (item.entity === this.player || this.visibleEntities.ais.includes(item.entity)) {
        item.entity.draw(this.ctx);
      } else if (this.visibleEntities.viruses.includes(item.entity)) {
        item.entity.draw(this.ctx);
      }
      this.stats.entitiesRendered++;
    });
  }
  drawUI() {
    // Draw minimap
    this.miniMap.update(1/60); // Update with fixed time step
    this.miniMap.draw(this.ctx);
    
    // Draw debug info if enabled
    if (this.debugMode) {
      this.drawDebugInfo();
    }
  }
  
  drawDebugInfo() {
    this.ctx.font = '12px Arial';
    this.ctx.fillStyle = 'black';
    this.ctx.textAlign = 'left';
    
    const debugInfo = [
      `FPS: ${this.fps}`,
      `Entities: ${this.stats.entitiesRendered}`,
      `Update: ${this.stats.updateTime.toFixed(2)}ms`,
      `Render: ${this.stats.renderTime.toFixed(2)}ms`,
      `AI: ${this.stats.aiTime.toFixed(2)}ms`,
      `Foods: ${this.foods.length}`,
      `AIs: ${this.ais.length}`,
      `Viruses: ${this.viruses.length}`,
      `PowerUps: ${this.powerUps.length}`,
      `Particles: ${this.particles.particles.length}`,
      `Camera: (${this.camera.x.toFixed(0)}, ${this.camera.y.toFixed(0)}, ${this.camera.scale.toFixed(2)})`
    ];
    
    debugInfo.forEach((info, index) => {
      this.ctx.fillText(info, 10, 20 + index * 15);
    });
  }
  
  handleGameOver(data) {
    if (this.isGameOver) return;
    
    this.isGameOver = true;
    
    // Update UI
    const gameOverElement = document.getElementById('game-over');
    const gameUIElement = document.getElementById('game-ui');
    
    if (gameOverElement) {
      gameOverElement.style.display = 'block';
    }
    
    if (gameUIElement) {
      gameUIElement.style.display = 'none';
    }
    
    // Update final stats
    const finalScoreElement = document.getElementById('final-score');
    const finalLevelElement = document.getElementById('final-level');
    const timeSurvivedElement = document.getElementById('time-survived');
    const playersEatenElement = document.getElementById('players-eaten');
    
    if (finalScoreElement && this.player) {
      finalScoreElement.textContent = Math.floor(this.player.score);
    }
    
    if (finalLevelElement && this.player) {
      finalLevelElement.textContent = this.player.level;
    }
    
    if (timeSurvivedElement) {
      const minutes = Math.floor(this.gameTime / 60);
      const seconds = Math.floor(this.gameTime % 60);
      timeSurvivedElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    if (playersEatenElement && this.player) {
      playersEatenElement.textContent = this.player.stats.playersEaten;
    }
    
    // Play game over sound
    this.soundManager.playSound('gameOver');
    
    // Stop game loop
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    // Save game stats
    this.saveGameStats();
    
    // Update leaderboard
    if (this.player) {
      this.leaderboard.submitScore(this.player.name, Math.floor(this.player.score));
    }
  }
  
  removeFood(food) {
    this.removalQueues.foods.push(food);
  }
  
  removeVirus(virus) {
    this.removalQueues.viruses.push(virus);
  }
  
  removePowerUp(powerUp) {
    this.removalQueues.powerUps.push(powerUp);
  }
  
  removeAI(ai) {
    this.removalQueues.ais.push(ai);
  }
  
  getLeaderboard() {
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
  }
  
  updateViewport() {
    if (this.canvas) {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.width = this.canvas.width;
      this.height = this.canvas.height;
      
      // Update minimap size based on screen size
      this.miniMap.resize();
    }
  }
  
  showAnnouncement(message, duration = 3000) {
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
  }
  
  reset() {
    // Reset game state
    this.isGameOver = false;
    this.isPaused = false;
    this.gameTime = 0;
    
    // Clear entities
    this.foods = [];
    this.ais = [];
    this.viruses = [];
    this.powerUps = [];
    
    // Reset battle royale state
    this.battleRoyaleState.active = false;
    
    // Reset teams
    Object.keys(this.teams).forEach(team => {
      this.teams[team].score = 0;
      this.teams[team].players = [];
    });
    
    // Reset player if exists
    if (this.player) {
      this.player.reset();
    }
    
    // Regenerate world
    this.generateWorld();
    
    // Reset camera
    this.camera.scale = 1;
    this.centerCamera();
    
    // Reset particles
    this.particles.particles = [];
    
    // Reset stats
    this.stats = {
      fps: 0,
      frameCount: 0,
      lastFpsUpdate: 0,
      entitiesRendered: 0,
      collisionsChecked: 0,
      updateTime: 0,
      renderTime: 0,
      physicsTime: 0,
      aiTime: 0
    };
    
    // Reset UI
    const gameOverElement = document.getElementById('game-over');
    const gameUIElement = document.getElementById('game-ui');
    
    if (gameOverElement) {
      gameOverElement.style.display = 'none';
    }
    
    if (gameUIElement) {
      gameUIElement.style.display = 'block';
    }
    
    // Reset animation frame
    this.lastFrameTime = performance.now();
    this.animationId = null;
  }
  
  // Additional utility methods
  
  /**
   * Checks if two entities are colliding
   * @param {Object} entity1 - First entity with x, y, radius properties
   * @param {Object} entity2 - Second entity with x, y, radius properties
   * @returns {boolean} - True if entities are colliding
   */
  checkCollision(entity1, entity2) {
    const dx = entity1.x - entity2.x;
    const dy = entity1.y - entity2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance < entity1.radius + entity2.radius;
  }
  
  /**
   * Calculates distance between two points
   * @param {number} x1 - First point x coordinate
   * @param {number} y1 - First point y coordinate
   * @param {number} x2 - Second point x coordinate
   * @param {number} y2 - Second point y coordinate
   * @returns {number} - Distance between points
   */
  getDistance(x1, y1, x2, y2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  /**
   * Formats a number with commas for thousands
   * @param {number} num - Number to format
   * @returns {string} - Formatted number
   */
  formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  
  /**
   * Formats time in seconds to MM:SS format
   * @param {number} seconds - Time in seconds
   * @returns {string} - Formatted time
   */
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
  
  /**
   * Generates a random name for AI players
   * @returns {string} - Random name
   */
  generateRandomName() {
    const prefixes = ['Micro', 'Mega', 'Ultra', 'Super', 'Hyper', 'Nano', 'Giga', 'Quantum', 'Cosmic', 'Atomic'];
    const suffixes = ['Cell', 'Blob', 'Sphere', 'Orb', 'Dot', 'Bubble', 'Nucleus', 'Plasma', 'Matter', 'Entity'];
    
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    
    return `${prefix}${suffix}`;
  }
  
  /**
   * Generates a random color in hex format
   * @returns {string} - Random color in hex format
   */
  generateRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
  
  /**
   * Interpolates between two colors
   * @param {string} color1 - First color in hex format
   * @param {string} color2 - Second color in hex format
   * @param {number} factor - Interpolation factor (0-1)
   * @returns {string} - Interpolated color in hex format
   */
  lerpColor(color1, color2, factor) {
    // Convert hex to RGB
    const hex2rgb = (hex) => {
      const r = parseInt(hex.substring(1, 3), 16);
      const g = parseInt(hex.substring(3, 5), 16);
      const b = parseInt(hex.substring(5, 7), 16);
      return [r, g, b];
    };
    
    // Convert RGB to hex
    const rgb2hex = (r, g, b) => {
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    };
    
    // If colors are not hex format, return color1
    if (!color1.startsWith('#') || !color2.startsWith('#')) {
      return color1;
    }
    
    const rgb1 = hex2rgb(color1);
    const rgb2 = hex2rgb(color2);
    
    // Interpolate between the colors
    const r = Math.round(rgb1[0] + factor * (rgb2[0] - rgb1[0]));
    const g = Math.round(rgb1[1] + factor * (rgb2[1] - rgb1[1]));
    const b = Math.round(rgb1[2] + factor * (rgb2[2] - rgb1[2]));
    
    return rgb2hex(r, g, b);
  }
  
  /**
   * Applies easing to a value
   * @param {number} t - Input value (0-1)
   * @param {string} type - Easing type ('easeIn', 'easeOut', 'easeInOut')
   * @returns {number} - Eased value
   */
  applyEasing(t, type = 'easeInOut') {
    switch (type) {
      case 'easeIn':
        return t * t;
      case 'easeOut':
        return t * (2 - t);
      case 'easeInOut':
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      default:
        return t;
    }
  }
  
  /**
   * Clamps a value between min and max
   * @param {number} value - Value to clamp
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} - Clamped value
   */
  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
  
  /**
   * Checks if the game is running on a mobile device
   * @returns {boolean} - True if on mobile device
   */
  isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
  
  /**
   * Toggles fullscreen mode
   */
  toggleFullscreen() {
    if (!document.fullscreenElement) {
      if (this.canvas.requestFullscreen) {
        this.canvas.requestFullscreen();
      } else if (this.canvas.webkitRequestFullscreen) {
        this.canvas.webkitRequestFullscreen();
      } else if (this.canvas.msRequestFullscreen) {
        this.canvas.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  }
  
  /**
   * Toggles debug mode
   */
  toggleDebugMode() {
    this.debugMode = !this.debugMode;
    console.log(`Debug mode: ${this.debugMode ? 'enabled' : 'disabled'}`);
  }
  
  /**
   * Toggles pause state
   */
  togglePause() {
    this.isPaused = !this.isPaused;
    
    const pauseMenu = document.getElementById('pause-menu');
    if (pauseMenu) {
      pauseMenu.style.display = this.isPaused ? 'block' : 'none';
    }
    
    if (this.isPaused) {
      // Pause background music
      if (this.soundManager && this.soundManager.musicEnabled) {
        this.soundManager.pauseBackgroundMusic();
      }
    } else {
      // Resume background music
      if (this.soundManager && this.soundManager.musicEnabled) {
        this.soundManager.resumeBackgroundMusic();
      }
    }
  }
  
  /**
   * Handles window resize event
   */
  handleResize() {
    this.updateViewport();
    
    // Update UI elements position if needed
    const gameUI = document.getElementById('game-ui');
    if (gameUI) {
      // Adjust UI layout based on screen size
      if (window.innerWidth < 768) {
        // Mobile layout
        gameUI.classList.add('mobile-layout');
      } else {
        // Desktop layout
        gameUI.classList.remove('mobile-layout');
      }
    }
  }
  
  /**
   * Handles visibility change event
   */
  handleVisibilityChange() {
    if (document.hidden && !this.isGameOver) {
      this.isPaused = true;
      
      const pauseMenu = document.getElementById('pause-menu');
      if (pauseMenu) {
        pauseMenu.style.display = 'block';
      }
      
      // Pause background music
      if (this.soundManager && this.soundManager.musicEnabled) {
        this.soundManager.pauseBackgroundMusic();
      }
    }
  }
  
  /**
   * Handles keyboard events
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleKeyDown(event) {
    if (this.isGameOver) return;
    
    switch (event.key) {
      case 'p':
      case 'P':
      case 'Escape':
        this.togglePause();
        break;
      case 'f':
      case 'F':
        this.toggleFullscreen();
        break;
      case 'd':
      case 'D':
        this.toggleDebugMode();
        break;
    }
  }
}
