export class Skins {
  constructor() {
    this.skins = [];
    this.loadedSkins = {};
    this.defaultSkin = 'default';
    
    // Initialize available skins
    this.initSkins();
    
    // Load unlocked skins from storage
    this.loadUnlockedSkins();
  }
  
  initSkins() {
    this.skins = [
      {
        id: 'default',
        name: 'Default',
        description: 'The standard cell appearance',
        pattern: null,
        effect: null,
        locked: false,
        unlockCondition: 'Default skin'
      },
      {
        id: 'striped',
        name: 'Striped',
        description: 'A cell with horizontal stripes',
        pattern: this.createStripedPattern,
        effect: null,
        locked: false,
        unlockCondition: 'Available from the start'
      },
      {
        id: 'spotted',
        name: 'Spotted',
        description: 'A cell with spots',
        pattern: this.createSpottedPattern,
        effect: null,
        locked: false,
        unlockCondition: 'Available from the start'
      },
      {
        id: 'star',
        name: 'Star',
        description: 'A star-shaped cell',
        pattern: this.createStarPattern,
        effect: null,
        locked: false,
        unlockCondition: 'Available from the start'
      },
      {
        id: 'evil',
        name: 'Evil',
        description: 'A menacing cell with an evil face',
        pattern: this.createEvilPattern,
        effect: null,
        locked: true,
        unlockCondition: 'Eat 10 other cells in a single game'
      },
      {
        id: 'happy',
        name: 'Happy',
        description: 'A cheerful cell with a smiling face',
        pattern: this.createHappyPattern,
        effect: null,
        locked: true,
        unlockCondition: 'Reach level 5'
      },
      {
        id: 'sad',
        name: 'Sad',
        description: 'A melancholic cell with a sad face',
        pattern: this.createSadPattern,
        effect: null,
        locked: true,
        unlockCondition: 'Die 10 times'
      },
      {
        id: 'cool',
        name: 'Cool',
        description: 'A cool cell with sunglasses',
        pattern: this.createCoolPattern,
        effect: null,
        locked: true,
        unlockCondition: 'Reach #1 on the leaderboard'
      },
      {
        id: 'glowing',
        name: 'Glowing',
        description: 'A cell with a pulsating glow effect',
        pattern: null,
        effect: 'glow',
        locked: true,
        unlockCondition: 'Reach a score of 50,000'
      },
      {
        id: 'hungry',
        name: 'Hungry',
        description: 'A cell with a hungry mouth',
        pattern: this.createHungryPattern,
        effect: null,
        locked: true,
        unlockCondition: 'Eat 500 food pellets in a single game'
      },
      {
        id: 'predator',
        name: 'Predator',
        description: 'A cell with sharp teeth',
        pattern: this.createPredatorPattern,
        effect: null,
        locked: true,
        unlockCondition: 'Eat 50 other cells in a single game'
      },
      {
        id: 'evolved',
        name: 'Evolved',
        description: 'A cell with a complex pattern',
        pattern: this.createEvolvedPattern,
        effect: 'pulse',
        locked: true,
        unlockCondition: 'Reach level 10'
      },
      {
        id: 'unstoppable',
        name: 'Unstoppable',
        description: 'A cell with a fiery appearance',
        pattern: this.createUnstoppablePattern,
        effect: 'fire',
        locked: true,
        unlockCondition: 'Get a 10-cell kill streak'
      },
      {
        id: 'champion',
        name: 'Champion',
        description: 'A cell with a crown',
        pattern: this.createChampionPattern,
        effect: 'sparkle',
        locked: true,
        unlockCondition: 'Win a battle royale game'
      },
      {
        id: 'explorer',
        name: 'Explorer',
        description: 'A cell with a compass design',
        pattern: this.createExplorerPattern,
        effect: null,
        locked: true,
        unlockCondition: 'Travel 50,000 units in a single game'
      },
      {
        id: 'veteran',
        name: 'Veteran',
        description: 'A battle-scarred cell',
        pattern: this.createVeteranPattern,
        effect: null,
        locked: true,
        unlockCondition: 'Survive for 30 minutes in a single game'
      },
      {
        id: 'energized',
        name: 'Energized',
        description: 'A cell crackling with energy',
        pattern: this.createEnergizedPattern,
        effect: 'electricity',
        locked: true,
        unlockCondition: 'Collect 25 power-ups in a single game'
      },
      {
        id: 'dedicated',
        name: 'Dedicated',
        description: 'A cell with a special emblem',
        pattern: this.createDedicatedPattern,
        effect: null,
        locked: true,
        unlockCondition: 'Play 50 games'
      }
    ];
  }
  
