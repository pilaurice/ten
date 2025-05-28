// =================================================================
// USER INTERFACE & DOM MANAGEMENT - js/ui.js
// =================================================================

// UI state and controls
let clickDebounce = false;
let gameResultTimeout = null;

// DOM cache for better performance
const domCache = {
    mainBoard: null,
    turnText: null,
    aiThinking: null,
    playAgain: null,
    modal: null,
    toast: null
};

// =================================================================
// DOM INITIALIZATION
// =================================================================

/**
 * Initialize DOM cache for faster element access
 */
function initializeDOMCache() {
    domCache.mainBoard = document.querySelector('.main-board');
    domCache.turnText = document.querySelector('.turn-text');
    domCache.aiThinking = document.querySelector('.ai-thinking');
    domCache.playAgain = document.querySelector('.play-again');
    domCache.modal = document.getElementById('howToPlayModal');
    domCache.toast = document.getElementById('toast');
}

/**
 * Initialize event listeners
 */
function initializeEventListeners() {
    // Play again button keyboard support
    const playAgainBtn = domCache.playAgain;
    if (playAgainBtn) {
        playAgainBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                resetGame();
            }
        });
    }

    // Modal close events
    const modal = domCache.modal;
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeHowToPlay();
            }
        });
    }

    // Escape key to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && modal.classList.contains('show')) {
            closeHowToPlay();
        }
    });
}

// =================================================================
// BOARD MANAGEMENT
// =================================================================

/**
 * Initialize the game board with DOM elements
 */
function initializeBoard(animate = false) {
    // Clean up existing board
    cleanupBoard();
    
    const mainBoard = domCache.mainBoard;
    if (!mainBoard) return;
    
    mainBoard.innerHTML = '';

    for (let boardIndex = 0; boardIndex < 9; boardIndex++) {
        const miniBoard = document.createElement('div');
        miniBoard.className = 'mini-board';
        miniBoard.setAttribute('role', 'group');
        miniBoard.setAttribute('aria-label', `Mini board ${boardIndex + 1}`);
        
        if (animate) {
            miniBoard.classList.add('fade-in');
            miniBoard.style.animationDelay = `${boardIndex * 0.1}s`;
        }
        miniBoard.id = `board-${boardIndex}`;
        
        for (let cellIndex = 0; cellIndex < 9; cellIndex++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.board = boardIndex;
            cell.dataset.cell = cellIndex;
            
            // Add cross-2 span for X marks
            const cross2 = document.createElement('span');
            cross2.className = 'cross-2';
            cell.appendChild(cross2);
            
            cell.addEventListener('click', handleCellClick);
            miniBoard.appendChild(cell);
        }
        
        mainBoard.appendChild(miniBoard);
    }
    
    clearLastPlayedCell();
    updateBoardStates();
}

/**
 * Clean up existing board event listeners
 */
function cleanupBoard() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        const newCell = cell.cloneNode(true);
        cell.parentNode.replaceChild(newCell, cell);
    });
}

/**
 * Update visual states of all mini-boards
 */
function updateBoardStates() {
    const boards = document.querySelectorAll('.mini-board');
    const gameState = getGameState();
    
    boards.forEach((board, i) => {
        if (gameState.isGameOver) {
            // Game is over - all boards become inactive
            board.classList.remove('active');
            board.classList.add('inactive');
        } else if (gameState.boardWinners[i] || isBoardFull(i)) {
            // Board is won or full - cannot be played in
            board.classList.remove('active');
            board.classList.remove('inactive');
        } else if (gameState.nextBoard === null || gameState.nextBoard === i) {
            // Board is available for play
            board.classList.add('active');
            board.classList.remove('inactive');
        } else {
            // Board is not currently playable
            board.classList.remove('active');
            board.classList.add('inactive');
        }
    });
}

// =================================================================
// MOVE HANDLING & VISUAL UPDATES
// =================================================================

