import { Skin } from './skins.js';

export class AI {
  constructor(name, color, game) {
    this.id = 'ai-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    this.name = name;
    this.color = color;
    this.game = game;
    
    // Position and movement
    this.x = Math.random() * game.worldSize;
    this.y = Math.random() * game.worldSize;
    this.targetX = this.x;
    this.targetY = this.y;
    this.baseSpeed = 4.5; // Base speed for AI
    this.speed = this.baseSpeed;
    this.acceleration = 0.15; // How quickly AI reaches max speed
    this.deceleration = 0.2; // How quickly AI slows down
    this.currentVelocityX = 0;
    this.currentVelocityY = 0;
    
    // Size and growth
    this.baseRadius = 20;
    this.radius = this.baseRadius;
    this.mass = Math.PI * this.radius * this.radius;
    this.score = 0;
    this.maxRadius = 400; // Maximum radius a cell can have
    
    // Growth and shrink rates
    this.growthRate = 1.5;
    this.shrinkRate = 0.005;
    
    // Ejection settings
    this.ejectCooldown = 0;
    this.ejectCooldownTime = 500;
    this.ejectSpeed = 25;
    this.ejectDeceleration = 0.95;
    this.ejectDistance = 2;
    this.ejectMassAmount = 0.05;
    this.ejectMinMass = 20; // Minimum mass required to eject
    
    // Split settings
    this.splitVelocity = 18;
    this.splitCooldown = 0;
    this.lastSplitTime = 0;
    this.splitMinMass = 35; // Minimum mass required to split
    this.mergeTime = 15000; // Time before cells can merge
    
    // State
    this.isDead = false;
    this.cells = [{
      x: this.x,
      y: this.y,
      radius: this.radius,
      mass: this.mass,
      // Cell membrane properties
      membrane: {
        points: 20,
        elasticity: 0.3,
        distortion: 0.15,
        oscillation: 0.05,
        oscillationSpeed: 1.5,
        phase: Math.random() * Math.PI * 2,
        vertices: []
      },
      // Z-index for layering (smaller cells can pass under viruses)
      z: 0,
      // Unique ID for each cell
      id: 'ai-cell-' + Date.now() + '-0',
      // For split animation
      splitTime: 0,
      // For merge cooldown
      mergeTime: 0,
      // For cell-specific effects
      effects: []
    }];
    this.health = 100;
    this.maxHealth = 100;
    this.healthRegenRate = 1; // Health points regenerated per second
    this.damageImmunity = false;
    this.damageImmunityTime = 0;
    
    // AI behavior
    this.state = 'wander';
    this.targetEntity = null;
    this.decisionCooldown = 0;
    this.lastDirectionChangeTime = Date.now();
    this.directionChangeCooldown = 2000 + Math.random() * 3000; // 2-5 seconds between direction changes
    this.movementVector = { x: 0, y: 0 };
    this.inertia = 0.92; // Higher value means more momentum in movement
    this.stuckDetection = {
      lastPosition: { x: this.x, y: this.y },
      stuckTime: 0,
      stuckThreshold: 3000, // 3 seconds of minimal movement to consider stuck
      minMovement: 10 // Minimum movement distance to not be considered stuck
    };
    
    // Cell collision physics
    this.cellCollisionElasticity = 0.7;
    this.cellRepulsionForce = 0.05;
    
    // Initialize cell membranes
    this.initCellMembranes();
    
    // Personality traits (randomized for each AI)
    this.personality = {
      aggression: 0.3 + Math.random() * 0.7, // How likely to chase and attack
      caution: 0.2 + Math.random() * 0.6,    // How careful around larger cells
      greed: 0.4 + Math.random() * 0.6,      // How focused on food collection
      splitHappiness: 0.3 + Math.random() * 0.7, // How eager to split
      ejectHappiness: 0.2 + Math.random() * 0.5, // How eager to eject mass
      movementStyle: Math.random(),          // 0 = straight lines, 1 = erratic movement
      directionChangeFrequency: 0.2 + Math.random() * 0.8, // How often to change direction
      teamwork: 0.3 + Math.random() * 0.7,   // How cooperative with team members
      virusAvoidance: 0.4 + Math.random() * 0.6, // How careful around viruses
      powerUpAttraction: 0.5 + Math.random() * 0.5 // How attracted to power-ups
    };
    
    // Decision making weights
    this.weights = {
      foodValue: 1.0,
      playerThreatValue: 2.0,
      playerPreyValue: 1.5,
      virusValue: -1.0,
      virusHideValue: 0.8,
      edgeAvoidanceValue: -0.5,
      powerUpValue: 2.0,
      teamMateValue: 0.5
    };
    
    // Power-ups
    this.powerUps = {
      speedBoost: { active: false, duration: 0, factor: 1.5 },
      shield: { active: false, duration: 0 },
      massBoost: { active: false, duration: 0, factor: 1.2 },
      invisibility: { active: false, duration: 0, opacity: 0.3 },
      magnet: { active: false, duration: 0, range: 200 },
      freeze: { active: false, duration: 0 },
      doubleScore: { active: false, duration: 0, factor: 2 }
    };
    
    // Team
    this.team = null;
    
    // Customization
    this.skin = null;
    this.skinObject = null;
    this.effects = [];
    
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
      killStreak: 0,
      maxKillStreak: 0
    };
    
    // Performance optimization
    this.updateInterval = 1000 / 30; // Update AI at 30 FPS
    this.lastUpdateTime = Date.now();
    this.skipFrames = 0;
    
    // Initialize with a random movement direction
    this.setRandomMovementDirection();
    
    // Set difficulty-based personality traits
    this.adjustForDifficulty();
    