  loadUnlockedSkins() {
    try {
      const unlockedSkins = localStorage.getItem('unlockedSkins');
      if (unlockedSkins) {
        const skinIds = JSON.parse(unlockedSkins);
        
        // Unlock skins
        skinIds.forEach(id => {
          const skin = this.skins.find(s => s.id === id);
          if (skin) {
            skin.locked = false;
          }
        });
      }
    } catch (e) {
      console.warn('Could not load unlocked skins from localStorage:', e);
    }
  }
  
  saveUnlockedSkins() {
    try {
      const unlockedSkins = this.skins
        .filter(skin => !skin.locked)
        .map(skin => skin.id);
      
      localStorage.setItem('unlockedSkins', JSON.stringify(unlockedSkins));
    } catch (e) {
      console.warn('Could not save unlocked skins to localStorage:', e);
    }
  }
  
  unlockSkin(skinId) {
    const skin = this.skins.find(s => s.id === skinId);
    if (skin && skin.locked) {
      skin.locked = false;
      this.saveUnlockedSkins();
      return true;
    }
    return false;
  }
  
  getSkin(skinId) {
    return this.skins.find(s => s.id === skinId) || this.skins.find(s => s.id === this.defaultSkin);
  }
  
  getAvailableSkins() {
    return this.skins;
  }
  
  getUnlockedSkins() {
    return this.skins.filter(skin => !skin.locked);
  }
  
  // Create pattern methods
  createStripedPattern(ctx, color, size) {
    const patternCanvas = document.createElement('canvas');
    const patternCtx = patternCanvas.getContext('2d');
    
    patternCanvas.width = size;
    patternCanvas.height = size;
    
    // Draw background
    patternCtx.fillStyle = color;
    patternCtx.fillRect(0, 0, size, size);
    
    // Draw stripes
    patternCtx.fillStyle = this.adjustColor(color, 0.2);
    const stripeWidth = size / 5;
    
    for (let i = 0; i < size; i += stripeWidth * 2) {
      patternCtx.fillRect(0, i, size, stripeWidth);
    }
    
    return ctx.createPattern(patternCanvas, 'repeat');
  }
  
  createSpottedPattern(ctx, color, size) {
    const patternCanvas = document.createElement('canvas');
    const patternCtx = patternCanvas.getContext('2d');
    
    patternCanvas.width = size;
    patternCanvas.height = size;
    
    // Draw background
    patternCtx.fillStyle = color;
    patternCtx.fillRect(0, 0, size, size);
    
    // Draw spots
    patternCtx.fillStyle = this.adjustColor(color, 0.2);
    
    const spotCount = 5;
    const spotRadius = size / 10;
    
    for (let i = 0; i < spotCount; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      
      patternCtx.beginPath();
      patternCtx.arc(x, y, spotRadius, 0, Math.PI * 2);
      patternCtx.fill();
    }
    
    return ctx.createPattern(patternCanvas, 'repeat');
  }
  
