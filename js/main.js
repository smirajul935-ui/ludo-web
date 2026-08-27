const ui = {
    showHome() { this.hideAll(); document.getElementById('screen-home').classList.remove('hidden'); },
    showCreateRoom() { this.hideAll(); document.getElementById('screen-create').classList.remove('hidden'); },
    showJoinRoom() { this.hideAll(); document.getElementById('screen-join').classList.remove('hidden'); },
    
    showLobby(code, isHost) {
        this.hideAll();
        document.getElementById('screen-lobby').classList.remove('hidden');
        document.getElementById('display-code').innerText = code;
        if (isHost) document.getElementById('host-controls').classList.remove('hidden');
    },

    showGame() { this.hideAll(); document.getElementById('screen-game').classList.remove('hidden'); },

    hideAll() {
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    },

    updateLobbyPlayers(players) {
        const list = document.getElementById('player-list');
        list.innerHTML = "";
        if (!players) return;
        Object.values(players).forEach(p => {
            const div = document.createElement('div');
            div.className = "player-slot";
            div.style.color = p.color;
            div.innerText = `${p.name} (${p.color.toUpperCase()})`;
            list.appendChild(div);
        });
    }
};

window.onload = () => ui.showHome();
