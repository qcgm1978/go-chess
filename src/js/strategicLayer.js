// 战略层游戏逻辑
class StrategicLayer {
    constructor(board) {
        this.board = board;
        this.gameState = {
            currentPlayer: 'black',
            territory: {
                black: 0,
                white: 0
            },
            tokens: {
                black: 0,
                white: 0
            },
            lastMove: null,
            moveHistory: []
        };
        this.setupEventListeners();
        this.updateGameMessage('黑方先行，请在战略层落子');
    }
    
    setupEventListeners() {
        this.board.container.addEventListener('click', (e) => this.handleBoardClick(e));
    }
    
    handleBoardClick(e) {
        // 计算点击位置对应的棋盘坐标
        const rect = this.board.container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // 使用Math.floor将点击位置映射到交叉点，与预览计算保持一致
        const col = Math.floor(x / this.board.cellSize);
        const row = Math.floor(y / this.board.cellSize);
        
        // 检查坐标是否在棋盘范围内
        if (row >= 0 && row < this.board.rows && col >= 0 && col < this.board.cols) {
            this.placeStone(row, col);
        }
    }
    
    placeStone(row, col) {
        // 检查是否可以落子
        if (!this.canPlaceStone(row, col)) {
            return;
        }
        
        // 落子
        const success = this.board.placeStone(row, col, this.gameState.currentPlayer);
        if (!success) {
            return;
        }
        
        // 记录移动历史
        this.gameState.lastMove = {row, col, player: this.gameState.currentPlayer};
        this.gameState.moveHistory.push({...this.gameState.lastMove});
        
        // 检查并提走没有气的对方棋子
        const capturedStones = this.captureStones(row, col);
        
        // 更新提子数量统计
        if (capturedStones > 0) {
            this.updateCapturedStones(capturedStones, this.gameState.currentPlayer);
        }
        
        // 检查是否自杀（如果新落的棋子没有气，且没有提走对方棋子，则不允许）
        if (capturedStones === 0 && !this.hasLiberty(row, col)) {
            // 撤销落子
            this.board.removeStone(row, col);
            this.gameState.moveHistory.pop();
            this.gameState.lastMove = this.gameState.moveHistory[this.gameState.moveHistory.length - 1] || null;
            this.updateGameMessage('自杀招法，不允许落子');
            return;
        }
        
        // 更新领土计算
        this.updateTerritory();
        
        // 检查是否获得战术令牌
        this.checkTokenEarn();
        
        // 尝试通过Katago获取领土估计（异步，不阻塞主逻辑）
        this.estimateTerritoryWithKatago();
        
        // 切换当前玩家
        this.switchPlayer();
        
        // 更新UI
        this.updateTokenDisplay();
    }
    
    // 使用Katago估计领土
    async estimateTerritoryWithKatago() {
        try {
            // 检查游戏实例是否存在且有Katago接口
            if (window.game && window.game.getTerritoryEstimateFromKatago) {
                await window.game.getTerritoryEstimateFromKatago();
            }
        } catch (error) {
            console.error('Katago领土估计失败:', error);
        }
    }
    
    canPlaceStone(row, col) {
        // 检查位置是否已有棋子
        if (this.board.getStoneAt(row, col)) {
            return false;
        }
        
        // 检查是否是禁着点（暂时简化，不考虑打劫）
        return true;
    }
    
    captureStones(row, col) {
        let capturedCount = 0;
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        const oppositeColor = this.gameState.currentPlayer === 'black' ? 'white' : 'black';
        
        // 检查周围四个方向的对方棋子组
        for (let [dr, dc] of directions) {
            const adjRow = row + dr;
            const adjCol = col + dc;
            const adjStone = this.board.getStoneAt(adjRow, adjCol);
            
            if (adjStone && adjStone.classList.contains(oppositeColor)) {
                const group = this.findGroup(adjRow, adjCol);
                if (!this.groupHasLiberty(group)) {
                    // 提走没有气的棋子组
                    for (let [r, c] of group) {
                        this.board.removeStone(r, c);
                        capturedCount++;
                    }
                }
            }
        }
        
        return capturedCount;
    }
    
    findGroup(row, col) {
        const stone = this.board.getStoneAt(row, col);
        if (!stone) {
            return [];
        }
        
        const color = stone.classList.contains('black') ? 'black' : 'white';
        const group = [];
        const visited = new Set();
        const queue = [[row, col]];
        visited.add(`${row},${col}`);
        
        while (queue.length > 0) {
            const [r, c] = queue.shift();
            group.push([r, c]);
            
            const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            for (let [dr, dc] of directions) {
                const nr = r + dr;
                const nc = c + dc;
                const key = `${nr},${nc}`;
                
                if (nr >= 0 && nr < this.board.rows && nc >= 0 && nc < this.board.cols && !visited.has(key)) {
                    const adjStone = this.board.getStoneAt(nr, nc);
                    if (adjStone && adjStone.classList.contains(color)) {
                        queue.push([nr, nc]);
                        visited.add(key);
                    }
                }
            }
        }
        
        return group;
    }
    
