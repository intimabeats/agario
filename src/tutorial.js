export class Tutorial {
  constructor(game) {
    this.game = game;
    this.steps = [];
    this.currentStep = 0;
    this.isActive = false;
    this.container = document.getElementById('tutorial-container');
    this.highlightElement = null;
    this.autoAdvanceTimer = null;
    
    // Initialize tutorial steps
    this.initTutorialSteps();
  }
  
  initTutorialSteps() {
    this.steps = [
      {
        title: "Welcome to Cytosis.io!",
        content: "This tutorial will teach you the basics of the game. Let's get started!",
        position: { x: 50, y: 50 },
        highlight: null,
        autoAdvance: 3000
      },
      {
        title: "Moving Your Cell",
        content: "Move your mouse to control your cell. Your cell will follow your cursor.",
        position: { x: 50, y: 50 },
        highlight: { type: 'player', radius: 50 },
        autoAdvance: false,
        trigger: 'movement'
      },
      {
        title: "Eating Food",
        content: "Move over the small colored dots to eat them and grow larger.",
        position: { x: 50, y: 50 },
        highlight: { type: 'food', radius: 100 },
        autoAdvance: false,
        trigger: 'eatFood',
        triggerCount: 3
      },
      {
        title: "The Leaderboard",
        content: "The leaderboard shows the top players. Try to get to the top!",
        position: { x: 'right', y: 'top' },
        highlight: { type: 'element', id: 'leaderboard', padding: 10 },
        autoAdvance: 5000
      },
      {
        title: "Your Score",
        content: "Your score increases as you grow. Eat more to increase your score!",
        position: { x: 'left', y: 'top' },
        highlight: { type: 'element', id: 'score-container', padding: 10 },
        autoAdvance: 5000
      },
      {
        title: "Experience and Levels",
        content: "Gain experience by eating food and other cells. Level up to increase your base size!",
        position: { x: 'left', y: 'top' },
        highlight: { type: 'element', id: 'score-container', padding: 10 },
        autoAdvance: 5000
      },
      {
        title: "Splitting",
        content: "Press SPACE to split your cell. This allows you to move faster and catch other cells.",
        position: { x: 50, y: 'bottom' },
        highlight: null,
        autoAdvance: false,
        trigger: 'split'
      },
      {
        title: "Ejecting Mass",
        content: "Press W to eject mass. This can be used to feed teammates or reduce your size to move faster.",
        position: { x: 50, y: 'bottom' },
        highlight: null,
        autoAdvance: false,
        trigger: 'eject'
      },
      {
        title: "Viruses",
        content: "Green spiky cells are viruses. If you're bigger than them, they'll split you into many pieces!",
        position: { x: 50, y: 50 },
        highlight: { type: 'virus', radius: 100 },
        autoAdvance: 5000
      },
      {
        title: "Power-ups",
        content: "Collect power-ups for special abilities like speed boosts, shields, and more!",
        position: { x: 50, y: 50 },
        highlight: { type: 'powerUp', radius: 100 },
        autoAdvance: 5000
      },
      {
        title: "The Minimap",
        content: "The minimap shows your position in the world. Use it to navigate and find other players.",
        position: { x: 'right', y: 'bottom' },
        highlight: { type: 'element', id: 'minimap-container', padding: 10 },
        autoAdvance: 5000
      },
      {
        title: "Other Players",
        content: "Eat cells smaller than you, but avoid larger ones! The bigger you are, the slower you move.",
        position: { x: 50, y: 50 },
        highlight: { type: 'ai', radius: 150 },
        autoAdvance: 5000
      },
      {
        title: "Game Modes",
        content: "Try different game modes: Classic, Battle Royale, and Teams. Each offers a unique experience!",
        position: { x: 50, y: 50 },
        highlight: null,
        autoAdvance: 5000
      },
      {
        title: "You're Ready!",
        content: "That's all you need to know to get started. Good luck and have fun!",
        position: { x: 50, y: 50 },
        highlight: null,
        autoAdvance: 5000
      }
    ];
  }
  
  start() {
    if (!this.container) {
      console.error('Tutorial container not found');
      return;
    }
    
    this.isActive = true;
    this.currentStep = 0;
    this.showStep(this.currentStep);
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Pause the game briefly to let the player read the first step
    if (this.game) {
      this.game.isPaused = true;
      setTimeout(() => {
        if (this.game) this.game.isPaused = false;
      }, 2000);
    }
  }
  
  setupEventListeners() {
    // Listen for player actions to trigger step advancement
    if (this.game && this.game.player) {
      // Track movement
      this.game.canvas.addEventListener('mousemove', this.handleMovement.bind(this));
      
      // Track food eaten
      this.foodEatenCount = 0;
      this.originalFoodEaten = this.game.player.stats.foodEaten;
      
      // Track splitting
      document.addEventListener('keydown', this.handleKeyDown.bind(this));
      
      // Track ejecting
      this.ejectCount = 0;
      this.originalEjectCount = this.game.player.stats.timesEjected;
    }
  }
  
  handleMovement() {
    if (!this.isActive) return;
    
    const currentStep = this.steps[this.currentStep];
    if (currentStep && currentStep.trigger === 'movement') {
      // Player has moved, advance to next step
      this.next();
      
      // Remove event listener
      this.game.canvas.removeEventListener('mousemove', this.handleMovement.bind(this));
    }
  }
  
  handleKeyDown(e) {
    if (!this.isActive) return;
    
    const currentStep = this.steps[this.currentStep];
    
    // Check for split trigger
    if (currentStep && currentStep.trigger === 'split' && e.key === ' ') {
      this.next();
    }
    
    // Check for eject trigger
    if (currentStep && currentStep.trigger === 'eject' && (e.key === 'w' || e.key === 'W')) {
      this.ejectCount++;
      if (this.ejectCount >= 3) { // Require multiple ejections
        this.next();
      }
    }
  }
  
  checkFoodEaten() {
    if (!this.isActive || !this.game || !this.game.player) return;
    
    const currentStep = this.steps[this.currentStep];
    if (currentStep && currentStep.trigger === 'eatFood') {
      const newFoodEaten = this.game.player.stats.foodEaten - this.originalFoodEaten;
      if (newFoodEaten >= currentStep.triggerCount) {
        this.next();
      }
    }
  }
  
  showStep(index) {
    if (index >= this.steps.length) {
      this.end();
      return;
    }
    
    const step = this.steps[index];
    
    // Clear previous step
    this.container.innerHTML = '';
    if (this.highlightElement) {
      this.highlightElement.remove();
      this.highlightElement = null;
    }
    
    // Clear auto-advance timer
    if (this.autoAdvanceTimer) {
      clearTimeout(this.autoAdvanceTimer);
      this.autoAdvanceTimer = null;
    }
    
    // Create step element
    const stepElement = document.createElement('div');
    stepElement.className = 'tutorial-step';
    
    // Set content
    stepElement.innerHTML = `
      <h3>${step.title}</h3>
      <p>${step.content}</p>
      <div class="tutorial-buttons">
        <button class="tutorial-next">Next</button>
        <button class="tutorial-skip">Skip Tutorial</button>
      </div>
    `;
    
    // Position the step
    this.positionStep(stepElement, step.position);
    
    // Add to container
    this.container.appendChild(stepElement);
    
    // Add highlight if needed
    if (step.highlight) {
      this.addHighlight(step.highlight);
    }
    
    // Add event listeners
    stepElement.querySelector('.tutorial-next').addEventListener('click', () => this.next());
    stepElement.querySelector('.tutorial-skip').addEventListener('click', () => this.end());
    
    // Auto-advance if specified
    if (step.autoAdvance) {
      this.autoAdvanceTimer = setTimeout(() => this.next(), step.autoAdvance);
    }
    
    // Check for triggers
    if (step.trigger === 'eatFood') {
      this.originalFoodEaten = this.game.player.stats.foodEaten;
      // Set up interval to check food eaten
      this.foodCheckInterval = setInterval(() => this.checkFoodEaten(), 500);
    }
  }
  
  positionStep(element, position) {
    // Default styles
    element.style.position = 'absolute';
    
    // Position based on x, y values
    if (position.x === 'left') {
      element.style.left = '20px';
    } else if (position.x === 'right') {
      element.style.right = '20px';
    } else {
      element.style.left = `${position.x}%`;
      element.style.transform = 'translateX(-50%)';
    }
    
    if (position.y === 'top') {
      element.style.top = '80px';
    } else if (position.y === 'bottom') {
      element.style.bottom = '20px';
    } else {
      element.style.top = `${position.y}%`;
      element.style.transform += ' translateY(-50%)';
    }
    
    // Fix transform if both x and y are percentages
    if (typeof position.x === 'number' && typeof position.y === 'number') {
      element.style.transform = 'translate(-50%, -50%)';
    }
  }
  
  addHighlight(highlight) {
    if (!highlight) return;
    
    this.highlightElement = document.createElement('div');
    this.highlightElement.className = 'tutorial-highlight';
    
    if (highlight.type === 'element') {
      // Highlight DOM element
      const element = document.getElementById(highlight.id);
      if (element) {
        const rect = element.getBoundingClientRect();
        this.highlightElement.style.left = `${rect.left - highlight.padding}px`;
        this.highlightElement.style.top = `${rect.top - highlight.padding}px`;
        this.highlightElement.style.width = `${rect.width + highlight.padding * 2}px`;
        this.highlightElement.style.height = `${rect.height + highlight.padding * 2}px`;
        this.highlightElement.style.borderRadius = '5px';
      }
    } else if (highlight.type === 'player' && this.game && this.game.player) {
      // Highlight player
      this.updateEntityHighlight(this.game.player, highlight.radius);
    } else if (highlight.type === 'food' || highlight.type === 'virus' || highlight.type === 'powerUp' || highlight.type === 'ai') {
      // Find nearest entity of the specified type
      this.findAndHighlightEntity(highlight.type, highlight.radius);
    }
    
    document.body.appendChild(this.highlightElement);
  }
  
  updateEntityHighlight(entity, radius) {
    if (!entity || !this.highlightElement) return;
    
    // Convert world coordinates to screen coordinates
    const screenX = this.game.width / 2 + (entity.x - this.game.camera.x) * this.game.camera.scale;
    const screenY = this.game.height / 2 + (entity.y - this.game.camera.y) * this.game.camera.scale;
    
    // Update highlight position and size
    this.highlightElement.style.left = `${screenX - radius}px`;
    this.highlightElement.style.top = `${screenY - radius}px`;
    this.highlightElement.style.width = `${radius * 2}px`;
    this.highlightElement.style.height = `${radius * 2}px`;
    this.highlightElement.style.borderRadius = '50%';
  }
  
  findAndHighlightEntity(type, radius) {
    if (!this.game) return;
    
    let entity = null;
    
    // Find nearest entity of the specified type
    if (type === 'food' && this.game.foods.length > 0) {
      entity = this.findNearestEntity(this.game.foods);
    } else if (type === 'virus' && this.game.viruses.length > 0) {
      entity = this.findNearestEntity(this.game.viruses);
    } else if (type === 'powerUp' && this.game.powerUps.length > 0) {
      entity = this.findNearestEntity(this.game.powerUps);
    } else if (type === 'ai' && this.game.ais.length > 0) {
      // Find nearest AI that's visible
      const visibleAIs = this.game.ais.filter(ai => !ai.isDead);
      if (visibleAIs.length > 0) {
        entity = this.findNearestEntity(visibleAIs);
      }
    }
    
    if (entity) {
      this.updateEntityHighlight(entity, radius);
    }
  }
  
  findNearestEntity(entities) {
    if (!entities.length || !this.game.player) return null;
    
    let nearest = entities[0];
    let minDistance = Infinity;
    
    entities.forEach(entity => {
      const dx = entity.x - this.game.player.x;
      const dy = entity.y - this.game.player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < minDistance) {
        minDistance = distance;
        nearest = entity;
      }
    });
    
    return nearest;
  }
  
  next() {
    // Clear any intervals
    if (this.foodCheckInterval) {
      clearInterval(this.foodCheckInterval);
      this.foodCheckInterval = null;
    }
    
    this.currentStep++;
    if (this.currentStep < this.steps.length) {
      this.showStep(this.currentStep);
    } else {
      this.end();
    }
  }
  
  end() {
    this.isActive = false;
    
    // Clear container
    if (this.container) {
      this.container.innerHTML = '';
    }
    
    // Remove highlight
    if (this.highlightElement) {
      this.highlightElement.remove();
      this.highlightElement = null;
    }
    
    // Clear timers and intervals
    if (this.autoAdvanceTimer) {
      clearTimeout(this.autoAdvanceTimer);
      this.autoAdvanceTimer = null;
    }
    
    if (this.foodCheckInterval) {
      clearInterval(this.foodCheckInterval);
      this.foodCheckInterval = null;
    }
    
    // Remove event listeners
    this.game.canvas.removeEventListener('mousemove', this.handleMovement.bind(this));
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    
    // Mark tutorial as completed in storage
    try {
      localStorage.setItem('tutorialCompleted', 'true');
    } catch (e) {
      console.warn('Could not save tutorial status to localStorage:', e);
    }
    
    // Show completion message
    this.showCompletionMessage();
  }
  
  showCompletionMessage() {
    const message = document.createElement('div');
    message.className = 'tutorial-completion';
    message.innerHTML = `
      <div class="tutorial-completion-content">
        <h3>Tutorial Completed!</h3>
        <p>You're now ready to play Cytosis.io. Good luck and have fun!</p>
        <button class="tutorial-completion-button">Got it!</button>
      </div>
    `;
    
    // Style the message
    Object.assign(message.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      zIndex: '1000'
    });
    
    // Style the content
    const content = message.querySelector('.tutorial-completion-content');
    Object.assign(content.style, {
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      padding: '30px',
      borderRadius: '12px',
      textAlign: 'center',
      maxWidth: '400px',
      border: '1px solid rgba(66, 153, 225, 0.3)',
      color: 'white'
    });
    
    // Style the button
    const button = message.querySelector('.tutorial-completion-button');
    Object.assign(button.style, {
      backgroundColor: '#4299e1',
      color: 'white',
      border: 'none',
      padding: '10px 20px',
      borderRadius: '6px',
      cursor: 'pointer',
      marginTop: '20px',
      fontWeight: 'bold'
    });
    
    // Add button event listener
    button.addEventListener('click', () => {
      document.body.removeChild(message);
    });
    
    document.body.appendChild(message);
  }
  
  // Update method called from game loop
  update() {
    if (!this.isActive || !this.highlightElement) return;
    
    const currentStep = this.steps[this.currentStep];
    if (!currentStep || !currentStep.highlight) return;
    
    // Update highlight position for entity types
    if (['player', 'food', 'virus', 'powerUp', 'ai'].includes(currentStep.highlight.type)) {
      this.findAndHighlightEntity(currentStep.highlight.type, currentStep.highlight.radius);
    }
  }
}
