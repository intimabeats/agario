export class ParticleSystem {
  constructor(game) {
    this.game = game;
    this.particles = [];
    this.maxParticles = 1000; // Limit to prevent performance issues
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
      
      // Apply rotation if needed
      if (particle.rotate) {
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation);
        ctx.translate(-particle.x, -particle.y);
      }
      
      // Draw based on shape
      switch (particle.shape) {
        case 'circle':
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fillStyle = particle.color;
          ctx.fill();
          break;
          
        case 'square':
          ctx.fillStyle = particle.color;
          ctx.fillRect(
            particle.x - particle.size / 2,
            particle.y - particle.size / 2,
            particle.size,
            particle.size
          );
          break;
          
        case 'star':
          this.drawStar(ctx, particle.x, particle.y, 5, particle.size / 2, particle.size / 4, particle.color);
          break;
          
        case 'text':
          ctx.font = `${particle.size}px Arial`;
          ctx.fillStyle = particle.color;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(particle.text, particle.x, particle.y);
          break;
      }
      
      ctx.restore();
    });
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
      // Remove oldest particles to make room
      this.particles.splice(0, 10);
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
      shape: 'circle',
      rotate: false,
      rotation: 0,
      rotationSpeed: 0,
      ...options
    };
    
    this.particles.push(particle);
    return particle;
  }
  
  createFoodParticles(x, y, color) {
    const particleCount = 5;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 20 + Math.random() * 30;
      
      this.createParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3,
        color,
        life: 0.5 + Math.random() * 0.5,
        maxLife: 1,
        shrink: 1,
        gravity: 10
      });
    }
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
        gravity: 15
      });
    }
    
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
      fadeOut: true
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
        gravity: 5
      });
    }
  }
  
  createDamageParticles(x, y) {
    const particleCount = 10;
    
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
        shrink: 0.7
      });
    }
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
        shape: Math.random() > 0.7 ? 'star' : 'circle'
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
        rotationSpeed: (Math.random() - 0.5) * 5
      });
    }
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
        shrink: 1
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
        shrink: 0.5
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
      shrink: 3
    });
  }
}
