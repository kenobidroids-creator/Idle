// This handles the transformation math and input listeners for both Mouse and Touch.

const Camera = {
    x: 0,
    y: 0,
    zoom: 1,
    isDragging: false,
    lastPos: { x: 0, y: 0 },

    init(canvas) {
        // Mouse Events
        canvas.addEventListener('mousedown', e => this.start(e.clientX, e.clientY));
        window.addEventListener('mousemove', e => this.move(e.clientX, e.clientY));
        window.addEventListener('mouseup', () => this.isDragging = false);

        // Touch Events
        canvas.addEventListener('touchstart', e => {
            const t = e.touches[0];
            this.start(t.clientX, t.clientY);
        }, { passive: false });
        canvas.addEventListener('touchmove', e => {
            const t = e.touches[0];
            this.move(t.clientX, t.clientY);
        }, { passive: false });
        window.addEventListener('touchend', () => this.isDragging = false);
    },

        // Add this inside the Camera object in camera.js
    screenToWorld(screenX, screenY, canvas) {
        const rect = canvas.getBoundingClientRect();
        const x = (screenX - rect.left - canvas.width / 2) / this.zoom + this.x;
        const y = (screenY - rect.top - canvas.height / 2) / this.zoom + this.y;
        return { x, y };
    },

    start(x, y) {
        this.isDragging = true;
        this.lastPos = { x, y };
    },

    move(x, y) {
        if (!this.isDragging) return;
        // Move the camera based on drag delta
        this.x -= (x - this.lastPos.x) / this.zoom;
        this.y -= (y - this.lastPos.y) / this.zoom;
        this.lastPos = { x, y };
    },

    apply(ctx, canvas) {
        ctx.save();
        // Center the camera
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(-this.x, -this.y);
    },

    detach(ctx) {
        ctx.restore();
    }
};