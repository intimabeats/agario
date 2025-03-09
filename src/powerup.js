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
    this.rotationAngle = 0;
    this.rotationSpeed = 0.5 + Math.random() * 0.5; // Rotation speed in radians per second
    
    // Visual properties
    this.particleTimer = 0;
    this.particleInterval = 500; // ms between particle emissions
    this.orbitingParticles = [];
    this.maxOrbitingParticles = 5;
    this.orbitRadius = this.radius * 1.5;
    this.orbitSpeed = 1.5; // Radians per second
    
    // Movement properties
    this.floatPhase = Math.random() * Math.PI * 2;
    this.floatAmplitude = 5;
    this.floatSpeed = 0.5 + Math.random() * 0.5;
    this.originalY = y;
    
    // Lifetime properties
    this.lifetime = 60000 + Math.random() * 60000; // 60-120 seconds
    this.creationTime = Date.now();
    this.fadeOutTime = 3000; // 3 seconds fade out before disappearing
    this.opacity = 1;
    
    // Collision properties
    this.isCollected = false;
    this.collectionAnimation = null;
    
    // Power-up properties
    this.duration = 10000; // 10 seconds
    this.strength = 1.0;
    this.description = this.getDescriptionByType();
    
    // Initialize orbiting particles
    this.initOrbitingParticles();
    
    // Performance optimization
    this.isVisible = false;
    this.lastUpdateTime = Date.now();
    this.updateInterval = 50; // Update every 50ms for performance
  }
  
  initOrbitingParticles() {
    for (let i = 0; i < this.maxOrbitingParticles; i++) {
      this.orbitingParticles.push({
        angle: (i / this.maxOrbitingParticles) * Math.PI * 2,
        radius: this.orbitRadius * (0.8 + Math.random() * 0.4),
        size: 2 + Math.random() * 2,
        speed: this.orbitSpeed * (0.8 + Math.random() * 0.4),
        opacity: 0.5 + Math.random() * 0.5
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
    
    // Skip update if collected
    if (this.isCollected) return;
    
    // Update pulse animation
    this.pulsePhase += 2 * deltaTime;
    this.glowIntensity = Math.sin(this.pulsePhase) * 0.5 + 0.5;
    
    // Update rotation
    this.rotationAngle += this.rotationSpeed * deltaTime;
    
    // Update floating movement
    this.floatPhase += this.floatSpeed * deltaTime;
    this.y = this.originalY + Math.sin(this.floatPhase) * this.floatAmplitude;
    
    // Update orbiting particles
    this.updateOrbitingParticles(deltaTime);
    
    // Emit particles occasionally
    this.particleTimer += deltaTime * 1000;
    if (this.particleTimer > this.particleInterval) {
      this.emitParticle();
      this.particleTimer = 0;
    }
    
    // Check lifetime
    const age = now - this.creationTime;
    if (age > this.lifetime - this.fadeOutTime) {
      // Start fading out
      this.opacity = Math.max(0, 1 - (age - (this.lifetime - this.fadeOutTime)) / this.fadeOutTime);
      
      // Remove when completely faded
      if (this.opacity <= 0) {
        this.game.removePowerUp(this);
      }
    }
  }
  
  updateOrbitingParticles(deltaTime) {
    this.orbitingParticles.forEach(particle => {
      particle.angle += particle.speed * deltaTime;
    });
  }
  
  emitParticle() {
    if (!this.game.particles) return;
    
    this.game.particles.createParticle({
      x: this.x,
      y: this.y,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10,
      size: 2 + Math.random() * 2,
      color: this.color,
      life: 0.5 + Math.random() * 0.5,
      maxLife: 1,
      fadeOut: true,
      shrink: 1,
      shape: Math.random() < 0.3 ? 'star' : 'circle'
    });
  }
  
  draw(ctx) {
    // Skip drawing if not visible (optimization)
    if (!this.isVisible && !this.game.debugMode) return;
    
    // Skip drawing if collected
    if (this.isCollected) return;
    
    // Apply opacity for fade out
    ctx.globalAlpha = this.opacity;
    
    // Draw glow effect
    const gradient = ctx.createRadialGradient(
      this.x, this.y, this.radius * 0.5,
      this.x, this.y, this.radius * 2
    );
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.globalAlpha = 0.3 * this.glowIntensity * this.opacity;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.globalAlpha = this.opacity;
    
    // Draw orbiting particles
    this.orbitingParticles.forEach(particle => {
      const x = this.x + Math.cos(particle.angle) * particle.radius;
      const y = this.y + Math.sin(particle.angle) * particle.radius;
      
      ctx.globalAlpha = particle.opacity * this.opacity;
      ctx.beginPath();
      ctx.arc(x, y, particle.size, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
    });
    
    // Draw power-up body
    ctx.globalAlpha = this.opacity;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    
    // Draw power-up icon
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    let icon = this.getIconByType();
    ctx.fillText(icon, this.x, this.y);
    
    // Draw power-up type if debug mode is enabled
    if (this.game.debugMode) {
      ctx.font = '10px Arial';
      ctx.fillStyle = 'white';
      ctx.fillText(this.type, this.x, this.y - this.radius - 10);
      ctx.fillText(`${Math.floor((this.lifetime - (Date.now() - this.creationTime)) / 1000)}s`, this.x, this.y - this.radius - 20);
    }
    
    // Reset opacity
    ctx.globalAlpha = 1;
  }
  
  getRandomType() {
    const types = [
      'speed',
      'shield',
      'mass',
      'invisibility',
      'magnet',
      'freeze',
      'doubleScore'
    ];
    
    // Weighted random selection
    const weights = {
      'speed': 20,
      'shield': 15,
      'mass': 15,
      'invisibility': 10,
      'magnet': 15,
      'freeze': 10,
      'doubleScore': 15
    };
    
    // Calculate total weight
    let totalWeight = 0;
    for (const type of types) {
      totalWeight += weights[type];
    }
    
    // Random selection based on weights
    let random = Math.random() * totalWeight;
    let cumulativeWeight = 0;
    
    for (const type of types) {
      cumulativeWeight += weights[type];
      if (random < cumulativeWeight) {
        return type;
      }
    }
    
    // Fallback
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
      case 'invisibility':
        return '#9e9e9e'; // Gray
      case 'magnet':
        return '#9c27b0'; // Purple
      case 'freeze':
        return '#2196f3'; // Blue
      case 'doubleScore':
        return '#ffeb3b'; // Yellow
      default:
        return '#ffffff'; // White
    }
  }
  
  getIconByType() {
    switch (this.type) {
      case 'speed':
        return '⚡';
      case 'shield':
        return '🛡️';
      case 'mass':
        return '⬆️';
      case 'invisibility':
        return '👁️';
      case 'magnet':
        return '🧲';
      case 'freeze':
        return '❄️';
      case 'doubleScore':
        return '2️⃣';
      default:
        return '?';
    }
  }
  
  getDescriptionByType() {
    switch (this.type) {
      case 'speed':
        return 'Increases movement speed by 50% for 10 seconds';
      case 'shield':
        return 'Provides immunity to damage for 10 seconds';
      case 'mass':
        return 'Increases mass by 20% for 10 seconds';
      case 'invisibility':
        return 'Makes you partially invisible for 10 seconds';
      case 'magnet':
        return 'Attracts nearby food for 10 seconds';
      case 'freeze':
        return 'Slows down nearby enemies for 10 seconds';
      case 'doubleScore':
        return 'Doubles all points earned for 10 seconds';
      default:
        return 'Unknown power-up';
    }
  }
  
  collect(collector) {
    if (this.isCollected) return;
    
    this.isCollected = true;
    
    // Create collection animation
    this.collectionAnimation = {
      startTime: Date.now(),
      duration: 500, // 0.5 seconds
      collector: collector
    };
    
    // Create collection particles
    if (this.game.particles) {
      this.game.particles.createPowerUpParticles(this.x, this.y, this.color);
    }
    
    // Play collection sound
    if (this.game.soundManager) {
      this.game.soundManager.playSound('powerUp');
    }
    
    // Apply power-up effect to collector
    if (collector && typeof collector.activatePowerUp === 'function') {
      collector.activatePowerUp(this.type);
    }
    
    // Show announcement
    this.game.showAnnouncement(`${collector.name} collected ${this.type} power-up!`, 2000);
    
    // Remove power-up from game
    setTimeout(() => {
      this.game.removePowerUp(this);
    }, 500); // Remove after animation completes
  }
  
  // Check if power-up is in viewport
  checkVisibility(viewportBounds) {
    const { left, right, top, bottom } = viewportBounds;
    
    this.isVisible = (
      this.x + this.radius * 2 > left &&
      this.x - this.radius * 2 < right &&
      this.y + this.radius * 2 > top &&
      this.y - this.radius * 2 < bottom
    );
    
    return this.isVisible;
  }
}
