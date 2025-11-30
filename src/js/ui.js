// UI组件系统
class UIComponents {
    constructor(game) {
        this.game = game;
        this.initializeComponents();
    }
    
    initializeComponents() {
        // 创建规则面板
        this.createRulesPanel();
        
        // 创建游戏信息面板
        this.createInfoPanel();
        
        // 创建操作按钮
        this.createActionButtons();
        
        // 创建选择菜单
        this.createSelectionMenus();
        
        // 创建加载和状态指示器
        this.createIndicators();
    }
    
    createRulesPanel() {
        const rulesPanel = document.createElement('div');
        rulesPanel.id = 'rules-panel';
        rulesPanel.classList.add('modal');
        rulesPanel.style.display = 'none';
        
        const content = document.createElement('div');
        content.classList.add('modal-content');
        
        const header = document.createElement('div');
        header.classList.add('modal-header');
        
        const title = document.createElement('h2');
        title.textContent = '游戏规则';
        
        const closeBtn = document.createElement('span');
        closeBtn.classList.add('close-button');
        closeBtn.textContent = '×';
        closeBtn.addEventListener('click', () => this.hideRulesPanel());
        
        header.appendChild(title);
        header.appendChild(closeBtn);
        
        const body = document.createElement('div');
        body.classList.add('modal-body');
        body.id = 'rules-content';
        
        content.appendChild(header);
        content.appendChild(body);
        rulesPanel.appendChild(content);
        
        // 添加背景遮罩点击关闭功能
        rulesPanel.addEventListener('click', (e) => {
            if (e.target === rulesPanel) {
                this.hideRulesPanel();
            }
        });
        
        document.body.appendChild(rulesPanel);
    }
    
    showRulesPanel() {
        const rulesPanel = document.getElementById('rules-panel');
        const rulesContent = document.getElementById('rules-content');
        
        // 调用rules.js中的规则生成函数
        if (window.generateRulesContent) {
            rulesContent.innerHTML = window.generateRulesContent();
        } else {
            rulesContent.innerHTML = '<p>规则内容加载中...</p>';
        }
        
        rulesPanel.style.display = 'block';
        
        // 添加动画效果
        setTimeout(() => {
            rulesPanel.querySelector('.modal-content').style.transform = 'translate(-50%, -50%) scale(1)';
        }, 10);
    }
    
    hideRulesPanel() {
        const rulesPanel = document.getElementById('rules-panel');
        rulesPanel.querySelector('.modal-content').style.transform = 'translate(-50%, -50%) scale(0.9)';
        
        setTimeout(() => {
            rulesPanel.style.display = 'none';
        }, 300);
    }
    
    createInfoPanel() {
        // 确保玩家信息区域已创建
        const playerInfoContainer = document.getElementById('player-info');
        
        // 使用HTML中已存在的回合指示器和战斗状态元素
        // 不再创建重复的战斗状态指示器
    }
    
    createActionButtons() {
        const controls = document.getElementById('game-controls');
        
        // 创建开始新游戏按钮
        const newGameBtn = document.createElement('button');
        newGameBtn.id = 'new-game';
        newGameBtn.classList.add('control-button');
        newGameBtn.textContent = '新游戏';
        newGameBtn.addEventListener('click', () => this.game.startNewGame());
        
        // 创建悔棋按钮
        const undoBtn = document.createElement('button');
        undoBtn.id = 'undo-move';
        undoBtn.classList.add('control-button');
        undoBtn.textContent = '悔棋';
        undoBtn.addEventListener('click', () => this.game.undoMove());
        
        // 创建显示规则按钮
        const showRulesBtn = document.createElement('button');
        showRulesBtn.id = 'show-rules';
        showRulesBtn.classList.add('control-button');
        showRulesBtn.textContent = '游戏规则';
        showRulesBtn.addEventListener('click', () => this.showRulesPanel());
        
        // 创建召唤棋子按钮
        const summonBtn = document.createElement('button');
        summonBtn.id = 'summon-piece';
        summonBtn.classList.add('control-button');
        summonBtn.classList.add('primary-button');
        summonBtn.textContent = '召唤棋子';
        summonBtn.addEventListener('click', () => this.showPieceSelectionMenu());
        
        // 将按钮添加到控制区域
        controls.appendChild(newGameBtn);
        controls.appendChild(undoBtn);
        controls.appendChild(showRulesBtn);
        controls.appendChild(summonBtn);
    }
    
