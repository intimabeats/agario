import { Skin } from './skins.js';

export class Player {
 constructor(name, color, game) {
  this.id = 'player-' + Date.now();
  this.name = name || 'Player';
  this.color = color || '#ff5252';
  this.game = game;
  
  // Verify if game is valid
  if (!game) {
    console.error("Game object is missing in Player constructor");
  }
  
  // Verify if worldSize is defined
  const worldSize = game && game.worldSize ? game.worldSize : 6000;
  
  // Verify and set initial position
  this.x = isNaN(worldSize) ? 3000 : worldSize / 2;
  this.y = isNaN(worldSize) ? 3000 : worldSize / 2;
  this.targetX = this.x;
  this.targetY = this.y;
  this.baseSpeed = 6.5; // Base speed for better player experience
  this.speed = this.baseSpeed;
  this.acceleration = 0.2; // How quickly player reaches max speed
  this.deceleration = 0.3; // How quickly player slows down
  this.currentVelocityX = 0;
  this.currentVelocityY = 0;
  
  // Movement smoothing
  this.smoothingFactor = 0.2;
  this.movementHistory = []; // For trail effects
  this.movementHistoryMaxLength = 10;
  
  // Size and growth
  this.baseRadius = 20;
  this.radius = this.baseRadius;
  this.mass = Math.PI * this.radius * this.radius;
  this.score = 0;
  
  // Growth and shrink rates
  this.growthRate = 1.5;
  this.shrinkRate = 0.005;
  this.maxRadius = 500; // Maximum radius a cell can have
  
  // Ejection settings
  this.ejectCooldown = 0;
  this.ejectCooldownTime = 250;
  this.ejectSize = 5; // Slightly larger ejected mass
  this.ejectSpeed = 35; // Increased ejection speed
  this.ejectDeceleration = 0.97; // Slower deceleration for longer travel
  this.ejectDistance = 2.5; // Increased ejection distance
  this.ejectMassAmount = 0.06; // Percentage of mass to eject
  this.ejectMinMass = 20; // Minimum mass required to eject
  
  // Split settings
  this.splitVelocity = 18; // Split velocity
  this.splitCooldown = 10000; // 10 seconds cooldown
  this.splitMinMass = 35; // Minimum mass required to split
  this.mergeTime = 15000; // Time before cells can merge
  
  // State
  this.isDead = false;
  
  // Create initial cell with additional checks
  this.cells = [{ 
    x: isNaN(this.x) ? 3000 : this.x, 
    y: isNaN(this.y) ? 3000 : this.y, 
    radius: this.baseRadius, 
    mass: Math.PI * this.baseRadius * this.baseRadius,
    velocityX: 0,
    velocityY: 0,
    membrane: {
      points: 20,
      elasticity: 0.3,
      distortion: 0.15,
      oscillation: 0.05,
      oscillationSpeed: 1.5,
      phase: Math.random() * Math.PI * 2,
      vertices: []
    },
    z: 0,
    id: 'cell-' + Date.now() + '-0',
    effects: []
  }];
  
  // Health
  this.health = 100;
  this.maxHealth = 100;
  this.healthRegenRate = 2; // Health points regenerated per second
  this.damageImmunity = false; // For shield power-up
  this.damageImmunityTime = 0;
  
  // Special abilities
  this.canSplit = true;
  this.splitCooldownTime = 0;
  this.powerUps = {
    speedBoost: { active: false, duration: 0, factor: 1.5, icon: '⚡' },
    shield: { active: false, duration: 0, icon: '🛡️' },
    massBoost: { active: false, duration: 0, factor: 1.2, icon: '⬆️' },
    invisibility: { active: false, duration: 0, opacity: 0.3, icon: '👁️' },
    magnet: { active: false, duration: 0, range: 200, icon: '🧲' },
    freeze: { active: false, duration: 0, icon: '❄️' },
    doubleScore: { active: false, duration: 0, factor: 2, icon: '💰' }
  };
  
  // Experience and levels
  this.experience = 0;
  this.level = 1;
  this.experienceToNextLevel = 1000;
  this.levelBonuses = {
    1: { description: "Starting level" },
    2: { description: "Increased base size", baseRadius: 22 },
    3: { description: "Faster regeneration", healthRegenRate: 3 },
    4: { description: "Reduced shrink rate", shrinkRate: 0.004 },
    5: { description: "Increased speed", baseSpeed: 7 },
    6: { description: "Improved growth rate", growthRate: 1.6 },
    7: { description: "Faster ejection", ejectCooldownTime: 200 },
    8: { description: "Reduced split cooldown", splitCooldown: 9000 },
    9: { description: "Increased max health", maxHealth: 120 },
    10: { description: "Master of cells", baseRadius: 25, healthRegenRate: 4, shrinkRate: 0.003 }
  };
  
  // Customization
  this.skin = 'default';
  this.skinObject = null; // Will be set by setSkin method
  this.effects = [];
  this.nameColor = '#ffffff';
  this.nameFont = 'Arial';
  this.cellBorder = true;
  this.cellBorderColor = 'rgba(0, 0, 0, 0.3)';
  this.cellBorderWidth = 2;
  
  // Team
  this.team = null;
  
  // Initialize cell membranes
  this.initCellMembranes();
  
  // Stats tracking
  this.stats = {
    foodEaten: 0,
    playersEaten: 0,
    virusesEaten: 0,
    timesEjected: 0,
    timesSplit: 0,
    powerUpsCollected: 0,
    maxSize: this.radius,
    maxScore: 0,
    distanceTraveled: 0,
    lastX: this.x,
    lastY: this.y,
    timePlayed: 0,
    deathCount: 0,
    killStreak: 0,
    maxKillStreak: 0,
    highestLevel: 1
  };
  
  // Input state
  this.input = {
    mouseX: 0,
    mouseY: 0,
    keys: {
      w: false,
      a: false,
      s: false,
      d: false,
      space: false
    },
    touchActive: false,
    touchX: 0,
    touchY: 0
  };
  
  // Achievements
  this.achievements = [];
  
  // Notifications
  this.notifications = [];
  this.maxNotifications = 5;
  
  // Audio feedback
  this.lastEatSound = 0;
  this.eatSoundCooldown = 100; // ms between eat sounds
  
  // Performance optimization
  this.lastUpdateTime = Date.now();
  this.updateInterval = 1000 / 60; // Target 60 FPS
  this.skipFrames = 0;
  
  console.log("Player created:", this.x, this.y, "Target:", this.targetX, this.targetY);
  console.log("Initial cell:", JSON.stringify(this.cells[0]));
}

initCellMembranes() {
  if (!this.cells || this.cells.length === 0) {
    console.error("No cells to initialize membranes");
    return;
  }
  
  this.cells.forEach(cell => {
    if (!cell) {
      console.error("Invalid cell for membrane initialization");
      return;
    }
    
    if (!cell.membrane) {
      console.error("Cell has no membrane property:", cell);
      cell.membrane = {
        points: 20,
        elasticity: 0.3,
        distortion: 0.15,
        oscillation: 0.05,
        oscillationSpeed: 1.5,
        phase: Math.random() * Math.PI * 2,
        vertices: []
      };
    }
    
    this.initCellMembrane(cell);
  });
}

initCellMembrane(cell) {
  if (!cell) {
    console.error("Invalid cell for membrane initialization");
    return;
  }
  
  if (!cell.membrane) {
    console.error("Cell has no membrane property for initialization");
    cell.membrane = {
      points: 20,
      elasticity: 0.3,
      distortion: 0.15,
      oscillation: 0.05,
      oscillationSpeed: 1.5,
      phase: Math.random() * Math.PI * 2,
      vertices: []
    };
  }
  
  const { membrane } = cell;
  membrane.vertices = [];
  
  try {
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
  } catch (error) {
    console.error("Error initializing cell membrane:", error);
    // Reset membrane with default values
    cell.membrane = {
      points: 20,
      elasticity: 0.3,
      distortion: 0.15,
      oscillation: 0.05,
      oscillationSpeed: 1.5,
      phase: Math.random() * Math.PI * 2,
      vertices: []
    };
    
    // Try again with reset membrane
    for (let i = 0; i < cell.membrane.points; i++) {
      const angle = (i / cell.membrane.points) * Math.PI * 2;
      cell.membrane.vertices.push({
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
}

update(deltaTime) {
  this.validateCells();

  // Track time played
  this.stats.timePlayed += deltaTime;
  
  // Skip frames for performance if needed
  if (this.skipFrames > 0) {
    this.skipFrames--;
    return;
  }
  
  // Verify if coordinates are valid before any operation
  if (isNaN(this.x) || isNaN(this.y) || isNaN(this.targetX) || isNaN(this.targetY)) {
    console.error("Invalid coordinates detected in update:", this.x, this.y, this.targetX, this.targetY);
    // Reset coordinates to valid values
    this.x = this.game.worldSize / 2;
    this.y = this.game.worldSize / 2;
    this.targetX = this.x;
    this.targetY = this.y;
    
    // Reset cells
    this.cells.forEach(cell => {
      cell.x = this.x;
      cell.y = this.y;
      cell.velocityX = 0;
      cell.velocityY = 0;
    });
  }
  
  // Move towards target
  this.moveTowardsTarget(deltaTime);
  
  // Check collisions
  this.checkCollisions();
  
  // Update cells
  this.updateCells(deltaTime);
  
  // Update cell membranes
  this.updateCellMembranes(deltaTime);
  
  // Update power-ups
  this.updatePowerUps(deltaTime);
  
  // Update score
  this.updateScore();
  
  // Update center of mass
  this.updateCenterOfMass();
  
  // Update max score and size stats
  if (this.score > this.stats.maxScore) {
    this.stats.maxScore = this.score;
  }
  
  const largestCell = this.cells.reduce((largest, cell) => 
    cell.radius > largest.radius ? cell : largest, this.cells[0]);
  if (largestCell.radius > this.stats.maxSize) {
    this.stats.maxSize = largestCell.radius;
  }
  
  // Update distance traveled
  const dx = this.x - this.stats.lastX;
  const dy = this.y - this.stats.lastY;
  const distanceMoved = Math.sqrt(dx * dx + dy * dy);
  this.stats.distanceTraveled += distanceMoved;
  this.stats.lastX = this.x;
  this.stats.lastY = this.y;
  
  // Update movement history for trail effects
  if (distanceMoved > 0.1) {
    this.movementHistory.push({ x: this.x, y: this.y, time: Date.now() });
    if (this.movementHistory.length > this.movementHistoryMaxLength) {
      this.movementHistory.shift();
    }
  }
  
  // Update speed based on size
  this.updateSpeedBasedOnSize();
  
  // Regenerate health
  this.regenerateHealth(deltaTime);
  
  // Check for level up
  this.checkLevelUp();
  
  // Apply magnet power-up
  if (this.powerUps.magnet.active) {
    this.applyMagnetEffect();
  }
  
  // Apply freeze power-up
  if (this.powerUps.freeze.active) {
    this.applyFreezeEffect();
  }
  
  // Update eject cooldown
  if (this.ejectCooldown > 0) {
    this.ejectCooldown -= deltaTime * 1000;
  }
  
  // Update notifications
  this.updateNotifications(deltaTime);
  
  // Create trail effect if moving fast
  if (this.powerUps.speedBoost.active && this.game.particles) {
    this.cells.forEach(cell => {
      this.game.particles.createTrailEffect(cell, {
        color: this.color,
        size: cell.radius * 0.2,
        interval: 0.05,
        life: 0.3,
        fadeOut: true,
        shrink: 2
      });
    });
  }
  
  // Update effects
  this.updateEffects(deltaTime);
  
  // Update damage immunity
  if (this.damageImmunity && Date.now() > this.damageImmunityTime) {
    this.damageImmunity = false;
  }
}


validateCells() {
  this.cells = this.cells.filter(cell => {
    if (!cell || isNaN(cell.x) || isNaN(cell.y) || isNaN(cell.radius) || cell.radius <= 0) {
      console.error("Invalid cell detected, removing:", JSON.stringify(cell));
      return false;
    }
    return true;
  });

  if (this.cells.length === 0) {
    console.error("All cells were invalid, creating a new one");
    this.cells.push({
      x: isNaN(this.x) ? this.game.worldSize / 2 : this.x,
      y: isNaN(this.y) ? this.game.worldSize / 2 : this.y,
      radius: this.baseRadius,
      mass: Math.PI * this.baseRadius * this.baseRadius,
      velocityX: 0,
      velocityY: 0,
      membrane: {
        points: 20,
        elasticity: 0.3,
        distortion: 0.15,
        oscillation: 0.05,
        oscillationSpeed: 1.5,
        phase: Math.random() * Math.PI * 2,
        vertices: []
      },
      z: 0,
      id: 'cell-' + Date.now() + '-0',
      effects: []
    });
    this.initCellMembranes();
  }

  // Ensure all cells have valid coordinates
  this.cells.forEach(cell => {
    if (isNaN(cell.x) || isNaN(cell.y)) {
      cell.x = isNaN(this.x) ? this.game.worldSize / 2 : this.x;
      cell.y = isNaN(this.y) ? this.game.worldSize / 2 : this.y;
    }
    // Ensure cell is within world bounds
    cell.x = Math.max(cell.radius, Math.min(this.game.worldSize - cell.radius, cell.x));
    cell.y = Math.max(cell.radius, Math.min(this.game.worldSize - cell.radius, cell.y));
  });

  // Update player position to center of mass
  this.updateCenterOfMass();

  // Debug log
  console.log("Debugging cells:");
  this.cells.forEach((cell, index) => {
    console.log(`Cell ${index}:`, {
      x: cell.x,
      y: cell.y,
      radius: cell.radius,
      mass: cell.mass,
      velocityX: cell.velocityX,
      velocityY: cell.velocityY
    });
  });
}



	debugCells() {
  console.log("Debugging cells:");
  this.cells.forEach((cell, index) => {
    console.log(`Cell ${index}:`, {
      x: cell.x,
      y: cell.y,
      radius: cell.radius,
      mass: cell.mass,
      velocityX: cell.velocityX,
      velocityY: cell.velocityY
    });
  });
}


updateCellMembranes(deltaTime) {
  if (!this.cells || this.cells.length === 0) {
    return;
  }
  
  const time = Date.now() / 1000;
  
  this.cells.forEach(cell => {
    if (!cell || !cell.membrane) {
      return;
    }
    
    const { membrane } = cell;
    
    // Verify if phase is valid
    if (isNaN(membrane.phase)) {
      membrane.phase = 0;
    }
    
    membrane.phase += (membrane.oscillationSpeed || 1.5) * deltaTime;
    
    // Verify if vertices exist
    if (!membrane.vertices || !Array.isArray(membrane.vertices)) {
      console.error("Invalid membrane vertices:", membrane.vertices);
      this.initCellMembrane(cell);
      return;
    }
    
    membrane.vertices.forEach(vertex => {
      if (!vertex) return;
      
      // Verify if values are valid
      if (isNaN(vertex.angle) || isNaN(vertex.baseX) || isNaN(vertex.baseY) || 
          isNaN(vertex.distortionX) || isNaN(vertex.distortionY) || 
          isNaN(vertex.velocityX) || isNaN(vertex.velocityY)) {
        
        // Reset vertex with default values
        const angle = Math.random() * Math.PI * 2;
        vertex.angle = angle;
        vertex.baseX = Math.cos(angle);
        vertex.baseY = Math.sin(angle);
        vertex.distortionX = 0;
        vertex.distortionY = 0;
        vertex.velocityX = 0;
        vertex.velocityY = 0;
        return;
      }
      
      const oscillation = (membrane.oscillation || 0.05) * Math.sin(vertex.angle * 3 + membrane.phase);
      
      vertex.velocityX += -vertex.distortionX * (membrane.elasticity || 0.3);
      vertex.velocityY += -vertex.distortionY * (membrane.elasticity || 0.3);
      
      vertex.velocityX *= 0.9;
      vertex.velocityY *= 0.9;
      
      vertex.distortionX += vertex.velocityX * deltaTime * 5;
      vertex.distortionY += vertex.velocityY * deltaTime * 5;
      
      const distortionLength = Math.sqrt(vertex.distortionX * vertex.distortionX + vertex.distortionY * vertex.distortionY);
      if (distortionLength > (membrane.distortion || 0.15)) {
        const scale = (membrane.distortion || 0.15) / distortionLength;
        vertex.distortionX *= scale;
        vertex.distortionY *= scale;
      }
      
      vertex.distortionX += vertex.baseX * oscillation;
      vertex.distortionY += vertex.baseY * oscillation;
    });
  });
}

  distortMembrane(cell, dirX, dirY, amount) {
    const { membrane } = cell;
    const length = Math.sqrt(dirX * dirX + dirY * dirY);
    if (length > 0) {
      dirX /= length;
      dirY /= length;
    }
    
    membrane.vertices.forEach(vertex => {
      const dot = vertex.baseX * dirX + vertex.baseY * dirY;
      if (dot > 0.3) {
        const force = dot * amount;
        vertex.velocityX += dirX * force;
        vertex.velocityY += dirY * force;
      }
    });
  }

  updateSpeedBasedOnSize() {
    // Calculate average cell radius
    const avgRadius = this.cells.reduce((sum, cell) => sum + cell.radius, 0) / this.cells.length;
    
    // Speed decreases as size increases, but less punishing than before
    // Smaller cells move faster, very large cells move slower
    const speedFactor = Math.max(0.5, Math.min(1.3, Math.pow(this.baseRadius / avgRadius, 0.3)));
    this.speed = this.baseSpeed * speedFactor;
    
    // Apply power-up effects
    if (this.powerUps.speedBoost.active) {
      this.speed *= this.powerUps.speedBoost.factor;
    }
    
    // Apply level bonuses
    if (this.level >= 5 && this.levelBonuses[5].baseSpeed) {
      this.baseSpeed = this.levelBonuses[5].baseSpeed;
    }
  }
// Correção completa do arquivo player.js - Função moveTowardsTarget
moveTowardsTarget(deltaTime) {
  if (isNaN(this.targetX) || isNaN(this.targetY)) {
    console.error("Invalid target coordinates:", this.targetX, this.targetY);
    return;
  }

  this.cells.forEach(cell => {
    if (isNaN(cell.x) || isNaN(cell.y)) {
      console.error("Invalid cell coordinates:", cell.x, cell.y);
      return;
    }

    const dx = this.targetX - cell.x;
    const dy = this.targetY - cell.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
      const moveSpeed = this.speed * (30 / cell.radius) * deltaTime;
      const moveX = (dx / distance) * Math.min(moveSpeed, distance);
      const moveY = (dy / distance) * Math.min(moveSpeed, distance);
      
      cell.x += moveX;
      cell.y += moveY;
      
      // Keep cell within world bounds
      cell.x = Math.max(cell.radius, Math.min(this.game.worldSize - cell.radius, cell.x));
      cell.y = Math.max(cell.radius, Math.min(this.game.worldSize - cell.radius, cell.y));
    }
  });

  // Update player position to center of mass
  this.updateCenterOfMass();
}


updateCenterOfMass() {
  let totalX = 0;
  let totalY = 0;
  let totalMass = 0;
  
  this.cells.forEach(cell => {
    totalX += cell.x * cell.mass;
    totalY += cell.y * cell.mass;
    totalMass += cell.mass;
  });
  
  if (totalMass > 0) {
    this.x = totalX / totalMass;
    this.y = totalY / totalMass;
  } else {
    console.error("Total mass is zero, cannot update center of mass");
  }
}


checkCollisions() {
  // Get nearby entities
  const nearbyEntities = this.game.getEntitiesInRange(
    this.x, this.y, 
    Math.max(200, this.radius * 3), 
    ['foods', 'viruses', 'powerUps', 'ais']
  );
  
  // Check food collisions
  this.checkFoodCollisions(nearbyEntities.foods);
  
  // Check virus collisions
  this.checkVirusCollisions(nearbyEntities.viruses);
  
  // Check power-up collisions
  this.checkPowerUpCollisions(nearbyEntities.powerUps);
  
  // Check AI collisions
  this.checkAICollisions(nearbyEntities.ais);
}

// Correção do arquivo player.js - Função checkFoodCollisions
checkFoodCollisions(foods) {
  if (!foods || !foods.length) return;
  
  foods.forEach(food => {
    // Skip food ejected by this player (recently ejected)
    if (food.ejectedBy === this.id && Date.now() - food.ejectionTime < 1000) return;
    
    this.cells.forEach(cell => {
      const dx = cell.x - food.x;
      const dy = cell.y - food.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < cell.radius) {
        // Eat food with growth rate
        const foodValue = food.mass * this.growthRate;
        
        // Apply double score power-up
        const scoreMultiplier = this.powerUps.doubleScore.active ? 
                               this.powerUps.doubleScore.factor : 1;
        
        cell.mass += foodValue * scoreMultiplier;
        
        // Cap cell mass
        const maxCellMass = Math.PI * this.maxRadius * this.maxRadius;
        if (cell.mass > maxCellMass) {
          cell.mass = maxCellMass;
        }
        
        cell.radius = Math.sqrt(cell.mass / Math.PI);
        this.game.removeFood(food);
        
        // Update stats
        this.stats.foodEaten++;
        
        // Add experience
        this.addExperience(5 * scoreMultiplier);
        
        // Create particles
        if (this.game.particles) {
          this.game.particles.createFoodParticles(food.x, food.y, food.color);
        }
        
        // Play sound (with cooldown to prevent sound spam)
        const now = Date.now();
        if (now - this.lastEatSound > this.eatSoundCooldown) {
          this.game.soundManager.playSound('eatFood');
          this.lastEatSound = now;
        }
        
        // Distort membrane in the direction of the food
        this.distortMembrane(cell, -dx/distance, -dy/distance, 0.2);
        
        // Add notification for special food
        if (food.type === 'extra') {
          this.addNotification('Extra food! +' + Math.floor(foodValue * scoreMultiplier), '#ffc107');
        }
      }
    });
  });
}

checkVirusCollisions(viruses) {
  if (!viruses || !viruses.length) return;
  
  viruses.forEach(virus => {
    this.cells.forEach((cell, index) => {
      const dx = cell.x - virus.x;
      const dy = cell.y - virus.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < cell.radius + virus.radius) {
        if (cell.radius > virus.radius * 1.15) {
          // Split the cell if it's big enough
          if (this.cells.length < this.game.maxCellsPerPlayer) {
            // Split in multiple directions
            const splitDirections = 3 + Math.floor(Math.random() * 2); // 3-4 splits
            for (let i = 0; i < splitDirections; i++) {
              const angle = (i / splitDirections) * Math.PI * 2;
              const targetX = virus.x + Math.cos(angle) * virus.radius * 2;
              const targetY = virus.y + Math.sin(angle) * virus.radius * 2;
              this.splitCell(index, targetX, targetY);
            }
            
            // Add virus mass to the cell
            const virusMass = virus.mass * 0.5; // Only get half the mass
            cell.mass += virusMass;
            cell.radius = Math.sqrt(cell.mass / Math.PI);
            
            // Update stats
            this.stats.virusesEaten++;
            
            // Add experience
            this.addExperience(50);
            
            // Create particles
            if (this.game.particles) {
              this.game.particles.createVirusParticles(virus.x, virus.y);
            }
            
            // Play sound
            if (this.game.soundManager) {
              this.game.soundManager.playSound('virusSplit');
            }
            
            // Add notification
            this.addNotification('Virus consumed!', '#33ff33');
            
            // Remove the virus
            this.game.removeVirus(virus);
          }
        } 
        // Verification corrected: Don't use canPassUnder, directly check the size
        else if (cell.radius < virus.radius * 0.9) {
          // Smaller cells pass under the virus
          cell.z = -1;
          setTimeout(() => { 
            if (cell && this.cells.includes(cell)) {
              cell.z = 0;
            }
          }, 1000);
        } 
        else {
          // Just push the cell away slightly
          const pushFactor = 0.5;
          const pushX = (dx / distance) * pushFactor;
          const pushY = (dy / distance) * pushFactor;
          
          cell.x += pushX;
          cell.y += pushY;
        }
      }
    });
  });
}

checkPowerUpCollisions(powerUps) {
  if (!powerUps || !powerUps.length) return;
  
  powerUps.forEach(powerUp => {
    this.cells.forEach(cell => {
      const dx = cell.x - powerUp.x;
      const dy = cell.y - powerUp.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < cell.radius + powerUp.radius) {
        // Activate power-up
        this.activatePowerUp(powerUp.type);
        this.game.removePowerUp(powerUp);
        
        // Update stats
        this.stats.powerUpsCollected++;
        
        // Create particles
        if (this.game.particles) {
          this.game.particles.createPowerUpParticles(powerUp.x, powerUp.y, powerUp.color);
        }
        
        // Play sound
        this.game.soundManager.playSound('powerUp');
        
        // Show announcement
        this.game.showAnnouncement(`${this.name} collected ${powerUp.type} power-up!`, 2000);
        
        // Add notification
        this.addNotification(`${powerUp.type} activated!`, powerUp.color);
        
        // Distort membrane
        this.distortMembrane(cell, -dx/distance, -dy/distance, 0.4);
      }
    });
  });
}

checkAICollisions(aiEntities) {
  if (!aiEntities || !aiEntities.length) return;
  
  aiEntities.forEach(entity => {
    if (!entity.parent || entity.parent.isDead) return;
    
    // Skip collision check with team members in team mode
    if (this.game.gameMode === 'teams' && this.team === entity.parent.team) return;
    
    const aiCell = entity.cell;
    
    this.cells.forEach((cell, cellIndex) => {
      const dx = cell.x - aiCell.x;
      const dy = cell.y - aiCell.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < cell.radius + aiCell.radius) {
        // Calculate overlap percentage
        const overlap = (cell.radius + aiCell.radius - distance) / 2;
        const overlapPercentage = overlap / Math.min(cell.radius, aiCell.radius);
        
        // Player eats AI
        if (cell.radius > aiCell.radius * 1.1 && overlapPercentage > 0.9) {
          const massGain = aiCell.mass;
          
          // Apply double score power-up
          const scoreMultiplier = this.powerUps.doubleScore.active ? 
                                 this.powerUps.doubleScore.factor : 1;
          
          cell.mass += massGain * this.growthRate * scoreMultiplier;
          
          // Cap cell mass
          const maxCellMass = Math.PI * this.maxRadius * this.maxRadius;
          if (cell.mass > maxCellMass) {
            cell.mass = maxCellMass;
          }
          
          cell.radius = Math.sqrt(cell.mass / Math.PI);
          aiCell.mass = 0;
          
          // Update stats
          this.stats.playersEaten++;
          this.stats.killStreak++;
          
          if (this.stats.killStreak > this.stats.maxKillStreak) {
            this.stats.maxKillStreak = this.stats.killStreak;
            
            // Achievement for kill streaks
            if (this.stats.maxKillStreak >= 3) {
              this.game.achievements.unlock('kill_streak_3');
            }
            if (this.stats.maxKillStreak >= 5) {
              this.game.achievements.unlock('kill_streak_5');
            }
            if (this.stats.maxKillStreak >= 10) {
              this.game.achievements.unlock('kill_streak_10');
            }
          }
          
          // Add experience based on AI size
          this.addExperience(Math.floor(massGain / 2) * scoreMultiplier);
          
          // Create particles
          if (this.game.particles) {
            this.game.particles.createEatParticles(aiCell.x, aiCell.y, entity.parent.color);
          }
          
          // Play sound
          this.game.soundManager.playSound('eatPlayer');
          
          // Add notification
          this.addNotification(`Consumed ${entity.parent.name}!`, '#ff5252');
          
          // Distort membrane
          this.distortMembrane(cell, -dx/distance, -dy/distance, 0.5);
        } 
        // AI eats player
        else if (aiCell.radius > cell.radius * 1.1 && overlapPercentage > 0.9 && !this.powerUps.shield.active && !this.damageImmunity) {
          aiCell.mass += cell.mass;
          aiCell.radius = Math.sqrt(aiCell.mass / Math.PI);
          this.cells.splice(cellIndex, 1);
          
          // Reset kill streak
          this.stats.killStreak = 0;
          
          // Create particles
          if (this.game.particles) {
            this.game.particles.createEatParticles(cell.x, cell.y, this.color);
          }
          
          // Play sound
          this.game.soundManager.playSound('playerEaten');
          
          // Check if player is dead
          if (this.cells.length === 0) {
            this.handleDeath();
          }
        }
        // Cells are similar size - overlap with minimal push
        else {
          // Calculate minimal push to prevent complete overlap
          const minPushNeeded = Math.max(0, cell.radius + aiCell.radius - distance - 5);
          if (minPushNeeded > 0) {
            const pushFactor = 0.05; // Very small push factor
            const pushX = (dx / distance) * minPushNeeded * pushFactor;
            const pushY = (dy / distance) * minPushNeeded * pushFactor;
            
            cell.x += pushX;
            cell.y += pushY;
          }
        }
      }
    });
  });
}
handleDeath() {
  this.isDead = true;
  this.stats.deathCount++;
  this.game.soundManager.playSound('gameOver');
  
  // Create death explosion
  if (this.game.particles) {
    this.game.particles.createExplosion(this.x, this.y, this.color, 50);
  }
  
  // Show game over announcement
  this.game.showAnnouncement("Game Over!", 3000);
  
  // Trigger game over event
  const event = new CustomEvent('gameStateChange', { 
    detail: { 
      type: 'gameOver',
      data: {
        score: Math.floor(this.score),
        level: this.level,
        timePlayed: this.stats.timePlayed
      }
    } 
  });
  this.game.canvas.dispatchEvent(event);
}