/**
 * Handle cell click events
 */
function handleCellClick(event) {
    // Debounce rapid clicks
    if (clickDebounce) return;
    
    const gameMode = getGameMode();
    const gameState = getGameState();
    
    // Prevent clicks during AI turn or if game is over
    if ((gameMode.isAI && gameState.currentPlayer === 'O') || gameState.isGameOver) {
        return;
    }
    
    const cell = event.currentTarget;
    const boardIndex = parseInt(cell.dataset.board);
    const cellIndex = parseInt(cell.dataset.cell);
    
    // Validate move
    if (!isValidMove(boardIndex, cellIndex)) {
        return;
    }
    
    // Set debounce
    clickDebounce = true;
    setTimeout(() => { clickDebounce = false; }, 300);
    
    // Track move event
    trackGameEvent('move', gameMode.mode);
    
    // Execute the move
    makeMove(boardIndex, cellIndex, cell);
}

/**
 * Execute a move and update the UI
 */
function makeMove(boardIndex, cellIndex, cell) {
    const gameState = getGameState();
    
    // Clear previous last played cell
    clearLastPlayedCell();
    
    // Execute the move in game logic
    const result = executeMove(boardIndex, cellIndex, gameState.currentPlayer);
    
    // Update the visual cell
    cell.classList.add(gameState.currentPlayer === 'X' ? 'x-mark' : 'o-mark');
    cell.classList.add('last-played');
    cell.setAttribute('aria-label', `Board ${boardIndex + 1}, Cell ${cellIndex + 1}, ${gameState.currentPlayer}`);
    cell.setAttribute('aria-pressed', 'true');
    lastPlayedCell = cell;
    
    // Handle the result
    switch (result.type) {
        case 'game_won':
            handleGameWon(result);
            break;
        case 'game_draw':
            handleGameDraw();
            break;
        case 'continue':
            handleGameContinue(result);
            break;
    }
}

/**
 * Handle game won state
 */
function handleGameWon(result) {
    // Display board winner if a new board was won
    const newBoardWon = boardWinners.findIndex((winner, index) => 
        winner && !document.getElementById(`board-${index}`).classList.contains('won')
    );
    
    if (newBoardWon !== -1) {
        displayBoardWinner(newBoardWon, result.winner);
    }
    
    // Mark winning tiles with animation
    markWinningTiles(result.winningBoards);
    updateGameOverState();
    updateBoardStates();
    
    // Track game end
    const gameMode = getGameMode();
    trackGameEvent('game_end', gameMode.mode);
    if (result.winner === 'X') {
        trackGameEvent('player_win', gameMode.mode);
    } else if (gameMode.isAI) {
        trackGameEvent('ai_win', gameMode.difficulty);
    }
}

/**
 * Handle game draw state
 */
function handleGameDraw() {
    // Debounce game result to prevent race conditions
    if (!gameResultTimeout) {
        gameResultTimeout = setTimeout(() => {
            const gameState = getGameState();
            if (!gameState.gameWinner && gameState.isDraw) {
                updateGameOverState(true);
                updateBoardStates();
                trackGameEvent('game_draw', getGameMode().mode);
            }
            gameResultTimeout = null;
        }, 100);
    }
}

/**
 * Handle game continue state
 */
function handleGameContinue(result) {
    // Update turn indicator
    document.body.className = result.nextPlayer === 'X' ? 'x-turn' : 'o-turn';
    updateTurnText();
    
    // Update board states
    updateBoardStates();
    
    // Schedule AI move if needed
    const gameMode = getGameMode();
    if (gameMode.isAI && result.nextPlayer === 'O') {
        scheduleAIMove(
            (chosenMove) => {
                const cell = document.querySelector(`[data-board="${chosenMove.board}"][data-cell="${chosenMove.cell}"]`);
                if (cell && isValidMove(chosenMove.board, chosenMove.cell)) {
                    makeMove(chosenMove.board, chosenMove.cell, cell);
                }
            },
            () => showAIThinking(),
            () => hideAIThinking()
        );
    }
}

