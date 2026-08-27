const ui = {
    goto: (id) => {
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        document.getElementById(id).classList.remove('hidden');
        if(id === 'screen-game') game.initBoard();
    },
    updateLobby: (players) => {
        const list = document.getElementById('player-list');
        list.innerHTML = "";
        let count = 0;
        Object.values(players).forEach(p => {
            count++;
            const div = document.createElement('div');
            div.className = `player-row ${count === 1 ? 'active' : ''}`;
            div.innerHTML = `
                <div style="background:${p.color}; width:35px; height:35px; border-radius:50%; margin-right:15px; display:flex; align-items:center; justify-content:center;">👤</div>
                <div style="flex:1">
                    <div style="font-weight:bold">${p.name} ${count === 1 ? '(You)' : ''}</div>
                    <div style="font-size:0.8rem; color:${count === 1 ? '#29ff29' : '#888'}">${count === 1 ? 'Ready' : 'Waiting...'}</div>
                </div>
                ${count === 1 ? '<div style="color:#29ff29">✔</div>' : '<div class="loader-dots">...</div>'}
            `;
            list.appendChild(div);
        });
        document.getElementById('p-joined').innerText = count;
    }
};

const game = {
    roomId: null,
    initBoard: () => {
        const board = document.getElementById('ludo-board');
        board.innerHTML = "";
        for (let i = 0; i < 225; i++) {
            const cell = document.createElement('div');
            cell.className = "cell";
            // Logic to color squares as per Ludo board
            const row = Math.floor(i / 15);
            const col = i % 15;
            
            if(row < 6 && col < 6) cell.classList.add('red-zone');
            else if(row < 6 && col > 8) cell.classList.add('green-zone');
            else if(row > 8 && col < 6) cell.classList.add('blue-zone');
            else if(row > 8 && col > 8) cell.classList.add('yellow-zone');
            
            board.appendChild(cell);
        }
    },
    startCreating: async () => {
        const name = document.getElementById('player-name').value || "Sagar";
        const user = await auth.signInAnonymously();
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        game.roomId = code;
        await db.ref('rooms/' + code).set({
            status: 'WAITING', players: { [user.user.uid]: { name, color: 'red', slot: 0 } }
        });
        document.getElementById('room-id-display').innerText = code;
        document.getElementById('host-controls').classList.remove('hidden');
        ui.goto('screen-lobby');
        game.listen();
    },
    listen: () => {
        db.ref('rooms/' + game.roomId).on('value', (s) => {
            const data = s.val();
            if(data) ui.updateLobby(data.players);
            if(data && data.status === 'PLAYING') ui.goto('screen-game');
        });
    },
    startGame: () => { db.ref('rooms/' + game.roomId).update({ status: 'PLAYING' }); }
};