updateCells(deltaTime) {
  // Remove cells with zero mass
  this.cells = this.cells.filter(cell => cell.mass > 0);
  
  // Check if player is dead
  if (this.cells.length === 0) {
    this.handleDeath();
    return;
  }
  
  // Apply cell physics (momentum, etc.)
  this.cells.forEach(cell => {
    // Apply velocity for split cells
    if (cell.velocityX !== undefined && cell.velocityY !== undefined) {
      const elapsed = Date.now() - cell.splitTime;
      const slowdownFactor = Math.max(0, 1 - elapsed / 800); // Faster slowdown (800ms instead of 1000ms)
      
      cell.x += cell.velocityX * slowdownFactor * deltaTime;
      cell.y += cell.velocityY * slowdownFactor * deltaTime;
      
      // Keep within world bounds
      cell.x = Math.max(cell.radius, Math.min(this.game.worldSize - cell.radius, cell.x));
      cell.y = Math.max(cell.radius, Math.min(this.game.worldSize - cell.radius, cell.y));
      
      // Remove velocity after it slows down
      if (slowdownFactor <= 0.1) {
        delete cell.velocityX;
        delete cell.velocityY;
      }
    }
    
    // Apply mass decay for larger cells
    if (cell.mass > this.baseRadius * this.baseRadius * Math.PI * 2) {
      // Apply level bonus to shrink rate if applicable
      const shrinkRate = this.level >= 4 ? this.levelBonuses[4].shrinkRate : this.shrinkRate;
      
      cell.mass *= (1 - shrinkRate * deltaTime);
      cell.radius = Math.sqrt(cell.mass / Math.PI);
    }
    
    // Update cell effects
    if (cell.effects && cell.effects.length > 0) {
      cell.effects = cell.effects.filter(effect => {
        effect.duration -= deltaTime * 1000;
        return effect.duration > 0;
      });
    }
  });
  
  // Handle cell-to-cell collisions with improved physics
  this.handleCellCollisions(deltaTime);
  
  // Merge cells if they are close enough and enough time has passed
  this.mergeCells();
  
  // Update player radius to the largest cell
  this.radius = Math.max(...this.cells.map(cell => cell.radius));
}

