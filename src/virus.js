export class Virus {
  constructor(x, y, game) {
    this.x = x;
    this.y = y;
    this.game = game;
    this.radius = 30;
    this.mass = Math.PI * this.radius * this.radius;
    this.color = '#33ff33';
    this.spikes = 16; // Number of spikes
  }
  
  draw(ctx) {
    // Draw virus body
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#33ff33';
    ctx.fill();
    
    // Draw spikes
    ctx.beginPath();
    for (let i = 0; i < this.spikes; i++) {
      const angle = (i / this.spikes) * Math.PI * 2;
      const spikeOuterX = this.x + Math.cos(angle) * (this.radius + 10);
      const spikeOuterY = this.y + Math.sin(angle) * (this.radius + 10);
      const spikeInnerX = this.x + Math.cos(angle + 0.2) * this.radius;
      const spikeInnerY = this.y + Math.sin(angle + 0.2) * this.radius;
      const spikeInnerX2 = this.x + Math.cos(angle - 0.2) * this.radius;
      const spikeInnerY2 = this.y + Math.sin(angle - 0.2) * this.radius;
      
      if (i === 0) {
        ctx.moveTo(spikeInnerX, spikeInnerY);
      }
      
      ctx.lineTo(spikeOuterX, spikeOuterY);
      ctx.lineTo(spikeInnerX2, spikeInnerY2);
    }
    
    ctx.fillStyle = '#33ff33';
    ctx.fill();
    
    // Draw inner circle
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = '#2a2';
    ctx.fill();
  }
}
