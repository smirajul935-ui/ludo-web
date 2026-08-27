const boardRenderer = {
    canvas: null,
    ctx: null,
    size: 0,

    init() {
        this.canvas = document.getElementById('ludoBoard');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        this.draw();
    },

    resize() {
        const container = document.getElementById('ludo-container');
        this.size = container.clientWidth;
        this.canvas.width = this.size;
        this.canvas.height = this.size;
    },

    draw() {
        const s = this.size / 15;
        this.ctx.clearRect(0, 0, this.size, this.size);

        // Draw Squares (simplified)
        for (let x = 0; x < 15; x++) {
            for (let y = 0; y < 15; y++) {
                this.ctx.strokeStyle = "#ccc";
                this.ctx.strokeRect(x * s, y * s, s, s);
            }
        }

        // Draw Home Bases
        this.drawBox(0, 0, 6, "red");
        this.drawBox(9, 0, 6, "green");
        this.drawBox(0, 9, 6, "blue");
        this.drawBox(9, 9, 6, "yellow");
        
        // Center
        this.ctx.fillStyle = "#34495e";
        this.ctx.fillRect(6 * s, 6 * s, 3 * s, 3 * s);
    },

    drawBox(x, y, sz, color) {
        const s = this.size / 15;
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x * s, y * s, sz * s, sz * s);
        this.ctx.fillStyle = "white";
        this.ctx.fillRect((x + 1) * s, (y + 1) * s, (sz - 2) * s, (sz - 2) * s);
    }
};