handleCellCollisions(deltaTime) {
  // Check collisions between player's own cells
  for (let i = 0; i < this.cells.length; i++) {
    for (let j = i + 1; j < this.cells.length; j++) {
      const cell1 = this.cells[i];
      const cell2 = this.cells[j];
      
      const dx = cell1.x - cell2.x;
      const dy = cell1.y - cell2.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const minDistance = cell1.radius + cell2.radius;
      
      // Check if cells can merge
      const now = Date.now();
      const canMerge = (!cell1.mergeTime || now > cell1.mergeTime) && 
                       (!cell2.mergeTime || now > cell2.mergeTime);
      
      // If cells are overlapping
      if (distance < minDistance) {
        if (canMerge && distance < cell1.radius * 0.5) {
          // Cells are close enough to merge
          // This will be handled in mergeCells()
        } else {
          // Cells should bounce off each other
          // Calculate overlap
          const overlap = minDistance - distance;
          
          // Only apply repulsion if there's actual overlap
          if (overlap > 0 && distance > 0) {
            // Normalize direction
            const nx = dx / distance;
            const ny = dy / distance;
            
            // Calculate repulsion force based on mass
            const totalMass = cell1.mass + cell2.mass;
            const cell1Ratio = cell2.mass / totalMass;
            const cell2Ratio = cell1.mass / totalMass;
            
            // Apply repulsion with elasticity
            const repulsionForce = overlap * 0.05;
            
            cell1.x += nx * repulsionForce * cell1Ratio;
            cell1.y += ny * repulsionForce * cell1Ratio;
            cell2.x -= nx * repulsionForce * cell2Ratio;
            cell2.y -= ny * repulsionForce * cell2Ratio;
            
            // Distort membranes on collision
            this.distortMembrane(cell1, nx, ny, 0.3);
            this.distortMembrane(cell2, -nx, -ny, 0.3);
            
            // Keep cells within world bounds
            cell1.x = Math.max(cell1.radius, Math.min(this.game.worldSize - cell1.radius, cell1.x));
            cell1.y = Math.max(cell1.radius, Math.min(this.game.worldSize - cell1.radius, cell1.y));
            cell2.x = Math.max(cell2.radius, Math.min(this.game.worldSize - cell2.radius, cell2.x));
            cell2.y = Math.max(cell2.radius, Math.min(this.game.worldSize - cell2.radius, cell2.y));
          }
        }
      }
    }
  }
}

