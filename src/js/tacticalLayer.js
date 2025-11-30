// 战术层游戏逻辑
class TacticalLayer {
    constructor(board, strategicLayer) {
        this.board = board;
        this.strategicLayer = strategicLayer;
        this.gameState = {
            currentPlayer: 'black',
            selectedPiece: null,
            battleActive: false,
            battleParticipants: {}
        };
        this.setupEventListeners();
        this.pieceRules = {
            rook: this.isValidRookMove.bind(this),
            horse: this.isValidHorseMove.bind(this),
            elephant: this.isValidElephantMove.bind(this),
            advisor: this.isValidAdvisorMove.bind(this),
            general: this.isValidGeneralMove.bind(this),
            cannon: this.isValidCannonMove.bind(this),
            soldier: this.isValidSoldierMove.bind(this)
        };
    }
    
    setupEventListeners() {
        this.board.container.addEventListener('click', (e) => this.handleBoardClick(e));
        document.getElementById('summon-piece').addEventListener('click', () => this.showPieceSelection());
    }
    
    handleBoardClick(e) {
        if (!this.gameState.battleActive) {
            return;
        }
        
        const rect = this.board.container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const col = Math.round(x / this.board.cellSize);
        const row = Math.round(y / this.board.cellSize);
        
        if (row >= 0 && row < this.board.rows && col >= 0 && col < this.board.cols) {
            if (this.gameState.selectedPiece) {
                this.tryMovePiece(row, col);
            } else {
                this.selectPiece(row, col);
            }
        }
    }
    
    selectPiece(row, col) {
        const piece = this.board.getPieceAt(row, col);
        if (piece && piece.classList.contains(this.gameState.currentPlayer)) {
            this.gameState.selectedPiece = piece;
            this.highlightPiece(piece);
            this.showValidMoves(row, col);
        }
    }
    
    tryMovePiece(targetRow, targetCol) {
        const piece = this.gameState.selectedPiece;
        const currentRow = parseInt(piece.dataset.row);
        const currentCol = parseInt(piece.dataset.col);
        const pieceType = piece.dataset.type;
        
        // 检查移动是否有效
        if (this.isValidMove(currentRow, currentCol, targetRow, targetCol, pieceType)) {
            const targetPiece = this.board.getPieceAt(targetRow, targetCol);
            
            // 如果目标位置有对方棋子，则吃掉
            if (targetPiece && !targetPiece.classList.contains(this.gameState.currentPlayer)) {
                this.board.removePieceAt(targetRow, targetCol);
                this.checkWinCondition();
            }
            
            // 移动棋子
            this.board.movePiece(piece, targetRow, targetCol);
            
            // 重置选择状态
            this.resetSelection();
            
            // 切换玩家
            this.switchPlayer();
        } else {
            // 如果移动无效，取消选择
            this.resetSelection();
        }
    }
    
    isValidMove(fromRow, fromCol, toRow, toCol, pieceType) {
        // 检查目标位置是否有自己的棋子
        const targetPiece = this.board.getPieceAt(toRow, toCol);
        if (targetPiece && targetPiece.classList.contains(this.gameState.currentPlayer)) {
            return false;
        }
        
        // 调用对应棋子类型的移动规则
        return this.pieceRules[pieceType](fromRow, fromCol, toRow, toCol);
    }
    