  createStarPattern(ctx, color, size) {
    const patternCanvas = document.createElement('canvas');
    const patternCtx = patternCanvas.getContext('2d');
    
    patternCanvas.width = size;
    patternCanvas.height = size;
    
    // Draw background
    patternCtx.fillStyle = color;
    patternCtx.fillRect(0, 0, size, size);
    
    // Draw star
    patternCtx.fillStyle = this.adjustColor(color, 0.2);
    
    const centerX = size / 2;
    const centerY = size / 2;
    const outerRadius = size / 3;
    const innerRadius = size / 6;
    const spikes = 5;
    
    patternCtx.beginPath();
    
    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i / (spikes * 2)) * Math.PI * 2;
      
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      if (i === 0) {
        patternCtx.moveTo(x, y);
      } else {
        patternCtx.lineTo(x, y);
      }
    }
    
    patternCtx.closePath();
    patternCtx.fill();
    
    return ctx.createPattern(patternCanvas, 'repeat');
  }
  
  createEvilPattern(ctx, color, size) {
    const patternCanvas = document.createElement('canvas');
    const patternCtx = patternCanvas.getContext('2d');
    
    patternCanvas.width = size;
    patternCanvas.height = size;
    
    // Draw background
    patternCtx.fillStyle = color;
    patternCtx.fillRect(0, 0, size, size);
    
    // Draw evil face
    patternCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    
    // Eyes
    const eyeSize = size / 6;
    patternCtx.beginPath();
    patternCtx.arc(size / 3, size / 3, eyeSize, 0, Math.PI * 2);
    patternCtx.fill();
    
    patternCtx.beginPath();
    patternCtx.arc(size * 2 / 3, size / 3, eyeSize, 0, Math.PI * 2);
    patternCtx.fill();
    
    // Eyebrows
    patternCtx.lineWidth = size / 15;
    patternCtx.lineCap = 'round';
    patternCtx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
    
    // Left eyebrow
    patternCtx.beginPath();
    patternCtx.moveTo(size / 4, size / 4);
    patternCtx.lineTo(size * 2 / 5, size / 5);
    patternCtx.stroke();
    
    // Right eyebrow
    patternCtx.beginPath();
    patternCtx.moveTo(size * 3 / 4, size / 4);
    patternCtx.lineTo(size * 3 / 5, size / 5);
    patternCtx.stroke();
    
    // Mouth
    patternCtx.beginPath();
    patternCtx.arc(size / 2, size * 2 / 3, size / 4, 0, Math.PI);
    patternCtx.stroke();
    
    return ctx.createPattern(patternCanvas, 'repeat');
  }
  
  createHappyPattern(ctx, color, size) {
    const patternCanvas = document.createElement('canvas');
    const patternCtx = patternCanvas.getContext('2d');
    
    patternCanvas.width = size;
    patternCanvas.height = size;
    
    // Draw background
    patternCtx.fillStyle = color;
    patternCtx.fillRect(0, 0, size, size);
    
    // Draw happy face
    patternCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    
    // Eyes
    const eyeSize = size / 10;
    patternCtx.beginPath();
    patternCtx.arc(size / 3, size / 3, eyeSize, 0, Math.PI * 2);
    patternCtx.fill();
    
    patternCtx.beginPath();
    patternCtx.arc(size * 2 / 3, size / 3, eyeSize, 0, Math.PI * 2);
    patternCtx.fill();
    
    // Mouth
    patternCtx.lineWidth = size / 15;
    patternCtx.lineCap = 'round';
    patternCtx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
    
    patternCtx.beginPath();
    patternCtx.arc(size / 2, size / 2, size / 3, 0.2 * Math.PI, 0.8 * Math.PI);
    patternCtx.stroke();
    
    return ctx.createPattern(patternCanvas, 'repeat');
  }
  
  createSadPattern(ctx, color, size) {
    const patternCanvas = document.createElement('canvas');
    const patternCtx = patternCanvas.getContext('2d');
    
    patternCanvas.width = size;
    patternCanvas.height = size;
    
    // Draw background
    patternCtx.fillStyle = color;
    patternCtx.fillRect(0, 0, size, size);
    
    // Draw sad face
    patternCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    
    // Eyes
    const eyeSize = size / 10;
    patternCtx.beginPath();
    patternCtx.arc(size / 3, size / 3, eyeSize, 0, Math.PI * 2);
    patternCtx.fill();
    
    patternCtx.beginPath();
    patternCtx.arc(size * 2 / 3, size / 3, eyeSize, 0, Math.PI * 2);
    patternCtx.fill();
    
    // Mouth
    patternCtx.lineWidth = size / 15;
    patternCtx.lineCap = 'round';
    patternCtx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
    
    patternCtx.beginPath();
    patternCtx.arc(size / 2, size * 3 / 4, size / 4, 1.2 * Math.PI, 1.8 * Math.PI, true);
    patternCtx.stroke();
    
    return ctx.createPattern(patternCanvas, 'repeat');
  }
  
  createCoolPattern(ctx, color, size) {
    const patternCanvas = document.createElement('canvas');
    const patternCtx = patternCanvas.getContext('2d');
    
    patternCanvas.width = size;
    patternCanvas.height = size;
    
    // Draw background
    patternCtx.fillStyle = color;
    patternCtx.fillRect(0, 0, size, size);
    
    // Draw cool face with sunglasses
    patternCtx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    
    // Sunglasses
    patternCtx.fillRect(size / 5, size / 3, size * 3 / 5, size / 6);
    
    // Left lens
    patternCtx.beginPath();
    patternCtx.arc(size / 3, size / 3, size / 8, 0, Math.PI * 2);
    patternCtx.fill();
    
    // Right lens
    patternCtx.beginPath();
    patternCtx.arc(size * 2 / 3, size / 3, size / 8, 0, Math.PI * 2);
    patternCtx.fill();
    
    // Mouth
    patternCtx.lineWidth = size / 15;
    patternCtx.lineCap = 'round';
    patternCtx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
    
    patternCtx.beginPath();
    patternCtx.arc(size / 2, size / 2, size / 4, 0.1 * Math.PI, 0.9 * Math.PI);
    patternCtx.stroke();
    
    return ctx.createPattern(patternCanvas, 'repeat');
  }
  
  createHungryPattern(ctx, color, size) {
    const patternCanvas = document.createElement('canvas');
    const patternCtx = patternCanvas.getContext('2d');
    
    patternCanvas.width = size;
    patternCanvas.height = size;
    
    // Draw background
    patternCtx.fillStyle = color;
    patternCtx.fillRect(0, 0, size, size);
    
    // Draw hungry mouth
    patternCtx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    
    // Mouth
    patternCtx.beginPath();
    patternCtx.arc(size / 2, size / 2, size / 3, 0.1 * Math.PI, 1.9 * Math.PI);
    patternCtx.fill();
    
    // Tongue
    patternCtx.fillStyle = '#ff4444';
    patternCtx.beginPath();
    patternCtx.arc(size / 2, size * 2 / 3, size / 8, 0, Math.PI * 2);
    patternCtx.fill();
    
    return ctx.createPattern(patternCanvas, 'repeat');
  }
  
  createPredatorPattern(ctx, color, size) {
    const patternCanvas = document.createElement('canvas');
    const patternCtx = patternCanvas.getContext('2d');
    
    patternCanvas.width = size;
    patternCanvas.height = size;
    
    // Draw background
    patternCtx.fillStyle = color;
    patternCtx.fillRect(0, 0, size, size);
    
    // Draw predator face with teeth
    patternCtx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    
    // Eyes
    const eyeSize = size / 8;
    patternCtx.beginPath();
    patternCtx.arc(size / 3, size / 3, eyeSize, 0, Math.PI * 2);
    patternCtx.fill();
    
    patternCtx.beginPath();
    patternCtx.arc(size * 2 / 3, size / 3, eyeSize, 0, Math.PI * 2);
    patternCtx.fill();
    
    // Mouth
    patternCtx.beginPath();
    patternCtx.arc(size / 2, size / 2, size / 3, 0.1 * Math.PI, 0.9 * Math.PI);
    patternCtx.fill();
    
    // Teeth
    patternCtx.fillStyle = 'white';
    const teethCount = 5;
    const teethWidth = (size / 3) / teethCount;
    
    for (let i = 0; i < teethCount; i++) {
      const x = size / 3 + i * teethWidth;
      patternCtx.beginPath();
      patternCtx.moveTo(x, size / 2);
      patternCtx.lineTo(x + teethWidth / 2, size * 2 / 3);
      patternCtx.lineTo(x + teethWidth, size / 2);
      patternCtx.fill();
    }
    
    return ctx.createPattern(patternCanvas, 'repeat');
  }
  
  createEvolvedPattern(ctx, color, size) {
    const patternCanvas = document.createElement('canvas');
    const patternCtx = patternCanvas.getContext('2d');
    
    patternCanvas.width = size;
    patternCanvas.height = size;
    
    // Draw background
    patternCtx.fillStyle = color;
    patternCtx.fillRect(0, 0, size, size);
    
    // Draw evolved pattern
    patternCtx.strokeStyle = this.adjustColor(color, 0.3);
    patternCtx.lineWidth = size / 20;
    
    // Draw DNA-like pattern
    for (let i = 0; i < size; i += size / 10) {
      patternCtx.beginPath();
      patternCtx.moveTo(0, i);
      patternCtx.bezierCurveTo(
        size / 3, i + size / 20,
        size * 2 / 3, i - size / 20,
        size, i
      );
      patternCtx.stroke();
    }
    
    // Draw circles
    patternCtx.fillStyle = this.adjustColor(color, 0.2);
    
    for (let i = 0; i < 3; i++) {
      const x = size / 4 + (i * size / 4);
      const y = size / 4 + (i * size / 4);
      const radius = size / 10;
      
      patternCtx.beginPath();
      patternCtx.arc(x, y, radius, 0, Math.PI * 2);
      patternCtx.fill();
    }
    
    return ctx.createPattern(patternCanvas, 'repeat');
  }
  
  createUnstoppablePattern(ctx, color, size) {
    const patternCanvas = document.createElement('canvas');
    const patternCtx = patternCanvas.getContext('2d');
    
    patternCanvas.width = size;
    patternCanvas.height = size;
    
    // Draw background
    patternCtx.fillStyle = color;
    patternCtx.fillRect(0, 0, size, size);
    
    // Draw fire-like pattern
    const flameCount = 8;
    const flameWidth = size / flameCount;
    
    for (let i = 0; i < flameCount; i++) {
      const x = i * flameWidth;
      const height = size / 2 + Math.random() * size / 4;
      
      const gradient = patternCtx.createLinearGradient(x, size, x, size - height);
      gradient.addColorStop(0, this.adjustColor(color, 0.3));
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0.5)');
      
      patternCtx.fillStyle = gradient;
      
      patternCtx.beginPath();
      patternCtx.moveTo(x, size);
      patternCtx.quadraticCurveTo(
        x + flameWidth / 2, size - height,
        x + flameWidth, size
      );
      patternCtx.fill();
    }
    
    return ctx.createPattern(patternCanvas, 'repeat');
  }
  
  createChampionPattern(ctx, color, size) {
    const patternCanvas = document.createElement('canvas');
    const patternCtx = patternCanvas.getContext('2d');
    
    patternCanvas.width = size;
    patternCanvas.height = size;
    
    // Draw background
    patternCtx.fillStyle = color;
    patternCtx.fillRect(0, 0, size, size);
    
    // Draw crown
    patternCtx.fillStyle = '#ffd700'; // Gold color
    
    // Crown base
    patternCtx.fillRect(size / 4, size / 3, size / 2, size / 6);
    
    // Crown points
    const pointCount = 3;
    const pointWidth = (size / 2) / pointCount;
    
    for (let i = 0; i < pointCount; i++) {
      const x = size / 4 + i * pointWidth;
      
      patternCtx.beginPath();
      patternCtx.moveTo(x, size / 3);
      patternCtx.lineTo(x + pointWidth / 2, size / 6);
      patternCtx.lineTo(x + pointWidth, size / 3);
      patternCtx.fill();
    }
    
    // Crown jewels
    patternCtx.fillStyle = '#ff0000'; // Red jewel
    patternCtx.beginPath();
    patternCtx.arc(size / 2, size / 3 + size / 12, size / 20, 0, Math.PI * 2);
    patternCtx.fill();
    
    patternCtx.fillStyle = '#0000ff'; // Blue jewels
    patternCtx.beginPath();
    patternCtx.arc(size / 3, size / 3 + size / 12, size / 20, 0, Math.PI * 2);
    patternCtx.fill();
    
    patternCtx.beginPath();
    patternCtx.arc(size * 2 / 3, size / 3 + size / 12, size / 20, 0, Math.PI * 2);
    patternCtx.fill();
    
    return ctx.createPattern(patternCanvas, 'repeat');
  }
  
  createExplorerPattern(ctx, color, size) {
    const patternCanvas = document.createElement('canvas');
    const patternCtx = patternCanvas.getContext('2d');
    
    patternCanvas.width = size;
    patternCanvas.height = size;
    
    // Draw background
    patternCtx.fillStyle = color;
    patternCtx.fillRect(0, 0, size, size);
    
    // Draw compass
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 3;
    
    // Compass circle
    patternCtx.strokeStyle = this.adjustColor(color, 0.3);
    patternCtx.lineWidth = size / 30;
    patternCtx.beginPath();
    patternCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    patternCtx.stroke();
    
    // Compass needle
    patternCtx.fillStyle = '#ff0000'; // Red for north
    patternCtx.beginPath();
    patternCtx.moveTo(centerX, centerY - radius);
    patternCtx.lineTo(centerX - radius / 6, centerY);
    patternCtx.lineTo(centerX + radius / 6, centerY);
    patternCtx.fill();
    
    patternCtx.fillStyle = 'white'; // White for south
    patternCtx.beginPath();
    patternCtx.moveTo(centerX, centerY + radius);
    patternCtx.lineTo(centerX - radius / 6, centerY);
    patternCtx.lineTo(centerX + radius / 6, centerY);
    patternCtx.fill();
    
    // Compass center
    patternCtx.fillStyle = this.adjustColor(color, 0.3);
    patternCtx.beginPath();
    patternCtx.arc(centerX, centerY, radius / 6, 0, Math.PI * 2);
    patternCtx.fill();
    
    return ctx.createPattern(patternCanvas, 'repeat');
  }
  
  createVeteranPattern(ctx, color, size) {
    const patternCanvas = document.createElement('canvas');
    const patternCtx = patternCanvas.getContext('2d');
    
    patternCanvas.width = size;
    patternCanvas.height = size;
    
    // Draw background
    patternCtx.fillStyle = color;
    patternCtx.fillRect(0, 0, size, size);
    
    // Draw battle scars
    patternCtx.strokeStyle = this.adjustColor(color, 0.4);
    patternCtx.lineWidth = size / 20;
    patternCtx.lineCap = 'round';
    
    // Draw several scars
    for (let i = 0; i < 3; i++) {
      const startX = Math.random() * size;
      const startY = Math.random() * size;
      const length = size / 3 + Math.random() * size / 3;
      const angle = Math.random() * Math.PI * 2;
      
      patternCtx.beginPath();
      patternCtx.moveTo(startX, startY);
      patternCtx.lineTo(
        startX + Math.cos(angle) * length,
        startY + Math.sin(angle) * length
      );
      patternCtx.stroke();
    }
    
        // Draw medal
    patternCtx.fillStyle = '#ffd700'; // Gold color
    patternCtx.beginPath();
    patternCtx.arc(size * 3 / 4, size * 3 / 4, size / 8, 0, Math.PI * 2);
    patternCtx.fill();
    
    // Medal ribbon
    patternCtx.fillStyle = '#ff0000'; // Red ribbon
    patternCtx.beginPath();
    patternCtx.moveTo(size * 3 / 4, size * 3 / 4 + size / 8);
    patternCtx.lineTo(size * 3 / 4 - size / 10, size);
    patternCtx.lineTo(size * 3 / 4 + size / 10, size);
    patternCtx.fill();
    
    return ctx.createPattern(patternCanvas, 'repeat');
  }
  
  createEnergizedPattern(ctx, color, size) {
    const patternCanvas = document.createElement('canvas');
    const patternCtx = patternCanvas.getContext('2d');
    
    patternCanvas.width = size;
    patternCanvas.height = size;
    
    // Draw background
    patternCtx.fillStyle = color;
    patternCtx.fillRect(0, 0, size, size);
    
    // Draw energy bolts
    patternCtx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    patternCtx.lineWidth = size / 30;
    patternCtx.lineCap = 'round';
    patternCtx.lineJoin = 'round';
    
    // Draw lightning bolts
    for (let i = 0; i < 3; i++) {
      const startX = Math.random() * size;
      const startY = 0;
      let x = startX;
      let y = startY;
      
      patternCtx.beginPath();
      patternCtx.moveTo(x, y);
      
      // Create jagged lightning path
      const segments = 5 + Math.floor(Math.random() * 3);
      for (let j = 0; j < segments; j++) {
        const nextY = y + size / segments;
        const nextX = x + (Math.random() - 0.5) * size / 2;
        
        patternCtx.lineTo(nextX, nextY);
        x = nextX;
        y = nextY;
      }
      
      patternCtx.stroke();
    }
    
    return ctx.createPattern(patternCanvas, 'repeat');
  }
  
  createDedicatedPattern(ctx, color, size) {
    const patternCanvas = document.createElement('canvas');
    const patternCtx = patternCanvas.getContext('2d');
    
    patternCanvas.width = size;
    patternCanvas.height = size;
    
    // Draw background
    patternCtx.fillStyle = color;
    patternCtx.fillRect(0, 0, size, size);
    
    // Draw emblem
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 3;
    
    // Emblem circle
    patternCtx.strokeStyle = this.adjustColor(color, 0.3);
    patternCtx.lineWidth = size / 20;
    patternCtx.beginPath();
    patternCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    patternCtx.stroke();
    
    // Emblem star
    patternCtx.fillStyle = this.adjustColor(color, 0.3);
    
    const starPoints = 5;
    const outerRadius = radius * 0.8;
    const innerRadius = radius * 0.4;
    
    patternCtx.beginPath();
    
    for (let i = 0; i < starPoints * 2; i++) {
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i / (starPoints * 2)) * Math.PI * 2;
      
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;
      
      if (i === 0) {
        patternCtx.moveTo(x, y);
      } else {
        patternCtx.lineTo(x, y);
      }
    }
    
    patternCtx.closePath();
    patternCtx.fill();
    
    return ctx.createPattern(patternCanvas, 'repeat');
  }
  
  // Helper method to adjust color brightness
  adjustColor(color, factor) {
    // Convert hex to RGB
    let r, g, b;
    
    if (color.startsWith('#')) {
      const hex = color.substring(1);
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    } else if (color.startsWith('rgb')) {
      const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
      if (match) {
        r = parseInt(match[1]);
        g = parseInt(match[2]);
        b = parseInt(match[3]);
      } else {
        return color; // Return original if can't parse
      }
    } else {
      return color; // Return original if not hex or rgb
    }
    
    // Adjust brightness
    if (factor > 1) {
      // Lighten
      r = Math.min(255, Math.floor(r * factor));
      g = Math.min(255, Math.floor(g * factor));
      b = Math.min(255, Math.floor(b * factor));
    } else {
      // Darken
      r = Math.floor(r * factor);
      g = Math.floor(g * factor);
      b = Math.floor(b * factor);
    }
    
    // Convert back to hex
    return `rgb(${r}, ${g}, ${b})`;
  }
}