mergeCells() {
  const now = Date.now();
  
  // Get merge time from level bonuses if applicable
  const mergeTime = this.level >= 8 ? this.levelBonuses[8].splitCooldown : this.mergeTime;
  
  for (let i = 0; i < this.cells.length; i++) {
    for (let j = i + 1; j < this.cells.length; j++) {
      const cell1 = this.cells[i];
      const cell2 = this.cells[j];
      
      // Only merge if enough time has passed since splitting
      if ((cell1.mergeTime && now < cell1.mergeTime) || 
          (cell2.mergeTime && now < cell2.mergeTime)) {
        continue;
      }
      
      const dx = cell1.x - cell2.x;
      const dy = cell1.y - cell2.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Merge if cells are close enough
      if (distance < cell1.radius * 0.5) {
        // Calculate new position weighted by mass
        const totalMass = cell1.mass + cell2.mass;
        const newX = (cell1.x * cell1.mass + cell2.x * cell2.mass) / totalMass;
        const newY = (cell1.y * cell1.mass + cell2.y * cell2.mass) / totalMass;
        
        // Update cell1 with merged properties
        cell1.mass = totalMass;
        
        // Cap cell mass
        const maxCellMass = Math.PI * this.maxRadius * this.maxRadius;
        if (cell1.mass > maxCellMass) {
          cell1.mass = maxCellMass;
        }
        
        cell1.radius = Math.sqrt(cell1.mass / Math.PI);
        cell1.x = newX;
        cell1.y = newY;
        
        // Remove cell2
        this.cells.splice(j, 1);
        j--;
        
        // Create merge particles
        if (this.game.particles) {
          this.game.particles.createMergeParticles(cell2.x, cell2.y, this.color);
        }
        
        // Play sound
        this.game.soundManager.playSound('merge');
        
        // Distort membrane during merge
        this.distortMembrane(cell1, 0, 0, 0.6);
      }
    }
  }
}

