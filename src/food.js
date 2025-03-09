export class Food {
  constructor(x, y, game) {
    this.x = x;
    this.y = y;
    this.game = game;
    
    // Increased variety in food sizes for more interesting gameplay
    // Some food is now significantly larger and more valuable
    const sizeType = Math.random();
    if (sizeType > 0.98) { // 2% chance for extra large food
      this.radius = 8 + Math.random() * 4; // Extra large food
      this.mass = Math.PI * this.radius * this.radius * 0.5; // Much more valuable
      this.type = 'extra';
      this.value = 3; // 3x normal value
    } else if (sizeType > 0.9) { // 8% chance for large food
      this.radius = 5 + Math.random() * 3; // Large food
      this.mass = Math.PI * this.radius * this.radius * 0.3; // More valuable
      this.type = 'large';
      this.value = 2; // 2x normal value
    } else { // 90% chance for normal food
      this.radius = 2 + Math.random() * 2; // Normal food
      this.mass = Math.PI * this.radius * this.radius * 0.1;
      this.type = 'normal';
      this.value = 1; // Normal value
    }
    
    this.baseRadius = this.radius; // Store original radius for animations
    this.color = this.getRandomColor();
    this.baseColor = this.color; // Store original color
    
    // For ejected mass
    this.velocityX = 0;
    this.velocityY = 0;
    this.ejectedBy = null;
    this.ejectionTime = 0;
    
    // Visual effects
    this.pulsePhase = Math.random() * Math.PI * 2; // Random starting phase
    this.pulseSpeed = 1 + Math.random() * 2; // Random pulse speed
    this.glowIntensity = 0;
    this.hueShift = 0;
    this.colorShiftSpeed = 0.2 + Math.random() * 0.5; // Random color shift speed
    this.rotationAngle = Math.random() * Math.PI * 2; // For non-circular food
    this.rotationSpeed = (Math.random() - 0.5) * 0.2; // Slow rotation
    
    // Organic movement
    this.driftX = 0;
    this.driftY = 0;
    this.driftSpeed = 0.5 + Math.random() * 0.5; // How fast the food drifts
    this.driftAngle = Math.random() * Math.PI * 2; // Random drift direction
    this.driftChangeTime = 0;
    this.driftChangeCooldown = 2000 + Math.random() * 3000; // Time between drift direction changes
    
    // Membrane properties (for larger food items)
    if (this.type === 'large' || this.type === 'extra') {
      this.membrane = {
        points: 10 + Math.floor(Math.random() * 6), // 10-15 points
        elasticity: 0.2, // How elastic the membrane is
        distortion: 0.1, // Maximum distortion amount
        oscillation: 0.03, // Natural oscillation amount
        oscillationSpeed: 1.0 + Math.random() * 0.5, // Speed of oscillation
        phase: Math.random() * Math.PI * 2, // Random starting phase
        vertices: [] // Will store the membrane vertices
      };
      this.initMembrane();
    }
    
    // Special properties for different food types
    this.initSpecialProperties();
    
    // Collision detection optimization
    this.lastCollisionCheck = 0;
    this.collisionCheckInterval = 100; // ms between collision checks
    
    // Performance optimization
    this.isVisible = false; // Whether food is in viewport
    this.lastUpdateTime = Date.now();
    this.updateInterval = 50; // Update every 50ms for performance
  }
  
  initMembrane() {
    if (!this.membrane) return;
    
    const { membrane } = this;
    membrane.vertices = [];
    
    // Create initial membrane vertices in a perfect circle
    for (let i = 0; i < membrane.points; i++) {
      const angle = (i / membrane.points) * Math.PI * 2;
      membrane.vertices.push({
        angle,
        baseX: Math.cos(angle),
        baseY: Math.sin(angle),
        distortionX: 0,
        distortionY: 0,
        velocityX: 0,
        velocityY: 0
      });
    }
  }
  
  initSpecialProperties() {
    // Add special properties based on food type
    switch (this.type) {
      case 'extra':
        // Extra large food has special effects
        this.specialEffect = 'rainbow'; // Color shifting effect
        this.experienceBonus = 10; // Extra XP when eaten
        this.particleCount = 15; // More particles when eaten
        this.soundEffect = 'specialFood'; // Special sound when eaten
        break;
        
      case 'large':
        // Large food has minor special effects
        this.specialEffect = 'pulse'; // Pulsing effect
        this.experienceBonus = 5; // Some extra XP
        this.particleCount = 8; // More particles than normal
        break;
        
      case 'normal':
      default:
        // Normal food has no special effects
        this.specialEffect = null;
        this.experienceBonus = 0;
        this.particleCount = 5; // Standard particle count
        break;
    }
    
    // Randomly assign shapes to some food
    if (Math.random() < 0.2) {
      const shapes = ['triangle', 'square', 'pentagon', 'hexagon', 'star'];
      this.shape = shapes[Math.floor(Math.random() * shapes.length)];
    } else {
      this.shape = 'circle'; // Default shape
    }
  }
  
  update(deltaTime) {
    // Performance optimization - only update at intervals
    const now = Date.now();
    if (now - this.lastUpdateTime < this.updateInterval && !this.isVisible) {
      return;
    }
    this.lastUpdateTime = now;
    
    // Update position if this is ejected mass
    if (this.ejectedBy) {
      const elapsed = now - this.ejectionTime;
      
      if (elapsed < 1000) { // Movement lasts for 1 second
        this.x += this.velocityX * (1 - elapsed / 1000) * deltaTime;
        this.y += this.velocityY * (1 - elapsed / 1000) * deltaTime;
        
        // Keep within world bounds
        this.x = Math.max(0, Math.min(this.game.worldSize, this.x));
        this.y = Math.max(0, Math.min(this.game.worldSize, this.y));
      }
    } else {
      // Update organic drift movement for non-ejected food
      // Change drift direction periodically
      if (now > this.driftChangeTime) {
        this.driftAngle = Math.random() * Math.PI * 2;
        this.driftSpeed = 0.5 + Math.random() * 0.5;
        this.driftChangeTime = now + this.driftChangeCooldown;
      }
      
      // Apply drift movement
      this.driftX = Math.cos(this.driftAngle) * this.driftSpeed;
      this.driftY = Math.sin(this.driftAngle) * this.driftSpeed;
      
      // Move food slightly
      this.x += this.driftX * deltaTime;
      this.y += this.driftY * deltaTime;
      
      // Keep within world bounds with bounce effect
      if (this.x < this.radius || this.x > this.game.worldSize - this.radius) {
        this.driftX *= -1;
        this.driftAngle = Math.PI - this.driftAngle;
      }
      if (this.y < this.radius || this.y > this.game.worldSize - this.radius) {
        this.driftY *= -1;
        this.driftAngle = -this.driftAngle;
      }
      
      this.x = Math.max(this.radius, Math.min(this.game.worldSize - this.radius, this.x));
      this.y = Math.max(this.radius, Math.min(this.game.worldSize - this.radius, this.y));
    }
    
    // Update visual effects
    this.pulsePhase += this.pulseSpeed * deltaTime;
    this.glowIntensity = 0.5 + 0.5 * Math.sin(this.pulsePhase);
    
    // Animate radius with pulsing
    const pulseFactor = 1 + Math.sin(this.pulsePhase) * 0.1;
    this.radius = this.baseRadius * pulseFactor;
    
    // Update rotation for non-circular shapes
    if (this.shape !== 'circle') {
      this.rotationAngle += this.rotationSpeed * deltaTime;
    }
    
    // Shift color hue for special effects
    if (this.specialEffect === 'rainbow' || Math.random() < 0.01) {
      this.hueShift += this.colorShiftSpeed * deltaTime;
      if (this.hueShift > 1) this.hueShift = 0;
      this.color = this.shiftColor(this.baseColor, this.hueShift);
    }
    
    // Update membrane if present
    if (this.membrane) {
      this.updateMembrane(deltaTime);
    }
  }
  
  updateMembrane(deltaTime) {
    const { membrane } = this;
    
    // Update membrane phase
    membrane.phase += membrane.oscillationSpeed * deltaTime;
    
    // Update each vertex
    membrane.vertices.forEach(vertex => {
      // Apply natural oscillation
      const oscillation = membrane.oscillation * Math.sin(vertex.angle * 3 + membrane.phase);
      
      // Apply elasticity to return to base shape
      vertex.velocityX += -vertex.distortionX * membrane.elasticity;
      vertex.velocityY += -vertex.distortionY * membrane.elasticity;
      
      // Apply damping
      vertex.velocityX *= 0.9;
      vertex.velocityY *= 0.9;
      
      // Update distortion
      vertex.distortionX += vertex.velocityX * deltaTime * 5;
      vertex.distortionY += vertex.velocityY * deltaTime * 5;
      
      // Limit maximum distortion
      const distortionLength = Math.sqrt(vertex.distortionX * vertex.distortionX + vertex.distortionY * vertex.distortionY);
      if (distortionLength > membrane.distortion) {
        const scale = membrane.distortion / distortionLength;
        vertex.distortionX *= scale;
        vertex.distortionY *= scale;
      }
      
      // Add oscillation to distortion
      vertex.distortionX += vertex.baseX * oscillation;
      vertex.distortionY += vertex.baseY * oscillation;
    });
  }
  
  draw(ctx) {
    // Skip drawing if not visible (optimization)
    if (!this.isVisible && !this.game.debugMode) return;
    
    // Draw glow effect for some food
    if (this.type !== 'normal' || Math.random() < 0.2) { // Larger food always gets glow
      const glowRadius = this.radius * (1.5 + this.glowIntensity * 0.5);
      const gradient = ctx.createRadialGradient(
        this.x, this.y, this.radius * 0.5,
        this.x, this.y, glowRadius
      );
      gradient.addColorStop(0, this.color);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.globalAlpha = 0.3 * this.glowIntensity;
      ctx.beginPath();
      ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    
    // Draw food body with membrane if present
    if (this.membrane && (this.type === 'large' || this.type === 'extra')) {
      this.drawWithMembrane(ctx);
    } else {
      // Draw based on shape
      switch (this.shape) {
        case 'triangle':
          this.drawTriangle(ctx);
          break;
        case 'square':
          this.drawSquare(ctx);
          break;
        case 'pentagon':
          this.drawPolygon(ctx, 5);
          break;
        case 'hexagon':
          this.drawPolygon(ctx, 6);
          break;
        case 'star':
          this.drawStar(ctx);
          break;
        case 'circle':
        default:
          // Draw simple food body
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius * (0.9 + 0.1 * this.glowIntensity), 0, Math.PI * 2);
          ctx.fillStyle = this.color;
          ctx.fill();
          
          // Add a small highlight for 3D effect
          ctx.beginPath();
          ctx.arc(
            this.x - this.radius * 0.3, 
            this.y - this.radius * 0.3, 
            this.radius * 0.3, 
            0, Math.PI * 2
          );
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.fill();
          break;
      }
    }
    
    // Add size indicator for larger food
    if (this.type === 'large' || this.type === 'extra') {
      ctx.font = `${Math.min(8, this.radius / 2)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'white';
      ctx.fillText('+', this.x, this.y);
    }
    
    // Draw debug info if debug mode is enabled
    if (this.game.debugMode) {
      ctx.font = '8px Arial';
      ctx.fillStyle = 'white';
      ctx.fillText(`${this.type}`, this.x, this.y - this.radius - 5);
      ctx.fillText(`m:${Math.floor(this.mass)}`, this.x, this.y - this.radius - 15);
    }
  }
  
  drawWithMembrane(ctx) {
    const { membrane } = this;
    
    // Start drawing the membrane
    ctx.beginPath();
    
    // Draw membrane using vertices
    if (membrane.vertices.length > 0) {
      const firstVertex = membrane.vertices[0];
      const startX = this.x + (firstVertex.baseX + firstVertex.distortionX) * this.radius;
      const startY = this.y + (firstVertex.baseY + firstVertex.distortionY) * this.radius;
      
      ctx.moveTo(startX, startY);
      
      // Draw the rest of the vertices
      for (let i = 1; i < membrane.vertices.length; i++) {
        const vertex = membrane.vertices[i];
        const x = this.x + (vertex.baseX + vertex.distortionX) * this.radius;
        const y = this.y + (vertex.baseY + vertex.distortionY) * this.radius;
        
        ctx.lineTo(x, y);
      }
      
      // Close the path
      ctx.closePath();
    } else {
      // Fallback to circle if no vertices
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    }
    
    // Fill with food color
    ctx.fillStyle = this.color;
    ctx.fill();
    
    // Draw cell border
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.stroke();
    
    // Draw inner details for larger food
    if (this.type === 'extra') {
      // Draw nucleus
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fill();
      
      // Draw small organelles
      const numDetails = Math.floor(this.radius / 3);
      for (let i = 0; i < numDetails; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * this.radius * 0.7;
        const detailX = this.x + Math.cos(angle) * distance;
        const detailY = this.y + Math.sin(angle) * distance;
        const detailSize = this.radius * 0.1 + Math.random() * this.radius * 0.1;
        
        ctx.beginPath();
        ctx.arc(detailX, detailY, detailSize, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fill();
      }
    }
  }
  
  drawTriangle(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotationAngle);
    
    ctx.beginPath();
    const size = this.radius * 1.2; // Slightly larger to match circle area
    
    ctx.moveTo(0, -size);
    ctx.lineTo(-size * 0.866, size * 0.5); // cos(60°), sin(60°)
    ctx.lineTo(size * 0.866, size * 0.5);
    ctx.closePath();
    
    ctx.fillStyle = this.color;
    ctx.fill();
    
    // Add highlight
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(-size * 0.433, -size * 0.25); // Half-way to bottom left
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fill();
    
    ctx.restore();
  }
  
  drawSquare(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotationAngle);
    
    const size = this.radius * 0.9; // Adjust size to match circle area
    
    ctx.beginPath();
    ctx.rect(-size, -size, size * 2, size * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    
    // Add highlight
    ctx.beginPath();
    ctx.moveTo(-size, -size);
    ctx.lineTo(0, -size);
    ctx.lineTo(0, 0);
    ctx.lineTo(-size, 0);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fill();
    
    ctx.restore();
  }
  
  drawPolygon(ctx, sides) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotationAngle);
    
    ctx.beginPath();
    const size = this.radius * 1.1; // Adjust size to match circle area
    
    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2;
      const x = Math.cos(angle) * size;
      const y = Math.sin(angle) * size;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.fill();
    
    // Add highlight
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let i = 0; i < Math.ceil(sides / 2); i++) {
      const angle = (i / sides) * Math.PI * 2;
      const x = Math.cos(angle) * size;
      const y = Math.sin(angle) * size;
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fill();
    
    ctx.restore();
  }
  
  drawStar(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotationAngle);
    
    ctx.beginPath();
    const outerRadius = this.radius * 1.2;
    const innerRadius = this.radius * 0.6;
    const points = 5;
    
    for (let i = 0; i < points * 2; i++) {
      const angle = (i / (points * 2)) * Math.PI * 2;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.fill();
    
    // Add highlight
    ctx.beginPath();
    ctx.moveTo(0, -outerRadius);
    ctx.lineTo(-innerRadius * 0.5, -innerRadius * 0.5);
    ctx.lineTo(0, 0);
    ctx.lineTo(innerRadius * 0.5, -innerRadius * 0.5);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fill();
    
    ctx.restore();
  }
  
  getRandomColor() {
    const colors = [
      '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
      '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
      '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800',
      '#ff5722', '#795548', '#9e9e9e', '#607d8b'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  shiftColor(color, shift) {
    // Convert hex to RGB
    let r, g, b;
    
    if (color.startsWith('#')) {
      const hex = color.substring(1);
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    } else {
      // Default color if parsing fails
      r = 255;
      g = 0;
      b = 0;
    }
    
    // Convert RGB to HSL
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      
      h /= 6;
    }
    
    // Shift hue
    h = (h + shift) % 1;
    
    // Convert back to RGB
    let r1, g1, b1;
    
    if (s === 0) {
      r1 = g1 = b1 = l; // achromatic
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      
      r1 = hue2rgb(p, q, h + 1/3);
      g1 = hue2rgb(p, q, h);
      b1 = hue2rgb(p, q, h - 1/3);
    }
    
    // Convert back to hex
    const toHex = (x) => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r1)}${toHex(g1)}${toHex(b1)}`;
  }
  
  // Check if food is in viewport
  checkVisibility(viewportBounds) {
    const { left, right, top, bottom } = viewportBounds;
    
    this.isVisible = (
      this.x + this.radius > left &&
      this.x - this.radius < right &&
      this.y + this.radius > top &&
      this.y - this.radius < bottom
    );
    
    return this.isVisible;
  }
  
  // Apply magnet effect (used by player/AI with magnet power-up)
  applyMagnetEffect(sourceX, sourceY, strength) {
    const dx = sourceX - this.x;
    const dy = sourceY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
      const force = strength / distance;
      this.x += (dx / distance) * force;
      this.y += (dy / distance) * force;
      
      // Keep within world bounds
      this.x = Math.max(this.radius, Math.min(this.game.worldSize - this.radius, this.x));
      this.y = Math.max(this.radius, Math.min(this.game.worldSize - this.radius, this.y));
      
      // Distort membrane if present
      if (this.membrane) {
        this.distortMembrane(dx / distance, dy / distance, force * 0.1);
      }
      
      return true;
    }
    
    return false;
  }
  
  // Distort membrane when affected by forces
  distortMembrane(dirX, dirY, amount) {
    if (!this.membrane) return;
    
    const { membrane } = this;
    
    // Normalize direction
    const length = Math.sqrt(dirX * dirX + dirY * dirY);
    if (length > 0) {
      dirX /= length;
      dirY /= length;
    }
    
    // Find vertices in the direction of impact
    membrane.vertices.forEach(vertex => {
      // Calculate dot product to determine if vertex is in impact direction
      const dot = vertex.baseX * dirX + vertex.baseY * dirY;
      
      // Apply force to vertices in the impact direction
      if (dot > 0.3) {
        const force = dot * amount;
        vertex.velocityX += dirX * force;
        vertex.velocityY += dirY * force;
      }
    });
  }
}
