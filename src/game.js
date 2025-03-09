
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
    this.player = player;
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
    this.achievements.initPlayer(player);
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
    }
    
    // Skip update if paused
    if (this.isPaused) {
      this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
      return;
    }
    
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
  }
  
  update(deltaTime) {
    // Scale delta time by time scale (for slow-motion effects)
    const scaledDeltaTime = deltaTime * this.timeScale;
    
    // Performance measurement
    const updateStart = performance.now();
    
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
      this.achievements.checkAchievements(this.player);
      
      this.stats.playerUpdateTime = performance.now() - playerUpdateStart;
    } else if (this.player && this.player.isDead) {
      this.handleGameOver();
    }
    
    // Update AI players
    const aiUpdateStart = performance.now();
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
    this.stats.aiTime = performance.now() - aiUpdateStart;
    
    // Update food
    this.foods.forEach(food => {
      food.update(scaledDeltaTime);
    });
    
    // Update viruses
    this.viruses.forEach(virus => {
      virus.update(scaledDeltaTime);
    });
    
    // Update power-ups
    this.powerUps.forEach(powerUp => {
      powerUp.update(scaledDeltaTime);
    });
    
    // Update particles
    this.particles.update(scaledDeltaTime);
    
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
    
    // Keep entity position within world bounds
    entity.x = Math.max(0, Math.min(this.worldSize, entity.x));
    entity.y = Math.max(0, Math.min(this.worldSize, entity.y));
    
    // Also keep all cells within bounds
    if (entity.cells) {
      entity.cells.forEach(cell => {
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
      this.powerUps = this.power