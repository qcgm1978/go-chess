// 棋盘基础类
class Board {
    constructor(containerId, rows, cols, cellSize) {
        this.container = document.getElementById(containerId);
        this.rows = rows;
        this.cols = cols;
        this.cellSize = cellSize;
        this.cells = [];
        this.setupBoard();
    }
    
    setupBoard() {
        this.container.style.width = `${this.cols * this.cellSize}px`;
        this.container.style.height = `${this.rows * this.cellSize}px`;
        this.container.innerHTML = '';
        
        // 创建格子数据结构
        this.cells = Array(this.rows).fill().map(() => Array(this.cols).fill(null));
        
        this.drawGrid();
    }
    
    drawGrid() {
        // 绘制网格线
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                const cell = document.createElement('div');
                cell.style.position = 'absolute';
                cell.style.left = `${j * this.cellSize}px`;
                cell.style.top = `${i * this.cellSize}px`;
                cell.style.width = `${this.cellSize}px`;
                cell.style.height = `${this.cellSize}px`;
                cell.dataset.row = i;
                cell.dataset.col = j;
                
                this.container.appendChild(cell);
                this.cells[i][j] = cell;
            }
        }
    }
    
    getCell(row, col) {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            return this.cells[row][col];
        }
        return null;
    }
    
    addPiece(piece, row, col) {
        piece.style.position = 'absolute';
        // 修改为显示在交叉点上，与预览位置保持一致
        // 假设棋子尺寸是30x30，与预览棋子保持一致
        piece.style.left = `${col * this.cellSize - 15}px`;
        piece.style.top = `${row * this.cellSize - 15}px`;
        piece.dataset.row = row;
        piece.dataset.col = col;
        this.container.appendChild(piece);
    }
    
    removePiece(piece) {
        if (piece.parentNode === this.container) {
            this.container.removeChild(piece);
        }
    }
    
    movePiece(piece, row, col) {
        piece.style.left = `${col * this.cellSize + this.cellSize / 2 - piece.offsetWidth / 2}px`;
        piece.style.top = `${row * this.cellSize + this.cellSize / 2 - piece.offsetHeight / 2}px`;
        piece.dataset.row = row;
        piece.dataset.col = col;
    }
}

// 战略层棋盘（围棋棋盘）
class StrategicBoard extends Board {
    constructor() {
        // 19x19围棋棋盘，每个格子30px
        super('strategic-board', 19, 19, 30);
        this.stones = [];
    }
    
    setupBoard() {
        super.setupBoard();
        this.drawGridLines();
        this.drawIntersectionPoints();
    }
    
    drawGridLines() {
        // 绘制网格线
        for (let i = 0; i < this.rows; i++) {
            const line = document.createElement('div');
            line.style.position = 'absolute';
            line.style.left = '0';
            line.style.top = `${i * this.cellSize}px`;
            line.style.width = '100%';
            line.style.height = '1px';
            line.style.backgroundColor = '#8B4513';
            this.container.appendChild(line);
        }
        
        for (let j = 0; j < this.cols; j++) {
            const line = document.createElement('div');
            line.style.position = 'absolute';
            line.style.left = `${j * this.cellSize}px`;
            line.style.top = '0';
            line.style.width = '1px';
            line.style.height = '100%';
            line.style.backgroundColor = '#8B4513';
            this.container.appendChild(line);
        }
    }
    
    drawIntersectionPoints() {
        // 绘制天元和星位点
        const points = [
            [3, 3], [3, 9], [3, 15],
            [9, 3], [9, 9], [9, 15],
            [15, 3], [15, 9], [15, 15]
        ];
        
        points.forEach(([row, col]) => {
            const dot = document.createElement('div');
            dot.style.position = 'absolute';
            dot.style.left = `${col * this.cellSize - 3}px`;
            dot.style.top = `${row * this.cellSize - 3}px`;
            dot.style.width = '6px';
            dot.style.height = '6px';
            dot.style.borderRadius = '50%';
            dot.style.backgroundColor = '#8B4513';
            this.container.appendChild(dot);
        });
    }
    
    placeStone(row, col, color, type = 'normal') {
        // 检查位置是否已有棋子
        for (let stone of this.stones) {
            if (parseInt(stone.dataset.row) === row && parseInt(stone.dataset.col) === col) {
                return false;
            }
        }
        
        const stone = document.createElement('div');
        stone.classList.add('stone');
        stone.classList.add(color);
        if (type === 'fortress') {
            stone.classList.add('fortress');
        }
        stone.dataset.type = type;
        
        this.addPiece(stone, row, col);
        this.stones.push(stone);
        return true;
    }
    
