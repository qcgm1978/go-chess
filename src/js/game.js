// 游戏主控制器，管理战略层和战术层的交互

class Game {
    constructor() {
        // 初始化游戏状态
        this.isFortressPlacementMode = false;
        this.currentFortressPlayer = null;
        this.gameHistory = [];
        this.isGameOver = false;
        // Katago接口引用，将在index.js中初始化
        this.katagoInterface = null;
        
        // 安全初始化棋盘
        try {
            // 初始化棋盘
            this.strategicBoard = new StrategicBoard();
            this.tacticalBoard = new TacticalBoard();
            
            // 初始化游戏层
            this.strategicLayer = new StrategicLayer(this.strategicBoard);
            this.tacticalLayer = new TacticalLayer(this.tacticalBoard, this.strategicLayer);
            
            // 扩展战略层以支持堡垒放置模式
            this.extendStrategicLayer();
            
            // 设置游戏控制
            this.setupGameControls();
        } catch (e) {
            console.error('游戏初始化失败:', e);
        }
    }
    
    // 设置Katago接口
    setKatagoInterface(katagoInterface) {
        this.katagoInterface = katagoInterface;
        // 将Katago接口传递给strategicLayer
        if (this.strategicLayer && typeof this.strategicLayer.setKatagoInterface === 'function') {
            this.strategicLayer.setKatagoInterface(katagoInterface);
        }
    }
    
    // 使用Katago获取当前棋盘的领土估计
    async getTerritoryEstimateFromKatago() {
        try {
            if (!this.katagoInterface) {
                console.warn('Katago接口未初始化');
                return null;
            }
            
            // 准备棋盘状态数据
            const boardState = this.prepareBoardStateForKatago();
            
            // 调用Katago接口获取领土估计
            const estimate = await this.katagoInterface.getTerritoryEstimate(boardState);
            
            if (estimate) {
                console.log('KataGo领土估计:', estimate);
                // 这里可以更新UI或游戏状态
                this.updateTerritoryDisplay(estimate);
            }
            
            return estimate;
        } catch (error) {
            console.error('获取KataGo领土估计失败:', error);
            return null;
        }
    }
    
    // 准备发送给Katago的棋盘状态
    prepareBoardStateForKatago() {
        // 从战略层获取当前棋盘状态
        const snapshot = this.getStrategicSnapshot();
        const moves = [];
        
        // 转换棋盘状态为Katago需要的格式
        if (snapshot && Array.isArray(snapshot.stones)) {
            snapshot.stones.forEach(stone => {
                if (stone) {
                    // 转换坐标为围棋坐标格式（如Q16）
                    const letter = String.fromCharCode(65 + stone.col); // A, B, C...
                    const number = 19 - stone.row; // 反转行号（假设19x19棋盘）
                    
                    moves.push({
                        player: stone.color,
                        coord: letter + number
                    });
                }
            });
        }
        
        return {
            currentPlayer: this.strategicLayer && this.strategicLayer.gameState ? this.strategicLayer.gameState.currentPlayer : 'black',
            moves: moves,
            boardSize: 19 // 假设是19x19的棋盘
        };
    }
    
    // 更新领土显示
    updateTerritoryDisplay(estimate) {
        // 更新UI显示领土估计
        const gameStats = document.querySelector('.game-stats');
        if (gameStats) {
            document.getElementById('black-territory').textContent = estimate.black || 0;
            document.getElementById('white-territory').textContent = estimate.white || 0;
        }
        
        // 同时更新strategicLayer中的领土状态并触发令牌计算
        if (this.strategicLayer && this.strategicLayer.gameState) {
            this.strategicLayer.gameState.territory.black = estimate.black || 0;
            this.strategicLayer.gameState.territory.white = estimate.white || 0;
            
            // 触发令牌计算和显示更新
            this.strategicLayer.checkTokenEarn();
            this.strategicLayer.updateTokenDisplay();
        }
    }
    
