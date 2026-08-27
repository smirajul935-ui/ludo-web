const ui = {
    goto: (id) => {
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        document.getElementById(id).classList.remove('hidden');
        if(id === 'screen-game') game.renderBoard();
    },
    updateLobby: (players) => {
        const list = document.getElementById('player-list');
        list.innerHTML = "";
        Object.values(players).forEach(p => {
            const div = document.createElement('div');
            div.innerHTML = `<span style="color:${p.color}; margin-right:10px">👤</span> <b>${p.name}</b> <span style="margin-left:auto; color:#29ff29">Ready</span>`;
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
        const count = Object.keys(snap.val().players).length;
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
            if(data.status === 'PLAYING') ui.goto('screen-game');
            if(data.dice > 0) document.getElementById('dice-cube').innerText = data.dice;
        });
    },
    startGame: () => db.ref(`rooms/${game.roomId}`).update({ status: 'PLAYING' }),
    renderBoard: () => {
        const canvas = document.getElementById('ludoCanvas');
        const ctx = canvas.getContext('2d');
        const s = 450 / 15; canvas.width = 450; canvas.height = 450;
        
        const drawBase = (x, y, color) => {
            ctx.fillStyle = color; ctx.fillRect(x*s, y*s, 6*s, 6*s);
            ctx.strokeStyle = "#000"; ctx.strokeRect(x*s, y*s, 6*s, 6*s);
            ctx.fillStyle = "white"; ctx.fillRect((x+1)*s, (y+1)*s, 4*s, 4*s);
        };
        drawBase(0,0,"#ff3838"); drawBase(9,0,"#2ecc71");
        drawBase(0,9,"#3498db"); drawBase(9,9,"#f1c40f");
        
        ctx.fillStyle = "#333"; ctx.fillRect(6*s, 6*s, 3*s, 3*s); // Center
        // Grid Path
        ctx.strokeStyle = "#ddd";
        for(let i=0; i<15; i++) for(let j=0; j<15; j++) ctx.strokeRect(i*s, j*s, s, s);
    },
    rollDice: () => {
        const roll = Math.floor(Math.random() * 6) + 1;
        db.ref(`rooms/${game.roomId}`).update({ dice: roll });
    }
};

window.onload = () => ui.goto('screen-home');
