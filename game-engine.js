const ui = {
    goto: (id) => {
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        document.getElementById(id).classList.remove('hidden');
        if(id === 'screen-game') setTimeout(game.renderBoard, 100);
    },
    updateLobby: (players) => {
        const list = document.getElementById('player-list');
        list.innerHTML = "";
        Object.values(players).forEach(p => {
            const div = document.createElement('div');
            div.innerHTML = `<span style="color:${p.color}; font-size:1.5rem; margin-right:15px">👤</span> <b>${p.name}</b> <span style="margin-left:auto; color:#29ff29">Ready</span>`;
            list.appendChild(div);
        });
    }
};

const game = {
    roomId: null, playerId: null, roomData: null,
    startCreating: async () => {
        const name = document.getElementById('player-name').value || "User";
        const user = await auth.signInAnonymously();
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        game.roomId = code;
        game.playerId = user.user.uid;
        await db.ref('rooms/' + code).set({
            status: 'WAITING', hostId: game.playerId, currentTurn: 0, dice: 0,
            players: { [game.playerId]: { name, color: 'red', slot: 0, uid: game.playerId } }
        });
        document.getElementById('room-code-display').innerText = code;
        document.getElementById('host-controls').classList.remove('hidden');
        ui.goto('screen-lobby');
        game.listen();
    },
    joinRoom: async () => {
        const code = document.getElementById('join-code').value.toUpperCase();
        const name = document.getElementById('player-name').value || "Guest";
        const user = await auth.signInAnonymously();
        game.playerId = user.user.uid; game.roomId = code;
        const snap = await db.ref('rooms/' + code).once('value');
        if(!snap.exists()) return alert("Room Not Found");
        const players = snap.val().players || {};
        const count = Object.keys(players).length;
        const colors = ['red', 'green', 'yellow', 'blue'];
        await db.ref(`rooms/${code}/players/${game.playerId}`).set({ name, color: colors[count], slot: count, uid: game.playerId });
        document.getElementById('room-code-display').innerText = code;
        ui.goto('screen-lobby');
        game.listen();
    },
    listen: () => {
        db.ref('rooms/' + game.roomId).on('value', (s) => {
            const data = s.val(); if(!data) return;
            game.roomData = data;
            ui.updateLobby(data.players);
            if(data.status === 'PLAYING') {
                ui.goto('screen-game');
                game.updateGameUI();
            }
            if(data.dice > 0) {
                document.getElementById('dice-view').innerText = data.dice;
                game.renderBoard();
            }
        });
    },
    startGame: () => db.ref(`rooms/${game.roomId}`).update({ status: 'PLAYING' }),
    updateGameUI: () => {
        Object.values(game.roomData.players).forEach(p => {
            const nameEl = document.getElementById('n' + p.slot);
            if(nameEl) nameEl.innerText = p.name;
        });
        document.querySelectorAll('.player-info').forEach(el => el.classList.remove('active'));
        document.getElementById('p' + game.roomData.currentTurn + '-card').classList.add('active');
    },
    renderBoard: () => {
        const canvas = document.getElementById('ludoCanvas');
        const ctx = canvas.getContext('2d');
        const size = 450; canvas.width = size; canvas.height = size;
        const s = size / 15;

        // Draw Bases
        const drawH = (x, y, color) => {
            ctx.fillStyle = color; ctx.fillRect(x*s, y*s, 6*s, 6*s);
            ctx.strokeStyle = "#000"; ctx.lineWidth = 2; ctx.strokeRect(x*s, y*s, 6*s, 6*s);
            ctx.fillStyle = "white"; ctx.fillRect((x+1)*s, (y+1)*s, 4*s, 4*s);
            // Tokens in base
            ctx.fillStyle = color;
            for(let i=0; i<2; i++) for(let j=0; j<2; j++) {
                ctx.beginPath(); ctx.arc((x+1.5+i*3)*s, (y+1.5+j*3)*s, s/1.5, 0, Math.PI*2); ctx.fill();
            }
        };
        drawH(0,0,"#ff3838"); drawH(9,0,"#2ecc71");
        drawH(9,9,"#f1c40f"); drawH(0,9,"#3498db");

        // Path
        ctx.strokeStyle = "#ddd"; ctx.lineWidth = 1;
        for(let i=0; i<15; i++) for(let j=0; j<15; j++) ctx.strokeRect(i*s, j*s, s, s);
        
        // Home Center
        ctx.fillStyle = "#333"; ctx.fillRect(6*s, 6*s, 3*s, 3*s);
    },
    rollDice: () => {
        const turn = game.roomData.currentTurn;
        const players = Object.values(game.roomData.players).sort((a,b)=>a.slot-b.slot);
        if(players[turn].uid !== game.playerId) return; // Not your turn

        const roll = Math.floor(Math.random() * 6) + 1;
        db.ref(`rooms/${game.roomId}`).update({ dice: roll });
        
        // Auto next turn for demo (Replace with movement logic later)
        setTimeout(() => {
            const next = (turn + 1) % Object.keys(game.roomData.players).length;
            db.ref(`rooms/${game.roomId}`).update({ currentTurn: next, dice: 0 });
        }, 1500);
    }
};

window.onload = () => ui.goto('screen-home');
