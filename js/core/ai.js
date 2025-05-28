// =================================================================
// AI SYSTEM - js/ai.js
// =================================================================

// AI timing controls
let aiThinkingTimeout = null;
let aiMoveTimeout = null;

// =================================================================
// AI MOVE SELECTION
// =================================================================

/**
 * Select the best move based on AI difficulty
 */
function selectAIMove(validMoves, difficulty) {
    switch (difficulty) {
        case 'easy':
            return getEasyMove(validMoves);
        case 'medium':
            return getMediumMove(validMoves);
        case 'hard':
            return getHardMove(validMoves);
        default:
            return validMoves[Math.floor(Math.random() * validMoves.length)];
    }
}

// =================================================================
// DIFFICULTY IMPLEMENTATIONS
// =================================================================

/**
 * Easy AI: Random moves with occasional blocking
 */
function getEasyMove(validMoves) {
    if (Math.random() < 0.3) {
        const blockingMove = findBlockingMove(validMoves);
        if (blockingMove) return blockingMove;
    }
    
    return validMoves[Math.floor(Math.random() * validMoves.length)];
}

/**
 * Medium AI: Always blocks, occasionally tries to win
 */
function getMediumMove(validMoves) {
    const winningMove = findWinningMove(validMoves);
    if (winningMove) return winningMove;
    
    const blockingMove = findBlockingMove(validMoves);
    if (blockingMove) return blockingMove;
    
    const centerMove = findCenterMove(validMoves);
    if (centerMove && Math.random() < 0.7) return centerMove;
    
    const strategicMove = findStrategicMove(validMoves);
    if (strategicMove) return strategicMove;
    
    return validMoves[Math.floor(Math.random() * validMoves.length)];
}

/**
 * Hard AI: Advanced strategic thinking
 */
function getHardMove(validMoves) {
    // Check for immediate game-ending moves first
    const gameWinningMove = findGameWinningMove(validMoves);
    if (gameWinningMove) return gameWinningMove;
    
    const gameBlockingMove = findGameBlockingMove(validMoves);
    if (gameBlockingMove) return gameBlockingMove;
    
    // Use strategic evaluation
    const strategicMove = findBestStrategicMove(validMoves);
    return strategicMove || validMoves[0];
}

// =================================================================
// AI MOVE FINDERS
// =================================================================

/**
 * Find a move that wins a mini-board
 */
function findWinningMove(validMoves) {
    for (const move of validMoves) {
        if (!gameBoard[move.board]) continue;
        
        // Temporarily make the move
        gameBoard[move.board][move.cell] = 'O';
        const isWin = checkBoardWinner(move.board) === 'O';
        gameBoard[move.board][move.cell] = null; // Undo
        
        if (isWin) return move;
    }
    return null;
}

/**
 * Find a move that blocks opponent from winning a mini-board
 */
function findBlockingMove(validMoves) {
    for (const move of validMoves) {
        if (!gameBoard[move.board]) continue;
        
        // Temporarily make the move as opponent
        gameBoard[move.board][move.cell] = 'X';
        const isWin = checkBoardWinner(move.board) === 'X';
        gameBoard[move.board][move.cell] = null; // Undo
        
        if (isWin) return move;
    }
    return null;
}

/**
 * Find a move in center positions (preferred strategically)
 */
function findCenterMove(validMoves) {
    // Prefer center cells
    const centerMoves = validMoves.filter(move => move.cell === 4);
    if (centerMoves.length > 0) {
        return centerMoves[Math.floor(Math.random() * centerMoves.length)];
    }
    
    // Fallback to corner cells
    const cornerMoves = validMoves.filter(move => 
        move.cell === 0 || move.cell === 2 || move.cell === 6 || move.cell === 8
    );
    if (cornerMoves.length > 0) {
        return cornerMoves[Math.floor(Math.random() * cornerMoves.length)];
    }
    
    return null;
}

/**
 * Find a strategically sound move
 */
function findStrategicMove(validMoves) {
    const scoredMoves = validMoves.map(move => {
        let score = 0;
        
        // Board importance
        if (move.board === 4) score += 10; // Center board
        if ([0, 2, 6, 8].includes(move.board)) score += 5; // Corner boards
        
        // Cell position
        if (move.cell === 4) score += 8; // Center cell
        if ([0, 2, 6, 8].includes(move.cell)) score += 4; // Corner cells
        
        // Evaluate consequences
        const targetBoard = move.cell;
        if (targetBoard >= 0 && targetBoard <= 8) {
            if (boardWinners[targetBoard] || isBoardFull(targetBoard)) {
                score -= 20; // Gives opponent free choice
            } else {
                if (canWinBoard(targetBoard, 'X')) score -= 15; // Opponent can win
                const emptyCells = countEmptyCells(targetBoard);
                score += (9 - emptyCells) * 2; // Prefer constrained boards
            }
        }
        
        return { move, score };
    });
    
    scoredMoves.sort((a, b) => b.score - a.score);
    const topMoves = scoredMoves.filter(m => m.score === scoredMoves[0].score);
    
    return topMoves.length > 0 ? topMoves[Math.floor(Math.random() * topMoves.length)].move : null;
}

/**
 * Find a move that wins the entire game
 */
function findGameWinningMove(validMoves) {
    for (const move of validMoves) {
        const originalValue = gameBoard[move.board][move.cell];
        const originalWinner = boardWinners[move.board];
        
        // Simulate the move
        gameBoard[move.board][move.cell] = 'O';
        
        if (!originalWinner && checkBoardWinner(move.board) === 'O') {
            boardWinners[move.board] = 'O';
            
            const gameWin = checkGameWinner();
            if (gameWin && gameWin.winner === 'O') {
                // Restore state and return winning move
                gameBoard[move.board][move.cell] = originalValue;
                boardWinners[move.board] = originalWinner;
                return move;
            }
            
            boardWinners[move.board] = originalWinner;
        }
        
        gameBoard[move.board][move.cell] = originalValue;
    }
    
    return null;
}