// =================================================================
// VISUAL EFFECTS & ANIMATIONS
// =================================================================

/**
 * Display winner overlay on mini-board
 */
function displayBoardWinner(boardIndex, winner) {
    const board = document.getElementById(`board-${boardIndex}`);
    if (!board) return;
    
    board.classList.add('won');
    board.setAttribute('aria-label', `Mini board ${boardIndex + 1} won by ${winner}`);
    
    const winnerElement = document.createElement('div');
    winnerElement.className = winner === 'X' ? 'big-x' : 'big-o';
    winnerElement.setAttribute('aria-label', `${winner} wins this board`);
    board.appendChild(winnerElement);
}

/**
 * Mark the winning tiles with animation
 */
function markWinningTiles(winningBoards) {
    const sortedBoards = [...winningBoards].sort((a, b) => a - b);
    
    sortedBoards.forEach((boardIndex, index) => {
        const board = document.getElementById(`board-${boardIndex}`);
        if (!board) return;
        
        const winnerTile = board.querySelector('.big-x, .big-o');
        if (winnerTile) {
            const delay = 0.25 + (index * 0.15);
            winnerTile.style.setProperty('--pulse-delay', `${delay}s`);
            winnerTile.classList.add('winning');
        }
    });
}

/**
 * Clear last played cell highlighting
 */
function clearLastPlayedCell() {
    if (lastPlayedCell) {
        lastPlayedCell.classList.remove('last-played');
        lastPlayedCell = null;
    }
}

// =================================================================
// GAME STATE UI UPDATES
// =================================================================

/**
 * Update game over state visuals
 */
function updateGameOverState(isDraw = false) {
    clearAITimeouts();
    clearTimeout(gameResultTimeout);
    
    const turnText = domCache.turnText;
    if (!turnText) return;
    
    if (isDraw) {
        document.body.className = 'draw';
        turnText.textContent = 'Draw';
        announceGameResult('Game ended in a draw');
    } else {
        const gameState = getGameState();
        document.body.className = gameState.gameWinner === 'X' ? 'x-wins' : 'o-wins';
        turnText.textContent = 'Wins';
        announceGameResult(`${gameState.gameWinner} wins the game`);
    }
}

/**
 * Update turn text display
 */
function updateTurnText() {
    const turnText = domCache.turnText;
    if (!turnText) return;
    
    const gameMode = getGameMode();
    const gameState = getGameState();
    
    if (gameMode.isAI) {
        turnText.textContent = gameState.currentPlayer === 'X' ? 'Your turn' : "AI's turn";
    } else {
        turnText.textContent = 'Your turn';
    }
}

/**
 * Announce game result for screen readers
 */
function announceGameResult(message) {
    // Remove any existing announcements first
    const existingAnnouncements = document.querySelectorAll('.game-announcement');
    existingAnnouncements.forEach(el => el.remove());
    
    const announcement = document.createElement('div');
    announcement.className = 'sr-only game-announcement';
    announcement.setAttribute('role', 'alert');
    announcement.textContent = message;
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
        announcement.remove();
    }, 1000);
}

// =================================================================
// AI THINKING INDICATOR
// =================================================================

/**
 * Show AI thinking indicator
 */
function showAIThinking() {
    const thinkingEl = domCache.aiThinking;
    if (thinkingEl) {
        thinkingEl.classList.add('show');
    }
}

/**
 * Hide AI thinking indicator
 */
function hideAIThinking() {
    const thinkingEl = domCache.aiThinking;
    if (thinkingEl) {
        thinkingEl.classList.remove('show');
    }
}

// =================================================================
// NAVIGATION & MODALS
// =================================================================

/**
 * Show how to play modal
 */
