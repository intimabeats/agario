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
