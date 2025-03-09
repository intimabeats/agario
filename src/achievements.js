export class Achievements {
  constructor(game) {
    this.game = game;
    this.achievements = [];
    this.unlockedAchievements = [];
    this.notificationQueue = [];
    this.notificationActive = false;
    this.notificationDuration = 5000; // 5 seconds
    
    // Initialize achievements
    this.initAchievements();
    
    // Load unlocked achievements from storage
    this.loadUnlockedAchievements();
    
    // Set up notification container
    this.setupNotificationContainer();
  }
  
  initAchievements() {
    // Define all achievements
    this.achievements = [
      {
        id: 'first_steps',
        name: 'First Steps',
        description: 'Play your first game',
        icon: '🐣',
        secret: false,
        condition: 'Play a game',
        reward: null,
        unlocked: false
      },
      {
        id: 'growing_cell',
        name: 'Growing Cell',
        description: 'Reach a score of 1,000',
        icon: '🌱',
        secret: false,
        condition: 'Score 1,000 points',
        reward: null,
        unlocked: false
      },
      {
        id: 'big_cell',
        name: 'Big Cell',
        description: 'Reach a score of 10,000',
        icon: '🌿',
        secret: false,
        condition: 'Score 10,000 points',
        reward: null,
        unlocked: false
      },
      {
        id: 'giant_cell',
        name: 'Giant Cell',
        description: 'Reach a score of 50,000',
        icon: '🌳',
        secret: false,
        condition: 'Score 50,000 points',
        reward: 'Unlock "Glowing" skin',
        unlocked: false
      },
      {
        id: 'food_lover',
        name: 'Food Lover',
        description: 'Eat 100 food pellets in a single game',
        icon: '🍽️',
        secret: false,
        condition: 'Eat 100 food pellets',
        reward: null,
        unlocked: false
      },
      {
        id: 'food_addict',
        name: 'Food Addict',
        description: 'Eat 500 food pellets in a single game',
        icon: '🍴',
        secret: false,
        condition: 'Eat 500 food pellets',
        reward: 'Unlock "Hungry" skin',
        unlocked: false
      },
      {
        id: 'predator',
        name: 'Predator',
        description: 'Eat 10 other cells in a single game',
        icon: '🦈',
        secret: false,
        condition: 'Eat 10 other cells',
        reward: null,
        unlocked: false
      },
      {
        id: 'apex_predator',
        name: 'Apex Predator',
        description: 'Eat 50 other cells in a single game',
        icon: '🦁',
        secret: false,
        condition: 'Eat 50 other cells',
        reward: 'Unlock "Predator" skin',
        unlocked: false
      },
      {
        id: 'split_master',
        name: 'Split Master',
        description: 'Have 8 cells at once',
        icon: '✂️',
        secret: false,
        condition: 'Split into 8 cells',
        reward: null,
        unlocked: false
      },
      {
        id: 'mass_ejector',
        name: 'Mass Ejector',
        description: 'Eject mass 50 times in a single game',
        icon: '💨',
        secret: false,
        condition: 'Eject mass 50 times',
        reward: null,
        unlocked: false
      },
      {
        id: 'virus_popper',
        name: 'Virus Popper',
        description: 'Consume 5 viruses in a single game',
        icon: '🦠',
        secret: false,
        condition: 'Consume 5 viruses',
        reward: null,
        unlocked: false
      },
      {
        id: 'power_collector',
        name: 'Power Collector',
        description: 'Collect 10 power-ups in a single game',
        icon: '⚡',
        secret: false,
        condition: 'Collect 10 power-ups',
        reward: null,
        unlocked: false
      },
      {
        id: 'power_addict',
        name: 'Power Addict',
        description: 'Collect 25 power-ups in a single game',
        icon: '🔋',
        secret: false,
        condition: 'Collect 25 power-ups',
        reward: 'Unlock "Energized" skin',
        unlocked: false
      },
      {
        id: 'survivor',
        name: 'Survivor',
        description: 'Survive for 10 minutes in a single game',
        icon: '⏱️',
        secret: false,
        condition: 'Survive for 10 minutes',
        reward: null,
        unlocked: false
      },
      {
        id: 'marathon_cell',
        name: 'Marathon Cell',
        description: 'Survive for 30 minutes in a single game',
        icon: '⏳',
        secret: false,
        condition: 'Survive for 30 minutes',
        reward: 'Unlock "Veteran" skin',
        unlocked: false
      },
      {
        id: 'reach_level_5',
        name: 'Evolution Begins',
        description: 'Reach level 5',
        icon: '📈',
        secret: false,
        condition: 'Reach level 5',
        reward: null,
        unlocked: false
      },
      {
        id: 'reach_level_10',
        name: 'Evolved Cell',
        description: 'Reach level 10',
        icon: '📊',
        secret: false,
        condition: 'Reach level 10',
        reward: 'Unlock "Evolved" skin',
        unlocked: false
      },
      {
        id: 'kill_streak_3',
        name: 'Triple Kill',
        description: 'Eat 3 cells in quick succession',
        icon: '🔥',
        secret: false,
        condition: 'Eat 3 cells without dying',
        reward: null,
        unlocked: false
      },
      {
        id: 'kill_streak_5',
        name: 'Killing Spree',
        description: 'Eat 5 cells in quick succession',
        icon: '🔥🔥',
        secret: false,
        condition: 'Eat 5 cells without dying',
        reward: null,
        unlocked: false
      },
      {
        id: 'kill_streak_10',
        name: 'Unstoppable',
        description: 'Eat 10 cells in quick succession',
        icon: '🔥🔥🔥',
        secret: false,
        condition: 'Eat 10 cells without dying',
        reward: 'Unlock "Unstoppable" skin',
        unlocked: false
      },
      {
        id: 'team_victory',
        name: 'Team Player',
        description: 'Win a team mode game',
        icon: '🏆',
        secret: false,
        condition: 'Win in team mode',
        reward: null,
        unlocked: false
      },
      {
        id: 'battle_royale_win',
        name: 'Last Cell Standing',
        description: 'Win a battle royale game',
        icon: '👑',
        secret: false,
        condition: 'Win in battle royale mode',
        reward: 'Unlock "Champion" skin',
        unlocked: false
      },
      {
        id: 'top_leaderboard',
        name: 'Leaderboard Champion',
        description: 'Reach #1 on the leaderboard',
        icon: '🥇',
        secret: false,
        condition: 'Reach #1 position',
        reward: null,
        unlocked: false
      },
      {
        id: 'traveler',
        name: 'Traveler',
        description: 'Travel a total distance of 10,000 units',
        icon: '🧭',
        secret: false,
        condition: 'Travel 10,000 units',
        reward: null,
        unlocked: false
      },
      {
        id: 'explorer',
        name: 'Explorer',
        description: 'Travel a total distance of 50,000 units',
        icon: '🗺️',
        secret: false,
        condition: 'Travel 50,000 units',
        reward: 'Unlock "Explorer" skin',
        unlocked: false
      },
      {
        id: 'comeback_kid',
        name: 'Comeback Kid',
        description: 'Eat a cell that was previously bigger than you',
        icon: '🔄',
        secret: true,
        condition: 'Secret achievement',
        reward: null,
        unlocked: false
      },
      {
        id: 'close_call',
        name: 'Close Call',
        description: 'Escape from a cell that almost ate you',
        icon: '😅',
        secret: true,
        condition: 'Secret achievement',
        reward: null,
        unlocked: false
      },
      {
        id: 'dedicated_player',
        name: 'Dedicated Player',
        description: 'Play 50 games',
        icon: '🎮',
        secret: false,
        condition: 'Play 50 games',
        reward: 'Unlock "Dedicated" skin',
        unlocked: false
      }
    ];
  }
  
  loadUnlockedAchievements() {
    try {
      const savedAchievements = localStorage.getItem('unlockedAchievements');
      if (savedAchievements) {
        const unlockedIds = JSON.parse(savedAchievements);
        
        // Mark achievements as unlocked
        unlockedIds.forEach(id => {
          const achievement = this.achievements.find(a => a.id === id);
          if (achievement) {
            achievement.unlocked = true;
            this.unlockedAchievements.push(achievement);
          }
        });
      }
    } catch (e) {
      console.warn('Could not load achievements from localStorage:', e);
    }
  }
  
  saveUnlockedAchievements() {
    try {
      const unlockedIds = this.unlockedAchievements.map(a => a.id);
      localStorage.setItem('unlockedAchievements', JSON.stringify(unlockedIds));
    } catch (e) {
      console.warn('Could not save achievements to localStorage:', e);
    }
  }
  
  setupNotificationContainer() {
    // Check if container already exists
    let container = document.querySelector('.achievement-notification');
    if (!container) {
      container = document.createElement('div');
      container.className = 'achievement-notification';
      document.body.appendChild(container);
    }
  }
  
  showNotification(achievement) {
    // Add to queue
    this.notificationQueue.push(achievement);
    
    // Show if no active notification
    if (!this.notificationActive) {
      this.processNotificationQueue();
    }
  }
  
  processNotificationQueue() {
    if (this.notificationQueue.length === 0) {
      this.notificationActive = false;
      return;
    }
    
    this.notificationActive = true;
    const achievement = this.notificationQueue.shift();
    
    // Get container
    const container = document.querySelector('.achievement-notification');
    if (!container) return;
    
    // Set content
    container.innerHTML = `
      <div class="achievement-header">
        <div class="achievement-icon">${achievement.icon}</div>
        <div class="achievement-title">${achievement.name}</div>
      </div>
      <div class="achievement-description">${achievement.description}</div>
      ${achievement.reward ? `<div class="achievement-reward">${achievement.reward}</div>` : ''}
    `;
    
    // Show notification
    container.classList.add('show');
    
    // Play sound
    if (this.game.soundManager) {
      this.game.soundManager.playSound('achievement');
    }
    
    // Hide after duration
    setTimeout(() => {
      container.classList.remove('show');
      
      // Process next notification after transition
      setTimeout(() => {
        this.processNotificationQueue();
      }, 500);
    }, this.notificationDuration);
  }
  
  unlock(achievementId) {
    const achievement = this.achievements.find(a => a.id === achievementId);
    
    if (!achievement || achievement.unlocked) return false;
    
    // Mark as unlocked
    achievement.unlocked = true;
    this.unlockedAchievements.push(achievement);
    
    // Save to storage
    this.saveUnlockedAchievements();
    
    // Show notification
    this.showNotification(achievement);
    
    // Apply rewards
    this.applyReward(achievement);
    
    return true;
  }
  
  applyReward(achievement) {
    if (!achievement.reward) return;
    
    // Check if reward is a skin unlock
    if (achievement.reward.includes('Unlock') && achievement.reward.includes('skin')) {
      const skinName = achievement.reward.match(/\"([^\"]+)\"/)[1];
      if (skinName && this.game.skins) {
        this.game.skins.unlockSkin(skinName.toLowerCase());
      }
    }
  }
  
  initPlayer(player) {
    // Unlock first steps achievement
    this.unlock('first_steps');
    
    // Store reference to player
    this.player = player;
  }
  
  checkAchievements(player) {
    if (!player) return;
    
    // Score achievements
    if (player.score >= 1000) this.unlock('growing_cell');
    if (player.score >= 10000) this.unlock('big_cell');
    if (player.score >= 50000) this.unlock('giant_cell');
    
    // Food achievements
    if (player.stats.foodEaten >= 100) this.unlock('food_lover');
    if (player.stats.foodEaten >= 500) this.unlock('food_addict');
    
    // Predator achievements
    if (player.stats.playersEaten >= 10) this.unlock('predator');
    if (player.stats.playersEaten >= 50) this.unlock('apex_predator');
    
    // Split master achievement
    if (player.cells.length >= 8) this.unlock('split_master');
    
    // Mass ejector achievement
    if (player.stats.timesEjected >= 50) this.unlock('mass_ejector');
    
    // Virus popper achievement
    if (player.stats.virusesEaten >= 5) this.unlock('virus_popper');
    
    // Power-up achievements
    if (player.stats.powerUpsCollected >= 10) this.unlock('power_collector');
    if (player.stats.powerUpsCollected >= 25) this.unlock('power_addict');
    
    // Survivor achievements
    const minutesPlayed = player.stats.timePlayed / 60;
    if (minutesPlayed >= 10) this.unlock('survivor');
    if (minutesPlayed >= 30) this.unlock('marathon_cell');
    
    // Level achievements
    if (player.level >= 5) this.unlock('reach_level_5');
    if (player.level >= 10) this.unlock('reach_level_10');
    
    // Kill streak achievements are handled in player.js when kills happen
    
    // Traveler achievements
    if (player.stats.distanceTraveled >= 10000) this.unlock('traveler');
    if (player.stats.distanceTraveled >= 50000) this.unlock('explorer');
    
    // Leaderboard achievement
    const leaderboard = this.game.getLeaderboard();
    if (leaderboard && leaderboard.length > 0 && leaderboard[0].id === 'player') {
      this.unlock('top_leaderboard');
    }
  }
  
  getAchievements() {
    return this.achievements;
  }
  
  getUnlockedAchievements() {
    return this.unlockedAchievements;
  }
  
  getProgress() {
    return {
      total: this.achievements.length,
      unlocked: this.unlockedAchievements.length,
      percentage: Math.floor((this.unlockedAchievements.length / this.achievements.length) * 100)
    };
  }
}