    createSelectionMenus() {
        // 创建棋子选择菜单
        const pieceMenu = document.createElement('div');
        pieceMenu.id = 'piece-selection-menu';
        pieceMenu.classList.add('modal');
        pieceMenu.style.display = 'none';
        
        const content = document.createElement('div');
        content.classList.add('modal-content');
        content.style.width = '300px';
        
        const header = document.createElement('div');
        header.classList.add('modal-header');
        
        const title = document.createElement('h3');
        title.textContent = '选择棋子';
        
        const closeBtn = document.createElement('span');
        closeBtn.classList.add('close-button');
        closeBtn.textContent = '×';
        closeBtn.addEventListener('click', () => this.hidePieceSelectionMenu());
        
        header.appendChild(title);
        header.appendChild(closeBtn);
        
        const body = document.createElement('div');
        body.classList.add('modal-body');
        body.id = 'piece-options';
        
        // 添加棋子选项
        const pieces = [
            { type: '车', cost: 5, description: '强力直线攻击' },
            { type: '马', cost: 3, description: '灵活跳跃移动' },
            { type: '相', cost: 2, description: '守护战略位置' },
            { type: '士', cost: 1, description: '保护核心区域' },
            { type: '将', cost: 8, description: '核心指挥单位' },
            { type: '炮', cost: 4, description: '远程攻击单位' },
            { type: '卒', cost: 1, description: '基础作战单位' }
        ];
        
        pieces.forEach(piece => {
            const option = document.createElement('div');
            option.classList.add('piece-option');
            option.dataset.piece = piece.type;
            option.dataset.cost = piece.cost;
            
            option.innerHTML = `
                <span class="piece-name">${piece.type}</span>
                <span class="piece-cost">消耗: ${piece.cost} 令牌</span>
                <span class="piece-description">${piece.description}</span>
            `;
            
            option.addEventListener('click', () => {
                if (this.game.strategicLayer.gameState.tokens[this.game.strategicLayer.gameState.currentPlayer] >= piece.cost) {
                    this.game.summonTacticalPiece(piece.type);
                    this.hidePieceSelectionMenu();
                }
            });
            
            body.appendChild(option);
        });
        
        content.appendChild(header);
        content.appendChild(body);
        pieceMenu.appendChild(content);
        
        // 添加背景遮罩点击关闭功能
        pieceMenu.addEventListener('click', (e) => {
            if (e.target === pieceMenu) {
                this.hidePieceSelectionMenu();
            }
        });
        
        document.body.appendChild(pieceMenu);
    }
    
    showPieceSelectionMenu() {
        const menu = document.getElementById('piece-selection-menu');
        
        // 更新选项状态
        const options = menu.querySelectorAll('.piece-option');
        const currentPlayer = this.game.strategicLayer.gameState.currentPlayer;
        const tokens = this.game.strategicLayer.gameState.tokens[currentPlayer];
        
        options.forEach(option => {
            const cost = parseInt(option.dataset.cost);
            if (cost > tokens) {
                option.classList.add('disabled');
                option.style.cursor = 'not-allowed';
            } else {
                option.classList.remove('disabled');
                option.style.cursor = 'pointer';
            }
        });
        
        menu.style.display = 'block';
        
        // 添加动画效果
        setTimeout(() => {
            menu.querySelector('.modal-content').style.transform = 'translate(-50%, -50%) scale(1)';
        }, 10);
    }
    
    hidePieceSelectionMenu() {
        const menu = document.getElementById('piece-selection-menu');
        menu.querySelector('.modal-content').style.transform = 'translate(-50%, -50%) scale(0.9)';
        
        setTimeout(() => {
            menu.style.display = 'none';
        }, 300);
    }
    
    createIndicators() {
        // 创建加载指示器
        const loader = document.createElement('div');
        loader.id = 'loading-indicator';
        loader.classList.add('loading-indicator');
        loader.innerHTML = '<div class="spinner"></div><div class="loading-text">加载中...</div>';
        loader.style.display = 'none';
        
        document.body.appendChild(loader);
    }
    
    showLoading(show = true) {
        const loader = document.getElementById('loading-indicator');
        loader.style.display = show ? 'flex' : 'none';
    }
    
    // 更新当前玩家显示
    updateCurrentPlayerIndicator(player) {
        const indicator = document.getElementById('current-player');
        indicator.textContent = player === 'black' ? '黑方' : '白方';
        // 同时更新玩家标记颜色
        const marker = indicator.parentElement.querySelector('.player-marker');
        if (marker) {
            marker.className = player === 'black' ? 'player-marker black' : 'player-marker white';
        }
    }
    
    // 更新战斗状态显示
    updateBattleStatus(status) {
        const battleStatus = document.getElementById('battle-status');
        // 检查元素结构，如果有p标签则更新p标签内容，否则直接更新textContent
        const statusText = battleStatus.querySelector('p');
        if (statusText) {
            statusText.textContent = status;
        } else {
            battleStatus.textContent = `战斗状态: ${status}`;
        }
        
        // 根据状态设置样式
        battleStatus.className = 'battle-status';
        if (status.includes('进行')) {
            battleStatus.classList.add('active');
        } else if (status.includes('胜利')) {
            battleStatus.classList.add('victory');
        } else if (status.includes('失败')) {
            battleStatus.classList.add('defeat');
        }
    }
    
