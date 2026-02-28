// The conductor. It runs the loops and draws the visuals.

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const goldDisplay = document.getElementById('gold-label');

// Variables to track click vs drag
let dragDistance = 0;
let selectedStation = null;
let isDraggingMap = false; 
let lastMouseX = 0; // We need these to draw the Ghost at the right spot
let lastMouseY = 0;
let lastTouchX = 0;
let lastTouchY = 0;
let originalGx = 0;
let originalGy = 0;

function init() {
    StorageManager.load(); // Load existing data

    // --- MANUAL CLICK LOGIC ---
    const clickBtn = document.getElementById('manual-click-btn');
    const clickValueSpan = document.getElementById('click-value');
    if (clickBtn) {
        clickBtn.onclick = (e) => {
            e.stopPropagation(); // Prevents the map from clicking/dragging
            // Milestone: Power is based on Recruitment Hub level (Station 99)
            const hub = gameState.stations.find(s => s.id === 99);
            const clickPower = hub ? hub.level : 1;
        
            gameState.gold += clickPower;
        
            // Update UI
            goldDisplay.innerText = Math.floor(gameState.gold);
            if (clickValueSpan) clickValueSpan.innerText = clickPower;
        
            // Instant save for manual clicks to prevent progress loss
            StorageManager.save();
        };
    }

    // --- BUILD MODE CLICK LOGIC ---
const buildBtn = document.getElementById('build-mode-btn');
if (buildBtn) {
    console.log("Build button found in HTML!");
    
    // We use 'mousedown' instead of 'onclick' sometimes if the canvas is aggressive
    buildBtn.addEventListener('mousedown', (e) => {
        e.stopPropagation(); // STOP the game from thinking we clicked the map
    });

    buildBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation(); 
        
        console.log("Build button successfully clicked!");
        
        // Ensure the property exists
        if (gameState.isBuildMode === undefined) gameState.isBuildMode = false;

        gameState.isBuildMode = !gameState.isBuildMode;

        if (gameState.isBuildMode) {
            buildBtn.innerText = "Exit Build Mode";
            buildBtn.style.background = "#e74c3c";
            buildBtn.style.boxShadow = "0 0 10px red"; // Visual cue it's active
        } else {
            buildBtn.innerText = "Enter Build Mode";
            buildBtn.style.background = "#3498db";
            buildBtn.style.boxShadow = "none";
            selectedStation = null; // Drop anything we are holding
            StorageManager.save();
        }
    };
} else {
    console.error("Error: Could not find build-mode-btn in the document!");
}

    Camera.init(canvas);
    window.addEventListener('resize', resize);
    resize();

    // Trigger save when the window is closed or hidden
    window.addEventListener('beforeunload', () => StorageManager.save());
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') StorageManager.save();
   });

    // Auto-save every 20 seconds
    setInterval(() => StorageManager.save(), 20000);
    
    // Start Logic Loop (independent of framerate)
    setInterval(() => {
        EntityManager.update(16);
        goldDisplay.innerText = Math.floor(gameState.gold);
    }, 16);

    // Start a click/drag
    // 1. Mouse Down: Decide if we are grabbing a building or the map
// 1. MOUSE DOWN - High Priority (Capture phase)
canvas.addEventListener('mousedown', (e) => {
    dragDistance = 0;
    const worldPos = Camera.screenToWorld(e.clientX, e.clientY, canvas);
    
    // Find if a station is under the mouse
    const clickedStation = gameState.stations.find(s => {
        const sx = s.gx * CONFIG.TILE_SIZE;
        const sy = s.gy * CONFIG.TILE_SIZE;
        return worldPos.x >= sx && worldPos.x <= sx + CONFIG.TILE_SIZE &&
               worldPos.y >= sy && worldPos.y <= sy + CONFIG.TILE_SIZE;
    });

    // Inside your mousedown listener in main.js
if (gameState.isBuildMode && clickedStation) {
    selectedStation = clickedStation;
    // Record original position in case placement is illegal
    originalGx = clickedStation.gx;
    originalGy = clickedStation.gy;
    
    e.stopImmediatePropagation(); 
}

    if (gameState.isBuildMode && clickedStation) {
        selectedStation = clickedStation;
        // STOP THE CAMERA from seeing this event
        e.stopImmediatePropagation(); 
    } else {
        isDraggingMap = true;
    }
}, true); // The 'true' is vital!

    // Handle movement (Dragging buildings)
    // 2. Mouse Move: Move either the building OR the map
