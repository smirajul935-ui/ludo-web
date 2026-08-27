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
            const d = document.createElement('div');
            d.innerText = p.name + (p.slot === 0 ? " (Host)" : "");
            d.style.borderLeftColor = p.color;
            list.appendChild(d);
        });
    }
};

const game = {
    maxPlayers: 2, roomId: null, playerId: null, roomData: null,
    setPlayers: (n) => { game.maxPlayers = n; document.getElementById('mode-text').innerText = "Mode: "+n+" Players"; },
    
    startCreating: async () => {
        const name = document.getElementById('player-name').value || "Player";
        const user = await auth.signInAnonymously();
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        game.roomId = code;
        game.playerId = user.user.uid;

        await db.ref('rooms/' + code).set({
            status: 'WAITING', hostId: game.playerId, maxPlayers: game.maxPlayers, dice: 0, turn: 0
        });
        await db.ref('rooms/'+code+'/players/'+game.playerId).set({ name, color: 'red', slot: 0 });
        
        document.getElementById('room-id-display').innerText = code;
        document.getElementById('host-controls').classList.remove('hidden');
        ui.goto('screen-lobby');
        game.listen();
    },

    joinRoom: async () => {
        const code = document.getElementById('join-code').value.toUpperCase();
        const name = document.getElementById('player-name').value || "Guest";
        if(code.length < 5) return alert("Enter Code");

        const user = await auth.signInAnonymously();
        game.playerId = user.user.uid;
        game.roomId = code;

        const snap = await db.ref('rooms/' + code).once('value');
        if(!snap.exists()) return alert("Room not found");

        const players = snap.val().players || {};
        const count = Object.keys(players).length;
        const colors = ['red', 'green', 'yellow', 'blue'];

        await db.ref('rooms/'+code+'/players/'+game.playerId).set({ name, color: colors[count], slot: count });
        document.getElementById('room-id-display').innerText = code;
        document.getElementById('host-controls').classList.add('hidden');
        ui.goto('screen-lobby');
        game.listen();
    },

    listen: () => {
        db.ref('rooms/' + game.roomId).on('value', (s) => {
            const data = s.val();
            if(!data) return;
            game.roomData = data;
            ui.updateLobby(data.players);
            if(data.status === 'PLAYING') ui.goto('screen-game');
            if(data.dice > 0) document.getElementById('dice-box').innerText = data.dice;
        });
    },

    startGame: () => { db.ref('rooms/' + game.roomId).update({ status: 'PLAYING' }); },

    renderBoard: () => {
        const canvas = document.getElementById('ludoCanvas');
        const ctx = canvas.getContext('2d');
        const size = 450;
        canvas.width = size; canvas.height = size;
        const s = size / 15;

        const drawH = (x,y,c) => { ctx.fillStyle=c; ctx.fillRect(x*s,y*s,6*s,6*s); ctx.strokeRect(x*s,y*s,6*s,6*s); };
        ctx.clearRect(0,0,size,size);
        drawH(0,0,"#e74c3c"); // Red
        drawH(9,0,"#2ecc71"); // Green
        drawH(0,9,"#3498db"); // Blue
        drawH(9,9,"#f1c40f"); // Yellow

        ctx.strokeStyle = "#ddd";
        for(let i=0; i<15; i++) {
            for(let j=0; j<15; j++) ctx.strokeRect(i*s, j*s, s, s);
        }
        ctx.fillStyle="#2c3e50"; ctx.fillRect(6*s,6*s,3*s,3*s);
    },

    rollDice: () => {
        const roll = Math.floor(Math.random() * 6) + 1;
        db.ref('rooms/' + game.roomId).update({ dice: roll });
    }
};

window.onload = () => ui.goto('screen-home');
