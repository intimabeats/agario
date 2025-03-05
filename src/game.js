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
    
    // Game settings
    this.foodCount = 600;
    this.aiCount = 20;
    this.virusCount = 25;
    this.powerUpCount = 8;
    
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
      lastFpsUpdate: 0
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
    
    // Replenish food
    while (this.foods.length < this.foodCount) {
      this.foods.push(new Food(
        Math.random() * this.worldSize,
        Math.random() * this.worldSize,
        this
      ));
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
    
    // Draw food
    this.foods.forEach(food => {
      if (this.isInViewport(food.x, food.y, food.radius)) {
        food.draw(this.ctx);
      }
    });
    
    // Draw viruses
    this.viruses.forEach(virus => {
      if (this.isInViewport(virus.x, virus.y, virus.radius)) {
        virus.draw(this.ctx);
      }
    });
    
    // Draw power-ups
    this.powerUps.forEach(powerUp => {
      if (this.isInViewport(powerUp.x, powerUp.y, powerUp.radius)) {
        powerUp.draw(this.ctx);
      }
    });
    
    // Draw particles
    this.particles.draw(this.ctx);
    
    // Draw AI players
    this.ais.forEach(ai => {
      if (!ai.isDead && this.isInViewport(ai.x, ai.y, ai.radius)) {
        ai.draw(this.ctx);
      }
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
    
    this.camera.x = this.player.x;
    this.camera.y = this.player.y;
    
    // Adjust scale based on player size
    const targetScale = Math.max(0.4, Math.min(1, 40 / this.player.radius));
    
    // Smooth scale transition
    this.camera.scale += (targetScale - this.camera.scale) * 0.1;
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
}
