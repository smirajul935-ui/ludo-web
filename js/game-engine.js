const ui = {
    hideAll: () => document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden')),
    showHome: () => { ui.hideAll(); document.getElementById('screen-home').classList.remove('hidden'); },
    showCreate: () => { ui.hideAll(); document.getElementById('screen-create').classList.remove('hidden'); },
    showJoin: () => { ui.hideAll(); document.getElementById('screen-join').classList.remove('hidden'); },
    showLobby: (code, isHost) => {
        ui.hideAll();
        document.getElementById('screen-lobby').classList.remove('hidden');
        document.getElementById('room-id-display').innerText = code;
        if(isHost) document.getElementById('host-controls').classList.remove('hidden');
    },
    showGame: () => { ui.hideAll(); document.getElementById('screen-game').classList.remove('hidden'); }
};

const game = {
    maxPlayers: 2, roomId: null, playerId: null, roomData: null,
    setPlayers: (n) => { game.maxPlayers = n; document.getElementById('p-count').innerText = "Mode: "+n+" Players"; },
    
    startCreating: async () => {
        const name = document.getElementById('player-name').value || "Player";
        const user = await auth.signInAnonymously();
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        game.roomId = code;
        game.playerId = user.user.uid;

        await db.ref('rooms/' + code).set({
            status: 'WAITING', hostId: game.playerId, maxPlayers: game.maxPlayers, dice: 0, currentTurn: 0
        });
        await db.ref('rooms/'+code+'/players/'+game.playerId).set({ name, color: 'red', slot: 0 });
        ui.showLobby(code, true);
        game.listen();
    },

    joinRoom: async () => {
        const code = document.getElementById('join-code').value.toUpperCase();
        const name = document.getElementById('player-name').value || "Guest";
        if(code.length < 5) return alert("Sahi Code Dalein!");
        const user = await auth.signInAnonymously();
        game.playerId = user.user.uid;
        game.roomId = code;

        const snap = await db.ref('rooms/' + code).once('value');
        if(!snap.exists()) return alert("Room nahi mila!");

        const players = snap.val().players || {};
        const count = Object.keys(players).length;
        const colors = ['red', 'green', 'yellow', 'blue'];

        await db.ref('rooms/'+code+'/players/'+game.playerId).set({ name, color: colors[count], slot: count });
        ui.showLobby(code, false);
        game.listen();
    },

    listen: () => {
        db.ref('rooms/' + game.roomId).on('value', (s) => {
            const data = s.val();
            if(!data) return;
            game.roomData = data;
            game.updateLobbyUI(data.players);
            if(data.status === 'PLAYING') {
                ui.showGame();
                game.renderBoard();
            }
            if(data.dice > 0) document.getElementById('dice-box').innerText = data.dice;
        });
    },

    updateLobbyUI: (players) => {
        const list = document.getElementById('player-list');
        list.innerHTML = "";
        Object.values(players).forEach(p => {
            const d = document.createElement('div');
            d.innerText = p.name;
            d.style.borderColor = p.color;
            list.appendChild(d);
        });
    },

    startGame: () => { db.ref('rooms/' + game.roomId).update({ status: 'PLAYING' }); },

    renderBoard: () => {
        const canvas = document.getElementById('ludoCanvas');
        const ctx = canvas.getContext('2d');
        const size = 450;
        canvas.width = size; canvas.height = size;
        const s = size / 15;

        // Base Drawing
        const drawBox = (x, y, w, h, color) => {
            ctx.fillStyle = color; ctx.fillRect(x*s, y*s, w*s, h*s);
            ctx.strokeStyle = "#000"; ctx.strokeRect(x*s, y*s, w*s, h*s);
        };

        ctx.clearRect(0,0,size,size);
        drawBox(0,0,6,6,"#ef4444"); // Red
        drawBox(9,0,6,6,"#10b981"); // Green
        drawBox(0,9,6,6,"#3b82f6"); // Blue
        drawBox(9,9,6,6,"#fbbf24"); // Yellow

        // Grid
        ctx.strokeStyle = "#cbd5e1";
        for(let i=0; i<15; i++) {
            for(let j=0; j<15; j++) {
                ctx.strokeRect(i*s, j*s, s, s);
            }
        }
        // Center
        ctx.fillStyle = "#1e293b"; ctx.fillRect(6*s, 6*s, 3*s, 3*s);
    },

    rollDice: () => {
        const roll = Math.floor(Math.random() * 6) + 1;
        db.ref('rooms/' + game.roomId).update({ dice: roll });
    }
};

window.onload = ui.showHome;
