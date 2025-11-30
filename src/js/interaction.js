// 用户交互系统
class InteractionSystem {
    constructor(game) {
        this.game = game;
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // 为战略层棋盘添加更精确的点击处理
        this.setupStrategicBoardListeners();
        
        // 为战术层棋盘添加拖拽支持（可选）
        this.setupTacticalBoardListeners();
        
        // 为按钮添加键盘快捷键
        this.setupKeyboardShortcuts();
    }
    
    setupStrategicBoardListeners() {
        const board = this.game.strategicBoard.container;
        
        // 鼠标悬停效果
        board.addEventListener('mousemove', (e) => this.handleStrategicBoardHover(e));
        
        // 鼠标离开时移除预览
        board.addEventListener('mouseleave', () => this.removeStonePreview());
        
        // 右键菜单（用于快速操作）
        board.addEventListener('contextmenu', (e) => this.handleRightClick(e));
    }
    
    handleStrategicBoardHover(e) {
        // 计算鼠标位置对应的棋盘坐标
        const rect = this.game.strategicBoard.container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // 计算最近的交叉点坐标，使用Math.floor将鼠标位置映射到交叉点
        const col = Math.floor(x / this.game.strategicBoard.cellSize);
        const row = Math.floor(y / this.game.strategicBoard.cellSize);
        
        // 检查坐标是否在棋盘范围内
        if (row >= 0 && row < this.game.strategicBoard.rows && col >= 0 && col < this.game.strategicBoard.cols) {
            // 显示落子预览
            this.showStonePreview(row, col);
        } else {
            this.removeStonePreview();
        }
    }
    
    showStonePreview(row, col) {
        // 移除现有的预览
        this.removeStonePreview();
        
        // 检查该位置是否已有棋子
        if (this.game.strategicBoard.getStoneAt(row, col)) {
            return;
        }
        
        // 创建预览棋子
        const preview = document.createElement('div');
        preview.classList.add('stone');
        preview.classList.add('preview');
        preview.classList.add(this.game.strategicLayer.gameState.currentPlayer);
        preview.style.opacity = '0.5';
        
        // 设置位置 - 显示在交叉点上
        const cellSize = this.game.strategicBoard.cellSize;
        preview.style.position = 'absolute';
        preview.style.left = `${col * cellSize - 15}px`;
        preview.style.top = `${row * cellSize - 15}px`;
        preview.style.width = '30px';
        preview.style.height = '30px';
        preview.style.borderRadius = '50%';
        preview.style.pointerEvents = 'none';
        
        // 添加到容器
        this.game.strategicBoard.container.appendChild(preview);
        this.currentPreview = preview;
    }
    
    removeStonePreview() {
        if (this.currentPreview && this.currentPreview.parentNode) {
            this.currentPreview.parentNode.removeChild(this.currentPreview);
            this.currentPreview = null;
        }
    }
    
    handleRightClick(e) {
        e.preventDefault();
        
        // 可以在这里添加右键菜单功能，比如悔棋、标记等
        console.log('右键点击战略层棋盘');
    }
    
    setupTacticalBoardListeners() {
        const board = this.game.tacticalBoard.container;
        
        // 鼠标悬停在棋子上的效果
        board.addEventListener('mouseover', (e) => {
            const piece = e.target.closest('.tactical-piece');
            if (piece) {
                this.highlightPiece(piece);
            }
        });
        
        board.addEventListener('mouseout', (e) => {
            const piece = e.target.closest('.tactical-piece');
            if (piece) {
                this.unhighlightPiece(piece);
            }
        });
    }
    
    highlightPiece(piece) {
        if (!this.game.tacticalLayer.gameState.selectedPiece) {
            piece.style.transform = 'scale(1.1)';
            piece.style.transition = 'transform 0.2s';
        }
    }
    
