import { Food } from './food.js';
import { AI } from './ai.js';
import { Virus } from './virus.js';
import { PowerUp } from './powerup.js';
import { ParticleSystem } from './particles.js';
import { SoundManager } from './sound.js';
import { MiniMap } from './minimap.js';

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
    
    // World properties
    this.worldSize = 6000;
    this.gridSize = 50;
    this.camera = { x: 0, y: 0, scale: 1 };
    this.cameraSmoothing = 0.1; // Camera smoothing factor
    
    // Game settings
    this.foodCount = 1000; // Increased food count for more dynamic gameplay
    this.aiCount = 20;
    this.virusCount = 25;
    this.powerUpCount = 12; // Increased power-up count
    
    // Physics settings
    this.cellCollisionElasticity = 0.7; // How bouncy cell collisions are (0-1)
    this.cellRepulsionForce = 0.15; // Force applied when cells collide
    this.foodAttractionRadius = 5; // Radius around cells where food starts to be attracted
    
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
      collisionsChecked: 0
    };
    
    // Animation frame
    this.animationId = null;
    
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
      damagePerSecond: 5
    };
    
    // Teams
    this.teams = {
      red: { score: 0, players: [] },
      blue: { score: 0, players: [] },
      green: { score: 0, players: [] }
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
  }
  
  getTeamColor(teamName) {
    switch (teamName) {
      case 'red': return '#ff5252';
      case 'blue': return '#2196f3';
      case 'green': return '#4caf50';
      default: return '#ffffff';
    }
  }
  
  start() {
    this.generateWorld();
    this.gameLoop();
    this.soundManager.playBackgroundMusic();
  }
  
  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.soundManager.stopBackgroundMusic();
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
  
  gameLoop() {
    const now = Date.now();
    const deltaTime = (now - this.lastUpdateTime) / 1000; // Convert to seconds
    this.lastUpdateTime = now;
    
    // Update game time
    this.gameTime += deltaTime;
    
    // Update FPS counter
    this.stats.frameCount++;
    if (now - this.stats.lastFpsUpdate > 1000) {
      this.stats.fps = this.stats.frameCount;
      this.stats.frameCount = 0;
      this.stats.lastFpsUpdate = now;
      
      // Reset stats
      this.stats.entitiesRendered = 0;
      this.stats.collisionsChecked = 0;
    }
    
    if (this.isPaused) {
      this.animationId = requestAnimationFrame(() => this.gameLoop());
      return;
    }
    
    this.update(deltaTime);
    this.render();
    
    if (!this.isGameOver) {
      this.animationId = requestAnimationFrame(() => this.gameLoop());
    }
  }
  
  update(deltaTime) {
    // Update battle royale mode
    if (this.gameMode === 'battle-royale' && this.battleRoyaleState.active) {
      this.updateBattleRoyale(deltaTime);
    }
    
    // Update team scores
    if (this.gameMode === 'teams') {
      this.updateTeamScores();
    }
    
    // Update spatial grid
    this.updateSpatialGrid();
    
    // Update player
    if (this.player && !this.player.isDead) {
      this.player.update(deltaTime);
      this.centerCamera();
      
      // Check if player is out of bounds
      if (this.player.x < 0) this.player.x = 0;
      if (this.player.y < 0) this.player.y = 0;
      if (this.player.x > this.worldSize) this.player.x = this.worldSize;
      if (this.player.y > this.worldSize) this.player.y = this.worldSize;
      
      // Apply battle royale damage if outside safe zone
      if (this.gameMode === 'battle-royale' && this.battleRoyaleState.active) {
        const dx = this.player.x - this.battleRoyaleState.safeZoneX;
        const dy = this.player.y - this.battleRoyaleState.safeZoneY;
        const distanceToCenter = Math.sqrt(dx * dx + dy * dy);
        
        if (distanceToCenter > this.battleRoyaleState.safeZoneRadius) {
          this.player.takeDamage(this.battleRoyaleState.damagePerSecond * deltaTime);
        }
      }
    } else if (this.player && this.player.isDead) {
      this.isGameOver = true;
    }
    
    // Update AI players
    this.ais.forEach(ai => {
      if (!ai.isDead) {
        ai.update(deltaTime);
        
        // Apply battle royale damage if outside safe zone
        if (this.gameMode === 'battle-royale' && this.battleRoyaleState.active) {
          const dx = ai.x - this.battleRoyaleState.safeZoneX;
          const dy = ai.y - this.battleRoyaleState.safeZoneY;
          const distanceToCenter = Math.sqrt(dx * dx + dy * dy);
          
          if (distanceToCenter > this.battleRoyaleState.safeZoneRadius) {
            ai.takeDamage(this.battleRoyaleState.damagePerSecond * deltaTime);
          }
        }
      }
    });
    
    // Update food
    this.foods.forEach(food => {
      food.update(deltaTime);
    });
    
    // Update viruses
    this.viruses.forEach(virus => {
      virus.update(deltaTime);
    });
    
    // Update power-ups
    this.powerUps.forEach(powerUp => {
      powerUp.update(deltaTime);
    });
    
    // Update particles
    this.particles.update(deltaTime);
    
    // Remove dead AIs and add new ones
    this.ais = this.ais.filter(ai => !ai.isDead);
    
    // Only add new AIs in classic mode or if battle royale hasn't started yet
    if (this.gameMode === 'classic' || 
        (this.gameMode === 'battle-royale' && !this.battleRoyaleState.active)) {
      while (this.ais.length < this.aiCount) {
        const ai = new AI(
          `Bot ${Math.floor(Math.random() * 1000)}`,
          this.getRandomColor(),
          this
        );
        
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
    }
    
    // Replenish food in batches for better performance
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
    
    // Replenish viruses
    while (this.viruses.length < this.virusCount) {
      this.viruses.push(new Virus(
        Math.random() * this.worldSize,
        Math.random() * this.worldSize,
        this
      ));
    }
    
    // Replenish power-ups
    while (this.powerUps.length < this.powerUpCount) {
      this.powerUps.push(new PowerUp(
        Math.random() * this.worldSize,
        Math.random() * this.worldSize,
        this
      ));
    }
    
    // Check for battle royale start
    if (this.gameMode === 'battle-royale' && !this.battleRoyaleState.active && this.gameTime > 30) {
      this.startBattleRoyale();
    }
    
    // Update visible entities for rendering optimization
    this.updateVisibleEntities();
  }
  
  updateSpatialGrid() {
  // Clear the grid
  this.spatialGrid = {};
  
  // Helper function to add entity to grid
  const addToGrid = (entity, type) => {
    const cellX = Math.floor(entity.x / this.gridCellSize);
    const cellY = Math.floor(entity.y / this.gridCellSize);
    const cellKey = `${cellX},${cellY}`;
    
    // Inicialize o objeto da célula se ele não existir
    if (!this.spatialGrid[cellKey]) {
      this.spatialGrid[cellKey] = { 
        foods: [], 
        ais: [], 
        viruses: [], 
        powerUps: [],
        player: [] // Adicione esta propriedade que estava faltando
      };
    }
    
    // Verifique se o array para este tipo existe
    if (!this.spatialGrid[cellKey][type]) {
      this.spatialGrid[cellKey][type] = [];
    }
    
    this.spatialGrid[cellKey][type].push(entity);
  };
  
  // Add foods to grid
  this.foods.forEach(food => addToGrid(food, 'foods'));
  
  // Add AIs to grid
  this.ais.forEach(ai => {
    if (ai && ai.cells) {  // Verificar se ai e ai.cells existem
      ai.cells.forEach(cell => {
        if (cell) {  // Verificar se cell existe
          // Create a temporary entity with the cell's position and radius
          const cellEntity = {
            x: cell.x,
            y: cell.y,
            radius: cell.radius,
            parent: ai,
            cell: cell
          };
          addToGrid(cellEntity, 'ais');
        }
      });
    }
  });
  
  // Add viruses to grid
  this.viruses.forEach(virus => {
    if (virus) {  // Verificar se virus existe
      addToGrid(virus, 'viruses');
    }
  });
  
  // Add power-ups to grid
  this.powerUps.forEach(powerUp => {
    if (powerUp) {  // Verificar se powerUp existe
      addToGrid(powerUp, 'powerUps');
    }
  });
  
  // Add player cells to grid
  if (this.player && !this.player.isDead && this.player.cells) {
    this.player.cells.forEach(cell => {
      if (cell) {  // Verificar se cell existe
        // Create a temporary entity with the cell's position and radius
        const cellEntity = {
          x: cell.x,
          y: cell.y,
          radius: cell.radius,
          parent: this.player,
          cell: cell
        };
        addToGrid(cellEntity, 'player');
      }
    });
  }
}

  
 getEntitiesInRange(x, y, radius, types = ['foods', 'ais', 'viruses', 'powerUps', 'player']) {
  const result = {};
  types.forEach(type => result[type] = []);
  
  // Calculate grid cells that could contain entities within range
  const cellRadius = Math.ceil(radius / this.gridCellSize) + 1;
  const centerCellX = Math.floor(x / this.gridCellSize);
  const centerCellY = Math.floor(y / this.gridCellSize);
  
  for (let cellX = centerCellX - cellRadius; cellX <= centerCellX + cellRadius; cellX++) {
    for (let cellY = centerCellY - cellRadius; cellY <= centerCellY + cellRadius; cellY++) {
      const cellKey = `${cellX},${cellY}`;
      
      if (this.spatialGrid[cellKey]) {
        types.forEach(type => {
          if (this.spatialGrid[cellKey][type]) {  // Verificar se o array para este tipo existe
            this.spatialGrid[cellKey][type].forEach(entity => {
              if (entity) {  // Verificar se entity existe
                const dx = entity.x - x;
                const dy = entity.y - y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= radius + entity.radius) {
                  result[type].push(entity);
                }
              }
            });
          }
        });
      }
    }
  }
  
  return result;
}

  
  updateVisibleEntities() {
    // Calculate viewport bounds with some margin
    const viewportLeft = this.camera.x - this.width / (2 * this.camera.scale) - 100;
    const viewportRight = this.camera.x + this.width / (2 * this.camera.scale) + 100;
    const viewportTop = this.camera.y - this.height / (2 * this.camera.scale) - 100;
    const viewportBottom = this.camera.y + this.height / (2 * this.camera.scale) + 100;
    
    // Filter visible entities
    this.visibleEntities.foods = this.foods.filter(food => 
      food.x + food.radius > viewportLeft &&
      food.x - food.radius < viewportRight &&
      food.y + food.radius > viewportTop &&
      food.y - food.radius < viewportBottom
    );
    
    this.visibleEntities.ais = this.ais.filter(ai => 
      !ai.isDead && ai.x + ai.radius > viewportLeft &&
      ai.x - ai.radius < viewportRight &&
      ai.y + ai.radius > viewportTop &&
      ai.y - ai.radius < viewportBottom
    );
    
    this.visibleEntities.viruses = this.viruses.filter(virus => 
      virus.x + virus.radius > viewportLeft &&
      virus.x - virus.radius < viewportRight &&
      virus.y + virus.radius > viewportTop &&
      virus.y - virus.radius < viewportBottom
    );
    
    this.visibleEntities.powerUps = this.powerUps.filter(powerUp => 
      powerUp.x + powerUp.radius > viewportLeft &&
      powerUp.x - powerUp.radius < viewportRight &&
      powerUp.y + powerUp.radius > viewportTop &&
      powerUp.y - powerUp.radius < viewportBottom
    );
    
    // Update stats
    this.stats.entitiesRendered = 
      this.visibleEntities.foods.length + 
      this.visibleEntities.ais.length + 
      this.visibleEntities.viruses.length + 
      this.visibleEntities.powerUps.length;
  }
  
  updateBattleRoyale(deltaTime) {
    const elapsed = this.gameTime - this.battleRoyaleState.shrinkStartTime;
    const progress = Math.min(1, elapsed / this.battleRoyaleState.shrinkDuration);
    
    // Shrink safe zone
    const startRadius = this.worldSize / 2;
    const targetRadius = this.battleRoyaleState.minRadius;
    this.battleRoyaleState.safeZoneRadius = startRadius - (startRadius - targetRadius) * progress;
    
    // Move safe zone center slightly for more dynamic gameplay
    if (elapsed % 10 < deltaTime) { // Every ~10 seconds
      const moveDistance = this.battleRoyaleState.safeZoneRadius * 0.1;
      this.battleRoyaleState.safeZoneX += (Math.random() * 2 - 1) * moveDistance;
      this.battleRoyaleState.safeZoneY += (Math.random() * 2 - 1) * moveDistance;
      
      // Keep within world bounds
      this.battleRoyaleState.safeZoneX = Math.max(this.battleRoyaleState.safeZoneRadius, 
        Math.min(this.worldSize - this.battleRoyaleState.safeZoneRadius, this.battleRoyaleState.safeZoneX));
      this.battleRoyaleState.safeZoneY = Math.max(this.battleRoyaleState.safeZoneRadius, 
        Math.min(this.worldSize - this.battleRoyaleState.safeZoneRadius, this.battleRoyaleState.safeZoneY));
    }
  }
  
  startBattleRoyale() {
    this.battleRoyaleState.active = true;
    this.battleRoyaleState.shrinkStartTime = this.gameTime;
    this.soundManager.playSound('battleRoyaleStart');
    
    // Display announcement
    this.showAnnouncement('Battle Royale has begun! Safe zone is shrinking!', 5000);
  }
  
  updateTeamScores() {
    // Reset scores
    Object.keys(this.teams).forEach(team => {
      this.teams[team].score = 0;
    });
    
    // Add player scores
    if (this.player && !this.player.isDead && this.player.team) {
      this.teams[this.player.team].score += this.player.score;
    }
    
    // Add AI scores
    this.ais.forEach(ai => {
      if (!ai.isDead && ai.team) {
        this.teams[ai.team].score += ai.score;
      }
    });
  }
  
  render() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // Save context state
    this.ctx.save();
    
    // Apply camera transformation
    this.ctx.translate(this.width / 2, this.height / 2);
    this.ctx.scale(this.camera.scale, this.camera.scale);
    this.ctx.translate(-this.camera.x, -this.camera.y);
    
    // Draw background pattern
    this.drawBackground();
    
    // Draw grid
    this.drawGrid();
    
    // Draw world border
    this.drawWorldBorder();
    
    // Draw battle royale safe zone
    if (this.gameMode === 'battle-royale' && this.battleRoyaleState.active) {
      this.drawSafeZone();
    }
    
    // Draw food (only visible ones)
    this.visibleEntities.foods.forEach(food => {
      food.draw(this.ctx);
    });
    
    // Draw viruses (only visible ones)
    this.visibleEntities.viruses.forEach(virus => {
      virus.draw(this.ctx);
    });
    
    // Draw power-ups (only visible ones)
    this.visibleEntities.powerUps.forEach(powerUp => {
      powerUp.draw(this.ctx);
    });
    
    // Draw particles
    this.particles.draw(this.ctx);
    
    // Draw AI players (only visible ones)
    this.visibleEntities.ais.forEach(ai => {
      ai.draw(this.ctx);
    });
    
    // Draw player
    if (this.player && !this.player.isDead) {
      this.player.draw(this.ctx);
    }
    
    // Restore context state
    this.ctx.restore();
    
    // Draw UI elements
    this.drawUI();
  }
  
  drawBackground() {
    // Create a pattern that moves slightly with the camera for parallax effect
    const offsetX = (this.camera.x * 0.1) % this.gridSize;
    const offsetY = (this.camera.y * 0.1) % this.gridSize;
    
    // Fill the visible area with the pattern
    const pattern = this.ctx.createPattern(this.backgroundPattern, 'repeat');
    this.ctx.save();
    this.ctx.translate(offsetX, offsetY);
    this.ctx.fillStyle = pattern;
    
    const viewportLeft = this.camera.x - this.width / (2 * this.camera.scale);
    const viewportTop = this.camera.y - this.height / (2 * this.camera.scale);
    const viewportWidth = this.width / this.camera.scale;
    const viewportHeight = this.height / this.camera.scale;
    
    this.ctx.fillRect(
      viewportLeft - offsetX, 
      viewportTop - offsetY, 
      viewportWidth, 
      viewportHeight
    );
    this.ctx.restore();
  }
  
  createBackgroundPattern() {
    // Create an offscreen canvas for the pattern
    const patternCanvas = document.createElement('canvas');
    const patternCtx = patternCanvas.getContext('2d');
    patternCanvas.width = this.gridSize * 2;
    patternCanvas.height = this.gridSize * 2;
    
    // Fill with base color
    patternCtx.fillStyle = '#f0f0f0';
    patternCtx.fillRect(0, 0, patternCanvas.width, patternCanvas.height);
    
    // Add subtle gradient
    const gradient = patternCtx.createRadialGradient(
      patternCanvas.width / 2, patternCanvas.height / 2, 0,
      patternCanvas.width / 2, patternCanvas.height / 2, patternCanvas.width / 2
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(200, 200, 200, 0.1)');
    
    patternCtx.fillStyle = gradient;
    patternCtx.fillRect(0, 0, patternCanvas.width, patternCanvas.height);
    
    // Add subtle dots
    patternCtx.fillStyle = 'rgba(0, 0, 0, 0.03)';
    for (let i = 0; i < 10; i++) {
      const x = Math.random() * patternCanvas.width;
      const y = Math.random() * patternCanvas.height;
      const radius = Math.random() * 2 + 1;
      
      patternCtx.beginPath();
      patternCtx.arc(x, y, radius, 0, Math.PI * 2);
      patternCtx.fill();
    }
    
    return patternCanvas;
  }
  
  drawGrid() {
    const startX = Math.floor((this.camera.x - this.width / (2 * this.camera.scale)) / this.gridSize) * this.gridSize;
    const startY = Math.floor((this.camera.y - this.height / (2 * this.camera.scale)) / this.gridSize) * this.gridSize;
    const endX = Math.ceil((this.camera.x + this.width / (2 * this.camera.scale)) / this.gridSize) * this.gridSize;
    const endY = Math.ceil((this.camera.y + this.height / (2 * this.camera.scale)) / this.gridSize) * this.gridSize;
    
    this.ctx.strokeStyle = '#ddd';
    this.ctx.lineWidth = 1;
    
    // Draw vertical lines
    for (let x = startX; x <= endX; x += this.gridSize) {
      if (x < 0 || x > this.worldSize) continue;
      this.ctx.beginPath();
      this.ctx.moveTo(x, Math.max(0, startY));
      this.ctx.lineTo(x, Math.min(this.worldSize, endY));
      this.ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = startY; y <= endY; y += this.gridSize) {
      if (y < 0 || y > this.worldSize) continue;
      this.ctx.beginPath();
      this.ctx.moveTo(Math.max(0, startX), y);
      this.ctx.lineTo(Math.min(this.worldSize, endX), y);
      this.ctx.stroke();
    }
  }
  
  drawWorldBorder() {
    this.ctx.strokeStyle = '#ff0000';
    this.ctx.lineWidth = 5;
    this.ctx.strokeRect(0, 0, this.worldSize, this.worldSize);
  }
  
  drawSafeZone() {
    // Draw safe zone border
    this.ctx.beginPath();
    this.ctx.arc(
      this.battleRoyaleState.safeZoneX,
      this.battleRoyaleState.safeZoneY,
      this.battleRoyaleState.safeZoneRadius,
      0, Math.PI * 2
    );
    this.ctx.strokeStyle = 'rgba(0, 200, 255, 0.8)';
    this.ctx.lineWidth = 5;
    this.ctx.stroke();
    
    // Draw danger zone overlay
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'source-over';
    
    // Create a clip path for everything outside the safe zone
    this.ctx.beginPath();
    this.ctx.rect(0, 0, this.worldSize, this.worldSize);
    this.ctx.arc(
      this.battleRoyaleState.safeZoneX,
      this.battleRoyaleState.safeZoneY,
      this.battleRoyaleState.safeZoneRadius,
      0, Math.PI * 2, true
    );
    this.ctx.clip();
    
    // Draw danger zone with animation
    const dangerAlpha = 0.2 + Math.sin(this.gameTime * 2) * 0.05;
    this.ctx.fillStyle = `rgba(255, 0, 0, ${dangerAlpha})`;
    this.ctx.fillRect(0, 0, this.worldSize, this.worldSize);
    
    this.ctx.restore();
  }
  
  drawUI() {
    // Draw FPS counter
    this.ctx.font = '14px Arial';
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillText(`FPS: ${this.stats.fps}`, 10, 20);
    
    // Draw entity count
    this.ctx.fillText(`Entities: ${this.stats.entitiesRendered}`, 10, 40);
    
    // Draw minimap
    this.miniMap.draw(this.ctx);
    
    // Draw team scores in team mode
    if (this.gameMode === 'teams') {
      this.drawTeamScores();
    }
    
    // Draw battle royale info
    if (this.gameMode === 'battle-royale' && this.battleRoyaleState.active) {
      this.drawBattleRoyaleInfo();
    }
  }
  drawTeamScores() {
    const teamNames = Object.keys(this.teams);
    const scoreHeight = 30;
    const totalHeight = teamNames.length * scoreHeight;
    const startY = 50;
    
    teamNames.forEach((team, index) => {
      const y = startY + index * scoreHeight;
      const score = Math.floor(this.teams[team].score);
      
      // Draw team color indicator
      this.ctx.fillStyle = this.getTeamColor(team);
      this.ctx.fillRect(10, y, 20, 20);
      
      // Draw team name and score
      this.ctx.font = '16px Arial';
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillText(`${team.toUpperCase()}: ${score}`, 40, y + 15);
    });
  }
  
  drawBattleRoyaleInfo() {
    const elapsed = this.gameTime - this.battleRoyaleState.shrinkStartTime;
    const remaining = Math.max(0, this.battleRoyaleState.shrinkDuration - elapsed);
    const minutes = Math.floor(remaining / 60);
    const seconds = Math.floor(remaining % 60);
    
    // Draw time remaining
    this.ctx.font = '16px Arial';
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillText(
      `Safe Zone: ${minutes}:${seconds.toString().padStart(2, '0')}`,
      10, 40
    );
    
    // Draw players remaining
    const playersRemaining = 1 + this.ais.length; // Player + AIs
    this.ctx.fillText(`Players: ${playersRemaining}`, 10, 60);
    
    // Draw danger zone indicator
    if (this.player && !this.player.isDead) {
      const dx = this.player.x - this.battleRoyaleState.safeZoneX;
      const dy = this.player.y - this.battleRoyaleState.safeZoneY;
      const distanceToCenter = Math.sqrt(dx * dx + dy * dy);
      
      if (distanceToCenter > this.battleRoyaleState.safeZoneRadius) {
        // Player is outside safe zone - show warning
        this.ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
        this.ctx.fillText('WARNING: Outside Safe Zone!', 10, 80);
        
        // Draw direction arrow to safe zone
        const arrowSize = 30;
        const arrowX = this.width - arrowSize - 20;
        const arrowY = 80;
        
        // Calculate angle to safe zone
        const angle = Math.atan2(
          this.battleRoyaleState.safeZoneY - this.player.y,
          this.battleRoyaleState.safeZoneX - this.player.x
        );
        
        this.ctx.save();
        this.ctx.translate(arrowX, arrowY);
        this.ctx.rotate(angle);
        
        // Draw arrow
        this.ctx.beginPath();
        this.ctx.moveTo(arrowSize / 2, 0);
        this.ctx.lineTo(-arrowSize / 2, -arrowSize / 3);
        this.ctx.lineTo(-arrowSize / 2, arrowSize / 3);
        this.ctx.closePath();
        this.ctx.fillStyle = 'rgba(0, 200, 255, 0.8)';
        this.ctx.fill();
        
        this.ctx.restore();
      }
    }
  }
  
  showAnnouncement(message, duration = 3000) {
    // Create announcement element if it doesn't exist
    let announcement = document.getElementById('game-announcement');
    if (!announcement) {
      announcement = document.createElement('div');
      announcement.id = 'game-announcement';
      announcement.style.position = 'absolute';
      announcement.style.top = '20%';
      announcement.style.left = '50%';
      announcement.style.transform = 'translate(-50%, -50%)';
      announcement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      announcement.style.color = 'white';
      announcement.style.padding = '15px 30px';
      announcement.style.borderRadius = '5px';
      announcement.style.fontSize = '24px';
      announcement.style.fontWeight = 'bold';
      announcement.style.textAlign = 'center';
      announcement.style.zIndex = '1000';
      announcement.style.opacity = '0';
      announcement.style.transition = 'opacity 0.5s';
      document.body.appendChild(announcement);
    }
    
    // Set message and show announcement
    announcement.textContent = message;
    announcement.style.opacity = '1';
    
    // Hide after duration
    setTimeout(() => {
      announcement.style.opacity = '0';
    }, duration);
  }
  
  centerCamera() {
    if (!this.player) return;
    
    // Calculate target camera position (player's position)
    const targetX = this.player.x;
    const targetY = this.player.y;
    
    // Apply smoothing to camera movement
    this.camera.x += (targetX - this.camera.x) * this.cameraSmoothing;
    this.camera.y += (targetY - this.camera.y) * this.cameraSmoothing;
    
    // Adjust scale based on player size
    const targetScale = Math.max(0.4, Math.min(1, 40 / this.player.radius));
    
    // Smooth scale transition
    this.camera.scale += (targetScale - this.camera.scale) * 0.05;
    
    // Add slight camera shake when player is damaged
    if (this.player.effects.some(effect => effect.type === 'damage')) {
      const shakeAmount = 5 / this.camera.scale;
      this.camera.x += (Math.random() * 2 - 1) * shakeAmount;
      this.camera.y += (Math.random() * 2 - 1) * shakeAmount;
    }
  }
  
  updateViewport() {
    this.width = this.canvas.width;
    this.height = this.canvas.height;
  }
  
  isInViewport(x, y, radius) {
    const viewportLeft = this.camera.x - this.width / (2 * this.camera.scale);
    const viewportRight = this.camera.x + this.width / (2 * this.camera.scale);
    const viewportTop = this.camera.y - this.height / (2 * this.camera.scale);
    const viewportBottom = this.camera.y + this.height / (2 * this.camera.scale);
    
    return (
      x + radius > viewportLeft &&
      x - radius < viewportRight &&
      y + radius > viewportTop &&
      y - radius < viewportBottom
    );
  }
  
  getLeaderboard() {
    const entities = [];
    
    if (this.player && !this.player.isDead) {
      entities.push({
        id: 'player',
        name: this.player.name,
        score: this.player.score,
        color: this.player.color,
        team: this.player.team
      });
    }
    
    this.ais.forEach(ai => {
      if (!ai.isDead) {
        entities.push({
          id: ai.id,
          name: ai.name,
          score: ai.score,
          color: ai.color,
          team: ai.team
        });
      }
    });
    
    return entities
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }
  
  getRandomColor() {
    const colors = [
      '#ff5252', '#4caf50', '#2196f3', '#ff9800', '#9c27b0',
      '#e91e63', '#3f51b5', '#009688', '#ffeb3b', '#795548'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  // Helper method to check if two circles are colliding
  checkCircleCollision(x1, y1, r1, x2, y2, r2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < r1 + r2;
  }
  
  // Helper method to resolve collision between two circles
  resolveCircleCollision(x1, y1, r1, m1, x2, y2, r2, m2, elasticity = 0.5) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // If circles are not colliding, return original positions
    if (distance >= r1 + r2) {
      return { x1, y1, x2, y2 };
    }
    
    // Calculate unit vector along the collision axis
    const nx = dx / distance;
    const ny = dy / distance;
    
    // Calculate overlap
    const overlap = r1 + r2 - distance;
    
    // Move circles apart based on their mass
    const totalMass = m1 + m2;
    const m1Ratio = m2 / totalMass;
    const m2Ratio = m1 / totalMass;
    
    // Apply position correction with elasticity
    const correction1 = overlap * m1Ratio * elasticity;
    const correction2 = overlap * m2Ratio * elasticity;
    
    const newX1 = x1 - nx * correction1;
    const newY1 = y1 - ny * correction1;
    const newX2 = x2 + nx * correction2;
    const newY2 = y2 + ny * correction2;
    
    return { x1: newX1, y1: newY1, x2: newX2, y2: newY2 };
  }
  
  // Helper method to apply attraction between entities
  applyAttraction(entity1, entity2, strength = 0.1, maxDistance = 200) {
    const dx = entity2.x - entity1.x;
    const dy = entity2.y - entity1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0 && distance < maxDistance) {
      const force = strength * (1 - distance / maxDistance);
      const forceX = (dx / distance) * force;
      const forceY = (dy / distance) * force;
      
      return { forceX, forceY };
    }
    
    return { forceX: 0, forceY: 0 };
  }
  
  // Helper method to check if a point is inside a cell with membrane
  isPointInCell(x, y, cell) {
    // Simple circle check first for performance
    const dx = x - cell.x;
    const dy = y - cell.y;
    const distanceSquared = dx * dx + dy * dy;
    
    if (distanceSquared > cell.radius * cell.radius) {
      return false; // Definitely outside
    }
    
    // If cell has a membrane, do more precise check
    if (cell.membrane && cell.membrane.vertices && cell.membrane.vertices.length > 0) {
      // Convert point to local cell coordinates
      const localX = dx / cell.radius;
      const localY = dy / cell.radius;
      
      // Get angle of point
      const angle = Math.atan2(localY, localX);
      
      // Find the two vertices that surround this angle
      let v1, v2;
      for (let i = 0; i < cell.membrane.vertices.length; i++) {
        const vertex = cell.membrane.vertices[i];
        if (vertex.angle > angle) {
          v2 = vertex;
          v1 = cell.membrane.vertices[i > 0 ? i - 1 : cell.membrane.vertices.length - 1];
          break;
        }
      }
      
      // If we didn't find vertices, use the last and first
      if (!v1 || !v2) {
        v1 = cell.membrane.vertices[cell.membrane.vertices.length - 1];
        v2 = cell.membrane.vertices[0];
      }
      
      // Calculate the membrane radius at this angle by interpolating between vertices
      const t = (angle - v1.angle) / (v2.angle - v1.angle);
      const r1 = 1 + v1.distortionX * Math.cos(v1.angle) + v1.distortionY * Math.sin(v1.angle);
      const r2 = 1 + v2.distortionX * Math.cos(v2.angle) + v2.distortionY * Math.sin(v2.angle);
      const membraneRadius = r1 + t * (r2 - r1);
      
      // Check if point is inside membrane
      const pointRadius = Math.sqrt(localX * localX + localY * localY);
      return pointRadius <= membraneRadius;
    }
    
    // Fallback to simple circle check
    return true;
  }
  
  // Helper method to create a visual effect at a position
  createEffect(x, y, type, options = {}) {
    switch (type) {
      case 'explosion':
        this.particles.createExplosion(x, y, options.color || '#ff5252', options.size || 30);
        break;
      case 'ripple':
        this.particles.createRipple(x, y, options.color || 'rgba(255, 255, 255, 0.5)', options.size || 50);
        break;
      case 'text':
        this.particles.createTextEffect(x, y, options.text || '', options.color || 'white');
        break;
    }
  }
}