    // 显示游戏结束界面
    showGameOverScreen(winner) {
        const gameOverModal = document.createElement('div');
        gameOverModal.classList.add('modal');
        gameOverModal.classList.add('game-over');
        
        const content = document.createElement('div');
        content.classList.add('modal-content');
        content.style.width = '400px';
        
        const header = document.createElement('div');
        header.classList.add('modal-header');
        
        const title = document.createElement('h2');
        title.textContent = '游戏结束';
        
        header.appendChild(title);
        
        const body = document.createElement('div');
        body.classList.add('modal-body');
        body.classList.add('game-over-body');
        
        const winnerText = document.createElement('p');
        winnerText.classList.add('winner-text');
        winnerText.textContent = `${winner === 'black' ? '黑方' : '白方'} 获胜！`;
        
        const stats = document.createElement('div');
        stats.classList.add('game-stats');
        stats.innerHTML = `
            <div class="stat-item">
                <span>总落子数:</span>
                <span>${this.game.strategicLayer.gameState.moveCount}</span>
            </div>
            <div class="stat-item">
                <span>战术战斗次数:</span>
                <span>${this.game.tacticalLayer.gameState.battleCount}</span>
            </div>
            <div class="stat-item">
                <span>堡垒数量:</span>
                <span>${this.game.strategicLayer.gameState.fortressCount.black + this.game.strategicLayer.gameState.fortressCount.white}</span>
            </div>
        `;
        
        const buttons = document.createElement('div');
        buttons.classList.add('game-over-buttons');
        
        const newGameBtn = document.createElement('button');
        newGameBtn.classList.add('control-button');
        newGameBtn.classList.add('primary-button');
        newGameBtn.textContent = '新游戏';
        newGameBtn.addEventListener('click', () => {
            document.body.removeChild(gameOverModal);
            this.game.startNewGame();
        });
        
        const closeBtn = document.createElement('button');
        closeBtn.classList.add('control-button');
        closeBtn.textContent = '关闭';
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(gameOverModal);
        });
        
        buttons.appendChild(newGameBtn);
        buttons.appendChild(closeBtn);
        
        body.appendChild(winnerText);
        body.appendChild(stats);
        body.appendChild(buttons);
        
        content.appendChild(header);
        content.appendChild(body);
        gameOverModal.appendChild(content);
        
        document.body.appendChild(gameOverModal);
    }
    
    // 更新UI以反映堡垒放置模式
    updateFortressPlacementMode(active) {
        const summonBtn = document.getElementById('summon-piece');
        const statusText = document.getElementById('battle-status');
        
        if (active) {
            summonBtn.disabled = true;
            statusText.textContent = '放置堡垒模式';
            statusText.classList.add('fortress-mode');
            
            // 可以在这里添加视觉提示，比如棋盘边框变色
            this.game.strategicBoard.container.classList.add('fortress-mode');
        } else {
            summonBtn.disabled = this.game.strategicLayer.gameState.tokens[this.game.strategicLayer.gameState.currentPlayer] <= 0;
            statusText.classList.remove('fortress-mode');
            this.game.strategicBoard.container.classList.remove('fortress-mode');
        }
    }
    
    // 高亮显示资源点
    highlightResourcePoints(points) {
        // 先清除现有的高亮
        this.clearResourcePointHighlights();
        
        // 为每个资源点添加高亮
        points.forEach(point => {
            const highlight = document.createElement('div');
            highlight.classList.add('resource-point-highlight');
            highlight.style.position = 'absolute';
            highlight.style.left = `${point.col * this.game.strategicBoard.cellSize + this.game.strategicBoard.cellSize / 2 - 10}px`;
            highlight.style.top = `${point.row * this.game.strategicBoard.cellSize + this.game.strategicBoard.cellSize / 2 - 10}px`;
            highlight.style.width = '20px';
            highlight.style.height = '20px';
            highlight.style.borderRadius = '50%';
            highlight.style.backgroundColor = 'rgba(255, 215, 0, 0.6)';
            highlight.style.zIndex = '10';
            highlight.style.animation = 'pulse 2s infinite';
            
            this.game.strategicBoard.container.appendChild(highlight);
        });
    }
    
    clearResourcePointHighlights() {
        const highlights = this.game.strategicBoard.container.querySelectorAll('.resource-point-highlight');
        highlights.forEach(highlight => highlight.remove());
    }
}