    unhighlightPiece(piece) {
        if (!this.game.tacticalLayer.gameState.selectedPiece) {
            piece.style.transform = 'scale(1)';
        }
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // 新游戏
            if (e.key === 'n' && e.ctrlKey) {
                e.preventDefault();
                this.game.startNewGame();
            }
            
            // 悔棋
            if (e.key === 'z' && e.ctrlKey) {
                e.preventDefault();
                this.game.undoMove();
            }
            
            // 显示规则
            if (e.key === 'r' && e.ctrlKey) {
                e.preventDefault();
                this.game.showRules();
            }
            
            // 测试模式：快速获得令牌
            if (e.key === 't' && e.ctrlKey && e.altKey) {
                e.preventDefault();
                this.game.giveTestTokens();
            }
        });
    }
    
    // 显示通知消息
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.classList.add('notification');
        notification.classList.add(type);
        notification.textContent = message;
        
        // 设置样式
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.padding = '10px 20px';
        notification.style.backgroundColor = type === 'error' ? '#f44336' : '#4CAF50';
        notification.style.color = 'white';
        notification.style.borderRadius = '4px';
        notification.style.zIndex = '10000';
        notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        
        if (document.body) {
            document.body.appendChild(notification);
        } else {
            console.error('document.body 不可用，无法显示通知');
            // 降级方案：使用alert
            alert(message);
        }
        
        // 自动消失
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.5s';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 500);
        }, 3000);
    }
    
    // 更新游戏状态显示
    updateGameStatus() {
        // 更新当前玩家指示
        document.querySelectorAll('.player').forEach(playerEl => {
            playerEl.classList.remove('current');
        });
        document.getElementById(`player-${this.game.strategicLayer.gameState.currentPlayer}`).classList.add('current');
        
        // 更新令牌显示
        document.getElementById('black-tokens').textContent = this.game.strategicLayer.gameState.tokens.black;
        document.getElementById('white-tokens').textContent = this.game.strategicLayer.gameState.tokens.white;
        
        // 更新战斗状态按钮
        const summonButton = document.getElementById('summon-piece');
        const currentPlayer = this.game.strategicLayer.gameState.currentPlayer;
        const hasTokens = this.game.strategicLayer.gameState.tokens[currentPlayer] > 0;
        const battleActive = this.game.tacticalLayer.gameState.battleActive;
        
        summonButton.disabled = battleActive || !hasTokens || this.game.isFortressPlacementMode;
    }
    
    // 处理触摸事件（移动端支持）
    setupTouchEvents() {
        // 战略层触摸支持
        this.game.strategicBoard.container.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handleTouch(touch, this.game.strategicBoard);
        });
        
        // 战术层触摸支持
        this.game.tacticalBoard.container.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handleTouch(touch, this.game.tacticalBoard);
        });
    }
    
    handleTouch(touch, board) {
        const rect = board.container.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        const col = Math.round(x / board.cellSize);
        const row = Math.round(y / board.cellSize);
        
        // 触发点击事件
        const clickEvent = new MouseEvent('click', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        board.container.dispatchEvent(clickEvent);
    }
    
    // 调整棋盘大小以适应屏幕
    adjustBoardSize() {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // 对于小屏幕，缩小棋盘
        if (windowWidth < 768) {
            // 调整战略层棋盘
            const strategicSize = Math.min(windowWidth - 40, 400);
            this.game.strategicBoard.container.style.width = `${strategicSize}px`;
            this.game.strategicBoard.container.style.height = `${strategicSize}px`;
            
            // 调整战术层棋盘
            const tacticalSize = Math.min(windowWidth - 40, 300);
            this.game.tacticalBoard.container.style.width = `${tacticalSize}px`;
            this.game.tacticalBoard.container.style.height = `${tacticalSize}px`;
        } else {
            // 恢复默认大小
            this.game.strategicBoard.container.style.width = '';
            this.game.strategicBoard.container.style.height = '';
            this.game.tacticalBoard.container.style.width = '';
            this.game.tacticalBoard.container.style.height = '';
        }
    }
    
    // 初始化响应式设计
    initResponsiveDesign() {
        // 初始调整
        this.adjustBoardSize();
        
        // 窗口大小改变时重新调整
        window.addEventListener('resize', () => this.adjustBoardSize());
    }
}