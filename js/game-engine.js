const ui = {
    showHome: () => { hideAll(); document.getElementById('screen-home').classList.remove('hidden'); },
    showJoin: () => { hideAll(); document.getElementById('screen-join').classList.remove('hidden'); },
    showLobby: (code, isHost) => {
        hideAll();
        document.getElementById('screen-lobby').classList.remove('hidden');
        document.getElementById('room-id-display').innerText = "CODE: " + code;
        if(isHost) document.getElementById('host-controls').classList.remove('hidden');
    },
    showGame: () => { hideAll(); document.getElementById('screen-game').classList.remove('hidden'); },
    updateLobby: (players) => {
        const list = document.getElementById('player-list');
        list.innerHTML = "";
        Object.values(players).forEach(p => {
            const d = document.createElement('div');
            d.innerText = p.name + (p.slot === 0 ? " (Host)" : "");
            d.style.color = p.color;
            list.appendChild(d);
        });
    }
};

function hideAll() { document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden')); }

const game = {
    maxPlayers: 2, roomId: null, playerId: null, roomData: null,
    setPlayers: (n) => { game.maxPlayers = n; document.getElementById('p-count').innerText = "Selected: " + n; },
    createRoom: () => { hideAll(); document.getElementById('screen-create-select').classList.remove('hidden'); },
    
    startCreating: async () => {
        const name = document.getElementById('player-name').value || "Player";
        const user = await auth.signInAnonymously();
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        game.roomId = code;
        game.playerId = user.user.uid;

        const ref = db.ref('rooms/' + code);
        await ref.set({
            status: 'WAITING', hostId: game.playerId, maxPlayers: game.maxPlayers,
            currentTurn: 0, dice: 0
        });
        await ref.child('players/' + game.playerId).set({ name, color: 'red', slot: 0 });
        ui.showLobby(code, true);
        game.listen();
    },

    joinRoom: async () => {
        const code = document.getElementById('join-code').value.toUpperCase();
        const name = document.getElementById('player-name').value || "Guest";
        const user = await auth.signInAnonymously();
        game.playerId = user.user.uid;
        game.roomId = code;

        const snap = await db.ref('rooms/' + code).once('value');
        if(!snap.exists()) return alert("Invalid Room");
        const players = snap.val().players;
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
            ui.updateLobby(data.players);
            if(data.status === 'PLAYING') ui.showGame();
            if(data.dice > 0) document.getElementById('dice-box').innerText = data.dice;
        });
    },

    startGame: () => { db.ref('rooms/' + game.roomId).update({ status: 'PLAYING' }); },
    
    rollDice: () => {
        const players = Object.values(game.roomData.players);
        if(players[game.roomData.currentTurn].name !== document.getElementById('player-name').value) return;
        const roll = Math.floor(Math.random() * 6) + 1;
        db.ref('rooms/' + game.roomId).update({ dice: roll });
        // Turn logic should be added here
    }
};
