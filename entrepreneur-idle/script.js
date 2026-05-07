// Empire Builder - Side Hustle Grind
// Version: 2.1.0 (Fix icons, prestige button, increase side hustle pricing)
// Game State
const state = {
  cash: 0,
  revenuePerClick: 1,
  revenuePerSecond: 0,
  equipmentUpgrades: [
    { id: 'basic_laptop', name: 'Basic Laptop', cost: 25, clickBonus: 2, count: 0 },
    { id: 'power_bank', name: 'Power Bank', cost: 150, clickBonus: 5, count: 0 },
    { id: 'crm_software', name: 'CRM Software', cost: 750, clickBonus: 12, count: 0 },
    { id: 'virtual_assistant', name: 'VA Assistant', cost: 3000, clickBonus: 30, count: 0 },
    { id: 'automation_tool', name: 'Auto-Tool Suite', cost: 15000, clickBonus: 80, count: 0 },
    { id: 'ai_co_founder', name: 'AI Co-Founder', cost: 75000, clickBonus: 250, count: 0 }
  ],
  upgrades: [
    { id: 'freelance', name: 'Freelance Gigs', cost: 75, revenue: 1, count: 0 },
    { id: 'tutoring', name: 'Online Tutoring', cost: 300, revenue: 6, count: 0 },
    { id: 'dropshipping', name: 'Dropshipping Store', cost: 1500, revenue: 28, count: 0 },
    { id: 'app', name: 'Mobile App', cost: 6000, revenue: 130, count: 0 },
    { id: 'saas', name: 'SaaS Platform', cost: 30000, revenue: 750, count: 0 },
    { id: 'agency', name: 'Digital Agency', cost: 120000, revenue: 3200, count: 0 }
  ],
  prestigeLevel: 0,
  totalBusinessesOwned: 0,
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
      state.totalBusinessesOwned = parsed.totalBusinessesOwned || 0;
      
      if (parsed.equipmentUpgrades) {
        parsed.equipmentUpgrades.forEach((u, i) => {
          if (state.equipmentUpgrades[i]) state.equipmentUpgrades[i].count = u.count;
        });
      }
      
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
    totalBusinessesOwned: state.totalBusinessesOwned,
    equipmentUpgrades: state.equipmentUpgrades.map(u => ({ count: u.count })),
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
  
  // Check if user really wants to prestige (they've earned enough before)
  const hasEarnedBefore = state.totalCashEarned >= 500000;
  if (!hasEarnedBefore && state.cash < 500000) {
    alert('You need $500k in lifetime earnings to prestige! Keep grinding.');
    return;
  }
  
  const newLevel = Math.min(state.prestigeLevel + 1, 5);
  
  addLog(`🌟 PRESTIGE! Level ${state.prestigeLevel} → ${newLevel}`);
  addLog(`   New multiplier: ${(1 + newLevel * 0.5)}x to all income`);
  
  state.prestigeLevel = newLevel;
  state.cash = 100; // Give starter cash
  state.revenuePerClick = 1; // Reset to base, will be recalculated
  // NOTE: We keep totalCashEarned so they can prestige again after re-earning 500k
  state.totalBusinessesOwned = 0;
  
  // Reset all upgrades and equipment
  state.equipmentUpgrades.forEach(u => {
    u.count = 0;
    u.cost = [25, 150, 750, 3000, 15000, 75000][state.equipmentUpgrades.indexOf(u)];
  });
  
  state.upgrades.forEach(u => {
    u.count = 0;
    const baseCosts = [75, 300, 1500, 6000, 30000, 120000];
    const idx = state.upgrades.indexOf(u);
    u.cost = baseCosts[idx] || 75;
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
    // Add 1/10th of RPS every 100ms
    state.cash += state.revenuePerSecond / 10;
    updateUI();
  }
}, 100);

// Auto-save every 30 seconds
setInterval(saveGame, 30000);

// Initialize
window.onload = () => {
  loadGame();
  calculateClickPower();
  calculateRPS();
  
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
