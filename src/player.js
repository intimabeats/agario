import { Skin } from './skins.js';

export class Player {
  constructor(name, color, game) {
    this.id = 'player-' + Date.now();
    this.name = name || 'Player';
    this.color = color || '#ff5252';
    this.game = game;
    
    // Position and movement - Iniciar no centro do mapa
    this.x = game.worldSize / 2;
    this.y = game.worldSize / 2;
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
    
    // Create initial cell
    this.cells = [{ 
      x: this.x, 
      y: this.y, 
      radius: this.radius, 
      mass: this.mass,
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
  }

  initCellMembranes() {
    if (!this.cells || this.cells.length === 0) {
      console.error("No cells to initialize membranes");
      return;
    }
    
    this.cells.forEach(cell => {
      if (!cell || !cell.membrane) {
        console.error("Invalid cell or membrane:", cell);
        return;
      }
      
      this.initCellMembrane(cell);
    });
  }

  initCellMembrane(cell) {
    if (!cell || !cell.membrane) {
      console.error("Invalid cell or membrane for initialization:", cell);
      return;
    }
    
    const { membrane } = cell;
    membrane.vertices = [];
    
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
    // Track time played
    this.stats.timePlayed += deltaTime;
    
    // Skip frames for performance if needed
    if (this.skipFrames > 0) {
      this.skipFrames--;
      return;
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

  updateCellMembranes(deltaTime) {
    const time = Date.now() / 1000;
    
    this.cells.forEach(cell => {
      const { membrane } = cell;
      membrane.phase += membrane.oscillationSpeed * deltaTime;
      
      membrane.vertices.forEach(vertex => {
        const oscillation = membrane.oscillation * Math.sin(vertex.angle * 3 + membrane.phase);
        
        vertex.velocityX += -vertex.distortionX * membrane.elasticity;
        vertex.velocityY += -vertex.distortionY * membrane.elasticity;
        
        vertex.velocityX *= 0.9;
        vertex.velocityY *= 0.9;
        
        vertex.distortionX += vertex.velocityX * deltaTime * 5;
        vertex.distortionY += vertex.velocityY * deltaTime * 5;
        
        const distortionLength = Math.sqrt(vertex.distortionX * vertex.distortionX + vertex.distortionY * vertex.distortionY);
        if (distortionLength > membrane.distortion) {
          const scale = membrane.distortion / distortionLength;
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
  // Verificar se as coordenadas são válidas
  if (isNaN(this.x) || isNaN(this.y) || isNaN(this.targetX) || isNaN(this.targetY)) {
    console.error("Invalid coordinates detected:", this.x, this.y, this.targetX, this.targetY);
    // Reiniciar coordenadas para valores válidos
    this.x = this.game.worldSize / 2;
    this.y = this.game.worldSize / 2;
    this.targetX = this.x;
    this.targetY = this.y;
    
    // Reiniciar células
    this.cells.forEach(cell => {
      cell.x = this.x;
      cell.y = this.y;
      cell.velocityX = 0;
      cell.velocityY = 0;
    });
    
    return;
  }
  
  // Verificar se há células
  if (!this.cells || this.cells.length === 0) {
    console.error("No cells to move");
    return;
  }
  
  console.log("Moving towards target:", this.targetX, this.targetY, "Current:", this.x, this.y);
  
  // Calculate movement for each cell with improved physics
  this.cells.forEach((cell, index) => {
    // Verificar se a célula é válida
    if (!cell) {
      console.error("Invalid cell at index", index);
      return;
    }
    
    // Verificar se as coordenadas da célula são válidas
    if (isNaN(cell.x) || isNaN(cell.y)) {
      console.error("Invalid cell coordinates:", cell.x, cell.y);
      // Reiniciar coordenadas da célula
      cell.x = this.x;
      cell.y = this.y;
      cell.velocityX = 0;
      cell.velocityY = 0;
      return;
    }
    
    // Verificar se o raio da célula é válido
    if (isNaN(cell.radius) || cell.radius <= 0) {
      console.error("Invalid cell radius:", cell.radius);
      cell.radius = this.baseRadius;
      cell.mass = Math.PI * cell.radius * cell.radius;
      return;
    }
    
    const dx = this.targetX - cell.x;
    const dy = this.targetY - cell.y;
    
    // Verificar se dx e dy são válidos
    if (isNaN(dx) || isNaN(dy)) {
      console.error("Invalid dx or dy:", dx, dy);
      return;
    }
    
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Verificar se a distância é válida
    if (isNaN(distance)) {
      console.error("Invalid distance:", distance);
      return;
    }
    
    console.log("Cell distance to target:", distance);
    
    if (distance > 0) {
      // Calculate speed based on cell size
      const sizeSpeedFactor = Math.max(0.6, Math.min(2, 40 / cell.radius));
      const moveSpeed = this.speed * sizeSpeedFactor;
      
      // Verificar se a velocidade é válida
      if (isNaN(moveSpeed)) {
        console.error("Invalid move speed:", moveSpeed, this.speed, sizeSpeedFactor);
        return;
      }
      
      // Calculate target velocity
      const targetVelocityX = (dx / distance) * moveSpeed;
      const targetVelocityY = (dy / distance) * moveSpeed;
      
      // Verificar se as velocidades alvo são válidas
      if (isNaN(targetVelocityX) || isNaN(targetVelocityY)) {
        console.error("Invalid target velocity:", targetVelocityX, targetVelocityY);
        return;
      }
      
      // Initialize velocities if undefined
      if (cell.velocityX === undefined) cell.velocityX = 0;
      if (cell.velocityY === undefined) cell.velocityY = 0;
      
      // Verificar se as velocidades atuais são válidas
      if (isNaN(cell.velocityX) || isNaN(cell.velocityY)) {
        console.error("Invalid current velocity:", cell.velocityX, cell.velocityY);
        cell.velocityX = 0;
        cell.velocityY = 0;
      }
      
      // Accelerate towards target velocity
      const newVelocityX = cell.velocityX + (targetVelocityX - cell.velocityX) * this.acceleration;
      const newVelocityY = cell.velocityY + (targetVelocityY - cell.velocityY) * this.acceleration;
      
      // Verificar se as novas velocidades são válidas
      if (isNaN(newVelocityX) || isNaN(newVelocityY)) {
        console.error("Invalid new velocity:", newVelocityX, newVelocityY);
        return;
      }
      
      cell.velocityX = newVelocityX;
      cell.velocityY = newVelocityY;
      
      console.log("Cell velocity:", cell.velocityX, cell.velocityY);
      
      // Apply velocity
      const newX = cell.x + cell.velocityX * deltaTime;
      const newY = cell.y + cell.velocityY * deltaTime;
      
      // Verificar se as novas coordenadas são válidas
      if (isNaN(newX) || isNaN(newY)) {
        console.error("Invalid new position:", newX, newY);
        return;
      }
      
      cell.x = newX;
      cell.y = newY;
      
      // Keep within world bounds
      cell.x = Math.max(cell.radius, Math.min(this.game.worldSize - cell.radius, cell.x));
      cell.y = Math.max(cell.radius, Math.min(this.game.worldSize - cell.radius, cell.y));
    } else {
      // Decelerate when close to target
      if (cell.velocityX) cell.velocityX *= (1 - this.deceleration);
      if (cell.velocityY) cell.velocityY *= (1 - this.deceleration);
      
      // Stop completely if velocity is very small
      if (Math.abs(cell.velocityX) < 0.01) cell.velocityX = 0;
      if (Math.abs(cell.velocityY) < 0.01) cell.velocityY = 0;
    }
  });
  
  // Update player position to the center of mass
  this.updateCenterOfMass();
  
  // Verificar se as coordenadas atualizadas são válidas
  if (isNaN(this.x) || isNaN(this.y)) {
    console.error("Invalid position after updateCenterOfMass");
    this.x = this.game.worldSize / 2;
    this.y = this.game.worldSize / 2;
    
    // Reiniciar células
    this.cells.forEach(cell => {
      cell.x = this.x;
      cell.y = this.y;
    });
  }
  
  console.log("After movement, player position:", this.x, this.y);
}

updateCenterOfMass() {
  let totalX = 0;
  let totalY = 0;
  let totalMass = 0;
  
  // Verificar se há células
  if (this.cells.length === 0) {
    console.error("No cells to calculate center of mass");
    return;
  }
  
  this.cells.forEach(cell => {
    // Verificar se as coordenadas e massa da célula são válidas
    if (isNaN(cell.x) || isNaN(cell.y) || isNaN(cell.mass) || cell.mass <= 0) {
      console.error("Invalid cell data for center of mass calculation:", cell.x, cell.y, cell.mass);
      return;
    }
    
    totalX += cell.x * cell.mass;
    totalY += cell.y * cell.mass;
    totalMass += cell.mass;
  });
  
  // Evitar divisão por zero
  if (totalMass <= 0) {
    console.error("Total mass is zero or negative:", totalMass);
    return;
  }
  
  this.x = totalX / totalMass;
  this.y = totalY / totalMass;
  
  // Verificar se as coordenadas calculadas são válidas
  if (isNaN(this.x) || isNaN(this.y)) {
    console.error("Invalid center of mass calculated:", totalX, totalY, totalMass);
    
    // Usar a posição da primeira célula como fallback
    if (this.cells.length > 0) {
      this.x = this.cells[0].x;
      this.y = this.cells[0].y;
    } else {
      this.x = this.game.worldSize / 2;
      this.y = this.game.worldSize / 2;
    }
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

// Correção do arquivo player.js - Função checkVirusCollisions
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
            this.game.soundManager.playSound('virusSplit');
            
            // Add notification
            this.addNotification('Virus consumed!', '#33ff33');
            
            // Remove the virus
            this.game.removeVirus(virus);
          }
        } 
        // Verificação corrigida: Não usar canPassUnder, verificar diretamente o tamanho
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
