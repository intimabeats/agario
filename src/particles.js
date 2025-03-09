export class ParticleSystem {
  constructor(game) {
    this.game = game;
    this.particles = [];
    this.maxParticles = 1500; // Maximum number of particles for performance
    this.particleTypes = {
      standard: 0,
      food: 1,
      eat: 2,
      virus: 3,
      split: 4,
      eject: 5,
      merge: 6,
      damage: 7,
      powerUp: 8,
      text: 9,
      trail: 10,
      levelUp: 11,
      achievement: 12
    };
    
    // Performance optimization
    this.lastCleanupTime = Date.now();
    this.cleanupInterval = 1000; // Clean up dead particles every second
    this.particleBudget = {
      standard: 500,
      food: 200,
      eat: 200,
      virus: 100,
      split: 100,
      eject: 100,
      merge: 100,
      damage: 100,
      powerUp: 100,
      text: 50,
      trail: 300,
      levelUp: 50,
      achievement: 50
    };
    
    // Particle pools for reuse
    this.particlePools = {};
    for (const type in this.particleTypes) {
      this.particlePools[type] = [];
    }
    
    // Viewport optimization
    this.viewportMargin = 100; // Extra margin around viewport for particles
    
    // Particle effects settings
    this.effectSettings = {
      food: {
        particleCount: 5,
        size: { min: 2, max: 5 },
        speed: { min: 20, max: 50 },
        life: { min: 0.5, max: 1.0 },
        gravity: 10,
        drag: 0.95,
        shrink: 1.0,
        gradient: true
      },
      eat: {
        particleCount: 15,
        size: { min: 3, max: 8 },
        speed: { min: 30, max: 80 },
        life: { min: 0.7, max: 1.3 },
        gravity: 15,
        drag: 0.92,
        shrink: 0.8,
        gradient: true,
        glowSize: 30,
        glowDuration: 0.4,
        textScore: true
      },
      virus: {
        particleCount: 20,
        size: { min: 4, max: 10 },
        speed: { min: 40, max: 100 },
        life: { min: 1.0, max: 1.5 },
        gravity: 5,
        drag: 0.94,
        shrink: 0.6,
        gradient: true,
        spikyParticles: 8,
        glowSize: 40,
        glowDuration: 0.5
      },
      split: {
        particleCount: 15,
        size: { min: 3, max: 7 },
        speed: { min: 40, max: 100 },
        life: { min: 0.5, max: 0.8 },
        shrink: 1.0,
        drag: 0.94,
        trailLength: 30,
        trailDuration: 0.3
      },
      eject: {
        particleCount: 8,
        size: { min: 2, max: 5 },
        speed: { min: 30, max: 70 },
        life: { min: 0.3, max: 0.5 },
        shrink: 1.5,
        drag: 0.93,
        trailCount: 5,
        trailDistance: 5
      },
      merge: {
        particleCount: 20,
        size: { min: 3, max: 6 },
        speed: { min: 20, max: 50 },
        life: { min: 0.5, max: 0.8 },
        shrink: 0.5,
        drag: 0.95,
        implosion: true,
        glowSize: 30,
        glowDuration: 0.3,
        textMessage: 'Merge!'
      },
      damage: {
        particleCount: 15,
        size: { min: 3, max: 7 },
        speed: { min: 30, max: 70 },
        life: { min: 0.7, max: 1.0 },
        shrink: 0.7,
        drag: 0.93,
        color: '#ff0000',
        flashDuration: 0.3,
        textMessage: 'Ouch!'
      },
      powerUp: {
        particleCount: 25,
        size: { min: 4, max: 8 },
        speed: { min: 30, max: 50 },
        life: { min: 1.0, max: 1.5 },
        shrink: 0.3,
        drag: 0.95,
        starParticles: 5,
        glowSize: 60,
        glowDuration: 0.6,
        textMessage: 'Power Up!'
      },
      levelUp: {
        particleCount: 30,
        size: { min: 5, max: 10 },
        speed: { min: 50, max: 100 },
        life: { min: 1.0, max: 2.0 },
        shrink: 0.3,
        drag: 0.92,
        color: '#ffeb3b',
        starBurst: true,
        textMessage: 'LEVEL UP!',
        textSize: 24,
        glowSize: 50,
        glowDuration: 1.0
      },
      achievement: {
        particleCount: 40,
        size: { min: 4, max: 8 },
        speed: { min: 40, max: 80 },
        life: { min: 1.5, max: 2.5 },
        shrink: 0.2,
        drag: 0.9,
        color: '#ffd700',
        starBurst: true,
        confetti: true,
        textMessage: 'Achievement Unlocked!',
        textSize: 20,
        glowSize: 60,
        glowDuration: 1.2
      }
    };
  }
  
  update(deltaTime) {
    // Performance optimization - clean up dead particles periodically
    const now = Date.now();
    if (now - this.lastCleanupTime > this.cleanupInterval) {
      this.cleanupDeadParticles();
      this.lastCleanupTime = now;
    }
    
    // Update all particles
    this.particles.forEach(particle => {
      particle.life -= deltaTime;
      
      // Skip update for particles far outside viewport
      if (!particle.isVisible && !this.isNearViewport(particle)) {
        return;
      }
      
      // Update position
      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;
      
      // Apply gravity if specified
      if (particle.gravity) {
        particle.vy += particle.gravity * deltaTime;
      }
      
      // Apply drag if specified
      if (particle.drag) {
        particle.vx *= Math.pow(particle.drag, deltaTime * 60);
        particle.vy *= Math.pow(particle.drag, deltaTime * 60);
      }
      
      // Update size
      if (particle.shrink) {
        particle.size *= (1 - deltaTime * particle.shrink);
      }
      
      // Update opacity
      if (particle.fadeOut) {
        particle.opacity = Math.max(0, particle.life / particle.maxLife);
      }
      
      // Update rotation
      if (particle.rotate) {
        particle.rotation += particle.rotationSpeed * deltaTime;
      }
      
      // Update color if it has a color transition
      if (particle.colorTransition) {
        const progress = 1 - (particle.life / particle.maxLife);
        particle.color = this.lerpColor(
          particle.startColor, 
          particle.endColor, 
          progress
        );
      }
      
      // Update trail if present
      if (particle.trail) {
        // Add current position to trail
        particle.trail.push({ x: particle.x, y: particle.y, time: now });
        
        // Remove old trail points
        const trailDuration = particle.trailDuration || 0.5; // 0.5 seconds default
        particle.trail = particle.trail.filter(point => now - point.time < trailDuration * 1000);
      }
      
      // Update custom properties
      if (particle.update) {
        particle.update(deltaTime);
      }
      
      // Check if particle is in viewport
      particle.isVisible = this.isInViewport(particle);
    });
    
    // Remove dead particles
    this.particles = this.particles.filter(particle => particle.life > 0);
  }
  
  draw(ctx) {
    // Draw all particles
    this.particles.forEach(particle => {
      // Skip drawing particles outside viewport
      if (!particle.isVisible && !this.game.debugMode) {
        return;
      }
      
      ctx.save();
      
      // Set opacity
      ctx.globalAlpha = particle.opacity;
      
      // Apply blend mode if specified
      if (particle.blendMode) {
        ctx.globalCompositeOperation = particle.blendMode;
      }
      
      // Apply rotation if needed
      if (particle.rotate) {
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation);
        ctx.translate(-particle.x, -particle.y);
      }
      
      // Draw based on shape
      switch (particle.shape) {
        case 'circle':
          this.drawCircleParticle(ctx, particle);
          break;
          
        case 'square':
          this.drawSquareParticle(ctx, particle);
          break;
          
        case 'star':
          this.drawStarParticle(ctx, particle);
          break;
          
        case 'text':
          this.drawTextParticle(ctx, particle);
          break;
          
        case 'glow':
          this.drawGlowParticle(ctx, particle);
          break;
          
        case 'trail':
          this.drawTrailParticle(ctx, particle);
          break;
          
        case 'confetti':
          this.drawConfettiParticle(ctx, particle);
          break;
          
        case 'custom':
          if (particle.draw) {
            particle.draw(ctx);
          }
          break;
      }
      
      ctx.restore();
    });
  }
  
  drawCircleParticle(ctx, particle) {
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    
    if (particle.gradient) {
      const gradient = ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, particle.size
      );
      gradient.addColorStop(0, particle.color);
      gradient.addColorStop(1, particle.gradientColor || 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = particle.color;
    }
    
    ctx.fill();
    
    if (particle.stroke) {
      ctx.strokeStyle = particle.strokeColor || 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = particle.strokeWidth || 1;
      ctx.stroke();
    }
  }
  
  drawSquareParticle(ctx, particle) {
    ctx.fillStyle = particle.color;
    ctx.fillRect(
      particle.x - particle.size / 2,
      particle.y - particle.size / 2,
      particle.size,
      particle.size
    );
    
    if (particle.stroke) {
      ctx.strokeStyle = particle.strokeColor || 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = particle.strokeWidth || 1;
      ctx.strokeRect(
        particle.x - particle.size / 2,
        particle.y - particle.size / 2,
        particle.size,
        particle.size
      );
    }
  }
  
  drawStarParticle(ctx, particle) {
    this.drawStar(
      ctx, 
      particle.x, 
      particle.y, 
      particle.points || 5, 
      particle.size, 
      particle.size / 2, 
      particle.color
    );
    
    if (particle.stroke) {
      ctx.strokeStyle = particle.strokeColor || 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = particle.strokeWidth || 1;
      ctx.stroke();
    }
  }
  
  drawTextParticle(ctx, particle) {
    ctx.font = `${particle.size}px ${particle.font || 'Arial'}`;
    ctx.fillStyle = particle.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    if (particle.stroke) {
      ctx.strokeStyle = particle.strokeColor || 'rgba(0, 0, 0, 0.8)';
      ctx.lineWidth = particle.strokeWidth || 2;
      ctx.strokeText(particle.text, particle.x, particle.y);
    }
    
    ctx.fillText(particle.text, particle.x, particle.y);
  }
  
  drawGlowParticle(ctx, particle) {
    const gradient = ctx.createRadialGradient(
      particle.x, particle.y, 0,
      particle.x, particle.y, particle.size
    );
    gradient.addColorStop(0, particle.color);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  drawTrailParticle(ctx, particle) {
    if (!particle.trail || particle.trail.length < 2) return;
    
    ctx.beginPath();
    ctx.moveTo(particle.trail[0].x, particle.trail[0].y);
    
    for (let i = 1; i < particle.trail.length; i++) {
      ctx.lineTo(particle.trail[i].x, particle.trail[i].y);
    }
    
    ctx.strokeStyle = particle.color;
    ctx.lineWidth = particle.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }
  
  drawConfettiParticle(ctx, particle) {
    ctx.save();
    ctx.translate(particle.x, particle.y);
    ctx.rotate(particle.rotation);
    
    // Draw a small rectangle with rounded corners
    const width = particle.size * 2;
    const height = particle.size;
    const radius = height / 4;
    
    ctx.beginPath();
    ctx.moveTo(-width/2 + radius, -height/2);
    ctx.lineTo(width/2 - radius, -height/2);
    ctx.arcTo(width/2, -height/2, width/2, -height/2 + radius, radius);
    ctx.lineTo(width/2, height/2 - radius);
    ctx.arcTo(width/2, height/2, width/2 - radius, height/2, radius);
    ctx.lineTo(-width/2 + radius, height/2);
    ctx.arcTo(-width/2, height/2, -width/2, height/2 - radius, radius);
    ctx.lineTo(-width/2, -height/2 + radius);
    ctx.arcTo(-width/2, -height/2, -width/2 + radius, -height/2, radius);
    ctx.closePath();
    
    ctx.fillStyle = particle.color;
    ctx.fill();
    
    // Add a highlight
    ctx.beginPath();
    ctx.moveTo(-width/2 + radius, -height/2);
    ctx.lineTo(width/2 - radius, -height/2);
    ctx.arcTo(width/2, -height/2, width/2, -height/2 + radius, radius);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fill();
    
    ctx.restore();
  }
  drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius, color) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;
    
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;
      
      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }
  
  createParticle(options) {
    // Ensure we don't exceed max particles
    if (this.particles.length >= this.maxParticles) {
      // Remove oldest particles to make room, prioritizing less important types
      this.particles.sort((a, b) => {
        // Sort by type priority first, then by remaining life
        if (a.type !== b.type) {
          return a.type - b.type;
        }
        return a.life - b.life;
      });
      
      // Remove 10% of max particles
      const removeCount = Math.floor(this.maxParticles * 0.1);
      this.particles.splice(0, removeCount);
    }
    
    // Check particle budget for this type
    const type = options.type || this.particleTypes.standard;
    const typeName = Object.keys(this.particleTypes).find(key => this.particleTypes[key] === type);
    
    if (typeName) {
      const typeCount = this.particles.filter(p => p.type === type).length;
      if (typeCount >= this.particleBudget[typeName]) {
        // Remove oldest particles of this type
        const oldestParticles = this.particles
          .filter(p => p.type === type)
          .sort((a, b) => a.life - b.life);
        
        // Remove 10% of the budget
        const removeCount = Math.ceil(this.particleBudget[typeName] * 0.1);
        for (let i = 0; i < Math.min(removeCount, oldestParticles.length); i++) {
          const index = this.particles.indexOf(oldestParticles[i]);
          if (index !== -1) {
            this.particles.splice(index, 1);
          }
        }
      }
    }
    
    // Try to reuse a particle from the pool
    let particle = null;
    if (typeName && this.particlePools[typeName].length > 0) {
      particle = this.particlePools[typeName].pop();
      
      // Reset particle properties
      Object.assign(particle, {
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: 5,
        color: '#ffffff',
        life: 1,
        maxLife: 1,
        opacity: 1,
        fadeOut: true,
        shrink: 0,
        gravity: 0,
        drag: null,
        shape: 'circle',
        rotate: false,
        rotation: 0,
        rotationSpeed: 0,
        gradient: false,
        gradientColor: null,
        stroke: false,
        strokeColor: null,
        strokeWidth: 1,
        blendMode: null,
        type: this.particleTypes.standard,
        isVisible: false,
        trail: null
      });
    } else {
      // Create new particle with defaults
      particle = {
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: 5,
        color: '#ffffff',
        life: 1,
        maxLife: 1,
        opacity: 1,
        fadeOut: true,
        shrink: 0,
        gravity: 0,
        drag: null,
        shape: 'circle',
        rotate: false,
        rotation: 0,
        rotationSpeed: 0,
        gradient: false,
        gradientColor: null,
        stroke: false,
        strokeColor: null,
        strokeWidth: 1,
        blendMode: null,
        type: this.particleTypes.standard,
        isVisible: false,
        trail: null
      };
    }
    
    // Apply options
    Object.assign(particle, options);
    
    // Initialize trail if needed
    if (options.trail) {
      particle.trail = [];
    }
    
    // Check if particle is in viewport
    particle.isVisible = this.isInViewport(particle);
    
    this.particles.push(particle);
    return particle;
  }
  
  cleanupDeadParticles() {
    // Move dead particles to pools for reuse
    const deadParticles = this.particles.filter(particle => particle.life <= 0);
    
    deadParticles.forEach(particle => {
      const typeName = Object.keys(this.particleTypes).find(key => this.particleTypes[key] === particle.type);
      if (typeName) {
        // Limit pool size to avoid memory issues
        if (this.particlePools[typeName].length < this.particleBudget[typeName] * 0.5) {
          this.particlePools[typeName].push(particle);
        }
      }
    });
    
    // Remove dead particles from active list
    this.particles = this.particles.filter(particle => particle.life > 0);
  }
  
  isInViewport(particle) {
    if (!this.game.camera) return true;
    
    const viewportLeft = this.game.camera.x - this.game.width / (2 * this.game.camera.scale) - this.viewportMargin;
    const viewportRight = this.game.camera.x + this.game.width / (2 * this.game.camera.scale) + this.viewportMargin;
    const viewportTop = this.game.camera.y - this.game.height / (2 * this.game.camera.scale) - this.viewportMargin;
    const viewportBottom = this.game.camera.y + this.game.height / (2 * this.game.camera.scale) + this.viewportMargin;
    
    return (
      particle.x + particle.size > viewportLeft &&
      particle.x - particle.size < viewportRight &&
      particle.y + particle.size > viewportTop &&
      particle.y - particle.size < viewportBottom
    );
  }
  
  isNearViewport(particle) {
    if (!this.game.camera) return true;
    
    const extendedMargin = this.viewportMargin * 3; // Check a wider area
    
    const viewportLeft = this.game.camera.x - this.game.width / (2 * this.game.camera.scale) - extendedMargin;
    const viewportRight = this.game.camera.x + this.game.width / (2 * this.game.camera.scale) + extendedMargin;
    const viewportTop = this.game.camera.y - this.game.height / (2 * this.game.camera.scale) - extendedMargin;
    const viewportBottom = this.game.camera.y + this.game.height / (2 * this.game.camera.scale) + extendedMargin;
    
    return (
      particle.x + particle.size > viewportLeft &&
      particle.x - particle.size < viewportRight &&
      particle.y + particle.size > viewportTop &&
      particle.y - particle.size < viewportBottom
    );
  }
  
  // Add the missing particle creation methods
  createFoodParticles(x, y, color) {
    const settings = this.effectSettings.food;
    const particleCount = settings.particleCount;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = settings.speed.min + Math.random() * (settings.speed.max - settings.speed.min);
      const size = settings.size.min + Math.random() * (settings.size.max - settings.size.min);
      
      this.createParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size,
        color,
        life: settings.life.min + Math.random() * (settings.life.max - settings.life.min),
        maxLife: settings.life.max,
        shrink: settings.shrink,
        gravity: settings.gravity,
        drag: settings.drag,
        type: this.particleTypes.food,
        gradient: settings.gradient,
        gradientColor: 'rgba(255, 255, 255, 0.3)'
      });
    }
    
    // Add a small glow effect
    this.createParticle({
      x,
      y,
      size: 10 + Math.random() * 5,
      color: color,
      life: 0.3,
      maxLife: 0.3,
      shape: 'glow',
      type: this.particleTypes.food
    });
  }
  
  createEatParticles(x, y, color) {
    const settings = this.effectSettings.eat;
    const particleCount = settings.particleCount;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = settings.speed.min + Math.random() * (settings.speed.max - settings.speed.min);
      const size = settings.size.min + Math.random() * (settings.size.max - settings.size.min);
      
      this.createParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size,
        color,
        life: settings.life.min + Math.random() * (settings.life.max - settings.life.min),
        maxLife: settings.life.max,
        shrink: settings.shrink,
        gravity: settings.gravity,
        drag: settings.drag,
        type: this.particleTypes.eat,
        gradient: settings.gradient,
        gradientColor: 'rgba(255, 255, 255, 0.3)'
      });
    }
    
    // Add a glow effect
    this.createParticle({
      x,
      y,
      size: settings.glowSize,
      color: color,
      life: settings.glowDuration,
      maxLife: settings.glowDuration,
      shape: 'glow',
      type: this.particleTypes.eat
    });
    
    // Add score text effect if enabled
    if (settings.textScore) {
      this.createTextEffect(x, y - 20, '+' + Math.floor(Math.random() * 100), '#ffeb3b', 16);
    }
  }
  
  createVirusParticles(x, y) {
    const settings = this.effectSettings.virus;
    const particleCount = settings.particleCount;
    const color = '#33ff33'; // Virus color
    
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = settings.speed.min + Math.random() * (settings.speed.max - settings.speed.min);
      const size = settings.size.min + Math.random() * (settings.size.max - settings.size.min);
      
      this.createParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size,
        color,
        life: settings.life.min + Math.random() * (settings.life.max - settings.life.min),
        maxLife: settings.life.max,
        shrink: settings.shrink,
        gravity: settings.gravity,
        drag: settings.drag,
        type: this.particleTypes.virus,
        gradient: settings.gradient,
        gradientColor: 'rgba(51, 255, 51, 0.3)'
      });
    }
    
    // Add spiky particles if enabled
    if (settings.spikyParticles) {
      for (let i = 0; i < settings.spikyParticles; i++) {
        const angle = (i / settings.spikyParticles) * Math.PI * 2;
        const speed = settings.speed.min * 1.5;
        const size = settings.size.max;
        
        this.createParticle({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size,
          color,
          life: settings.life.max,
          maxLife: settings.life.max,
          shrink: settings.shrink * 1.5,
          gravity: 0,
          drag: settings.drag,
          type: this.particleTypes.virus,
          shape: 'star',
          points: 3,
          rotate: true,
          rotation: angle,
          rotationSpeed: Math.random() * 2 - 1
        });
      }
    }
    
    // Add a glow effect
    this.createParticle({
      x,
      y,
      size: settings.glowSize,
      color: color,
      life: settings.glowDuration,
      maxLife: settings.glowDuration,
      shape: 'glow',
      type: this.particleTypes.virus
    });
  }
  
  createSplitParticles(x, y, color, dirX, dirY) {
    const settings = this.effectSettings.split;
    const particleCount = settings.particleCount;
    
    // If direction is not provided, use random directions
    if (dirX === undefined || dirY === undefined) {
      dirX = 1;
      dirY = 0;
    }
    
    // Normalize direction
    const length = Math.sqrt(dirX * dirX + dirY * dirY);
    if (length > 0) {
      dirX /= length;
      dirY /= length;
    }
    
    // Create particles in a cone in the split direction
    for (let i = 0; i < particleCount; i++) {
      // Calculate angle within a cone in the split direction
      const spreadAngle = Math.PI / 4; // 45 degrees spread
      const baseAngle = Math.atan2(dirY, dirX);
      const angle = baseAngle + (Math.random() - 0.5) * spreadAngle;
      
      const speed = settings.speed.min + Math.random() * (settings.speed.max - settings.speed.min);
      const size = settings.size.min + Math.random() * (settings.size.max - settings.size.min);
      
      this.createParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size,
        color,
        life: settings.life.min + Math.random() * (settings.life.max - settings.life.min),
        maxLife: settings.life.max,
        shrink: settings.shrink,
        drag: settings.drag,
        type: this.particleTypes.split,
        trail: settings.trailLength > 0,
        trailDuration: settings.trailDuration
      });
    }
  }
  
  createEjectParticles(x, y, color, dirX, dirY) {
    const settings = this.effectSettings.eject;
    const particleCount = settings.particleCount;
    
    // If direction is not provided, use random directions
    if (dirX === undefined || dirY === undefined) {
      dirX = 1;
      dirY = 0;
    }
    
    // Normalize direction
    const length = Math.sqrt(dirX * dirX + dirY * dirY);
    if (length > 0) {
      dirX /= length;
      dirY /= length;
    }
    
    // Create particles in the ejection direction
    for (let i = 0; i < particleCount; i++) {
      // Calculate angle within a narrow cone in the ejection direction
      const spreadAngle = Math.PI / 6; // 30 degrees spread
      const baseAngle = Math.atan2(dirY, dirX);
      const angle = baseAngle + (Math.random() - 0.5) * spreadAngle;
      
      const speed = settings.speed.min + Math.random() * (settings.speed.max - settings.speed.min);
      const size = settings.size.min + Math.random() * (settings.size.max - settings.size.min);
      
      this.createParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size,
        color,
        life: settings.life.min + Math.random() * (settings.life.max - settings.life.min),
        maxLife: settings.life.max,
        shrink: settings.shrink,
        drag: settings.drag,
        type: this.particleTypes.eject
      });
    }
    
    // Create trail particles if enabled
    if (settings.trailCount > 0) {
      for (let i = 0; i < settings.trailCount; i++) {
        const distance = i * (settings.trailDistance / settings.trailCount);
        const trailX = x - dirX * distance;
        const trailY = y - dirY * distance;
        
        this.createParticle({
          x: trailX,
          y: trailY,
          size: settings.size.min * (1 - i / settings.trailCount),
          color,
          life: settings.life.min * (1 - i / settings.trailCount),
          maxLife: settings.life.min * (1 - i / settings.trailCount),
          fadeOut: true,
          shrink: settings.shrink * 2,
          type: this.particleTypes.eject
        });
      }
    }
  }
  
  createMergeParticles(x, y, color) {
    const settings = this.effectSettings.merge;
    const particleCount = settings.particleCount;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      let speed = settings.speed.min + Math.random() * (settings.speed.max - settings.speed.min);
      const size = settings.size.min + Math.random() * (settings.size.max - settings.size.min);
      
      // If implosion effect, particles move inward
      if (settings.implosion) {
        speed = -speed;
      }
      
      this.createParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size,
        color,
        life: settings.life.min + Math.random() * (settings.life.max - settings.life.min),
        maxLife: settings.life.max,
        shrink: settings.shrink,
        drag: settings.drag,
        type: this.particleTypes.merge,
        gradient: true,
        gradientColor: 'rgba(255, 255, 255, 0.3)'
      });
    }
    
    // Add a glow effect
    this.createParticle({
      x,
      y,
      size: settings.glowSize,
      color: color,
      life: settings.glowDuration,
      maxLife: settings.glowDuration,
      shape: 'glow',
      type: this.particleTypes.merge
    });
    
    // Add text message if enabled
    if (settings.textMessage) {
      this.createTextEffect(x, y - 20, settings.textMessage, color, 16);
    }
  }
  
  createDamageParticles(x, y) {
    const settings = this.effectSettings.damage;
    const particleCount = settings.particleCount;
    const color = settings.color;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = settings.speed.min + Math.random() * (settings.speed.max - settings.speed.min);
      const size = settings.size.min + Math.random() * (settings.size.max - settings.size.min);
      
      this.createParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size,
        color,
        life: settings.life.min + Math.random() * (settings.life.max - settings.life.min),
        maxLife: settings.life.max,
        shrink: settings.shrink,
        drag: settings.drag,
        type: this.particleTypes.damage
      });
    }
    
    // Add flash effect
    this.createParticle({
      x,
      y,
      size: 50,
      color: 'rgba(255, 0, 0, 0.3)',
      life: settings.flashDuration,
      maxLife: settings.flashDuration,
      shape: 'glow',
      type: this.particleTypes.damage
    });
    
    // Add text message if enabled
    if (settings.textMessage) {
      this.createTextEffect(x, y - 20, settings.textMessage, color, 16);
    }
  }
  
  createPowerUpParticles(x, y, color) {
    const settings = this.effectSettings.powerUp;
    const particleCount = settings.particleCount;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = settings.speed.min + Math.random() * (settings.speed.max - settings.speed.min);
      const size = settings.size.min + Math.random() * (settings.size.max - settings.size.min);
      
      this.createParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size,
        color,
        life: settings.life.min + Math.random() * (settings.life.max - settings.life.min),
        maxLife: settings.life.max,
        shrink: settings.shrink,
        drag: settings.drag,
        type: this.particleTypes.powerUp,
        gradient: true,
        gradientColor: 'rgba(255, 255, 255, 0.3)'
      });
    }
    
    // Add star particles if enabled
    if (settings.starParticles) {
      for (let i = 0; i < settings.starParticles; i++) {
        const angle = (i / settings.starParticles) * Math.PI * 2;
        const speed = settings.speed.max;
        
        this.createParticle({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: settings.size.max,
          color: color,
          life: settings.life.max,
          maxLife: settings.life.max,
          shrink: settings.shrink,
          drag: settings.drag,
          type: this.particleTypes.powerUp,
          shape: 'star',
          points: 5,
          rotate: true,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: Math.random() * 2 - 1
        });
      }
    }
    
    // Add a glow effect
    this.createParticle({
      x,
      y,
      size: settings.glowSize,
      color: color,
      life: settings.glowDuration,
      maxLife: settings.glowDuration,
      shape: 'glow',
      type: this.particleTypes.powerUp
    });
    
    // Add text message if enabled
    if (settings.textMessage) {
      this.createTextEffect(x, y - 30, settings.textMessage, color, 18);
    }
  }
  
  createTextEffect(x, y, text, color = '#ffffff', size = 16) {
    this.createParticle({
      x,
      y,
      vx: 0,
      vy: -20, // Float upward
      size,
      color,
      life: 1.5,
      maxLife: 1.5,
      fadeOut: true,
      type: this.particleTypes.text,
      shape: 'text',
      text,
      font: 'Arial',
      stroke: true,
      strokeColor: 'rgba(0, 0, 0, 0.5)',
      strokeWidth: 3
    });
  }
  
  lerpColor(color1, color2, factor) {
    // Convert hex to RGB
    const hex2rgb = (hex) => {
      const r = parseInt(hex.substring(1, 3), 16);
      const g = parseInt(hex.substring(3, 5), 16);
      const b = parseInt(hex.substring(5, 7), 16);
      return [r, g, b];
    };
    
    // Convert RGB to hex
    const rgb2hex = (r, g, b) => {
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    };
    
    // If colors are not hex format, return color1
    if (!color1.startsWith('#') || !color2.startsWith('#')) {
      return color1;
    }
    
    const rgb1 = hex2rgb(color1);
    const rgb2 = hex2rgb(color2);
    
    // Interpolate between the colors
    const r = Math.round(rgb1[0] + factor * (rgb2[0] - rgb1[0]));
    const g = Math.round(rgb1[1] + factor * (rgb2[1] - rgb1[1]));
    const b = Math.round(rgb1[2] + factor * (rgb2[2] - rgb1[2]));
    
    return rgb2hex(r, g, b);
  }
	createTextParticles(x, y, text, options = {}) {
  const defaults = {
    color: '#ffffff',
    size: 20,
    particleSize: 3,
    particleDensity: 0.3,
    life: 1.0,
    explosionForce: 50
  };
  
  const settings = { ...defaults, ...options };
  
  // Create temporary canvas to render text
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Set canvas size based on text size
  canvas.width = settings.size * text.length * 0.8;
  canvas.height = settings.size * 1.5;
  
  // Draw text on canvas
  ctx.font = `${settings.size}px Arial`;
  ctx.fillStyle = settings.color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  
  // Sample pixels from canvas and create particles
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  
  for (let i = 0; i < pixels.length; i += 4) {
    // Only create particles for non-transparent pixels
    if (pixels[i + 3] > 0 && Math.random() < settings.particleDensity) {
      // Calculate position
      const pixelIndex = i / 4;
      const pixelX = pixelIndex % canvas.width;
      const pixelY = Math.floor(pixelIndex / canvas.width);
      
      // Convert to world coordinates
      const worldX = x + pixelX - canvas.width / 2;
      const worldY = y + pixelY - canvas.height / 2;
      
      // Calculate velocity (explode outward from center)
      const dx = worldX - x;
      const dy = worldY - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      
      const speed = (distance / Math.max(canvas.width, canvas.height)) * settings.explosionForce;
      
      this.createParticle({
        x: worldX,
        y: worldY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: settings.particleSize,
        color: settings.color,
        life: settings.life * (0.8 + Math.random() * 0.4),
        maxLife: settings.life,
        fadeOut: true,
        shrink: 1,
        drag: 0.95,
        type: this.particleTypes.text
      });
    }
  }
}

}
