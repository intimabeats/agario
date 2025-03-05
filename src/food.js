export class Food {
  constructor(x, y, game) {
    this.x = x;
    this.y = y;
    this.game = game;
    this.radius = 3 + Math.random() * 2;
    this.mass = Math.PI * this.radius * this.radius * 0.1;
    this.color = this.getRandomColor();
    
    // For ejected mass
    this.velocityX = 0;
    this.velocityY = 0;
    this.ejectedBy = null;
    this.ejectionTime = 0;
  }
  
  update() {
    // Update position if this is ejected mass
    if (this.ejectedBy) {
      const now = Date.now();
      const elapsed = now - this.ejectionTime;
      
      if (elapsed < 1000) { // Movement lasts for 1 second
        this.x += this.velocityX * (1 - elapsed / 1000);
        this.y += this.velocityY * (1 - elapsed / 1000);
        
        // Keep within world bounds
        this.x = Math.max(0, Math.min(this.game.worldSize, this.x));
        this.y = Math.max(0, Math.min(this.game.worldSize, this.y));
      }
    }
  }
  
  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
  
  getRandomColor() {
    const colors = [
      '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
      '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
      '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}
