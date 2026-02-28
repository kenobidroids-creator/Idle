// This file holds your global game state. Since we aren't using a server, any changes to this file will be seen by all other scripts.
// Global Configuration
// Global Configuration
const CONFIG = {
    TILE_SIZE: 64,
    GRID_WIDTH: 15,
    GRID_HEIGHT: 15,
    COLORS: {
        floor: '#2c3e50',
        grid: 'rgba(255, 255, 255, 0.05)',
        worker: '#3498db',
        station: '#e67e22',
        stationActive: '#d35400'
    },
    exGrowth: 1.5 // Growth multiplier for upgrade costs
};

// Global Game State
let gameState = {
    gold: 0,
    lastSave: Date.now(),
    unassignedWorkers: 1, // Number of workers waiting at the hub. Start with 1 worker available at the hub on fresh saves.
    // Stations positioned on the Grid (gx, gy)
    stations: [
        { id: 0, gx: -2, gy: -2, name: 'Forge', level: 1, income: 3, workTime: 3000, currentTimer: 0, workersAssigned: 0, maxWorkers: 3, locked: true, unlockCost: 1 },
        { id: 1, gx: 2, gy: 2, name: 'Alchemy', level: 1, income: 5, workTime: 5000, currentTimer: 0, workersAssigned: 0, maxWorkers: 3, locked: true, unlockCost: 100 },
        { id: 2, gx: -4, gy: 2, name: 'Farm', level: 1, income: 1, workTime: 1000, currentTimer: 0, workersAssigned: 0, maxWorkers: 3, locked: false },
        // The Recruitment Hub (Station ID 99)
        { id: 99, gx: 0, gy: 5, name: 'Recruitment Hub', level: 1, income: 0, workTime: 10000, currentTimer: 0, isRecruiter: true, locked: true, unlockCost: 500, upgradeCost: 500 }
    ],
    // Workers with pixel coordinates (x, y)
    workers: [
        { id: 0, x: 0, y: 320, targetGx: 0, targetGy: 5, state: 'IDLE', speed: 2, assignedStationId: 99 }
    ]
};