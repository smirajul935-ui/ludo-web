const game = {
    maxPlayers: 2,
    roomId: null,
    playerId: null,
    playerName: "",
    myColor: null,
    roomData: null,

    setMaxPlayers(n) {
        this.maxPlayers = n;
        document.getElementById('selected-count').innerText = "Players: " + n;
    },

    async createRoom() {
        const nameInput = document.getElementById('player-name').value;
        this.playerName = nameInput || "Player " + Math.floor(Math.random() * 1000);
        
        const user = await auth.signInAnonymously();
        this.playerId = user.user.uid;

        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.roomId = code;

        const roomRef = db.ref('rooms/' + this.roomId);
        await roomRef.set({
            roomCode: code,
            hostId: this.playerId,
            maxPlayers: this.maxPlayers,
            status: 'WAITING',
            currentTurn: 0,
            diceValue: 0,
            createdAt: firebase.database.ServerValue.TIMESTAMP
        });

        this.joinRoomLogic();
    },

    async joinRoom() {
        const code = document.getElementById('join-code').value.toUpperCase();
        if (code.length !== 6) return alert("Invalid Code");
        this.roomId = code;
        
        const nameInput = document.getElementById('player-name').value;
        this.playerName = nameInput || "Player " + Math.floor(Math.random() * 1000);

        const user = await auth.signInAnonymously();
        this.playerId = user.user.uid;

        this.joinRoomLogic();
    },

    async joinRoomLogic() {
        const roomRef = db.ref('rooms/' + this.roomId);
        const snapshot = await roomRef.once('value');
        
        if (!snapshot.exists()) return alert("Room not found");
        const data = snapshot.val();
        
        if (data.status !== 'WAITING') return alert("Game already started");

        const playersRef = db.ref(`rooms/${this.roomId}/players`);
        const pSnap = await playersRef.once('value');
        const playerCount = pSnap.numChildren();

        if (playerCount >= data.maxPlayers) return alert("Room full");

        const mySlot = playerCount;
        const colors = ['red', 'green', 'yellow', 'blue'];
        this.myColor = colors[mySlot];

        await playersRef.child(this.playerId).set({
            name: this.playerName,
            color: this.myColor,
            slot: mySlot,
            connected: true
        });

        ui.showLobby(data.roomCode, data.hostId === this.playerId);
        this.listenToRoom();
    },

    listenToRoom() {
        db.ref(`rooms/${this.roomId}`).on('value', (snap) => {
            const data = snap.val();
            if (!data) return;
            this.roomData = data;

            ui.updateLobbyPlayers(data.players);

            if (data.status === 'PLAYING') {
                ui.showGame();
                boardRenderer.init();
            }
        });
    },

    startGame() {
        db.ref(`rooms/${this.roomId}`).update({ status: 'PLAYING', currentTurn: 0 });
    },

    rollDice() {
        if (this.roomData.status !== 'PLAYING') return;
        const players = Object.values(this.roomData.players).sort((a,b) => a.slot - b.slot);
        const currentPlayer = players[this.roomData.currentTurn];

        if (currentPlayer.uid !== this.playerId) return; // Not my turn

        const roll = Math.floor(Math.random() * 6) + 1;
        db.ref(`rooms/${this.roomId}`).update({ diceValue: roll });
        
        // Simplification: Auto change turn for demo
        setTimeout(() => {
            let nextTurn = (this.roomData.currentTurn + 1) % this.maxPlayers;
            db.ref(`rooms/${this.roomId}`).update({ currentTurn: nextTurn, diceValue: 0 });
        }, 2000);
    }
};
