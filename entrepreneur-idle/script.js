// Empire Builder - Side Hustle Grind
// Version: 3.0.1 (Chewy Theme Added - Optional)
const SAVE_KEY = 'empireBuilderSave';
const THEME_KEY = 'empireBuilderTheme';
const MAX_OFFLINE_SECONDS = 60 * 60 * 24 * 7; // Cap offline gains at 7 days.

const BASE_EQUIPMENT_UPGRADES = [
  { id: 'basic_laptop', name: 'Basic Laptop', cost: 25, clickBonus: 2, count: 0 },
  { id: 'power_bank', name: 'Power Bank', cost: 150, clickBonus: 5, count: 0 },
  { id: 'crm_software', name: 'CRM Software', cost: 750, clickBonus: 12, count: 0 },
  { id: 'virtual_assistant', name: 'VA Assistant', cost: 3000, clickBonus: 30, count: 0 },
  { id: 'automation_tool', name: 'Auto-Tool Suite', cost: 15000, clickBonus: 80, count: 0 },
  { id: 'ai_co_founder', name: 'AI Co-Founder', cost: 75000, clickBonus: 250, count: 0 }
];

const BASE_UPGRADES = [
  { id: 'freelance', name: 'Freelance Gigs', cost: 75, revenue: 1, count: 0 },
  { id: 'tutoring', name: 'Online Tutoring', cost: 300, revenue: 6, count: 0 },
  { id: 'dropshipping', name: 'Dropshipping Store', cost: 1500, revenue: 28, count: 0 },
  { id: 'app', name: 'Mobile App', cost: 6000, revenue: 130, count: 0 },
  { id: 'saas', name: 'SaaS Platform', cost: 30000, revenue: 750, count: 0 },
  { id: 'agency', name: 'Digital Agency', cost: 120000, revenue: 3200, count: 0 }
];

function cloneBaseItems(items) {
  return items.map(item => ({ ...item }));
}

// Game State
const state = {
  cash: 0,
  revenuePerClick: 1,
  revenuePerSecond: 0,
  equipmentUpgrades: cloneBaseItems(BASE_EQUIPMENT_UPGRADES),
  upgrades: cloneBaseItems(BASE_UPGRADES),
  prestigeLevel: 0,
  totalBusinessesOwned: 0,
  totalCashEarned: 0,
  lastSavedAt: Date.now()
};

// Load saved game
function loadGame() {
  const saved = localStorage.getItem(SAVE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      state.cash = parsed.cash || 0;
      state.prestigeLevel = parsed.prestigeLevel || 0;
      state.totalBusinessesOwned = parsed.totalBusinessesOwned || 0;
      
      if (parsed.equipmentUpgrades) {
        parsed.equipmentUpgrades.forEach((u, i) => {
          if (state.equipmentUpgrades[i]) {
            state.equipmentUpgrades[i].count = Number(u.count) || 0;
            state.equipmentUpgrades[i].cost = Number.isFinite(u.cost)
              ? Math.floor(u.cost)
              : calculateScaledCost(BASE_EQUIPMENT_UPGRADES[i].cost, state.equipmentUpgrades[i].count, 1.2);
          }
        });
      }
      
      if (parsed.upgrades) {
        state.upgrades.forEach((u, i) => {
          if (parsed.upgrades[i]) {
            u.count = Number(parsed.upgrades[i].count) || 0;
            u.cost = Number.isFinite(parsed.upgrades[i].cost)
              ? Math.floor(parsed.upgrades[i].cost)
              : calculateScaledCost(BASE_UPGRADES[i].cost, u.count, 1.15);
          }
        });
      }
      
      state.totalCashEarned = parsed.totalCashEarned || 0;
      state.lastSavedAt = parsed.lastSavedAt || Date.now();
    } catch (e) {
      console.error('Save file corrupted, resetting');
    }
  }
}

function saveGame() {
  state.lastSavedAt = Date.now();
  localStorage.setItem(SAVE_KEY, JSON.stringify({
    cash: state.cash,
    revenuePerClick: state.revenuePerClick,
    revenuePerSecond: state.revenuePerSecond,
    prestigeLevel: state.prestigeLevel,
    totalBusinessesOwned: state.totalBusinessesOwned,
    equipmentUpgrades: state.equipmentUpgrades.map(u => ({ id: u.id, count: u.count, cost: u.cost })),
    upgrades: state.upgrades.map(u => ({ id: u.id, count: u.count, cost: u.cost })),
    totalCashEarned: state.totalCashEarned,
    lastSavedAt: state.lastSavedAt
  }));
}

function calculateScaledCost(baseCost, count, multiplier) {
  let cost = baseCost;
  for (let i = 0; i < count; i++) {
    cost = Math.floor(cost * multiplier);
  }
  return cost;
}

