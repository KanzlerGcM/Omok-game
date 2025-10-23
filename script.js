// Constantes do jogo
const BOARD_SIZE = 15;
const CELL_SIZE = 40;
const PADDING = 30;
const PIECE_RADIUS = 16;
const WIN_LENGTH = 5;

// Elementos do DOM
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

// Estado do jogo
let gameState = {
    board: [],
    currentPlayer: 1,
    players: [],
    gameOver: false,
    lastClickTime: 0,
    lastClickPosition: null
};

// Inicialização
startButton.addEventListener('click', startGame);
captureButton.addEventListener('click', captureScreen);
restartButton.addEventListener('click', resetGame);

canvas.addEventListener('click', handleCanvasClick);
canvas.addEventListener('contextmenu', handleRightClick);

// Prevenir menu de contexto padrão
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

function startGame() {
    const player1Name = document.getElementById('player1Name').value.trim();
    const player1Color = document.getElementById('player1Color').value;
    const player2Name = document.getElementById('player2Name').value.trim();
    const player2Color = document.getElementById('player2Color').value;
    
    // Validações
    if (!player1Name || !player2Name) {
        errorMessage.textContent = 'Por favor, digite os nomes dos jogadores.';
        return;
    }
    
    if (player1Color === player2Color) {
        errorMessage.textContent = 'Os jogadores devem escolher cores diferentes.';
        return;
    }
    
    // Configurar jogadores
    gameState.players = [
        { name: player1Name, color: player1Color },
        { name: player2Name, color: player2Color }
    ];
    
    // Inicializar tabuleiro
    initBoard();
    
    // Trocar telas
    setupScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    
    // Desenhar tabuleiro
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
    // Limpar canvas
    ctx.fillStyle = '#daa520';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Desenhar linhas do tabuleiro
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    
    for (let i = 0; i < BOARD_SIZE; i++) {
        // Linhas horizontais
        ctx.beginPath();
        ctx.moveTo(PADDING, PADDING + i * CELL_SIZE);
        ctx.lineTo(PADDING + (BOARD_SIZE - 1) * CELL_SIZE, PADDING + i * CELL_SIZE);
        ctx.stroke();
        
        // Linhas verticais
        ctx.beginPath();
        ctx.moveTo(PADDING + i * CELL_SIZE, PADDING);
        ctx.lineTo(PADDING + i * CELL_SIZE, PADDING + (BOARD_SIZE - 1) * CELL_SIZE);
        ctx.stroke();
    }
    
    // Desenhar pontos de referência
    const starPoints = [3, 7, 11];
    ctx.fillStyle = '#000';
    starPoints.forEach(x => {
        starPoints.forEach(y => {
            ctx.beginPath();
            ctx.arc(PADDING + x * CELL_SIZE, PADDING + y * CELL_SIZE, 4, 0, Math.PI * 2);
            ctx.fill();
        });
    });
    
    // Desenhar peças
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
    ctx.strokeStyle = color === 'white' ? '#000' : '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
}

function handleCanvasClick(e) {
    if (gameState.gameOver) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Encontrar interseção mais próxima
    const col = Math.round((x - PADDING) / CELL_SIZE);
    const row = Math.round((y - PADDING) / CELL_SIZE);
    
    // Verificar se está dentro do tabuleiro
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return;
    
    // Verificar se a posição está vazia
    if (gameState.board[row][col] !== 0) return;
    
    // Colocar peça
    gameState.board[row][col] = gameState.currentPlayer;
    drawBoard();
    
    // Verificar vitória
    if (checkWin(row, col)) {
        gameState.gameOver = true;
        const winner = gameState.players[gameState.currentPlayer - 1];
        winMessage.textContent = `🎉 ${winner.name} venceu! 🎉`;
        winMessage.classList.remove('hidden');
        return;
    }
    
    // Trocar jogador
    gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
    updatePlayerInfo();
}

function handleRightClick(e) {
    e.preventDefault();
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const col = Math.round((x - PADDING) / CELL_SIZE);
    const row = Math.round((y - PADDING) / CELL_SIZE);
    
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return;
    if (gameState.board[row][col] === 0) return;
    
    // Detectar duplo clique direito
    const now = Date.now();
    const position = `${row},${col}`;
    
    if (now - gameState.lastClickTime < 500 && position === gameState.lastClickPosition) {
        // Remover peça
        gameState.board[row][col] = 0;
        drawBoard();
        gameState.lastClickTime = 0;
        gameState.lastClickPosition = null;
    } else {
        gameState.lastClickTime = now;
        gameState.lastClickPosition = position;
    }
}

function checkWin(row, col) {
    const player = gameState.board[row][col];
    const directions = [
        [[0, 1], [0, -1]],   // Horizontal
        [[1, 0], [-1, 0]],   // Vertical
        [[1, 1], [-1, -1]],  // Diagonal \
        [[1, -1], [-1, 1]]   // Diagonal /
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
    const player = gameState.players[gameState.currentPlayer - 1];
    currentPlayerName.textContent = `Vez de: ${player.name}`;
    currentPlayerPiece.style.backgroundColor = player.color;
}

function resetGame() {
    setupScreen.classList.remove('hidden');
    gameScreen.classList.add('hidden');
    errorMessage.textContent = '';
}

async function captureScreen() {
    try {
        // Criar um canvas temporário para captura
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Copiar o conteúdo do canvas do jogo
        tempCtx.drawImage(canvas, 0, 0);
        
        // Converter para blob
        tempCanvas.toBlob(async (blob) => {
            try {
                // Copiar para área de transferência
                await navigator.clipboard.write([
                    new ClipboardItem({
                        'image/png': blob
                    })
                ]);
                
                // Feedback visual
                const originalText = captureButton.textContent;
                captureButton.textContent = '✅ Copiado!';
                captureButton.style.background = '#4caf50';
                
                setTimeout(() => {
                    captureButton.textContent = originalText;
                    captureButton.style.background = '#333';
                }, 2000);
            } catch (err) {
                alert('Erro ao copiar para área de transferência. Seu navegador pode não suportar esta funcionalidade.');
                console.error('Erro ao copiar:', err);
            }
        }, 'image/png');
    } catch (err) {
        alert('Erro ao capturar tela.');
        console.error('Erro:', err);
    }
}