updatePowerUps(deltaTime) {
  const now = Date.now();
  
  Object.entries(this.powerUps).forEach(([type, powerUp]) => {
    if (powerUp.active && now > powerUp.duration) {
      powerUp.active = false;
      this.game.showAnnouncement(`${type} expired!`, 1500);
      
      if (type === 'massBoost') {
        this.cells.forEach(cell => {
          cell.mass /= powerUp.factor;
          cell.radius = Math.sqrt(cell.mass / Math.PI);
        });
      }
      
      // Add notification
      this.addNotification(`${type} expired!`, '#ff5252');
    }
  });
  
  if (!this.canSplit && now > this.splitCooldownTime) {
    this.canSplit = true;
    
    // Add notification
    this.addNotification('Split ready!', '#4caf50');
  }
}

regenerateHealth(deltaTime) {
  // Apply level bonus to health regen if applicable
  const regenRate = this.level >= 3 ? this.levelBonuses[3].healthRegenRate : this.healthRegenRate;
  
  if (this.health < this.maxHealth) {
    this.health += regenRate * deltaTime;
    if (this.health > this.maxHealth) {
      this.health = this.maxHealth;
    }
  }
}

updateScore() {
  // Calculate score based on total mass
  const newScore = this.cells.reduce((total, cell) => total + cell.mass, 0);
  
  // Check if score increased significantly (player ate something big)
  if (newScore > this.score + 100) {
    const scoreGain = newScore - this.score;
    
    // Create score popup
    if (this.game.particles) {
      this.game.particles.createTextEffect(this.x, this.y - this.radius - 20, `+${Math.floor(scoreGain)}`, '#ffeb3b');
    }
  }
  
  this.score = newScore;
}

activatePowerUp(type) {
  const duration = 10000; // 10 seconds
  const now = Date.now();
  
  switch (type) {
    case 'speed':
      this.powerUps.speedBoost.active = true;
      this.powerUps.speedBoost.duration = now + duration;
      
      // Create speed effect
      if (this.game.particles) {
        this.cells.forEach(cell => {
          this.game.particles.createShockwave(cell.x, cell.y, {
            color: 'rgba(0, 255, 255, 0.5)',
            size: cell.radius * 2,
            expandSpeed: 100,
            life: 0.5
          });
        });
      }
      break;
    case 'shield':
      this.powerUps.shield.active = true;
      this.powerUps.shield.duration = now + duration;
      this.damageImmunity = true;
      this.damageImmunityTime = now + duration;
      
      // Create shield effect
      if (this.game.particles) {
        this.cells.forEach(cell => {
          this.game.particles.createPulseEffect(cell.x, cell.y, {
            color: 'rgba(103, 58, 183, 0.5)',
            size: cell.radius * 1.5,
            pulseCount: 3,
            interval: 0.2,
            life: 0.6
          });
        });
      }
      break;
    case 'mass':
      this.powerUps.massBoost.active = true;
      this.powerUps.massBoost.duration = now + duration;
      
      // Apply mass boost
      this.cells.forEach(cell => {
        cell.mass *= this.powerUps.massBoost.factor;
        
        // Cap cell mass
        const maxCellMass = Math.PI * this.maxRadius * this.maxRadius;
        if (cell.mass > maxCellMass) {
          cell.mass = maxCellMass;
        }
        
        cell.radius = Math.sqrt(cell.mass / Math.PI);
        
        // Create mass boost effect
        if (this.game.particles) {
          this.game.particles.createExplosion(cell.x, cell.y, '#ffc107', cell.radius);
        }
      });
      break;
    case 'invisibility':
      this.powerUps.invisibility.active = true;
      this.powerUps.invisibility.duration = now + duration;
      
      // Create invisibility effect
      if (this.game.particles) {
        this.cells.forEach(cell => {
          this.game.particles.createRipple(cell.x, cell.y, 'rgba(158, 158, 158, 0.5)', cell.radius * 2);
        });
      }
      break;
    case 'magnet':
      this.powerUps.magnet.active = true;
      this.powerUps.magnet.duration = now + duration;
      
      // Create magnet effect
      if (this.game.particles) {
        this.cells.forEach(cell => {
          this.game.particles.createVortex(cell.x, cell.y, {
            color: 'rgba(156, 39, 176, 0.5)',
            particleCount: 30,
            radius: this.powerUps.magnet.range / 2,
            rotationSpeed: 3,
            life: 1,
            inward: true
          });
        });
      }
      break;
    case 'freeze':
      this.powerUps.freeze.active = true;
      this.powerUps.freeze.duration = now + duration;
      
      // Create freeze effect
      if (this.game.particles) {
        this.game.particles.createShockwave(this.x, this.y, {
          color: 'rgba(33, 150, 243, 0.5)',
          size: 300,
          expandSpeed: 200,
          life: 0.7
        });
      }
      
      // Play freeze sound
      this.game.soundManager.playSound('freeze');
      break;
    case 'doubleScore':
      this.powerUps.doubleScore.active = true;
      this.powerUps.doubleScore.duration = now + duration;
      
      // Create double score effect
      if (this.game.particles) {
        this.cells.forEach(cell => {
          this.game.particles.createTextParticles(cell.x, cell.y, '2x', {
            color: '#ffeb3b',
            size: 24,
            particleSize: 3,
            particleDensity: 0.3,
            life: 1.5,
            explosionForce: 60
          });
        });
      }
      break;
  }
  
  this.game.showAnnouncement(`${type} activated!`, 2000);
}

applyMagnetEffect() {
  const nearbyFoods = this.game.getEntitiesInRange(
    this.x, this.y, 
    this.powerUps.magnet.range, 
    ['foods']
  );
  
  if (nearbyFoods.foods && nearbyFoods.foods.length > 0) {
    nearbyFoods.foods.forEach(food => {
      // Skip food ejected by this player
      if (food.ejectedBy === this.id) return;
      
      // Find closest cell
      const closestCell = this.cells.reduce((closest, cell) => {
        const dx = cell.x - food.x;
        const dy = cell.y - food.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < closest.distance ? { cell, distance } : closest;
      }, { cell: null, distance: Infinity }).cell;
      
      if (closestCell) {
        const dx = closestCell.x - food.x;
        const dy = closestCell.y - food.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Apply attraction force
        const attractionStrength = 0.1 * (1 - distance / this.powerUps.magnet.range);
        food.x += (dx / distance) * attractionStrength * distance;
        food.y += (dy / distance) * attractionStrength * distance;
        
        // Create particle trail for attracted food
        if (this.game.particles && Math.random() < 0.1) {
          this.game.particles.createParticle({
            x: food.x,
            y: food.y,
            size: 2,
            color: 'rgba(156, 39, 176, 0.5)',
            life: 0.3,
            maxLife: 0.3,
            fadeOut: true,
            shape: 'circle'
          });
        }
      }
    });
  }
}

applyFreezeEffect() {
  // Slow down all AIs in range
  const nearbyAIs = this.game.getEntitiesInRange(
    this.x, this.y, 
    300, // Freeze range
    ['ais']
  );
  
  if (nearbyAIs.ais && nearbyAIs.ais.length > 0) {
    nearbyAIs.ais.forEach(entity => {
      if (entity.parent && !entity.parent.isDead) {
        // Apply slow effect to AI
        entity.parent.speed *= 0.5;
        
        // Add frozen effect to AI
        if (entity.cell && !entity.cell.effects) {
          entity.cell.effects = [];
        }
        
        if (entity.cell && entity.cell.effects) {
          // Check if already has freeze effect
          const existingEffect = entity.cell.effects.find(e => e.type === 'freeze');
          if (existingEffect) {
            existingEffect.duration = 1000; // Reset duration
          } else {
            entity.cell.effects.push({
              type: 'freeze',
              duration: 1000 // 1 second
            });
          }
        }
        
        // Create freeze particles
        if (this.game.particles && Math.random() < 0.2) {
          this.game.particles.createParticle({
            x: entity.x,
            y: entity.y,
            size: 3,
            color: 'rgba(33, 150, 243, 0.7)',
            life: 0.5,
            maxLife: 0.5,
            fadeOut: true,
            shape: 'star',
            points: 6
          });
        }
      }
    });
  }
}
updateEffects(deltaTime) {
  // Update global effects
  this.effects = this.effects.filter(effect => {
    const elapsed = Date.now() - effect.startTime;
    return elapsed < effect.duration;
  });
}

