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
    } else if (sizeType > 0.9) { // 8% chance for large food
      this.radius = 5 + Math.random() * 3; // Large food
      this.mass = Math.PI * this.radius * this.radius * 0.3; // More valuable
    } else { // 90% chance for normal food
      this.radius = 2 + Math.random() * 2; // Normal food
      this.mass = Math.PI * this.radius * this.radius * 0.1;
    }
    
    this.color = this.getRandomColor();
    
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
    }
    
    // Update visual effects
    this.pulsePhase += this.pulseSpeed * deltaTime;
    this.glowIntensity = 0.5 + 0.5 * Math.sin(this.pulsePhase);
    
    // Shift color hue slightly for rainbow effect on some foods
    if (Math.random() < 0.01) { // Only 1% of food items get color shifting
      this.hueShift += this.colorShiftSpeed * deltaTime;
      if (this.hueShift > 1) this.hueShift = 0;
    }
  }
  
  draw(ctx) {
    // Draw glow effect for some food
    if (Math.random() < 0.2 || this.radius > 5) { // Larger food always gets glow
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
    
    // Draw food body
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * (0.9 + 0.1 * this.glowIntensity), 0, Math.PI * 2);
    
    // Apply color shift if active
    if (this.hueShift > 0) {
      ctx.fillStyle = this.shiftColor(this.color, this.hueShift);
    } else {
      ctx.fillStyle = this.color;
    }
    
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
    
    // Add size indicator for larger food
    if (this.radius > 5) {
      ctx.font = `${Math.min(8, this.radius / 2)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'white';
      ctx.fillText('+', this.x, this.y);
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
