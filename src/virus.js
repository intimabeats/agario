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
    
    // Z-index for layering (smaller cells can pass under)
    this.z = 0;
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
    
    // Get nearby entities
    const nearbyEntities = this.game.getEntitiesInRange(this.x, this.y, this.dangerRadius + 50, ['ais', 'player']);
    
    // Check player cells
    if (nearbyEntities.player && nearbyEntities.player.length > 0) {
      nearbyEntities.player.forEach(entity => {
        if (!entity.parent || entity.parent.isDead) return;
        
        const dx = entity.x - this.x;
        const dy = entity.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // If cell is approaching but not yet colliding
        if (distance < this.dangerRadius + entity.radius && distance > this.radius + entity.radius) {
          // React by extending spikes in that direction
          this.reactToEntity(dx, dy, distance, 0.5);
          this.lastInteractionTime = now;
        }
      });
    }
    
    // Check AI cells
    if (nearbyEntities.ais && nearbyEntities.ais.length > 0) {
      nearbyEntities.ais.forEach(entity => {
        if (!entity.parent || entity.parent.isDead) return;
        
        const dx = entity.x - this.x;
        const dy = entity.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // If cell is approaching but not yet colliding
        if (distance < this.dangerRadius + entity.radius && distance > this.radius + entity.radius) {
          // React by extending spikes in that direction
          this.reactToEntity(dx, dy, distance, 0.3);
          this.lastInteractionTime = now;
        }
      });
    }
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
  
  // Check if a cell can pass under this virus
  canPassUnder(cellRadius) {
    // Smaller cells can pass under
    return cellRadius < this.radius * 0.9;
  }
  
  // Check if a cell can consume this virus
  canBeConsumedBy(cellRadius) {
    // Larger cells can consume but will be split
    return cellRadius > this.radius * 1.15;
  }
  
  // Handle collision with a cell
  handleCollision(cell, player) {
    const dx = cell.x - this.x;
    const dy = cell.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // If cell is touching the virus
    if (distance < cell.radius + this.radius) {
      // If cell is large enough to consume the virus
      if (this.canBeConsumedBy(cell.radius)) {
        // Add virus mass to the cell
        const virusMass = this.mass * 0.5; // Only get half the mass
        cell.mass += virusMass;
        cell.radius = Math.sqrt(cell.mass / Math.PI);
        
        // Add experience to player
        if (player) {
          player.addExperience(50);
        }
        
        // Create particles
        this.game.particles.createVirusParticles(this.x, this.y);
        
        // Play sound
        this.game.soundManager.playSound('virusSplit');
        
        // Split the cell in multiple directions
        if (player && player.cells.length < 16) {
          // Find the index of the cell in player's cells array
          const cellIndex = player.cells.findIndex(c => c === cell);
          if (cellIndex !== -1) {
            // Split in multiple directions
            const splitDirections = 3 + Math.floor(Math.random() * 2); // 3-4 splits
            for (let i = 0; i < splitDirections; i++) {
              const angle = (i / splitDirections) * Math.PI * 2;
              const targetX = this.x + Math.cos(angle) * this.radius * 2;
              const targetY = this.y + Math.sin(angle) * this.radius * 2;
              player.splitCell(cellIndex, targetX, targetY);
            }
          }
        }
        
        // Remove the virus
        return true;
      } 
      // If cell is small enough to pass under
      else if (this.canPassUnder(cell.radius)) {
        // Set z-index to pass under
        cell.z = -1;
        
        // Reset z-index after a delay
        setTimeout(() => {
          if (cell) cell.z = 0;
        }, 1000);
        
        return false;
      } 
      // Cell is neither big enough to consume nor small enough to pass under
      else {
        // Just push the cell away slightly
        const pushFactor = 0.5;
        const pushX = (dx / distance) * pushFactor;
        const pushY = (dy / distance) * pushFactor;
        
        cell.x += pushX;
        cell.y += pushY;
        
        return false;
      }
    }
    
    return false;
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
    
    // Draw "pass under" indicator for small cells
    if (this.game.player && !this.game.player.isDead) {
      const smallestCell = this.game.player.cells.reduce(
        (smallest, cell) => cell.radius < smallest.radius ? cell : smallest,
        this.game.player.cells[0]
      );
      
      if (this.canPassUnder(smallestCell.radius)) {
        const dx = this.x - this.game.player.x;
        const dy = this.y - this.game.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Only show indicator when player is nearby
        if (distance < 200) {
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = 'white';
          ctx.fillText('Pass Under', this.x, this.y - this.radius - 15);
        }
      }
    }
  }
}