// 2. MOUSE MOVE - High Priority
window.addEventListener('mousemove', (e) => {
    dragDistance++;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;

    if (gameState.isBuildMode && selectedStation) {
        const worldPos = Camera.screenToWorld(e.clientX, e.clientY, canvas);
        selectedStation.gx = Math.round(worldPos.x / CONFIG.TILE_SIZE);
        selectedStation.gy = Math.round(worldPos.y / CONFIG.TILE_SIZE);
        
        // KILL the event so camera.js doesn't move the map
        e.stopImmediatePropagation();
    } else if (!isDraggingMap) {
        // If we aren't dragging a building but we aren't supposed to move the map
        e.stopImmediatePropagation();
    }
}, true);

    // End the interaction
    // 3. Mouse Up: Drop everything
// 3. MOUSE UP
canvas.addEventListener('mouseup', (e) => {
    if (gameState.isBuildMode && selectedStation) {
        // 1. Check if the spot we are hovering over is blocked
        const isBlocked = gameState.stations.some(s => 
            s.id !== selectedStation.id && 
            s.gx === selectedStation.gx && 
            s.gy === selectedStation.gy
        );

        if (isBlocked) {
            // SNAP BACK to original position if blocked
            selectedStation.gx = originalGx;
            selectedStation.gy = originalGy;
            console.log("Placement blocked! Snapping back.");
        } else {
            // SUCCESSFUL PLACEMENT
            StorageManager.save(); 
            console.log("Station moved successfully.");
        }
        StorageManager.save();
        selectedStation = null;
        e.stopImmediatePropagation(); // Prevent camera from finishing its pan
    } else {
        handleInteraction(e);
    }
    isDraggingMap = false;
}, true);
    
    // 1. TOUCH START
canvas.addEventListener('touchstart', (e) => {
    dragDistance = 0;
    const touch = e.touches[0];
    const worldPos = Camera.screenToWorld(touch.clientX, touch.clientY, canvas);
    
    const clickedStation = gameState.stations.find(s => {
        const sx = s.gx * CONFIG.TILE_SIZE;
        const sy = s.gy * CONFIG.TILE_SIZE;
        return worldPos.x >= sx && worldPos.x <= sx + CONFIG.TILE_SIZE &&
               worldPos.y >= sy && worldPos.y <= sy + CONFIG.TILE_SIZE;
    });

    if (gameState.isBuildMode && clickedStation) {
        selectedStation = clickedStation;
        originalGx = clickedStation.gx;
        originalGy = clickedStation.gy;
        
        e.preventDefault(); // Stop mobile "pull-to-refresh" or scrolling
        e.stopImmediatePropagation(); 
    }
}, { capture: true, passive: false });

// 2. TOUCH MOVE
window.addEventListener('touchmove', (e) => {
    dragDistance++;
    const touch = e.touches[0];
    lastTouchX = touch.clientX;
    lastTouchY = touch.clientY;

    if (gameState.isBuildMode && selectedStation) {
        const worldPos = Camera.screenToWorld(touch.clientX, touch.clientY, canvas);
        selectedStation.gx = Math.round(worldPos.x / CONFIG.TILE_SIZE);
        selectedStation.gy = Math.round(worldPos.y / CONFIG.TILE_SIZE);
        
        e.preventDefault();
        e.stopImmediatePropagation();
    }
}, { capture: true, passive: false });

