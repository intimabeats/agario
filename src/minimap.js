export class MiniMap {
  constructor(game) {
    this.game = game;
    this.size = 150; // Size of the minimap
    this.padding = 10; // Padding from the edge of the screen
    this.opacity = 0.7; // Opacity of the minimap
    this.borderWidth = 2; // Border width
  }
  
  draw(ctx) {
    const { width, height } = this.game;
    
    // Position in bottom right corner
    const x = width - this.size - this.padding;
    const y = height - this.size - this.padding;
    
    // Draw background
    ctx.fillStyle = `rgba(0, 0, 0, ${this.opacity})`;
    ctx.fillRect(x, y, this.size, this.size);
    
    // Draw border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = this.borderWidth;
    ctx.strokeRect(x, y, this.size, this.size);
    
    // Calculate scale factor
    const scale = this.size / this.game.worldSize;
    
    // Draw food (as dots)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    this.game.foods.forEach(food => {
      ctx.beginPath();
      ctx.arc(
        x + food.x * scale,
        y + food.y * scale,
        1,
        0, Math.PI * 2
      );
      ctx.fill();
    });
    
    // Draw viruses
    ctx.fillStyle = '#33ff33';
    this.game.viruses.forEach(virus => {
      ctx.beginPath();
      ctx.arc(
        x + virus.x * scale,
        y + virus.y * scale,
        virus.radius * scale,
        0, Math.PI * 2
      );
      ctx.fill();
    });
    
    // Draw power-ups
    this.game.powerUps.forEach(powerUp => {
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
    
    // Draw AI players
    this.game.ais.forEach(ai => {
      if (ai.isDead) return;
      
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
    
    // Draw player
    if (this.game.player && !this.game.player.isDead) {
      ctx.fillStyle = this.game.player.color;
      this.game.player.cells.forEach(cell => {
        ctx.beginPath();
        ctx.arc(
          x + cell.x * scale,
          y + cell.y * scale,
          cell.radius * scale,
          0, Math.PI * 2
        );
        ctx.fill();
      });
    }
    
    // Draw viewport rectangle
    const viewportWidth = this.game.width / this.game.camera.scale;
    const viewportHeight = this.game.height / this.game.camera.scale;
    
    const viewportX = this.game.camera.x - viewportWidth / 2;
    const viewportY = this.game.camera.y - viewportHeight / 2;
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      x + viewportX * scale,
      y + viewportY * scale,
      viewportWidth * scale,
      viewportHeight * scale
    );
    
    // Draw battle royale safe zone if active
    if (this.game.gameMode === 'battle-royale' && this.game.battleRoyaleState.active) {
      ctx.beginPath();
      ctx.arc(
        x + this.game.battleRoyaleState.safeZoneX * scale,
        y + this.game.battleRoyaleState.safeZoneY * scale,
        this.game.battleRoyaleState.safeZoneRadius * scale,
        0, Math.PI * 2
      );
      ctx.strokeStyle = 'rgba(0, 200, 255, 0.8)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    
    // Draw minimap label
    ctx.font = '10px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText('MINIMAP', x + this.size / 2, y - 5);
  }
}
