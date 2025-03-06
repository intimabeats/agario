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
    this.foodCount = 1000;
    this.aiCount = 20;
    this.virusCount = 25;
    this.powerUpCount = 12;
    
    // Physics settings
    this.cellCollisionElasticity = 0.7;
    this.cellRepulsionForce = 0.05; // Reduced for better overlapping
    this.foodAttractionRadius = 5;
    
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
    
    // Entity removal queues to avoid modification during iteration
    this.removalQueues = {
      foods: [],
      viruses: [],
      powerUps: [],
      ais: []
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
    
    // Process removal queues
    this.processRemovalQueues();
    
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
      } else {
        // Queue dead AIs for removal
        this.removalQueues.ais.push(ai);
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
  
  // Helper methods for entity removal
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
  
  updateSpatialGrid() {
    // Clear the grid
    this.spatialGrid = {};
    
    // Helper function to add entity to grid
    const addToGrid = (entity, type) => {
      const cellX = Math.floor(entity.x / this.gridCellSize);
      const cellY = Math.floor(entity.y / this.gridCellSize);
      const cellKey = `${cellX},${cellY}`;
      
      if (!this.spatialGrid[cellKey]) {
        this.spatialGrid[cellKey] = { 
          foods: [], 
          ais: [], 
          viruses: [], 
          powerUps: [],
          player: []
        };
      }
      
      this.spatialGrid[cellKey][type].push(entity);
    };
    
    // Add foods to grid
    this.foods.forEach(food => addToGrid(food, 'foods'));
    
    // Add AIs to grid
    this.ais.forEach(ai => {
      if (ai && ai.cells) {
        ai.cells.forEach(cell => {
          if (cell) {
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
      if (virus) {
        addToGrid(virus, 'viruses');
      }
    });
    
    // Add power-ups to grid
    this.powerUps.forEach(powerUp => {
      if (powerUp) {
        addToGrid(powerUp, 'powerUps');
      }
    });
    
    // Add player cells to grid
    if (this.player && !this.player.isDead && this.player.cells) {
      this.player.cells.forEach(cell => {
        if (cell) {
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
            if (this.spatialGrid[cellKey][type]) {
              this.spatialGrid[cellKey][type].forEach(entity => {
                if (entity) {
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
    
    // Collect all entities for z-index sorting
    const allEntities = [];
    
    // Add food (only visible ones)
    this.visibleEntities.foods.forEach(food => {
      allEntities.push({
        entity: food,
        type: 'food',
        z: 0,
        x: food.x,
        y: food.y
      });
    });
    
    // Add viruses (only visible ones)
    this.visibleEntities.viruses.forEach(virus => {
      allEntities.push({
        entity: virus,
        type: 'virus',
        z: 5, // Viruses are above most entities
        x: virus.x,
        y: virus.y
      });
    });
    
    // Add power-ups (only visible ones)
    this.visibleEntities.powerUps.forEach(powerUp => {
      allEntities.push({
        entity: powerUp,
        type: 'powerUp',
        z: 1,
        x: powerUp.x,
        y: powerUp.y
      });
    });
    
    // Add AI cells (only visible ones)
    this.visibleEntities.ais.forEach(ai => {
      if (ai.isDead) return;
      
      ai.cells.forEach(cell => {
        allEntities.push({
          entity: ai,
          cell: cell,
          type: 'ai',
          z: cell.z || 10, // Default z-index for cells
          x: cell.x,
          y: cell.y
        });
      });
    });
    
    // Add player cells
    if (this.player && !this.player.isDead) {
      this.player.cells.forEach(cell => {
        allEntities.push({
          entity: this.player,
          cell: cell,
          type: 'player',
          z: cell.z || 10, // Default z-index for cells
          x: cell.x,
          y: cell.y
        });
      });
    }
    
    // Sort entities by z-index (lower z-index is drawn first)
    allEntities.sort((a, b) => a.z - b.z);
    
    // Draw particles below entities
    this.particles.draw(this.ctx);
    
    // Draw all entities in order
    allEntities.forEach(item => {
      switch (item.type) {
        case 'food':
          item.entity.draw(this.ctx);
          break;
        case 'virus':
          item.entity.draw(this.ctx);
          break;
        case 'powerUp':
          item.entity.draw(this.ctx);
          break;
        case 'ai':
          // Draw only this specific cell
          this.drawAICell(this.ctx, item.entity, item.cell);
          break;
        case 'player':
          // Draw only this specific cell
          this.drawPlayerCell(this.ctx, item.entity, item.cell);
          break;
      }
    });
    
    // Restore context state
    this.ctx.restore();
    
    // Draw UI elements
    this.drawUI();
  }
  
  // Helper method to draw a single AI cell
  drawAICell(ctx, ai, cell) {
    // Save context for potential transformations
    ctx.save();
    
    // Draw cell with membrane
    ai.drawCellWithMembrane(ctx, cell);
    
    // Draw AI name
    if (cell.radius > 20) {
      ctx.font = `${Math.min(16, cell.radius / 2)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'white';
      ctx.fillText(ai.name, cell.x, cell.y);
      
      // Draw score if cell is big enough
      if (cell.radius > 40) {
        ctx.font = `${Math.min(12, cell.radius / 3)}px Arial`;
        ctx.fillText(Math.floor(ai.score), cell.x, cell.y + Math.min(16, cell.radius / 2) + 2);
      }
    }
    
    // Draw team indicator if in team mode
    if (this.gameMode === 'teams' && ai.team) {
      ctx.beginPath();
      ctx.arc(cell.x, cell.y, cell.radius + 5, 0, Math.PI * 2);
      ctx.lineWidth = 3;
      ctx.strokeStyle = this.getTeamColor(ai.team);
      ctx.stroke();
    }
    
    // Restore context
    ctx.restore();
  }
  
  // Helper method to draw a single player cell
  drawPlayerCell(ctx, player, cell) {
    // Save context for potential transformations
    ctx.save();
    
    // Apply invisibility
    const opacity = player.powerUps.invisibility.active ? player.powerUps.invisibility.opacity : 1;
    ctx.globalAlpha = opacity;
    
    // Draw cell with membrane
    player.drawCellWithMembrane(ctx, cell, opacity);
    
    // Draw player name
    if (cell.radius > 20) {
      ctx.font = `${Math.min(16, cell.radius / 2)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'white';
      ctx.fillText(player.name, cell.x, cell.y);
      
      // Draw level and score if cell is big enough
      if (cell.radius > 40) {
        ctx.font = `${Math.min(12, cell.radius / 3)}px Arial`;
        ctx.fillText(`Lvl ${player.level} - ${Math.floor(player.score)}`, cell.x, cell.y + Math.min(16, cell.radius / 2) + 2);
      }
    }
    
    // Reset opacity
    ctx.globalAlpha = 1;
    
    // Draw team indicator if in team mode
    if (this.gameMode === 'teams' && player.team) {
      ctx.beginPath();
      ctx.arc(cell.x, cell.y, cell.radius + 5, 0, Math.PI * 2);
      ctx.lineWidth = 3;
      ctx.strokeStyle = this.getTeamColor(player.team);
      ctx.stroke();
    }
    
    // Restore context
    ctx.restore();
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
    if (this.player.effects && this.player.effects.some(effect => effect.type === 'damage')) {
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
  
  // Helper method to calculate overlap percentage between two circles
  calculateOverlap(x1, y1, r1, x2, y2, r2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // If circles don't overlap at all
    if (distance >= r1 + r2) {
      return 0;
    }
    
    // Calculate overlap
    const overlap = (r1 + r2 - distance) / 2;
    
    // Calculate overlap percentage relative to the smaller circle
    return overlap / Math.min(r1, r2);
  }
  
  // Helper method to check if one circle can eat another
  canEat(x1, y1, r1, x2, y2, r2) {
    // Size threshold for eating
    const sizeRatio = r1 / r2;
    
    // Calculate overlap percentage
    const overlapPercentage = this.calculateOverlap(x1, y1, r1, x2, y2, r2);
    
    // Can eat if significantly larger and overlap is sufficient
    return sizeRatio > 1.1 && overlapPercentage > 0.9;
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