// 3. TOUCH END
canvas.addEventListener('touchend', (e) => {
    if (gameState.isBuildMode && selectedStation) {
        // Reuse your existing collision logic
        const isBlocked = gameState.stations.some(s => 
            s.id !== selectedStation.id && 
            s.gx === selectedStation.gx && 
            s.gy === selectedStation.gy
        );

        if (isBlocked) {
            selectedStation.gx = originalGx;
            selectedStation.gy = originalGy;
        } else {
            StorageManager.save();
        }
        
        selectedStation = null;
        e.preventDefault();
        e.stopImmediatePropagation();
    } else {
        // If not building, handle regular interaction (like opening modals)
        if (dragDistance < 5) handleInteraction(e.changedTouches[0]);
    }
}, { capture: true, passive: false });
    requestAnimationFrame(render);
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    Camera.apply(ctx, canvas);

    // 1. Draw Grid
    const halfW = (CONFIG.GRID_WIDTH * CONFIG.TILE_SIZE) / 2;
    const halfH = (CONFIG.GRID_HEIGHT * CONFIG.TILE_SIZE) / 2;
    ctx.strokeStyle = CONFIG.COLORS.grid;
    ctx.beginPath();
    for(let x = -halfW; x <= halfW; x += CONFIG.TILE_SIZE) {
        ctx.moveTo(x, -halfH); ctx.lineTo(x, halfH);
    }
    for(let y = -halfH; y <= halfH; y += CONFIG.TILE_SIZE) {
        ctx.moveTo(-halfW, y); ctx.lineTo(halfW, y);
    }
    ctx.stroke();

    // 2. Draw Stations
    gameState.stations.forEach(s => {
    // If locked, use a dark grey color
    ctx.fillStyle = s.locked ? '#7f8c8d' : (s.isRecruiter ? '#9b59b6' : CONFIG.COLORS.station);

    // Draw the station body
    ctx.fillStyle = s.isRecruiter ? '#9b59b6' : CONFIG.COLORS.station; // Purple for Hub
    ctx.fillRect(s.gx * CONFIG.TILE_SIZE + 4, s.gy * CONFIG.TILE_SIZE + 4, CONFIG.TILE_SIZE - 8, CONFIG.TILE_SIZE - 8);
    
    // Draw Progress Bar background
    // Only draw progress bars if the station is NOT locked
    if (!s.locked) {
        ctx.fillStyle = "#555";
        ctx.fillRect(s.gx * CONFIG.TILE_SIZE, s.gy * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE, CONFIG.TILE_SIZE, 5);
        
        // Draw progress bars only if active
        if (s.currentTimer > 0) {
            ctx.fillStyle = s.isRecruiter ? "#f1c40f" : "#2ecc71";
            const progress = (s.currentTimer / s.workTime) * CONFIG.TILE_SIZE;
            ctx.fillRect(s.gx * CONFIG.TILE_SIZE, s.gy * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE, progress, 5);
        }
    } else {
        // Optional: Draw a "Lock" icon or text over the station
        ctx.fillStyle = "white";
        ctx.font = "10px Arial";
        ctx.textAlign = "center";
        ctx.fillText("LOCKED", s.gx * CONFIG.TILE_SIZE + 32, s.gy * CONFIG.TILE_SIZE + 36);
    }
});

    // --- BUILD MODE VISUALS ---
