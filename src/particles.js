export class ParticleSystem {
  constructor(game) {
    this.game = game;
    this.particles = [];
    this.maxParticles = 1500; // Increased limit for more visual effects
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
      text: 9
    };
  }
  
  update(deltaTime) {
    // Update all particles
    this.particles.forEach(particle => {
      particle.life -= deltaTime;
      
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
      
      // Update custom properties
      if (particle.update) {
        particle.update(deltaTime);
      }
    });
    
    // Remove dead particles
    this.particles = this.particles.filter(particle => particle.life > 0);
  }
  
  draw(ctx) {
    // Draw all particles
    this.particles.forEach(particle => {
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
    
    // Create new particle with defaults
    const particle = {
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
      ...options
    };
    
    this.particles.push(particle);
    return particle;
  }
  
  createFoodParticles(x, y, color) {
    const particleCount = 5 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 20 + Math.random() * 30;
      const size = 2 + Math.random() * 3;
      
      this.createParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size,
        color,
        life: 0.5 + Math.random() * 0.5,
        maxLife: 1,
        shrink: 1,
        gravity: 10,
        drag: 0.95,
        type: this.particleTypes.food,
        gradient: true,
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
    const particleCount = 15;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 50;
      
      this.createParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 5,
        color,
        life: 0.7 + Math.random() * 0.6,
        maxLife: 1.3,
        shrink: 0.8,
        gravity: 15,
        drag: 0.92,
        type: this.particleTypes.eat,
        gradient: true,
        gradientColor: 'rgba(255, 255, 255, 0.5)'
      });
    }
    
    // Add glow effect
    this.createParticle({
      x,
      y,
      size: 30,
      color: 'rgba(255, 255, 255, 0.8)',
      life: 0.4,
      maxLife: 0.4,
      shape: 'glow',
      type: this.particleTypes.eat
    });
    
    // Add score text particle
    this.createParticle({
      x,
      y,
      vy: -30,
      size: 16,
      color: 'white',
      life: 1.5,
      maxLife: 1.5,
      shape: 'text',
      text: '+1',
      fadeOut: true,
      type: this.particleTypes.text,
      stroke: true,
      strokeColor: 'rgba(0, 0, 0, 0.5)',
      strokeWidth: 2
    });
  }
  
  createVirusParticles(x, y) {
    const particleCount = 20;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 60;
      
      this.createParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 6,
        color: '#33ff33',
        life: 1 + Math.random() * 0.5,
        maxLife: 1.5,
        shrink: 0.6,
        gravity: 5,
        drag: 0.94,
        type: this.particleTypes.virus,
        gradient: true,
        gradientColor: 'rgba(51, 255, 51, 0.3)'
      });
    }
    
    // Add spiky particles
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const distance = 15 + Math.random() * 10;
      
      this.createParticle({
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        vx: Math.cos(angle) * 20,
        vy: Math.sin(angle) * 20,
        size: 6 + Math.random() * 4,
        color: '#33ff33',
        life: 0.6 + Math.random() * 0.4,
        maxLife: 1,
        shape: 'star',
        points: 4,
        rotate: true,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 5,
        type: this.particleTypes.virus
      });
    }
    
    // Add glow effect
    this.createParticle({
      x,
      y,
      size: 40,
      color: 'rgba(51, 255, 51, 0.6)',
      life: 0.5,
      maxLife: 0.5,
      shape: 'glow',
      type: this.particleTypes.virus
    });
  }
  
  createDamageParticles(x, y) {
    const particleCount = 15;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 40;
      
      this.createParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 4,
        color: '#ff0000',
        life: 0.7 + Math.random() * 0.3,
        maxLife: 1,
        shrink: 0.7,
        drag: 0.93,
        type: this.particleTypes.damage,
        gradient: true,
        gradientColor: 'rgba(255, 0, 0, 0.2)'
      });
    }
    
    // Add red flash
    this.createParticle({
      x,
      y,
      size: 50,
      color: 'rgba(255, 0, 0, 0.5)',
      life: 0.3,
      maxLife: 0.3,
      shape: 'glow',
      type: this.particleTypes.damage
    });
    
    // Add damage text
    this.createParticle({
      x,
      y,
      vy: -20,
      size: 18,
      color: '#ff3333',
      life: 1.2,
      maxLife: 1.2,
      shape: 'text',
      text: 'Ouch!',
      fadeOut: true,
      type: this.particleTypes.text,
      stroke: true,
      strokeColor: 'rgba(0, 0, 0, 0.7)',
      strokeWidth: 3
    });
  }
  
  createPowerUpParticles(x, y, color) {
    const particleCount = 25;
    
    // Create circular burst
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = 30 + Math.random() * 20;
      
      this.createParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 4,
        color,
        life: 1 + Math.random() * 0.5,
        maxLife: 1.5,
        shrink: 0.3,
        drag: 0.95,
        shape: Math.random() > 0.7 ? 'star' : 'circle',
        type: this.particleTypes.powerUp,
        gradient: true,
        gradientColor: 'rgba(255, 255, 255, 0.5)'
      });
    }
    
    // Create rising stars
    for (let i = 0; i < 5; i++) {
      const offsetX = (Math.random() - 0.5) * 30;
      
      this.createParticle({
        x: x + offsetX,
        y,
        vx: offsetX * 0.5,
        vy: -40 - Math.random() * 40,
        size: 6 + Math.random() * 6,
        color,
        life: 1.5 + Math.random() * 0.5,
        maxLife: 2,
        shape: 'star',
        rotate: true,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 5,
        type: this.particleTypes.powerUp
      });
    }
    
    // Add glow effect
    this.createParticle({
      x,
      y,
      size: 60,
      color: color,
      life: 0.6,
      maxLife: 0.6,
      shape: 'glow',
      type: this.particleTypes.powerUp
    });
    
    // Add power-up text
    this.createParticle({
      x,
      y,
      vy: -25,
      size: 20,
      color: 'white',
      life: 1.8,
      maxLife: 1.8,
      shape: 'text',
      text: 'Power Up!',
      fadeOut: true,
      type: this.particleTypes.text,
      stroke: true,
      strokeColor: 'rgba(0, 0, 0, 0.7)',
      strokeWidth: 3
    });
  }
  
  createSplitParticles(x, y, color, dirX, dirY) {
    const particleCount = 15;
    const spreadAngle = Math.PI / 4; // 45 degrees spread
    const baseAngle = Math.atan2(dirY, dirX);
    
    for (let i = 0; i < particleCount; i++) {
      const angleOffset = (Math.random() - 0.5) * spreadAngle;
      const angle = baseAngle + angleOffset;
      const speed = 40 + Math.random() * 60;
      
      this.createParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 4,
        color,
        life: 0.5 + Math.random() * 0.3,
        maxLife: 0.8,
        shrink: 1,
        drag: 0.94,
        type: this.particleTypes.split,
        gradient: true,
        gradientColor: 'rgba(255, 255, 255, 0.3)'
      });
    }
    
    // Add trail effect in the direction of split
    const trailLength = 30;
    const trailPoints = [];
    
    for (let i = 0; i < 10; i++) {
      trailPoints.push({
        x: x - dirX * (i * trailLength / 10),
        y: y - dirY * (i * trailLength / 10)
      });
    }
    
    this.createParticle({
      x,
      y,
      size: 5,
      color: color,
      life: 0.3,
      maxLife: 0.3,
      shape: 'trail',
      trail: trailPoints,
      type: this.particleTypes.split
    });
  }
  
  createEjectParticles(x, y, color, dirX, dirY) {
    const particleCount = 8;
    const spreadAngle = Math.PI / 6; // 30 degrees spread
    const baseAngle = Math.atan2(dirY, dirX);
    
    for (let i = 0; i < particleCount; i++) {
      const angleOffset = (Math.random() - 0.5) * spreadAngle;
      const angle = baseAngle + angleOffset;
      const speed = 30 + Math.random() * 40;
      
      this.createParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3,
        color,
        life: 0.3 + Math.random() * 0.2,
        maxLife: 0.5,
        shrink: 1.5,
        drag: 0.93,
        type: this.particleTypes.eject,
        gradient: true,
        gradientColor: 'rgba(255, 255, 255, 0.3)'
      });
    }
    
    // Add a small trail behind the ejected mass
    for (let i = 0; i < 5; i++) {
      const distance = 5 + i * 3;
      const trailX = x - dirX * distance;
      const trailY = y - dirY * distance;
      
      this.createParticle({
        x: trailX,
        y: trailY,
        vx: -dirX * 5,
        vy: -dirY * 5,
        size: 3 - i * 0.5,
        color,
        life: 0.2 + Math.random() * 0.2,
        maxLife: 0.4,
        shrink: 2,
        type: this.particleTypes.eject
      });
    }
  }
  
  createMergeParticles(x, y, color) {
    const particleCount = 20;
    
    // Create circular implosion
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 20 + Math.random() * 30;
      const px = x + Math.cos(angle) * distance;
      const py = y + Math.sin(angle) * distance;
      
      this.createParticle({
        x: px,
        y: py,
        vx: (x - px) * 2,
        vy: (y - py) * 2,
        size: 3 + Math.random() * 3,
        color,
        life: 0.5 + Math.random() * 0.3,
        maxLife: 0.8,
        shrink: 0.5,
        drag: 0.95,
        type: this.particleTypes.merge,
        gradient: true,
        gradientColor: 'rgba(255, 255, 255, 0.4)'
      });
    }
    
    // Create flash
    this.createParticle({
      x,
      y,
      size: 30,
      color: 'white',
      life: 0.3,
      maxLife: 0.3,
      shrink: 3,
      shape: 'glow',
      type: this.particleTypes.merge
    });
    
    // Add merge text
    this.createParticle({
      x,
      y,
      vy: -15,
      size: 14,
      color: 'white',
      life: 1.2,
      maxLife: 1.2,
      shape: 'text',
      text: 'Merge!',
      fadeOut: true,
      type: this.particleTypes.text,
      stroke: true,
      strokeColor: 'rgba(0, 0, 0, 0.5)',
      strokeWidth: 2
    });
  }
  
  createExplosion(x, y, color, size = 30) {
    const particleCount = Math.floor(size * 0.8);
    
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 70;
      const particleSize = 2 + Math.random() * 5;
      
      this.createParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: particleSize,
        color,
        life: 0.5 + Math.random() * 0.5,
        maxLife: 1,
        shrink: 0.9,
        gravity: 10,
        drag: 0.92,
        type: this.particleTypes.standard,
        gradient: true,
        gradientColor: 'rgba(255, 255, 255, 0.5)'
      });
    }
    
    // Add shock wave
    this.createParticle({
      x,
      y,
      size: size * 2,
      color: 'rgba(255, 255, 255, 0.8)',
      life: 0.4,
      maxLife: 0.4,
      shape: 'glow',
      type: this.particleTypes.standard
    });
  }
  
  createRipple(x, y, color, size = 50) {
    // Create expanding ring
    for (let i = 0; i < 2; i++) {
      this.createParticle({
        x,
        y,
        size: size * (1 + i * 0.5),
        color: color,
        life: 0.8,
        maxLife: 0.8,
        shape: 'custom',
        type: this.particleTypes.standard,
        draw: function(ctx) {
          const progress = 1 - this.life / this.maxLife;
          const currentSize = this.size * (0.5 + progress * 0.5);
          const alpha = 1 - progress;
          
          ctx.strokeStyle = this.color;
          ctx.lineWidth = 2;
          ctx.globalAlpha = alpha;
          
          ctx.beginPath();
          ctx.arc(this.x, this.y, currentSize, 0, Math.PI * 2);
          ctx.stroke();
        }
      });
    }
  }
  
  createTextEffect(x, y, text, color = 'white') {
    this.createParticle({
      x,
      y,
      vy: -20,
      size: 16,
      color,
      life: 1.5,
      maxLife: 1.5,
      shape: 'text',
      text,
      fadeOut: true,
      type: this.particleTypes.text,
      stroke: true,
      strokeColor: 'rgba(0, 0, 0, 0.7)',
      strokeWidth: 2
    });
  }
  
  // Helper method to interpolate between two colors
  lerpColor(color1, color2, factor) {
    if (factor > 1) factor = 1;
    if (factor < 0) factor = 0;
    
    const result = { r: 0, g: 0, b: 0, a: 0 };
    const color1Obj = this.hexToRgb(color1);
    const color2Obj = this.hexToRgb(color2);
    
    result.r = Math.round(color1Obj.r + factor * (color2Obj.r - color1Obj.r));
    result.g = Math.round(color1Obj.g + factor * (color2Obj.g - color1Obj.g));
    result.b = Math.round(color1Obj.b + factor * (color2Obj.b - color1Obj.b));
    result.a = color1Obj.a + factor * (color2Obj.a - color1Obj.a);
    
    return `rgba(${result.r}, ${result.g}, ${result.b}, ${result.a})`;
  }
  
  // Helper method to convert hex color to RGB object
  hexToRgb(color) {
    // Default values
    const result = { r: 255, g: 255, b: 255, a: 1 };
    
    // Check if it's already an rgba color
    if (color.startsWith('rgba')) {
      const parts = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([0-9.]+)\)/);
      if (parts) {
        result.r = parseInt(parts[1]);
        result.g = parseInt(parts[2]);
        result.b = parseInt(parts[3]);
        result.a = parseFloat(parts[4]);
        return result;
      }
    }
    
    // Check if it's an rgb color
    if (color.startsWith('rgb')) {
      const parts = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (parts) {
        result.r = parseInt(parts[1]);
        result.g = parseInt(parts[2]);
        result.b = parseInt(parts[3]);
        return result;
      }
    }
    
    // Handle hex colors
    let hex = color.replace('#', '');
    
    // Convert shorthand hex to full form
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    
    if (hex.length === 6) {
      result.r = parseInt(hex.substring(0, 2), 16);
      result.g = parseInt(hex.substring(2, 4), 16);
      result.b = parseInt(hex.substring(4, 6), 16);
    }
    
    return result;
  }
  
  // Create a particle trail following an entity
  createTrailEffect(entity, options = {}) {
    if (!entity) return;
    
    const defaults = {
      color: entity.color || '#ffffff',
      size: 3,
      interval: 0.05, // seconds between particles
      life: 0.5,
      fadeOut: true,
      shrink: 1.5
    };
    
    const settings = { ...defaults, ...options };
    
    // Check if enough time has passed since last particle
    const now = Date.now() / 1000;
    if (!entity.lastTrailTime || now - entity.lastTrailTime >= settings.interval) {
      entity.lastTrailTime = now;
      
      // Create trail particle
      this.createParticle({
        x: entity.x,
        y: entity.y,
        size: settings.size,
        color: settings.color,
        life: settings.life,
        maxLife: settings.life,
        fadeOut: settings.fadeOut,
        shrink: settings.shrink,
        type: this.particleTypes.standard
      });
    }
  }
  
  // Create particles that follow a path
  createPathParticles(points, options = {}) {
    if (!points || points.length < 2) return;
    
    const defaults = {
      color: '#ffffff',
      size: 3,
      particleCount: 20,
      life: 1,
      fadeOut: true,
      shrink: 0.5
    };
    
    const settings = { ...defaults, ...options };
    
    // Create particles along the path
    for (let i = 0; i < settings.particleCount; i++) {
      // Get position along the path
      const progress = i / settings.particleCount;
      const pointIndex = Math.floor(progress * (points.length - 1));
      const nextPointIndex = Math.min(pointIndex + 1, points.length - 1);
      
      const point = points[pointIndex];
      const nextPoint = points[nextPointIndex];
      
      const subProgress = progress * (points.length - 1) - pointIndex;
      
      // Interpolate between points
      const x = point.x + (nextPoint.x - point.x) * subProgress;
      const y = point.y + (nextPoint.y - point.y) * subProgress;
      
      // Create particle
      this.createParticle({
        x,
        y,
        size: settings.size,
        color: settings.color,
        life: settings.life * (0.5 + Math.random() * 0.5),
        maxLife: settings.life,
        fadeOut: settings.fadeOut,
        shrink: settings.shrink,
        type: this.particleTypes.standard
      });
    }
  }
  
  // Create a pulsing effect at a position
  createPulseEffect(x, y, options = {}) {
    const defaults = {
      color: '#ffffff',
      size: 30,
      pulseCount: 3,
      interval: 0.2, // seconds between pulses
      life: 0.8
    };
    
    const settings = { ...defaults, ...options };
    
    // Create multiple pulses with delay
    for (let i = 0; i < settings.pulseCount; i++) {
      setTimeout(() => {
        this.createParticle({
          x,
          y,
          size: settings.size,
          color: settings.color,
          life: settings.life,
          maxLife: settings.life,
          shape: 'glow',
          type: this.particleTypes.standard
        });
      }, i * settings.interval * 1000);
    }
  }
  
  // Create particles that spell out text
  createTextParticles(x, y, text, options = {}) {
    const defaults = {
      color: '#ffffff',
      size: 16,
      particleSize: 2,
      particleDensity: 0.3, // particles per pixel
      life: 1.5,
      explosionForce: 50
    };
    
    const settings = { ...defaults, ...options };
    
    // Create an offscreen canvas to render the text
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size based on text size
    canvas.width = text.length * settings.size;
    canvas.height = settings.size * 2;
    
    // Draw text on canvas
    ctx.font = `${settings.size}px Arial`;
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    
    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Create particles for each pixel
    for (let i = 0; i < data.length; i += 4) {
      // Skip transparent pixels
      if (data[i + 3] === 0) continue;
      
      // Skip pixels based on density
      if (Math.random() > settings.particleDensity) continue;
      
      // Calculate position
      const pixelIndex = i / 4;
      const pixelX = pixelIndex % canvas.width;
      const pixelY = Math.floor(pixelIndex / canvas.width);
      
      // Convert to world coordinates
      const worldX = x - canvas.width / 2 + pixelX;
      const worldY = y - canvas.height / 2 + pixelY;
      
      // Create explosion effect
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * settings.explosionForce;
      
      this.createParticle({
        x: worldX,
        y: worldY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: settings.particleSize,
        color: settings.color,
        life: settings.life * (0.7 + Math.random() * 0.6),
        maxLife: settings.life,
        fadeOut: true,
        shrink: 0.5,
        drag: 0.95,
        type: this.particleTypes.text
      });
    }
  }
  
  // Create a shockwave effect
  createShockwave(x, y, options = {}) {
    const defaults = {
      color: 'rgba(255, 255, 255, 0.8)',
      size: 50,
      expandSpeed: 200, // pixels per second
      life: 0.5,
      thickness: 3
    };
    
    const settings = { ...defaults, ...options };
    
    this.createParticle({
      x,
      y,
      size: settings.size,
      color: settings.color,
      life: settings.life,
      maxLife: settings.life,
      shape: 'custom',
      type: this.particleTypes.standard,
      update: function(deltaTime) {
        // Expand the ring
        this.size += settings.expandSpeed * deltaTime;
      },
      draw: function(ctx) {
        const progress = 1 - this.life / this.maxLife;
        const alpha = 1 - progress;
        
        ctx.strokeStyle = this.color;
        ctx.lineWidth = settings.thickness;
        ctx.globalAlpha = alpha;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
  }
  
  // Create a lightning effect between two points
  createLightning(startX, startY, endX, endY, options = {}) {
    const defaults = {
      color: '#00ffff',
      segments: 10,
      thickness: 2,
      displacement: 30,
      life: 0.3,
      branches: 2
    };
    
    const settings = { ...defaults, ...options };
    
    // Generate lightning path
    const generatePath = (x1, y1, x2, y2, displace, segments) => {
      if (segments <= 1) {
        return [{ x: x1, y: y1 }, { x: x2, y: y2 }];
      }
      
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      
      // Add random displacement
      const perpX = -(y2 - y1);
      const perpY = x2 - x1;
      
      // Normalize perpendicular vector
      const perpLength = Math.sqrt(perpX * perpX + perpY * perpY);
      const normalizedPerpX = perpX / perpLength;
      const normalizedPerpY = perpY / perpLength;
      
      // Apply displacement
      const displaceAmount = (Math.random() - 0.5) * displace;
      const midPointX = midX + normalizedPerpX * displaceAmount;
      const midPointY = midY + normalizedPerpY * displaceAmount;
      
      // Recursively generate path
      const pathStart = generatePath(x1, y1, midPointX, midPointY, displace / 2, segments / 2);
      const pathEnd = generatePath(midPointX, midPointY, x2, y2, displace / 2, segments / 2);
      
      // Combine paths (remove duplicate midpoint)
      return [...pathStart.slice(0, -1), ...pathEnd];
    };
    
    // Generate main lightning path
    const mainPath = generatePath(startX, startY, endX, endY, settings.displacement, settings.segments);
    
    // Create main lightning bolt
    this.createParticle({
      x: startX,
      y: startY,
      size: settings.thickness,
      color: settings.color,
      life: settings.life,
      maxLife: settings.life,
      shape: 'custom',
      type: this.particleTypes.standard,
      path: mainPath,
      draw: function(ctx) {
        const progress = 1 - this.life / this.maxLife;
        const alpha = 1 - progress;
        
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.size;
        ctx.globalAlpha = alpha;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(this.path[0].x, this.path[0].y);
        
        for (let i = 1; i < this.path.length; i++) {
          ctx.lineTo(this.path[i].x, this.path[i].y);
        }
        
        ctx.stroke();
        
        // Add glow effect
        ctx.globalAlpha = alpha * 0.5;
        ctx.lineWidth = this.size * 3;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.stroke();
      }
    });
    
    // Create branches
    for (let i = 0; i < settings.branches; i++) {
      // Pick a random point along the main path
      const branchIndex = Math.floor(Math.random() * (mainPath.length - 2)) + 1;
      const branchStart = mainPath[branchIndex];
      
      // Generate random end point
      const angle = Math.random() * Math.PI * 2;
      const length = settings.displacement * 2;
      const branchEnd = {
        x: branchStart.x + Math.cos(angle) * length,
        y: branchStart.y + Math.sin(angle) * length
      };
      
      // Generate branch path
      const branchPath = generatePath(
        branchStart.x, 
        branchStart.y, 
        branchEnd.x, 
        branchEnd.y, 
        settings.displacement / 2, 
        settings.segments / 2
      );
      
      // Create branch lightning
      this.createParticle({
        x: branchStart.x,
        y: branchStart.y,
        size: settings.thickness * 0.7,
        color: settings.color,
        life: settings.life * 0.7,
        maxLife: settings.life * 0.7,
        shape: 'custom',
        type: this.particleTypes.standard,
        path: branchPath,
        draw: function(ctx) {
          const progress = 1 - this.life / this.maxLife;
          const alpha = 1 - progress;
          
          ctx.strokeStyle = this.color;
          ctx.lineWidth = this.size;
          ctx.globalAlpha = alpha;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          
          ctx.beginPath();
          ctx.moveTo(this.path[0].x, this.path[0].y);
          
          for (let i = 1; i < this.path.length; i++) {
            ctx.lineTo(this.path[i].x, this.path[i].y);
          }
          
          ctx.stroke();
        }
      });
    }
  }
  
  // Create a vortex effect
  createVortex(x, y, options = {}) {
    const defaults = {
      color: '#ffffff',
      particleCount: 50,
      radius: 30,
      rotationSpeed: 2,
      life: 2,
      inward: true
    };
    
    const settings = { ...defaults, ...options };
    
    for (let i = 0; i < settings.particleCount; i++) {
      const angle = (i / settings.particleCount) * Math.PI * 2;
      const distance = settings.radius * Math.random();
      
      const particleX = x + Math.cos(angle) * distance;
      const particleY = y + Math.sin(angle) * distance;
      
      this.createParticle({
        x: particleX,
        y: particleY,
        size: 2 + Math.random() * 3,
        color: settings.color,
        life: settings.life * (0.5 + Math.random() * 0.5),
        maxLife: settings.life,
        fadeOut: true,
        shrink: 0.5,
        type: this.particleTypes.standard,
        angle,
        distance,
        centerX: x,
        centerY: y,
        inward: settings.inward,
        update: function(deltaTime) {
          // Update angle
          this.angle += settings.rotationSpeed * deltaTime;
          
          // Update distance
          if (this.inward) {
            this.distance -= (this.distance * 0.5) * deltaTime;
          } else {
            this.distance += (settings.radius * 0.5) * deltaTime;
          }
          
          // Update position
          this.x = this.centerX + Math.cos(this.angle) * this.distance;
          this.y = this.centerY + Math.sin(this.angle) * this.distance;
        }
      });
    }
  }
  
  // Create a fire effect
  createFire(x, y, options = {}) {
    const defaults = {
      width: 30,
      height: 50,
      particleCount: 20,
      life: 1.5,
      colors: ['#ff5500', '#ff8800', '#ffaa00', '#ffcc00']
    };
    
    const settings = { ...defaults, ...options };
    
    for (let i = 0; i < settings.particleCount; i++) {
      const offsetX = (Math.random() - 0.5) * settings.width;
      const offsetY = Math.random() * settings.height * 0.2;
      const size = 5 + Math.random() * 10;
      
      // Pick random color from palette
      const color = settings.colors[Math.floor(Math.random() * settings.colors.length)];
      
      this.createParticle({
        x: x + offsetX,
        y: y + offsetY,
        vx: offsetX * 0.2,
        vy: -30 - Math.random() * 30,
        size,
        color,
        life: settings.life * (0.7 + Math.random() * 0.6),
        maxLife: settings.life,
        fadeOut: true,
        shrink: 0.7,
        type: this.particleTypes.standard,
        startColor: color,
        endColor: 'rgba(255, 255, 255, 0)',
        colorTransition: true,
        blendMode: 'screen',
        update: function(deltaTime) {
          // Add flickering
          this.size *= (0.95 + Math.random() * 0.1);
          
          // Add sideways drift
          this.vx += (Math.random() - 0.5) * 5 * deltaTime;
        }
      });
    }
  }
  
  // Create a water splash effect
  createWaterSplash(x, y, options = {}) {
    const defaults = {
      color: '#4fc3f7',
      particleCount: 30,
      radius: 20,
      height: 40,
      life: 1.2
    };
    
    const settings = { ...defaults, ...options };
    
    for (let i = 0; i < settings.particleCount; i++) {
      const angle = (Math.random() * 0.8 + 0.1) * Math.PI; // Mostly upward
      const speed = 30 + Math.random() * 50;
      
      this.createParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: -Math.sin(angle) * speed,
        size: 3 + Math.random() * 4,
        color: settings.color,
        life: settings.life * (0.7 + Math.random() * 0.6),
        maxLife: settings.life,
        fadeOut: true,
        shrink: 0.3,
        gravity: 50,
        drag: 0.96,
        type: this.particleTypes.standard,
        gradient: true,
        gradientColor: 'rgba(255, 255, 255, 0.5)'
      });
    }
    
    // Add splash ring
    this.createParticle({
      x,
      y,
      size: settings.radius,
      color: settings.color,
      life: settings.life * 0.5,
      maxLife: settings.life * 0.5,
      shape: 'custom',
      type: this.particleTypes.standard,
      draw: function(ctx) {
        const progress = 1 - this.life / this.maxLife;
        const currentSize = this.size * (1 + progress);
        const alpha = 1 - progress;
        
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = alpha;
        
        ctx.beginPath();
        ctx.ellipse(
          this.x, 
          this.y, 
          currentSize, 
          currentSize * 0.3, 
          0, 
          0, 
          Math.PI * 2
        );
        ctx.stroke();
      }
    });
  }
}
