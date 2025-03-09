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
    this.z = 5;
    
    // Movement properties
    this.isMoving = false;
    this.moveSpeed = 0;
    this.moveAngle = 0;
    this.moveTarget = { x: 0, y: 0 };
    this.moveStartTime = 0;
    this.moveDuration = 0;
    
    // Virus behavior
    this.behavior = {
      aggressiveness: Math.random(), // 0-1, how likely to attack
      movementFrequency: 0.2 + Math.random() * 0.3, // How often to move
      movementDistance: 100 + Math.random() * 200, // How far to move
      splitThreshold: 0.8 + Math.random() * 0.2, // When to split (0-1)
      lastMovementTime: 0,
      movementCooldown: 5000 + Math.random() * 10000, // 5-15 seconds between movements
      lastSplitTime: 0,
      splitCooldown: 30000 + Math.random() * 30000, // 30-60 seconds between splits
      canSplit: Math.random() < 0.5 // 50% chance to be a splitting virus
    };
    
    // Virus state
    this.state = 'idle'; // idle, moving, attacking, splitting
    this.health = 100;
    this.isDead = false;
    this.isInfectious = Math.random() < 0.3; // 30% chance to be infectious
    this.infectionRadius = this.radius * 1.5;
    this.infectionStrength = 0.5 + Math.random() * 0.5; // 0.5-1.0
    
    // Visual effects
    this.effects = [];
    
    // Performance optimization
    this.isVisible = false;
    this.lastUpdateTime = Date.now();
    this.updateInterval = 100; // Update every 100ms for performance
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
    // Performance optimization - only update at intervals if not visible
    const now = Date.now();
    if (now - this.lastUpdateTime < this.updateInterval && !this.isVisible) {
      return;
    }
    this.lastUpdateTime = now;
    
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
    
    // Update virus behavior
    this.updateBehavior(deltaTime);
    
    // Update movement
    this.updateMovement(deltaTime);
    
    // Check for nearby entities to interact with
    this.checkNearbyEntities();
    
    // Update effects
    this.updateEffects(deltaTime);
  }
  
  updateBehavior(deltaTime) {
    const now = Date.now();
    
    // Check if it's time to move
    if (this.state === 'idle' && 
        now - this.behavior.lastMovementTime > this.behavior.movementCooldown && 
        Math.random() < this.behavior.movementFrequency * deltaTime) {
      
      this.startMoving();
      this.behavior.lastMovementTime = now;
    }
    
    // Check if it's time to split
    if (this.behavior.canSplit && 
        now - this.behavior.lastSplitTime > this.behavior.splitCooldown && 
        Math.random() < 0.01 * deltaTime) {
      
      this.startSplitting();
      this.behavior.lastSplitTime = now;
    }
  }
  
  startMoving() {
    this.state = 'moving';
    
    // Choose a random direction and distance
    this.moveAngle = Math.random() * Math.PI * 2;
    const distance = this.behavior.movementDistance;
    
    // Calculate target position
    this.moveTarget = {
      x: this.x + Math.cos(this.moveAngle) * distance,
      y: this.y + Math.sin(this.moveAngle) * distance
    };
    
    // Keep target within world bounds
    this.moveTarget.x = Math.max(this.radius, Math.min(this.game.worldSize - this.radius, this.moveTarget.x));
    this.moveTarget.y = Math.max(this.radius, Math.min(this.game.worldSize - this.radius, this.moveTarget.y));
    
    // Set movement parameters
    this.moveSpeed = 20 + Math.random() * 20; // 20-40 units per second
    this.moveStartTime = Date.now();
    
    // Calculate duration based on distance and speed
    const actualDistance = Math.sqrt(
      Math.pow(this.moveTarget.x - this.x, 2) + 
      Math.pow(this.moveTarget.y - this.y, 2)
    );
    this.moveDuration = actualDistance / this.moveSpeed * 1000; // Convert to milliseconds
    
    // Create movement effect
    this.effects.push({
      type: 'movement',
      startTime: Date.now(),
      duration: this.moveDuration
    });
  }
  
  startSplitting() {
    this.state = 'splitting';
    
    // Create splitting effect
    this.effects.push({
      type: 'splitting',
      startTime: Date.now(),
      duration: 2000 // 2 seconds
    });
    
    // Schedule actual split
    setTimeout(() => {
      if (!this.isDead) {
        this.split();
      }
    }, 2000);
  }
  
  split() {
    // Create a new virus
    const angle = Math.random() * Math.PI * 2;
    const distance = this.radius * 3;
    
    const newX = this.x + Math.cos(angle) * distance;
    const newY = this.y + Math.sin(angle) * distance;
    
    // Keep within world bounds
    const boundedX = Math.max(this.radius, Math.min(this.game.worldSize - this.radius, newX));
    const boundedY = Math.max(this.radius, Math.min(this.game.worldSize - this.radius, newY));
    
    // Create new virus
    const newVirus = new Virus(boundedX, boundedY, this.game);
    
    // Inherit some properties from parent
    newVirus.behavior.canSplit = this.behavior.canSplit;
    newVirus.isInfectious = this.isInfectious;
    
    // Add to game
    this.game.viruses.push(newVirus);
    
    // Create particles
    if (this.game.particles) {
      this.game.particles.createVirusParticles(this.x, this.y);
    }
    
    // Reset state
    this.state = 'idle';
  }
  
  updateMovement(deltaTime) {
    if (this.state !== 'moving') return;
    
    const now = Date.now();
    const elapsed = now - this.moveStartTime;
    
    // Check if movement is complete
    if (elapsed >= this.moveDuration) {
      this.x = this.moveTarget.x;
      this.y = this.moveTarget.y;
      this.state = 'idle';
      return;
    }
    
    // Calculate progress (0-1)
    const progress = elapsed / this.moveDuration;
    
    // Use easing function for smoother movement
    const easedProgress = this.easeInOutQuad(progress);
    
    // Update position
    this.x = this.x + (this.moveTarget.x - this.x) * easedProgress * deltaTime * 5;
    this.y = this.y + (this.moveTarget.y - this.y) * easedProgress * deltaTime * 5;
    
    // Keep within world bounds
    this.x = Math.max(this.radius, Math.min(this.game.worldSize - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(this.game.worldSize - this.radius, this.y));
  }
  
  easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
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
        
        // Check for infection if virus is infectious
        if (this.isInfectious && distance < this.infectionRadius + entity.radius) {
          this.infectEntity(entity.parent, this.infectionStrength * deltaTime);
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
        
        // Check for infection if virus is infectious
        if (this.isInfectious && distance < this.infectionRadius + entity.radius) {
          this.infectEntity(entity.parent, this.infectionStrength * deltaTime);
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
    
    // If virus is aggressive, it might start moving towards the entity
    if (Math.random() < this.behavior.aggressiveness && this.state === 'idle') {
      this.state = 'attacking';
      
      // Move towards entity
      this.moveTarget = {
        x: this.x + dirX * this.behavior.movementDistance,
        y: this.y + dirY * this.behavior.movementDistance
      };
      
      // Keep target within world bounds
      this.moveTarget.x = Math.max(this.radius, Math.min(this.game.worldSize - this.radius, this.moveTarget.x));
      this.moveTarget.y = Math.max(this.radius, Math.min(this.game.worldSize - this.radius, this.moveTarget.y));
      
      // Set movement parameters
      this.moveSpeed = 30 + Math.random() * 20; // Faster when attacking
      this.moveStartTime = Date.now();
      
      // Calculate duration based on distance and speed
      const actualDistance = Math.sqrt(
        Math.pow(this.moveTarget.x - this.x, 2) + 
        Math.pow(this.moveTarget.y - this.y, 2)
      );
      this.moveDuration = actualDistance / this.moveSpeed * 1000; // Convert to milliseconds
      
      // Create attack effect
      this.effects.push({
        type: 'attack',
        startTime: Date.now(),
        duration: this.moveDuration
      });
    }
  }
  
  infectEntity(entity, amount) {
    // Only infect if entity has a takeDamage method
    if (entity && typeof entity.takeDamage === 'function') {
      entity.takeDamage(amount);
      
      // Create infection particles
      if (this.game.particles && Math.random() < 0.1) {
        this.game.particles.createParticle({
          x: entity.x,
          y: entity.y,
          size: 3,
          color: this.color,
          life: 0.5,
          maxLife: 0.5,
          fadeOut: true,
          shape: 'circle'
        });
      }
    }
  }
  
  updateEffects(deltaTime) {
    const now = Date.now();
    
    // Update and remove expired effects
    this.effects = this.effects.filter(effect => {
      const elapsed = now - effect.startTime;
      return elapsed < effect.duration;
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
        if (this.game.particles) {
          this.game.particles.createVirusParticles(this.x, this.y);
        }
        
        // Play sound
        if (this.game.soundManager) {
          this.game.soundManager.playSound('virusSplit');
        }
        
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
    // Skip drawing if not visible (optimization)
    if (!this.isVisible && !this.game.debugMode) return;
    
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
    
    // Draw effects
    this.drawEffects(ctx);
    
    // Draw infectious indicator if applicable
    if (this.isInfectious) {
      ctx.beginPath();
      ctx.arc(0, 0, this.infectionRadius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.2)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw biohazard symbol
      this.drawBiohazardSymbol(ctx, 0, 0, pulsingRadius * 0.4);
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
    
    // Draw debug info if debug mode is enabled
    if (this.game.debugMode) {
      ctx.font = '10px Arial';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.fillText(`State: ${this.state}`, this.x, this.y - this.radius - 25);
      ctx.fillText(`Infectious: ${this.isInfectious}`, this.x, this.y - this.radius - 15);
    }
  }
  
  drawEffects(ctx) {
    // Draw effects based on current state
    if (this.state === 'attacking') {
      // Draw attack effect - red glow
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
      ctx.fill();
    } else if (this.state === 'splitting') {
      // Draw splitting effect - pulsing
      const now = Date.now();
      const splittingEffect = this.effects.find(effect => effect.type === 'splitting');
      
      if (splittingEffect) {
        const elapsed = now - splittingEffect.startTime;
        const progress = elapsed / splittingEffect.duration;
        const pulseSize = 1 + Math.sin(progress * Math.PI * 10) * 0.2;
        
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * pulseSize * 1.2, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    }
  }
  
  drawBiohazardSymbol(ctx, x, y, radius) {
    ctx.save();
    ctx.translate(x, y);
    
    // Draw biohazard symbol
    ctx.beginPath();
    
    // Outer circle
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    
    // Inner circles
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const cx = Math.cos(angle) * radius * 0.5;
      const cy = Math.sin(angle) * radius * 0.5;
      
      ctx.moveTo(cx + radius * 0.3, cy);
      ctx.arc(cx, cy, radius * 0.3, 0, Math.PI * 2, true);
    }
    
    // Center circle
    ctx.moveTo(radius * 0.2, 0);
    ctx.arc(0, 0, radius * 0.2, 0, Math.PI * 2, true);
    
    ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
    ctx.fill();
    
    ctx.restore();
  }
  
  // Check if virus is in viewport
  checkVisibility(viewportBounds) {
    const { left, right, top, bottom } = viewportBounds;
    
    this.isVisible = (
      this.x + this.radius + this.spikeLength > left &&
      this.x - this.radius - this.spikeLength < right &&
      this.y + this.radius + this.spikeLength > top &&
      this.y - this.radius - this.spikeLength < bottom
    );
    
    return this.isVisible;
  }
}
