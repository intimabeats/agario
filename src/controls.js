export function setupControls(game, player) {
  if (!game || !player) {
    console.error("Invalid game or player for controls setup:", game, player);
    return;
  }
  
  console.log("Setting up controls for player", player.name);
  
  // Mouse movement
  game.canvas.addEventListener('mousemove', (e) => {
    if (game.isGameOver || game.isPaused) return;
    
    // Get mouse position relative to canvas
    const rect = game.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Verify mouse coordinates are valid
    if (isNaN(mouseX) || isNaN(mouseY)) {
      console.error("Invalid mouse coordinates:", mouseX, mouseY);
      return;
    }
    
    // Convert to world coordinates
    const worldX = game.camera.x + (mouseX - game.width / 2) / game.camera.scale;
    const worldY = game.camera.y + (mouseY - game.height / 2) / game.camera.scale;
    
    // Verify world coordinates are valid
    if (isNaN(worldX) || isNaN(worldY)) {
      console.error("Invalid world coordinates:", worldX, worldY);
      return;
    }
    
    if (game.debugMode) {
      console.log("Mouse move:", mouseX, mouseY, "World:", worldX, worldY);
    }
    
    // Update player input
    player.updateInput({
      mouseX: mouseX,
      mouseY: mouseY
    });
    
    // Set player target directly
    player.targetX = worldX;
    player.targetY = worldY;
  });
  
  // Touch movement for mobile
  game.canvas.addEventListener('touchmove', (e) => {
    if (game.isGameOver || game.isPaused) return;
    e.preventDefault();
    
    // Get touch position relative to canvas
    const rect = game.canvas.getBoundingClientRect();
    const touchX = e.touches[0].clientX - rect.left;
    const touchY = e.touches[0].clientY - rect.top;
    
    // Verify touch coordinates are valid
    if (isNaN(touchX) || isNaN(touchY)) {
      console.error("Invalid touch coordinates:", touchX, touchY);
      return;
    }
    
    // Convert to world coordinates
    const worldX = game.camera.x + (touchX - game.width / 2) / game.camera.scale;
    const worldY = game.camera.y + (touchY - game.height / 2) / game.camera.scale;
    
    // Verify world coordinates are valid
    if (isNaN(worldX) || isNaN(worldY)) {
      console.error("Invalid world coordinates from touch:", worldX, worldY);
      return;
    }
    
    // Update player input
    player.updateInput({
      touchActive: true,
      touchX: touchX,
      touchY: touchY
    });
    
    // Set player target directly
    player.targetX = worldX;
    player.targetY = worldY;
  }, { passive: false });
  
  // Touch start
  game.canvas.addEventListener('touchstart', (e) => {
    if (game.isGameOver || game.isPaused) return;
    
    // Get touch position relative to canvas
    const rect = game.canvas.getBoundingClientRect();
    const touchX = e.touches[0].clientX - rect.left;
    const touchY = e.touches[0].clientY - rect.top;
    
    // Verify touch coordinates are valid
    if (isNaN(touchX) || isNaN(touchY)) {
      console.error("Invalid touch start coordinates:", touchX, touchY);
      return;
    }
    
    // Convert to world coordinates
    const worldX = game.camera.x + (touchX - game.width / 2) / game.camera.scale;
    const worldY = game.camera.y + (touchY - game.height / 2) / game.camera.scale;
    
    // Verify world coordinates are valid
    if (isNaN(worldX) || isNaN(worldY)) {
      console.error("Invalid world coordinates from touch start:", worldX, worldY);
      return;
    }
    
    // Update player input
    player.updateInput({
      touchActive: true,
      touchX: touchX,
      touchY: touchY
    });
    
    // Set player target directly
    player.targetX = worldX;
    player.targetY = worldY;
  }, { passive: false });
  
  // Touch end
  game.canvas.addEventListener('touchend', () => {
    player.updateInput({
      touchActive: false
    });
  });
  
  // Keyboard controls
  document.addEventListener('keydown', (e) => {
    if (game.isGameOver) return;
    
    // Update key state
    const keyState = { ...player.input.keys };
    
    switch (e.key) {
      case ' ':
        // Space to split
        keyState.space = true;
        if (!game.isPaused) {
          player.split();
        }
        break;
      case 'w':
      case 'W':
        // W to eject mass
        keyState.w = true;
        if (!game.isPaused) {
          player.ejectMass();
        }
        break;
      case 'p':
      case 'P':
        // P to pause
        game.isPaused = !game.isPaused;
        const pauseMenu = document.getElementById('pause-menu');
        if (pauseMenu) {
          pauseMenu.style.display = game.isPaused ? 'block' : 'none';
        }
        break;
      case 'ArrowUp':
        keyState.up = true;
        break;
      case 'ArrowDown':
        keyState.down = true;
        break;
      case 'ArrowLeft':
        keyState.left = true;
        break;
      case 'ArrowRight':
        keyState.right = true;
        break;
      case 'a':
      case 'A':
        keyState.a = true;
        break;
      case 's':
      case 'S':
        keyState.s = true;
        break;
      case 'd':
      case 'D':
        keyState.d = true;
        break;
      case 'e':
      case 'E':
        // E for special ability (can be used for future features)
        keyState.e = true;
        break;
      case 'q':
      case 'Q':
        // Q for special ability (can be used for future features)
        keyState.q = true;
        break;
      case 'f':
      case 'F':
        // F for fullscreen toggle
        toggleFullscreen(game.canvas);
        break;
      case 'm':
      case 'M':
        // M for mute toggle
        toggleMute(game);
        break;
      case 'Escape':
        // Escape to pause
        game.isPaused = !game.isPaused;
        const escPauseMenu = document.getElementById('pause-menu');
        if (escPauseMenu) {
          escPauseMenu.style.display = game.isPaused ? 'block' : 'none';
        }
        break;
      case 'Tab':
        // Tab to show leaderboard (prevent default tab behavior)
        e.preventDefault();
        toggleLeaderboard(game);
        break;
      case 'h':
      case 'H':
        // H to toggle help/controls display
        toggleHelp();
        break;
      case 'c':
      case 'C':
        // C to toggle debug mode
        game.debugMode = !game.debugMode;
        break;
    }
    
    // Update player input with new key state
    player.updateInput({ keys: keyState });
    
    // Update movement based on keys
    updateMovementFromKeys(player, keyState);
  });
  
  document.addEventListener('keyup', (e) => {
    // Update key state
    const keyState = { ...player.input.keys };
    
    switch (e.key) {
      case ' ':
        keyState.space = false;
        break;
      case 'w':
      case 'W':
        keyState.w = false;
        break;
      case 'ArrowUp':
        keyState.up = false;
        break;
      case 'ArrowDown':
        keyState.down = false;
        break;
      case 'ArrowLeft':
        keyState.left = false;
        break;
      case 'ArrowRight':
        keyState.right = false;
        break;
      case 'a':
      case 'A':
        keyState.a = false;
        break;
      case 's':
      case 'S':
        keyState.s = false;
        break;
      case 'd':
      case 'D':
        keyState.d = false;
        break;
      case 'e':
      case 'E':
        keyState.e = false;
        break;
      case 'q':
      case 'Q':
        keyState.q = false;
        break;
    }
    
    // Update player input with new key state
    player.updateInput({ keys: keyState });
    
    // Update movement based on keys
    updateMovementFromKeys(player, keyState);
  });
  
  // Add continuous ejection when W is held down
  let ejectInterval = null;
  
  const startContinuousEjection = () => {
    if (ejectInterval) return;
    
    ejectInterval = setInterval(() => {
      if (!game.isGameOver && !game.isPaused && player.input.keys.w) {
        player.ejectMass();
      } else {
        clearInterval(ejectInterval);
        ejectInterval = null;
      }
    }, 100); // Eject every 100ms while key is held
  };
  
  const stopContinuousEjection = () => {
    if (ejectInterval) {
      clearInterval(ejectInterval);
      ejectInterval = null;
    }
  };
  
  // Watch for W key state changes
  const originalUpdateInput = player.updateInput;
  player.updateInput = function(input) {
    const oldWState = this.input.keys?.w;
    originalUpdateInput.call(this, input);
    const newWState = this.input.keys?.w;
    
    // Start continuous ejection when W is pressed
    if (!oldWState && newWState) {
      startContinuousEjection();
    }
    // Stop continuous ejection when W is released
    else if (oldWState && !newWState) {
      stopContinuousEjection();
    }
  };
  
  // Prevent context menu on right click
  game.canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });
  
  // Mouse button controls
  game.canvas.addEventListener('mousedown', (e) => {
    if (game.isGameOver || game.isPaused) return;
    
    switch (e.button) {
      case 0: // Left click
        // Could be used for a special ability
        break;
      case 2: // Right click
        // Right click to split
        player.split();
        break;
    }
  });
  
  // Double click to quickly split twice
  let lastClickTime = 0;
  game.canvas.addEventListener('click', (e) => {
    if (game.isGameOver || game.isPaused) return;
    
    const now = Date.now();
    if (now - lastClickTime < 300) { // 300ms for double click
      // Double click detected - split twice in quick succession
      player.split();
      setTimeout(() => player.split(), 50);
    }
    lastClickTime = now;
  });
  
  // Mouse wheel to zoom (if implemented)
  game.canvas.addEventListener('wheel', (e) => {
    if (game.isGameOver || game.isPaused) return;
    
    // Prevent default scrolling
    e.preventDefault();
    
    // Zoom in/out
    const zoomAmount = -e.deltaY * 0.001; // Adjust sensitivity as needed
    const newScale = Math.max(0.5, Math.min(2, game.camera.scale + zoomAmount));
    game.camera.scale = newScale;
  }, { passive: false });
  
  // Mobile controls
  if (game.isMobile) {
    setupMobileControls(game, player);
  }
  
  // Clean up function to remove event listeners when game ends
  game.canvas.addEventListener('gameStateChange', (e) => {
    if (e.detail && e.detail.type === 'gameOver') {
      stopContinuousEjection();
    }
  });
  
  // Initialize help overlay
  initializeHelp();
}

