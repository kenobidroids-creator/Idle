// This file handles the "Automation." It moves workers and processes station logic.

const EntityManager = {
    update(dt) {
        // 1. Process Recruitment Hub (Only if a task is active)
        const recruiter = gameState.stations.find(s => s.isRecruiter);
        if (recruiter && recruiter.currentTimer > 0) {
            recruiter.currentTimer += dt;
            if (recruiter.currentTimer >= recruiter.workTime) {
                this.spawnWorker();
                recruiter.currentTimer = 0; // Reset and wait for player to click again
                StorageManager.save();
            }
        }

        // 2. Move workers to their assigned stations
        gameState.workers.forEach(worker => {
            // Look for the assigned station
            const station = gameState.stations.find(s => s.id === worker.assignedStationId);

            // If assigned to Hub or station not found, go to Hub coordinates
            const targetGx = station ? station.gx : 0; 
            const targetGy = station ? station.gy : 5;

            const targetX = targetGx * CONFIG.TILE_SIZE;
            const targetY = targetGy * CONFIG.TILE_SIZE;

            const dx = targetX - worker.x;
            const dy = targetY - worker.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 5) {
                worker.state = 'MOVING';
                worker.x += (dx / dist) * worker.speed;
                worker.y += (dy / dist) * worker.speed;
            } else {
                worker.x = targetX;
                worker.y = targetY;
                worker.state = (worker.assignedStationId === 99) ? 'IDLE' : 'WORKING';
            }
        });

        // 3. Process Station Income
        gameState.stations.forEach(s => {
    if (!s.isRecruiter && s.workersAssigned > 0) {
        // NEW: Check if at least one worker assigned to this station has arrived
        const anyWorkerArrived = gameState.workers.some(w => 
            w.assignedStationId === s.id && w.state === 'WORKING'
        );

        if (anyWorkerArrived) {
            s.currentTimer += dt;
            if (s.currentTimer >= s.workTime) {
                gameState.gold += (s.income * s.level) * s.workersAssigned;
                s.currentTimer = 0;
            }
        } else {
            // Optional: Reset timer if no one is there, 
            // or just keep it paused (don't increment s.currentTimer)
        }
    }
})
    },

    spawnWorker() {
        const id = gameState.workers.length;
        // New workers start as unassigned at the Recruitment Hub
        gameState.workers.push({
            id: id,
            x: 0, 
            y: 320, // World Y for Hub (5 * 64)
            targetGx: 0, // Explicitly set target to Hub
            targetGy: 5,
            assignedStationId: 99, // Assigned to Hub initially
            speed: 2,
            state: 'IDLE'
        });
        gameState.unassignedWorkers++;
        // Force a save immediately so the new worker isn't lost if they refresh
        StorageManager.save();
    }
};