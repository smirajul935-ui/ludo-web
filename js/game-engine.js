const ui = {
    hideAll: () => {
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    },
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
    maxPlayers: 2, roomId: null, playerId: null, 
    setPlayers: (n) => { game.maxPlayers = n; document.getElementById('p-count').innerText = "Mode: " + n + " Players"; },
    
    startCreating: async () => {
        const name = document.getElementById('player-name').value;
        if(!name) return alert("Enter Name!");
        
        try {
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
        } catch(e) { alert(e.message); }
    },

    joinRoom: async () => {
        const code = document.getElementById('join-code').value.toUpperCase();
        const name = document.getElementById('player-name').value;
        if(!code || !name) return alert("Enter Code & Name!");

        try {
            const user = await auth.signInAnonymously();
            game.playerId = user.user.uid;
            game.roomId = code;

            const snap = await db.ref('rooms/' + code).once('value');
            if(!snap.exists()) return alert("Room not found!");

            const players = snap.val().players || {};
            const count = Object.keys(players).length;
            const colors = ['red', 'green', 'yellow', 'blue'];

            await db.ref('rooms/'+code+'/players/'+game.playerId).set({ name, color: colors[count], slot: count });
            ui.showLobby(code, false);
            game.listen();
        } catch(e) { alert(e.message); }
    },

    listen: () => {
        db.ref('rooms/' + game.roomId).on('value', (s) => {
            const data = s.val();
            if(!data) return;
            game.updateLobbyUI(data.players);
            if(data.status === 'PLAYING') {
                ui.showGame();
                // Yahan Board drawing code aayega
            }
        });
    },

    updateLobbyUI: (players) => {
        const list = document.getElementById('player-list');
        list.innerHTML = "";
        Object.values(players).forEach(p => {
            const d = document.createElement('div');
            d.className = "player-slot";
            d.innerText = p.name;
            d.style.borderLeft = "5px solid " + p.color;
            list.appendChild(d);
        });
    },

    startGame: () => { db.ref('rooms/' + game.roomId).update({ status: 'PLAYING' }); }
};

window.onload = ui.showHome;
