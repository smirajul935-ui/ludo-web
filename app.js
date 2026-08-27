import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, set, get, update, onValue } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyAPug7NEBR9oOuKnmF2m7m7TUiZI9TZVQo",
    authDomain: "ludo-e5cfc.firebaseapp.com",
    databaseURL: "https://ludo-e5cfc-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "ludo-e5cfc",
    storageBucket: "ludo-e5cfc.firebasestorage.app",
    messagingSenderId: "596873684153",
    appId: "1:596873684153:web:89d485c778855904906768"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let myId = Math.random().toString(36).substr(2, 9);
let myColor = null, currentRoom = null, roomData = null;

const COLORS = ['red', 'green', 'yellow', 'blue'];
const OFFSETS = { red: 0, green: 13, yellow: 26, blue: 39 };

// Safe Global Indices on the 52-cell path
const SAFE_INDICES = [0, 8, 13, 21, 26, 34, 39, 47]; 

const PATH = [[13,6],[12,6],[11,6],[10,6],[9,6],[8,5],[8,4],[8,3],[8,2],[8,1],[8,0],[7,0],[6,0],[6,1],[6,2],[6,3],[6,4],[6,5],[5,6],[4,6],[3,6],[2,6],[1,6],[0,6],[0,7],[0,8],[1,8],[2,8],[3,8],[4,8],[5,8],[6,9],[6,10],[6,11],[6,12],[6,13],[6,14],[7,14],[8,14],[8,13],[8,12],[8,11],[8,10],[8,9],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[14,7],[14,6]];
const HOME_PATHS = {
    red: [[13,7],[12,7],[11,7],[10,7],[9,7],[8,7]],
    green: [[7,1],[7,2],[7,3],[7,4],[7,5],[7,6]],
    yellow: [[1,7],[2,7],[3,7],[4,7],[5,7],[6,7]],
    blue: [[7,13],[7,12],[7,11],[7,10],[7,9],[7,8]]
};
const BASES = {
    red: [[11,2],[11,3],[12,2],[12,3]],
    green: [[2,2],[2,3],[3,2],[3,3]],
    yellow: [[2,11],[2,12],[3,11],[3,12]],
    blue: [[11,11],[11,12],[12,11],[12,12]]
};

const btnRoll = document.getElementById('roll-btn');

// --- Game Logic Functions ---

async function moveToken(tokenIndex, currentPos) {
    const dice = roomData.dice;
    let newPos = currentPos === -1 ? 0 : currentPos + dice;
    
    if (newPos > 56) return; // Cannot move beyond finish

    let updates = {};
    let isCapture = false;

    // Check Capture Logic only if on Common Path (0-50)
    if (newPos >= 0 && newPos <= 50) {
        let globalIndex = (newPos + OFFSETS[myColor]) % 52;

        // If NOT a safe zone, check for opponents
        if (!SAFE_INDICES.includes(globalIndex)) {
            COLORS.forEach(enemyColor => {
                if (enemyColor !== myColor && roomData.players[enemyColor]) {
                    roomData.tokens[enemyColor].forEach((ePos, eIdx) => {
                        if (ePos >= 0 && ePos <= 50) {
                            let eGlobal = (ePos + OFFSETS[enemyColor]) % 52;
                            if (eGlobal === globalIndex) {
                                // Guti Cut Gayi!
                                isCapture = true;
                                updates[`rooms/${currentRoom}/tokens/${enemyColor}/${eIdx}`] = -1;
                            }
                        }
                    });
                }
            });
        }
    }

    // Update moved token position
    updates[`rooms/${currentRoom}/tokens/${myColor}/${tokenIndex}`] = newPos;

    // Check if player won
    let currentTokens = [...roomData.tokens[myColor]];
    currentTokens[tokenIndex] = newPos;
    if (currentTokens.every(p => p === 56)) {
        updates[`rooms/${currentRoom}/winner`] = myColor;
        updates[`rooms/${currentRoom}/status`] = 'finished';
    }

    await update(ref(db), updates);

    // Switch Turn Logic: Extra turn if Dice is 6 OR if a guti was captured
    const getsExtraTurn = (dice === 6 || isCapture);
    switchTurn(getsExtraTurn);
}

async function switchTurn(extraTurn) {
    let updates = { diceRolled: false };
    if (!extraTurn) {
        const active = roomData.activePlayers;
        let currentIndex = active.indexOf(myColor);
        let nextIndex = (currentIndex + 1) % active.length;
        updates.turn = active[nextIndex];
    }
    // If extraTurn is true, 'turn' remains same player
    await update(ref(db, `rooms/${currentRoom}`), updates);
}

// --- Firebase Sync & UI ---

function listen() {
    onValue(ref(db, `rooms/${currentRoom}`), (snap) => {
        roomData = snap.val();
        if(!roomData) return;
        
        document.getElementById('display-room-code').innerText = currentRoom;
        const list = document.getElementById('player-list');
        list.innerHTML = '';
        Object.keys(roomData.players).forEach(c => {
            list.innerHTML += `<li><span style="color:var(--${c})">👤 ${roomData.players[c].name}</span></li>`;
        });

        if(myColor === 'red' && Object.keys(roomData.players).length >= 2) 
            document.getElementById('start-btn').classList.remove('hidden');

        if(roomData.status === 'playing'){
            showScreen('game');
            updateUI();
        }
    });
}