function updateMovementFromKeys(player, keyState) {
  // Skip if no directional keys are pressed
  if (!keyState.up && !keyState.down && !keyState.left && !keyState.right && 
      !keyState.w && !keyState.a && !keyState.s && !keyState.d) {
    return;
  }
  
  // Calculate direction from keys
  let dirX = 0;
  let dirY = 0;
  
  // Arrow keys
  if (keyState.up) dirY -= 1;
  if (keyState.down) dirY += 1;
  if (keyState.left) dirX -= 1;
  if (keyState.right) dirX += 1;
  
  // WASD keys (except W which is for ejecting)
  if (keyState.a) dirX -= 1;
  if (keyState.s) dirY += 1;
  if (keyState.d) dirX += 1;
  
  // Normalize direction if needed
  const length = Math.sqrt(dirX * dirX + dirY * dirY);
  if (length > 0) {
    dirX /= length;
    dirY /= length;
    
    // Set player target relative to current position
    const moveDistance = 200; // Adjust this value for sensitivity
    player.targetX = player.x + dirX * moveDistance;
    player.targetY = player.y + dirY * moveDistance;
  }
}

function setupMobileControls(game, player) {
  // Create mobile control container
  const mobileControls = document.createElement('div');
  mobileControls.id = 'mobile-controls';
  mobileControls.style.position = 'absolute';
  mobileControls.style.bottom = '20px';
  mobileControls.style.left = '20px';
  mobileControls.style.zIndex = '100';
  mobileControls.style.display = 'flex';
  mobileControls.style.gap = '10px';
  
  // Split button
  const splitButton = document.createElement('button');
  splitButton.textContent = 'Split';
  splitButton.className = 'mobile-button split-button';
  
  splitButton.addEventListener('touchstart', (e) => {
    e.preventDefault();
    player.split();
  });
  
  // Eject mass button
  const ejectButton = document.createElement('button');
  ejectButton.textContent = 'Eject';
  ejectButton.className = 'mobile-button eject-button';
  
  // Continuous ejection on touch hold
  let ejectTouchInterval = null;
  
  ejectButton.addEventListener('touchstart', (e) => {
    e.preventDefault();
    player.ejectMass(); // Eject immediately on first touch
    
    // Set up interval for continuous ejection
    ejectTouchInterval = setInterval(() => {
      if (!game.isGameOver && !game.isPaused) {
        player.ejectMass();
      } else {
        clearInterval(ejectTouchInterval);
        ejectTouchInterval = null;
      }
    }, 100); // Eject every 100ms while touched
  });
  
  ejectButton.addEventListener('touchend', () => {
    if (ejectTouchInterval) {
      clearInterval(ejectTouchInterval);
      ejectTouchInterval = null;
    }
  });
  
  // Add buttons to container
  mobileControls.appendChild(splitButton);
  mobileControls.appendChild(ejectButton);
  
  // Add container to document
  document.body.appendChild(mobileControls);
  
  // Add joystick for mobile devices
  setupJoystick(game, player);
  
  // Hide controls when game is over or paused
  const updateControlsVisibility = () => {
    if (game.isGameOver || game.isPaused) {
      mobileControls.style.display = 'none';
    } else {
      mobileControls.style.display = 'flex';
    }
  };
  
  // Set up an interval to check game state
  const visibilityInterval = setInterval(updateControlsVisibility, 500);
  
  // Clean up when game ends
  game.canvas.addEventListener('gameStateChange', (e) => {
    if (e.detail && e.detail.type === 'gameOver') {
      clearInterval(visibilityInterval);
      if (ejectTouchInterval) {
        clearInterval(ejectTouchInterval);
      }
    }
  });
}
function setupJoystick(game, player) {
  // Create joystick container
  const joystickContainer = document.createElement('div');
  joystickContainer.className = 'joystick-container';
  joystickContainer.style.display = 'none';
  
  // Create joystick knob
  const joystickKnob = document.createElement('div');
  joystickKnob.className = 'joystick-knob';
  joystickContainer.appendChild(joystickKnob);
  
  // Add to document
  document.body.appendChild(joystickContainer);
  
  // Joystick state
  let joystickActive = false;
  let joystickStartX = 0;
  let joystickStartY = 0;
  let joystickCurrentX = 0;
  let joystickCurrentY = 0;
  const joystickMaxDistance = 40; // Maximum distance the knob can move
  
  // Touch start - initialize joystick
  joystickContainer.addEventListener('touchstart', (e) => {
    e.preventDefault();
    
    const touch = e.touches[0];
    const rect = joystickContainer.getBoundingClientRect();
    
    joystickStartX = rect.left + rect.width / 2;
    joystickStartY = rect.top + rect.height / 2;
    joystickCurrentX = joystickStartX;
    joystickCurrentY = joystickStartY;
    
    joystickActive = true;
    joystickContainer.style.display = 'block';
    
    // Position joystick at touch location
    joystickContainer.style.left = `${touch.clientX - rect.width / 2}px`;
    joystickContainer.style.top = `${touch.clientY - rect.height / 2}px`;
  });
  
  // Touch move - update joystick position and player movement
  document.addEventListener('touchmove', (e) => {
    if (!joystickActive) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    joystickCurrentX = touch.clientX;
    joystickCurrentY = touch.clientY;
    
    // Calculate joystick displacement
    let deltaX = joystickCurrentX - joystickStartX;
    let deltaY = joystickCurrentY - joystickStartY;
    
    // Limit displacement to max distance
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    if (distance > joystickMaxDistance) {
      deltaX = deltaX / distance * joystickMaxDistance;
      deltaY = deltaY / distance * joystickMaxDistance;
    }
    
    // Update knob position
    joystickKnob.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    
    // Calculate direction and normalize
    if (distance > 0) {
      const dirX = deltaX / distance;
      const dirY = deltaY / distance;
      
      // Convert to world coordinates and set player target
      const moveDistance = 200; // Adjust this value for sensitivity
      player.targetX = player.x + dirX * moveDistance;
      player.targetY = player.y + dirY * moveDistance;
    }
  });
  
  // Touch end - reset joystick
  document.addEventListener('touchend', () => {
    if (!joystickActive) return;
    
    joystickActive = false;
    joystickKnob.style.transform = 'translate(0, 0)';
    joystickContainer.style.display = 'none';
  });
  
  // Show joystick when game starts
  game.canvas.addEventListener('gameStart', () => {
    if (game.isMobile) {
      joystickContainer.style.display = 'block';
    }
  });
  
  // Hide joystick when game ends
  game.canvas.addEventListener('gameStateChange', (e) => {
    if (e.detail && e.detail.type === 'gameOver') {
      joystickContainer.style.display = 'none';
    }
  });
}

