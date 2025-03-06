
export function setupControls(game, player) {
  // Mouse movement
  game.canvas.addEventListener('mousemove', (e) => {
    if (game.isGameOver || game.isPaused) return;
    
    // Get mouse position relative to canvas
    const rect = game.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Convert to world coordinates
    const worldX = game.camera.x + (mouseX - game.width / 2) / game.camera.scale;
    const worldY = game.camera.y + (mouseY - game.height / 2) / game.camera.scale;
    
    // Set player target
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
    
    // Convert to world coordinates
    const worldX = game.camera.x + (touchX - game.width / 2) / game.camera.scale;
    const worldY = game.camera.y + (touchY - game.height / 2) / game.camera.scale;
    
    // Set player target
    player.targetX = worldX;
    player.targetY = worldY;
  }, { passive: false });
  
  // Keyboard controls
  document.addEventListener('keydown', (e) => {
    if (game.isGameOver || game.isPaused) return;
    
    switch (e.key) {
      case ' ':
        // Space to split
        player.split();
        break;
      case 'w':
      case 'W':
        // W to eject mass
        player.ejectMass();
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
    }
  });
  
  // Add continuous ejection when W is held down
  let isWKeyDown = false;
  let ejectInterval = null;
  
  document.addEventListener('keydown', (e) => {
    if (game.isGameOver || game.isPaused) return;
    
    if ((e.key === 'w' || e.key === 'W') && !isWKeyDown) {
      isWKeyDown = true;
      player.ejectMass(); // Eject immediately on first press
      
      // Set up interval for continuous ejection
      ejectInterval = setInterval(() => {
        if (!game.isGameOver && !game.isPaused) {
          player.ejectMass();
        } else {
          clearInterval(ejectInterval);
          isWKeyDown = false;
        }
      }, 100); // Eject every 100ms while key is held
    }
  });
  
  document.addEventListener('keyup', (e) => {
    if (e.key === 'w' || e.key === 'W') {
      isWKeyDown = false;
      if (ejectInterval) {
        clearInterval(ejectInterval);
        ejectInterval = null;
      }
    }
  });
  
  // Prevent context menu on right click
  game.canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });
  
  // Mobile controls
  const addMobileButtons = () => {
    // Create mobile control container
    const mobileControls = document.createElement('div');
    mobileControls.style.position = 'absolute';
    mobileControls.style.bottom = '20px';
    mobileControls.style.left = '20px';
    mobileControls.style.zIndex = '100';
    mobileControls.style.display = 'flex';
    mobileControls.style.gap = '10px';
    
    // Split button
    const splitButton = document.createElement('button');
    splitButton.textContent = 'Split';
    splitButton.style.width = '80px';
    splitButton.style.height = '80px';
    splitButton.style.borderRadius = '50%';
    splitButton.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
    splitButton.style.border = 'none';
    splitButton.style.fontSize = '16px';
    splitButton.style.fontWeight = 'bold';
    splitButton.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
    
    splitButton.addEventListener('touchstart', (e) => {
      e.preventDefault();
      player.split();
    });
    
    // Eject mass button
    const ejectButton = document.createElement('button');
    ejectButton.textContent = 'Eject';
    ejectButton.style.width = '80px';
    ejectButton.style.height = '80px';
    ejectButton.style.borderRadius = '50%';
    ejectButton.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
    ejectButton.style.border = 'none';
    ejectButton.style.fontSize = '16px';
    ejectButton.style.fontWeight = 'bold';
    ejectButton.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
    
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
    
    // Only show on mobile devices
    if (!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      mobileControls.style.display = 'none';
    }
    
    // Hide controls when game is over or paused
    const updateControlsVisibility = () => {
      if (game.isGameOver || game.isPaused) {
        mobileControls.style.display = 'none';
      } else if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        mobileControls.style.display = 'flex';
      }
    };
    
    // Set up an interval to check game state
    const visibilityInterval = setInterval(updateControlsVisibility, 500);
    
    // Clean up when game ends
    game.canvas.addEventListener('gameover', () => {
      clearInterval(visibilityInterval);
      document.body.removeChild(mobileControls);
    }, { once: true });
  };
  
  // Add mobile controls if on mobile device
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    addMobileButtons();
  }
  
  // Add joystick for mobile devices
  const addJoystick = () => {
    // Create joystick container
    const joystickContainer = document.createElement('div');
    joystickContainer.style.position = 'absolute';
    joystickContainer.style.bottom = '120px';
    joystickContainer.style.left = '50px';
    joystickContainer.style.width = '100px';
    joystickContainer.style.height = '100px';
    joystickContainer.style.borderRadius = '50%';
    joystickContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
    joystickContainer.style.zIndex = '100';
    
    // Create joystick knob
    const joystickKnob = document.createElement('div');
    joystickKnob.style.position = 'absolute';
    joystickKnob.style.top = '35px';
    joystickKnob.style.left = '35px';
    joystickKnob.style.width = '30px';
    joystickKnob.style.height = '30px';
    joystickKnob.style.borderRadius = '50%';
    joystickKnob.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    joystickKnob.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.3)';
    
    joystickContainer.appendChild(joystickKnob);
    document.body.appendChild(joystickContainer);
    
    // Joystick variables
    let joystickActive = false;
    let joystickOrigin = { x: 0, y: 0 };
    const maxDistance = 35;
    
    // Joystick touch events
    joystickContainer.addEventListener('touchstart', (e) => {
      e.preventDefault();
      joystickActive = true;
      
      const rect = joystickContainer.getBoundingClientRect();
      joystickOrigin.x = rect.left + rect.width / 2;
      joystickOrigin.y = rect.top + rect.height / 2;
      
      updateJoystickPosition(e.touches[0].clientX, e.touches[0].clientY);
    });
    
    document.addEventListener('touchmove', (e) => {
      if (!joystickActive) return;
      e.preventDefault();
      updateJoystickPosition(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });
    
    document.addEventListener('touchend', () => {
      joystickActive = false;
      joystickKnob.style.top = '35px';
      joystickKnob.style.left = '35px';
    });
    
    function updateJoystickPosition(touchX, touchY) {
      // Calculate distance from center
      const dx = touchX - joystickOrigin.x;
      const dy = touchY - joystickOrigin.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Normalize and limit distance
      const angle = Math.atan2(dy, dx);
      const limitedDistance = Math.min(distance, maxDistance);
      
      // Update knob position
      joystickKnob.style.left = (50 + Math.cos(angle) * limitedDistance) + 'px';
      joystickKnob.style.top = (50 + Math.sin(angle) * limitedDistance) + 'px';
      
      // Calculate direction for player movement
      if (distance > 10) { // Small threshold to prevent tiny movements
        // Calculate target position in world coordinates
        const dirX = Math.cos(angle);
        const dirY = Math.sin(angle);
        const strength = limitedDistance / maxDistance;
        
        // Set player target relative to current position
        const moveDistance = 200 * strength; // Adjust this value for sensitivity
        player.targetX = player.x + dirX * moveDistance;
        player.targetY = player.y + dirY * moveDistance;
      }
    }
    
    // Only show on mobile devices
    if (!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      joystickContainer.style.display = 'none';
    }
    
    // Hide joystick when game is over or paused
    const updateJoystickVisibility = () => {
      if (game.isGameOver || game.isPaused) {
        joystickContainer.style.display = 'none';
      } else if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        joystickContainer.style.display = 'block';
      }
    };
    
    // Set up an interval to check game state
    const visibilityInterval = setInterval(updateJoystickVisibility, 500);
    
    // Clean up when game ends
    game.canvas.addEventListener('gameover', () => {
      clearInterval(visibilityInterval);
      document.body.removeChild(joystickContainer);
    }, { once: true });
  };
  
  // Add joystick for mobile devices
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    addJoystick();
  }
  
  // Add keyboard arrow keys support
  let arrowKeysActive = {
    up: false,
    down: false,
    left: false,
    right: false
  };
  
  document.addEventListener('keydown', (e) => {
    if (game.isGameOver || game.isPaused) return;
    
    switch (e.key) {
      case 'ArrowUp':
        arrowKeysActive.up = true;
        break;
      case 'ArrowDown':
        arrowKeysActive.down = true;
        break;
      case 'ArrowLeft':
        arrowKeysActive.left = true;
        break;
      case 'ArrowRight':
        arrowKeysActive.right = true;
        break;
    }
    
    updatePlayerTargetFromKeys();
  });
  
  document.addEventListener('keyup', (e) => {
    switch (e.key) {
      case 'ArrowUp':
        arrowKeysActive.up = false;
        break;
      case 'ArrowDown':
        arrowKeysActive.down = false;
        break;
      case 'ArrowLeft':
        arrowKeysActive.left = false;
        break;
      case 'ArrowRight':
        arrowKeysActive.right = false;
        break;
    }
    
    updatePlayerTargetFromKeys();
  });
  
  function updatePlayerTargetFromKeys() {
    // Only update if at least one arrow key is active
    if (arrowKeysActive.up || arrowKeysActive.down || arrowKeysActive.left || arrowKeysActive.right) {
      let dirX = 0;
      let dirY = 0;
      
      if (arrowKeysActive.up) dirY -= 1;
      if (arrowKeysActive.down) dirY += 1;
      if (arrowKeysActive.left) dirX -= 1;
      if (arrowKeysActive.right) dirX += 1;
      
      // Normalize direction
      const length = Math.sqrt(dirX * dirX + dirY * dirY);
      if (length > 0) {
        dirX /= length;
        dirY /= length;
      }
      
      // Set player target relative to current position
      const moveDistance = 200; // Adjust this value for sensitivity
      player.targetX = player.x + dirX * moveDistance;
      player.targetY = player.y + dirY * moveDistance;
    }
  }
  
  // Add WASD support
  let wasdKeysActive = {
    w: false,
    a: false,
    s: false,
    d: false
  };
  
  document.addEventListener

	  document.addEventListener('keydown', (e) => {
    if (game.isGameOver || game.isPaused) return;
    
    // Skip if the key is 'w' and it's used for ejecting mass
    if (e.key.toLowerCase() === 'w') return;
    
    switch (e.key.toLowerCase()) {
      case 'a':
        wasdKeysActive.a = true;
        break;
      case 's':
        wasdKeysActive.s = true;
        break;
      case 'd':
        wasdKeysActive.d = true;
        break;
    }
    
    updatePlayerTargetFromWASD();
  });
  
  document.addEventListener('keyup', (e) => {
    switch (e.key.toLowerCase()) {
      case 'w':
        wasdKeysActive.w = false;
        break;
      case 'a':
        wasdKeysActive.a = false;
        break;
      case 's':
        wasdKeysActive.s = false;
        break;
      case 'd':
        wasdKeysActive.d = false;
        break;
    }
    
    updatePlayerTargetFromWASD();
  });
  
  function updatePlayerTargetFromWASD() {
    // Only update if at least one WASD key is active (except W for ejection)
    if (wasdKeysActive.a || wasdKeysActive.s || wasdKeysActive.d) {
      let dirX = 0;
      let dirY = 0;
      
      if (wasdKeysActive.w) dirY -= 1;
      if (wasdKeysActive.s) dirY += 1;
      if (wasdKeysActive.a) dirX -= 1;
      if (wasdKeysActive.d) dirX += 1;
      
      // Normalize direction
      const length = Math.sqrt(dirX * dirX + dirY * dirY);
      if (length > 0) {
        dirX /= length;
        dirY /= length;
      }
      
      // Set player target relative to current position
      const moveDistance = 200; // Adjust this value for sensitivity
      player.targetX = player.x + dirX * moveDistance;
      player.targetY = player.y + dirY * moveDistance;
    }
  }
}