    extendStrategicLayer() {
        // 保存原始的placeStone方法
        const originalPlaceStone = this.strategicLayer.placeStone;
        
        // 重写placeStone方法以支持堡垒放置模式
        this.strategicLayer.placeStone = (row, col) => {
            // 检查是否处于堡垒放置模式
            if (this.isFortressPlacementMode && this.currentFortressPlayer) {
                // 尝试放置堡垒
                const success = this.strategicLayer.placeFortress(row, col, this.currentFortressPlayer);
                if (success) {
                    this.strategicLayer.updateGameMessage(`${this.currentFortressPlayer === 'black' ? '黑' : '白'}方成功放置堡垒！`);
                    this.exitFortressPlacementMode();
                    
                    // 清空战术层棋盘，为下一次战斗做准备
                    this.tacticalLayer.clear();
                    
                    // 切换战略层的当前玩家
                    this.strategicLayer.switchPlayer();
                } else {
                    this.strategicLayer.updateGameMessage('该位置不能放置堡垒！');
                }
                return;
            }
            
            // 正常落子逻辑
            originalPlaceStone.call(this.strategicLayer, row, col);
        };
        
        // 添加堡垒放置模式的支持
        this.strategicLayer.waitingForFortressPlacement = null;
        Object.defineProperty(this.strategicLayer, 'waitingForFortressPlacement', {
            get: () => this.currentFortressPlayer,
            set: (player) => {
                if (player) {
                    this.enterFortressPlacementMode(player);
                }
            }
        });
    }
    
    enterFortressPlacementMode(player) {
        this.isFortressPlacementMode = true;
        this.currentFortressPlayer = player;
        
        // 高亮战略层棋盘
        this.strategicBoard.container.style.boxShadow = '0 0 20px #00ff00';
        
        // 更新消息
        this.strategicLayer.updateGameMessage(`${player === 'black' ? '黑' : '白'}方请在战略层选择一个位置放置堡垒`);
    }
    
    exitFortressPlacementMode() {
        this.isFortressPlacementMode = false;
        this.currentFortressPlayer = null;
        
        // 移除高亮
        this.strategicBoard.container.style.boxShadow = '';
    }
    
    setupGameControls() {
        // 安全地绑定游戏控制事件
        const newGameBtn = document.getElementById('new-game');
        const undoBtn = document.getElementById('undo');
        const rulesBtn = document.getElementById('rules');
        const closeRulesBtn = document.querySelector('.modal .close');
        const rulesModal = document.getElementById('rules-modal');
        
        if (newGameBtn) newGameBtn.addEventListener('click', () => this.startNewGame());
        if (undoBtn) undoBtn.addEventListener('click', () => this.undoMove());
        if (rulesBtn) rulesBtn.addEventListener('click', () => this.showRules());
        if (closeRulesBtn) closeRulesBtn.addEventListener('click', () => this.hideRules());
        
        // 点击模态框外部关闭
        window.addEventListener('click', (e) => {
            if (rulesModal && e.target === rulesModal) {
                this.hideRules();
            }
        });
    }
    
    // 显示通知信息
    showNotification(message, type = 'info') {
        // 通知系统，避免在每次操作时都弹出提示
        const notificationElement = document.createElement('div');
        notificationElement.className = `notification ${type}`;
        notificationElement.textContent = message;
        notificationElement.style.position = 'fixed';
        notificationElement.style.bottom = '20px';
        notificationElement.style.right = '20px';
        notificationElement.style.padding = '10px 15px';
        notificationElement.style.backgroundColor = type === 'error' ? '#f44336' : '#2196F3';
        notificationElement.style.color = 'white';
        notificationElement.style.borderRadius = '4px';
        notificationElement.style.zIndex = '1000';
        notificationElement.style.transition = 'opacity 0.3s ease';
        
        if (document.body) {
            document.body.appendChild(notificationElement);
        } else {
            console.error('document.body 不可用，无法显示通知');
            // 降级方案：使用alert
            alert(message);
        }
        
        setTimeout(() => {
            notificationElement.style.opacity = '0';
            setTimeout(() => {
                if (document.body.contains(notificationElement)) {
                    document.body.removeChild(notificationElement);
                }
            }, 300);
        }, 3000);
    }
    