export class Skin {
  constructor(skinId, color) {
    this.id = skinId;
    this.color = color;
    this.isLoaded = false;
    this.pattern = null;
    this.effect = null;
    this.effectState = {
      time: 0,
      phase: 0
    };
    
    // Initialize skin
    this.init();
  }
  
  init() {
    // Get skin data from Skins class
    const skinsManager = new Skins();
    const skinData = skinsManager.getSkin(this.id);
    
    if (skinData) {
      if (typeof skinData.pattern === 'function') {
        this.patternGenerator = skinData.pattern;
      }
      
      this.effect = skinData.effect;
      this.isLoaded = true;
    }
  }
  
  setColor(color) {
    this.color = color;
    this.pattern = null; // Reset pattern so it will be regenerated with new color
  }
  
  drawSkin(ctx, x, y, radius) {
    if (!this.isLoaded) return;
    
    // Generate pattern if needed
    if (this.patternGenerator && !this.pattern) {
      this.pattern = this.patternGenerator.call(new Skins(), ctx, this.color, radius * 2);
    }
    
    // Draw cell with pattern or color
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    
    if (this.pattern) {
      ctx.fillStyle = this.pattern;
    } else {
      ctx.fillStyle = this.color;
    }
    
    ctx.fill();
    
    // Apply effects
    if (this.effect) {
      this.applyEffect(ctx, x, y, radius);
    }
  }
  