addExperience(amount) {
  // Apply experience multiplier from game balance settings
  const expMultiplier = this.game.balanceSettings.expMultiplier || 1;
  const adjustedAmount = amount * expMultiplier;
  
  // Add experience
  this.experience += adjustedAmount;
  
  // Check for level up
  this.checkLevelUp();
  
  // Create experience particles
  if (this.game.particles && amount > 10) {
    this.game.particles.createTextEffect(this.x, this.y - this.radius - 20, `+${Math.floor(adjustedAmount)} XP`, '#4caf50');
  }
  
  return adjustedAmount;
}

checkLevelUp() {
  // Check if player has enough experience to level up
  while (this.experience >= this.experienceToNextLevel) {
    // Level up
    this.level++;
    
    // Update stats
    if (this.level > this.stats.highestLevel) {
      this.stats.highestLevel = this.level;
    }
    
    // Calculate experience for next level (increasing requirement)
    this.experience -= this.experienceToNextLevel;
    this.experienceToNextLevel = Math.floor(1000 * Math.pow(1.2, this.level - 1));
    
    // Apply level bonuses
    this.applyLevelBonus(this.level);
    
    // Create level up effect
    if (this.game.particles) {
      this.game.particles.createParticle({
        x: this.x,
        y: this.y,
        size: this.radius * 2,
        color: 'rgba(76, 175, 80, 0.3)',
        life: 1.0,
        maxLife: 1.0,
        shape: 'glow'
      });
      
      // Create text effect
      this.game.particles.createTextEffect(this.x, this.y, `Level Up! ${this.level}`, '#4caf50', 24);
    }
    
    // Play level up sound
    if (this.game.soundManager) {
      this.game.soundManager.playSound('levelUp');
    }
    
    // Show announcement
    this.game.showAnnouncement(`Level Up! ${this.level}`, 2000);
    
    // Add notification
    this.addNotification(`Level Up! ${this.level}`, '#4caf50');
    
    // Check for level-based achievements
    if (this.game.achievements) {
      if (this.level >= 5) {
        this.game.achievements.unlock('reach_level_5');
      }
      if (this.level >= 10) {
        this.game.achievements.unlock('reach_level_10');
      }
    }
  }
}

applyLevelBonus(level) {
  const bonus = this.levelBonuses[level];
  if (!bonus) return;
  
  // Apply bonuses
  if (bonus.baseRadius) {
    this.baseRadius = bonus.baseRadius;
  }
  
  if (bonus.healthRegenRate) {
    this.healthRegenRate = bonus.healthRegenRate;
  }
  
  if (bonus.shrinkRate) {
    this.shrinkRate = bonus.shrinkRate;
  }
  
  if (bonus.baseSpeed) {
    this.baseSpeed = bonus.baseSpeed;
  }
  
  if (bonus.growthRate) {
    this.growthRate = bonus.growthRate;
  }
  
  if (bonus.ejectCooldownTime) {
    this.ejectCooldownTime = bonus.ejectCooldownTime;
  }
  
  if (bonus.splitCooldown) {
    this.splitCooldown = bonus.splitCooldown;
  }
  
  if (bonus.maxHealth) {
    this.maxHealth = bonus.maxHealth;
    this.health = this.maxHealth; // Refill health on level up
  }
}

addNotification(message, color = '#ffffff') {
  // Add notification to the queue
  this.notifications.push({
    message,
    color,
    time: Date.now(),
    duration: 3000, // 3 seconds
    opacity: 1
  });
  
  // Limit the number of notifications
  if (this.notifications.length > this.maxNotifications) {
    this.notifications.shift();
  }
}

updateNotifications(deltaTime) {
  // Update notification timers and opacity
  this.notifications = this.notifications.filter(notification => {
    const elapsed = Date.now() - notification.time;
    
    // Start fading out after 2/3 of the duration
    if (elapsed > notification.duration * 2 / 3) {
      notification.opacity = Math.max(0, 1 - (elapsed - notification.duration * 2 / 3) / (notification.duration / 3));
    }
    
    return elapsed < notification.duration;
  });
}

takeDamage(amount) {
  // No damage if shield is active
  if (this.powerUps.shield.active || this.damageImmunity) return;
  
  this.health -= amount;
  
  // Create damage effect
  this.effects.push({
    type: 'damage',
    duration: 500,
    startTime: Date.now()
  });
  
  // Create damage particles
  if (this.game.particles) {
    this.game.particles.createDamageParticles(this.x, this.y);
  }
  
  // Play damage sound
  if (this.game.soundManager) {
    this.game.soundManager.playSound('damage');
  }
  
  // Check if dead
  if (this.health <= 0) {
    this.health = 0;
    this.handleDeath();
  }
}

split() {
  // Check if split is on cooldown
  if (!this.canSplit || this.cells.length >= this.game.maxCellsPerPlayer) return;
  
  // Set cooldown
  this.canSplit = false;
  this.splitCooldownTime = Date.now() + this.splitCooldown;
  
  // Update stats
  this.stats.timesSplit++;
  
  // Play split sound
  if (this.game.soundManager) {
    this.game.soundManager.playSound('split');
  }
  
  // Create a copy of cells to avoid modification during iteration
  const cellsToSplit = [...this.cells];
  
  cellsToSplit.forEach((cell, index) => {
    if (cell.radius >= this.baseRadius * 1.5 && this.cells.length < this.game.maxCellsPerPlayer) {
      this.splitCell(index);
    }
  });
}

splitCell(index, targetX, targetY) {
  const cell = this.cells[index];
  
  // Calculate direction
  let dx, dy;
  if (targetX !== undefined && targetY !== undefined) {
    // Split towards target
    dx = targetX - cell.x;
    dy = targetY - cell.y;
  } else {
    // Split towards mouse
    dx = this.targetX - cell.x;
    dy = this.targetY - cell.y;
  }
  
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Normalize direction
  const dirX = distance > 0 ? dx / distance : 1;
  const dirY = distance > 0 ? dy / distance : 0;
  
  // Create new cell
  const newMass = cell.mass / 2;
  cell.mass = newMass;
  cell.radius = Math.sqrt(cell.mass / Math.PI);
  
  // Position the new cell slightly away from the original to prevent immediate overlap
  const offsetDistance = cell.radius * 0.2;
  const now = Date.now();
  
  const newCell = {
    x: cell.x + dirX * offsetDistance,
    y: cell.y + dirY * offsetDistance,
    radius: cell.radius,
    mass: newMass,
    velocityX: dirX * this.splitVelocity,
    velocityY: dirY * this.splitVelocity,
    splitTime: now,
    mergeTime: now + this.mergeTime,
    membrane: {
      points: cell.membrane.points,
      elasticity: cell.membrane.elasticity,
      distortion: cell.membrane.distortion,
      oscillation: cell.membrane.oscillation,
      oscillationSpeed: cell.membrane.oscillationSpeed,
      phase: Math.random() * Math.PI * 2,
      vertices: []
    },
    z: 0,
    id: 'cell-' + now + '-' + this.cells.length,
    effects: []
  };
  
  // Initialize membrane for new cell
  this.initCellMembrane(newCell);
  
  // Distort both membranes in the split direction
  this.distortMembrane(cell, -dirX, -dirY, 0.5);
  this.distortMembrane(newCell, dirX, dirY, 0.5);
  
  this.cells.push(newCell);
  
  // Create split particles
  if (this.game.particles) {
    this.game.particles.createSplitParticles(cell.x, cell.y, this.color, dirX, dirY);
  }
}

