export class SoundManager {
  constructor() {
    this.sounds = {};
    this.musicPlaying = false;
    this.soundEnabled = true;
    this.musicEnabled = true;
    this.volume = 0.5;
    this.musicVolume = 0.3;
    
    // Initialize sounds
    this.initSounds();
  }
  
  initSounds() {
    // Create audio context
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = this.volume;
      this.gainNode.connect(this.audioContext.destination);
      
      this.musicGainNode = this.audioContext.createGain();
      this.musicGainNode.gain.value = this.musicVolume;
      this.musicGainNode.connect(this.audioContext.destination);
    } catch (e) {
      console.warn('Web Audio API not supported in this browser');
      return;
    }
    
    // Define sounds
    this.registerSound('eatFood', this.createEatFoodSound.bind(this));
    this.registerSound('eatPlayer', this.createEatPlayerSound.bind(this));
    this.registerSound('playerEaten', this.createPlayerEatenSound.bind(this));
    this.registerSound('split', this.createSplitSound.bind(this));
    this.registerSound('merge', this.createMergeSound.bind(this));
    this.registerSound('eject', this.createEjectSound.bind(this));
    this.registerSound('virusSplit', this.createVirusSplitSound.bind(this));
    this.registerSound('powerUp', this.createPowerUpSound.bind(this));
    this.registerSound('levelUp', this.createLevelUpSound.bind(this));
    this.registerSound('damage', this.createDamageSound.bind(this));
    this.registerSound('gameOver', this.createGameOverSound.bind(this));
    this.registerSound('battleRoyaleStart', this.createBattleRoyaleStartSound.bind(this));
  }
  
  registerSound(name, createFunction) {
    this.sounds[name] = createFunction;
  }
  
  playSound(name) {
    if (!this.soundEnabled || !this.audioContext || !this.sounds[name]) return;
    
    try {
      // Resume audio context if it's suspended (browser autoplay policy)
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      
      // Create and play the sound
      const soundSource = this.sounds[name]();
      if (soundSource) {
        soundSource.connect(this.gainNode);
        soundSource.start(0);
      }
    } catch (e) {
      console.warn(`Error playing sound ${name}:`, e);
    }
  }
  
  playBackgroundMusic() {
    if (!this.musicEnabled || !this.audioContext || this.musicPlaying) return;
    
    try {
      // Resume audio context if it's suspended
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      
      // Create oscillators for a simple ambient background
      this.createBackgroundMusic();
      this.musicPlaying = true;
    } catch (e) {
      console.warn('Error playing background music:', e);
    }
  }
  
  stopBackgroundMusic() {
    if (!this.musicPlaying || !this.backgroundOscillators) return;
    
    try {
      // Stop all oscillators
      this.backgroundOscillators.forEach(osc => {
        osc.stop();
        osc.disconnect();
      });
      
      this.musicPlaying = false;
    } catch (e) {
      console.warn('Error stopping background music:', e);
    }
  }
  
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.gainNode) {
      this.gainNode.gain.value = this.volume;
    }
  }
  
  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.musicGainNode) {
      this.musicGainNode.gain.value = this.musicVolume;
    }
  }
  
  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    return this.soundEnabled;
  }
  
  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    
    if (this.musicEnabled) {
      this.playBackgroundMusic();
    } else {
      this.stopBackgroundMusic();
    }
    
    return this.musicEnabled;
  }
  
  // Sound creation methods
  createEatFoodSound() {
    const oscillator = this.audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1200, this.audioContext.currentTime + 0.1);
    
    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
    
    oscillator.connect(gainNode);
    gainNode.connect(this.gainNode);
    
    oscillator.onended = () => {
      oscillator.disconnect();
      gainNode.disconnect();
    };
    
    oscillator.stop(this.audioContext.currentTime + 0.1);
    return oscillator;
  }
  
  createEatPlayerSound() {
    const oscillator = this.audioContext.createOscillator();
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.2);
    
    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
    
    oscillator.connect(gainNode);
    gainNode.connect(this.gainNode);
    
    oscillator.onended = () => {
      oscillator.disconnect();
      gainNode.disconnect();
    };
    
    oscillator.stop(this.audioContext.currentTime + 0.3);
    return oscillator;
  }
  
  createPlayerEatenSound() {
    const oscillator = this.audioContext.createOscillator();
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.3);
    
    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
    
    oscillator.connect(gainNode);
    gainNode.connect(this.gainNode);
    
    oscillator.onended = () => {
      oscillator.disconnect();
      gainNode.disconnect();
    };
    
    oscillator.stop(this.audioContext.currentTime + 0.4);
    return oscillator;
  }
  
  createSplitSound() {
    const oscillator = this.audioContext.createOscillator();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(500, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.1);
    
    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
    
    oscillator.connect(gainNode);
    gainNode.connect(this.gainNode);
    
    oscillator.onended = () => {
      oscillator.disconnect();
      gainNode.disconnect();
    };
    
    oscillator.stop(this.audioContext.currentTime + 0.2);
    return oscillator;
  }
  
  createMergeSound() {
    const oscillator = this.audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(300, this.audioContext.currentTime + 0.2);
    
    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
    
    oscillator.connect(gainNode);
    gainNode.connect(this.gainNode);
    
    oscillator.onended = () => {
      oscillator.disconnect();
      gainNode.disconnect();
    };
    
    oscillator.stop(this.audioContext.currentTime + 0.3);
    return oscillator;
  }
  
  createEjectSound() {
    const oscillator = this.audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.1);
    
    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
    
    oscillator.connect(gainNode);
    gainNode.connect(this.gainNode);
    
    oscillator.onended = () => {
      oscillator.disconnect();
      gainNode.disconnect();
    };
    
    oscillator.stop(this.audioContext.currentTime + 0.1);
    return oscillator;
  }
  
  createVirusSplitSound() {
    const oscillator = this.audioContext.createOscillator();
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.1);
    oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.3);
    
    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
    
    oscillator.connect(gainNode);
    gainNode.connect(this.gainNode);
    
    oscillator.onended = () => {
      oscillator.disconnect();
      gainNode.disconnect();
    };
    
    oscillator.stop(this.audioContext.currentTime + 0.4);
    return oscillator;
  }
  
  createPowerUpSound() {
    const oscillator1 = this.audioContext.createOscillator();
    oscillator1.type = 'sine';
    oscillator1.frequency.setValueAtTime(400, this.audioContext.currentTime);
    oscillator1.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.1);
    
    const oscillator2 = this.audioContext.createOscillator();
    oscillator2.type = 'sine';
    oscillator2.frequency.setValueAtTime(600, this.audioContext.currentTime + 0.1);
    oscillator2.frequency.exponentialRampToValueAtTime(1200, this.audioContext.currentTime + 0.2);
    
    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
    
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(this.gainNode);
    
    oscillator1.onended = () => {
      oscillator1.disconnect();
    };
    
    oscillator2.onended = () => {
      oscillator2.disconnect();
      gainNode.disconnect();
    };
    
    oscillator1.stop(this.audioContext.currentTime + 0.1);
    oscillator2.stop(this.audioContext.currentTime + 0.3);
    return oscillator1;
  }
  
  createLevelUpSound() {
    const oscillator1 = this.audioContext.createOscillator();
    oscillator1.type = 'sine';
    oscillator1.frequency.setValueAtTime(400, this.audioContext.currentTime);
    oscillator1.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.1);
    
    const oscillator2 = this.audioContext.createOscillator();
    oscillator2.type = 'sine';
    oscillator2.frequency.setValueAtTime(600, this.audioContext.currentTime + 0.1);
    oscillator2.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.2);
    
    const oscillator3 = this.audioContext.createOscillator();
    oscillator3.type = 'sine';
    oscillator3.frequency.setValueAtTime(800, this.audioContext.currentTime + 0.2);
    oscillator3.frequency.exponentialRampToValueAtTime(1000, this.audioContext.currentTime + 0.3);
    
    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
    
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    oscillator3.connect(gainNode);
    gainNode.connect(this.gainNode);
    
    oscillator1.onended = () => {
      oscillator1.disconnect();
    };
    
    oscillator2.onended = () => {
      oscillator2.disconnect();
    };
    
    oscillator3.onended = () => {
      oscillator3.disconnect();
      gainNode.disconnect();
    };
    
    oscillator1.stop(this.audioContext.currentTime + 0.1);
    oscillator2.stop(this.audioContext.currentTime + 0.2);
    oscillator3.stop(this.audioContext.currentTime + 0.4);
    return oscillator1;
  }
  
  createDamageSound() {
    const oscillator = this.audioContext.createOscillator();
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.2);
    
    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
    
    oscillator.connect(gainNode);
    gainNode.connect(this.gainNode);
    
    oscillator.onended = () => {
      oscillator.disconnect();
      gainNode.disconnect();
    };
    
    oscillator.stop(this.audioContext.currentTime + 0.2);
    return oscillator;
  }
  
  createGameOverSound() {
    const oscillator1 = this.audioContext.createOscillator();
    oscillator1.type = 'sawtooth';
    oscillator1.frequency.setValueAtTime(300, this.audioContext.currentTime);
    oscillator1.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.2);
    
    const oscillator2 = this.audioContext.createOscillator();
    oscillator2.type = 'sawtooth';
    oscillator2.frequency.setValueAtTime(200, this.audioContext.currentTime + 0.2);
    oscillator2.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.4);
    
    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.6);
    
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(this.gainNode);
    
    oscillator1.onended = () => {
      oscillator1.disconnect();
    };
    
    oscillator2.onended = () => {
      oscillator2.disconnect();
      gainNode.disconnect();
    };
    
    oscillator1.stop(this.audioContext.currentTime + 0.2);
    oscillator2.stop(this.audioContext.currentTime + 0.6);
    return oscillator1;
  }
  
  createBattleRoyaleStartSound() {
    const oscillator1 = this.audioContext.createOscillator();
    oscillator1.type = 'square';
    oscillator1.frequency.setValueAtTime(200, this.audioContext.currentTime);
    oscillator1.frequency.exponentialRampToValueAtTime(300, this.audioContext.currentTime + 0.3);
    
    const oscillator2 = this.audioContext.createOscillator();
    oscillator2.type = 'square';
    oscillator2.frequency.setValueAtTime(300, this.audioContext.currentTime + 0.3);
    oscillator2.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.6);
    
    const oscillator3 = this.audioContext.createOscillator();
    oscillator3.type = 'square';
    oscillator3.frequency.setValueAtTime(400, this.audioContext.currentTime + 0.6);
    oscillator3.frequency.exponentialRampToValueAtTime(500, this.audioContext.currentTime + 0.9);
    
    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(0.4, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1);
    
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    oscillator3.connect(gainNode);
    gainNode.connect(this.gainNode);
    
    oscillator1.onended = () => {
      oscillator1.disconnect();
    };
    
    oscillator2.onended = () => {
      oscillator2.disconnect();
    };
    
    oscillator3.onended = () => {
      oscillator3.disconnect();
      gainNode.disconnect();
    };
    
    oscillator1.stop(this.audioContext.currentTime + 0.3);
    oscillator2.stop(this.audioContext.currentTime + 0.6);
    oscillator3.stop(this.audioContext.currentTime + 1);
    return oscillator1;
  }
  
  createBackgroundMusic() {
    // Create several oscillators for ambient background
    this.backgroundOscillators = [];
    
    // Base drone
    const baseOsc = this.audioContext.createOscillator();
    baseOsc.type = 'sine';
    baseOsc.frequency.value = 60; // Low C
    
    const baseGain = this.audioContext.createGain();
    baseGain.gain.value = 0.1;
    baseOsc.connect(baseGain);
    baseGain.connect(this.musicGainNode);
    
    baseOsc.start();
    this.backgroundOscillators.push(baseOsc);
    
    // Harmony oscillators
    const notes = [67, 72, 76, 79]; // C major chord
    
    notes.forEach((note, index) => {
      setTimeout(() => {
        if (!this.musicPlaying) return;
        
        const osc = this.audioContext.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = this.midiToFreq(note);
        
        const gain = this.audioContext.createGain();
        gain.gain.value = 0;
        gain.gain.setTargetAtTime(0.05, this.audioContext.currentTime, 2);
        
        // Add LFO for subtle movement
        const lfo = this.audioContext.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.1 + Math.random() * 0.1; // Slow modulation
        
        const lfoGain = this.audioContext.createGain();
        lfoGain.gain.value = 0.5;
        
        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);
        
        osc.connect(gain);
        gain.connect(this.musicGainNode);
        
        lfo.start();
        osc.start();
        
        this.backgroundOscillators.push(osc);
        this.backgroundOscillators.push(lfo);
      }, index * 2000); // Stagger the entries
    });
  }
  
  midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }
}