function updateUI() {
    document.getElementById('my-color-text').innerText = myColor.toUpperCase();
    document.getElementById('my-color-text').style.color = `var(--${myColor})`;
    document.getElementById('current-turn-text').innerText = roomData.turn.toUpperCase();
    document.getElementById('current-turn-text').style.color = `var(--${roomData.turn})`;
    document.getElementById('dice-value').innerText = roomData.dice;

    // Roll Button highlight
    if(roomData.turn === myColor && !roomData.diceRolled) {
        btnRoll.disabled = false;
        btnRoll.classList.add('active-roll');
    } else {
        btnRoll.disabled = true;
        btnRoll.classList.remove('active-roll');
    }
    renderTokens();

    if(roomData.winner) {
        document.getElementById('winner-modal').classList.remove('hidden');
        document.getElementById('winner-text').innerText = `${roomData.winner.toUpperCase()} WINS! 🎉`;
    }
}

async function rollDice() {
    btnRoll.disabled = true;
    let diceVal = Math.floor(Math.random() * 6) + 1;
    
    // Dice Animation (Local)
    let count = 0;
    let anim = setInterval(async () => {
        document.getElementById('dice-value').innerText = Math.floor(Math.random() * 6) + 1;
        if(count++ > 8) {
            clearInterval(anim);
            // Send result to Firebase
            await update(ref(db, `rooms/${currentRoom}`), { dice: diceVal, diceRolled: true });
            
            // Auto switch if no moves possible
            let hasMove = roomData.tokens[myColor].some(p => (p === -1 && diceVal === 6) || (p !== -1 && p + diceVal <= 56));
            if(!hasMove) setTimeout(() => switchTurn(false), 1200);
        }
    }, 50);
}

function renderTokens() {
    const container = document.getElementById('tokens-container');
    container.innerHTML = '';
    COLORS.forEach(c => {
        if(!roomData.players[c]) return;
        roomData.tokens[c].forEach((pos, i) => {
            if (pos === 56) return; // Hide finished gutis or show at center
            const coords = getCoords(c, pos, i);
            const t = document.createElement('div');
            t.className = `token ${c}`;
            t.style.left = `${(coords[1]/15)*100}%`;
            t.style.top = `${(coords[0]/15)*100}%`;
            t.style.backgroundColor = `var(--${c})`;
            
            // Interaction: Highlight if it's my turn and guti can move
            if(roomData.turn === myColor && c === myColor && roomData.diceRolled) {
                const canMove = (pos === -1 && roomData.dice === 6) || (pos !== -1 && pos + roomData.dice <= 56);
                if(canMove) {
                    t.classList.add('token-active');
                    t.onclick = () => moveToken(i, pos);
                }
            }
            container.appendChild(t);
        });
    });
}

// --- Utils ---

function getCoords(c, p, i) {
    if(p === -1) return BASES[c][i];
    if(p <= 50) return PATH[(p + OFFSETS[c]) % 52];
    if(p <= 56) return HOME_PATHS[c][p-51];
    return [7,7];
}

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(id + '-screen').classList.remove('hidden');
}

async function createRoom() {
    const name = document.getElementById('player-name').value || "Sagar";
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    currentRoom = code; myColor = 'red';
    await set(ref(db, `rooms/${code}`), {
        status: 'waiting', turn: 'red', dice: 1, diceRolled: false,
        players: { red: {id: myId, name: name} },
        tokens: { red: [-1,-1,-1,-1], green: [-1,-1,-1,-1], yellow: [-1,-1,-1,-1], blue: [-1,-1,-1,-1] },
        activePlayers: ['red']
    });
    listen();
    showScreen('lobby');
}

async function joinRoom() {
    const code = document.getElementById('room-code-input').value;
    const name = document.getElementById('player-name').value || "Guest";
    const snap = await get(ref(db, `rooms/${code}`));
    if(snap.exists()){
        let data = snap.val();
        let color = COLORS.find(c => !data.players[c]);
        if(!color) return alert("Full!");
        const up = {};
        up[`rooms/${code}/players/${color}`] = {id: myId, name: name};
        up[`rooms/${code}/activePlayers`] = [...data.activePlayers, color];
        await update(ref(db), up);
        currentRoom = code; myColor = color;
        listen();
        showScreen('lobby');
    }
}

function initBoard() {
    const b = document.getElementById('ludo-board');
    b.innerHTML = '';
    for(let r=0; r<15; r++){
        for(let c=0; c<15; c++){
            let d = document.createElement('div');
            d.className = 'cell';
            if(r<6 && c<6) d.classList.add('bg-green');
            else if(r<6 && c>8) d.classList.add('bg-yellow');
            else if(r>8 && c<6) d.classList.add('bg-red');
            else if(r>8 && c>8) d.classList.add('bg-blue');
            else if(r>=6 && r<=8 && c>=6 && c<=8) d.style.background = '#333';
            const safeCoords = ['13,6','8,2','6,1','2,6','1,8','6,12','8,13','12,8'];
            if(safeCoords.includes(`${r},${c}`)) d.classList.add('bg-safe');
            b.appendChild(d);
        }
    }
}

document.getElementById('create-btn').onclick = createRoom;
document.getElementById('join-btn').onclick = joinRoom;
btnRoll.onclick = rollDice;
document.getElementById('start-btn').onclick = () => update(ref(db, `rooms/${currentRoom}`), {status:'playing'});

initBoard();