    hasLiberty(row, col) {
        const group = this.findGroup(row, col);
        return this.groupHasLiberty(group);
    }
    
    groupHasLiberty(group) {
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        
        for (let [r, c] of group) {
            for (let [dr, dc] of directions) {
                const nr = r + dr;
                const nc = c + dc;
                
                if (nr >= 0 && nr < this.board.rows && nc >= 0 && nc < this.board.cols) {
                    if (!this.board.getStoneAt(nr, nc)) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
    
    // 设置Katago接口引用
    setKatagoInterface(katagoInterface) {
        this.katagoInterface = katagoInterface;
    }
    
    // 准备发送给Katago的棋盘状态
    prepareBoardStateForKatago() {
        const stones = this.board.getAllStones();
        const moves = [];
        
        stones.forEach(stone => {
            if (stone) {
                // 转换坐标为围棋坐标格式（如Q16）
                const letter = String.fromCharCode(65 + stone.col);
                const number = 19 - stone.row;
                
                moves.push({
                    player: stone.color,
                    coord: letter + number
                });
            }
        });
        
        return {
            currentPlayer: this.gameState.currentPlayer,
            moves: moves,
            boardSize: 19
        };
    }
    
    // 使用Katago接口更新领地数据
    async updateTerritoryWithKatago() {
        if (this.katagoInterface) {
            try {
                const boardState = this.prepareBoardStateForKatago();
                const estimate = await this.katagoInterface.getTerritoryEstimate(boardState);
                
                if (estimate) {
                    console.log('使用Katago更新领地数据:', estimate);
                    this.gameState.territory.black = estimate.black || 0;
                    this.gameState.territory.white = estimate.white || 0;
                    
                    // 调用令牌计算逻辑
                    this.checkTokenEarn();
                    // 更新UI显示令牌数量
                    this.updateTokenDisplay();
                    
                    return true;
                }
            } catch (error) {
                console.error('使用Katago更新领地失败:', error);
            }
        }
        
        // 如果Katago更新失败，回退到本地计算
        this.updateTerritoryLocal();
        // 本地计算后也更新令牌显示
        this.checkTokenEarn();
        this.updateTokenDisplay();
        return false;
    }
    
    // 本地简化的领土计算（作为回退方案）
    updateTerritoryLocal() {
        const visited = new Set();
        let blackTerritory = 0;
        let whiteTerritory = 0;
        
        for (let i = 0; i < this.board.rows; i++) {
            for (let j = 0; j < this.board.cols; j++) {
                const key = `${i},${j}`;
                if (!this.board.getStoneAt(i, j) && !visited.has(key)) {
                    const territoryInfo = this.analyzeTerritory(i, j, visited);
                    if (territoryInfo.owner === 'black') {
                        blackTerritory += territoryInfo.size;
                    } else if (territoryInfo.owner === 'white') {
                        whiteTerritory += territoryInfo.size;
                    }
                }
            }
        }
        
        this.gameState.territory.black = blackTerritory;
        this.gameState.territory.white = whiteTerritory;
    }
    
    // 公共接口方法，优先使用Katago
    updateTerritory() {
        // 异步调用Katago更新领地
        this.updateTerritoryWithKatago();
    }
    
    analyzeTerritory(row, col, visited) {
        const queue = [[row, col]];
        visited.add(`${row},${col}`);
        const borders = new Set();
        let size = 0;
        
        while (queue.length > 0) {
            const [r, c] = queue.shift();
            size++;
            
            const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            for (let [dr, dc] of directions) {
                const nr = r + dr;
                const nc = c + dc;
                const key = `${nr},${nc}`;
                
                if (nr >= 0 && nr < this.board.rows && nc >= 0 && nc < this.board.cols) {
                    if (!visited.has(key)) {
                        const stone = this.board.getStoneAt(nr, nc);
                        if (!stone) {
                            queue.push([nr, nc]);
                            visited.add(key);
                        } else {
                            if (stone.classList.contains('black')) {
                                borders.add('black');
                            } else if (stone.classList.contains('white')) {
                                borders.add('white');
                            }
                        }
                    }
                }
            }
        }
        
        // 确定领地归属
        let owner = null;
        if (borders.size === 1) {
            owner = borders.values().next().value;
        }
        
        return { size, owner };
    }
    
    checkTokenEarn() {
        // 初始化提子数量统计
        if (!this.gameState.capturedStones) {
            this.gameState.capturedStones = {
                black: 0,
                white: 0
            };
        }
        
        // 计算领地奖励的令牌数（每8个领地获得一个令牌，提高获取频率）
        const territoryTokensBlack = Math.floor(this.gameState.territory.black / 8);
        const territoryTokensWhite = Math.floor(this.gameState.territory.white / 8);
        
        // 计算提子奖励的令牌数（每提走5个对方棋子获得一个令牌）
        const captureTokensBlack = Math.floor(this.gameState.capturedStones.black / 5);
        const captureTokensWhite = Math.floor(this.gameState.capturedStones.white / 5);
        
        // 检查棋盘中心位置的特殊奖励（如果有棋子在中心位置，额外获得1个令牌）
        const centerBonusBlack = this.hasStoneAtCenter('black') ? 1 : 0;
        const centerBonusWhite = this.hasStoneAtCenter('white') ? 1 : 0;
        
        // 计算总令牌数
        const totalTokensBlack = territoryTokensBlack + captureTokensBlack + centerBonusBlack;
        const totalTokensWhite = territoryTokensWhite + captureTokensWhite + centerBonusWhite;
        
        // 更新令牌并显示消息
        if (totalTokensBlack > this.gameState.tokens.black) {
            this.gameState.tokens.black = totalTokensBlack;
            this.updateGameMessage('黑方获得战术令牌！');
        }
        
        if (totalTokensWhite > this.gameState.tokens.white) {
            this.gameState.tokens.white = totalTokensWhite;
            this.updateGameMessage('白方获得战术令牌！');
        }
    }
    
    // 检查是否有棋子在中心位置
    hasStoneAtCenter(playerColor) {
        const centerRow = Math.floor(this.board.rows / 2);
        const centerCol = Math.floor(this.board.cols / 2);
        const centerStone = this.board.getStoneAt(centerRow, centerCol);
        return centerStone && centerStone.classList.contains(playerColor);
    }
    
    // 更新提子数量统计
    updateCapturedStones(count, playerColor) {
        if (!this.gameState.capturedStones) {
            this.gameState.capturedStones = {
                black: 0,
                white: 0
            };
        }
        
        // 记录提走的对方棋子数量
        const oppositeColor = playerColor === 'black' ? 'white' : 'black';
        this.gameState.capturedStones[oppositeColor] += count;
    }
    
    placeFortress(row, col, player) {
        // 放置堡垒
        const success = this.board.placeStone(row, col, player, 'fortress');
        if (success) {
            // 堡垒不能被提走，所以不需要考虑气
            this.updateTerritory();
            return true;
        }
        return false;
    }
    
    useToken(player) {
        if (this.gameState.tokens[player] > 0) {
            this.gameState.tokens[player]--;
            this.updateTokenDisplay();
            return true;
        }
        return false;
    }
    
    getTokens(player) {
        return this.gameState.tokens[player];
    }
    
    switchPlayer() {
        this.gameState.currentPlayer = this.gameState.currentPlayer === 'black' ? 'white' : 'black';
        this.updatePlayerDisplay();
        this.updateGameMessage(`${this.gameState.currentPlayer === 'black' ? '黑' : '白'}方回合，请在战略层落子`);
    }
    
    updatePlayerDisplay() {
        document.getElementById('player-black').classList.remove('current');
        document.getElementById('player-white').classList.remove('current');
        document.getElementById(`player-${this.gameState.currentPlayer}`).classList.add('current');
    }
    
    updateTokenDisplay() {
        document.getElementById('black-tokens').textContent = this.gameState.tokens.black;
        document.getElementById('white-tokens').textContent = this.gameState.tokens.white;
    }
    
    updateGameMessage(message) {
        document.getElementById('game-message').textContent = message;
    }
    
    undo() {
        if (this.gameState.moveHistory.length > 0) {
            const lastMove = this.gameState.moveHistory.pop();
            this.board.removeStone(lastMove.row, lastMove.col);
            this.gameState.lastMove = this.gameState.moveHistory[this.gameState.moveHistory.length - 1] || null;
            this.gameState.currentPlayer = lastMove.player; // 撤销后还是原玩家回合
            this.updateTerritory();
            
            // 重置提子统计（简化处理，实际应该记录每次提子的历史）
            if (this.gameState.capturedStones) {
                this.gameState.capturedStones = { black: 0, white: 0 };
            }
            
            // 重新计算令牌
            this.checkTokenEarn();
            this.updateTokenDisplay();
            this.updatePlayerDisplay();
            return true;
        }
        return false;
    }
    
    reset() {
        // 清空棋盘
        for (let i = 0; i < this.board.rows; i++) {
            for (let j = 0; j < this.board.cols; j++) {
                this.board.removeStone(i, j);
            }
        }
        
        // 重置游戏状态
        this.gameState.currentPlayer = 'black';
        this.gameState.territory = { black: 0, white: 0 };
        this.gameState.tokens = { black: 0, white: 0 };
        this.gameState.capturedStones = { black: 0, white: 0 };
        this.gameState.lastMove = null;
        this.gameState.moveHistory = [];
        
        // 更新UI
        this.updatePlayerDisplay();
        this.updateTokenDisplay();
        this.updateGameMessage('黑方先行，请在战略层落子');
    }
}