// Game State
const state = {
  cash: 0,
  revenuePerClick: 1,
  revenuePerSecond: 0,
  upgrades: [
    { id: 'freelance', name: 'Freelance Gigs', cost: 15, revenue: 1, count: 0 },
    { id: 'tutoring', name: 'Online Tutoring', cost: 100, revenue: 5, count: 0 },
    { id: 'dropshipping', name: 'Dropshipping Store', cost: 500, revenue: 25, count: 0 },
    { id: 'app', name: 'Mobile App', cost: 2000, revenue: 100, count: 0 },
    { id: 'saas', name: 'SaaS Platform', cost: 10000, revenue: 500, count: 0 },
    { id: 'agency', name: 'Digital Agency', cost: 50000, revenue: 2500, count: 0 }
  ],
  prestigeLevel: 0,
  totalCashEarned: 0
};

// Load saved game
function loadGame() {
  const saved = localStorage.getItem('empireBuilderSave');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      state.cash = parsed.cash || 0;
      state.revenuePerClick = parsed.revenuePerClick || 1;
      state.revenuePerSecond = parsed.revenuePerSecond || 0;
      state.prestigeLevel = parsed.prestigeLevel || 0;
      
      if (parsed.upgrades) {
        state.upgrades.forEach((u, i) => {
          if (parsed.upgrades[i]) {
            u.count = parsed.upgrades[i].count;
            u.cost = Math.floor(parsed.upgrades[i].cost);
          }
        });
      }
      
      state.totalCashEarned = parsed.totalCashEarned || 0;
    } catch (e) {
      console.error('Save file corrupted, resetting');
    }
  }
}

function saveGame() {
  localStorage.setItem('empireBuilderSave', JSON.stringify({
    cash: state.cash,
    revenuePerClick: state.revenuePerClick,
    revenuePerSecond: state.revenuePerSecond,
    prestigeLevel: state.prestigeLevel,
    upgrades: state.upgrades.map(u => ({ id: u.id, count: u.count, cost: u.cost })),
    totalCashEarned: state.totalCashEarned
  }));
}

// Core Mechanics
function handleClick() {
  const baseClickValue = state.revenuePerClick;
  const prestigeMultiplier = 1 + (state.prestigeLevel * 0.5);
  const earnings = Math.floor(baseClickValue * prestigeMultiplier);
  
  state.cash += earnings;
  state.totalCashEarned += earnings;
  
  updateUI();
  createFloatingText(earnings);
  playSound('click');
}

function buyUpgrade(upgradeIndex) {
  const upgrade = state.upgrades[upgradeIndex];
  const prestigeMultiplier = 1 + (state.prestigeLevel * 0.5);
  const discountedCost = Math.floor(upgrade.cost / prestigeMultiplier);
  
  if (state.cash >= discountedCost) {
    state.cash -= discountedCost;
    upgrade.count++;
    
    // Calculate revenue multiplier from upgrades
    calculateRPS();
    
    // Increase cost by 15% each purchase
    upgrade.cost = Math.floor(upgrade.cost * 1.15);
    
    addLog(`Bought ${upgrade.name}! Revenue +${formatNumber(upgrade.revenue)}/sec`);
    saveGame();
    updateUI();
  }
}

function calculateRPS() {
  let rps = state.upgrades.reduce((total, u) => total + (u.revenue * u.count), 0);
  
  // Apply prestige multiplier to passive income
  const prestigeMultiplier = 1 + (state.prestigeLevel * 0.5);
  state.revenuePerSecond = Math.floor(rps * prestigeMultiplier);
}

function triggerPrestige() {
  if (!confirm('Reset all progress for permanent bonuses? You will lose upgrades and cash.')) return;
  
  const prestigeBonus = 1; // +50% per level
  const newLevel = state.prestigeLevel + prestigeBonus;
  
  addLog(`🌟 Prestige! Level ${state.prestigeLevel} → ${newLevel}`);
  
  state.prestigeLevel = newLevel;
  state.cash = 0;
  state.revenuePerClick = 1; // Reset to base
  state.totalCashEarned += state.cash; // Add current cash to total for prestige calc
  
  // Reset upgrades
  state.upgrades.forEach(u => {
    u.count = 0;
    u.cost = Math.floor(15 * Math.pow(1.15, parseInt(u.id.replace(/\D/g, '')) || 0));
  });
  
  calculateRPS();
  saveGame();
  updateUI();
}

