const StorageManager = {
    saveKey: "IdleTycoon_SaveData",

    save() {
        gameState.lastSave = Date.now();
        localStorage.setItem(this.saveKey, JSON.stringify(gameState));
        
        // 1. Console Feedback
        console.log(`%c[Game Saved] %cGold: ${Math.floor(gameState.gold)}`, "color: #2ecc71; font-weight: bold", "color: white");

        // 2. UI Feedback
        const indicator = document.getElementById('save-indicator');
        if (indicator) {
            indicator.style.opacity = "1";
            setTimeout(() => {
                indicator.style.opacity = "0";
            }, 2000); // Hide after 2 seconds
        }
    },

    load() {
    const data = localStorage.getItem(this.saveKey);
    if (!data) {
        console.log("No save data found. Starting fresh!");
        return;
    }

    try {
        const savedState = JSON.parse(data);
        
        // --- KEEP EXISTING: AWAY EARNINGS LOGIC ---
        const now = Date.now();
        const secondsAway = (now - (savedState.lastSave || now)) / 1000;
        
        if (secondsAway > 60 && savedState.stations) {
            let totalEarned = 0;
            savedState.stations.forEach(s => {
                if (!s.isRecruiter && s.workersAssigned > 0) {
                    const ratePerSecond = (s.income * s.level * s.workersAssigned) / (s.workTime / 1000);
                    totalEarned += ratePerSecond * secondsAway;
                }
            });
            if (totalEarned > 0) {
                alert(`Welcome back! You earned ${Math.floor(totalEarned)} gold while away.`);
                savedState.gold = (savedState.gold || 0) + totalEarned;
            }
        }

        // --- IMPROVED MERGING: DEEP PROPERTY SYNC ---
        // 1. Sync top-level numbers
        gameState.gold = savedState.gold ?? gameState.gold;
        gameState.unassignedWorkers = savedState.unassignedWorkers ?? gameState.unassignedWorkers;

        // 2. Sync Stations (ensures new properties like 'locked' aren't lost)
        if (savedState.stations) {
            savedState.stations.forEach(savedStation => {
                const existing = gameState.stations.find(s => s.id === savedStation.id);
                if (existing) {
                    // This copies only the saved values over the new defaults
                    Object.assign(existing, savedStation);
                }
            });
        }

        // 3. Sync Workers
        if (savedState.workers) {
            gameState.workers = savedState.workers;
        }

        console.log("Game Loaded Successfully");
    } catch (e) {
        console.error("Save file corrupted, clearing...", e);
        localStorage.removeItem(this.saveKey);
    }
}
};