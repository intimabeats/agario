export class Player {
  constructor(name, color, game) {
    this.id = 'player-' + Date.now();
    this.name = name;
    this.color = color;
    this.game = game;
    
    // Position and movement
    this.x = Math.random() * game.worldSize;
    this.y = Math.random() * game.worldSize;
    this.targetX = this.x;
    this.targetY = this.y;
    this.baseSpeed = 8; // Increased base speed significantly for more dynamic gameplay
    this.speed = this.baseSpeed;
    
    // Movement smoothing
    this.smoothingFactor = 0.2; // Increased for more responsive movement
    
    // Size and growth
    this.baseRadius = 20;
    this.radius = this.baseRadius;
    this.mass = Math.PI * this.radius * this.radius;
    this.score = 0;
    
    // Growth and shrink rates
    this.growthRate = 2.5; // Higher = faster growth
    this.shrinkRate = 0.001; // Significantly reduced for slower shrinking
    
    // Ejection settings
    this.ejectCooldown = 0;
    this.ejectCooldownTime = 150; // Reduced cooldown for more responsive ejection
    this.ejectSize = 4; // Size of ejected mass
    this.ejectSpeed = 20; // Increased speed of ejected mass
    this.ejectDistance = 1.5; // Distance multiplier for ejection (higher = further from cell)
    
    // State
    this.isDead = false;
    this.cells = [{ 
      x: this.x, 
      y: this.y, 
      radius: this.radius, 
      mass: this.mass,
      // Cell membrane properties
      membrane: {
        points: 20, // Number of points around the membrane
        elasticity: 0.3, // How elastic the membrane is (0-1)
        distortion: 0.15, // Maximum distortion amount
        oscillation: 0.05, // Natural oscillation amount
        oscillationSpeed: 1.5, // Speed of oscillation
        phase: Math.random() * Math.PI * 2, // Random starting phase
        vertices: [] // Will store the membrane vertices
      }
    }];
    this.health = 100;
    
    // Special abilities
    this.canSplit = true;
    this.splitCooldown = 10000; // 10 seconds
    this.splitVelocity = 20; // Increased split velocity for better separation
    this.powerUps = {
      speedBoost: { active: false, duration: 0, factor: 1.5 },
      shield: { active: false, duration: 0 },
      massBoost: { active: false, duration: 0, factor: 1.2 },
      invisibility: { active: false, duration: 0, opacity: 0.3 },
      magnet: { active: false, duration: 0, range: 200 }
    };
    
    // Experience and levels
    this.experience = 0;
    this.level = 1;
    this.experienceToNextLevel = 1000;
    
    // Customization
    this.skin = 'default';
    this.effects = [];
    
    // Team
    this.team = null;
    
    // Cell collision physics
    this.cellCollisionElasticity = 0.7; // How bouncy cell collisions are (0-1)
    this.cellRepulsionForce = 0.15; // Force applied when cells collide
    
    // Initialize cell membranes
    this.initCellMembranes();
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
    // Update position based on target
    this.moveTowardsTarget();
    
    // Check collisions
    this.checkCollisions();
    
    // Update cells
    this.updateCells(deltaTime);
    
    // Update cell membranes
    this.updateCellMembranes(deltaTime);
    
    // Update power-ups
    this.updatePowerUps(deltaTime);
    
    // Update score
    this.score = this.cells.reduce((total, cell) => total + cell.mass, 0);
    
    // Update speed based on size (smaller = faster)
    this.updateSpeedBasedOnSize();
    
    // Check for level up
    this.checkLevelUp();
    
    // Apply magnet power-up
    if (this.powerUps.magnet.active) {
      this.applyMagnetEffect();
    }
    
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
    
    // Improved speed formula: exponential decay as size increases
    // This creates a more dramatic difference between small and large cells
    const speedFactor = Math.max(0.2, Math.min(1, Math.pow(this.baseRadius / avgRadius, 0.7)));
    this.speed = this.baseSpeed * speedFactor;
    
    // Apply speed boost if active
    if (this.powerUps.speedBoost.active) {
      this.speed *= this.powerUps.speedBoost.factor;
    }
  }
  
  moveTowardsTarget() {
    if (this.cells.length === 1) {
      // Single cell movement with smoothing
      const cell = this.cells[0];
      const dx = this.targetX - cell.x;
      const dy = this.targetY - cell.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        // Calculate move speed based on cell size with improved formula
        // Smaller cells move faster, larger cells move slower
        const sizeSpeedFactor = Math.max(0.5, Math.min(2, 40 / cell.radius));
        const moveSpeed = this.speed * sizeSpeedFactor;
        
        // Apply smoothing factor for more fluid movement
        const moveX = (dx / distance) * Math.min(moveSpeed, distance) * this.smoothingFactor;
        const moveY = (dy / distance) * Math.min(moveSpeed, distance) * this.smoothingFactor;
        
        cell.x += moveX;
        cell.y += moveY;
        
        // Update player position
        this.x = cell.x;
        this.y = cell.y;
      }
    } else {
      // Multi-cell movement with smoothing
      this.cells.forEach(cell => {
        const dx = this.targetX - cell.x;
        const dy = this.targetY - cell.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
          // Calculate move speed based on cell size with improved formula
          const sizeSpeedFactor = Math.max(0.5, Math.min(2, 40 / cell.radius));
          const moveSpeed = this.speed * sizeSpeedFactor;
          
          // Apply smoothing factor for more fluid movement
          const moveX = (dx / distance) * Math.min(moveSpeed, distance) * this.smoothingFactor;
          const moveY = (dy / distance) * Math.min(moveSpeed, distance) * this.smoothingFactor;
          
          cell.x += moveX;
          cell.y += moveY;
        }
      });
      
      // Update player position to the center of mass
      this.updateCenterOfMass();
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
    // Check food collisions
    this.game.foods = this.game.foods.filter(food => {
      let eaten = false;
      
      // Skip food ejected by this player (recently ejected)
      if (food.ejectedBy === this.id && Date.now() - food.ejectionTime < 1000) {
        return true;
      }
      
      this.cells.forEach(cell => {
        const dx = cell.x - food.x;
        const dy = cell.y - food.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < cell.radius) {
          // Eat food with enhanced growth rate
          cell.mass += food.mass * this.growthRate;
          cell.radius = Math.sqrt(cell.mass / Math.PI);
          eaten = true;
          
          // Add experience
          this.addExperience(5);
          
          // Create particles
          this.game.particles.createFoodParticles(food.x, food.y, food.color);
          
          // Play sound
          this.game.soundManager.playSound('eatFood');
          
          // Distort membrane in the direction of the food
          this.distortMembrane(cell, -dx/distance, -dy/distance, 0.2);
        }
      });
      
      return !eaten;
    });
    
    // Check virus collisions
    this.game.viruses = this.game.viruses.filter(virus => {
      let collision = false;
      
      this.cells.forEach((cell, index) => {
        const dx = cell.x - virus.x;
        const dy = cell.y - virus.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < cell.radius + virus.radius) {
          if (cell.radius > virus.radius * 1.15) {
            // Split the cell if it's big enough
            if (this.cells.length < 8) {
              this.splitCell(index, virus.x, virus.y);
              this.game.particles.createVirusParticles(virus.x, virus.y);
              this.game.soundManager.playSound('virusSplit');
            }
            collision = true;
          } else if (!this.powerUps.shield.active) {
            // Damage the cell if it's too small
            cell.mass *= 0.75;
            cell.radius = Math.sqrt(cell.mass / Math.PI);
            this.takeDamage(10);
            this.game.particles.createDamageParticles(cell.x, cell.y);
            this.game.soundManager.playSound('damage');
            
            // Distort membrane on impact
            this.distortMembrane(cell, dx/distance, dy/distance, 0.8);
          }
        }
      });
      
      return !collision;
    });
    
    // Check power-up collisions
    this.game.powerUps = this.game.powerUps.filter(powerUp => {
      let collected = false;
      
      this.cells.forEach(cell => {
        const dx = cell.x - powerUp.x;
        const dy = cell.y - powerUp.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < cell.radius + powerUp.radius) {
          // Collect power-up
          this.activatePowerUp(powerUp.type);
          collected = true;
          
          // Create particles
          this.game.particles.createPowerUpParticles(powerUp.x, powerUp.y, powerUp.color);
          
          // Play sound
          this.game.soundManager.playSound('powerUp');
          
          // Show announcement
          this.game.showAnnouncement(`${this.name} collected ${powerUp.type} power-up!`, 2000);
          
          // Distort membrane
          this.distortMembrane(cell, -dx/distance, -dy/distance, 0.4);
        }
      });
      
      return !collected;
    });
    
    // Check AI collisions
    this.game.ais.forEach(ai => {
      if (ai.isDead) return;
      
      // Skip collision check with team members in team mode
      if (this.game.gameMode === 'teams' && this.team === ai.team) return;
      
      this.cells.forEach((cell, cellIndex) => {
        ai.cells.forEach(aiCell => {
          const dx = cell.x - aiCell.x;
          const dy = cell.y - aiCell.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < cell.radius + aiCell.radius) {
            // Player eats AI
            if (cell.radius > aiCell.radius * 1.15) {
              const massGain = aiCell.mass;
              // Enhanced growth when eating other cells
              cell.mass += massGain * this.growthRate;
              cell.radius = Math.sqrt(cell.mass / Math.PI);
              aiCell.mass = 0;
              
              // Add experience based on AI size
              this.addExperience(Math.floor(massGain / 10));
              
              // Create particles
              this.game.particles.createEatParticles(aiCell.x, aiCell.y, ai.color);
              
              // Play sound
              this.game.soundManager.playSound('eatPlayer');
              
              // Distort membrane
              this.distortMembrane(cell, -dx/distance, -dy/distance, 0.5);
            } 
            // AI eats player
            else if (aiCell.radius > cell.radius * 1.15 && !this.powerUps.shield.active) {
              aiCell.mass += cell.mass;
              aiCell.radius = Math.sqrt(aiCell.mass / Math.PI);
              this.cells.splice(cellIndex, 1);
              
              // Create particles
              this.game.particles.createEatParticles(cell.x, cell.y, this.color);
              
              // Play sound
              this.game.soundManager.playSound('playerEaten');
              
              // Check if player is dead
              if (this.cells.length === 0) {
                this.isDead = true;
                this.game.soundManager.playSound('gameOver');
              }
            }
            // Cells are similar size - bounce off each other
            else {
              // Calculate repulsion vector
              const overlap = cell.radius + aiCell.radius - distance;
              if (overlap > 0) {
                // Normalize direction
                const nx = dx / distance;
                const ny = dy / distance;
                
                // Apply repulsion force
                const repulsionForce = overlap * this.cellRepulsionForce;
                cell.x += nx * repulsionForce;
                cell.y += ny * repulsionForce;
                
                // Distort membrane on collision
                this.distortMembrane(cell, nx, ny, 0.3);
              }
            }
          }
        });
      });
    });
  }
  
  updateCells(deltaTime) {
    // Remove cells with zero mass
    this.cells = this.cells.filter(cell => cell.mass > 0);
    
    // Check if player is dead
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
      
      // Apply mass decay for larger cells (slower decay rate)
      if (cell.mass > this.baseRadius * this.baseRadius * Math.PI * 2) {
        cell.mass *= (1 - this.shrinkRate * deltaTime);
        cell.radius = Math.sqrt(cell.mass / Math.PI);
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
          this.game.particles.createMergeParticles(cell2.x, cell2.y, this.color);
          
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
    
    // Update speed boost
    if (this.powerUps.speedBoost.active && now > this.powerUps.speedBoost.duration) {
      this.powerUps.speedBoost.active = false;
      this.game.showAnnouncement('Speed boost expired!', 1500);
    }
    
    // Update shield
    if (this.powerUps.shield.active && now > this.powerUps.shield.duration) {
      this.powerUps.shield.active = false;
      this.game.showAnnouncement('Shield expired!', 1500);
    }
    
    // Update mass boost
    if (this.powerUps.massBoost.active && now > this.powerUps.massBoost.duration) {
      this.powerUps.massBoost.active = false;
      
      // Revert mass boost
      this.cells.forEach(cell => {
        cell.mass /= this.powerUps.massBoost.factor;
        cell.radius = Math.sqrt(cell.mass / Math.PI);
      });
      
      this.game.showAnnouncement('Mass boost expired!', 1500);
    }
    
    // Update invisibility
    if (this.powerUps.invisibility.active && now > this.powerUps.invisibility.duration) {
      this.powerUps.invisibility.active = false;
      this.game.showAnnouncement('Invisibility expired!', 1500);
    }
    
    // Update magnet
    if (this.powerUps.magnet.active && now > this.powerUps.magnet.duration) {
      this.powerUps.magnet.active = false;
      this.game.showAnnouncement('Magnet expired!', 1500);
    }
    
    // Update split cooldown
    if (!this.canSplit && now > this.splitCooldown) {
      this.canSplit = true;
    }
    
    // Regenerate health
    if (this.health < 100) {
      this.health += 2 * deltaTime; // 2 health per second
      if (this.health > 100) this.health = 100;
    }
  }
  
  activatePowerUp(type) {
    const duration = 10000; // 10 seconds
    const now = Date.now();
    
    switch (type) {
      case 'speed':
        this.powerUps.speedBoost.active = true;
        this.powerUps.speedBoost.duration = now + duration;
        this.game.showAnnouncement('Speed Boost activated!', 2000);
        break;
      case 'shield':
        this.powerUps.shield.active = true;
        this.powerUps.shield.duration = now + duration;
        this.game.showAnnouncement('Shield activated!', 2000);
        break;
      case 'mass':
        this.powerUps.massBoost.active = true;
        this.powerUps.massBoost.duration = now + duration;
        
        // Apply mass boost
        this.cells.forEach(cell => {
          cell.mass *= this.powerUps.massBoost.factor;
          cell.radius = Math.sqrt(cell.mass / Math.PI);
        });
        
        this.game.showAnnouncement('Mass Boost activated!', 2000);
        break;
      case 'invisibility':
        this.powerUps.invisibility.active = true;
        this.powerUps.invisibility.duration = now + duration;
        this.game.showAnnouncement('Invisibility activated!', 2000);
        break;
      case 'magnet':
        this.powerUps.magnet.active = true;
        this.powerUps.magnet.duration = now + duration;
        this.game.showAnnouncement('Food Magnet activated!', 2000);
        break;
    }
  }
  
  applyMagnetEffect() {
    // Attract nearby food
    this.game.foods.forEach(food => {
      // Skip food ejected by this player
      if (food.ejectedBy === this.id) return;
      
      // Find closest cell
      let closestCell = null;
      let minDistance = Infinity;
      
      this.cells.forEach(cell => {
        const dx = cell.x - food.x;
        const dy = cell.y - food.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < minDistance) {
          minDistance = distance;
          closestCell = cell;
        }
      });
      
      // Apply attraction if within range
      if (closestCell && minDistance < this.powerUps.magnet.range) {
        const dx = closestCell.x - food.x;
        const dy = closestCell.y - food.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const attractionStrength = 0.1 * (1 - distance / this.powerUps.magnet.range);
        food.x += (dx / distance) * attractionStrength * minDistance;
        food.y += (dy / distance) * attractionStrength * minDistance;
      }
    });
  }
  
  split() {
    if (!this.canSplit || this.cells.length >= 8) return;
    
    const now = Date.now();
    this.canSplit = false;
    this.splitCooldown = now + 10000; // 10 seconds cooldown
    
    // Create a copy of cells to avoid modification during iteration
    const cellsToSplit = [...this.cells];
    
    cellsToSplit.forEach((cell, index) => {
      if (cell.radius >= this.baseRadius * 1.5) {
        this.splitCell(index);
      }
    });
    
    // Play sound
    this.game.soundManager.playSound('split');
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
    
    const newCell = {
      x: cell.x + dirX * offsetDistance,
      y: cell.y + dirY * offsetDistance,
      radius: cell.radius,
      mass: newMass,
      velocityX: dirX * this.splitVelocity,
      velocityY: dirY * this.splitVelocity,
      splitTime: Date.now(),
      membrane: {
        points: cell.membrane.points,
        elasticity: cell.membrane.elasticity,
        distortion: cell.membrane.distortion,
        oscillation: cell.membrane.oscillation,
        oscillationSpeed: cell.membrane.oscillationSpeed,
        phase: Math.random() * Math.PI * 2,
        vertices: []
      }
    };
    
    // Initialize membrane for new cell
    this.initCellMembrane(newCell);
    
    // Distort both membranes in the split direction
    this.distortMembrane(cell, -dirX, -dirY, 0.5);
    this.distortMembrane(newCell, dirX, dirY, 0.5);
    
    this.cells.push(newCell);
    
    // Create split particles
    this.game.particles.createSplitParticles(cell.x, cell.y, this.color, dirX, dirY);
  }
  
  ejectMass() {
    if (this.cells.length === 0 || this.ejectCooldown > 0) return;
    
    // Set cooldown
    this.ejectCooldown = this.ejectCooldownTime;
    
    let ejectedCount = 0;
    
    this.cells.forEach(cell => {
      // Only eject if cell is big enough
      if (cell.mass > this.baseRadius * 2) {
        // Calculate direction
        const dx = this.targetX - cell.x;
        const dy = this.targetY - cell.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Normalize direction
        const dirX = distance > 0 ? dx / distance : 1;
        const dirY = distance > 0 ? dy / distance : 0;
        
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
          const ejectedFood = {
            x: ejectionX,
            y: ejectionY,
            radius: this.ejectSize,
            mass: ejectedMass * 0.8,
            color: this.color,
            velocityX: dirX * this.ejectSpeed,
            velocityY: dirY * this.ejectSpeed,
            ejectedBy: this.id,
            ejectionTime: Date.now(),
            game: this.game, // Pass game reference
            update: function(deltaTime) {
              // Update position based on velocity
              const elapsed = Date.now() - this.ejectionTime;
              const slowdownFactor = Math.max(0, 1 - elapsed / 1000); // Slow down over 1 second
              
              this.x += this.velocityX * slowdownFactor * deltaTime;
              this.y += this.velocityY * slowdownFactor * deltaTime;
              
              // Keep within world bounds
              if (this.game && this.game.worldSize) {
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
          };
          
          this.game.foods.push(ejectedFood);
          
          ejectedCount++;
          
          // Create particles
          this.game.particles.createEjectParticles(
            ejectionX, 
            ejectionY, 
            this.color, 
            dirX, 
            dirY
          );
          
          // Distort membrane in ejection direction
          this.distortMembrane(cell, dirX, dirY, 0.3);
        }
      }
    });
    
    // Play sound if any mass was ejected
    if (ejectedCount > 0) {
      this.game.soundManager.playSound('eject');
    }
  }
  
  takeDamage(amount) {
    // No damage if shield is active
    if (this.powerUps.shield.active) return;
    
    this.health -= amount;
    
    // Create damage effect
    this.effects.push({
      type: 'damage',
      duration: 500,
      startTime: Date.now()
    });
    
    // Check if dead
    if (this.health <= 0) {
      this.health = 0;
      this.isDead = true;
      this.game.soundManager.playSound('gameOver');
    }
  }
  
  addExperience(amount) {
    this.experience += amount;
    
    // Check for level up
    this.checkLevelUp();
  }
  
  checkLevelUp() {
    if (this.experience >= this.experienceToNextLevel) {
      this.level++;
      this.experience -= this.experienceToNextLevel;
      this.experienceToNextLevel = Math.floor(this.experienceToNextLevel * 1.5);
      
      // Level up benefits
      this.baseRadius += 2;
      
      // Create level up effect
      this.effects.push({
        type: 'levelUp',
        duration: 2000,
        startTime: Date.now()
      });
      
      // Play sound
      this.game.soundManager.playSound('levelUp');
      
      // Show announcement
      this.game.showAnnouncement(`${this.name} reached level ${this.level}!`, 3000);
      
      // Distort all cell membranes for level up effect
      this.cells.forEach(cell => {
        this.distortMembrane(cell, 0, 0, 0.8);
      });
    }
  }
  
  draw(ctx) {
    // Draw cells
    this.cells.forEach(cell => {
      // Apply invisibility
      const opacity = this.powerUps.invisibility.active ? this.powerUps.invisibility.opacity : 1;
      
      // Draw cell with membrane
      this.drawCellWithMembrane(ctx, cell, opacity);
      
      // Draw player name
      if (cell.radius > 20) {
        ctx.font = `${Math.min(16, cell.radius / 2)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'white';
        ctx.fillText(this.name, cell.x, cell.y);
        
        // Draw level and score if cell is big enough
        if (cell.radius > 40) {
          ctx.font = `${Math.min(12, cell.radius / 3)}px Arial`;
          ctx.fillText(`Lvl ${this.level} - ${Math.floor(this.score)}`, cell.x, cell.y + Math.min(16, cell.radius / 2) + 2);
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
    });
    
    // Draw health bar if damaged
    if (this.health < 100) {
      const cell = this.cells[0]; // Use first cell for health bar
      if (cell) {
        const barWidth = cell.radius * 2;
        const barHeight = 6;
        const barX = cell.x - barWidth / 2;
        const barY = cell.y - cell.radius - 15;
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Health
        ctx.fillStyle = this.health > 50 ? '#4caf50' : this.health > 25 ? '#ff9800' : '#f44336';
        ctx.fillRect(barX, barY, barWidth * (this.health / 100), barHeight);
      }
    }
    
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
    }
  }
  
  drawCellWithMembrane(ctx, cell, opacity) {
    const { membrane } = cell;
    
    ctx.globalAlpha = opacity;
    
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
    } else {
      // Normal cell
      ctx.fillStyle = this.color;
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
  }
  
  drawEffects(ctx) {
    const now = Date.now();
    
    // Update effects
    this.effects = this.effects.filter(effect => {
      const elapsed = now - effect.startTime;
      return elapsed < effect.duration;
    });
    
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
    
    // Draw level up effect
    const levelUpEffect = this.effects.find(effect => effect.type === 'levelUp');
    if (levelUpEffect) {
      const elapsed = now - levelUpEffect.startTime;
      const progress = elapsed / levelUpEffect.duration;
      const size = 1 + Math.sin(progress * Math.PI * 8) * 0.1;
      const opacity = 1 - progress;
      
      // Pulsing glow effect
      ctx.save();
      ctx.globalAlpha = opacity * 0.7;
      ctx.fillStyle = 'gold';
      
      this.cells.forEach(cell => {
        ctx.beginPath();
        ctx.arc(cell.x, cell.y, cell.radius * size + 10, 0, Math.PI * 2);
        ctx.fill();
      });
      
      // Draw level up text
      if (this.cells.length > 0) {
        const cell = this.cells[0];
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        
        const yOffset = -cell.radius - 20 - Math.sin(progress * Math.PI * 2) * 10;
        
        ctx.strokeText('LEVEL UP!', cell.x, cell.y + yOffset);
        ctx.fillText('LEVEL UP!', cell.x, cell.y + yOffset);
      }
      
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
      let icon;
      
      switch (type) {
        case 'speedBoost':
          color = '#00bcd4';
          icon = '⚡';
          break;
        case 'shield':
          color = '#673ab7';
          icon = '🛡️';
          break;
        case 'massBoost':
          color = '#ffc107';
          icon = '⬆️';
          break;
        case 'invisibility':
          color = '#9e9e9e';
          icon = '👁️';
          break;
        case 'magnet':
          color = '#9c27b0';
          icon = '🧲';
          break;
      }
      
      ctx.fillStyle = color;
      ctx.fill();
      
      // Draw icon
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'white';
      ctx.fillText(icon, x + iconSize / 2, startY + iconSize / 2);
      
      // Draw time remaining
      ctx.font = '10px Arial';
      ctx.fillText(remaining.toFixed(1) + 's', x + iconSize / 2, startY + iconSize + 10);
      
      offsetX += iconSize + padding;
    });
  }
}
