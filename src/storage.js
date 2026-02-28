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
    let breakdown = [];

    savedState.stations.forEach(s => {
        if (!s.isRecruiter && s.workersAssigned > 0) {
            const ratePerSecond = (s.income * s.level * s.workersAssigned) / (s.workTime / 1000);
            const stationEarned = ratePerSecond * secondsAway * 0.5; // 50% efficiency
            
            if (stationEarned > 0) {
                totalEarned += stationEarned;
                breakdown.push({ name: s.name, gold: Math.floor(stationEarned) });
            }
        }
    });

    if (totalEarned > 0) {
        showWelcomeModal(totalEarned, breakdown);
    }
}

function showWelcomeModal(total, breakdownData) {
    const modal = document.getElementById('welcome-modal');
    const breakdownDiv = document.getElementById('away-breakdown');
    const totalSpan = document.getElementById('away-total-gold');
    const doubleCostSpan = document.getElementById('double-cost');
    
    // 1. Create the breakdown list
    breakdownDiv.innerHTML = breakdownData.map(item => 
        `<div style="display: flex; justify-content: space-between; border-bottom: 1px solid #444; padding: 4px 0;">
            <span>${item.name}:</span>
            <span style="color: #f1c40f;">+${item.gold}</span>
        </div>`
    ).join('');

    totalSpan.innerText = Math.floor(total);
    
    // 2. Set cost for Double (e.g., 20% of what they are about to earn)
    const doubleCost = Math.floor(total * 0.2); 
    doubleCostSpan.innerText = doubleCost;

    modal.style.display = 'block';

    // 3. Handle Buttons
    document.getElementById('collect-normal-btn').onclick = () => {
        gameState.gold += total;
        modal.style.display = 'none';
        StorageManager.save();
    };

    document.getElementById('collect-double-btn').onclick = () => {
        if (gameState.gold >= doubleCost) {
            gameState.gold -= doubleCost;
            gameState.gold += (total * 2);
            modal.style.display = 'none';
            StorageManager.save();
            alert("Double Gold Collected!");
        } else {
            alert("Not enough gold to double your earnings!");
        }
    };
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