    startNewGame() {
        console.log('游戏开始，初始化KataGo连接...');
        // 清除之前可能存在的定时器
        if (this.testInterval) {
            clearInterval(this.testInterval);
        }
        // 游戏开始时定期调用领土估计，每2秒调用一次
        this.testInterval = setInterval(() => {
            console.log('主动测试KataGo连接，获取领土估计');
            this.getTerritoryEstimateFromKatago();
        }, 2000);
        // 安全检查
        if (!this.strategicLayer || !this.tacticalLayer) {
            return;
        }
        
        try {
            // 重置游戏状态标志
            this.isGameOver = false;
            
            // 重置战略层
            this.strategicLayer.reset();
            
            // 重置战术层
            this.tacticalLayer.clear();
            
            // 重置游戏状态
            this.exitFortressPlacementMode();
            this.gameHistory = [];
            
            // 更新UI
            this.strategicLayer.updateGameMessage('游戏开始！黑方先行，请在战略层落子');
            
            // 重置玩家信息样式
            const playerBlack = document.getElementById('player-black');
            const playerWhite = document.getElementById('player-white');
            if (playerBlack) playerBlack.style.backgroundColor = '';
            if (playerWhite) playerWhite.style.backgroundColor = '';
            if (playerBlack) playerBlack.style.color = '';
            if (playerWhite) playerWhite.style.color = '';
        } catch (e) {
            console.error('开始新游戏失败:', e);
        }
    }
    
    undoMove() {
        // 游戏结束时不允许悔棋
        if (this.isGameOver) {
            this.showNotification('游戏已结束，无法悔棋', 'error');
            return;
        }
        
        // 安全检查
        if (!this.strategicLayer) {
            return;
        }
        
        try {
            // 检查是否处于堡垒放置模式
            if (this.isFortressPlacementMode) {
                this.exitFortressPlacementMode();
                this.strategicLayer.updateGameMessage(`${this.strategicLayer.gameState.currentPlayer === 'black' ? '黑' : '白'}方回合`);
                return;
            }
            
            // 尝试在战略层悔棋
            const success = this.strategicLayer.undo();
            
            if (success) {
                // 从历史记录中恢复状态
                if (this.gameHistory.length > 0) {
                    const lastState = this.gameHistory.pop();
                    // 恢复对应的战术层状态
                    if (lastState.tacticalState && this.tacticalLayer) {
                        this.restoreTacticalState(lastState.tacticalState);
                    }
                }
            } else {
                this.strategicLayer.updateGameMessage('没有可以悔棋的步骤');
            }
        } catch (e) {
            console.error('悔棋操作失败:', e);
            this.showNotification('悔棋失败', 'error');
        }
    }
    
    saveGameState() {
        // 安全检查
        if (!this.strategicLayer || !this.tacticalLayer || !this.tacticalBoard) {
            return;
        }
        
        // 保存当前游戏状态到历史记录
        try {
            const gameState = {
                strategicState: {
                    currentPlayer: this.strategicLayer.gameState.currentPlayer,
                    territory: { ...this.strategicLayer.gameState.territory },
                    tokens: { ...this.strategicLayer.gameState.tokens }
                },
                tacticalState: this.tacticalLayer.gameState.battleActive ? {
                    pieces: this.tacticalBoard.pieces.map(piece => ({
                        row: parseInt(piece.dataset.row),
                        col: parseInt(piece.dataset.col),
                        color: piece.classList.contains('black') ? 'black' : 'white',
                        type: piece.dataset.type
                    })),
                    currentPlayer: this.tacticalLayer.gameState.currentPlayer
                } : null
            };
            
            this.gameHistory.push(gameState);
            
            // 限制历史记录长度，避免内存问题
            const MAX_HISTORY_LENGTH = 50;
            if (this.gameHistory.length > MAX_HISTORY_LENGTH) {
                this.gameHistory = this.gameHistory.slice(-MAX_HISTORY_LENGTH);
            }
        } catch (e) {
            console.error('保存游戏状态失败:', e);
        }
    }
    