    // 车的移动规则
    isValidRookMove(fromRow, fromCol, toRow, toCol) {
        // 车只能横向或纵向移动
        if (fromRow !== toRow && fromCol !== toCol) {
            return false;
        }
        
        // 检查路径上是否有棋子阻挡
        if (fromRow === toRow) {
            const minCol = Math.min(fromCol, toCol);
            const maxCol = Math.max(fromCol, toCol);
            for (let c = minCol + 1; c < maxCol; c++) {
                if (this.board.getPieceAt(fromRow, c)) {
                    return false;
                }
            }
        } else {
            const minRow = Math.min(fromRow, toRow);
            const maxRow = Math.max(fromRow, toRow);
            for (let r = minRow + 1; r < maxRow; r++) {
                if (this.board.getPieceAt(r, fromCol)) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    // 马的移动规则
    isValidHorseMove(fromRow, fromCol, toRow, toCol) {
        const rowDiff = Math.abs(toRow - fromRow);
        const colDiff = Math.abs(toCol - fromCol);
        
        // 马走日字
        if (!((rowDiff === 1 && colDiff === 2) || (rowDiff === 2 && colDiff === 1))) {
            return false;
        }
        
        // 检查马腿是否被绊住
        if (rowDiff === 2) {
            // 横向移动，检查中间是否有棋子
            const midRow = (fromRow + toRow) / 2;
            if (this.board.getPieceAt(midRow, fromCol)) {
                return false;
            }
        } else {
            // 纵向移动，检查中间是否有棋子
            const midCol = (fromCol + toCol) / 2;
            if (this.board.getPieceAt(fromRow, midCol)) {
                return false;
            }
        }
        
        return true;
    }
    
    // 相的移动规则
    isValidElephantMove(fromRow, fromCol, toRow, toCol) {
        const player = this.gameState.currentPlayer;
        
        // 相不能过河
        if ((player === 'black' && toRow > 4) || (player === 'white' && toRow < 5)) {
            return false;
        }
        
        const rowDiff = Math.abs(toRow - fromRow);
        const colDiff = Math.abs(toCol - fromCol);
        
        // 相走田字
        if (rowDiff !== 2 || colDiff !== 2) {
            return false;
        }
        
        // 检查田字中间是否有棋子
        const midRow = (fromRow + toRow) / 2;
        const midCol = (fromCol + toCol) / 2;
        if (this.board.getPieceAt(midRow, midCol)) {
            return false;
        }
        
        return true;
    }
    
    // 士的移动规则
    isValidAdvisorMove(fromRow, fromCol, toRow, toCol) {
        const player = this.gameState.currentPlayer;
        const rowDiff = Math.abs(toRow - fromRow);
        const colDiff = Math.abs(toCol - fromCol);
        
        // 士只能在九宫内斜走一格
        if (rowDiff !== 1 || colDiff !== 1) {
            return false;
        }
        
        // 检查是否在九宫内
        if (player === 'black') {
            if (toRow < 0 || toRow > 2 || toCol < 3 || toCol > 5) {
                return false;
            }
        } else {
            if (toRow < 7 || toRow > 9 || toCol < 3 || toCol > 5) {
                return false;
            }
        }
        
        return true;
    }
    
    // 将的移动规则
    isValidGeneralMove(fromRow, fromCol, toRow, toCol) {
        const player = this.gameState.currentPlayer;
        const rowDiff = Math.abs(toRow - fromRow);
        const colDiff = Math.abs(toCol - fromCol);
        
        // 将只能走一步
        if ((rowDiff + colDiff) !== 1) {
            // 检查将帅是否对面
            if (this.isGeneralFaceToFace(fromRow, fromCol, toRow, toCol)) {
                return true;
            }
            return false;
        }
        
        // 检查是否在九宫内
        if (player === 'black') {
            if (toRow < 0 || toRow > 2 || toCol < 3 || toCol > 5) {
                return false;
            }
        } else {
            if (toRow < 7 || toRow > 9 || toCol < 3 || toCol > 5) {
                return false;
            }
        }
        
        return true;
    }
    
    isGeneralFaceToFace(fromRow, fromCol, toRow, toCol) {
        // 检查将帅是否在同一列且中间没有棋子
        if (fromCol !== toCol) {
            return false;
        }
        
        const minRow = Math.min(fromRow, toRow);
        const maxRow = Math.max(fromRow, toRow);
        
        for (let r = minRow + 1; r < maxRow; r++) {
            if (this.board.getPieceAt(r, fromCol)) {
                return false;
            }
        }
        
        // 检查目标位置是否是对方的将
        const targetPiece = this.board.getPieceAt(toRow, toCol);
        return targetPiece && targetPiece.dataset.type === 'general';
    }
    
    // 炮的移动规则
    isValidCannonMove(fromRow, fromCol, toRow, toCol) {
        const targetPiece = this.board.getPieceAt(toRow, toCol);
        
        // 炮只能横向或纵向移动
        if (fromRow !== toRow && fromCol !== toCol) {
            return false;
        }
        
        let obstacleCount = 0;
        
        if (fromRow === toRow) {
            const minCol = Math.min(fromCol, toCol);
            const maxCol = Math.max(fromCol, toCol);
            for (let c = minCol + 1; c < maxCol; c++) {
                if (this.board.getPieceAt(fromRow, c)) {
                    obstacleCount++;
                }
            }
        } else {
            const minRow = Math.min(fromRow, toRow);
            const maxRow = Math.max(fromRow, toRow);
            for (let r = minRow + 1; r < maxRow; r++) {
                if (this.board.getPieceAt(r, fromCol)) {
                    obstacleCount++;
                }
            }
        }
        
        // 吃子时需要一个炮架，不吃子时不能有炮架
        if (targetPiece) {
            return obstacleCount === 1;
        } else {
            return obstacleCount === 0;
        }
    }
    
    // 卒的移动规则
    isValidSoldierMove(fromRow, fromCol, toRow, toCol) {
        const player = this.gameState.currentPlayer;
        const rowDiff = toRow - fromRow;
        const colDiff = Math.abs(toCol - fromCol);
        
        // 卒只能前进或横向移动一格
        if (colDiff > 1 || Math.abs(rowDiff) > 1 || (colDiff === 1 && rowDiff !== 0)) {
            return false;
        }
        
        // 检查移动方向
        if (player === 'black') {
            // 黑方卒只能向上或过河后横向移动
            if (rowDiff > 0) {
                return false;
            }
            if (colDiff === 1 && fromRow > 4) {
                return false;
            }
        } else {
            // 白方卒只能向下或过河后横向移动
            if (rowDiff < 0) {
                return false;
            }
            if (colDiff === 1 && fromRow < 5) {
                return false;
            }
        }
        
        return true;
    }
    
    highlightPiece(piece) {
        piece.style.boxShadow = '0 0 10px #ff0000';
    }
    
    showValidMoves(row, col) {
        // 显示所有可能的移动位置（简化实现）
        const piece = this.board.getPieceAt(row, col);
        const pieceType = piece.dataset.type;
        
        for (let r = 0; r < this.board.rows; r++) {
            for (let c = 0; c < this.board.cols; c++) {
                if (this.isValidMove(row, col, r, c, pieceType)) {
                    this.markValidMove(r, c);
                }
            }
        }
    }
    
    markValidMove(row, col) {
        const marker = document.createElement('div');
        marker.classList.add('valid-move-marker');
        marker.style.position = 'absolute';
        marker.style.left = `${col * this.board.cellSize + this.board.cellSize / 2 - 5}px`;
        marker.style.top = `${row * this.board.cellSize + this.board.cellSize / 2 - 5}px`;
        marker.style.width = '10px';
        marker.style.height = '10px';
        marker.style.borderRadius = '50%';
        marker.style.backgroundColor = 'rgba(255, 255, 0, 0.5)';
        marker.dataset.row = row;
        marker.dataset.col = col;
        this.board.container.appendChild(marker);
    }
    
    clearValidMoveMarkers() {
        const markers = this.board.container.querySelectorAll('.valid-move-marker');
        markers.forEach(marker => marker.remove());
    }
    
    resetSelection() {
        if (this.gameState.selectedPiece) {
            this.gameState.selectedPiece.style.boxShadow = '';
            this.gameState.selectedPiece = null;
        }
        this.clearValidMoveMarkers();
    }
    
    switchPlayer() {
        this.gameState.currentPlayer = this.gameState.currentPlayer === 'black' ? 'white' : 'black';
        // 安全检查strategicLayer存在
        if (this.strategicLayer && typeof this.strategicLayer.updateGameMessage === 'function') {
            this.strategicLayer.updateGameMessage(`战术层：${this.gameState.currentPlayer === 'black' ? '黑' : '白'}方回合`);
        }
    }
    
    showPieceSelection() {
        // 安全检查strategicLayer存在
        if (!this.strategicLayer || !this.strategicLayer.gameState || !this.board) {
            return;
        }

        const currentPlayer = this.strategicLayer.gameState.currentPlayer;
        if (typeof this.strategicLayer.getTokens === 'function' && this.strategicLayer.getTokens(currentPlayer) <= 0) {
            if (typeof this.strategicLayer.updateGameMessage === 'function') {
                this.strategicLayer.updateGameMessage('没有足够的战术令牌！');
            }
            return;
        }
        
        const availablePieces = ['rook', 'horse', 'elephant', 'advisor', 'general', 'cannon', 'soldier'];
        const container = document.querySelector('.available-pieces');
        if (!container) return;
        
        container.innerHTML = '';
        
        availablePieces.forEach(pieceType => {
            const pieceOption = document.createElement('div');
            pieceOption.classList.add('piece-option');
            pieceOption.classList.add(currentPlayer);
            pieceOption.dataset.type = pieceType;
            if (typeof this.board.getPieceSymbol === 'function') {
                pieceOption.textContent = this.board.getPieceSymbol(pieceType);
            }
            pieceOption.addEventListener('click', () => this.summonPiece(pieceType));
            container.appendChild(pieceOption);
        });
    }
    
    summonPiece(pieceType) {
        // 安全检查strategicLayer存在
        if (!this.strategicLayer || !this.strategicLayer.gameState || !this.board) {
            return;
        }

        const currentPlayer = this.strategicLayer.gameState.currentPlayer;

        // 使用一个战术令牌
        if (typeof this.strategicLayer.useToken === 'function' && !this.strategicLayer.useToken(currentPlayer)) {
            return;
        }
        
        // 随机选择一个位置放置棋子（实际应该让玩家选择）
        let row, col;
        if (currentPlayer === 'black') {
            row = Math.floor(Math.random() * 5);
        } else {
            row = 9 - Math.floor(Math.random() * 5);
        }
        col = Math.floor(Math.random() * 9);
        
        // 尝试放置棋子，如果位置已有棋子则重新选择
        let attempts = 0;
        while (attempts < 100) {
            if (typeof this.board.placePiece === 'function' && this.board.placePiece(row, col, currentPlayer, pieceType)) {
                break;
            }
            if (currentPlayer === 'black') {
                row = Math.floor(Math.random() * 5);
            } else {
                row = 9 - Math.floor(Math.random() * 5);
            }
            col = Math.floor(Math.random() * 9);
            attempts++;
        }
        
        if (attempts >= 100) {
            if (this.strategicLayer && typeof this.strategicLayer.updateGameMessage === 'function') {
                this.strategicLayer.updateGameMessage('无法放置棋子，棋盘已满');
            }
            return;
        }

        // 激活战斗
        this.activateBattle();
        this.gameState.battleParticipants[currentPlayer] = true;
        if (this.strategicLayer && typeof this.strategicLayer.updateGameMessage === 'function') {
            this.strategicLayer.updateGameMessage(`战术层战斗开始！${currentPlayer === 'black' ? '黑' : '白'}方请移动棋子`);
        }
    }
    
    activateBattle() {
        this.gameState.battleActive = true;
        const summonPieceBtn = document.getElementById('summon-piece');
        if (summonPieceBtn) {
            summonPieceBtn.disabled = true;
        }
        
        // 安全检查strategicLayer存在
        if (this.strategicLayer && typeof this.strategicLayer.updateGameMessage === 'function') {
            this.strategicLayer.updateGameMessage('战术层战斗已激活！');
        }
        
        // 显示战斗状态div并添加active类
        const battleStatusEl = document.getElementById('battle-status');
        if (battleStatusEl) {
            battleStatusEl.classList.add('active');
        }
    }
    
    deactivateBattle() {
        this.gameState.battleActive = false;
        this.resetSelection();
        const summonPieceBtn = document.getElementById('summon-piece');
        if (summonPieceBtn) {
            summonPieceBtn.disabled = false;
        }
        
        // 安全检查strategicLayer存在
        if (this.strategicLayer && typeof this.strategicLayer.updateGameMessage === 'function') {
            this.strategicLayer.updateGameMessage('战术层战斗已结束！');
        }
        
        // 隐藏战斗状态div（短暂延迟后隐藏，让玩家看到结果）
        setTimeout(() => {
            const battleStatusEl = document.getElementById('battle-status');
            if (battleStatusEl) {
                battleStatusEl.classList.remove('active');
            }
        }, 3000);
        
        this.gameState.battleParticipants = {};
    }
    
    checkWinCondition() {
        // 检查是否有一方的将被吃掉
        let blackHasGeneral = false;
        let whiteHasGeneral = false;
        
        for (let piece of this.board.pieces) {
            if (piece.dataset.type === 'general') {
                if (piece.classList.contains('black')) {
                    blackHasGeneral = true;
                } else {
                    whiteHasGeneral = true;
                }
            }
        }
        
        if (!blackHasGeneral) {
            // 白方获胜
            this.battleWon('white');
            return 'white';
        } else if (!whiteHasGeneral) {
            // 黑方获胜
            this.battleWon('black');
            return 'black';
        }
        
        return null;
    }
    
    battleWon(winner) {
        this.deactivateBattle();
        // 安全检查strategicLayer存在
        if (this.strategicLayer && typeof this.strategicLayer.updateGameMessage === 'function') {
            this.strategicLayer.updateGameMessage(`战术层战斗结束！${winner === 'black' ? '黑' : '白'}方获胜，可以在战略层放置堡垒`);
            // 允许获胜方在战略层放置堡垒
            this.enableFortressPlacement(winner);
        }
    }
    
    enableFortressPlacement(player) {
        // 安全检查strategicLayer存在
        if (this.strategicLayer) {
            // 临时存储获胜方，等待玩家在战略层选择位置放置堡垒
            this.strategicLayer.waitingForFortressPlacement = player;
            if (typeof this.strategicLayer.updateGameMessage === 'function') {
                this.strategicLayer.updateGameMessage(`${player === 'black' ? '黑' : '白'}方请在战略层选择一个位置放置堡垒`);
            }
        }
    }
    
    clear() {
        this.board.clear();
        this.gameState.selectedPiece = null;
        this.gameState.battleActive = false;
        this.gameState.battleParticipants = {};
        this.clearValidMoveMarkers();
    }
}