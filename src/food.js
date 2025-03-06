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
    } else if (sizeType > 0.9) { // 8% chance for large food
      this.radius = 5 + Math.random() * 3; // Large food
      this.mass = Math.PI * this.radius * this.radius * 0.3; // More valuable
      this.type = 'large';
    } else { // 90% chance for normal food
      this.radius = 2 + Math.random() * 2; // Normal food
      this.mass = Math.PI * this.radius * this.radius * 0.1;
      this.type = 'normal';
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
  
  update(deltaTime) {
    // Update position if this is ejected mass
    if (this.ejectedBy) {
      const elapsed = Date.now() - this.ejectionTime;
      
      if (elapsed < 1000) { // Movement lasts for 1 second
        this.x += this.velocityX * (1 - elapsed / 1000) * deltaTime;
        this.y += this.velocityY * (1 - elapsed / 1000) * deltaTime;
        
        // Keep within world bounds
        this.x = Math.max(0, Math.min(this.game.worldSize, this.x));
        this.y = Math.max(0, Math.min(this.game.worldSize, this.y));
      }
    } else {
      // Update organic drift movement for non-ejected food
      const now = Date.now();
      
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
    
    // Shift color hue slightly for rainbow effect on some foods
    if (Math.random() < 0.01 || this.type === 'extra') { // Extra large food always gets color shifting
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
    }
    
    // Add size indicator for larger food
    if (this.type === 'large' || this.type === 'extra') {
      ctx.font = `${Math.min(8, this.radius / 2)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'white';
      ctx.fillText('+', this.x, this.y);
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
}