    restoreTacticalState(state) {
        // 安全检查
        if (!state || !this.tacticalLayer || !this.tacticalBoard) {
            return;
        }
        
        try {
            // 清空战术层棋盘
            this.tacticalLayer.clear();
            
            // 恢复棋子
            if (Array.isArray(state.pieces)) {
                state.pieces.forEach(pieceData => {
                    // 验证棋子数据的完整性
                    if (pieceData && typeof pieceData.row === 'number' && typeof pieceData.col === 'number' && 
                        pieceData.color && pieceData.type) {
                        this.tacticalBoard.placePiece(
                            pieceData.row,
                            pieceData.col,
                            pieceData.color,
                            pieceData.type
                        );
                    }
                });
            }
            
            // 恢复当前玩家
            if (state.currentPlayer && this.tacticalLayer.gameState) {
                this.tacticalLayer.gameState.currentPlayer = state.currentPlayer;
            }
        } catch (e) {
            console.error('恢复战术层状态失败:', e);
        }
    }
    
    showRules() {
        try {
            const rulesModal = document.getElementById('rules-modal');
            const rulesContent = document.getElementById('rules-content');
            
            if (!rulesModal || !rulesContent) {
                console.error('规则模态框元素未找到');
                return;
            }
            
            // 加载规则内容
            if (typeof generateRulesContent === 'function') {
                rulesContent.innerHTML = generateRulesContent();
            } else {
                rulesContent.innerHTML = '<p>游戏规则加载失败</p>';
                console.error('generateRulesContent函数未定义');
            }
            
            // 显示模态框
            rulesModal.style.display = 'block';
        } catch (e) {
            console.error('显示规则失败:', e);
        }
    }
    
    hideRules() {
        try {
            const rulesModal = document.getElementById('rules-modal');
            if (rulesModal) {
                rulesModal.style.display = 'none';
            }
        } catch (e) {
            console.error('隐藏规则失败:', e);
        }
    }
    
    // 特殊功能：快速获得令牌用于测试
    giveTestTokens() {
        this.strategicLayer.gameState.tokens.black = 5;
        this.strategicLayer.gameState.tokens.white = 5;
        this.strategicLayer.updateTokenDisplay();
        this.strategicLayer.updateGameMessage('测试模式：双方获得5个战术令牌');
    }
    
    // 召唤战术棋子
    summonTacticalPiece(pieceType) {
        // 安全检查
        if (!this.tacticalLayer || !this.tacticalLayer.showPieceSelection) {
            console.error('战术层不可用，无法召唤棋子');
            return;
        }
        
        // 调用战术层的棋子选择方法
        this.tacticalLayer.showPieceSelection();
    }
    
    // 检查游戏是否结束
    checkGameOver() {
        // 安全检查
        if (!this.strategicLayer || !this.strategicLayer.gameState || !this.strategicLayer.gameState.territory) {
            return false;
        }
        
        try {
            // 简化版胜利条件：当一方的领土达到150时获胜
            const territory = this.strategicLayer.gameState.territory;
            
            if (territory.black >= 150) {
                this.endGame('black');
                return true;
            } else if (territory.white >= 150) {
                this.endGame('white');
                return true;
            }
        } catch (e) {
            console.error('检查游戏结束条件失败:', e);
        }
        return false;
    }
    
    endGame(winner) {
        try {
            // 清除测试定时器
            if (this.testInterval) {
                clearInterval(this.testInterval);
                console.log('游戏结束，停止KataGo测试连接');
            }
            // 禁用游戏交互
            this.isGameOver = true;
            
            // 显示胜利消息
            if (this.strategicLayer) {
                this.strategicLayer.updateGameMessage(`${winner === 'black' ? '黑' : '白'}方获胜！游戏结束！`);
            }
            
            // 高亮获胜方
            const playerElement = document.getElementById(`player-${winner}`);
            if (playerElement) {
                playerElement.style.backgroundColor = '#4CAF50';
                playerElement.style.color = 'white';
            }
            
            // 显示胜利通知
            this.showNotification(`${winner === 'black' ? '黑' : '白'}方获胜！游戏结束！`);
        } catch (e) {
            console.error('游戏结束处理失败:', e);
        }
    }
    
