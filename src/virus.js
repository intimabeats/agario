export class Virus {
  constructor(x, y, game) {
    this.x = x;
    this.y = y;
    this.game = game;
    this.radius = 30;
    this.mass = Math.PI * this.radius * this.radius;
    this.baseColor = '#33ff33';
    this.color = this.baseColor;
    this.spikes = 16; // Number of spikes
    
    // Animation properties
    this.pulsePhase = Math.random() * Math.PI * 2; // Random starting phase
    this.pulseSpeed = 0.8 + Math.random() * 0.4; // Random pulse speed
    this.pulseAmount = 0.05; // How much the virus pulses
    this.rotationSpeed = 0.1 + Math.random() * 0.1; // Slow rotation
    this.rotation = Math.random() * Math.PI * 2; // Random starting rotation
    
    // Spike properties
    this.spikeLength = 10; // Base spike length
    this.spikeVariation = 2; // Random variation in spike length
    this.spikeTips = []; // Will store the animated positions of spike tips
    
    // Initialize spike tips
    this.initSpikeTips();
    
    // Interaction properties
    this.dangerRadius = this.radius + this.spikeLength + 5; // Radius for danger detection
    this.lastInteractionTime = 0;
    this.interactionCooldown = 500; // ms between interactions
  }
  
  initSpikeTips() {
    this.spikeTips = [];
    for (let i = 0; i < this.spikes; i++) {
      const angle = (i / this.spikes) * Math.PI * 2;
      const length = this.spikeLength + (Math.random() * 2 - 1) * this.spikeVariation;
      
      this.spikeTips.push({
        angle,
        baseLength: length,
        currentLength: length,
        pulseOffset: Math.random() * Math.PI * 2, // Random phase offset for each spike
        velocityX: 0,
        velocityY: 0
      });
    }
  }
  
  update(deltaTime) {
    // Update pulse animation
    this.pulsePhase += this.pulseSpeed * deltaTime;
    const pulseFactor = 1 + Math.sin(this.pulsePhase) * this.pulseAmount;
    
    // Update rotation
    this.rotation += this.rotationSpeed * deltaTime;
    
    // Update spike tips
    this.spikeTips.forEach(spike => {
      // Apply individual spike pulsing
      const spikePulse = Math.sin(this.pulsePhase + spike.pulseOffset) * 0.2;
      spike.currentLength = spike.baseLength * (1 + spikePulse);
      
      // Apply elasticity to return to base position
      spike.velocityX *= 0.9;
      spike.velocityY *= 0.9;
    });
    
    // Slightly vary color based on pulse
    const intensity = 0.7 + 0.3 * Math.sin(this.pulsePhase);
    const r = Math.floor(51 * intensity);
    const g = Math.floor(255 * intensity);
    const b = Math.floor(51 * intensity);
    this.color = `rgb(${r}, ${g}, ${b})`;
    
    // Check for nearby cells to interact with
    this.checkNearbyEntities();
  }
  
  checkNearbyEntities() {
    const now = Date.now();
    if (now - this.lastInteractionTime < this.interactionCooldown) return;
    
    // Check player cells
    if (this.game.player && !this.game.player.isDead) {
      this.game.player.cells.forEach(cell => {
        const dx = cell.x - this.x;
        const dy = cell.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // If cell is approaching but not yet colliding
        if (distance < this.dangerRadius + cell.radius && distance > this.radius + cell.radius) {
          // React by extending spikes in that direction
          this.reactToEntity(dx, dy, distance, 0.5);
          this.lastInteractionTime = now;
        }
      });
    }
    
    // Check AI cells
    this.game.ais.forEach(ai => {
      if (ai.isDead) return;
      
      ai.cells.forEach(cell => {
        const dx = cell.x - this.x;
        const dy = cell.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // If cell is approaching but not yet colliding
        if (distance < this.dangerRadius + cell.radius && distance > this.radius + cell.radius) {
          // React by extending spikes in that direction
          this.reactToEntity(dx, dy, distance, 0.3);
          this.lastInteractionTime = now;
        }
      });
    });
  }
  
  reactToEntity(dx, dy, distance, intensity) {
    // Normalize direction
    const dirX = dx / distance;
    const dirY = dy / distance;
    
    // Find spikes in the direction of the entity
    this.spikeTips.forEach(spike => {
      const spikeX = Math.cos(spike.angle + this.rotation);
      const spikeY = Math.sin(spike.angle + this.rotation);
      
      // Calculate dot product to determine if spike is pointing towards entity
      const dot = spikeX * dirX + spikeY * dirY;
      
      // If spike is pointing towards entity, extend it
      if (dot > 0.5) {
        spike.currentLength = spike.baseLength * (1 + intensity * dot);
        spike.velocityX += dirX * intensity * 2;
        spike.velocityY += dirY * intensity * 2;
      }
    });
  }
  
  draw(ctx) {
    // Save context for rotation
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    
    // Draw virus body with pulsing effect
    const pulseFactor = 1 + Math.sin(this.pulsePhase) * this.pulseAmount;
    const pulsingRadius = this.radius * pulseFactor;
    
    // Draw glow effect
    const gradient = ctx.createRadialGradient(
      0, 0, pulsingRadius * 0.7,
      0, 0, pulsingRadius + 10
    );
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(1, 'rgba(51, 255, 51, 0)');
    
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(0, 0, pulsingRadius + 10, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.globalAlpha = 1;
    
    // Draw main body
    ctx.beginPath();
    ctx.arc(0, 0, pulsingRadius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    
    // Draw spikes with animation
    ctx.beginPath();
    for (let i = 0; i < this.spikeTips.length; i++) {
      const spike = this.spikeTips[i];
      const angle = spike.angle;
      
      // Calculate spike positions with animation
      const innerRadius = pulsingRadius * 0.9;
      const outerRadius = pulsingRadius + spike.currentLength;
      
      // Inner points (base of spike)
      const innerX1 = Math.cos(angle - 0.1) * innerRadius;
      const innerY1 = Math.sin(angle - 0.1) * innerRadius;
      const innerX2 = Math.cos(angle + 0.1) * innerRadius;
      const innerY2 = Math.sin(angle + 0.1) * innerRadius;
      
      // Outer point (tip of spike)
      const outerX = Math.cos(angle) * outerRadius + spike.velocityX;
      const outerY = Math.sin(angle) * outerRadius + spike.velocityY;
      
      // Draw spike
      if (i === 0) {
        ctx.moveTo(innerX1, innerY1);
      } else {
        ctx.lineTo(innerX1, innerY1);
      }
      
      ctx.lineTo(outerX, outerY);
      ctx.lineTo(innerX2, innerY2);
    }
    
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.fill();
    
    // Draw inner details
    ctx.beginPath();
    ctx.arc(0, 0, pulsingRadius * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = '#2a2';
    ctx.fill();
    
    // Draw nucleus
    ctx.beginPath();
    ctx.arc(0, 0, pulsingRadius * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1';
    ctx.fill();
    
    // Draw small details inside
    for (let i = 0; i < 5; i++) {
      const detailAngle = Math.random() * Math.PI * 2;
      const detailDistance = Math.random() * pulsingRadius * 0.5;
      const detailX = Math.cos(detailAngle) * detailDistance;
      const detailY = Math.sin(detailAngle) * detailDistance;
      const detailSize = pulsingRadius * 0.05 + Math.random() * pulsingRadius * 0.05;
      
      ctx.beginPath();
      ctx.arc(detailX, detailY, detailSize, 0, Math.PI * 2);
      ctx.fillStyle = '#4f4';
      ctx.fill();
    }
    
    // Restore context
    ctx.restore();
  }
}
