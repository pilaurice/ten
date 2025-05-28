// =================================================================
// CORE GAME LOGIC - js/game.js
// =================================================================

// Game state variables
let currentPlayer = 'X';
let nextBoard = null; // null means any board can be played
let gameBoard = Array(9).fill(null).map(() => Array(9).fill(null));
let boardWinners = Array(9).fill(null);
let gameWinner = null;
let lastPlayedCell = null;
let isAIGame = false;
let aiDifficulty = null;

// =================================================================
// GAME STATE MANAGEMENT
// =================================================================

/**
 * Reset all game variables to initial state
 */
function resetGameState() {
    currentPlayer = 'X';
    nextBoard = null;
    gameBoard = Array(9).fill(null).map(() => Array(9).fill(null));
    boardWinners = Array(9).fill(null);
    gameWinner = null;
    lastPlayedCell = null;
}

/**
 * Set the current game mode
 */
function setGameMode(mode, difficulty = null) {
    isAIGame = mode === 'ai';
    aiDifficulty = difficulty;
}

/**
 * Get current game mode info
 */
function getGameMode() {
    return {
        isAI: isAIGame,
        difficulty: aiDifficulty,
        mode: isAIGame ? aiDifficulty : '2player'
    };
}

// =================================================================
// MOVE VALIDATION & EXECUTION
// =================================================================

/**
 * Check if a move is valid
 */
function isValidMove(boardIndex, cellIndex) {
    // Bounds checking
    if (boardIndex < 0 || boardIndex > 8 || cellIndex < 0 || cellIndex > 8) {
        return false;
    }
    
    // Can't play if game is won or drawn
    if (gameWinner || isGameDraw()) return false;
    
    // Can't play in won boards
    if (boardWinners[boardIndex]) return false;
    
    // Can't play in occupied cells
    if (gameBoard[boardIndex][cellIndex]) return false;
    
    // Must play in the correct board if specified
    if (nextBoard !== null && boardIndex !== nextBoard) return false;
    
    return true;
}

/**
 * Execute a move and update game state
 */
function executeMove(boardIndex, cellIndex, player) {
    // Make the move
    gameBoard[boardIndex][cellIndex] = player;
    
    // Check if this mini-board is won
    if (!boardWinners[boardIndex]) {
        const winner = checkBoardWinner(boardIndex);
        if (winner) {
            boardWinners[boardIndex] = winner;
            
            // Check if the game is won
            const gameWin = checkGameWinner();
            if (gameWin) {
                gameWinner = gameWin.winner;
                return {
                    type: 'game_won',
                    winner: gameWin.winner,
                    winningBoards: gameWin.winningBoards
                };
            }
        }
    }
    
    // Check for draw
    if (!gameWinner && isGameDraw()) {
        return { type: 'game_draw' };
    }
    
    // Continue game - determine next board and switch players
    if (!gameWinner && !isGameDraw()) {
        nextBoard = boardWinners[cellIndex] || isBoardFull(cellIndex) ? null : cellIndex;
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        
        return {
            type: 'continue',
            nextPlayer: currentPlayer,
            nextBoard: nextBoard
        };
    }
    
    return { type: 'continue' };
}

// =================================================================
// WINNING CONDITIONS
// =================================================================

/**
 * Check if a mini-board has a winner
 */
function checkBoardWinner(boardIndex) {
    const board = gameBoard[boardIndex];
    if (!board) return null;
    
    const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
        [0, 4, 8], [2, 4, 6] // diagonals
    ];
    
    for (const line of lines) {
        const [a, b, c] = line;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    
    return null;
}

/**
 * Check if the overall game has a winner
 */
function checkGameWinner() {
    const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
        [0, 4, 8], [2, 4, 6] // diagonals
    ];
    
    for (const line of lines) {
        const [a, b, c] = line;
        if (boardWinners[a] && boardWinners[a] === boardWinners[b] && boardWinners[a] === boardWinners[c]) {
            return {
                winner: boardWinners[a],
                winningBoards: [a, b, c]
            };
        }
    }
    
    return null;
}

/**
 * Check if a board is full
 */
function isBoardFull(boardIndex) {
    if (boardIndex < 0 || boardIndex > 8) return false;
    return gameBoard[boardIndex].every(cell => cell !== null);
}

/**
 * Check if game is a draw
 */
function isGameDraw() {
    // Game is a draw if all boards are either won or full and no winner
    for (let i = 0; i < 9; i++) {
        if (!boardWinners[i] && !isBoardFull(i)) {
            return false;
        }
    }
    return !gameWinner;
}

// =================================================================
// GAME INFORMATION GETTERS
// =================================================================

/**
 * Get current game state for external access
 */
function getGameState() {
    return {
        currentPlayer,
        nextBoard,
        gameBoard: JSON.parse(JSON.stringify(gameBoard)), // Deep copy
        boardWinners: [...boardWinners],
        gameWinner,
        isGameOver: gameWinner !== null || isGameDraw(),
        isDraw: isGameDraw()
    };
}

/**
 * Get valid moves for current game state
 */
function getValidMoves() {
    const validMoves = [];
    
    if (nextBoard !== null && nextBoard >= 0 && nextBoard <= 8 && !boardWinners[nextBoard]) {
        // Specific board constraint
        for (let i = 0; i < 9; i++) {
            if (!gameBoard[nextBoard][i]) {
                validMoves.push({ board: nextBoard, cell: i });
            }
        }
    } else {
        // Any available board
        for (let b = 0; b < 9; b++) {
            if (!boardWinners[b]) {
                for (let c = 0; c < 9; c++) {
                    if (!gameBoard[b][c]) {
                        validMoves.push({ board: b, cell: c });
                    }
                }
            }
        }
    }
    
    return validMoves;
}

/**
 * Count total moves played
 */
function getTotalMoves() {
    let count = 0;
    for (let b = 0; b < 9; b++) {
        for (let c = 0; c < 9; c++) {
            if (gameBoard[b] && gameBoard[b][c]) {
                count++;
            }
        }
    }
    return count;
}

/**
 * Get game progress as percentage (0-1)
 */
function getGameProgress() {
    return getTotalMoves() / 81;
}

// =================================================================
// UTILITY FUNCTIONS
// =================================================================

/**
 * Check if a player can win a specific board on their next move
 */
function canWinBoard(boardIndex, player) {
    if (boardIndex < 0 || boardIndex > 8 || !gameBoard[boardIndex]) return false;
    
    const board = gameBoard[boardIndex];
    const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];
    
    for (const line of lines) {
        const values = line.map(i => board[i]);
        const playerCount = values.filter(v => v === player).length;
        const emptyCount = values.filter(v => v === null).length;
        
        if (playerCount === 2 && emptyCount === 1) {
            return true;
        }
    }
    
    return false;
}

/**
 * Count empty cells in a board
 */
function countEmptyCells(boardIndex) {
    if (boardIndex < 0 || boardIndex > 8 || !gameBoard[boardIndex]) return 0;
    
    let count = 0;
    for (let i = 0; i < 9; i++) {
        if (!gameBoard[boardIndex][i]) count++;
    }
    return count;
}

/**
 * Count active (playable) boards
 */
function countActiveBoards() {
    let count = 0;
    for (let i = 0; i < 9; i++) {
        if (!boardWinners[i] && !isBoardFull(i)) {
            count++;
        }
    }
    return count;
}