    // 堡垒的特殊效果：阻止对方棋子通过
    isBlockedByFortress(row, col) {
        const stone = this.strategicBoard.getStoneAt(row, col);
        return stone && stone.classList.contains('fortress');
    }
    
    // 获取战略层当前状态的快照
    getStrategicSnapshot() {
        // 安全检查
        if (!this.strategicBoard || !this.strategicLayer || !this.strategicLayer.gameState) {
            return null;
        }
        
        try {
            const stones = [];
            // 检查stones是否存在且为数组
            if (Array.isArray(this.strategicBoard.stones)) {
                for (let stone of this.strategicBoard.stones) {
                    if (stone && stone.dataset && stone.classList) {
                        stones.push({
                            row: parseInt(stone.dataset.row),
                            col: parseInt(stone.dataset.col),
                            color: stone.classList.contains('black') ? 'black' : 'white',
                            type: stone.dataset.type
                        });
                    }
                }
            }
            
            return {
                stones,
                territory: this.strategicLayer.gameState.territory ? { ...this.strategicLayer.gameState.territory } : {},
                tokens: this.strategicLayer.gameState.tokens ? { ...this.strategicLayer.gameState.tokens } : {}
            };
        } catch (e) {
            console.error('获取战略层快照失败:', e);
            return null;
        }
    }
    
    // 从快照恢复战略层状态
    restoreStrategicSnapshot(snapshot) {
        // 安全检查
        if (!snapshot || !this.strategicBoard || !this.strategicLayer || !this.strategicLayer.gameState) {
            return;
        }
        
        try {
            // 清空棋盘
            if (Array.isArray(this.strategicBoard.stones)) {
                this.strategicBoard.stones.forEach(stone => {
                    if (stone) {
                        this.strategicBoard.removePiece(stone);
                    }
                });
                this.strategicBoard.stones = [];
            }
            
            // 恢复棋子
            if (Array.isArray(snapshot.stones)) {
                snapshot.stones.forEach(stoneData => {
                    if (stoneData && typeof stoneData.row === 'number' && typeof stoneData.col === 'number' && 
                        stoneData.color) {
                        this.strategicBoard.placeStone(
                            stoneData.row,
                            stoneData.col,
                            stoneData.color,
                            stoneData.type
                        );
                    }
                });
            }
            
            // 恢复领土和令牌
            if (snapshot.territory) {
                this.strategicLayer.gameState.territory = { ...snapshot.territory };
            }
            if (snapshot.tokens) {
                this.strategicLayer.gameState.tokens = { ...snapshot.tokens };
            }
            
            // 更新UI
            if (typeof this.strategicLayer.updateTokenDisplay === 'function') {
                this.strategicLayer.updateTokenDisplay();
            }
        } catch (e) {
            console.error('恢复战略层快照失败:', e);
        }
    }
    
    // 当战略层有重大变化时调用
    onStrategicChange() {
        // 游戏结束时不处理变化
        if (this.isGameOver) {
            return;
        }
        
        try {
            // 保存游戏状态
            this.saveGameState();
            
            // 检查游戏是否结束
            this.checkGameOver();
        } catch (e) {
            console.error('战略层变化处理失败:', e);
        }
    }
    
    // 当战术层战斗开始时调用
    onBattleStart() {
        try {
            // 临时冻结战略层操作
            if (this.strategicBoard && this.strategicBoard.container) {
                this.strategicBoard.container.style.pointerEvents = 'none';
                this.strategicBoard.container.style.opacity = '0.6';
            }
        } catch (e) {
            console.error('战斗开始处理失败:', e);
        }
    }
    
    // 当战术层战斗结束时调用
    onBattleEnd(winner) {
        try {
            // 恢复战略层操作
            if (this.strategicBoard && this.strategicBoard.container) {
                this.strategicBoard.container.style.pointerEvents = '';
                this.strategicBoard.container.style.opacity = '1';
            }
            
            // 记录战斗结果
            this.saveGameState();
            
            // 显示战斗结果通知
            this.showNotification(`${winner === 'black' ? '黑' : '白'}方获得战斗胜利！`);
        } catch (e) {
            console.error('战斗结束处理失败:', e);
        }
    }
}