function toggleFullscreen(element) {
  if (!document.fullscreenElement) {
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  }
}

function toggleMute(game) {
  if (game.soundManager) {
    game.soundManager.toggleSound();
    game.soundManager.toggleMusic();
    game.saveSettings();
  }
}

function toggleLeaderboard(game) {
  const leaderboard = document.getElementById('leaderboard');
  if (leaderboard) {
    const isVisible = leaderboard.style.display !== 'none';
    leaderboard.style.display = isVisible ? 'none' : 'block';
  }
}

function toggleHelp() {
  const helpOverlay = document.getElementById('help-overlay');
  if (helpOverlay) {
    helpOverlay.style.display = helpOverlay.style.display === 'none' ? 'flex' : 'none';
  }
}

function initializeHelp() {
  // Create help overlay if it doesn't exist
  let helpOverlay = document.getElementById('help-overlay');
  if (!helpOverlay) {
    helpOverlay = document.createElement('div');
    helpOverlay.id = 'help-overlay';
    helpOverlay.className = 'help-overlay';
    helpOverlay.style.display = 'none';
    
    helpOverlay.innerHTML = `
      <div class="help-content">
        <h2>Controls</h2>
        <div class="controls-list">
          <div class="control-item">
            <div class="key">Mouse</div>
            <div class="action">Move your cell</div>
          </div>
          <div class="control-item">
            <div class="key">Space</div>
            <div class="action">Split cell</div>
          </div>
          <div class="control-item">
            <div class="key">W</div>
            <div class="action">Eject mass</div>
          </div>
          <div class="control-item">
            <div class="key">P / Esc</div>
            <div class="action">Pause game</div>
          </div>
          <div class="control-item">
            <div class="key">F</div>
            <div class="action">Toggle fullscreen</div>
          </div>
          <div class="control-item">
            <div class="key">M</div>
            <div class="action">Toggle sound</div>
          </div>
          <div class="control-item">
            <div class="key">Tab</div>
            <div class="action">Show leaderboard</div>
          </div>
          <div class="control-item">
            <div class="key">H</div>
            <div class="action">Toggle help</div>
          </div>
        </div>
        <button id="close-help">Close</button>
      </div>
    `;
    
    document.body.appendChild(helpOverlay);
    
    // Add close button event listener
    const closeButton = document.getElementById('close-help');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        helpOverlay.style.display = 'none';
      });
    }
  }
}