// UI Updates
function formatNumber(num) {
  if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(1)}k`;
  return `$${Math.floor(num)}`;
}

function updateUI() {
  document.getElementById('cash-display').textContent = formatNumber(state.cash);
  document.getElementById('rps-display').textContent = `${formatNumber(state.revenuePerSecond)}/s`;
  
  if (state.prestigeLevel > 0) {
    document.getElementById('prestige-level').textContent = state.prestigeLevel;
    document.getElementById('prestige-display').classList.remove('hidden');
  }
  
  // Update upgrade buttons
  const prestigeMultiplier = 1 + (state.prestigeLevel * 0.5);
  
  state.upgrades.forEach((upgrade, index) => {
    const discountedCost = Math.floor(upgrade.cost / prestigeMultiplier);
    const btn = document.getElementById(`upgrade-${index}`);
    
    if (btn) {
      btn.innerHTML = `
        <div class="upgrade-header">
          <span class="upgrade-name">${upgrade.name}</span>
          <span class="upgrade-cost">${formatNumber(discountedCost)}</span>
        </div>
        <div class="upgrade-stats">+${formatNumber(upgrade.revenue)}/sec × ${upgrade.count}</div>
      `;
      
      if (state.cash >= discountedCost) {
        btn.classList.remove('disabled');
      } else {
        btn.classList.add('disabled');
      }
    }
  });
  
  // Show/hide prestige button
  const canPrestige = state.totalCashEarned >= 100000;
  const prestigeBtn = document.getElementById('prestige-btn');
  if (canPrestige) {
    prestigeBtn.classList.remove('hidden');
    prestigeBtn.innerHTML = `🌟 Reset for +${(state.prestigeLevel + 0.5 * 100)}% bonus`;
  }
}

function addLog(message) {
  const logContainer = document.getElementById('log-container');
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  
  logContainer.prepend(entry);
  
  // Keep only last 50 logs
  if (logContainer.children.length > 50) {
    logContainer.lastElementChild.remove();
  }
}

function createFloatingText(amount) {
  const float = document.createElement('div');
  float.textContent = `+$${amount}`;
  float.style.position = 'fixed';
  float.style.left = `${event.clientX}px`;
  float.style.top = `${event.clientY - 20}px`;
  float.style.color = '#fff';
  float.style.fontWeight = 'bold';
  float.style.fontSize = '1.5rem';
  float.style.pointerEvents = 'none';
  float.style.animation = 'floatUp 1s ease-out forwards';
  
  document.body.appendChild(float);
  
  setTimeout(() => float.remove(), 1000);
}

// Theme Switching
function switchTheme(theme) {
  document.body.className = `theme-${theme}`;
  
  // Update active button state
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });
}

// Sound effects (simple oscillator)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  if (type === 'click') {
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  }
}

// Game Loop
setInterval(() => {
  if (state.revenuePerSecond > 0) {
    state.cash += Math.floor(state.revenuePerSecond / 10); // Update every 100ms
    updateUI();
  }
}, 100);

// Auto-save every 30 seconds
setInterval(saveGame, 30000);

// Initialize
window.onload = () => {
  loadGame();
  calculateRPS();
  
  const upgradesContainer = document.getElementById('upgrades-container');
  
  state.upgrades.forEach((upgrade, index) => {
    const btn = document.createElement('button');
    btn.id = `upgrade-${index}`;
    btn.className = 'upgrade-card';
    btn.onclick = () => buyUpgrade(index);
    
    // Initial render
    btn.innerHTML = `
      <div class="upgrade-header">
        <span class="upgrade-name">${upgrade.name}</span>
        <span class="upgrade-cost">${formatNumber(upgrade.cost)}</span>
      </div>
      <div class="upgrade-stats">+${formatNumber(upgrade.revenue)}/sec × ${upgrade.count}</div>
    `;
    
    upgradesContainer.appendChild(btn);
  });
  
  updateUI();
};

// Auto-buy upgrades (optional feature)
window.buyAllUpgrades = function() {
  const prestigeMultiplier = 1 + (state.prestigeLevel * 0.5);
  let changed = false;
  
  state.upgrades.forEach((u, i) => {
    while (state.cash >= Math.floor(u.cost / prestigeMultiplier)) {
      state.cash -= Math.floor(u.cost / prestigeMultiplier);
      u.count++;
      calculateRPS();
      u.cost = Math.floor(u.cost * 1.15);
      changed = true;
    }
  });
  
  if (changed) {
    addLog('🛒 Auto-purchased all affordable upgrades!');
    updateUI();
  }
};