function applyOfflineProgress() {
  if (!state.lastSavedAt || state.revenuePerSecond <= 0) return;

  const elapsedSeconds = Math.min(
    Math.floor((Date.now() - state.lastSavedAt) / 1000),
    MAX_OFFLINE_SECONDS
  );

  if (elapsedSeconds < 10) return;

  const offlineEarnings = Math.floor(state.revenuePerSecond * elapsedSeconds);
  if (offlineEarnings <= 0) return;

  state.cash += offlineEarnings;
  state.totalCashEarned += offlineEarnings;
  addLog(`💤 Offline earnings: ${formatNumber(offlineEarnings)} over ${formatDuration(elapsedSeconds)}`);
}

// Core Mechanics
function handleClick(clickEvent) {
  const earnings = state.revenuePerClick;
  
  state.cash += earnings;
  state.totalCashEarned += earnings;
  
  updateUI();
  createFloatingText(earnings, clickEvent);
  playSound('click');
}

function buyEquipment(index) {
  const equip = state.equipmentUpgrades[index];
  const prestigeMultiplier = 1 + (state.prestigeLevel * 0.5);
  const discountedCost = Math.floor(equip.cost / prestigeMultiplier);
  
  if (state.cash >= discountedCost) {
    state.cash -= discountedCost;
    equip.count++;
    
    // Recalculate click power
    calculateClickPower();
    
    // Increase cost by 20% each purchase
    equip.cost = Math.floor(equip.cost * 1.2);
    
    addLog(`Bought ${equip.name}! Click power +${formatNumber(equip.clickBonus)}`);
    saveGame();
    updateUI();
  }
}

function buyUpgrade(upgradeIndex) {
  const upgrade = state.upgrades[upgradeIndex];
  const prestigeMultiplier = 1 + (state.prestigeLevel * 0.5);
  const discountedCost = Math.floor(upgrade.cost / prestigeMultiplier);
  
  if (state.cash >= discountedCost) {
    state.cash -= discountedCost;
    upgrade.count++;
    state.totalBusinessesOwned++;
    
    // Recalculate RPS
    calculateRPS();
    
    // Increase cost by 15% each purchase
    upgrade.cost = Math.floor(upgrade.cost * 1.15);
    
    addLog(`Bought ${upgrade.name}! Revenue +${formatNumber(upgrade.revenue)}/sec`);
    saveGame();
    updateUI();
  }
}

function calculateClickPower() {
  let clickPower = state.equipmentUpgrades.reduce((total, u) => total + (u.clickBonus * u.count), 1);
  
  // Apply prestige multiplier to click power
  const prestigeMultiplier = 1 + (state.prestigeLevel * 0.5);
  state.revenuePerClick = Math.floor(clickPower * prestigeMultiplier);
}

function calculateRPS() {
  let rps = state.upgrades.reduce((total, u) => total + (u.revenue * u.count), 0);
  
  // Apply prestige multiplier to passive income
  const prestigeMultiplier = 1 + (state.prestigeLevel * 0.5);
  state.revenuePerSecond = Math.floor(rps * prestigeMultiplier);
}

function canPrestige() {
  return state.totalCashEarned >= 500000 && state.prestigeLevel < 5;
}

function triggerPrestige() {
  if (!canPrestige()) return;
  
  const newLevel = Math.min(state.prestigeLevel + 1, 5);
  
  addLog(`🌟 PRESTIGE! Level ${state.prestigeLevel} → ${newLevel}`);
  addLog(`   New multiplier: ${(1 + newLevel * 0.5)}x to all income`);
  
  state.prestigeLevel = newLevel;
  state.cash = 100; // Give starter cash
  state.revenuePerClick = 1; // Reset to base, will be recalculated
  // NOTE: We keep totalCashEarned so they can prestige again after re-earning 500k
  state.totalBusinessesOwned = 0;
  
  // Reset all upgrades and equipment
  state.equipmentUpgrades.forEach((u, index) => {
    u.count = 0;
    u.cost = BASE_EQUIPMENT_UPGRADES[index].cost;
  });
  
  state.upgrades.forEach((u, index) => {
    u.count = 0;
    u.cost = BASE_UPGRADES[index].cost;
  });
  
  calculateClickPower();
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

function formatDuration(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function updateUI() {
  document.getElementById('cash-display').textContent = formatNumber(state.cash);
  document.getElementById('rps-display').textContent = `${formatNumber(state.revenuePerSecond)}/s`;
  document.getElementById('click-power-display').textContent = `Click: ${formatNumber(state.revenuePerClick)}`;
  
  // Update prestige info
  const canAffordPrestige = canPrestige();
  const prestigeBtn = document.getElementById('prestige-btn');
  
  if (state.prestigeLevel > 0) {
    document.getElementById('prestige-level').textContent = state.prestigeLevel;
    document.getElementById('prestige-display').classList.remove('hidden');
  }
  
  // Update equipment buttons
  const prestigeMultiplier = 1 + (state.prestigeLevel * 0.5);
  
  state.equipmentUpgrades.forEach((equip, index) => {
    const discountedCost = Math.floor(equip.cost / prestigeMultiplier);
    const btn = document.getElementById(`equip-${index}`);
    
    if (btn) {
      btn.innerHTML = `
        <div class="upgrade-header">
          <span class="upgrade-name">${equip.name}</span>
          <span class="upgrade-cost">${formatNumber(discountedCost)}</span>
        </div>
        <div class="upgrade-stats">+${formatNumber(equip.clickBonus)} click × ${equip.count}</div>
      `;
      
      if (state.cash >= discountedCost) {
        btn.classList.remove('disabled');
      } else {
        btn.classList.add('disabled');
      }
    }
  });
  
  // Update business upgrade buttons
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
  if (canAffordPrestige && state.prestigeLevel < 5) {
    const nextBonus = (1 + (state.prestigeLevel + 1) * 0.5);
    prestigeBtn.innerHTML = `🌟 Prestige → ${nextBonus}x multiplier`;
    prestigeBtn.classList.remove('hidden');
    prestigeBtn.disabled = false;
  } else if (state.prestigeLevel >= 5) {
    prestigeBtn.textContent = '🌟 Max Level Reached';
    prestigeBtn.disabled = true;
    prestigeBtn.classList.remove('hidden');
  } else {
    prestigeBtn.innerHTML = '<span style="font-size: 1.2rem;">🔒</span> Unlock at $500k lifetime earnings';
    prestigeBtn.classList.add('hidden');
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

function createFloatingText(amount, clickEvent) {
  if (!clickEvent) return;

  const float = document.createElement('div');
  float.textContent = `+$${amount}`;
  float.style.position = 'fixed';
  float.style.left = `${clickEvent.clientX}px`;
  float.style.top = `${clickEvent.clientY - 20}px`;
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
  localStorage.setItem(THEME_KEY, theme);
  
  // Update active button state
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });
}

function loadTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY) || 'regal';
  switchTheme(savedTheme);
}