    // Randomly assign a skin
    this.assignRandomSkin();
  }
  
  assignRandomSkin() {
    // 30% chance to have a skin
    if (Math.random() < 0.3) {
      const skins = ['basic', 'striped', 'spotted', 'star', 'evil', 'happy', 'sad', 'cool'];
      this.skin = skins[Math.floor(Math.random() * skins.length)];
      this.skinObject = new Skin(this.skin, this.color);
    }
  }
  
  adjustForDifficulty() {
    const difficultyLevel = this.game.balanceSettings.difficultyLevel;
    
    // Adjust personality traits based on difficulty
    switch (difficultyLevel) {
      case 1: // Easy
        this.personality.aggression *= 0.7;
        this.personality.caution *= 1.3;
        this.personality.splitHappiness *= 0.6;
        this.baseSpeed *= 0.9;
        break;
      case 3: // Hard
        this.personality.aggression *= 1.3;
        this.personality.caution *= 0.8;
        this.personality.splitHappiness *= 1.2;
        this.personality.greed *= 1.2;
        this.baseSpeed *= 1.1;
        break;
      case 2: // Normal - default values
      default:
        break;
    }
  }
  
  initCellMembranes() {
    this.cells.forEach(cell => {
      this.initCellMembrane(cell);
    });
  }
  
  initCellMembrane(cell) {
    const { membrane } = cell;
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
  // Skip frames for performance if needed
  if (this.skipFrames > 0) {
    this.skipFrames--;
    return;
  }
  
  // Performance throttling - update AI at lower frequency than game
  const now = Date.now();
  if (now - this.lastUpdateTime < this.updateInterval) {
    return;
  }
  this.lastUpdateTime = now;
  
  // Make decisions
  this.makeDecisions(deltaTime);
  
  // Update speed based on size
  this.updateSpeedBasedOnSize();
  
  // Move towards target with inertia
  this.moveWithInertia(deltaTime);
  
  // Check collisions
  if (this.game && typeof this.game.getEntitiesInRange === 'function') {
    this.checkCollisions();
  }
  
  // Update cells
  this.updateCells(deltaTime);
  
  // Update cell membranes
  this.updateCellMembranes(deltaTime);
  
  // Update power-ups
  this.updatePowerUps(deltaTime);
  
  // Update score
  this.updateScore();
  
  // Update eject cooldown
  if (this.ejectCooldown > 0) {
    this.ejectCooldown -= deltaTime * 1000;
  }
  
  // Update split cooldown
  if (this.splitCooldown > 0) {
    this.splitCooldown -= deltaTime * 1000;
  }
  
  // Update stuck detection
  this.updateStuckDetection();
  
  // Update effects
  this.updateEffects(deltaTime);
  
  // Regenerate health
  this.regenerateHealth(deltaTime);
  
  // Update damage immunity
  if (this.damageImmunity && Date.now() > this.damageImmunityTime) {
    this.damageImmunity = false;
  }
  
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
  
  // Update stats
  this.updateStats(deltaTime);
}
  
  updateCellMembranes(deltaTime) {
    const time = Date.now() / 1000;
    
    this.cells.forEach(cell => {
      const { membrane } = cell;
      
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
    });
  }

  distortMembrane(cell, dirX, dirY, amount) {
    const { membrane } = cell;
    
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
  
  updateSpeedBasedOnSize() {
    // Calculate average cell radius
    const avgRadius = this.cells.reduce((sum, cell) => sum + cell.radius, 0) / this.cells.length;
    
    // Speed decreases as size increases, but never below a minimum threshold
    // Modified to be less punishing for medium sizes
    const speedFactor = Math.max(0.4, Math.min(1.2, Math.pow(this.baseRadius / avgRadius, 0.35)));
    this.speed = this.baseSpeed * speedFactor;
    
    // Apply power-up effects
    if (this.powerUps.speedBoost.active) {
      this.speed *= this.powerUps.speedBoost.factor;
    }
    
    // Apply freeze effect if any
    if (this.cells.some(cell => cell.effects && cell.effects.some(effect => effect.type === 'freeze'))) {
      this.speed *= 0.5;
    }
  }
  
  updateScore() {
    // Calculate score based on total mass
    const newScore = this.cells.reduce((total, cell) => total + cell.mass, 0);
    
    // Update max score stat
    if (newScore > this.stats.maxScore) {
      this.stats.maxScore = newScore;
    }
    
    this.score = newScore;
  }
  
  updateStats(deltaTime) {
    // Update distance traveled
    const dx = this.x - this.stats.lastX;
    const dy = this.y - this.stats.lastY;
    const distanceMoved = Math.sqrt(dx * dx + dy * dy);
    this.stats.distanceTraveled += distanceMoved;
    this.stats.lastX = this.x;
    this.stats.lastY = this.y;
    
    // Update max size
    const largestCell = this.cells.reduce((largest, cell) => 
      cell.radius > largest.radius ? cell : largest, this.cells[0]);
    if (largestCell.radius > this.stats.maxSize) {
      this.stats.maxSize = largestCell.radius;
    }
  }
  
  updateStuckDetection() {
    const now = Date.now();
    const dx = this.x - this.stuckDetection.lastPosition.x;
    const dy = this.y - this.stuckDetection.lastPosition.y;
    const distanceMoved = Math.sqrt(dx * dx + dy * dy);
    
    // If AI has moved significantly, reset stuck timer
    if (distanceMoved > this.stuckDetection.minMovement) {
      this.stuckDetection.lastPosition.x = this.x;
      this.stuckDetection.lastPosition.y = this.y;
      this.stuckDetection.stuckTime = 0;
    } else {
      // Increment stuck time
      this.stuckDetection.stuckTime += this.updateInterval;
      
      // If stuck for too long, force a direction change
      if (this.stuckDetection.stuckTime > this.stuckDetection.stuckThreshold) {
        this.setRandomMovementDirection();
        this.stuckDetection.stuckTime = 0;
        this.stuckDetection.lastPosition.x = this.x;
        this.stuckDetection.lastPosition.y = this.y;
        
        // Try to eject mass to get unstuck
        if (this.cells.length === 1 && this.cells[0].mass > this.ejectMinMass * 2) {
          this.ejectMass();
        }
        
        // Try to split if large enough
        if (this.cells.length === 1 && this.cells[0].mass > this.splitMinMass * 2 && this.splitCooldown <= 0) {
          this.split();
        }
      }
    }
  }
  
  updatePowerUps(deltaTime) {
    const now = Date.now();
    
    Object.entries(this.powerUps).forEach(([type, powerUp]) => {
      if (powerUp.active && now > powerUp.duration) {
        powerUp.active = false;
        
        if (type === 'massBoost') {
          this.cells.forEach(cell => {
            cell.mass /= powerUp.factor;
            cell.radius = Math.sqrt(cell.mass / Math.PI);
          });
        }
      }
    });
  }
  
  updateEffects(deltaTime) {
    // Update global effects
    this.effects = this.effects.filter(effect => {
      const elapsed = Date.now() - effect.startTime;
      return elapsed < effect.duration;
    });
    
    // Update cell-specific effects
    this.cells.forEach(cell => {
      if (cell.effects) {
        cell.effects = cell.effects.filter(effect => {
          effect.duration -= deltaTime * 1000;
          return effect.duration > 0;
        });
      }
    });
  }
  
  regenerateHealth(deltaTime) {
    if (this.health < this.maxHealth) {
      this.health += this.healthRegenRate * deltaTime;
      if (this.health > this.maxHealth) {
        this.health = this.maxHealth;
      }
    }
  }
  makeDecisions(deltaTime) {
    const now = Date.now();
    
    // Check if it's time to change direction for more natural movement
    if (now - this.lastDirectionChangeTime > this.directionChangeCooldown * (1 / this.personality.directionChangeFrequency)) {
      this.lastDirectionChangeTime = now;
      this.directionChangeCooldown = 2000 + Math.random() * 3000; // 2-5 seconds
      
      // Small chance to completely change direction
      if (Math.random() < 0.3) {
        this.setRandomMovementDirection();
      } else {
        // Otherwise just slightly adjust current direction
        this.adjustMovementDirection();
      }
    }
    
    // Only make major decisions periodically
    if (now < this.decisionCooldown) return;
    
    // Set next decision time (0.5 - 1.5 seconds)
    this.decisionCooldown = now + 500 + Math.random() * 1000;
    
    // Get nearby entities
    const nearbyEntities = this.game.getEntitiesInRange(
      this.x, this.y, 
      Math.max(300, this.radius * 5), 
      ['foods', 'viruses', 'powerUps', 'ais', 'player']
    );
    
    // Find nearest player
    let nearestPlayer = null;
    let nearestPlayerDistance = Infinity;
    let nearestPlayerCell = null;
    
    if (nearbyEntities.player && nearbyEntities.player.length > 0) {
      nearbyEntities.player.forEach(entity => {
        if (!entity.parent || entity.parent.isDead) return;
        
        const dx = this.x - entity.x;
        const dy = this.y - entity.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < nearestPlayerDistance) {
          nearestPlayerDistance = distance;
          nearestPlayer = entity.parent;
          nearestPlayerCell = entity.cell;
        }
      });
    }
    
    // Find nearest AI
    let nearestAI = null;
    let nearestAIDistance = Infinity;
    let nearestAICell = null;
    
    if (nearbyEntities.ais && nearbyEntities.ais.length > 0) {
      nearbyEntities.ais.forEach(entity => {
        if (entity.parent && entity.parent.id === this.id || entity.parent.isDead) return;
        
        // Skip team members in team mode
        if (this.game.gameMode === 'teams' && this.team === entity.parent.team) return;
        
        const dx = this.x - entity.x;
        const dy = this.y - entity.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < nearestAIDistance) {
          nearestAIDistance = distance;
          nearestAI = entity.parent;
          nearestAICell = entity.cell;
        }
      });
    }
    
    // Find nearest teammate
    let nearestTeammate = null;
    let nearestTeammateDistance = Infinity;
    
    if (this.game.gameMode === 'teams' && this.team && nearbyEntities.ais) {
      nearbyEntities.ais.forEach(entity => {
        if (entity.parent && entity.parent.id !== this.id && !entity.parent.isDead && entity.parent.team === this.team) {
          const dx = this.x - entity.x;
          const dy = this.y - entity.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < nearestTeammateDistance) {
            nearestTeammateDistance = distance;
            nearestTeammate = entity.parent;
          }
        }
      });
    }
    
    // Find nearest food
    let nearestFood = null;
    let nearestFoodDistance = Infinity;
    
    if (nearbyEntities.foods && nearbyEntities.foods.length > 0) {
      // Prioritize larger food items
      const foodsByValue = [...nearbyEntities.foods].sort((a, b) => {
        // Sort by type first (extra > large > normal)
        if (a.type !== b.type) {
          if (a.type === 'extra') return -1;
          if (b.type === 'extra') return 1;
          if (a.type === 'large') return -1;
          if (b.type === 'large') return 1;
        }
        return 0;
      });
      
      // Find closest valuable food
      for (const food of foodsByValue) {
        const dx = this.x - food.x;
        const dy = this.y - food.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Prioritize extra food even if it's a bit further
        const distanceMultiplier = food.type === 'extra' ? 0.7 : (food.type === 'large' ? 0.85 : 1);
        const adjustedDistance = distance * distanceMultiplier;
        
        if (adjustedDistance < nearestFoodDistance) {
          nearestFoodDistance = adjustedDistance;
          nearestFood = food;
        }
        
        // Only check the first few food items for performance
        if (nearestFood && nearestFood.type === 'extra') break;
      }
    }
    
    // Find nearest virus
    let nearestVirus = null;
    let nearestVirusDistance = Infinity;
    
    if (nearbyEntities.viruses && nearbyEntities.viruses.length > 0) {
      nearbyEntities.viruses.forEach(virus => {
        const dx = this.x - virus.x;
        const dy = this.y - virus.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < nearestVirusDistance) {
          nearestVirusDistance = distance;
          nearestVirus = virus;
        }
      });
    }
    
    // Find nearest power-up
    let nearestPowerUp = null;
    let nearestPowerUpDistance = Infinity;
    
    if (nearbyEntities.powerUps && nearbyEntities.powerUps.length > 0) {
      nearbyEntities.powerUps.forEach(powerUp => {
        const dx = this.x - powerUp.x;
        const dy = this.y - powerUp.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < nearestPowerUpDistance) {
          nearestPowerUpDistance = distance;
          nearestPowerUp = powerUp;
        }
      });
    }
    
    // Decision making
    const myLargestCell = this.cells.reduce((largest, cell) => 
      cell.radius > largest.radius ? cell : largest, this.cells[0]);
    
    // Calculate threat and opportunity scores
    let threatScore = 0;
    let opportunityScore = 0;
    let targetScore = 0;
    let bestTarget = null;
    let bestTargetType = null;
    
    // Evaluate player threat/opportunity
    if (nearestPlayer) {
      const playerLargestCell = nearestPlayer.cells.reduce((largest, cell) => 
        cell.radius > largest.radius ? cell : largest, nearestPlayer.cells[0]);
      
      if (playerLargestCell.radius > myLargestCell.radius * 1.1) {
        // Player is a threat
        const threatFactor = playerLargestCell.radius / myLargestCell.radius;
        const distanceFactor = Math.max(0, 1 - nearestPlayerDistance / 300);
        threatScore += threatFactor * distanceFactor * this.weights.playerThreatValue;
      } else if (myLargestCell.radius > playerLargestCell.radius * 1.1) {
        // Player is prey
        const opportunityFactor = myLargestCell.radius / playerLargestCell.radius;
        const distanceFactor = Math.max(0, 1 - nearestPlayerDistance / 300);
        const score = opportunityFactor * distanceFactor * this.weights.playerPreyValue * this.personality.aggression;
        
        if (score > targetScore) {
          targetScore = score;
          bestTarget = nearestPlayer;
          bestTargetType = 'player';
        }
      }
    }
    
    // Evaluate AI threat/opportunity
    if (nearestAI) {
      const aiLargestCell = nearestAI.cells.reduce((largest, cell) => 
        cell.radius > largest.radius ? cell : largest, nearestAI.cells[0]);
      
      if (aiLargestCell.radius > myLargestCell.radius * 1.1) {
        // AI is a threat
        const threatFactor = aiLargestCell.radius / myLargestCell.radius;
        const distanceFactor = Math.max(0, 1 - nearestAIDistance / 300);
        threatScore += threatFactor * distanceFactor * this.weights.playerThreatValue;
      } else if (myLargestCell.radius > aiLargestCell.radius * 1.1) {
        // AI is prey
        const opportunityFactor = myLargestCell.radius / aiLargestCell.radius;
        const distanceFactor = Math.max(0, 1 - nearestAIDistance / 300);
        const score = opportunityFactor * distanceFactor * this.weights.playerPreyValue * this.personality.aggression;
        
        if (score > targetScore) {
          targetScore = score;
          bestTarget = nearestAI;
          bestTargetType = 'ai';
        }
      }
    }
    
    // Evaluate teammate opportunity (for team mode)
    if (this.game.gameMode === 'teams' && nearestTeammate) {
      // Consider following teammate if they're larger (protection) or if we're both small (safety in numbers)
      const teammateCell = nearestTeammate.cells[0];
      const teammateFactor = teammateCell.radius / myLargestCell.radius;
      const distanceFactor = Math.max(0, 1 - nearestTeammateDistance / 400);
      
      // More likely to follow teammates if teamwork personality is high
      const teamScore = teammateFactor * distanceFactor * this.weights.teamMateValue * this.personality.teamwork;
      
      // Only follow teammate if no better opportunities and not too close already
      if (teamScore > targetScore * 0.7 && nearestTeammateDistance > myLargestCell.radius * 3) {
        targetScore = teamScore;
        bestTarget = nearestTeammate;
        bestTargetType = 'teammate';
      }
    }
    
    // Evaluate food opportunity
    if (nearestFood) {
      const distanceFactor = Math.max(0, 1 - nearestFoodDistance / 200);
      
      // Increase value for special food types
      let foodValueMultiplier = 1;
      if (nearestFood.type === 'extra') foodValueMultiplier = 3;
      else if (nearestFood.type === 'large') foodValueMultiplier = 2;
      
      const foodValue = nearestFood.mass * this.weights.foodValue * this.personality.greed * foodValueMultiplier;
      const score = foodValue * distanceFactor;
      
      if (score > targetScore) {
        targetScore = score;
        bestTarget = nearestFood;
        bestTargetType = 'food';
      }
    }
    
    // Evaluate power-up opportunity
    if (nearestPowerUp) {
      const distanceFactor = Math.max(0, 1 - nearestPowerUpDistance / 300);
      const powerUpValue = this.weights.powerUpValue * this.personality.powerUpAttraction;
      const score = powerUpValue * distanceFactor;
      
      if (score > targetScore) {
        targetScore = score;
        bestTarget = nearestPowerUp;
        bestTargetType = 'powerUp';
      }
    }
    
    // Evaluate virus threat/opportunity
    if (nearestVirus) {
      const distanceFactor = Math.max(0, 1 - nearestVirusDistance / 200);
      
      if (myLargestCell.radius > nearestVirus.radius * 1.15) {
        // Virus can split us - avoid if we're big
        const threatFactor = myLargestCell.radius / nearestVirus.radius;
        const avoidanceScore = threatFactor * distanceFactor * Math.abs(this.weights.virusValue) * this.personality.virusAvoidance;
        
        // Only avoid if we're not actively chasing something valuable
        if (avoidanceScore > targetScore * 0.8) {
          threatScore += avoidanceScore;
        }
      } else if (myLargestCell.radius < nearestVirus.radius * 0.9) {
        // We can hide behind virus if we're small
        const score = distanceFactor * this.weights.virusHideValue * this.personality.caution;
        
        if (score > targetScore && threatScore > 0) {
          targetScore = score;
          bestTarget = nearestVirus;
          bestTargetType = 'virusHide';
        }
      }
    }
    
    // Edge avoidance
    const edgeDistance = Math.min(
      this.x, 
      this.y, 
      this.game.worldSize - this.x, 
      this.game.worldSize - this.y
    );
    
    if (edgeDistance < 100) {
      const edgeFactor = Math.max(0, 1 - edgeDistance / 100);
      threatScore += edgeFactor * Math.abs(this.weights.edgeAvoidanceValue);
    }
    
    // Make final decision
    if (threatScore > targetScore * this.personality.caution) {
      // Flee from threats
      this.state = 'flee';
      
      // Determine what to flee from
      if (nearestPlayer && nearestPlayer.cells[0].radius > myLargestCell.radius * 1.1 && 
          nearestPlayerDistance < nearestAIDistance) {
        this.targetEntity = nearestPlayer;
      } else if (nearestAI && nearestAI.cells[0].radius > myLargestCell.radius * 1.1) {
        this.targetEntity = nearestAI;
      } else if (nearestVirus && myLargestCell.radius > nearestVirus.radius * 1.15 && 
                nearestVirusDistance < 150) {
        this.targetEntity = nearestVirus;
      } else {
        // Flee from edge
        if (edgeDistance < 100) {
          this.targetX = this.x + (this.x < this.game.worldSize / 2 ? 200 : -200);
          this.targetY = this.y + (this.y < this.game.worldSize / 2 ? 200 : -200);
          this.targetEntity = null;
        }
      }
      
      // Try to eject mass to move faster when fleeing
      if (myLargestCell.radius > this.baseRadius * 3 && 
          Math.random() < this.personality.ejectHappiness && 
          this.ejectCooldown <= 0) {
        this.ejectMass();
      }
    } else if (bestTarget) {
      // Chase opportunity
      this.state = 'chase';
      this.targetEntity = bestTarget;
      
      // Try to split if we're much bigger and close enough
      if ((bestTargetType === 'player' || bestTargetType === 'ai') && 
          this.splitCooldown <= 0 && 
          this.cells.length < 8 &&
          Math.random() < this.personality.splitHappiness) {
        
        const targetLargestCell = bestTarget.cells.reduce((largest, cell) => 
          cell.radius > largest.radius ? cell : largest, bestTarget.cells[0]);
        
        const distance = bestTargetType === 'player' ? nearestPlayerDistance : nearestAIDistance;
        
        if (myLargestCell.radius > targetLargestCell.radius * 2 && 
            distance < 150) {
          this.split();
        }
      }
    } else {
      // Continue wandering with current direction
      this.state = 'wander';
      
      // Occasionally adjust target to maintain natural movement
      if (Math.random() < 0.3) {
        const wanderDistance = 300 + Math.random() * 200;
        this.targetX = this.x + this.movementVector.x * wanderDistance;
        this.targetY = this.y + this.movementVector.y * wanderDistance;
      }
      
      // Keep within world bounds
      this.targetX = Math.max(100, Math.min(this.game.worldSize - 100, this.targetX));
      this.targetY = Math.max(100, Math.min(this.game.worldSize - 100, this.targetY));
    }
  }
  
  setRandomMovementDirection() {
    // Set a random movement direction vector
    const angle = Math.random() * Math.PI * 2;
    this.movementVector = {
      x: Math.cos(angle),
      y: Math.sin(angle)
    };
    
    // Set initial target based on this direction
    const distance = 300 + Math.random() * 200;
    this.targetX = this.x + this.movementVector.x * distance;
    this.targetY = this.y + this.movementVector.y * distance;
    
    // Keep within world bounds
    this.targetX = Math.max(100, Math.min(this.game.worldSize - 100, this.targetX));
    this.targetY = Math.max(100, Math.min(this.game.worldSize - 100, this.targetY));
  }
  
  adjustMovementDirection() {
    // Slightly adjust current movement direction for more natural movement
    const adjustmentAngle = (Math.random() - 0.5) * Math.PI * 0.5; // ±45 degrees
    const currentAngle = Math.atan2(this.movementVector.y, this.movementVector.x);
    const newAngle = currentAngle + adjustmentAngle;
    
    this.movementVector = {
      x: Math.cos(newAngle),
      y: Math.sin(newAngle)
    };
    
    // Set new target based on adjusted direction
    const distance = 300 + Math.random() * 200;
    this.targetX = this.x + this.movementVector.x * distance;
    this.targetY = this.y + this.movementVector.y * distance;
    
    // Keep within world bounds
    this.targetX = Math.max(100, Math.min(this.game.worldSize - 100, this.targetX));
    this.targetY = Math.max(100, Math.min(this.game.worldSize - 100, this.targetY));
  }
  
  moveWithInertia(deltaTime) {
    // Update target based on state
    if (this.state === 'chase' && this.targetEntity) {
      this.targetX = this.targetEntity.x;
      this.targetY = this.targetEntity.y;
    } else if (this.state === 'flee' && this.targetEntity) {
      // Move away from target
      const dx = this.x - this.targetEntity.x;
      const dy = this.y - this.targetEntity.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        this.targetX = this.x + (dx / distance) * 300;
        this.targetY = this.y + (dy / distance) * 300;
      }
    }
    
    // Keep target within world bounds
    this.targetX = Math.max(100, Math.min(this.game.worldSize - 100, this.targetX));
    this.targetY = Math.max(100, Math.min(this.game.worldSize - 100, this.targetY));
    
    // Move cells with inertia for more natural movement
    if (this.cells.length === 1) {
      // Single cell movement
      const cell = this.cells[0];
      const dx = this.targetX - cell.x;
      const dy = this.targetY - cell.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        // Calculate desired velocity
        const moveSpeed = this.speed * (30 / cell.radius);
        const desiredVx = (dx / distance) * Math.min(moveSpeed, distance);
        const desiredVy = (dy / distance) * Math.min(moveSpeed, distance);
        
        // Apply inertia - blend current movement vector with desired direction
        this.movementVector.x = this.movementVector.x * this.inertia + desiredVx * (1 - this.inertia);
        this.movementVector.y = this.movementVector.y * this.inertia + desiredVy * (1 - this.inertia);
        
        // Apply movement
        cell.x += this.movementVector.x * deltaTime;
        cell.y += this.movementVector.y * deltaTime;
        
        // Update AI position
        this.x = cell.x;
        this.y = cell.y;
      }
    } else {
      // Multi-cell movement
      this.cells.forEach(cell => {
        const dx = this.targetX - cell.x;
        const dy = this.targetY - cell.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
          // Calculate desired velocity
          const moveSpeed = this.speed * (30 / cell.radius);
          const desiredVx = (dx / distance) * Math.min(moveSpeed, distance);
          const desiredVy = (dy / distance) * Math.min(moveSpeed, distance);
          
          // Apply inertia - blend current movement vector with desired direction
          this.movementVector.x = this.movementVector.x * this.inertia + desiredVx * (1 - this.inertia);
          this.movementVector.y = this.movementVector.y * this.inertia + desiredVy * (1 - this.inertia);
          
          // Apply movement
          cell.x += this.movementVector.x * deltaTime;
          cell.y += this.movementVector.y * deltaTime;
        }
      });
      
      // Update AI position to the center of mass
      this.updateCenterOfMass();
    }
    
    // Add slight randomness to movement for more natural behavior
    if (Math.random() < 0.05 * this.personality.movementStyle) {
      const jitter = 0.5 + Math.random() * 1.5;
      const jitterAngle = Math.random() * Math.PI * 2;
      
      this.movementVector.x += Math.cos(jitterAngle) * jitter;
      this.movementVector.y += Math.sin(jitterAngle) * jitter;
      
      // Normalize movement vector if it gets too large
      const speed = Math.sqrt(this.movementVector.x * this.movementVector.x + this.movementVector.y * this.movementVector.y);
      if (speed > this.speed * 1.5) {
        this.movementVector.x = (this.movementVector.x / speed) * this.speed;
        this.movementVector.y = (this.movementVector.y / speed) * this.speed;
      }
    }
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
    
    this.x = totalX / totalMass;
    this.y = totalY / totalMass;
  }
  
  checkCollisions() {
    // Get nearby entities
    const nearbyEntities = this.game.getEntitiesInRange(
      this.x, this.y, 
      Math.max(200, this.radius * 3), 
      ['foods', 'viruses', 'powerUps', 'ais', 'player']
    );
    
    // Check food collisions
    this.checkFoodCollisions(nearbyEntities.foods);
    
    // Check virus collisions
    this.checkVirusCollisions(nearbyEntities.viruses);
    
    // Check power-up collisions
    this.checkPowerUpCollisions(nearbyEntities.powerUps);
    
    // Check player collisions
    this.checkPlayerCollisions(nearbyEntities.player);
    
    // Check AI collisions
    this.checkAICollisions(nearbyEntities.ais);
  }
  
  checkFoodCollisions(foods) {
    if (!foods || !foods.length) return;
    
    foods.forEach(food => {
      // Skip food ejected by this AI (recently ejected)
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
          
          // Create particles
          if (this.game.particles) {
            this.game.particles.createFoodParticles(food.x, food.y, food.color);
          }
          
          // Distort membrane in the direction of the food
          this.distortMembrane(cell, -dx/distance, -dy/distance, 0.2);
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
        // Check if cell is large enough to consume the virus
        if (cell.radius > virus.radius * 1.15) {
          // Split the cell if it's big enough
          if (this.cells.length < 16) {
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
            
            // Create particles
            if (this.game.particles) {
              this.game.particles.createVirusParticles(virus.x, virus.y);
            }
            
            // Remove the virus
            this.game.removeVirus(virus);
          }
        } 
        // Check if cell is small enough to pass under virus
        // Fix: Use a direct size comparison instead of calling canPassUnder
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
          
          // Distort membrane
          this.distortMembrane(cell, -dx/distance, -dy/distance, 0.4);
        }
      });
    });
  }
  
  checkPlayerCollisions(playerEntities) {
    if (!playerEntities || !playerEntities.length) return;
    
    playerEntities.forEach(entity => {
      if (!entity.parent || entity.parent.isDead) return;
      
      // Skip collision check with team members in team mode
      if (this.game.gameMode === 'teams' && this.team === entity.parent.team) return;
      
      const playerCell = entity.cell;
      
            this.cells.forEach((cell, cellIndex) => {
        const dx = cell.x - playerCell.x;
        const dy = cell.y - playerCell.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < cell.radius + playerCell.radius) {
          // Calculate overlap percentage
          const overlap = (cell.radius + playerCell.radius - distance) / 2;
          const overlapPercentage = overlap / Math.min(cell.radius, playerCell.radius);
          
          // AI eats player
          if (cell.radius > playerCell.radius * 1.1 && overlapPercentage > 0.9 && !entity.parent.powerUps.shield.active) {
            const massGain = playerCell.mass;
            
            // Apply double score power-up
            const scoreMultiplier = this.powerUps.doubleScore.active ? 
                                   this.powerUps.doubleScore.factor : 1;
            
            cell.mass += massGain * scoreMultiplier;
            
            // Cap cell mass
            const maxCellMass = Math.PI * this.maxRadius * this.maxRadius;
            if (cell.mass > maxCellMass) {
              cell.mass = maxCellMass;
            }
            
            cell.radius = Math.sqrt(cell.mass / Math.PI);
            playerCell.mass = 0;
            
            // Update stats
            this.stats.playersEaten++;
            this.stats.killStreak++;
            
            if (this.stats.killStreak > this.stats.maxKillStreak) {
              this.stats.maxKillStreak = this.stats.killStreak;
            }
            
            // Create particles
            if (this.game.particles) {
              this.game.particles.createEatParticles(playerCell.x, playerCell.y, entity.parent.color);
            }
            
            // Distort membrane
            this.distortMembrane(cell, -dx/distance, -dy/distance, 0.5);
          } 
          // Player eats AI
          else if (playerCell.radius > cell.radius * 1.1 && overlapPercentage > 0.9 && !this.powerUps.shield.active) {
            playerCell.mass += cell.mass;
            playerCell.radius = Math.sqrt(playerCell.mass / Math.PI);
            this.cells.splice(cellIndex, 1);
            
            // Reset kill streak
            this.stats.killStreak = 0;
            
            // Create particles
            if (this.game.particles) {
              this.game.particles.createEatParticles(cell.x, cell.y, this.color);
            }
            
            // Check if AI is dead
            if (this.cells.length === 0) {
              this.isDead = true;
            }
          }
          // Cells are similar size - overlap with minimal push
          else {
            // Calculate minimal push to prevent complete overlap
            const minPushNeeded = Math.max(0, cell.radius + playerCell.radius - distance - 5);
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
  
  checkAICollisions(aiEntities) {
    if (!aiEntities || !aiEntities.length) return;
    
    aiEntities.forEach(entity => {
      if (!entity.parent || entity.parent.id === this.id || entity.parent.isDead) return;
      
      // Skip collision check with team members in team mode
      if (this.game.gameMode === 'teams' && this.team === entity.parent.team) return;
      
      const otherCell = entity.cell;
      
      this.cells.forEach((cell, cellIndex) => {
        const dx = cell.x - otherCell.x;
        const dy = cell.y - otherCell.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < cell.radius + otherCell.radius) {
          // Calculate overlap percentage
          const overlap = (cell.radius + otherCell.radius - distance) / 2;
          const overlapPercentage = overlap / Math.min(cell.radius, otherCell.radius);
          
          // This AI eats other AI
          if (cell.radius > otherCell.radius * 1.1 && overlapPercentage > 0.9 && !entity.parent.powerUps.shield.active) {
            const massGain = otherCell.mass;
            
            // Apply double score power-up
            const scoreMultiplier = this.powerUps.doubleScore.active ? 
                                   this.powerUps.doubleScore.factor : 1;
            
            cell.mass += massGain * scoreMultiplier;
            
            // Cap cell mass
            const maxCellMass = Math.PI * this.maxRadius * this.maxRadius;
            if (cell.mass > maxCellMass) {
              cell.mass = maxCellMass;
            }
            
            cell.radius = Math.sqrt(cell.mass / Math.PI);
            otherCell.mass = 0;
            
            // Update stats
            this.stats.playersEaten++;
            this.stats.killStreak++;
            
            if (this.stats.killStreak > this.stats.maxKillStreak) {
              this.stats.maxKillStreak = this.stats.killStreak;
            }
            
            // Create particles
            if (this.game.particles) {
              this.game.particles.createEatParticles(otherCell.x, otherCell.y, entity.parent.color);
            }
            
            // Distort membrane
            this.distortMembrane(cell, -dx/distance, -dy/distance, 0.5);
          } 
          // Other AI eats this AI
          else if (otherCell.radius > cell.radius * 1.1 && overlapPercentage > 0.9 && !this.powerUps.shield.active) {
            otherCell.mass += cell.mass;
            otherCell.radius = Math.sqrt(otherCell.mass / Math.PI);
            this.cells.splice(cellIndex, 1);
            
            // Reset kill streak
            this.stats.killStreak = 0;
            
            // Create particles
            if (this.game.particles) {
              this.game.particles.createEatParticles(cell.x, cell.y, this.color);
            }
            
            // Check if AI is dead
            if (this.cells.length === 0) {
              this.isDead = true;
            }
          }
          // Cells are similar size - overlap with minimal push
          else {
            // Calculate minimal push to prevent complete overlap
            const minPushNeeded = Math.max(0, cell.radius + otherCell.radius - distance - 5);
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
  
  updateCells(deltaTime) {
    // Remove cells with zero mass
    this.cells = this.cells.filter(cell => cell.mass > 0);
    
    // Check if AI is dead
    if (this.cells.length === 0) {
      this.isDead = true;
      return;
    }
    
    // Apply cell physics (momentum, etc.)
    this.cells.forEach(cell => {
      // Apply velocity for split cells
      if (cell.velocityX !== undefined && cell.velocityY !== undefined) {
        const elapsed = Date.now() - cell.splitTime;
        const slowdownFactor = Math.max(0, 1 - elapsed / 1000); // Slow down over 1 second
        
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
        cell.mass *= (1 - this.shrinkRate * deltaTime);
        cell.radius = Math.sqrt(cell.mass / Math.PI);
      }
    });
    
    // Handle cell-to-cell collisions with improved physics
    this.handleCellCollisions(deltaTime);
    
    // Merge cells if they are close enough and enough time has passed
    this.mergeCells();
    
    // Update AI radius to the largest cell
    this.radius = Math.max(...this.cells.map(cell => cell.radius));
  }
  
  handleCellCollisions(deltaTime) {
    // Check collisions between AI's own cells
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
              const repulsionForce = overlap * this.cellRepulsionForce;
              
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
    const mergeTime = 15000; // 15 seconds after splitting
    
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
          
          // Distort membrane during merge
          this.distortMembrane(cell1, 0, 0, 0.6);
        }
      }
    }
  }
  
  split() {
    if (this.cells.length >= 16 || this.splitCooldown > 0) return;
    
    const now = Date.now();
    this.splitCooldown = 10000; // 10 seconds cooldown
    this.lastSplitTime = now;
    
    // Update stats
    this.stats.timesSplit++;
    
    // Create a copy of cells to avoid modification during iteration
    const cellsToSplit = [...this.cells];
    
    cellsToSplit.forEach((cell, index) => {
      if (cell.radius >= this.baseRadius * 1.5 && this.cells.length < 16) {
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
    } else if (this.targetEntity) {
      // Split towards target entity
      dx = this.targetEntity.x - cell.x;
      dy = this.targetEntity.y - cell.y;
    } else {
      // Split in random direction
      const angle = Math.random() * Math.PI * 2;
      dx = Math.cos(angle);
      dy = Math.sin(angle);
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
      id: 'ai-cell-' + now + '-' + this.cells.length,
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
    if (this.cells.length === 0 || this.ejectCooldown > 0) return;
    
    // Set cooldown
    this.ejectCooldown = this.ejectCooldownTime;
    
    // Update stats
    this.stats.timesEjected++;
    
    this.cells.forEach(cell => {
      // Only eject if cell is big enough
      if (cell.mass > this.ejectMinMass) {
        // Calculate direction
        let dirX, dirY;
        
        if (this.state === 'flee' && this.targetEntity) {
          // Eject away from what we're fleeing from
          dirX = this.x - this.targetEntity.x;
          dirY = this.y - this.targetEntity.y;
        } else if (this.state === 'chase' && this.targetEntity) {
          // Eject towards what we're chasing
          dirX = this.targetEntity.x - this.x;
          dirY = this.targetEntity.y - this.y;
        } else {
          // Eject in movement direction
          dirX = this.movementVector.x;
          dirY = this.movementVector.y;
        }
        
        const distance = Math.sqrt(dirX * dirX + dirY * dirY);
        
        // Normalize direction
        if (distance > 0) {
          dirX /= distance;
          dirY /= distance;
        } else {
          dirX = 1;
          dirY = 0;
        }
        
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
            radius: 4,
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
    
    // Check if dead
    if (this.health <= 0) {
      this.health = 0;
      this.isDead = true;
    }
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
      
      // Draw AI name
      if (cell.radius > 20) {
        ctx.font = `${Math.min(16, cell.radius / 2)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'white';
        ctx.fillText(this.name, cell.x, cell.y);
        
        // Draw score if cell is big enough
        if (cell.radius > 40) {
          ctx.font = `${Math.min(12, cell.radius / 3)}px Arial`;
          ctx.fillText(Math.floor(this.score), cell.x, cell.y + Math.min(16, cell.radius / 2) + 2);
        }
      }
      
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
  }
  
  drawCellWithMembrane(ctx, cell, opacity) {
    const { membrane } = cell;
    
    ctx.globalAlpha = opacity;
    ctx.beginPath();
    
    // Draw membrane using vertices
    if (membrane.vertices.length > 0) {
      const firstVertex = membrane.vertices[0];
      const startX = cell.x + (firstVertex.baseX + firstVertex.distortionX) * cell.radius;
      const startY = cell.y + (firstVertex.baseY + firstVertex.distortionY) * cell.radius;
      
      ctx.moveTo(startX, startY);
      
      // Draw the rest of the vertices
      for (let i = 1; i < membrane.vertices.length; i++) {
        const vertex = membrane.vertices[i];
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
    
    // Draw cell border
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.stroke();
    
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
    // Only draw if AI has active power-ups
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
      
      offsetX += iconSize + padding;
    });
  }
  
  // Set AI difficulty level
  setDifficulty(level) {
    // Reset personality traits
    this.personality = {
      aggression: 0.3 + Math.random() * 0.7,
      caution: 0.2 + Math.random() * 0.6,
      greed: 0.4 + Math.random() * 0.6,
      splitHappiness: 0.3 + Math.random() * 0.7,
      ejectHappiness: 0.2 + Math.random() * 0.5,
      movementStyle: Math.random(),
      directionChangeFrequency: 0.2 + Math.random() * 0.8,
      teamwork: 0.3 + Math.random() * 0.7,
      virusAvoidance: 0.4 + Math.random() * 0.6,
      powerUpAttraction: 0.5 + Math.random() * 0.5
    };
    
    // Adjust based on difficulty
    switch (level) {
      case 1: // Easy
        this.personality.aggression *= 0.7;
        this.personality.caution *= 1.3;
        this.personality.splitHappiness *= 0.6;
        this.baseSpeed *= 0.9;
        break;
      case 3: // Hard
        this.personality.aggression *= 1.3;
        this.personality.caution *= 0.8;
        this.personality.splitHappiness *= 1.2;
        this.personality.greed *= 1.2;
        this.baseSpeed *= 1.1;
        break;
      case 2: // Normal - default values
      default:
        break;
    }
  }
  
  // Reset AI for respawn
  reset() {
    // Reset position
    this.x = Math.random() * this.game.worldSize;
    this.y = Math.random() * this.game.worldSize;
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
      id: 'ai-cell-' + Date.now() + '-0',
      effects: []
    }];
    
    // Initialize cell membranes
    this.initCellMembranes();
    
    // Reset state
    this.isDead = false;
    this.health = this.maxHealth;
    this.state = 'wander';
    this.targetEntity = null;
    this.decisionCooldown = 0;
    this.splitCooldown = 0;
    
    // Reset power-ups
    Object.keys(this.powerUps).forEach(key => {
      this.powerUps[key].active = false;
      this.powerUps[key].duration = 0;
    });
    
    // Reset effects
    this.effects = [];
    
    // Reset movement
    this.setRandomMovementDirection();
    
    // Reset stuck detection
    this.stuckDetection = {
      lastPosition: { x: this.x, y: this.y },
      stuckTime: 0,
      stuckThreshold: 3000,
      minMovement: 10
    };
    
    // Reset kill streak
    this.stats.killStreak = 0;
  }
}