/**
 * Find a move that blocks opponent from winning the game
 */
function findGameBlockingMove(validMoves) {
    for (const move of validMoves) {
        const originalValue = gameBoard[move.board][move.cell];
        const originalWinner = boardWinners[move.board];
        
        // Simulate opponent's move
        gameBoard[move.board][move.cell] = 'X';
        
        if (!originalWinner && checkBoardWinner(move.board) === 'X') {
            boardWinners[move.board] = 'X';
            
            const gameWin = checkGameWinner();
            if (gameWin && gameWin.winner === 'X') {
                // Restore state and return blocking move
                gameBoard[move.board][move.cell] = originalValue;
                boardWinners[move.board] = originalWinner;
                return move;
            }
            
            boardWinners[move.board] = originalWinner;
        }
        
        gameBoard[move.board][move.cell] = originalValue;
    }
    
    return null;
}

/**
 * Advanced strategic evaluation for hard AI
 */
function findBestStrategicMove(validMoves) {
    const evaluatedMoves = validMoves.map(move => {
        let score = 0;
        
        // Board importance
        if (move.board === 4) score += 15; // Center board is crucial
        if ([0, 2, 6, 8].includes(move.board)) score += 8; // Corner boards
        
        // Cell position value
        if (move.cell === 4) score += 10; // Center cell
        if ([0, 2, 6, 8].includes(move.cell)) score += 5; // Corner cells
        
        // Evaluate where this sends opponent
        const targetBoard = move.cell;
        if (boardWinners[targetBoard] || isBoardFull(targetBoard)) {
            score -= 25; // Very bad - gives opponent free choice
        } else {
            // Check opponent's opportunities in target board
            if (canWinBoard(targetBoard, 'X')) {
                score -= 20; // Bad - opponent can win immediately
            }
            
            // Check our opportunities in target board
            if (canWinBoard(targetBoard, 'O')) {
                score += 15; // Good - we can threaten
            }
            
            // Prefer sending opponent to constrained boards
            const opponentOptions = countEmptyCells(targetBoard);
            score += (9 - opponentOptions) * 3;
        }
        
        // Bonus for creating multiple threats
        score += evaluateMultipleThreats(move) * 5;
        
        return { move, score };
    });
    
    evaluatedMoves.sort((a, b) => b.score - a.score);
    
    // Add some randomness among top moves to avoid predictability
    const topScore = evaluatedMoves[0].score;
    const topMoves = evaluatedMoves.filter(m => m.score >= topScore - 5);
    
    return topMoves[Math.floor(Math.random() * topMoves.length)].move;
}

/**
 * Evaluate if a move creates multiple winning threats
 */
function evaluateMultipleThreats(move) {
    let threats = 0;
    
    // Check if this move helps us get closer to winning multiple boards
    for (let b = 0; b < 9; b++) {
        if (boardWinners[b] || b === move.board) continue;
        
        // Count our pieces in this board
        let ourPieces = 0;
        for (let c = 0; c < 9; c++) {
            if (gameBoard[b][c] === 'O') ourPieces++;
        }
        
        // If we have pieces here and it's not lost, it's a potential threat
        if (ourPieces > 0 && !canWinBoard(b, 'X')) {
            threats++;
        }
    }
    
    return threats;
}

// =================================================================
// AI TIMING & EXECUTION
// =================================================================

/**
 * Calculate AI thinking time based on game progress
 */
function calculateAIThinkingTime(gameProgress = null) {
    if (gameProgress === null) {
        gameProgress = getGameProgress();
    }
    
    const baseTime = 500;
    const maxTime = 4000;
    
    if (gameProgress < 0.4) {
        return baseTime + Math.random() * 500;
    } else if (gameProgress < 0.7) {
        return 1500 + Math.random() * 1500;
    } else {
        return 2000 + Math.random() * 2000;
    }
}

/**
 * Clear all AI timeouts
 */
function clearAITimeouts() {
    clearTimeout(aiThinkingTimeout);
    clearTimeout(aiMoveTimeout);
    aiThinkingTimeout = null;
    aiMoveTimeout = null;
}

/**
 * Schedule an AI move with thinking animation
 */
function scheduleAIMove(onMoveCallback, onThinkingStart, onThinkingEnd) {
    // Clear any existing timeouts
    clearAITimeouts();
    
    // Calculate thinking time
    const thinkingTime = calculateAIThinkingTime();
    
    // Wait for board transition then show thinking
    aiThinkingTimeout = setTimeout(() => {
        if (currentPlayer === 'O' && !gameWinner && !isGameDraw()) {
            onThinkingStart();
            
            // After thinking time, hide thinking and make move
            aiMoveTimeout = setTimeout(() => {
                onThinkingEnd();
                
                // Wait for fade out then make move
                setTimeout(() => {
                    if (currentPlayer === 'O' && !gameWinner && !isGameDraw()) {
                        const validMoves = getValidMoves();
                        if (validMoves.length > 0) {
                            const chosenMove = selectAIMove(validMoves, aiDifficulty);
                            onMoveCallback(chosenMove);
                        }
                    }
                }, 500); // AI_FADE_OUT time
            }, thinkingTime);
        }
    }, 1500); // BOARD_TRANSITION time
}