function showHowToPlay() {
    const modal = domCache.modal;
    if (!modal) return;
    
    trackGameEvent('how_to_play_opened');
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

/**
 * Close how to play modal
 */
function closeHowToPlay() {
    const modal = domCache.modal;
    if (!modal) return;
    
    modal.classList.remove('show');
    document.body.style.overflow = '';
}

/**
 * Navigate to home screen
 */
function goToHome() {
    // Reset game state
    resetGame();
    
    // Show splash screen
    document.body.classList.add('splash-visible');
    document.body.classList.remove('x-turn', 'o-turn', 'x-wins', 'o-wins', 'draw', 'ai-difficulty-visible');
    
    // Clean up board
    cleanupBoard();
    
    // Reset to main menu
    const mainMenu = document.querySelector('.main-menu');
    const aiMenu = document.querySelector('.ai-difficulty');
    if (mainMenu && aiMenu) {
        mainMenu.style.display = 'flex';
        mainMenu.classList.remove('fade-out');
        aiMenu.style.display = 'none';
    }
}

/**
 * Show AI difficulty selection
 */
function showAIDifficulty() {
    const mainMenu = document.querySelector('.main-menu');
    const aiMenu = document.querySelector('.ai-difficulty');
    if (!mainMenu || !aiMenu) return;
    
    document.body.classList.add('ai-difficulty-visible');
    mainMenu.classList.add('fade-out');
    
    setTimeout(() => {
        mainMenu.style.display = 'none';
        aiMenu.style.display = 'flex';
        
        const aiButtons = aiMenu.querySelectorAll('.menu-button');
        aiButtons.forEach((button, index) => {
            button.style.opacity = '0';
            button.style.transform = 'translateY(20px)';
            button.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            
            setTimeout(() => {
                button.style.opacity = '1';
                button.style.transform = 'translateY(0)';
            }, index * 150);
        });
    }, 300);
}

// =================================================================
// GAME CONTROL FUNCTIONS
// =================================================================

/**
 * Start a new 2-player game
 */
function start2Player() {
    setGameMode('2player');
    trackGameEvent('game_start', '2player');
    
    document.body.classList.remove('splash-visible');
    document.body.classList.add('x-turn');
    initializeBoard(true);
}

/**
 * Start a new AI game
 */
function startAIGame(difficulty) {
    setGameMode('ai', difficulty);
    trackGameEvent('game_start', difficulty);
    
    document.body.classList.remove('splash-visible');
    document.body.classList.add('x-turn');
    initializeBoard(true);
}

/**
 * Reset the current game
 */
function resetGame() {
    // Clear all timeouts and debounces
    clearAITimeouts();
    clearTimeout(gameResultTimeout);
    clickDebounce = false;
    
    // Track reset event
    trackGameEvent('game_reset', getGameMode().mode);
    
    // Reset game state
    resetGameState();
    clearLastPlayedCell();
    
    // Reset UI state
    document.body.className = 'x-turn';
    updateTurnText();
    hideAIThinking();
    
    // Clear any existing game announcements
    const announcements = document.querySelectorAll('.game-announcement');
    announcements.forEach(el => el.remove());
    
    // Reinitialize board
    initializeBoard(false);
}

// =================================================================
// UTILITY FUNCTIONS
// =================================================================

/**
 * Show toast notification
 */
function showToast(message) {
    const toast = domCache.toast;
    if (!toast) return;
    
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

// =================================================================
// GLOBAL FUNCTION EXPORTS (for HTML onclick handlers)
// =================================================================

// Make functions available globally for HTML onclick attributes
window.showHowToPlay = showHowToPlay;
window.closeHowToPlay = closeHowToPlay;
window.goToHome = goToHome;
window.start2Player = start2Player;
window.showAIDifficulty = showAIDifficulty;
window.startAIEasy = () => startAIGame('easy');
window.startAIMedium = () => startAIGame('medium');
window.startAIHard = () => startAIGame('hard');
window.resetGame = resetGame;