  applyEffect(ctx, x, y, radius) {
    // Update effect state
    this.effectState.time += 0.016; // Assume 60fps
    this.effectState.phase = (this.effectState.phase + 0.05) % (Math.PI * 2);
    
    switch (this.effect) {
      case 'glow':
        this.applyGlowEffect(ctx, x, y, radius);
        break;
      case 'pulse':
        this.applyPulseEffect(ctx, x, y, radius);
        break;
      case 'fire':
        this.applyFireEffect(ctx, x, y, radius);
        break;
      case 'sparkle':
        this.applySparkleEffect(ctx, x, y, radius);
        break;
      case 'electricity':
        this.applyElectricityEffect(ctx, x, y, radius);
        break;
    }
  }
  
  applyGlowEffect(ctx, x, y, radius) {
    // Create pulsating glow
    const glowSize = radius * (1.2 + Math.sin(this.effectState.phase) * 0.1);
    const gradient = ctx.createRadialGradient(
      x, y, radius * 0.8,
      x, y, glowSize
    );
    
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.3)');
    
    ctx.beginPath();
    ctx.arc(x, y, glowSize, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  }
  
  applyPulseEffect(ctx, x, y, radius) {
    // Create pulsating ring
    const pulseSize = radius * (1.1 + Math.sin(this.effectState.phase) * 0.1);
    
    ctx.beginPath();
    ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  
  applyFireEffect(ctx, x, y, radius) {
    // Create fire particles
    const particleCount = 5;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + this.effectState.phase;
      const distance = radius * 0.9;
      
      const particleX = x + Math.cos(angle) * distance;
      const particleY = y + Math.sin(angle) * distance;
      
      const size = radius * 0.2 * (0.5 + Math.random() * 0.5);
      
      // Draw fire particle
      const gradient = ctx.createRadialGradient(
        particleX, particleY, 0,
        particleX, particleY, size
      );
      
      gradient.addColorStop(0, 'rgba(255, 200, 0, 0.8)');
      gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
      
      ctx.beginPath();
      ctx.arc(particleX, particleY, size, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    }
  }
  
  applySparkleEffect(ctx, x, y, radius) {
    // Create sparkle particles
    const particleCount = 3;
    
    for (let i = 0; i < particleCount; i++) {
      // Only show some particles each frame for a twinkling effect
      if (Math.random() > 0.7) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * radius;
        
        const particleX = x + Math.cos(angle) * distance;
        const particleY = y + Math.sin(angle) * distance;
        
        const size = radius * 0.1 * (0.5 + Math.random() * 0.5);
        
        // Draw sparkle
        ctx.beginPath();
        ctx.arc(particleX, particleY, size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fill();
      }
    }
  }
  
  applyElectricityEffect(ctx, x, y, radius) {
    // Create electricity bolts
    const boltCount = 3;
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    
    for (let i = 0; i < boltCount; i++) {
      // Only show some bolts each frame
      if (Math.random() > 0.5) {
        const startAngle = Math.random() * Math.PI * 2;
        const endAngle = startAngle + (Math.random() * Math.PI / 2 - Math.PI / 4);
        
        const startX = x + Math.cos(startAngle) * radius;
        const startY = y + Math.sin(startAngle) * radius;
        
        const endX = x + Math.cos(endAngle) * radius * 1.2;
        const endY = y + Math.sin(endAngle) * radius * 1.2;
        
        // Draw jagged lightning bolt
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        
        // Create jagged path
        let currentX = startX;
        let currentY = startY;
        const segments = 3;
        
        for (let j = 0; j < segments; j++) {
          const progress = (j + 1) / segments;
          const targetX = startX + (endX - startX) * progress;
          const targetY = startY + (endY - startY) * progress;
          
          // Add some randomness to the path
          const perpX = -(endY - startY);
          const perpY = endX - startX;
          const perpLength = Math.sqrt(perpX * perpX + perpY * perpY);
          
          const jitter = (Math.random() - 0.5) * radius * 0.3;
          const offsetX = (perpX / perpLength) * jitter;
          const offsetY = (perpY / perpLength) * jitter;
          
          currentX = targetX + offsetX;
          currentY = targetY + offsetY;
          
          ctx.lineTo(currentX, currentY);
        }
        
        ctx.stroke();
      }
    }
  }
}