    removeStone(row, col) {
        for (let i = 0; i < this.stones.length; i++) {
            const stone = this.stones[i];
            if (parseInt(stone.dataset.row) === row && parseInt(stone.dataset.col) === col) {
                this.removePiece(stone);
                this.stones.splice(i, 1);
                return true;
            }
        }
        return false;
    }
    
    getStoneAt(row, col) {
        for (let stone of this.stones) {
            if (parseInt(stone.dataset.row) === row && parseInt(stone.dataset.col) === col) {
                return stone;
            }
        }
        return null;
    }
}

// 战术层棋盘（象棋棋盘）
class TacticalBoard extends Board {
    constructor() {
        // 9x10象棋棋盘，每个格子40px
        super('tactical-board', 10, 9, 40);
        this.pieces = [];
    }
    
    setupBoard() {
        super.setupBoard();
        this.drawChessboardPattern();
        this.drawRiver();
    }
    
    drawChessboardPattern() {
        // 绘制棋盘格子
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                const cell = document.createElement('div');
                cell.style.position = 'absolute';
                cell.style.left = `${j * this.cellSize}px`;
                cell.style.top = `${i * this.cellSize}px`;
                cell.style.width = `${this.cellSize}px`;
                cell.style.height = `${this.cellSize}px`;
                cell.style.border = '1px solid #8B4513';
                cell.dataset.row = i;
                cell.dataset.col = j;
                this.container.appendChild(cell);
            }
        }
        
        // 绘制九宫格斜线
        this.drawDiagonal(0, 3, 2, 5);
        this.drawDiagonal(0, 5, 2, 3);
        this.drawDiagonal(8, 3, 10, 5);
        this.drawDiagonal(8, 5, 10, 3);
    }
    
    drawDiagonal(row1, col1, row2, col2) {
        const line = document.createElement('div');
        line.style.position = 'absolute';
        line.style.backgroundColor = '#8B4513';
        line.style.height = '1px';
        
        // 计算斜线的长度和角度
        const dx = (col2 - col1) * this.cellSize;
        const dy = (row2 - row1) * this.cellSize;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        
        // 设置线的位置和尺寸
        line.style.width = `${length}px`;
        line.style.left = `${col1 * this.cellSize}px`;
        line.style.top = `${row1 * this.cellSize + 0.5}px`; // +0.5px使线居中
        line.style.transform = `rotate(${angle}deg)`;
        line.style.transformOrigin = 'left top';
        
        this.container.appendChild(line);
    }
    
    drawRiver() {
        const river = document.createElement('div');
        river.style.position = 'absolute';
        river.style.left = '0';
        river.style.top = `${4.5 * this.cellSize}px`;
        river.style.width = '100%';
        river.style.height = `${this.cellSize}px`;
        river.style.display = 'flex';
        river.style.alignItems = 'center';
        river.style.justifyContent = 'center';
        river.style.color = '#8B4513';
        river.style.fontWeight = 'bold';
        river.textContent = '楚河              汉界';
        this.container.appendChild(river);
    }
    
    placePiece(row, col, color, pieceType) {
        // 检查位置是否已有棋子
        for (let piece of this.pieces) {
            if (parseInt(piece.dataset.row) === row && parseInt(piece.dataset.col) === col) {
                return false;
            }
        }
        
        const piece = document.createElement('div');
        piece.classList.add('tactical-piece');
        piece.classList.add(color);
        piece.dataset.type = pieceType;
        piece.textContent = this.getPieceSymbol(pieceType);
        
        this.addPiece(piece, row, col);
        this.pieces.push(piece);
        return true;
    }
    
    getPieceSymbol(pieceType) {
        const symbols = {
            'rook': '车',
            'horse': '马',
            'elephant': '相',
            'advisor': '士',
            'general': '将',
            'cannon': '炮',
            'soldier': '卒'
        };
        return symbols[pieceType] || pieceType;
    }
    
    removePieceAt(row, col) {
        for (let i = 0; i < this.pieces.length; i++) {
            const piece = this.pieces[i];
            if (parseInt(piece.dataset.row) === row && parseInt(piece.dataset.col) === col) {
                this.removePiece(piece);
                this.pieces.splice(i, 1);
                return true;
            }
        }
        return false;
    }
    
    getPieceAt(row, col) {
        for (let piece of this.pieces) {
            if (parseInt(piece.dataset.row) === row && parseInt(piece.dataset.col) === col) {
                return piece;
            }
        }
        return null;
    }
    
    clear() {
        while (this.pieces.length > 0) {
            this.removePiece(this.pieces[0]);
            this.pieces.shift();
        }
    }
}