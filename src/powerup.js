export class PowerUp {
  constructor(x, y, game) {
    this.x = x;
    this.y = y;
    this.game = game;
    this.radius = 15;
    this.type = this.getRandomType();
    this.color = this.getColorByType();
    this.pulsePhase = 0;
    this.glowIntensity = 0;
  }
  
  update() {
    // Update pulse animation
    this.pulsePhase += 0.05;
    this.glowIntensity = Math.sin(this.pulsePhase) * 0.5 + 0.5;
  }
  
  draw(ctx) {
    // Draw glow effect
    const gradient = ctx.createRadialGradient(
      this.x, this.y, this.radius * 0.5,
      this.x, this.y, this.radius * 2
    );
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.globalAlpha = 0.3 * this.glowIntensity;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.globalAlpha = 1;
    
    // Draw power-up body
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    
    // Draw power-up icon
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    let icon = '';
    switch (this.type) {
      case 'speed':
        icon = '⚡';
        break;
      case 'shield':
        icon = '🛡️';
        break;
      case 'mass':
        icon = '⬆️';
        break;
    }
    
    ctx.fillText(icon, this.x, this.y);
  }
  
  getRandomType() {
    const types = ['speed', 'shield', 'mass'];
    return types[Math.floor(Math.random() * types.length)];
  }
  
  getColorByType() {
    switch (this.type) {
      case 'speed':
        return '#00bcd4'; // Cyan
      case 'shield':
        return '#673ab7'; // Purple
      case 'mass':
        return '#ffc107'; // Amber
      default:
        return '#ffffff'; // White
    }
  }
}