ejectMass() {
  // Check if eject is on cooldown
  if (this.ejectCooldown > 0) return;
  
  // Set cooldown
  this.ejectCooldown = this.ejectCooldownTime;
  
  // Update stats
  this.stats.timesEjected++;
  
  // Play eject sound
  if (this.game.soundManager) {
    this.game.soundManager.playSound('eject');
  }
  
  this.cells.forEach(cell => {
    // Only eject if cell is big enough
    if (cell.mass > this.ejectMinMass) {
      // Calculate direction
      const dx = this.targetX - cell.x;
      const dy = this.targetY - cell.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Normalize direction
      const dirX = distance > 0 ? dx / distance : 1;
      const dirY = distance > 0 ? dy / distance : 0;
      
      // Calculate ejected mass (smaller amount for better gameplay)
      const ejectedMass = Math.min(cell.mass * this.ejectMassAmount, 20);
      
      // Only eject if it won't make the cell too small
      if (cell.mass - ejectedMass > this.ejectMinMass / 2) {
        // Reduce cell mass
        cell.mass -= ejectedMass;
        cell.radius = Math.sqrt(cell.mass / Math.PI);
        
        // Calculate ejection position (further from cell)
        const ejectionX = cell.x + dirX * cell.radius * this.ejectDistance;
        const ejectionY = cell.y + dirY * cell.radius * this.ejectDistance;
        
        // Create ejected mass as food
        this.game.foods.push({
          x: ejectionX,
          y: ejectionY,
          radius: this.ejectSize,
          mass: ejectedMass * 0.8,
          color: this.color,
          velocityX: dirX * this.ejectSpeed,
          velocityY: dirY * this.ejectSpeed,
          ejectedBy: this.id,
          ejectionTime: Date.now(),
          game: this.game,
          update: function(deltaTime) {
            // Update position based on velocity with improved deceleration
            const elapsed = Date.now() - this.ejectionTime;
            const slowdownFactor = Math.pow(this.game.player.ejectDeceleration, elapsed / 16.67);
            
            this.velocityX *= slowdownFactor;
            this.velocityY *= slowdownFactor;
            
            this.x += this.velocityX * deltaTime;
            this.y += this.velocityY * deltaTime;
            
            // Keep within world bounds
            if (this.game) {
              this.x = Math.max(this.radius, Math.min(this.game.worldSize - this.radius, this.x));
              this.y = Math.max(this.radius, Math.min(this.game.worldSize - this.radius, this.y));
            }
          },
          draw: function(ctx) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
          }
        });
        
        // Create particles
        if (this.game.particles) {
          this.game.particles.createEjectParticles(
            ejectionX, 
            ejectionY, 
            this.color, 
            dirX, 
            dirY
          );
        }
        
        // Distort membrane in ejection direction
        this.distortMembrane(cell, dirX, dirY, 0.3);
      }
    }
  });
}