if (gameState.isBuildMode && selectedStation) {
    const gx = selectedStation.gx;
    const gy = selectedStation.gy;

    // Is there ANOTHER station here? (Compare IDs so it doesn't collide with itself)
    const isBlocked = gameState.stations.some(s => 
        s.id !== selectedStation.id && s.gx === gx && s.gy === gy
    );

    ctx.save();
    // 0.4 means 40% transparent
    ctx.fillStyle = isBlocked ? "rgba(231, 76, 60, 0.4)" : "rgba(46, 204, 113, 0.4)";
    ctx.strokeStyle = isBlocked ? "#e74c3c" : "#2ecc71";
    ctx.lineWidth = 3;

    ctx.fillRect(gx * CONFIG.TILE_SIZE, gy * CONFIG.TILE_SIZE, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
    ctx.strokeRect(gx * CONFIG.TILE_SIZE, gy * CONFIG.TILE_SIZE, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
    ctx.restore();
}
    // 3. Draw Workers
    const time = Date.now() * 0.005; // Create a steady pulse value

    gameState.workers.forEach(w => {
        ctx.fillStyle = CONFIG.COLORS.worker;
        
        // Calculate bobbing effect
        let bob = 0;
        if (w.assignedStationId === 99) { // If they are at the Hub
            bob = Math.sin(time + w.id) * 5; // The 'w.id' ensures they don't all bob in sync
        }

        ctx.beginPath();
        ctx.arc(
            w.x + CONFIG.TILE_SIZE / 2, 
            w.y + CONFIG.TILE_SIZE / 2 + bob, // Apply bob to Y position
            15, 0, Math.PI * 2
        );
        ctx.fill();

        // Optional: Add a small shadow underneath
        ctx.fillStyle = "rgba(0,0,0,0.2)";
        ctx.beginPath();
        ctx.ellipse(
            w.x + CONFIG.TILE_SIZE / 2, 
            w.y + CONFIG.TILE_SIZE / 2 + 18, 
            10 - (bob/2), 4, 0, 0, Math.PI * 2
        );
        ctx.fill();
    });

    Camera.detach(ctx);
    requestAnimationFrame(render);
}

function handleInteraction(e) {
    // Prevent interaction if we dragged more than 5 pixels (it was a pan, not a click)
    if (dragDistance > 5) return;

    const clientX = e.clientX || (e.touches ? e.touches[0].clientX : 0);
    const clientY = e.clientY || (e.touches ? e.touches[0].clientY : 0);

    const worldPos = Camera.screenToWorld(clientX, clientY, canvas);
    
    // Check if we clicked any station
    const clickedStation = gameState.stations.find(s => {
        const sx = s.gx * CONFIG.TILE_SIZE;
        const sy = s.gy * CONFIG.TILE_SIZE;
        return worldPos.x >= sx && worldPos.x <= sx + CONFIG.TILE_SIZE &&
               worldPos.y >= sy && worldPos.y <= sy + CONFIG.TILE_SIZE;
    });

    if (clickedStation) {
        // CHECK MODE HERE:
        if (gameState.isBuildMode) {
            // Pick it up for the mousemove listener to handle
            selectedStation = clickedStation; 
        } else {
            // Open menu as normal
            showUpgradeModal(clickedStation);
        }
    }
}

function showUpgradeModal(station) {
    selectedStation = station;
    const modal = document.getElementById('upgrade-modal');
    const workerControls = document.getElementById('worker-controls');
    const upgradeBtn = document.getElementById('upgrade-btn');
    const hubBtn = document.getElementById('hub-milestone-btn');
    hubBtn.style.display = "none"; // Hide by default for normal stations


    
    modal.style.display = 'block';

    // --- 1. THE LOCK GATE ---
    if (station.locked) {
        document.getElementById('modal-title').innerText = "Locked: " + station.name;
        document.getElementById('modal-level').innerText = "N/A";
        document.getElementById('modal-base-income').innerText = station.income;
        document.getElementById('modal-cost').innerText = station.unlockCost;
        
        // Hide income/base production lines for EVERY locked station
        // because we don't want to show "Income: 0" for a building you don't own yet
        //if (document.getElementById('modal-base-income')) {
        //    document.getElementById('modal-base-income').parentElement.style.display = 'none';
        //}
        if (document.getElementById('modal-income')) {
            document.getElementById('modal-income').parentElement.style.display = 'none';
        }

        workerControls.style.display = "none";
        upgradeBtn.innerText = `Unlock Station (${station.unlockCost} Gold)`;

        upgradeBtn.onclick = () => {
            if (gameState.gold >= station.unlockCost) {
                gameState.gold -= station.unlockCost;
                station.locked = false;
                StorageManager.save();
                showUpgradeModal(station); // Refresh to show the correct Unlocked UI
            } else {
                alert("Not enough gold!");
            }
        };
        return; // Exit here so it doesn't run Normal Station logic
    }

    // --- 2. THE HUB LOGIC (If Unlocked) ---
    if (station.isRecruiter) {
        hubBtn.style.display = "block"; // Show only for the Hub
        document.getElementById('modal-title').innerText = "Recruitment Hub";
        
        // Hide income lines for the Hub
        if (document.getElementById('modal-base-income')) {
            document.getElementById('modal-base-income').parentElement.style.display = 'none';
        }
        if (document.getElementById('modal-income')) {
            document.getElementById('modal-income').parentElement.style.display = 'none';
        }

        // Calculation: Level 1 -> 500, Level 2 -> 1250, Level 3 -> 3125
        const nextClickPower = station.level + 1;
        const upgradeCost = Math.floor(station.baseUpgradeCost * Math.pow(2.5, station.level - 1));

        hubBtn.innerText = `Upgrade Click to +${nextClickPower} (${upgradeCost} Gold)`;

        hubBtn.onclick = () => {
            if (gameState.gold >= upgradeCost) {
                gameState.gold -= upgradeCost;
                station.level++; // This is what the manual-click-btn checks!
                
                // Update the main UI button text immediately
                const clickValSpan = document.getElementById('click-value');
                if (clickValSpan) clickValSpan.innerText = station.level;
                
                StorageManager.save();
                showUpgradeModal(station); // Refresh modal
                alert(`Milestone Reached! Your manual clicks are now worth ${station.level} gold.`);
            } else {
                alert("You need more gold to reach this milestone!");
            }
        };

        const hireCost = 50 * (gameState.workers.length);
        document.getElementById('modal-title').innerText = "Recruitment Hub";
        document.getElementById('modal-level').innerText = "N/A";
        document.getElementById('modal-cost').innerText = `Hire: ${hireCost} | Upgrade: ${upgradeCost}`;
        workerControls.style.display = "none";
        upgradeBtn.innerText = "Hire Worker";
        
        upgradeBtn.onclick = () => {
            if (gameState.gold >= hireCost && (station.currentTimer || 0) <= 0) {
                gameState.gold -= hireCost;
                station.currentTimer = 1;
                modal.style.display = 'none';
                StorageManager.save();
            } else {
                alert("Hiring already in progress or not enough gold!");
            }
        };
        return;
    }

    // --- 3. NORMAL STATION LOGIC (If Unlocked) ---
    // RESET VISIBILITY: Ensure income lines are visible for production buildings
    if (document.getElementById('modal-base-income')) {
        document.getElementById('modal-base-income').parentElement.style.display = 'block';
    }
    if (document.getElementById('modal-income')) {
        document.getElementById('modal-income').parentElement.style.display = 'block';
    }
    workerControls.style.display = "block";
    // 1. Calculate the price to UPGRADE (using the formula)
    const upgradeCost = Math.floor(10 * Math.pow(CONFIG.exGrowth, (station.level || 1) - 1));

    // This is the "Base" preview (Station Base * Level)
    const baseIncomePerWorker = station.income * station.level;

    // 2. Calculate the ACTUAL INCOME (Base Income * Level * Assigned Workers)
    // This is the "Total" (Base * Workers Assigned)
    const currentIncome = baseIncomePerWorker * (station.workersAssigned || 0);
    
    document.getElementById('modal-title').innerText = station.name;
    document.getElementById('modal-level').innerText = station.level;
    document.getElementById('modal-cost').innerText = upgradeCost;

    // Update the two income fields
    if (document.getElementById('modal-base-income')) {
        document.getElementById('modal-base-income').innerText = baseIncomePerWorker;
    }
    if (document.getElementById('modal-income')) {
        document.getElementById('modal-income').innerText = currentIncome;
    }

    document.getElementById('modal-worker-count').innerText = station.workersAssigned || 0;
    document.getElementById('idle-worker-count').innerText = gameState.unassignedWorkers;
    
    upgradeBtn.innerText = "Upgrade Station";

    // Setup plus/minus buttons (same as your previous code)
    document.getElementById('plus-worker').onclick = () => {
        if (gameState.unassignedWorkers > 0) {
            gameState.unassignedWorkers--;
            station.workersAssigned++;
            const worker = gameState.workers.find(w => w.assignedStationId === 99);
            if (worker) worker.assignedStationId = station.id;
            showUpgradeModal(station);
        }
    };

    document.getElementById('minus-worker').onclick = () => {
        if (station.workersAssigned > 0) {
            gameState.unassignedWorkers++;
            station.workersAssigned--;
            const worker = gameState.workers.find(w => w.assignedStationId === station.id);
            if (worker) worker.assignedStationId = 99;
            showUpgradeModal(station);
        }
    };

    // 4. Update the upgrade button click to use 'upgradeCost'
    upgradeBtn.onclick = () => {
        if (gameState.gold >= upgradeCost) {
            gameState.gold -= upgradeCost;
            station.level++;
            showUpgradeModal(station);
            StorageManager.save();
        } else {
            alert("Not enough gold!");
        }
    };
}


init();