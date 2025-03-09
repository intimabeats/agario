export class Leaderboard {
  constructor() {
    this.leaderboardData = [];
    this.maxEntries = 100;
    this.localStorageKey = 'cytosisLeaderboard';
    this.serverUrl = null; // Set this if you have a server for global leaderboard
    this.isLoading = false;
    this.lastUpdateTime = 0;
    this.updateInterval = 60000; // 1 minute
    
    // Initialize
    this.init();
  }
  
  init() {
    // Load leaderboard data from local storage
    this.loadLeaderboard();
    
    // Set up periodic updates if using server
    if (this.serverUrl) {
      this.setupPeriodicUpdates();
    }
  }
  
  setupPeriodicUpdates() {
    // Check for updates periodically
    setInterval(() => {
      this.fetchLeaderboard();
    }, this.updateInterval);
  }
  
  loadLeaderboard() {
    try {
      const storedData = localStorage.getItem(this.localStorageKey);
      if (storedData) {
        this.leaderboardData = JSON.parse(storedData);
      }
    } catch (e) {
      console.warn('Could not load leaderboard from localStorage:', e);
      this.leaderboardData = [];
    }
    
    // If using server, fetch the latest data
    if (this.serverUrl) {
      this.fetchLeaderboard();
    }
  }
  
  saveLeaderboard() {
    try {
      localStorage.setItem(this.localStorageKey, JSON.stringify(this.leaderboardData));
    } catch (e) {
      console.warn('Could not save leaderboard to localStorage:', e);
    }
  }
  
  async fetchLeaderboard() {
    if (!this.serverUrl || this.isLoading) return;
    
    const now = Date.now();
    if (now - this.lastUpdateTime < this.updateInterval) return;
    
    this.isLoading = true;
    this.lastUpdateTime = now;
    
    try {
      const response = await fetch(`${this.serverUrl}/leaderboard`);
      if (response.ok) {
        const data = await response.json();
        this.leaderboardData = data;
        this.saveLeaderboard();
      }
    } catch (e) {
      console.warn('Could not fetch leaderboard from server:', e);
    } finally {
      this.isLoading = false;
    }
  }
  
  async submitScore(playerName, score) {
    // Validate inputs
    if (!playerName || typeof score !== 'number' || score <= 0) {
      return false;
    }
    
    // Create entry
    const entry = {
      name: playerName.substring(0, 15), // Limit name length
      score: Math.floor(score),
      date: new Date().toISOString()
    };
    
    // Add to local leaderboard
    this.addToLocalLeaderboard(entry);
    
    // Submit to server if available
    if (this.serverUrl) {
      await this.submitToServer(entry);
    }
    
    return true;
  }
  
  addToLocalLeaderboard(entry) {
    // Check if player already has a higher score
    const existingIndex = this.leaderboardData.findIndex(e => e.name === entry.name);
    
    if (existingIndex !== -1) {
      // Only update if new score is higher
      if (entry.score > this.leaderboardData[existingIndex].score) {
        this.leaderboardData[existingIndex] = entry;
      } else {
        return; // Don't add if existing score is higher
      }
    } else {
      // Add new entry
      this.leaderboardData.push(entry);
    }
    
    // Sort by score (descending)
    this.leaderboardData.sort((a, b) => b.score - a.score);
    
    // Limit to max entries
    if (this.leaderboardData.length > this.maxEntries) {
      this.leaderboardData = this.leaderboardData.slice(0, this.maxEntries);
    }
    
    // Save to local storage
    this.saveLeaderboard();
  }
  
  async submitToServer(entry) {
    if (!this.serverUrl) return;
    
    try {
      const response = await fetch(`${this.serverUrl}/leaderboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(entry)
      });
      
      if (response.ok) {
        // Refresh leaderboard after submission
        this.fetchLeaderboard();
        return true;
      }
    } catch (e) {
      console.warn('Could not submit score to server:', e);
    }
    
    return false;
  }
  
  getLeaderboard(limit = 10) {
    // Return top N entries
    return this.leaderboardData.slice(0, limit);
  }
  
  getPlayerRank(playerName) {
    const index = this.leaderboardData.findIndex(entry => entry.name === playerName);
    return index !== -1 ? index + 1 : null;
  }
  
  getTopScores(limit = 10) {
    return this.getLeaderboard(limit);
  }
  
  getPlayerBestScore(playerName) {
    const entry = this.leaderboardData.find(entry => entry.name === playerName);
    return entry ? entry.score : 0;
  }
  
  clearLeaderboard() {
    this.leaderboardData = [];
    this.saveLeaderboard();
  }
  
  // Render leaderboard to a DOM element
  renderLeaderboard(containerId, limit = 10) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Clear container
    container.innerHTML = '';
    
    // Get top scores
    const topScores = this.getTopScores(limit);
    
    if (topScores.length === 0) {
      container.innerHTML = '<p class="no-scores">No scores yet. Be the first to play!</p>';
      return;
    }
    
    // Create leaderboard table
    const table = document.createElement('table');
    table.className = 'leaderboard-table';
    
    // Create header
    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th>Rank</th>
        <th>Player</th>
        <th>Score</th>
        <th>Date</th>
      </tr>
    `;
    table.appendChild(thead);
    
    // Create body
    const tbody = document.createElement('tbody');
    
    topScores.forEach((entry, index) => {
      const row = document.createElement('tr');
      
      // Add medal for top 3
      let rankDisplay = `${index + 1}`;
      if (index === 0) rankDisplay = '🥇';
      else if (index === 1) rankDisplay = '🥈';
      else if (index === 2) rankDisplay = '🥉';
      
      // Format date
      const date = new Date(entry.date);
      const formattedDate = `${date.toLocaleDateString()}`;
      
      row.innerHTML = `
        <td>${rankDisplay}</td>
        <td>${entry.name}</td>
        <td>${entry.score.toLocaleString()}</td>
        <td>${formattedDate}</td>
      `;
      
      tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    container.appendChild(table);
  }
  
  // Create a popup to display the leaderboard
  showLeaderboardPopup() {
    // Create popup container
    const popup = document.createElement('div');
    popup.className = 'leaderboard-popup';
    
    // Create popup content
    popup.innerHTML = `
      <div class="leaderboard-popup-content">
        <h2>Leaderboard</h2>
        <div id="leaderboard-popup-data"></div>
        <button class="close-button">Close</button>
      </div>
    `;
    
    // Style the popup
    Object.assign(popup.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '1000'
    });
    
    // Style the content
    const content = popup.querySelector('.leaderboard-popup-content');
    Object.assign(content.style, {
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      padding: '30px',
      borderRadius: '12px',
      maxWidth: '600px',
      width: '90%',
      maxHeight: '80vh',
      overflowY: 'auto',
      border: '1px solid rgba(66, 153, 225, 0.3)',
      color: 'white'
    });
    
    // Style the button
    const closeButton = popup.querySelector('.close-button');
    Object.assign(closeButton.style, {
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
    closeButton.addEventListener('click', () => {
      document.body.removeChild(popup);
    });
    
    // Add to document
    document.body.appendChild(popup);
    
    // Render leaderboard
    this.renderLeaderboard('leaderboard-popup-data', 20);
  }
  
  // Get weekly leaderboard
  getWeeklyLeaderboard(limit = 10) {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Filter entries from the last week
    const weeklyEntries = this.leaderboardData.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= oneWeekAgo;
    });
    
    // Sort by score
    weeklyEntries.sort((a, b) => b.score - a.score);
    
    // Return top entries
    return weeklyEntries.slice(0, limit);
  }
  
  // Get daily leaderboard
  getDailyLeaderboard(limit = 10) {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Filter entries from the last day
    const dailyEntries = this.leaderboardData.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= oneDayAgo;
    });
    
    // Sort by score
    dailyEntries.sort((a, b) => b.score - a.score);
    
    // Return top entries
    return dailyEntries.slice(0, limit);
  }
  
  // Export leaderboard data
  exportLeaderboard() {
    const dataStr = JSON.stringify(this.leaderboardData);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'cytosis-leaderboard.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }
  
  // Import leaderboard data
  importLeaderboard(jsonData) {
    try {
      const data = JSON.parse(jsonData);
      
      if (Array.isArray(data)) {
        this.leaderboardData = data;
        this.saveLeaderboard();
        return true;
      }
    } catch (e) {
      console.error('Error importing leaderboard data:', e);
    }
    
    return false;
  }
}
