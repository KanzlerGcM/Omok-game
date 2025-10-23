const BOARD_SIZE = 15;
const CELL_SIZE = 50;
const PADDING = 40;
const PIECE_RADIUS = 20;
const WIN_LENGTH = 5;
const CLICK_TOLERANCE = 15;

// Traduções
const translations = {
    en: {
        title: "Omok (Gomoku)",
        player1Name: "Player 1 Name:",
        player1Color: "Player 1 Color:",
        player2Name: "Player 2 Name:",
        player2Color: "Player 2 Color:",
        startGame: "Start Game",
        capture: "📸 Capture Screen",
        newGame: "🔄 New Game",
        turn: "Turn:",
        won: "won!",
        errorNames: "Please enter both player names.",
        errorColors: "Players must choose different colors.",
        player1Default: "Player 1",
        player2Default: "Player 2",
        captured: "✅ Captured!"
    },
    pt: {
        title: "Omok (Gomoku)",
        player1Name: "Nome do Jogador 1:",
        player1Color: "Cor do Jogador 1:",
        player2Name: "Nome do Jogador 2:",
        player2Color: "Cor do Jogador 2:",
        startGame: "Iniciar Jogo",
        capture: "📸 Capturar Tela",
        newGame: "🔄 Novo Jogo",
        turn: "Vez de:",
        won: "venceu!",
        errorNames: "Por favor, digite os nomes dos jogadores.",
        errorColors: "Os jogadores devem escolher cores diferentes.",
        player1Default: "Jogador 1",
        player2Default: "Jogador 2",
        captured: "✅ Copiado!"
    },
    ko: {
        title: "오목 (Gomoku)",
        player1Name: "플레이어 1 이름:",
        player1Color: "플레이어 1 색상:",
        player2Name: "플레이어 2 이름:",
        player2Color: "플레이어 2 색상:",
        startGame: "게임 시작",
        capture: "📸 화면 캡처",
        newGame: "🔄 새 게임",
        turn: "차례:",
        won: "승리!",
        errorNames: "두 플레이어의 이름을 입력하세요.",
        errorColors: "플레이어는 서로 다른 색상을 선택해야 합니다.",
        player1Default: "플레이어 1",
        player2Default: "플레이어 2",
        captured: "✅ 캡처됨!"
    }
};

let currentLang = 'en';

const setupScreen = document.getElementById('setupScreen');
const gameScreen = document.getElementById('gameScreen');
const startButton = document.getElementById('startButton');
const captureButton = document.getElementById('captureButton');
const restartButton = document.getElementById('restartButton');
const errorMessage = document.getElementById('errorMessage');
const canvas = document.getElementById('gameBoard');
const ctx = canvas.getContext('2d');
const currentPlayerName = document.getElementById('currentPlayerName');
const currentPlayerPiece = document.getElementById('currentPlayerPiece');
const winMessage = document.getElementById('winMessage');

let gameState = {
    board: [],
    currentPlayer: 1,
    players: [],
    gameOver: false,
    lastClickTime: 0,
    lastClickPosition: null
};

// Event Listeners
document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentLang = this.getAttribute('data-lang');
        updateLanguage();
    });
});

startButton.addEventListener('click', startGame);
captureButton.addEventListener('click', captureScreen);
restartButton.addEventListener('click', resetGame);

// Suporte para touch e mouse
canvas.addEventListener('click', handleCanvasClick);
canvas.addEventListener('touchstart', handleTouchStart);
canvas.addEventListener('contextmenu', handleRightClick);
canvas.addEventListener('touchend', handleTouchEnd);
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

let touchStartTime = 0;
let touchTimeout = null;

function handleTouchStart(e) {
    e.preventDefault();
    touchStartTime = Date.now();
    const touch = e.touches[0];
    
    touchTimeout = setTimeout(() => {
        handleRightClickTouch(touch);
    }, 500);
}

function handleTouchEnd(e) {
    e.preventDefault();
    clearTimeout(touchTimeout);
    
    if (Date.now() - touchStartTime < 500) {
        const touch = e.changedTouches[0];
        handleCanvasTap(touch);
    }
}

function handleCanvasTap(touch) {
    if (gameState.gameOver) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    placePiece(x, y);
}

function handleRightClickTouch(touch) {
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    removePiece(x, y);
}

// Atualizar idioma
function updateLanguage() {
    const trans = translations[currentLang];
    document.querySelectorAll('[data-i18n]').forEach(elem => {
        const key = elem.getAttribute('data-i18n');
        if (trans[key]) {
            if (elem.tagName === 'INPUT') {
                elem.value = trans[key];
            } else {
                elem.textContent = trans[key];
            }
        }
    });
    
    document.getElementById('player1Name').value = trans.player1Default;
    document.getElementById('player2Name').value = trans.player2Default;
}

function startGame() {
    const trans = translations[currentLang];
    const player1Name = document.getElementById('player1Name').value.trim();
    const player1ColorElem = document.querySelector('input[name="player1Color"]:checked');
    const player2Name = document.getElementById('player2Name').value.trim();
    const player2ColorElem = document.querySelector('input[name="player2Color"]:checked');
    
    if (!player1ColorElem || !player2ColorElem) {
        errorMessage.textContent = trans.errorColors;
        return;
    }
    
    const player1Color = player1ColorElem.value;
    const player2Color = player2ColorElem.value;
    
    if (!player1Name || !player2Name) {
        errorMessage.textContent = trans.errorNames;
        return;
    }
    
    if (player1Color === player2Color) {
        errorMessage.textContent = trans.errorColors;
        return;
    }
    
    gameState.players = [
        { name: player1Name, color: player1Color },
        { name: player2Name, color: player2Color }
    ];
    
    initBoard();
    setupScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    drawBoard();
    updatePlayerInfo();
}