// Sound effects (simple oscillator)
let audioCtx;
function playSound(type) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  if (!audioCtx) audioCtx = new AudioContextClass();
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
    // Add 1/10th of RPS every 100ms
    const earnings = state.revenuePerSecond / 10;
    state.cash += earnings;
    state.totalCashEarned += earnings;
    updateUI();
  }
}, 100);

// Auto-save every 30 seconds
setInterval(saveGame, 30000);

// Initialize
window.onload = () => {
  loadTheme();
  loadGame();
  calculateClickPower();
  calculateRPS();
  applyOfflineProgress();
  
  // Setup equipment upgrades UI
  const equipContainer = document.getElementById('equipment-container');
  state.equipmentUpgrades.forEach((equip, index) => {
    const btn = document.createElement('button');
    btn.id = `equip-${index}`;
    btn.className = 'upgrade-card';
    btn.onclick = () => buyEquipment(index);
    
    // Initial render
    btn.innerHTML = `
      <div class="upgrade-header">
        <span class="upgrade-name">${equip.name}</span>
        <span class="upgrade-cost">${formatNumber(equip.cost)}</span>
      </div>
      <div class="upgrade-stats">+${formatNumber(equip.clickBonus)} click × ${equip.count}</div>
    `;
    
    equipContainer.appendChild(btn);
  });
  
  // Setup business upgrades UI
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
  saveGame();
};

// Auto-buy feature
window.buyAllUpgrades = function() {
  const prestigeMultiplier = 1 + (state.prestigeLevel * 0.5);
  let changed = false;
  
  // Buy equipment first
  state.equipmentUpgrades.forEach((u, i) => {
    while (state.cash >= Math.floor(u.cost / prestigeMultiplier)) {
      state.cash -= Math.floor(u.cost / prestigeMultiplier);
      u.count++;
      calculateClickPower();
      u.cost = Math.floor(u.cost * 1.2);
      changed = true;
    }
  });
  
  // Then business upgrades
  state.upgrades.forEach((u, i) => {
    while (state.cash >= Math.floor(u.cost / prestigeMultiplier)) {
      state.cash -= Math.floor(u.cost / prestigeMultiplier);
      u.count++;
      state.totalBusinessesOwned++;
      calculateRPS();
      u.cost = Math.floor(u.cost * 1.15);
      changed = true;
    }
  });
  
  if (changed) {
    calculateClickPower();
    calculateRPS();
    addLog('🛒 Auto-purchased all affordable upgrades!');
    saveGame();
    updateUI();
  }
};

function resetSave() {
  const confirmed = confirm('Reset your Empire Builder save and start over? This cannot be undone.');
  if (!confirmed) return;

  localStorage.removeItem(SAVE_KEY);
  localStorage.removeItem(THEME_KEY);
  window.location.reload();
}

// Keyboard shortcuts for scrolling
window.addEventListener('keydown', (e) => {
  // W key - scroll up
  if (e.key === 'w' || e.key === 'W') {
    window.scrollBy({ top: -60, behavior: 'smooth' });
    e.preventDefault();
  }
  
  // S key - scroll down
  if (e.key === 's' || e.key === 'S') {
    window.scrollBy({ top: 60, behavior: 'smooth' });
    e.preventDefault();
  }
});
