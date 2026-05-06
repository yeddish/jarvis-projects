// Game Loop
setInterval(() => {
  if (state.revenuePerSecond > 0) {
    const cashToAdd = Math.floor(state.revenuePerSecond / 10);
    if (cashToAdd > 0) {
      state.cash += cashToAdd;
      updateUI();
      console.log(`RPS: ${state.revenuePerSecond}, Added: $${cashToAdd}, Total: $${state.cash}`);
    }
  }
}, 100);