function initBoard() {
    canvas.width = BOARD_SIZE * CELL_SIZE + PADDING * 2;
    canvas.height = BOARD_SIZE * CELL_SIZE + PADDING * 2;
    gameState.board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0));
    gameState.currentPlayer = 1;
    gameState.gameOver = false;
    winMessage.classList.add('hidden');
}

function drawBoard() {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < BOARD_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(PADDING, PADDING + i * CELL_SIZE);
        ctx.lineTo(PADDING + (BOARD_SIZE - 1) * CELL_SIZE, PADDING + i * CELL_SIZE);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(PADDING + i * CELL_SIZE, PADDING);
        ctx.lineTo(PADDING + i * CELL_SIZE, PADDING + (BOARD_SIZE - 1) * CELL_SIZE);
        ctx.stroke();
    }
    
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (gameState.board[row][col] !== 0) {
                drawPiece(row, col, gameState.board[row][col]);
            }
        }
    }
}

function drawPiece(row, col, player) {
    const x = PADDING + col * CELL_SIZE;
    const y = PADDING + row * CELL_SIZE;
    const color = gameState.players[player - 1].color;
    
    ctx.beginPath();
    ctx.arc(x, y, PIECE_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.stroke();
}

function placePiece(x, y) {
    const col = Math.round((x - PADDING) / CELL_SIZE);
    const row = Math.round((y - PADDING) / CELL_SIZE);
    
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return;
    
    const intersectionX = PADDING + col * CELL_SIZE;
    const intersectionY = PADDING + row * CELL_SIZE;
    
    const distance = Math.sqrt(
        Math.pow(x - intersectionX, 2) + Math.pow(y - intersectionY, 2)
    );
    
    if (distance > CLICK_TOLERANCE) return;
    
    if (gameState.board[row][col] !== 0) return;
    
    gameState.board[row][col] = gameState.currentPlayer;
    drawBoard();
    
    if (checkWin(row, col)) {
        gameState.gameOver = true;
        const winner = gameState.players[gameState.currentPlayer - 1];
        const trans = translations[currentLang];
        winMessage.textContent = `🎉 ${winner.name} ${trans.won} 🎉`;
        winMessage.classList.remove('hidden');
        return;
    }
    
    gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
    updatePlayerInfo();
}

function removePiece(x, y) {
    const col = Math.round((x - PADDING) / CELL_SIZE);
    const row = Math.round((y - PADDING) / CELL_SIZE);
    
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return;
    if (gameState.board[row][col] === 0) return;
    
    const now = Date.now();
    const position = `${row},${col}`;
    
    if (now - gameState.lastClickTime < 500 && position === gameState.lastClickPosition) {
        gameState.board[row][col] = 0;
        drawBoard();
        gameState.lastClickTime = 0;
        gameState.lastClickPosition = null;
    } else {
        gameState.lastClickTime = now;
        gameState.lastClickPosition = position;
    }
}

function handleCanvasClick(e) {
    if (gameState.gameOver) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    placePiece(x, y);
}

function handleRightClick(e) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    removePiece(x, y);
}

function checkWin(row, col) {
    const player = gameState.board[row][col];
    const directions = [
        [[0, 1], [0, -1]],
        [[1, 0], [-1, 0]],
        [[1, 1], [-1, -1]],
        [[1, -1], [-1, 1]]
    ];
    
    for (let dir of directions) {
        let count = 1;
        for (let [dx, dy] of dir) {
            let r = row + dx;
            let c = col + dy;
            while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && 
                   gameState.board[r][c] === player) {
                count++;
                r += dx;
                c += dy;
            }
        }
        if (count >= WIN_LENGTH) return true;
    }
    return false;
}

function updatePlayerInfo() {
    const trans = translations[currentLang];
    const player = gameState.players[gameState.currentPlayer - 1];
    currentPlayerName.textContent = `${trans.turn} ${player.name}`;
    currentPlayerPiece.style.backgroundColor = player.color;
}

function resetGame() {
    setupScreen.classList.remove('hidden');
    gameScreen.classList.add('hidden');
    errorMessage.textContent = '';
}

async function captureScreen() {
    const trans = translations[currentLang];
    try {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(canvas, 0, 0);
        
        tempCanvas.toBlob(async (blob) => {
            try {
                await navigator.clipboard.write([
                    new ClipboardItem({'image/png': blob})
                ]);
                const originalText = captureButton.textContent;
                captureButton.textContent = trans.captured;
                captureButton.style.background = '#4caf50';
                setTimeout(() => {
                    captureButton.textContent = originalText;
                    captureButton.style.background = '#333';
                }, 2000);
            } catch (err) {
                alert('Error copying to clipboard.');
            }
        }, 'image/png');
    } catch (err) {
        alert('Error capturing screen.');
    }
}

// Inicializar idioma
updateLanguage();