setSkin(skinId) {
  this.skin = skinId;
  
  // Create skin object
  if (skinId && skinId !== 'default') {
    this.skinObject = new Skin(skinId, this.color);
  } else {
    this.skinObject = null;
  }
}
draw(ctx) {
  // Sort cells by z-index to handle layering
  const sortedCells = [...this.cells].sort((a, b) => a.z - b.z);
  
  // Draw cells
  sortedCells.forEach(cell => {
    // Apply invisibility
    const opacity = this.powerUps.invisibility.active ? this.powerUps.invisibility.opacity : 1;
    
    // Draw cell with membrane
    this.drawCellWithMembrane(ctx, cell, opacity);
    
    // Reset opacity
    ctx.globalAlpha = 1;
    
    // Draw team indicator if in team mode
    if (this.game.gameMode === 'teams' && this.team) {
      ctx.beginPath();
      ctx.arc(cell.x, cell.y, cell.radius + 5, 0, Math.PI * 2);
      ctx.lineWidth = 3;
      ctx.strokeStyle = this.game.getTeamColor(this.team);
      ctx.stroke();
    }
    
    // Draw cell effects
    if (cell.effects && cell.effects.length > 0) {
      cell.effects.forEach(effect => {
        if (effect.type === 'freeze') {
          // Draw freeze effect
          ctx.beginPath();
          ctx.arc(cell.x, cell.y, cell.radius + 3, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(33, 150, 243, 0.7)';
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Draw snowflake icon
          ctx.font = `${Math.min(16, cell.radius / 2)}px Arial`;
          ctx.fillStyle = 'rgba(33, 150, 243, 0.7)';
          ctx.fillText('❄️', cell.x, cell.y - cell.radius - 10);
        }
      });
    }
  });
  
  // Draw effects
  this.drawEffects(ctx);
  
  // Draw power-up indicators
  this.drawPowerUpIndicators(ctx);
  
  // Draw magnet range if active
  if (this.powerUps.magnet.active) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.powerUps.magnet.range, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(128, 0, 128, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Add pulsing effect
    const pulseSize = this.powerUps.magnet.range * (1 + Math.sin(Date.now() / 200) * 0.05);
    ctx.beginPath();
    ctx.arc(this.x, this.y, pulseSize, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(128, 0, 128, 0.1)';
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  
  // Draw shield if active
  if (this.powerUps.shield.active) {
    this.cells.forEach(cell => {
      const pulseSize = cell.radius * (1.1 + Math.sin(Date.now() / 150) * 0.05);
      
      ctx.beginPath();
      ctx.arc(cell.x, cell.y, pulseSize, 0, Math.PI * 2);
      
      // Create gradient for shield
      const gradient = ctx.createRadialGradient(
        cell.x, cell.y, cell.radius,
        cell.x, cell.y, pulseSize
      );
      gradient.addColorStop(0, 'rgba(103, 58, 183, 0)');
      gradient.addColorStop(0.8, 'rgba(103, 58, 183, 0.2)');
      gradient.addColorStop(1, 'rgba(103, 58, 183, 0.5)');
      
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // Add shield border
      ctx.strokeStyle = 'rgba(103, 58, 183, 0.7)';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }
  
  // Draw speed boost effect if active
  if (this.powerUps.speedBoost.active) {
    this.cells.forEach(cell => {
      // Draw speed lines behind the cell
      const angle = Math.atan2(this.targetY - cell.y, this.targetX - cell.x);
      
      ctx.save();
      ctx.translate(cell.x, cell.y);
      ctx.rotate(angle + Math.PI); // Rotate to face away from movement direction
      
      // Draw multiple speed lines
      ctx.strokeStyle = 'rgba(0, 188, 212, 0.5)';
      ctx.lineWidth = 2;
      
      for (let i = 0; i < 5; i++) {
        const lineAngle = (i / 5) * Math.PI - Math.PI / 2;
        const lineLength = cell.radius * (0.8 + Math.random() * 0.4);
        const offsetX = Math.cos(lineAngle) * cell.radius * 0.2;
        const offsetY = Math.sin(lineAngle) * cell.radius * 0.2;
        
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY);
        ctx.lineTo(
          offsetX - lineLength * (0.7 + Math.sin(Date.now() / 100 + i) * 0.3),
          offsetY
        );
        ctx.stroke();
      }
      
      ctx.restore();
    });
  }
  
  // Draw freeze effect if active
  if (this.powerUps.freeze.active) {
    // Draw freeze aura
    ctx.beginPath();
    ctx.arc(this.x, this.y, 300, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(33, 150, 243, 0.1)';
    ctx.fill();
    
    // Draw freeze border
    ctx.beginPath();
    ctx.arc(this.x, this.y, 300 * (1 + Math.sin(Date.now() / 300) * 0.05), 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(33, 150, 243, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  
  // Draw notifications
  this.notifications.forEach((notification, index) => {
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = notification.color;
    ctx.globalAlpha = notification.opacity;
    
    // Position notifications above the player
    const y = this.y - this.radius - 30 - index * 20;
    ctx.fillText(notification.message, this.x, y);
  });
  
  // Reset opacity
  ctx.globalAlpha = 1;
  
  // Draw player name
  if (this.cells.length > 0) {
    const largestCell = this.cells.reduce((largest, cell) => 
      cell.radius > largest.radius ? cell : largest, this.cells[0]);
    
    if (largestCell.radius > 20) {
      ctx.font = `${Math.min(16, largestCell.radius / 2)}px ${this.nameFont}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = this.nameColor;
      ctx.fillText(this.name, this.x, this.y);
      
      // Draw score if cell is big enough
      if (largestCell.radius > 40) {
        ctx.font = `${Math.min(12, largestCell.radius / 3)}px ${this.nameFont}`;
        ctx.fillText(Math.floor(this.score), this.x, this.y + Math.min(16, largestCell.radius / 2) + 2);
      }
    }
  }
  
  // Draw debug info if debug mode is enabled
  if (this.game.debugMode) {
    ctx.font = '12px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText(`Cells: ${this.cells.length}`, this.x, this.y - this.radius - 40);
    ctx.fillText(`Pos: (${Math.floor(this.x)}, ${Math.floor(this.y)})`, this.x, this.y - this.radius - 55);
    ctx.fillText(`Target: (${Math.floor(this.targetX)}, ${Math.floor(this.targetY)})`, this.x, this.y - this.radius - 70);
    
    // Draw target indicator
    ctx.beginPath();
    ctx.arc(this.targetX, this.targetY, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.fill();
    
    // Draw line to target
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.targetX, this.targetY);
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

drawCellWithMembrane(ctx, cell, opacity) {
  if (!cell || !cell.membrane) {
    console.error("Invalid cell or membrane for drawing:", cell);
    return;
  }
  
  const { membrane } = cell;
  
  ctx.globalAlpha = opacity;
  ctx.beginPath();
  
  // Draw membrane using vertices
  if (membrane.vertices && membrane.vertices.length > 0) {
    const firstVertex = membrane.vertices[0];
    if (!firstVertex) {
      console.error("No vertices in membrane:", membrane);
      return;
    }
    
    const startX = cell.x + (firstVertex.baseX + firstVertex.distortionX) * cell.radius;
    const startY = cell.y + (firstVertex.baseY + firstVertex.distortionY) * cell.radius;
    
    ctx.moveTo(startX, startY);
    
    // Draw the rest of the vertices
    for (let i = 1; i < membrane.vertices.length; i++) {
      const vertex = membrane.vertices[i];
      if (!vertex) continue;
      
      const x = cell.x + (vertex.baseX + vertex.distortionX) * cell.radius;
      const y = cell.y + (vertex.baseY + vertex.distortionY) * cell.radius;
      
      ctx.lineTo(x, y);
    }
    
    // Close the path
    ctx.closePath();
  } else {
    // Fallback to circle if no vertices
    ctx.arc(cell.x, cell.y, cell.radius, 0, Math.PI * 2);
  }
  
  // Apply visual effects for power-ups
  if (this.powerUps.shield.active) {
    // Shield effect
    const gradient = ctx.createRadialGradient(
      cell.x, cell.y, cell.radius * 0.8,
      cell.x, cell.y, cell.radius
    );
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.7)');
    ctx.fillStyle = gradient;
  } else if (this.powerUps.speedBoost.active) {
    // Speed boost effect
    const gradient = ctx.createRadialGradient(
      cell.x, cell.y, 0,
      cell.x, cell.y, cell.radius
    );
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(1, 'rgba(0, 255, 255, 0.5)');
    ctx.fillStyle = gradient;
  } else if (this.powerUps.massBoost.active) {
    // Mass boost effect
    const gradient = ctx.createRadialGradient(
      cell.x, cell.y, 0,
      cell.x, cell.y, cell.radius
    );
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(1, 'rgba(255, 215, 0, 0.5)');
    ctx.fillStyle = gradient;
  } else if (this.powerUps.magnet.active) {
    // Magnet effect
    const gradient = ctx.createRadialGradient(
      cell.x, cell.y, 0,
      cell.x, cell.y, cell.radius
    );
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(1, 'rgba(128, 0, 128, 0.5)');
    ctx.fillStyle = gradient;
  } else if (this.powerUps.freeze.active) {
    // Freeze effect
    const gradient = ctx.createRadialGradient(
      cell.x, cell.y, 0,
      cell.x, cell.y, cell.radius
    );
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(1, 'rgba(33, 150, 243, 0.5)');
    ctx.fillStyle = gradient;
  } else if (this.powerUps.doubleScore.active) {
    // Double score effect
    const gradient = ctx.createRadialGradient(
      cell.x, cell.y, 0,
      cell.x, cell.y, cell.radius
    );
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(1, 'rgba(255, 235, 59, 0.5)');
    ctx.fillStyle = gradient;
  } else {
    // Normal cell - apply skin if available
    if (this.skinObject && this.skinObject.isLoaded) {
      this.skinObject.drawSkin(ctx, cell.x, cell.y, cell.radius);
    } else {
      ctx.fillStyle = this.color;
    }
  }
  
  ctx.fill();
  
  // Draw cell border if enabled
  if (this.cellBorder) {
    ctx.lineWidth = this.cellBorderWidth;
    ctx.strokeStyle = this.cellBorderColor;
    ctx.stroke();
  }
  
  // Draw cell nucleus
  ctx.beginPath();
  ctx.arc(cell.x, cell.y, cell.radius * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.fill();
  
  // Draw cytoplasm details (small circles inside the cell)
  const numDetails = Math.floor(cell.radius / 10);
  for (let i = 0; i < numDetails; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * cell.radius * 0.7;
    const detailX = cell.x + Math.cos(angle) * distance;
    const detailY = cell.y + Math.sin(angle) * distance;
    const detailSize = cell.radius * 0.05 + Math.random() * cell.radius * 0.05;
    
    ctx.beginPath();
    ctx.arc(detailX, detailY, detailSize, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fill();
  }
  
  // Draw "passing under" effect if cell is below others
  if (cell.z < 0) {
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.arc(cell.x, cell.y, cell.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

drawEffects(ctx) {
  const now = Date.now();
  
  // Draw damage effect
  const damageEffect = this.effects.find(effect => effect.type === 'damage');
  if (damageEffect) {
    const elapsed = now - damageEffect.startTime;
    const opacity = 1 - elapsed / damageEffect.duration;
    
    // Red flash effect
    ctx.save();
    ctx.globalAlpha = opacity * 0.3;
    ctx.fillStyle = 'red';
    
    this.cells.forEach(cell => {
      ctx.beginPath();
      ctx.arc(cell.x, cell.y, cell.radius + 5, 0, Math.PI * 2);
      ctx.fill();
    });
    
    ctx.restore();
  }
}

drawPowerUpIndicators(ctx) {
  // Only draw if player has active power-ups
  const hasActivePowerUps = Object.values(this.powerUps).some(powerUp => powerUp.active);
  if (!hasActivePowerUps || this.cells.length === 0) return;
  
  const cell = this.cells[0]; // Use first cell for indicators
  const iconSize = 20;
  const padding = 5;
  const startX = cell.x - (iconSize + padding) * 2;
  const startY = cell.y + cell.radius + 15;
  
  let offsetX = 0;
  
  // Draw power-up icons with remaining time
  Object.entries(this.powerUps).forEach(([type, powerUp]) => {
    if (!powerUp.active) return;
    
    const now = Date.now();
    const remaining = Math.max(0, (powerUp.duration - now) / 1000);
    const x = startX + offsetX;
    
    // Draw icon background
    ctx.beginPath();
    ctx.arc(x + iconSize / 2, startY + iconSize / 2, iconSize / 2, 0, Math.PI * 2);
    
    let color;
    
    switch (type) {
      case 'speedBoost':
        color = '#00bcd4';
        break;
      case 'shield':
        color = '#673ab7';
        break;
      case 'massBoost':
        color = '#ffc107';
        break;
      case 'invisibility':
        color = '#9e9e9e';
        break;
      case 'magnet':
        color = '#9c27b0';
        break;
      case 'freeze':
        color = '#2196f3';
        break;
      case 'doubleScore':
        color = '#ffeb3b';
        break;
    }
    
    ctx.fillStyle = color;
    ctx.fill();
    
    // Draw icon
    ctx.font = '12px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(powerUp.icon || '?', x + iconSize / 2, startY + iconSize / 2);
    
    // Draw remaining time
    ctx.font = '10px Arial';
    ctx.fillText(Math.ceil(remaining) + 's', x + iconSize / 2, startY + iconSize + 10);
    
    offsetX += iconSize + padding;
  });
}

reset() {
  // Reset position
  this.x = this.game.worldSize / 2;
  this.y = this.game.worldSize / 2;
  this.targetX = this.x;
  this.targetY = this.y;
  
  // Reset size and growth
  this.radius = this.baseRadius;
  this.mass = Math.PI * this.radius * this.radius;
  this.score = 0;
  
  // Reset cells
  this.cells = [{ 
    x: this.x, 
    y: this.y, 
    radius: this.radius, 
    mass: this.mass,
    membrane: {
      points: 20,
      elasticity: 0.3,
      distortion: 0.15,
      oscillation: 0.05,
      oscillationSpeed: 1.5,
      phase: Math.random() * Math.PI * 2,
      vertices: []
    },
    z: 0,
    id: 'cell-' + Date.now() + '-0',
    effects: []
  }];
  
  // Initialize cell membranes
  this.initCellMembranes();
  
  // Reset state
  this.isDead = false;
  this.health = this.maxHealth;
  this.experience = 0;
  this.level = 1;
  this.experienceToNextLevel = 1000;
  
  // Reset power-ups
  Object.keys(this.powerUps).forEach(key => {
    this.powerUps[key].active = false;
    this.powerUps[key].duration = 0;
  });
  
  // Reset effects
  this.effects = [];
  
  // Reset notifications
  this.notifications = [];
  
  // Reset cooldowns
  this.ejectCooldown = 0;
  this.canSplit = true;
  this.splitCooldownTime = 0;
  
  // Reset damage immunity
  this.damageImmunity = false;
  this.damageImmunityTime = 0;
  
  // Reset movement history
  this.movementHistory = [];
  
  // Reset stats for this game session
  this.stats.foodEaten = 0;
  this.stats.playersEaten = 0;
  this.stats.virusesEaten = 0;
  this.stats.timesEjected = 0;
  this.stats.timesSplit = 0;
  this.stats.powerUpsCollected = 0;
  this.stats.distanceTraveled = 0;
  this.stats.lastX = this.x;
  this.stats.lastY = this.y;
  this.stats.killStreak = 0;
}

updateInput(input) {
  // Update input state
  if (input.mouseX !== undefined) this.input.mouseX = input.mouseX;
  if (input.mouseY !== undefined) this.input.mouseY = input.mouseY;
  if (input.keys !== undefined) this.input.keys = input.keys;
  if (input.touchActive !== undefined) this.input.touchActive = input.touchActive;
  if (input.touchX !== undefined) this.input.touchX = input.touchX;
  if (input.touchY !== undefined) this.input.touchY = input.touchY;
}
}
