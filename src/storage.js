export class Storage {
  constructor() {
    this.storageAvailable = this.checkStorageAvailability();
    this.prefix = 'cytosis_';
    this.keys = {
      settings: this.prefix + 'settings',
      gameStats: this.prefix + 'gameStats',
      playerStats: this.prefix + 'playerStats',
      unlockedSkins: this.prefix + 'unlockedSkins',
      unlockedAchievements: this.prefix + 'unlockedAchievements',
      tutorialSeen: this.prefix + 'tutorialSeen',
      firstTime: this.prefix + 'firstTime'
    };
    
    // Initialize first-time flag if not set
    if (this.storageAvailable && localStorage.getItem(this.keys.firstTime) === null) {
      localStorage.setItem(this.keys.firstTime, 'true');
    }
  }
  
  checkStorageAvailability() {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      console.warn('Local storage is not available:', e);
      return false;
    }
  }
  
  // Settings
  saveSettings(settings) {
    if (!this.storageAvailable) return false;
    
    try {
      localStorage.setItem(this.keys.settings, JSON.stringify(settings));
      return true;
    } catch (e) {
      console.warn('Could not save settings to localStorage:', e);
      return false;
    }
  }
  
  getSettings() {
    if (!this.storageAvailable) return null;
    
    try {
      const settings = localStorage.getItem(this.keys.settings);
      return settings ? JSON.parse(settings) : null;
    } catch (e) {
      console.warn('Could not load settings from localStorage:', e);
      return null;
    }
  }
  
  // Game Stats (individual game results)
  saveGameStats(stats) {
    if (!this.storageAvailable) return false;
    
    try {
      // Get existing stats
      let gameStats = this.getGameStats() || [];
      
      // Add new stats
      gameStats.push(stats);
      
      // Limit to last 50 games
      if (gameStats.length > 50) {
        gameStats = gameStats.slice(-50);
      }
      
      // Save
      localStorage.setItem(this.keys.gameStats, JSON.stringify(gameStats));
      
      // Update aggregate player stats
      this.updatePlayerStats(stats);
      
      return true;
    } catch (e) {
      console.warn('Could not save game stats to localStorage:', e);
      return false;
    }
  }
  
  getGameStats() {
    if (!this.storageAvailable) return null;
    
    try {
      const gameStats = localStorage.getItem(this.keys.gameStats);
      return gameStats ? JSON.parse(gameStats) : [];
    } catch (e) {
      console.warn('Could not load game stats from localStorage:', e);
      return [];
    }
  }
  
  // Player Stats (aggregate stats across all games)
  updatePlayerStats(gameStats) {
    if (!this.storageAvailable || !gameStats) return false;
    
    try {
      // Get existing player stats
      let playerStats = this.getPlayerStats() || {
        gamesPlayed: 0,
        totalScore: 0,
        highScore: 0,
        totalPlayTime: 0,
        totalFoodEaten: 0,
        totalPlayersEaten: 0,
        highestLevel: 1,
        lastPlayed: null
      };
      
      // Update stats
      playerStats.gamesPlayed++;
      playerStats.totalScore += gameStats.score || 0;
      playerStats.highScore = Math.max(playerStats.highScore, gameStats.score || 0);
      playerStats.totalPlayTime += gameStats.playTime || 0;
      playerStats.totalFoodEaten += gameStats.foodEaten || 0;
      playerStats.totalPlayersEaten += gameStats.playersEaten || 0;
      playerStats.highestLevel = Math.max(playerStats.highestLevel, gameStats.level || 1);
      playerStats.lastPlayed = new Date().toISOString();
      
      // Save
      localStorage.setItem(this.keys.playerStats, JSON.stringify(playerStats));
      
      return true;
    } catch (e) {
      console.warn('Could not update player stats in localStorage:', e);
      return false;
    }
  }
  
  getPlayerStats() {
    if (!this.storageAvailable) return null;
    
    try {
      const playerStats = localStorage.getItem(this.keys.playerStats);
      return playerStats ? JSON.parse(playerStats) : null;
    } catch (e) {
      console.warn('Could not load player stats from localStorage:', e);
      return null;
    }
  }
  
  // Unlocked Skins
  saveUnlockedSkins(skins) {
    if (!this.storageAvailable) return false;
    
    try {
      localStorage.setItem(this.keys.unlockedSkins, JSON.stringify(skins));
      return true;
    } catch (e) {
      console.warn('Could not save unlocked skins to localStorage:', e);
      return false;
    }
  }
  
  getUnlockedSkins() {
    if (!this.storageAvailable) return null;
    
    try {
      const skins = localStorage.getItem(this.keys.unlockedSkins);
      return skins ? JSON.parse(skins) : ['default', 'striped', 'spotted', 'star'];
    } catch (e) {
      console.warn('Could not load unlocked skins from localStorage:', e);
      return ['default', 'striped', 'spotted', 'star'];
    }
  }
  
  // Unlocked Achievements
  saveUnlockedAchievements(achievements) {
    if (!this.storageAvailable) return false;
    
    try {
      localStorage.setItem(this.keys.unlockedAchievements, JSON.stringify(achievements));
      return true;
    } catch (e) {
      console.warn('Could not save unlocked achievements to localStorage:', e);
      return false;
    }
  }
  
  getUnlockedAchievements() {
    if (!this.storageAvailable) return null;
    
    try {
      const achievements = localStorage.getItem(this.keys.unlockedAchievements);
      return achievements ? JSON.parse(achievements) : [];
    } catch (e) {
      console.warn('Could not load unlocked achievements from localStorage:', e);
      return [];
    }
  }
  
  // Tutorial
  setTutorialSeen(seen) {
    if (!this.storageAvailable) return false;
    
    try {
      localStorage.setItem(this.keys.tutorialSeen, seen ? 'true' : 'false');
      return true;
    } catch (e) {
      console.warn('Could not save tutorial status to localStorage:', e);
      return false;
    }
  }
  
  isTutorialSeen() {
    if (!this.storageAvailable) return false;
    
    try {
      return localStorage.getItem(this.keys.tutorialSeen) === 'true';
    } catch (e) {
      console.warn('Could not load tutorial status from localStorage:', e);
      return false;
    }
  }
  
  // First Time
  isFirstTime() {
    if (!this.storageAvailable) return true;
    
    try {
      const firstTime = localStorage.getItem(this.keys.firstTime);
      
      // If it's the first time, set the flag to false for next time
      if (firstTime === 'true') {
        localStorage.setItem(this.keys.firstTime, 'false');
        return true;
      }
      
      return false;
    } catch (e) {
      console.warn('Could not check first time status from localStorage:', e);
      return true;
    }
  }
  
  // Clear all data
  clearAllData() {
    if (!this.storageAvailable) return false;
    
    try {
      Object.values(this.keys).forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Reset first-time flag
      localStorage.setItem(this.keys.firstTime, 'true');
      
      return true;
    } catch (e) {
      console.warn('Could not clear data from localStorage:', e);
      return false;
    }
  }
  
  // Export all data
  exportData() {
    if (!this.storageAvailable) return null;
    
    try {
      const data = {};
      
      Object.entries(this.keys).forEach(([key, storageKey]) => {
        const value = localStorage.getItem(storageKey);
        if (value) {
          data[key] = value;
        }
      });
      
      return JSON.stringify(data);
    } catch (e) {
      console.warn('Could not export data from localStorage:', e);
      return null;
    }
  }
  
  // Import data
  importData(jsonData) {
    if (!this.storageAvailable) return false;
    
    try {
      const data = JSON.parse(jsonData);
      
      Object.entries(data).forEach(([key, value]) => {
        const storageKey = this.keys[key];
        if (storageKey) {
          localStorage.setItem(storageKey, value);
        }
      });
      
      return true;
    } catch (e) {
      console.warn('Could not import data to localStorage:', e);
      return false;
    }
  }
  
  // Get storage usage info
  getStorageUsage() {
    if (!this.storageAvailable) return null;
    
    try {
      let totalSize = 0;
      let itemCount = 0;
      
      Object.values(this.keys).forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += value.length * 2; // Approximate size in bytes (UTF-16 encoding)
          itemCount++;
        }
      });
      
      return {
        totalSize,
        totalSizeKB: Math.round(totalSize / 1024 * 100) / 100,
        itemCount
      };
    } catch (e) {
      console.warn('Could not calculate storage usage:', e);
      return null;
    }
  }
  
  // Check if a specific key exists
  hasKey(key) {
    if (!this.storageAvailable) return false;
    
    try {
      return localStorage.getItem(this.keys[key]) !== null;
    } catch (e) {
      console.warn(`Could not check if key ${key} exists in localStorage:`, e);
      return false;
    }
  }
  
  // Get all game history
  getGameHistory() {
    return this.getGameStats();
  }
  
  // Get best game
  getBestGame() {
    const gameStats = this.getGameStats();
    if (!gameStats || gameStats.length === 0) return null;
    
    // Sort by score (descending)
    gameStats.sort((a, b) => b.score - a.score);
    
    return gameStats[0];
  }
  
  // Get recent games
  getRecentGames(limit = 5) {
    const gameStats = this.getGameStats();
    if (!gameStats || gameStats.length === 0) return [];
    
    // Sort by date (descending)
    gameStats.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return gameStats.slice(0, limit);
  }
  
  // Save custom settings
  saveCustomSetting(key, value) {
    if (!this.storageAvailable) return false;
    
    try {
      const customKey = this.prefix + 'custom_' + key;
      localStorage.setItem(customKey, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn(`Could not save custom setting ${key} to localStorage:`, e);
      return false;
    }
  }
  
  // Get custom setting
  getCustomSetting(key) {
    if (!this.storageAvailable) return null;
    
    try {
      const customKey = this.prefix + 'custom_' + key;
      const value = localStorage.getItem(customKey);
      return value ? JSON.parse(value) : null;
    } catch (e) {
      console.warn(`Could not load custom setting ${key} from localStorage:`, e);
      return null;
    }
  }
}
