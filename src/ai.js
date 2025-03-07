
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
    this.baseSpeed = 4.5; // Increased base speed for more dynamic gameplay
    this.speed = this.baseSpeed;
    
    // Size and growth
    this.baseRadius = 20;
    this.radius = this.baseRadius;
    this.mass = Math.PI * this.radius * this.radius;
    this.score = 0;
    
    // Growth and shrink rates
    this.growthRate = 1.5;
    this.shrinkRate = 0.005;
    
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
      z: 0
    }];
    
    // AI behavior
    this.state = 'wander';
    this.targetEntity = null;
    this.decisionCooldown = 0;
    this.splitCooldown = 0;
    this.lastSplitTime = 0;
    this.lastDirectionChangeTime = Date.now();
    this.directionChangeCooldown = 2000 + Math.random() * 3000; // 2-5 seconds between direction changes
    this.movementVector = { x: 0, y: 0 };
    this.inertia = 0.92; // Higher value means more momentum in movement
    
    // Ejection settings
    this.ejectCooldown = 0;
    this.ejectCooldownTime = 500;
    this.ejectSpeed = 25;
    this.ejectDeceleration = 0.95;
    this.ejectDistance = 2;
    
    // Cell collision physics
    this.cellCollisionElasticity = 0.7;
    this.cellRepulsionForce = 0.05; // Reduced for better overlapping
    this.foodAttractionRadius = 5;
    
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
      directionChangeFrequency: 0.2 + Math.random() * 0.8 // How often to change direction
    };
    
    // Decision making weights
    this.weights = {
      foodValue: 1.0,
      playerThreatValue: 2.0,
      playerPreyValue: 1.5,
      virusValue: -1.0,
      virusHideValue: 0.8,
      edgeAvoidanceValue: -0.5
    };
    
    // Initialize with a random movement direction
    this.setRandomMovementDirection();
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
    // Make decisions
    this.makeDecisions(deltaTime);
    
    // Update speed based on size
    this.updateSpeedBasedOnSize();
    
    // Move towards target with inertia
    this.moveWithInertia(deltaTime);
    
    // Check collisions
    this.checkCollisions();
    
    // Update cells
    this.updateCells(deltaTime);
    
    // Update cell membranes
    this.updateCellMembranes(deltaTime);
    
    // Update score
    this.score = this.cells.reduce((total, cell) => total + cell.mass, 0);
    
    // Update eject cooldown
    if (this.ejectCooldown > 0) {
      this.ejectCooldown -= deltaTime * 1000;
    }
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
    
    // Find nearest food
    let nearestFood = null;
    let nearestFoodDistance = Infinity;
    
    if (nearbyEntities.foods && nearbyEntities.foods.length > 0) {
      nearbyEntities.foods.forEach(food => {
        const dx = this.x - food.x;
        const dy = this.y - food.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < nearestFoodDistance) {
          nearestFoodDistance = distance;
          nearestFood = food;
        }
      });
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
    
    // Evaluate food opportunity
    if (nearestFood) {
      const distanceFactor = Math.max(0, 1 - nearestFoodDistance / 200);
      const foodValue = nearestFood.mass * this.weights.foodValue * this.personality.greed;
      const score = foodValue * distanceFactor;
      
      if (score > targetScore) {
        targetScore = score;
        bestTarget = nearestFood;
        bestTargetType = 'food';
      }
    }
    
    // Evaluate virus threat/opportunity
    if (nearestVirus) {
      const distanceFactor = Math.max(0, 1 - nearestVirusDistance / 200);
      
      if (myLargestCell.radius > nearestVirus.radius * 1.15) {
        // Virus can split us - avoid if we're big
        const threatFactor = myLargestCell.radius / nearestVirus.radius;
        threatScore += threatFactor * distanceFactor * Math.abs(this.weights.virusValue) * (1 - this.personality.aggression);
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
      if (nearestPlayer && nearestPlayer.radius > myLargestCell.radius * 1.1 && 
          nearestPlayerDistance < nearestAIDistance) {
        this.targetEntity = nearestPlayer;
      } else if (nearestAI && nearestAI.radius > myLargestCell.radius * 1.1) {
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
      if (myLargestCell.radius > this.baseRadius * 3 && Math.random() < this.personality.ejectHappiness) {
        this.ejectMass();
      }
    } else if (bestTarget) {
      // Chase opportunity
      this.state = 'chase';
      this.targetEntity = bestTarget;
      
      // Try to split if we're much bigger and close enough
      if (bestTargetType === 'player' || bestTargetType === 'ai') {
        const targetLargestCell = bestTarget.cells.reduce((largest, cell) => 
          cell.radius > largest.radius ? cell : largest, bestTarget.cells[0]);
        
        const distance = bestTargetType === 'player' ? nearestPlayerDistance : nearestAIDistance;
        
        if (myLargestCell.radius > targetLargestCell.radius * 2 && 
            distance < 150 && 
            now > this.splitCooldown && 
            this.cells.length < 8 &&
            Math.random() < this.personality.splitHappiness) {
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
        cell.x += this.movementVector.x;
        cell.y += this.movementVector.y;
        
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
          cell.x += this.movementVector.x;
          cell.y += this.movementVector.y;
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
          cell.mass += food.mass * this.growthRate;
          cell.radius = Math.sqrt(cell.mass / Math.PI);
          this.game.removeFood(food);
          
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
              
              // Create particles
              if (this.game.particles) {
                this.game.particles.createVirusParticles(virus.x, virus.y);
              }
              
              // Remove the virus
              this.game.removeVirus(virus);
            }
          } else if (virus.canPassUnder(cell.radius)) {
            // Smaller cells pass under the virus
            cell.z = -1;
            setTimeout(() => { cell.z = 0; }, 1000);
          } else {
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
          // AI doesn't use power-ups, but we'll remove it
          this.game.removePowerUp(powerUp);
          
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
          if (cell.radius > playerCell.radius * 1.1 && overlapPercentage > 0.9) {
            cell.mass += playerCell.mass;
            cell.radius = Math.sqrt(cell.mass / Math.PI);
            playerCell.mass = 0;
            
            // Create particles
            if (this.game.particles) {
              this.game.particles.createEatParticles(playerCell.x, playerCell.y, entity.parent.color);
            }
            
            // Distort membrane
            this.distortMembrane(cell, -dx/distance, -dy/distance, 0.5);
          } 
          // Player eats AI
          else if (playerCell.radius > cell.radius * 1.1 && overlapPercentage > 0.9) {
            playerCell.mass += cell.mass;
            playerCell.radius = Math.sqrt(playerCell.mass / Math.PI);
            this.cells.splice(cellIndex, 1);
            
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
          if (cell.radius > otherCell.radius * 1.1 && overlapPercentage > 0.9) {
            cell.mass += otherCell.mass;
            cell.radius = Math.sqrt(cell.mass / Math.PI);
            otherCell.mass = 0;
            
            // Create particles
            if (this.game.particles) {
              this.game.particles.createEatParticles(otherCell.x, otherCell.y, entity.parent.color);
            }
            
            // Distort membrane
            this.distortMembrane(cell, -dx/distance, -dy/distance, 0.5);
          } 
          // Other AI eats this AI
          else if (otherCell.radius > cell.radius * 1.1 && overlapPercentage > 0.9) {
            otherCell.mass += cell.mass;
            otherCell.radius = Math.sqrt(otherCell.mass / Math.PI);
            this.cells.splice(cellIndex, 1);
            
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
        
        cell.x += cell.velocityX * slowdownFactor;
        cell.y += cell.velocityY * slowdownFactor;
        
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
        const canMerge = (!cell1.splitTime || now - cell1.splitTime > 15000) && 
                         (!cell2.splitTime || now - cell2.splitTime > 15000);
        
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
        if (cell1.splitTime && now - cell1.splitTime < mergeTime) continue;
        if (cell2.splitTime && now - cell2.splitTime < mergeTime) continue;
        
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
    if (this.cells.length >= 16) return;
    
    const now = Date.now();
    this.splitCooldown = now + 10000; // 10 seconds cooldown
    this.lastSplitTime = now;
    
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
    
    const newCell = {
      x: cell.x + dirX * offsetDistance,
      y: cell.y + dirY * offsetDistance,
      radius: cell.radius,
      mass: newMass,
      velocityX: dirX * 25, // Increased velocity for better separation
      velocityY: dirY * 25,
      splitTime: Date.now(),
      membrane: {
        points: cell.membrane.points,
        elasticity: cell.membrane.elasticity,
        distortion: cell.membrane.distortion,
        oscillation: cell.membrane.oscillation,
        oscillationSpeed: cell.membrane.oscillationSpeed,
        phase: Math.random() * Math.PI * 2,
        vertices: []
      },
      z: 0
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
    
    this.cells.forEach(cell => {
      // Only eject if cell is big enough
      if (cell.mass > this.baseRadius * 2) {
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
        const ejectedMass = Math.min(cell.mass * 0.05, 20);
        
        // Only eject if it won't make the cell too small
        if (cell.mass - ejectedMass > this.baseRadius) {
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
    // Apply damage to all cells
    this.cells.forEach(cell => {
      cell.mass = Math.max(this.baseRadius, cell.mass - amount * cell.mass);
      cell.radius = Math.sqrt(cell.mass / Math.PI);
      
      // Distort membrane to show damage
      this.distortMembrane(cell, 0, 0, 0.5);
    });
    
    // Create damage effect
    if (this.game.particles) {
      this.game.particles.createDamageParticles(this.x, this.y);
    }
  }
  
  draw(ctx) {
    // Sort cells by z-index to handle layering
    const sortedCells = [...this.cells].sort((a, b) => a.z - b.z);
    
    // Draw cells
    sortedCells.forEach(cell => {
      // Draw cell with membrane
      this.drawCellWithMembrane(ctx, cell);
      
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
      
      // Draw team indicator if in team mode
      if (this.game.gameMode === 'teams' && this.team) {
        ctx.beginPath();
        ctx.arc(cell.x, cell.y, cell.radius + 5, 0, Math.PI * 2);
        ctx.lineWidth = 3;
        ctx.strokeStyle = this.game.getTeamColor(this.team);
        ctx.stroke();
      }
    });
  }
  
  drawCellWithMembrane(ctx, cell) {
    const { membrane } = cell;
    
    // Start drawing the membrane
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
    
    // Fill with cell color
    ctx.fillStyle = this.color;
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
}
