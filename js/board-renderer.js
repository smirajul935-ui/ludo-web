const boardRenderer = {
    canvas: null, ctx: null, size: 0, s: 0,
    init() {
        this.canvas = document.getElementById('ludoBoard');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        this.render();
    },
    resize() {
        this.size = document.getElementById('ludo-container').clientWidth;
        this.canvas.width = this.size;
        this.canvas.height = this.size;
        this.s = this.size / 15;
    },
    render(gameState) {
        const s = this.s;
        this.ctx.clearRect(0, 0, this.size, this.size);
        
        // Draw Bases
        this.drawRect(0, 0, 6, 6, "#ff4d4d"); // Red
        this.drawRect(9, 0, 6, 6, "#2ecc71"); // Green
        this.drawRect(0, 9, 6, 6, "#3498db"); // Blue
        this.drawRect(9, 9, 6, 6, "#f1c40f"); // Yellow
        
        // Draw Paths (simplified for brevity)
        this.ctx.strokeStyle = "#ddd";
        for(let i=0; i<15; i++) {
            for(let j=0; j<15; j++) {
                this.ctx.strokeRect(i*s, j*s, s, s);
            }
        }

        // Draw Home Triangles
        this.ctx.fillStyle = "#2c3e50";
        this.ctx.fillRect(6*s, 6*s, 3*s, 3*s);

        // Draw Tokens if gameState exists
        if(gameState && gameState.tokens) {
            this.drawTokens(gameState.tokens);
        }
    },
    drawRect(x, y, w, h, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x*this.s, y*this.s, w*this.s, h*this.s);
    },
    drawTokens(tokens) {
        Object.values(tokens).forEach(t => {
            const coords = this.getCoords(t.pos, t.color, t.id);
            this.ctx.beginPath();
            this.ctx.arc(coords.x, coords.y, this.s/2.5, 0, Math.PI*2);
            this.ctx.fillStyle = t.color;
            this.ctx.fill();
            this.ctx.strokeStyle = "white";
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        });
    },
    getCoords(pos, color, id) {
        // Basic mapping logic
        let x = 0, y = 0;
        if(pos === -1) { // In Base
            const baseMap = {
                red: [{x:1.5,y:1.5},{x:3.5,y:1.5},{x:1.5,y:3.5},{x:3.5,y:3.5}],
                green: [{x:10.5,y:1.5},{x:12.5,y:1.5},{x:10.5,y:3.5},{x:12.5,y:3.5}],
                // Add yellow/blue similarly...
            };
            const idx = parseInt(id.split('_')[1]);
            x = baseMap[color][idx].x;
            y = baseMap[color][idx].y;
        } else {
            // Path logic (Simplified: mapping index to x,y)
            x = 7.5; y = 7.5; // Default center for now
        }
        return { x: x * this.s, y: y * this.s };
    }
};
