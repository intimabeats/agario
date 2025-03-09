export class MiniMap {
  constructor(game) {
    this.game = game;
    this.size = 150; // Size of the minimap
    this.padding = 10; // Padding from the edge of the screen
    this.opacity = 0.7; // Opacity of the minimap
    this.borderWidth = 2; // Border width
    this.borderColor = 'rgba(255, 255, 255, 0.5)'; // Border color
    this.backgroundColor = 'rgba(0, 0, 0, 0.7)'; // Background color
    
    // Customization options
    this.showFood = true; // Whether to show food dots
    this.showPowerUps = true; // Whether to show power-ups
    this.showViruses = true; // Whether to show viruses
    this.showPlayers = true; // Whether to show players
    this.showViewport = true; // Whether to show viewport rectangle
    this.showSafeZone = true; // Whether to show battle royale safe zone
    
    // Visual settings
    this.foodColor = 'rgba(255, 255, 255, 0.3)';
    this.virusColor = '#33ff33';
    this.viewportColor = 'rgba(255, 255, 255, 0.8)';
    this.safeZoneColor = 'rgba(0, 200, 255, 0.8)';
    
    // Animation properties
    this.pulsePhase = 0;
    this.pulseSpeed = 1.5;
    this.pulseAmount = 0.05;
    
    // Interaction properties
    this.isInteractive = true; // Whether clicking on minimap moves the player
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    
    // Performance optimization
    this.lastUpdateTime = 0;
    this.updateInterval = 500; // Update minimap data every 500ms
    this.cachedEntities = {
      foods: [],
      viruses: [],
      powerUps: [],
      ais: [],
      player: null
    };
    
    // Initialize
    this.init();
  }
  
  init() {
    // Create minimap container if it doesn't exist
    let container = document.getElementById('minimap-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'minimap-container';
      document.body.appendChild(container);
    }
    
    // Set up event listeners for interaction
    if (this.isInteractive) {
      container.addEventListener('mousedown', this.handleMouseDown.bind(this));
      document.addEventListener('mousemove', this.handleMouseMove.bind(this));
      document.addEventListener('mouseup', this.handleMouseUp.bind(this));
      
      // Touch events for mobile
      container.addEventListener('touchstart', this.handleTouchStart.bind(this));
      document.addEventListener('touchmove', this.handleTouchMove.bind(this));
      document.addEventListener('touchend', this.handleTouchUp.bind(this));
    }
  }
  
  handleMouseDown(e) {
    if (!this.isInteractive) return;
    
    this.isDragging = true;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
    
    // Move player to clicked location on minimap
    this.movePlayerToMinimapPosition(e.offsetX, e.offsetY);
    
    e.preventDefault();
  }
  
  handleMouseMove(e) {
    if (!this.isInteractive || !this.isDragging) return;
    
    // Continue moving player as mouse moves
    const container = document.getElementById('minimap-container');
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (x >= 0 && x <= this.size && y >= 0 && y <= this.size) {
      this.movePlayerToMinimapPosition(x, y);
    }
    
    e.preventDefault();
  }
  
  handleMouseUp() {
    this.isDragging = false;
  }
  
  handleTouchStart(e) {
    if (!this.isInteractive || e.touches.length === 0) return;
    
    this.isDragging = true;
    this.dragStartX = e.touches[0].clientX;
    this.dragStartY = e.touches[0].clientY;
    
    // Move player to touched location on minimap
    const rect = e.target.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;
    
    this.movePlayerToMinimapPosition(x, y);
    
    e.preventDefault();
  }
  
  handleTouchMove(e) {
    if (!this.isInteractive || !this.isDragging || e.touches.length === 0) return;
    
    // Continue moving player as touch moves
    const container = document.getElementById('minimap-container');
    const rect = container.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;
    
    if (x >= 0 && x <= this.size && y >= 0 && y <= this.size) {
      this.movePlayerToMinimapPosition(x, y);
    }
    
    e.preventDefault();
  }
  
  handleTouchUp() {
    this.isDragging = false;
  }
  
  movePlayerToMinimapPosition(x, y) {
    if (!this.game.player || this.game.player.isDead) return;
    
    // Convert minimap coordinates to world coordinates
    const scale = this.size / this.game.worldSize;
    const worldX = x / scale;
    const worldY = y / scale;
    
    // Set player target
    this.game.player.targetX = worldX;
    this.game.player.targetY = worldY;
  }
  
  update(deltaTime) {
    // Update pulse animation
    this.pulsePhase += this.pulseSpeed * deltaTime;
    
    // Update cached entities periodically for performance
    const now = Date.now();
    if (now - this.lastUpdateTime > this.updateInterval) {
      this.updateCachedEntities();
      this.lastUpdateTime = now;
    }
  }
  
  updateCachedEntities() {
    // Cache a subset of entities for minimap rendering
    // This improves performance by not processing all entities every frame
    
    // Cache food (sample only a portion for performance)
    this.cachedEntities.foods = this.game.foods.filter(() => Math.random() < 0.1);
    
    // Cache viruses
    this.cachedEntities.viruses = [...this.game.viruses];
    
    // Cache power-ups
    this.cachedEntities.powerUps = [...this.game.powerUps];
    
    // Cache AI players
    this.cachedEntities.ais = this.game.ais.filter(ai => !ai.isDead);
    
    // Cache player
    this.cachedEntities.player = this.game.player && !this.game.player.isDead ? this.game.player : null;
  }
  
  draw(ctx) {
    const { width, height } = this.game;
    
    // Position in bottom right corner
    const x = width - this.size - this.padding;
    const y = height - this.size - this.padding;
    
    // Draw background
    ctx.fillStyle = this.backgroundColor;
    ctx.fillRect(x, y, this.size, this.size);
    
    // Draw border
    ctx.strokeStyle = this.borderColor;
    ctx.lineWidth = this.borderWidth;
    ctx.strokeRect(x, y, this.size, this.size);
    
    // Calculate scale factor
    const scale = this.size / this.game.worldSize;
    
    // Draw grid
    this.drawGrid(ctx, x, y, scale);
    
    // Draw battle royale safe zone if active
    if (this.showSafeZone && this.game.gameMode === 'battle-royale' && this.game.battleRoyaleState.active) {
      this.drawSafeZone(ctx, x, y, scale);
    }
    
    // Draw food (as dots)
    if (this.showFood) {
      ctx.fillStyle = this.foodColor;
      this.cachedEntities.foods.forEach(food => {
        ctx.beginPath();
        ctx.arc(
          x + food.x * scale,
          y + food.y * scale,
          1,
          0, Math.PI * 2
        );
        ctx.fill();
      });
    }
    
    // Draw viruses
    if (this.showViruses) {
      ctx.fillStyle = this.virusColor;
      this.cachedEntities.viruses.forEach(virus => {
        ctx.beginPath();
        ctx.arc(
          x + virus.x * scale,
          y + virus.y * scale,
          virus.radius * scale,
          0, Math.PI * 2
        );
        ctx.fill();
      });
    }
    
    // Draw power-ups
    if (this.showPowerUps) {
      this.cachedEntities.powerUps.forEach(powerUp => {
        ctx.fillStyle = powerUp.color;
        ctx.beginPath();
        ctx.arc(
          x + powerUp.x * scale,
          y + powerUp.y * scale,
          powerUp.radius * scale * 1.5,
          0, Math.PI * 2
        );
        ctx.fill();
      });
    }
    
    // Draw AI players
    if (this.showPlayers) {
      this.cachedEntities.ais.forEach(ai => {
        ctx.fillStyle = ai.color;
        ai.cells.forEach(cell => {
          ctx.beginPath();
          ctx.arc(
            x + cell.x * scale,
            y + cell.y * scale,
            cell.radius * scale,
            0, Math.PI * 2
          );
          ctx.fill();
        });
      });
    }
    
    // Draw player
    if (this.showPlayers && this.cachedEntities.player) {
      ctx.fillStyle = this.cachedEntities.player.color;
      this.cachedEntities.player.cells.forEach(cell => {
        ctx.beginPath();
        ctx.arc(
          x + cell.x * scale,
          y + cell.y * scale,
          cell.radius * scale,
          0, Math.PI * 2
        );
        ctx.fill();
      });
      
      // Add pulsing highlight around player for better visibility
      const pulseSize = 1 + Math.sin(this.pulsePhase) * this.pulseAmount;
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1;
      
      this.cachedEntities.player.cells.forEach(cell => {
        ctx.beginPath();
        ctx.arc(
          x + cell.x * scale,
          y + cell.y * scale,
          cell.radius * scale * pulseSize * 1.5,
          0, Math.PI * 2
        );
        ctx.stroke();
      });
    }
    
    // Draw viewport rectangle
    if (this.showViewport) {
      const viewportWidth = this.game.width / this.game.camera.scale;
      const viewportHeight = this.game.height / this.game.camera.scale;
      
      const viewportX = this.game.camera.x - viewportWidth / 2;
      const viewportY = this.game.camera.y - viewportHeight / 2;
      
      ctx.strokeStyle = this.viewportColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(
        x + viewportX * scale,
        y + viewportY * scale,
        viewportWidth * scale,
        viewportHeight * scale
      );
    }
    
    // Draw minimap label
    ctx.font = '10px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText('MINIMAP', x + this.size / 2, y - 5);
  }
  
  drawGrid(ctx, x, y, scale) {
    const gridSize = this.game.gridSize;
    const worldSize = this.game.worldSize;
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 0.5;
    
    // Draw vertical grid lines
    for (let i = 0; i <= worldSize; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x + i * scale, y);
      ctx.lineTo(x + i * scale, y + this.size);
      ctx.stroke();
    }
    
    // Draw horizontal grid lines
    for (let i = 0; i <= worldSize; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, y + i * scale);
      ctx.lineTo(x + this.size, y + i * scale);
      ctx.stroke();
    }
  }
  
  drawSafeZone(ctx, x, y, scale) {
    const { safeZoneX, safeZoneY, safeZoneRadius } = this.game.battleRoyaleState;
    
    // Draw safe zone circle
    ctx.beginPath();
    ctx.arc(
      x + safeZoneX * scale,
      y + safeZoneY * scale,
      safeZoneRadius * scale,
      0, Math.PI * 2
    );
    ctx.strokeStyle = this.safeZoneColor;
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Add pulsing effect if zone is shrinking
    if (this.game.battleRoyaleState.isWarning) {
      const pulseSize = 1 + Math.sin(this.pulsePhase * 2) * 0.05;
      
      ctx.beginPath();
      ctx.arc(
        x + safeZoneX * scale,
        y + safeZoneY * scale,
        safeZoneRadius * scale * pulseSize,
        0, Math.PI * 2
      );
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
  
  // Resize minimap based on screen size
  resize() {
    // Adjust minimap size for smaller screens
    if (window.innerWidth < 768) {
      this.size = 100;
    } else {
      this.size = 150;
    }
    
    // Update container size
    const container = document.getElementById('minimap-container');
    if (container) {
      container.style.width = `${this.size}px`;
      container.style.height = `${this.size}px`;
    }
  }
  
  // Toggle minimap visibility
  toggle() {
    const container = document.getElementById('minimap-container');
    if (container) {
      const isVisible = container.style.display !== 'none';
      container.style.display = isVisible ? 'none' : 'block';
      return !isVisible;
    }
    return false;
  }
  
  // Toggle specific minimap features
  toggleFeature(feature) {
    switch (feature) {
      case 'food':
        this.showFood = !this.showFood;
        break;
      case 'viruses':
        this.showViruses = !this.showViruses;
        break;
      case 'powerUps':
        this.showPowerUps = !this.showPowerUps;
        break;
      case 'players':
        this.showPlayers = !this.showPlayers;
        break;
      case 'viewport':
        this.showViewport = !this.showViewport;
        break;
      case 'safeZone':
        this.showSafeZone = !this.showSafeZone;
        break;
    }
  }
}
